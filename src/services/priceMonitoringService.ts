/**
 * Price Monitoring Service
 * Uses Claude AI to scrape and monitor product prices for wishlist items
 * Detects price drops, sales, and stock changes
 */

import { CapacitorHttp } from '@capacitor/core';
import { supabase } from '../lib/supabase';
import authService from './authService';

export interface PriceCheckResult {
  success: boolean;
  currentPrice: number;
  originalPrice?: number;
  discount?: string;
  discountPercentage?: number;
  inStock: boolean;
  stockLevel?: 'in_stock' | 'low_stock' | 'out_of_stock';
  saleEnds?: string; // ISO date string
  shipping?: string;
  error?: string;
  rawData?: any;
}

export interface PriceAlert {
  type: 'price_drop' | 'sale_start' | 'back_in_stock' | 'target_reached';
  dropAmount?: number;
  percentage?: number;
  originalPrice?: number;
  newPrice: number;
  triggeredAt: Date;
}

export interface WishlistItem {
  id: string;
  url: string;
  name: string;
  price: string;
  price_numeric?: number;
  target_price?: number;
  price_monitoring_enabled: boolean;
}

class PriceMonitoringService {
  private readonly API_BASE = import.meta.env.DEV 
    ? '/api/claude/v1/messages' 
    : 'https://api.anthropic.com/v1/messages';
  private readonly IS_DEV = import.meta.env.DEV;
  private readonly CLAUDE_KEY = import.meta.env.VITE_CLAUDE_API_KEY || 
                                  import.meta.env.VITE_ANTHROPIC_API_KEY;
  private readonly MIN_PRICE_DROP_PERCENTAGE = 5; // Minimum 5% drop to trigger alert

  /**
   * Check single product price using Claude AI
   */
  async checkProductPrice(url: string, itemName?: string): Promise<PriceCheckResult> {
    console.log('💰 [PRICE-MONITOR] Checking price for:', url);

    try {
      // Call Claude API to scrape product page
      const scrapedData = await this.scrapeProductPage(url, itemName);
      
      return {
        success: true,
        currentPrice: scrapedData.currentPrice,
        originalPrice: scrapedData.originalPrice,
        discount: scrapedData.discount,
        discountPercentage: scrapedData.discountPercentage,
        inStock: scrapedData.inStock,
        stockLevel: scrapedData.stockLevel,
        saleEnds: scrapedData.saleEnds,
        shipping: scrapedData.shipping,
        rawData: scrapedData
      };

    } catch (error: any) {
      console.error('❌ [PRICE-MONITOR] Price check failed:', error);
      return {
        success: false,
        currentPrice: 0,
        inStock: true,
        error: error.message
      };
    }
  }

  /**
   * Scrape product page using Claude AI
   */
  private async scrapeProductPage(url: string, itemName?: string): Promise<any> {
    console.log('🔍 [PRICE-MONITOR] Scraping product page with Claude');

    const prompt = `Visit this product URL and extract current pricing information:

URL: ${url}
${itemName ? `Product Name: ${itemName}` : ''}

TASK: Extract the following information from the product page:

1. **Current Price** (numeric value only, no currency symbols)
2. **Original Price** (if on sale/discounted)
3. **Discount Text** (e.g., "30% OFF", "Save $50")
4. **Discount Percentage** (numeric, if calculable)
5. **Stock Status**: Choose one:
   - "in_stock" - Available now
   - "low_stock" - Limited availability
   - "out_of_stock" - Not available
6. **Sale End Date** (if applicable, in ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)
7. **Shipping Info** (e.g., "Free shipping", "$5.99 shipping")

IMPORTANT RULES:
- Extract ONLY the final price the customer pays (after all discounts)
- If multiple prices shown (sizes/colors), use the base/starting price
- If price shown as range (e.g., "$50-$80"), use the lowest price
- For originalPrice: only include if item is currently on sale
- For stock status: be conservative - assume in_stock unless clearly stated otherwise
- For saleEnds: only include if explicitly mentioned
- All prices must be numeric (e.g., 125.99, not "$125.99")

Return ONLY valid JSON in this exact format:
{
  "currentPrice": 125.99,
  "originalPrice": 179.99,
  "discount": "30% OFF",
  "discountPercentage": 30,
  "inStock": true,
  "stockLevel": "in_stock",
  "saleEnds": "2025-11-25T23:59:59Z",
  "shipping": "Free shipping"
}

If you cannot find a field, omit it or set it to null.
If you cannot access the URL or extract pricing, return:
{
  "error": "Unable to access product page",
  "currentPrice": 0,
  "inStock": false
}

NO additional text before or after the JSON. Just the JSON object.`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add auth headers for direct API calls (production/iOS)
    if (!this.IS_DEV) {
      if (this.CLAUDE_KEY) {
        headers['x-api-key'] = this.CLAUDE_KEY;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        throw new Error('Claude API key not configured');
      }
    }

    const requestBody = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    };

