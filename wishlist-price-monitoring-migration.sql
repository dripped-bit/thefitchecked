-- Wishlist Price Monitoring Migration
-- Run this in your Supabase SQL Editor to add price drop alerts functionality
-- This enables Claude AI-powered price tracking and monitoring

-- ==============================================
-- PART 1: Price History Table
-- ==============================================

-- Create price history table to track price changes over time
CREATE TABLE IF NOT EXISTS wishlist_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_item_id UUID REFERENCES wishlist_items(id) ON DELETE CASCADE,
  
  -- Price data
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  discount_percentage INTEGER,
  discount_text TEXT,
  
  -- Stock and availability
  in_stock BOOLEAN DEFAULT true,
  stock_level TEXT, -- 'in_stock', 'low_stock', 'out_of_stock'
  sale_ends TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'claude_scrape', -- claude_scrape, manual, api
  raw_data JSONB, -- Store full scraped data for debugging
  
  -- Shipping info
  shipping_info TEXT
);

-- Indexes for price history queries
CREATE INDEX IF NOT EXISTS idx_price_history_item_date 
ON wishlist_price_history(wishlist_item_id, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_sale_ends 
ON wishlist_price_history(sale_ends) 
WHERE sale_ends IS NOT NULL AND sale_ends > NOW();

-- ==============================================
-- PART 2: Update Wishlist Items Table
-- ==============================================

-- Add price monitoring columns to wishlist_items
ALTER TABLE wishlist_items
ADD COLUMN IF NOT EXISTS price_numeric NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS last_price_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS price_monitoring_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS target_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS lowest_price_seen NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS current_stock_status TEXT DEFAULT 'in_stock',
ADD COLUMN IF NOT EXISTS has_active_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sale_ends_at TIMESTAMP WITH TIME ZONE;

-- Create function to extract numeric price from text
CREATE OR REPLACE FUNCTION extract_price_numeric(price_text TEXT)
RETURNS NUMERIC AS $$
BEGIN
  -- Remove currency symbols and extract number
  -- Handles formats like: "$125.99", "125.99", "USD 125.99", "€125,99"
  RETURN CAST(
    regexp_replace(
      regexp_replace(price_text, '[^0-9.,]', '', 'g'),
      ',', '.', 'g'
    ) AS NUMERIC
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Backfill numeric prices for existing items
UPDATE wishlist_items
SET price_numeric = extract_price_numeric(price)
WHERE price_numeric IS NULL AND price IS NOT NULL;

-- Index for price queries
CREATE INDEX IF NOT EXISTS idx_wishlist_items_price_monitoring
ON wishlist_items(user_id, price_monitoring_enabled)
WHERE price_monitoring_enabled = true;

-- ==============================================
-- PART 3: Price Alert Detection Function
-- ==============================================

-- Function to detect significant price changes
CREATE OR REPLACE FUNCTION detect_price_alert(
  p_item_id UUID,
  p_new_price NUMERIC,
  p_old_price NUMERIC
)
RETURNS JSONB AS $$
DECLARE
  v_drop_amount NUMERIC;
  v_drop_percentage NUMERIC;
  v_alert JSONB;
BEGIN
  -- Calculate price drop
  v_drop_amount := p_old_price - p_new_price;
  v_drop_percentage := (v_drop_amount / NULLIF(p_old_price, 0)) * 100;
  
  -- Only create alert if price dropped by 5% or more
  IF v_drop_percentage >= 5 THEN
    v_alert := jsonb_build_object(
      'type', 'price_drop',
      'dropAmount', v_drop_amount,
      'percentage', ROUND(v_drop_percentage, 1),
      'originalPrice', p_old_price,
      'newPrice', p_new_price,
      'triggeredAt', NOW()
    );
    RETURN v_alert;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- PART 4: Helper Functions
-- ==============================================

-- Function to get latest price for an item
CREATE OR REPLACE FUNCTION get_latest_price(p_item_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_latest_price NUMERIC;
BEGIN
  SELECT price INTO v_latest_price
  FROM wishlist_price_history
  WHERE wishlist_item_id = p_item_id
  ORDER BY checked_at DESC
  LIMIT 1;
  
  RETURN v_latest_price;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate price change percentage
CREATE OR REPLACE FUNCTION calculate_price_change(
  p_item_id UUID,
  p_days_ago INTEGER DEFAULT 7
)
RETURNS JSONB AS $$
DECLARE
  v_current_price NUMERIC;
  v_past_price NUMERIC;
  v_change_amount NUMERIC;
  v_change_percentage NUMERIC;
BEGIN
  -- Get current price
  SELECT price INTO v_current_price
  FROM wishlist_price_history
  WHERE wishlist_item_id = p_item_id
  ORDER BY checked_at DESC
  LIMIT 1;
  
  -- Get price from N days ago
  SELECT price INTO v_past_price
  FROM wishlist_price_history
  WHERE wishlist_item_id = p_item_id
    AND checked_at <= NOW() - (p_days_ago || ' days')::INTERVAL
  ORDER BY checked_at DESC
  LIMIT 1;
  
  -- Calculate change
  IF v_current_price IS NOT NULL AND v_past_price IS NOT NULL THEN
    v_change_amount := v_current_price - v_past_price;
    v_change_percentage := (v_change_amount / NULLIF(v_past_price, 0)) * 100;
    
    RETURN jsonb_build_object(
      'currentPrice', v_current_price,
      'pastPrice', v_past_price,
      'changeAmount', v_change_amount,
      'changePercentage', ROUND(v_change_percentage, 1),
      'daysAgo', p_days_ago
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- PART 5: RLS Policies
-- ==============================================

-- Enable RLS on price history
ALTER TABLE wishlist_price_history ENABLE ROW LEVEL SECURITY;

-- Users can view price history for their own wishlist items
CREATE POLICY "Users can view own price history" ON wishlist_price_history
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM wishlist_items 
      WHERE wishlist_items.id = wishlist_price_history.wishlist_item_id 
        AND wishlist_items.user_id = auth.uid()
    )
  );

-- Service role can insert price history (for background jobs)
CREATE POLICY "Service role can insert price history" ON wishlist_price_history
  FOR INSERT 
  WITH CHECK (true);

-- Users can delete their own price history
CREATE POLICY "Users can delete own price history" ON wishlist_price_history
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM wishlist_items 
      WHERE wishlist_items.id = wishlist_price_history.wishlist_item_id 
        AND wishlist_items.user_id = auth.uid()
    )
  );

