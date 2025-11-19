/**
 * Vercel Cron Job: Wishlist Price Monitoring
 * 
 * Automatically checks wishlist item prices every 6 hours using Claude AI
 * Detects price drops, updates database, and generates alerts
 * 
 * Schedule: 0 star-slash-6 star star star (every 6 hours)
 * Max Duration: 300 seconds (5 minutes)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY;

// Initialize Supabase with service role for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const startTime = Date.now();

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('❌ [CRON] Unauthorized request - invalid secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔄 [CRON] Starting wishlist price monitoring...');
  console.log('🔄 [CRON] Time:', new Date().toISOString());

  try {
    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    if (!CLAUDE_API_KEY) {
      throw new Error('Missing Claude API key');
    }

    // Fetch all wishlist items with monitoring enabled
    const { data: items, error: fetchError } = await supabase
      .from('wishlist_items')
      .select('id, url, name, price_numeric, user_id')
      .eq('price_monitoring_enabled', true)
      .order('last_price_check', { ascending: true, nullsFirst: true })
      .limit(50); // Process max 50 items per run

    if (fetchError) {
      console.error('❌ [CRON] Supabase fetch error:', fetchError);
      throw new Error(`Failed to fetch items: ${fetchError.message}`);
    }

    if (!items || items.length === 0) {
      console.log('ℹ️  [CRON] No items to monitor');
      return res.status(200).json({
        success: true,
        message: 'No items to monitor',
        itemsChecked: 0,
        executionTime: Date.now() - startTime,
      });
    }

    console.log(`📋 [CRON] Found ${items.length} items to check`);

    // Process items in batches
    const results = await processPriceBatch(items);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const alertsGenerated = results.filter(r => r.data?.alert).length;

    const executionTime = Date.now() - startTime;

    console.log(`✅ [CRON] Completed in ${executionTime}ms`);
    console.log(`✅ [CRON] Success: ${successCount}, Failed: ${failureCount}, Alerts: ${alertsGenerated}`);

    return res.status(200).json({
      success: true,
      itemsChecked: items.length,
      successCount,
      failureCount,
      alertsGenerated,
      executionTime,
      timestamp: new Date().toISOString(),
      results: results.slice(0, 10), // Return first 10 results for logging
    });

  } catch (error: any) {
    console.error('❌ [CRON] Fatal error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      executionTime: Date.now() - startTime,
    });
  }
}

/**
 * Process items in batches with rate limiting
 */