    let response;

    // Use native HTTP on iOS/production to bypass CORS
    if (!this.IS_DEV) {
      console.log('📱 [PRICE-MONITOR] Using Capacitor native HTTP');
      const httpResponse = await CapacitorHttp.post({
        url: this.API_BASE,
        headers,
        data: requestBody
      });

      if (httpResponse.status !== 200) {
        throw new Error(`Claude API error: ${httpResponse.status}`);
      }

      response = httpResponse.data;
    } else {
      // Development: use fetch with backend proxy
      console.log('💻 [PRICE-MONITOR] Using fetch with backend proxy');
      const httpResponse = await fetch(this.API_BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!httpResponse.ok) {
        throw new Error(`Claude API error: ${httpResponse.status}`);
      }

      response = await httpResponse.json();
    }

    // Extract text content from Claude response
    const content = response.content?.[0]?.text || '';
    
    if (!content) {
      throw new Error('No content in Claude response');
    }

    // Clean and parse JSON
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const data = JSON.parse(cleanedContent);

    // Validate that we got meaningful data
    if (data.error || !data.currentPrice || data.currentPrice <= 0) {
      throw new Error(data.error || 'Failed to extract price from product page');
    }

    console.log('✅ [PRICE-MONITOR] Successfully scraped price:', data.currentPrice);
    