-- ==============================================
-- PART 6: Automatic Cleanup
-- ==============================================

-- Function to clean up old price history (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_price_history()
RETURNS void AS $$
BEGIN
  DELETE FROM wishlist_price_history
  WHERE checked_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- PART 7: Comments for Documentation
-- ==============================================

COMMENT ON TABLE wishlist_price_history IS 
  'Tracks price changes for wishlist items over time using Claude AI scraping';

COMMENT ON COLUMN wishlist_price_history.price IS 
  'Current price at time of check';

COMMENT ON COLUMN wishlist_price_history.original_price IS 
  'Original price if item is on sale';

COMMENT ON COLUMN wishlist_price_history.sale_ends IS 
  'When the current sale/discount ends';

COMMENT ON COLUMN wishlist_price_history.source IS 
  'How price was obtained: claude_scrape, manual, or api';

COMMENT ON COLUMN wishlist_price_history.raw_data IS 
  'Full JSON data from scraping for debugging';

COMMENT ON COLUMN wishlist_items.price_monitoring_enabled IS 
  'Whether to actively monitor this item for price changes';

COMMENT ON COLUMN wishlist_items.target_price IS 
  'User-set target price for notifications';

COMMENT ON COLUMN wishlist_items.lowest_price_seen IS 
  'Lowest price ever recorded for this item';

COMMENT ON FUNCTION extract_price_numeric IS 
  'Extracts numeric value from price text (handles currency symbols)';

COMMENT ON FUNCTION detect_price_alert IS 
  'Detects if price drop is significant enough to trigger alert (5%+ threshold)';

-- ==============================================
-- Migration Complete!
-- ==============================================
-- Next steps:
-- 1. Run wishlist-pairings-migration.sql
-- 2. Implement priceMonitoringService.ts
-- 3. Set up background job for periodic checks
-- 4. Test with real wishlist items
