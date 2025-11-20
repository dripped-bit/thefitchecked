/**
 * Multi-Retailer Search Service
 * 
 * Uses Claude AI to find and compare prices for the same product
 * across multiple retailers.
 */

import { supabase } from './supabaseClient';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

interface RetailerPrice {
  retailer: string;
  url: string;
  price: number;
  shipping: number;
  total: number;
  inStock: boolean;
  shippingTime?: string;
}

interface PriceComparisonResult {
  success: boolean;
  retailers: RetailerPrice[];
  bestDealIndex: number;
  savingsAmount: number;
  error?: string;
}

class MultiRetailerSearchService {
  /**
   * Compare prices for a product across multiple retailers
   */
  async comparePrice(
    productName: string,
    brand: string | undefined,
    originalUrl: string,
    originalPrice: number
  ): Promise<PriceComparisonResult> {
    try {
      console.log(`💰 [MULTI-RETAILER] Comparing prices for: ${productName}`);

      // Check cache first
      const cached = await this.getCachedComparison(originalUrl);
      if (cached) {
        console.log('📦 [MULTI-RETAILER] Using cached comparison');
        return cached;
      }

      // Use Claude AI to find the product on other retailers
      const prompt = `Find this product on at least 3 different online retailers and extract pricing information:

PRODUCT INFORMATION:
- Name: ${productName}
${brand ? `- Brand: ${brand}` : ''}
- Original URL: ${originalUrl}
- Current Price: $${originalPrice}

TASK: Search for this EXACT product (same brand, same model) on these retailers:
1. Amazon.com
2. Nordstrom.com
3. Bloomingdales.com
4. Zappos.com
5. Saks Fifth Avenue
6. Neiman Marcus
7. Macy's
8. Dillards
9. Net-a-Porter
10. Farfetch

For EACH retailer where you find this product, extract:
- Exact product URL
- Current price (numeric only)
- Shipping cost (0 if free)
- Stock status (true/false)
- Estimated shipping time

IMPORTANT:
- Search for the EXACT same product (verify brand and model number)
- Don't suggest similar items - must be identical product
- Extract numeric prices only (no currency symbols)
- If shipping is free, use 0
- Skip retailers where product is not found

Return ONLY valid JSON in this format:
{
  "retailers": [
    {
      "retailer": "Amazon",
      "url": "https://amazon.com/...",
      "price": 115.99,
      "shipping": 0,
      "total": 115.99,
      "inStock": true,
      "shippingTime": "2-3 days"
    }
  ]
}

If you cannot find the product on any other retailers, return:
{
  "retailers": [],
  "error": "Product not found on other retailers"
}

NO additional text. Just JSON.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'X-API-Key': CLAUDE_API_KEY!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt,
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error ${response.status}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';

      // Parse JSON response
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const result = JSON.parse(cleanedContent);

      if (result.error || !result.retailers || result.retailers.length === 0) {
        return {
          success: false,
          retailers: [],
          bestDealIndex: -1,
          savingsAmount: 0,
          error: result.error || 'No alternative retailers found'
        };
      }

      // Calculate totals and find best deal
      const retailers: RetailerPrice[] = result.retailers.map((r: any) => ({
        ...r,
        total: r.price + (r.shipping || 0)
      }));

      // Find best deal (lowest total)
      let bestDealIndex = 0;
      let lowestTotal = retailers[0].total;

      retailers.forEach((retailer, index) => {
        if (retailer.total < lowestTotal) {
          lowestTotal = retailer.total;
          bestDealIndex = index;
        }
      });

      const savingsAmount = originalPrice - lowestTotal;

      console.log(`✅ [MULTI-RETAILER] Found ${retailers.length} retailers, best deal saves $${savingsAmount.toFixed(2)}`);

      const comparisonResult: PriceComparisonResult = {
        success: true,
        retailers,
        bestDealIndex,
        savingsAmount
      };

      // Cache the result
      await this.cacheComparison(originalUrl, comparisonResult);

      return comparisonResult;

    } catch (error: any) {
      console.error('❌ [MULTI-RETAILER] Error:', error);
      return {
        success: false,
        retailers: [],
        bestDealIndex: -1,
        savingsAmount: 0,
        error: error.message
      };
    }
  }

  /**
   * Get cached comparison if valid
   */
  private async getCachedComparison(itemUrl: string): Promise<PriceComparisonResult | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('wishlist_price_comparisons')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        success: true,
        retailers: data.retailers as RetailerPrice[],
        bestDealIndex: data.best_deal_index,
        savingsAmount: data.savings_amount
      };
    } catch {
      return null;
    }
  }

  /**
   * Cache comparison result
   */
  private async cacheComparison(itemUrl: string, result: PriceComparisonResult): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find wishlist item by URL
      const { data: item } = await supabase
        .from('wishlist_items')
        .select('id')
        .eq('url', itemUrl)
        .eq('user_id', user.id)
        .single();

      if (!item) return;

      await supabase
        .from('wishlist_price_comparisons')
        .insert({
          wishlist_item_id: item.id,
          user_id: user.id,
          retailers: result.retailers,
          best_deal_index: result.bestDealIndex,
          savings_amount: result.savingsAmount
        });

      console.log('💾 [MULTI-RETAILER] Cached comparison');
    } catch (error) {
      console.error('❌ [MULTI-RETAILER] Cache error:', error);
    }
  }
}

export default new MultiRetailerSearchService();
export type { RetailerPrice, PriceComparisonResult };