    return data;
  }

  /**
   * Batch check multiple wishlist items
   */
  async batchCheckPrices(itemIds: string[]): Promise<void> {
    console.log(`📦 [PRICE-MONITOR] Batch checking ${itemIds.length} items`);

    // Process in batches of 5 to avoid rate limits
    const BATCH_SIZE = 5;
    const DELAY_MS = 2000; // 2 seconds between batches

    for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
      const batch = itemIds.slice(i, i + BATCH_SIZE);
      
      console.log(`📦 [PRICE-MONITOR] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(itemIds.length / BATCH_SIZE)}`);
      
      // Process batch in parallel
      await Promise.allSettled(
        batch.map(id => this.checkAndUpdateItem(id))
      );

      // Wait before next batch (unless it's the last batch)
      if (i + BATCH_SIZE < itemIds.length) {
        console.log(`⏳ [PRICE-MONITOR] Waiting ${DELAY_MS}ms before next batch...`);
        await this.delay(DELAY_MS);
      }
    }

    console.log('✅ [PRICE-MONITOR] Batch check complete');
  }

  /**
   * Check and update single wishlist item
   */
  private async checkAndUpdateItem(itemId: string): Promise<void> {
    try {
      // Fetch item from Supabase
      const { data: item, error: fetchError } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError || !item) {
        console.error(`❌ [PRICE-MONITOR] Failed to fetch item ${itemId}:`, fetchError);
        return;
      }

      // Check if monitoring is enabled
      if (!item.price_monitoring_enabled) {
        console.log(`⏭️  [PRICE-MONITOR] Skipping ${item.name} - monitoring disabled`);
        return;
      }

      // Check price
      const result = await this.checkProductPrice(item.url, item.name);

      if (!result.success) {
        console.error(`❌ [PRICE-MONITOR] Price check failed for ${item.name}`);
        return;
      }

      // Save to price history
      await this.savePriceHistory(itemId, result);

      // Detect and handle price alerts
      await this.handlePriceAlerts(item, result);

      // Update wishlist item
      await this.updateWishlistItem(itemId, result);

      console.log(`✅ [PRICE-MONITOR] Updated ${item.name} - $${result.currentPrice}`);

    } catch (error: any) {
      console.error(`❌ [PRICE-MONITOR] Error checking item ${itemId}:`, error);
    }
  }

  /**
   * Save price check to history
   */
  private async savePriceHistory(itemId: string, result: PriceCheckResult): Promise<void> {
    const { error } = await supabase
      .from('wishlist_price_history')
      .insert({
        wishlist_item_id: itemId,
        price: result.currentPrice,
        original_price: result.originalPrice,
        discount_percentage: result.discountPercentage,
        discount_text: result.discount,
        in_stock: result.inStock,
        stock_level: result.stockLevel,
        sale_ends: result.saleEnds,
        shipping_info: result.shipping,
        source: 'claude_scrape',
        raw_data: result.rawData,
        checked_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ [PRICE-MONITOR] Failed to save price history:', error);
    }
  }

  /**
   * Handle price alerts (price drops, sales, etc.)
   */
  private async handlePriceAlerts(item: WishlistItem, result: PriceCheckResult): Promise<void> {
    const oldPrice = item.price_numeric;
    const newPrice = result.currentPrice;

    if (!oldPrice || oldPrice <= 0) {
      console.log('ℹ️  [PRICE-MONITOR] No previous price to compare');
      return;
    }

    // Detect price drop
    const alert = this.detectPriceDrop(oldPrice, newPrice);
    
    if (alert) {
      console.log(`🔔 [PRICE-MONITOR] ALERT! Price dropped ${alert.percentage}% for ${item.name}`);
      
      // TODO: Send push notification
      // await this.sendPushNotification(item, alert);
    }

    // Check target price
    if (item.target_price && newPrice <= item.target_price) {
      console.log(`🎯 [PRICE-MONITOR] TARGET REACHED! ${item.name} is now $${newPrice}`);
      
      // TODO: Send push notification
      // await this.sendTargetPriceNotification(item, newPrice);
    }

    // Check back in stock
    if (result.inStock && !item.price_monitoring_enabled) {
      console.log(`📦 [PRICE-MONITOR] BACK IN STOCK! ${item.name}`);
      
      // TODO: Send push notification
      // await this.sendBackInStockNotification(item);
    }
  }

  /**
   * Detect if price drop is significant enough for alert
   */
  detectPriceDrop(oldPrice: number, newPrice: number): PriceAlert | null {
    const dropAmount = oldPrice - newPrice;
    const percentage = (dropAmount / oldPrice) * 100;

    if (percentage >= this.MIN_PRICE_DROP_PERCENTAGE) {
      return {
        type: 'price_drop',
        dropAmount,
        percentage: Math.round(percentage * 10) / 10,
        originalPrice: oldPrice,
        newPrice,
        triggeredAt: new Date()
      };
    }

    return null;
  }

  /**
   * Update wishlist item with new price data
   */
  private async updateWishlistItem(itemId: string, result: PriceCheckResult): Promise<void> {
    const updates: any = {
      price_numeric: result.currentPrice,
      last_price_check: new Date().toISOString(),
      current_stock_status: result.stockLevel || (result.inStock ? 'in_stock' : 'out_of_stock'),
      has_active_sale: !!result.originalPrice,
      sale_ends_at: result.saleEnds || null
    };

    // Update lowest price seen
    const { data: currentItem } = await supabase
      .from('wishlist_items')
      .select('lowest_price_seen')
      .eq('id', itemId)
      .single();

    if (!currentItem?.lowest_price_seen || result.currentPrice < currentItem.lowest_price_seen) {
      updates.lowest_price_seen = result.currentPrice;
      console.log(`💎 [PRICE-MONITOR] New lowest price! $${result.currentPrice}`);
    }

    const { error } = await supabase
      .from('wishlist_items')
      .update(updates)
      .eq('id', itemId);

    if (error) {
      console.error('❌ [PRICE-MONITOR] Failed to update wishlist item:', error);
    }
  }

  /**
   * Check all wishlist items for current user
   */
  async checkAllUserWishlistItems(): Promise<void> {
    const user = await authService.getCurrentUser();
    
    if (!user) {
      console.error('❌ [PRICE-MONITOR] No authenticated user');
      return;
    }

    console.log('🔄 [PRICE-MONITOR] Checking all wishlist items for user:', user.id);

    // Fetch all items with monitoring enabled
    const { data: items, error } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('price_monitoring_enabled', true);

    if (error) {
      console.error('❌ [PRICE-MONITOR] Failed to fetch wishlist items:', error);
      return;
    }

    if (!items || items.length === 0) {
      console.log('ℹ️  [PRICE-MONITOR] No items to monitor');
      return;
    }

    console.log(`📋 [PRICE-MONITOR] Found ${items.length} items to check`);

    const itemIds = items.map(item => item.id);
    await this.batchCheckPrices(itemIds);
  }

  /**
   * Get price history for an item
   */
  async getPriceHistory(itemId: string, limit: number = 30): Promise<any[]> {
    const { data, error } = await supabase
      .from('wishlist_price_history')
      .select('*')
      .eq('wishlist_item_id', itemId)
      .order('checked_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [PRICE-MONITOR] Failed to fetch price history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get active price alerts for user
   */
  async getActiveAlerts(userId: string): Promise<any[]> {
    // Get all items with recent price drops
    const { data: items, error } = await supabase
      .from('wishlist_items')
      .select(`
        *,
        wishlist_price_history (
          price,
          checked_at,
          original_price,
          discount_percentage
        )
      `)
      .eq('user_id', userId)
      .eq('has_active_sale', true)
      .order('last_price_check', { ascending: false });

    if (error) {
      console.error('❌ [PRICE-MONITOR] Failed to fetch alerts:', error);
      return [];
    }

    return items || [];
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new PriceMonitoringService();
