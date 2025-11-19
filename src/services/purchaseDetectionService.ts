/**
 * Purchase Detection Service
 * Uses AI to analyze shopping sessions and detect purchase likelihood
 */

import { getChatGPTJSON } from '../lib/openai';

export interface PurchaseAnalysis {
  likelyPurchased: boolean;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  suggestedAction: 'mark_purchased' | 'save_wishlist' | 'skip';
}

class PurchaseDetectionService {
  /**
   * Analyze shopping session to detect if purchase was likely made
   */
  async analyzePurchaseIntent(
    product: any,
    originalItem: any
  ): Promise<PurchaseAnalysis> {
    try {
      console.log('🤖 [PURCHASE-DETECTION] Analyzing shopping session...');
      console.log('📦 [PURCHASE-DETECTION] Product:', product.title);
      console.log('📋 [PURCHASE-DETECTION] Original item:', originalItem?.name);
      
      const originalPrice = parseFloat(originalItem?.price?.replace(/[^0-9.]/g, '') || '0');
      const dealPrice = product.priceValue || parseFloat(product.price?.replace(/[^0-9.]/g, '') || '0');
      const savings = originalPrice - dealPrice;
      const savingsPercent = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;

      console.log('💰 [PURCHASE-DETECTION] Price analysis:', {
        original: originalPrice,
        deal: dealPrice,
        savings: savings.toFixed(2),
        savingsPercent: savingsPercent.toFixed(0) + '%'
      });

      const prompt = `You are analyzing a shopping session. The user just closed a browser after viewing this product:

Product Details:
- Item: ${product.title}
- Price: ${product.price}
- Store: ${product.retailer}
- Original wishlist item: ${originalItem?.name || 'Unknown'}
- Original price: ${originalItem?.price || 'Unknown'}
- Savings: $${savings.toFixed(2)} (${savingsPercent.toFixed(0)}% off)

Context Analysis:
- User spent time viewing the product (browser was open)
- ${savingsPercent > 20 ? 'Significant discount available' : 'Similar to original price'}
- ${['Amazon', 'Target', 'Walmart', 'Nordstrom', 'Zara', 'Macy\'s', 'Nike', 'Adidas'].includes(product.retailer) ? 'Reputable major retailer' : 'Smaller/specialty retailer'}
- This is a comparison shopping scenario (user is actively looking for deals)

Based on typical e-commerce behavior and deal-hunting patterns, estimate the likelihood the user completed a purchase.

Return ONLY JSON (no markdown):
{
  "likelyPurchased": true or false,
  "confidence": "high" or "medium" or "low",
  "reasoning": "1-2 sentence explanation focusing on deal quality and user behavior",
  "suggestedAction": "mark_purchased" or "save_wishlist" or "skip"
}

Guidelines:
- High confidence purchased: Great deal (>30% savings) + major retailer
- Medium confidence: Good deal (15-30% savings) or major retailer
- Low confidence: Small savings (<15%) + unknown retailer
- Suggest "mark_purchased" if high confidence
- Suggest "save_wishlist" if medium confidence
- Suggest "skip" if low confidence`;

      const analysis = await getChatGPTJSON(prompt, {
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 300
      }) as PurchaseAnalysis;

      console.log('✅ [PURCHASE-DETECTION] Analysis complete:', analysis);
      return analysis;

    } catch (error) {
      console.error('❌ [PURCHASE-DETECTION] Analysis failed:', error);
      // Fallback to medium confidence save suggestion
      return {
        likelyPurchased: false,
        confidence: 'medium',
        reasoning: 'Unable to analyze session, but this looks like a good deal worth saving for later consideration.',
        suggestedAction: 'save_wishlist'
      };
    }
  }
}

export default new PurchaseDetectionService();
