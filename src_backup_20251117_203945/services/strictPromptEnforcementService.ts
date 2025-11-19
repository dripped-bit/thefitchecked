/**
 * Strict Prompt Enforcement Service
 * Ensures AI-generated outfits match EXACT user specifications
 * Prevents unwanted items and enforces colors, styles, and garment types
 */

import apiConfig from '../config/apiConfig';

export interface GarmentSpec {
  color?: string;
  style?: string;
  type: string;
  length?: string; // e.g., "capri", "ankle", "full-length"
  neckline?: string; // e.g., "one-shoulder", "off-shoulder", "crew-neck"
  fit?: string; // e.g., "fitted", "loose", "wide-leg"
}

export interface MandatorySpecs {
  top?: GarmentSpec;
  bottom?: GarmentSpec;
  dress?: GarmentSpec;
  outerwear?: GarmentSpec;
  shoes?: GarmentSpec;
  itemCount: number;
  allowAdditionalItems: boolean;
}

export interface EnforcedPromptResult {
  mandatorySpecs: MandatorySpecs;
  positivePrompt: string;
  negativePrompt: string;
  confidence: number;
  reasoning: string;
  forbiddenItems: string[];
}

class StrictPromptEnforcementService {
  private readonly API_BASE = apiConfig.getEndpoint('/api/claude/v1/messages');

  /**
   * Parse user request and enforce strict specifications
   */
  async enforceSpecifications(userRequest: string, style: string = 'casual'): Promise<EnforcedPromptResult> {
    console.log('🔒 [STRICT-ENFORCE] Starting strict specification enforcement');
    console.log('📝 [STRICT-ENFORCE] User request:', userRequest);

    try {
      // Use Claude to parse the request into structured specifications
      const parsedSpecs = await this.parseUserRequestWithClaude(userRequest, style);
      
      // Generate weighted positive prompt with emphasis
      const positivePrompt = this.buildWeightedPositivePrompt(parsedSpecs.mandatorySpecs);
      
      // Generate specific negative prompt to exclude unwanted items
      const negativePrompt = this.buildSpecificNegativePrompt(parsedSpecs.mandatorySpecs, parsedSpecs.forbiddenItems);
      
      console.log('✅ [STRICT-ENFORCE] Enforcement complete:', {
        specs: parsedSpecs.mandatorySpecs,
        positivePrompt: positivePrompt.substring(0, 100) + '...',
        negativePrompt: negativePrompt.substring(0, 100) + '...'
      });

      return {
        mandatorySpecs: parsedSpecs.mandatorySpecs,
        positivePrompt,
        negativePrompt,
        confidence: parsedSpecs.confidence,
        reasoning: parsedSpecs.reasoning,
        forbiddenItems: parsedSpecs.forbiddenItems
      };

    } catch (error) {
      console.error('❌ [STRICT-ENFORCE] Enforcement failed:', error);
      // Fallback to basic enforcement
      return this.generateFallbackEnforcement(userRequest, style);
    }
  }

