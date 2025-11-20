/**
 * Similar Products Service
 * Finds similar products at lower price points
 */

import { supabase } from './supabaseClient';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

interface SimilarProduct {
  name: string;
  brand?: string;
  price: number;
  url: string;
  imageUrl?: string;
  similarityScore: number;
  keyDifferences: string;
  savings: number;
}

interface SimilarProductsResult {
  success: boolean;
  suggestions: SimilarProduct[];
  reasoning?: string;
  error?: string;
}

class SimilarProductsService {
  async findSimilarProducts(
    productName: string,
    brand: string | undefined,
    originalPrice: number,
    maxPrice?: number
  ): Promise<SimilarProductsResult> {
    try {
      const targetPrice = maxPrice || originalPrice * 0.7; // 30% cheaper

      const prompt = `Find 3 similar alternative products that are cheaper:

ORIGINAL PRODUCT:
- Name: ${productName}
${brand ? `- Brand: ${brand}` : ''}
- Price: $${originalPrice}

REQUIREMENTS:
- Find products under $${targetPrice.toFixed(2)}
- Similar style, quality, and purpose
- From reputable retailers
- Must be actually available for purchase

Return JSON:
{
  "suggestions": [
    {
      "name": "Product name",
      "brand": "Brand",
      "price": 65.00,
      "url": "https://...",
      "imageUrl": "https://...",
      "similarityScore": 85,
      "keyDifferences": "Different material but same style",
      "savings": 35.00
    }
  ],
  "reasoning": "Why these are good alternatives"
}`;

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
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error(`API error ${response.status}`);

      const data = await response.json();
      const content = data.content?.[0]?.text?.trim() || '';
      const cleaned = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      const result = JSON.parse(cleaned);

      // Calculate savings
      const suggestions = result.suggestions.map((s: any) => ({
        ...s,
        savings: originalPrice - s.price
      }));

      // Cache results
      await this.cacheSimilarProducts(productName, {
        success: true,
        suggestions,
        reasoning: result.reasoning
      });

      return {
        success: true,
        suggestions,
        reasoning: result.reasoning
      };
    } catch (error: any) {
      console.error('❌ [SIMILAR-PRODUCTS] Error:', error);
      return {
        success: false,
        suggestions: [],
        error: error.message
      };
    }
  }

  private async cacheSimilarProducts(productName: string, result: SimilarProductsResult): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: item } = await supabase
        .from('wishlist_items')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', `%${productName}%`)
        .single();

      if (item) {
        await supabase
          .from('wishlist_similar_products')
          .insert({
            wishlist_item_id: item.id,
            user_id: user.id,
            suggestions: result.suggestions,
            reasoning: result.reasoning
          });
      }
    } catch (error) {
      console.error('❌ [SIMILAR-PRODUCTS] Cache error:', error);
    }
  }
}

export default new SimilarProductsService();
export type { SimilarProduct, SimilarProductsResult };
