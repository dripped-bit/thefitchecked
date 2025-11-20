/**
 * Claude Style Analyzer Service
 * Uses Claude AI to analyze user's complete fashion profile and generate personalized insights
 */

import { ClothingItem } from '../hooks/useCloset';
import stylePreferencesService from './stylePreferencesService';
import fashionImageCurationService, { PersonalizedSearchContext } from './fashionImageCurationService';

export interface ClaudeStyleAnalysis {
  // For Style Steal section
  styleStealQueries: string[];
  styleStealTips: string[];
  
  // For AI Spotted section
  detectedTrends: {
    name: string;
    reason: string;
    stylingTip: string;
    searchQuery: string;
    icon: string;
  }[];
  
  // User context
  userGender: 'women' | 'men' | 'unisex';
  dominantCategories: string[];
  stylePersona: string;
}

class ClaudeStyleAnalyzer {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_CLAUDE_API_KEY || '';
  }

  /**
   * Analyze complete user profile with Claude AI
   */
  async analyzeForFashionFeed(
    items: ClothingItem[],
    userId: string
  ): Promise<ClaudeStyleAnalysis> {
    try {
      console.log('🤖 [CLAUDE] Starting fashion profile analysis...');

      // 1. Gather ALL user data
      const styleProfile = await stylePreferencesService.loadStyleProfile();
      const personalizationContext = await fashionImageCurationService.buildPersonalizationContext(items, userId);

      // 2. Build comprehensive prompt for Claude
      const prompt = this.buildAnalysisPrompt(items, styleProfile, personalizationContext);

      // 3. Call Claude AI
      const response = await this.callClaude(prompt);

      // 4. Parse and structure response
      const analysis = this.parseClaudeResponse(response, personalizationContext);

      console.log('✅ [CLAUDE] Analysis complete:', {
        styleStealQueries: analysis.styleStealQueries.length,
        detectedTrends: analysis.detectedTrends.length,
        gender: analysis.userGender
      });

      return analysis;
    } catch (error) {
      console.error('❌ [CLAUDE] Error analyzing profile:', error);
      
      // Return fallback analysis
      return this.getFallbackAnalysis(items, userId);
    }
  }

  /**
   * Build detailed prompt for Claude
   */
  private buildAnalysisPrompt(
    items: ClothingItem[],
    styleProfile: any,
    context: PersonalizedSearchContext
  ): string {
    const categorySummary = this.summarizeByCategory(items);
    const currentYear = new Date().getFullYear();

    return `You are a professional fashion stylist analyzing a user's wardrobe and style preferences.

## USER PROFILE
- Gender: ${context.genderContext || 'unisex'}
- Style Archetypes: ${context.styleArchetypes.length > 0 ? context.styleArchetypes.join(', ') : 'casual, everyday'}
- Favorite Colors: ${context.favoriteColors.length > 0 ? context.favoriteColors.join(', ') : 'not specified'}
- Avoid Colors: ${context.avoidColors.length > 0 ? context.avoidColors.join(', ') : 'none'}
- Preferred Materials: ${context.preferredMaterials.length > 0 ? context.preferredMaterials.join(', ') : 'any'}

## CLOSET INVENTORY (${items.length} items)
${categorySummary}

Top Colors: ${context.closetColors.slice(0, 5).join(', ')}
Top Brands: ${context.closetBrands.slice(0, 3).join(', ') || 'various'}

## SHOPPING INTERESTS
Wishlist Categories: ${context.wishlistCategories.join(', ') || 'none'}
Occasions: ${context.commonOccasions.join(', ') || 'everyday'}

## CURRENT TRENDS ${currentYear}
- Quiet luxury (minimalist, quality basics)
- Dopamine dressing (bright, joyful colors)
- Oversized tailoring (relaxed fits)
- Y2K revival (early 2000s aesthetic)
- Gorpcore (outdoor-inspired)
- Ballet core (feminine, soft)
- Tenniscore (sporty chic)
- Office siren (sophisticated workwear)

## TASK 1: STYLE STEAL QUERIES
Generate 6 SPECIFIC search queries for Unsplash image search.
Requirements:
- MUST include gender prefix ("womens" or "mens") - this is critical
- Mix current ${currentYear} trends with user's actual style
- Use their real closet categories (e.g., "sneakers", "blazer", "jeans")
- Make it trendy and Instagram-worthy
- Focus on wearable, recreatable outfits

## TASK 2: STYLE STEAL TIPS
Generate 3 styling tips based on their closet items.

## TASK 3: AI SPOTTED TRENDS
Identify 3-4 trends from their closet that align with ${currentYear} fashion.
For each trend:
- Name: short and catchy (2-3 words)
- Reason: why it suits them based on their closet (1 sentence, use "you" or "your")
- Styling Tip: specific actionable advice (1 sentence)
- Search Query: gender-specific Unsplash query (include "womens"/"mens")
- Icon: single emoji that represents the trend

## OUTPUT FORMAT
Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "styleStealQueries": ["query1", "query2", ...],
  "styleStealTips": ["tip1", "tip2", "tip3"],
  "detectedTrends": [
    {
      "name": "Trend Name",
      "reason": "Why this suits the user",
      "stylingTip": "How to style it",
      "searchQuery": "gender-specific unsplash query",
      "icon": "emoji"
    }
  ],
  "stylePersona": "Brief 2-3 word description of user's style"
}`;
  }

  /**
   * Summarize closet items by category
   */
  private summarizeByCategory(items: ClothingItem[]): string {
    const categories = items.reduce((acc, item) => {
      const cat = item.category || 'other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .map(([cat, count]) => `- ${cat}: ${count} items`)
      .join('\n');
  }

  /**
   * Call Claude AI API
   */
  private async callClaude(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Claude API key not found');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Parse Claude's JSON response
   */
  private parseClaudeResponse(
    responseText: string,
    context: PersonalizedSearchContext
  ): ClaudeStyleAnalysis {
    try {
      // Remove markdown code blocks if present
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanedText);

      return {
        styleStealQueries: parsed.styleStealQueries || [],
        styleStealTips: parsed.styleStealTips || [],
        detectedTrends: parsed.detectedTrends || [],
        userGender: context.genderContext || 'unisex',
        dominantCategories: context.closetCategories.slice(0, 5),
        stylePersona: parsed.stylePersona || 'casual chic'
      };
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      console.log('Raw response:', responseText);
      throw error;
    }
  }

  /**
   * Fallback analysis when Claude is unavailable
   */
  private async getFallbackAnalysis(
    items: ClothingItem[],
    userId: string
  ): Promise<ClaudeStyleAnalysis> {
    console.log('⚠️ [CLAUDE] Using fallback analysis');

    const context = await fashionImageCurationService.buildPersonalizationContext(items, userId);
    const genderPrefix = context.genderContext === 'women' ? 'womens' : context.genderContext === 'men' ? 'mens' : '';

    // Generate basic gender-specific queries
    const topColor = context.closetColors[0] || 'neutral';
    const topCategory = context.closetCategories[0] || 'outfit';

    return {
      styleStealQueries: [
        `${genderPrefix} ${topColor} ${topCategory} outfit street style`,
        `${genderPrefix} casual everyday outfit inspiration`,
        `${genderPrefix} minimalist fashion outfit`,
        `${genderPrefix} ${topColor} outfit ideas`,
        `${genderPrefix} street style fashion`,
        `${genderPrefix} trendy outfit inspiration`
      ].filter(q => q.trim()),
      styleStealTips: [
        'Mix casual pieces with structured items for balanced looks',
        'Experiment with layering to add depth to simple outfits',
        'Accessorize to elevate basic pieces'
      ],
      detectedTrends: [
        {
          name: 'Everyday Chic',
          reason: 'Your closet is full of versatile pieces perfect for daily wear',
          stylingTip: 'Elevate basics with quality accessories and proper fit',
          searchQuery: `${genderPrefix} casual chic outfit street style`,
          icon: '✨'
        },
        {
          name: 'Color Play',
          reason: `You have great ${topColor} pieces to work with`,
          stylingTip: 'Build monochromatic looks or add pops of contrast',
          searchQuery: `${genderPrefix} ${topColor} outfit inspiration`,
          icon: '🎨'
        }
      ],
      userGender: context.genderContext || 'unisex',
      dominantCategories: context.closetCategories.slice(0, 5),
      stylePersona: 'casual chic'
    };
  }
}

// Export singleton instance
const claudeStyleAnalyzer = new ClaudeStyleAnalyzer();
export default claudeStyleAnalyzer;
