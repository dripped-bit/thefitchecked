-- ============================================
-- WISHLIST ENHANCEMENTS MIGRATION
-- ============================================
-- Adds features for birthday lists, purchase tracking,
-- availability checking, and closet integration
-- ============================================

-- PART 1: Update wishlist_items table
-- ============================================

ALTER TABLE wishlist_items
ADD COLUMN IF NOT EXISTS is_birthday_item BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS birthday_date DATE,
ADD COLUMN IF NOT EXISTS is_purchased BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS purchased_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS moved_to_closet BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS closet_item_id UUID REFERENCES clothing_items(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS availability_status TEXT, -- in_stock, low_stock, out_of_stock, restocking
ADD COLUMN IF NOT EXISTS availability_checked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS availability_details TEXT,
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_wishlist_birthday_items 
ON wishlist_items(user_id, is_birthday_item) 
WHERE is_birthday_item = true;

CREATE INDEX IF NOT EXISTS idx_wishlist_purchased_items 
ON wishlist_items(user_id, is_purchased) 
WHERE is_purchased = true;

CREATE INDEX IF NOT EXISTS idx_wishlist_availability 
ON wishlist_items(availability_status, availability_checked_at);

-- ============================================
-- PART 2: Birthday Wishlist Shares Table
-- ============================================

CREATE TABLE IF NOT EXISTS birthday_wishlist_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  title TEXT DEFAULT 'My Birthday Wishlist',
  birthday_date DATE,
  message TEXT,
  is_public BOOLEAN DEFAULT true,
  allow_mark_purchased BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Index for share token lookups
CREATE INDEX IF NOT EXISTS idx_birthday_shares_token 
ON birthday_wishlist_shares(share_token);

-- ============================================
-- PART 3: Price Comparisons Cache Table
-- ============================================

CREATE TABLE IF NOT EXISTS wishlist_price_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_item_id UUID REFERENCES wishlist_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Comparison data stored as JSONB array
  -- Structure: [{retailer, url, price, shipping, total, inStock, shippingTime}]
  retailers JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  best_deal_index INTEGER, -- Index of best deal in retailers array
  savings_amount NUMERIC(10, 2), -- How much you save vs original
  
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '6 hours',
  
  CONSTRAINT valid_retailers CHECK (jsonb_typeof(retailers) = 'array')
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_price_comparisons_item 
ON wishlist_price_comparisons(wishlist_item_id, expires_at);

-- ============================================
-- PART 4: Similar Products Cache Table
-- ============================================

CREATE TABLE IF NOT EXISTS wishlist_similar_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_item_id UUID REFERENCES wishlist_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Similar products stored as JSONB array
  -- Structure: [{name, brand, price, url, imageUrl, similarityScore, keyDifferences, savings}]
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  reasoning TEXT, -- AI explanation of alternatives
  max_price_filter NUMERIC(10, 2), -- Price limit used for search
  
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
  
  CONSTRAINT valid_suggestions CHECK (jsonb_typeof(suggestions) = 'array')
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_similar_products_item 
ON wishlist_similar_products(wishlist_item_id, expires_at);

-- ============================================
-- PART 5: Row Level Security Policies
-- ============================================

-- Birthday wishlist shares - public read access
ALTER TABLE birthday_wishlist_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public birthday wishlists" ON birthday_wishlist_shares
  FOR SELECT 
  USING (is_public = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users can manage own birthday shares" ON birthday_wishlist_shares
  FOR ALL
  USING (user_id = auth.uid());

-- Price comparisons - user access only
ALTER TABLE wishlist_price_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own price comparisons" ON wishlist_price_comparisons
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own price comparisons" ON wishlist_price_comparisons
  FOR ALL
  USING (user_id = auth.uid());

-- Similar products - user access only
ALTER TABLE wishlist_similar_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own similar products" ON wishlist_similar_products
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own similar products" ON wishlist_similar_products
  FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- PART 6: Helper Functions
-- ============================================

-- Function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Function to check if birthday share is valid
CREATE OR REPLACE FUNCTION is_birthday_share_valid(p_share_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_valid BOOLEAN;
BEGIN
  SELECT (is_public = true AND (expires_at IS NULL OR expires_at > NOW()))
  INTO v_is_valid
  FROM birthday_wishlist_shares
  WHERE share_token = p_share_token;
  
  RETURN COALESCE(v_is_valid, false);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 7: Triggers
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_birthday_share_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER birthday_share_updated_at
  BEFORE UPDATE ON birthday_wishlist_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_birthday_share_updated_at();

-- ============================================
-- PART 8: Views for Easy Querying
-- ============================================

-- View combining wishlist items with availability and comparisons
CREATE OR REPLACE VIEW wishlist_items_enhanced AS
SELECT 
  wi.*,
  pc.retailers as price_comparison_retailers,
  pc.best_deal_index,
  pc.savings_amount,
  (pc.expires_at > NOW()) as has_valid_comparison,
  sp.suggestions as similar_products,
  (sp.expires_at > NOW()) as has_valid_alternatives
FROM wishlist_items wi
LEFT JOIN LATERAL (
  SELECT *
  FROM wishlist_price_comparisons
  WHERE wishlist_item_id = wi.id
  AND expires_at > NOW()
  ORDER BY generated_at DESC
  LIMIT 1
) pc ON true
LEFT JOIN LATERAL (
  SELECT *
  FROM wishlist_similar_products
  WHERE wishlist_item_id = wi.id
  AND expires_at > NOW()
  ORDER BY generated_at DESC
  LIMIT 1
) sp ON true;

-- ============================================
-- PART 9: Comments
-- ============================================

COMMENT ON COLUMN wishlist_items.is_birthday_item IS 
  'Whether this item is part of users birthday wishlist';

COMMENT ON COLUMN wishlist_items.birthday_date IS 
  'Target birthday date for gift giving';

COMMENT ON COLUMN wishlist_items.is_purchased IS 
  'Whether user has purchased this item';

COMMENT ON COLUMN wishlist_items.moved_to_closet IS 
  'Whether item was moved to clothing_items after purchase';

COMMENT ON COLUMN wishlist_items.availability_status IS 
  'Real-time stock status: in_stock, low_stock, out_of_stock, restocking';

COMMENT ON TABLE birthday_wishlist_shares IS 
  'Shareable birthday wishlists with public access tokens';

COMMENT ON TABLE wishlist_price_comparisons IS 
  'Cached multi-retailer price comparisons for wishlist items';

COMMENT ON TABLE wishlist_similar_products IS 
  'AI-generated similar product suggestions at lower price points';