async function processPriceBatch(items: any[]) {
  const BATCH_SIZE = 5;
  const DELAY_MS = 2000; // 2 seconds between batches
  const results = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(items.length / BATCH_SIZE);
    
    console.log(`📦 [CRON] Processing batch ${batchNum}/${totalBatches} (${batch.length} items)`);
    
    const batchResults = await Promise.allSettled(
      batch.map(item => checkSingleItem(item))
    );

    results.push(...batchResults.map((r, idx) => ({
      itemId: batch[idx].id,
      itemName: batch[idx].name,
      success: r.status === 'fulfilled',
      data: r.status === 'fulfilled' ? r.value : null,
      error: r.status === 'rejected' ? (r.reason?.message || String(r.reason)) : null,
    })));

    // Wait before next batch (rate limiting)
    if (i + BATCH_SIZE < items.length) {
      console.log(`⏳ [CRON] Waiting ${DELAY_MS}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  return results;
}

/**
 * Check and update a single wishlist item
 */
async function checkSingleItem(item: any) {
  try {
    console.log(`🔍 [CRON] Checking: ${item.name} (${item.url})`);

    // Check price using Claude
    const priceData = await scrapePrice(item.url, item.name);

    if (!priceData.success) {
      throw new Error(priceData.error || 'Failed to scrape price');
    }

    console.log(`💰 [CRON] Found price: $${priceData.currentPrice} for ${item.name}`);

    // Save to price history
    const { error: historyError } = await supabase
      .from('wishlist_price_history')
      .insert({
        wishlist_item_id: item.id,
        price: priceData.currentPrice,
        original_price: priceData.originalPrice,
        discount_percentage: priceData.discountPercentage,
        discount_text: priceData.discount,
        in_stock: priceData.inStock,
        stock_level: priceData.stockLevel,
        sale_ends: priceData.saleEnds,
        source: 'claude_scrape',
        checked_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error(`❌ [CRON] Failed to save price history:`, historyError);
    }

    // Detect price alert
    let alert = null;
    if (item.price_numeric && priceData.currentPrice < item.price_numeric) {
      const dropAmount = item.price_numeric - priceData.currentPrice;
      const percentage = (dropAmount / item.price_numeric) * 100;

      if (percentage >= 5) {
        alert = {
          type: 'price_drop',
          dropAmount: dropAmount.toFixed(2),
          percentage: Math.round(percentage * 10) / 10,
        };
        console.log(`🔔 [CRON] ALERT! Price dropped ${alert.percentage}% for ${item.name}`);
      }
    }

    // Update wishlist item
    const updates: any = {
      price_numeric: priceData.currentPrice,
      last_price_check: new Date().toISOString(),
      current_stock_status: priceData.stockLevel || 'in_stock',
      has_active_sale: !!priceData.originalPrice,
      sale_ends_at: priceData.saleEnds || null,
    };

    // Update lowest price if this is a new low
    const { data: currentItem } = await supabase
      .from('wishlist_items')
      .select('lowest_price_seen')
      .eq('id', item.id)
      .single();

    if (!currentItem?.lowest_price_seen || priceData.currentPrice < currentItem.lowest_price_seen) {
      updates.lowest_price_seen = priceData.currentPrice;
      console.log(`💎 [CRON] New lowest price for ${item.name}: $${priceData.currentPrice}`);
    }

    const { error: updateError } = await supabase
      .from('wishlist_items')
      .update(updates)
      .eq('id', item.id);

    if (updateError) {
      console.error(`❌ [CRON] Failed to update item:`, updateError);
    }

    return {
      itemId: item.id,
      itemName: item.name,
      currentPrice: priceData.currentPrice,
      alert,
      inStock: priceData.inStock,
    };

  } catch (error: any) {
    console.error(`❌ [CRON] Failed to check item ${item.id} (${item.name}):`, error.message);
    throw error;
  }
}

/**
 * Scrape product price using Claude AI
 */
async function scrapePrice(url: string, itemName?: string) {
  const prompt = `Visit this product URL and extract current pricing information:

URL: ${url}
${itemName ? `Product Name: ${itemName}` : ''}

TASK: Extract the following information from the product page:
1. Current price (numeric value only, no currency symbols)
2. Original price (if on sale/discounted)
3. Discount percentage (if applicable)
4. Stock status (choose: in_stock, low_stock, or out_of_stock)
5. Sale end date (ISO format: YYYY-MM-DDTHH:MM:SSZ, if applicable)

IMPORTANT:
- Extract ONLY the final price the customer pays (after all discounts)
- For stock status, be conservative - assume in_stock unless clearly stated otherwise
- All prices must be numeric (e.g., 125.99, not "$125.99")

Return ONLY valid JSON in this exact format:
{
  "currentPrice": 125.99,
  "originalPrice": 179.99,
  "discount": "30% OFF",
  "discountPercentage": 30,
  "inStock": true,
  "stockLevel": "in_stock",
  "saleEnds": "2025-11-25T23:59:59Z"
}

If you cannot access the URL or extract pricing, return:
{
  "error": "Unable to access product page",
  "currentPrice": 0,
  "inStock": false
}

NO additional text before or after the JSON. Just the JSON object.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'X-API-Key': CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    if (!content) {
      throw new Error('No content in Claude response');
    }

    // Parse JSON from response
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const result = JSON.parse(cleanedContent);

    // Validate result
    if (result.error || !result.currentPrice || result.currentPrice <= 0) {
      return {
        success: false,
        error: result.error || 'Invalid price data - price is 0 or missing',
        currentPrice: 0,
        inStock: false,
      };
    }

    return {
      success: true,
      currentPrice: result.currentPrice,
      originalPrice: result.originalPrice,
      discount: result.discount,
      discountPercentage: result.discountPercentage,
      inStock: result.inStock !== false, // Default to true if not specified
      stockLevel: result.stockLevel || 'in_stock',
      saleEnds: result.saleEnds,
    };

  } catch (error: any) {
    console.error('❌ [CRON] Claude API error:', error.message);
    
    return {
      success: false,
      error: `Claude API failed: ${error.message}`,
      currentPrice: 0,
      inStock: false,
    };
  }
}