  /**
   * Parse user request with Claude API to extract mandatory specifications
   */
  private async parseUserRequestWithClaude(userRequest: string, style: string): Promise<{
    mandatorySpecs: MandatorySpecs;
    forbiddenItems: string[];
    confidence: number;
    reasoning: string;
  }> {
    const requestBody = {
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Analyze this fashion request and extract MANDATORY specifications: "${userRequest}"

Style context: ${style}

Your task:
1. Identify EACH clothing item explicitly mentioned
2. Extract MANDATORY attributes (color, style, type, length, neckline, fit)
3. Determine items that should be FORBIDDEN (not mentioned = forbidden)
4. Count total items requested

Rules:
- If user says "white pants", that's MANDATORY white color
- If user says "one-shoulder blouse", that's MANDATORY one-shoulder neckline
- If user says "capri pants", that's MANDATORY capri length
- Items NOT mentioned should be added to forbidden list (e.g., if no jacket mentioned, forbid jackets)

Respond ONLY with valid JSON:
{
  "mandatorySpecs": {
    "top": {
      "color": "brown",
      "style": "one-shoulder",
      "type": "blouse",
      "neckline": "one-shoulder"
    },
    "bottom": {
      "color": "white",
      "type": "pants",
      "length": "capri"
    },
    "itemCount": 2,
    "allowAdditionalItems": false
  },
  "forbiddenItems": ["jacket", "cardigan", "blazer", "coat", "shorts underneath", "leggings underneath", "extra layers", "outerwear"],
  "confidence": 95,
  "reasoning": "User explicitly requested brown one-shoulder blouse and white capri pants. No outerwear or additional items mentioned, so they are forbidden."
}

NO additional text, ONLY JSON.`
        }
      ]
    };

    const response = await fetch(this.API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.content?.[0]?.text;

    if (!content) {
      throw new Error('No content in Claude response');
    }

    // Extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('🤖 [STRICT-ENFORCE] Claude parsed specs:', parsed);

    return {
      mandatorySpecs: parsed.mandatorySpecs,
      forbiddenItems: parsed.forbiddenItems || [],
      confidence: parsed.confidence || 85,
      reasoning: parsed.reasoning || 'Parsed from user request'
    };
  }

  /**
   * Build weighted positive prompt with emphasis syntax
   * Uses (term:weight) syntax for Stable Diffusion models
   */
  private buildWeightedPositivePrompt(specs: MandatorySpecs): string {
    const parts: string[] = [];

    // Add top specifications with emphasis
    if (specs.top) {
      const topDesc = this.buildGarmentDescription(specs.top);
      parts.push(`(${topDesc}:1.5)`); // High weight for mandatory items
    }

    // Add bottom specifications with emphasis
    if (specs.bottom) {
      const bottomDesc = this.buildGarmentDescription(specs.bottom);
      parts.push(`(${bottomDesc}:1.5)`);
    }

    // Add dress specifications with emphasis
    if (specs.dress) {
      const dressDesc = this.buildGarmentDescription(specs.dress);
      parts.push(`(${dressDesc}:1.5)`);
    }

    // Add shoes if specified
    if (specs.shoes) {
      const shoesDesc = this.buildGarmentDescription(specs.shoes);
      parts.push(`(${shoesDesc}:1.2)`);
    }

    // Add quality and style modifiers
    const qualityTerms = [
      'professional fashion photography',
      'studio lighting',
      'isolated on white background',
      'product photography',
      'high resolution',
      'detailed fabric texture',
      'fashion flat lay',
      'clothing only',
      'no person',
      'garment display',
      'EXACTLY as specified'
    ];

    parts.push(...qualityTerms);

    // Add strict adherence emphasis
    parts.push('(ONLY items listed:1.3)', '(no additional clothing:1.3)');

    return parts.join(', ');
  }

  /**
   * Build garment description from specs
   */
  private buildGarmentDescription(spec: GarmentSpec): string {
    const parts: string[] = [];

    if (spec.color) parts.push(spec.color);
    if (spec.style) parts.push(spec.style);
    if (spec.neckline) parts.push(spec.neckline);
    if (spec.length) parts.push(spec.length);
    if (spec.fit) parts.push(spec.fit);
    parts.push(spec.type);

    return parts.join(' ');
  }

  /**
   * Build specific negative prompt to exclude unwanted items
   */
  private buildSpecificNegativePrompt(specs: MandatorySpecs, forbiddenItems: string[]): string {
    const negatives: string[] = [];

    // Add forbidden items from analysis
    negatives.push(...forbiddenItems);

    // Add quality issues to avoid
    negatives.push(
      'blurry', 'low quality', 'distorted', 'pixelated',
      'bad anatomy', 'deformed', 'ugly', 'bad proportions',
      'duplicate', 'watermark', 'signature', 'text'
    );

    // Add unwanted elements
    negatives.push(
      'person wearing clothes', 'model', 'human', 'body',
      'mannequin', 'hangers', 'background clutter'
    );

    // Add specific exclusions based on what's NOT in specs
    if (!specs.outerwear && !specs.top?.type.toLowerCase().includes('jacket')) {
      negatives.push(
        'jacket', 'blazer', 'coat', 'cardigan',
        'outerwear', 'vest', 'shawl', 'cape'
      );
    }

    if (!specs.bottom?.type.toLowerCase().includes('short')) {
      negatives.push('shorts underneath', 'leggings underneath', 'layers under pants');
    }

    // Prevent extra items
    if (!specs.allowAdditionalItems) {
      negatives.push(
        'additional items', 'extra clothing', 'bonus pieces',
        'multiple versions', 'more than specified'
      );
    }

    // Remove duplicates and join
    return [...new Set(negatives)].join(', ');
  }

  /**
   * Generate fallback enforcement when Claude API fails
   */
  private generateFallbackEnforcement(userRequest: string, style: string): EnforcedPromptResult {
    console.warn('⚠️ [STRICT-ENFORCE] Using fallback enforcement');

    // Basic parsing using regex
    const specs: MandatorySpecs = {
      itemCount: 1,
      allowAdditionalItems: false
    };

    const lowerRequest = userRequest.toLowerCase();

    // Detect colors
    const colors = this.extractColors(lowerRequest);
    
    // Detect garment types
    if (lowerRequest.includes('dress') || lowerRequest.includes('gown')) {
      specs.dress = {
        type: 'dress',
        color: colors[0]
      };
    } else {
      // Look for top
      const topTypes = ['blouse', 'shirt', 'top', 'sweater', 'tank', 't-shirt'];
      for (const type of topTypes) {
        if (lowerRequest.includes(type)) {
          specs.top = {
            type,
            color: colors[0],
            neckline: this.detectNeckline(lowerRequest)
          };
          break;
        }
      }

      // Look for bottom
      const bottomTypes = ['pants', 'jeans', 'skirt', 'shorts', 'trousers'];
      for (const type of bottomTypes) {
        if (lowerRequest.includes(type)) {
          specs.bottom = {
            type,
            color: colors[1] || colors[0],
            length: this.detectLength(lowerRequest)
          };
          break;
        }
      }
    }

    specs.itemCount = (specs.top ? 1 : 0) + (specs.bottom ? 1 : 0) + (specs.dress ? 1 : 0);

    const positivePrompt = this.buildWeightedPositivePrompt(specs);
    const forbiddenItems = this.getFallbackForbiddenItems(specs);
    const negativePrompt = this.buildSpecificNegativePrompt(specs, forbiddenItems);

    return {
      mandatorySpecs: specs,
      positivePrompt,
      negativePrompt,
      confidence: 70,
      reasoning: 'Fallback enforcement due to API unavailability',
      forbiddenItems
    };
  }

  /**
   * Extract colors from text
   */
  private extractColors(text: string): string[] {
    const colorKeywords = [
      'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey',
      'pink', 'purple', 'orange', 'brown', 'navy', 'beige', 'khaki',
      'burgundy', 'maroon', 'teal', 'olive', 'coral', 'mint'
    ];

    const found: string[] = [];
    for (const color of colorKeywords) {
      if (text.includes(color)) {
        found.push(color);
      }
    }

    return found;
  }

  /**
   * Detect neckline style from text
   */
  private detectNeckline(text: string): string | undefined {
    if (text.includes('one-shoulder') || text.includes('one shoulder')) return 'one-shoulder';
    if (text.includes('off-shoulder') || text.includes('off shoulder')) return 'off-shoulder';
    if (text.includes('v-neck') || text.includes('v neck')) return 'v-neck';
    if (text.includes('crew-neck') || text.includes('crew neck')) return 'crew-neck';
    if (text.includes('halter')) return 'halter';
    return undefined;
  }

  /**
   * Detect length from text
   */
  private detectLength(text: string): string | undefined {
    if (text.includes('capri')) return 'capri';
    if (text.includes('ankle')) return 'ankle-length';
    if (text.includes('cropped')) return 'cropped';
    if (text.includes('full-length') || text.includes('full length')) return 'full-length';
    if (text.includes('mini')) return 'mini';
    if (text.includes('midi')) return 'midi';
    if (text.includes('maxi')) return 'maxi';
    return undefined;
  }

  /**
   * Get fallback forbidden items
   */
  private getFallbackForbiddenItems(specs: MandatorySpecs): string[] {
    const forbidden: string[] = [];

    // Always forbid these unless explicitly needed
    if (!specs.outerwear) {
      forbidden.push('jacket', 'blazer', 'coat', 'cardigan', 'outerwear');
    }

    forbidden.push(
      'extra layers', 'additional items', 'shorts underneath',
      'leggings underneath', 'multiple versions'
    );

    return forbidden;
  }

  /**
   * Validate that generated image matches specifications
   * (This will be implemented in generatedOutfitValidationService)
   */
  async validateGeneratedImage(imageUrl: string, specs: MandatorySpecs): Promise<{
    isValid: boolean;
    confidence: number;
    issues: string[];
  }> {
    // This is a placeholder - actual implementation in validation service
    console.log('🔍 [STRICT-ENFORCE] Validation will be handled by generatedOutfitValidationService');
    return {
      isValid: true,
      confidence: 100,
      issues: []
    };
  }
}

// Export singleton
export const strictPromptEnforcementService = new StrictPromptEnforcementService();
export default strictPromptEnforcementService;
