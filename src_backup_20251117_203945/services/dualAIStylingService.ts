import { getChatGPTResponse, getChatGPTJSON } from '../lib/openai';
import claudeOutfitService, { OutfitSuggestion } from './claudeOutfitService';

interface OutfitRequest {
  occasion: string;
  weather: string;
  temperature?: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  lifestyle: string;
  userWardrobe?: any[];
}

interface OutfitRecommendation {
  top: string;
  bottom: string;
  shoes: string;
  outerwear?: string;
  accessories?: string[];
  reasoning: string;
  styleNotes: string;
  approved: boolean;
  confidence: 'high' | 'medium' | 'low';
}

interface ClaudeAnalysis {
  topCategory: string;
  topStyle: string;
  bottomCategory: string;
  bottomStyle: string;
  shoesCategory: string;
  shoesStyle: string;
  outerwearNeeded: boolean;
  outerwearCategory?: string;
  formalityLevel: number;
  layeringAdvice: string;
  colorPalette: string[];
  reasoning: string;
}

interface ChatGPTValidation {
  approved: boolean;
  confidence: 'high' | 'medium' | 'low';
  suggestions: string[];
  warnings: string[];
  alternativeApproach?: string;
  styleNotes: string;
}

export class AIStylingService {
  
  /**
   * Main method: Gets outfit recommendation using Claude + ChatGPT validation
   * Uses Vercel serverless function for secure API key handling
   */
  async getOutfitRecommendation(
    request: OutfitRequest
  ): Promise<OutfitRecommendation> {
    
    console.log('🎨 Starting dual-AI styling process...');
    
    try {
      // Call Vercel serverless function
      const response = await fetch('/api/outfit-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const data = await response.json();
      console.log('✅ Dual-AI outfit generated');

      return data.outfit;
      
    } catch (error: any) {
      console.error('❌ Styling error:', error.message);
      throw error;
    }
  }

  /**
   * DEPRECATED: Now handled by Vercel serverless function
   * Claude: Strategic context analysis
   */
  private async getClaudeAnalysis(request: OutfitRequest): Promise<ClaudeAnalysis> {
    
    const prompt = `You are a wardrobe planning expert. Analyze this outfit request:

CONTEXT:
- Occasion: ${request.occasion}
- Weather: ${request.weather} ${request.temperature ? `(${request.temperature}°F)` : ''}
- Time of Day: ${request.timeOfDay}
- Lifestyle: ${request.lifestyle}

YOUR TASK:
Determine the appropriate outfit CATEGORIES and FORMALITY level. Do NOT select specific items yet.

Consider:
1. What type of top is appropriate? (t-shirt, blouse, sweater, tank, etc.)
2. What type of bottom? (jeans, trousers, skirt, shorts, leggings)
3. What type of shoes? (sneakers, boots, heels, flats, sandals)
4. Is outerwear needed?
5. What's the formality level (1-10)?

RESPOND WITH JSON ONLY:
{
  "topCategory": "specific category",
  "topStyle": "style description",
  "bottomCategory": "specific category",
  "bottomStyle": "style description",
  "shoesCategory": "specific category",
  "shoesStyle": "style description",
  "outerwearNeeded": boolean,
  "outerwearCategory": "category if needed",
  "formalityLevel": number,
  "layeringAdvice": "brief advice",
  "colorPalette": ["color1", "color2", "color3"],
  "reasoning": "why this works"
}`;

    try {
      // Use your existing claudeOutfitService
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          temperature: 0.5,
          maxTokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse Claude's JSON response
      let cleanedResponse = data.response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return JSON.parse(cleanedResponse) as ClaudeAnalysis;

    } catch (error: any) {
      console.error('❌ Claude analysis error:', error.message);
      throw new Error(`Claude analysis failed: ${error.message}`);
    }
  }

  /**
   * ChatGPT: Validates Claude's recommendations
   */
  private async getChatGPTValidation(
    claudeAnalysis: ClaudeAnalysis,
    request: OutfitRequest
  ): Promise<ChatGPTValidation> {
    
    const prompt = `You are a fashion critic and styling validator. Review this outfit recommendation:

ORIGINAL REQUEST:
- Occasion: ${request.occasion}
- Weather: ${request.weather} ${request.temperature ? `(${request.temperature}°F)` : ''}
- Time: ${request.timeOfDay}
- Lifestyle: ${request.lifestyle}

CLAUDE'S RECOMMENDATION:
- Top: ${claudeAnalysis.topCategory} (${claudeAnalysis.topStyle})
- Bottom: ${claudeAnalysis.bottomCategory} (${claudeAnalysis.bottomStyle})
- Shoes: ${claudeAnalysis.shoesCategory} (${claudeAnalysis.shoesStyle})
- Outerwear: ${claudeAnalysis.outerwearNeeded ? claudeAnalysis.outerwearCategory : 'None'}
- Formality: ${claudeAnalysis.formalityLevel}/10
- Colors: ${claudeAnalysis.colorPalette.join(', ')}
- Reasoning: ${claudeAnalysis.reasoning}

YOUR TASK:
Validate this recommendation. Check for:
1. Weather appropriateness (temperature, conditions)
2. Occasion appropriateness (formality, context)
3. Time-of-day suitability
4. Practical considerations (comfort, mobility)
5. Style coherence (do pieces work together?)

RESPOND WITH JSON:
{
  "approved": boolean,
  "confidence": "high" | "medium" | "low",
  "suggestions": ["specific improvement 1", "specific improvement 2"],
  "warnings": ["potential issue 1", "potential issue 2"],
  "alternativeApproach": "optional alternative if disapproved",
  "styleNotes": "final styling tips"
}`;

    try {
      return await getChatGPTJSON<ChatGPTValidation>(prompt, {
        model: 'gpt-4o',
        temperature: 0.3, // Lower temperature for validation
        systemMessage: 'You are a professional fashion stylist with expertise in weather-appropriate dressing and occasion-specific styling.'
      });

    } catch (error: any) {
      console.error('❌ ChatGPT validation error:', error.message);
      
      // If validation fails, assume approval but low confidence
      return {
        approved: true,
        confidence: 'low',
        suggestions: [],
        warnings: ['ChatGPT validation unavailable'],
        styleNotes: 'Proceed with caution - validation incomplete'
      };
    }
  }

  /**
   * Combine Claude's analysis with ChatGPT's validation
   */
  private combineResults(
    claudeAnalysis: ClaudeAnalysis,
    chatGPTValidation: ChatGPTValidation
  ): OutfitRecommendation {
    
    return {
      top: `${claudeAnalysis.topCategory} - ${claudeAnalysis.topStyle}`,
      bottom: `${claudeAnalysis.bottomCategory} - ${claudeAnalysis.bottomStyle}`,
      shoes: `${claudeAnalysis.shoesCategory} - ${claudeAnalysis.shoesStyle}`,
      outerwear: claudeAnalysis.outerwearNeeded 
        ? claudeAnalysis.outerwearCategory 
        : undefined,
      accessories: [], // Could extend this
      reasoning: `${claudeAnalysis.reasoning}\n\n${chatGPTValidation.suggestions.length > 0 ? 'Refinements: ' + chatGPTValidation.suggestions.join(', ') : ''}`,
      styleNotes: chatGPTValidation.styleNotes,
      approved: chatGPTValidation.approved,
      confidence: chatGPTValidation.confidence
    };
  }

  /**
   * Fallback: ChatGPT-only recommendation if Claude fails
   */
  private async getChatGPTOnlyRecommendation(
    request: OutfitRequest
  ): Promise<OutfitRecommendation> {
    
    const prompt = `You are an expert fashion stylist. Create a complete outfit recommendation:

CONTEXT:
- Occasion: ${request.occasion}
- Weather: ${request.weather} ${request.temperature ? `(${request.temperature}°F)` : ''}
- Time of Day: ${request.timeOfDay}
- Lifestyle: ${request.lifestyle}

CREATE A COMPLETE OUTFIT:
1. Top (specific type and style)
2. Bottom (specific type and style)
3. Shoes (specific type and style)
4. Outerwear (if needed)
5. Accessories (optional)

RESPOND WITH JSON:
{
  "top": "description",
  "bottom": "description",
  "shoes": "description",
  "outerwear": "description or null",
  "accessories": ["item1", "item2"],
  "reasoning": "why this outfit works",
  "styleNotes": "styling tips",
  "confidence": "high" | "medium" | "low"
}`;

    try {
      const result = await getChatGPTJSON<any>(prompt, {
        model: 'gpt-4o',
        temperature: 0.7,
        systemMessage: 'You are a professional fashion stylist specializing in weather-appropriate and occasion-specific outfits.'
      });

      return {
        ...result,
        approved: true // Auto-approve since it's the only recommendation
      };

    } catch (error: any) {
      console.error('❌ ChatGPT-only fallback error:', error.message);
      throw new Error('All AI styling services failed');
    }
  }
}

// Export singleton instance
export const dualAIStylingService = new AIStylingService();
export default dualAIStylingService;
