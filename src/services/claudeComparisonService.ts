/**
 * Claude Comparison Service
 * Generates optimized search queries for finding better deals on fashion items
 */

import Anthropic from '@anthropic-ai/sdk';

export interface SearchQueries {
  exactMatch: string;
  similarItems: string[];
}

class ClaudeComparisonService {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ [CLAUDE-COMPARISON] No API key found');
    }
    this.anthropic = new Anthropic({
      apiKey: apiKey || '',
      dangerouslyAllowBrowser: true
    });
  }

  async generateSearchQueries(item: any): Promise<SearchQueries> {
    try {
      console.log('🤖 [CLAUDE-COMPARISON] Generating search queries for:', item.name);

      const prompt = `You are a fashion shopping assistant. Given this item from a user's wishlist, generate optimized search queries to find the best deals.

Item Details:
- Name: ${item.name}
- Brand: ${item.brand || 'Unknown'}
- Current Price: ${item.price}
- Category: ${item.category || 'fashion'}
- Retailer: ${item.retailer || 'Unknown'}

Generate search queries for:
1. EXACT MATCH: A query to find this exact same item on sale at other retailers
2. SIMILAR ITEMS: 3 alternative queries for similar/comparable items that might offer better value

Guidelines:
- For exact match: Include brand name and key distinguishing features
- For similar items: Focus on style, color, material, occasion
- Keep queries concise (5-8 words max)
- Use shopping-optimized keywords

Return ONLY a JSON object with this structure:
{
  "exactMatch": "brand name product keywords",
  "similarItems": [
    "similar style alternative keywords",
    "comparable item different brand",
    "budget friendly similar option"
  ]
}`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      console.log('✅ [CLAUDE-COMPARISON] Response:', text);

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const queries: SearchQueries = JSON.parse(jsonMatch[0]);
      console.log('✅ [CLAUDE-COMPARISON] Parsed queries:', queries);

      return queries;
    } catch (error) {
      console.error('❌ [CLAUDE-COMPARISON] Error:', error);
      // Fallback to basic queries
      return {
        exactMatch: `${item.brand || ''} ${item.name}`.trim(),
        similarItems: [
          `similar to ${item.name}`,
          `${item.category} alternative`,
          `budget ${item.category}`
        ]
      };
    }
  }
}

export default new ClaudeComparisonService();
