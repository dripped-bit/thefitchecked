/**
 * Generated Outfit Validation Service
 * Validates that AI-generated outfit images match user specifications
 * Uses OpenAI Vision API (GPT-4o-mini) to detect colors, garment types, and unwanted items
 */

import { analyzeImageJSON, base64ToDataUrl } from '../lib/openaiVision';
import { MandatorySpecs, GarmentSpec } from './strictPromptEnforcementService';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  score: number; // 0-100
  issues: string[];
  detectedItems: DetectedItem[];
  expectedItems: string[];
  recommendations: string[];
}

export interface DetectedItem {
  type: string;
  color?: string;
  style?: string;
  confidence: number;
  isExpected: boolean;
}

class GeneratedOutfitValidationService {

  /**
   * Validate generated outfit image against mandatory specifications
   */
  async validateGeneratedOutfit(
    imageUrl: string,
    mandatorySpecs: MandatorySpecs
  ): Promise<ValidationResult> {
    console.log('🔍 [OUTFIT-VALIDATE-OPENAI] Starting outfit validation');
    console.log('📋 [OUTFIT-VALIDATE-OPENAI] Expected specs:', mandatorySpecs);

    try {
      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUrl);

      // Build expected items list
      const expectedItems = this.buildExpectedItemsList(mandatorySpecs);

      // Ask OpenAI Vision to analyze the generated image
      const detectedItems = await this.analyzeImageWithClaude(
        base64Image,
        'image/png', // Default media type
        expectedItems,
        mandatorySpecs
      );

      // Compare detected items with specifications
      const validationResult = this.compareWithSpecs(detectedItems, mandatorySpecs, expectedItems);

      console.log('✅ [OUTFIT-VALIDATE-OPENAI] Validation complete:', {
        isValid: validationResult.isValid,
        score: validationResult.score,
        issueCount: validationResult.issues.length
      });

      return validationResult;

    } catch (error) {
      console.error('❌ [OUTFIT-VALIDATE-OPENAI] Validation failed:', error);
      return {
        isValid: false,
        confidence: 0,
        score: 0,
        issues: ['Validation system error'],
        detectedItems: [],
        expectedItems: this.buildExpectedItemsList(mandatorySpecs),
        recommendations: ['Unable to validate - proceeding with caution']
      };
    }
  }

  /**
   * Analyze image with OpenAI Vision API
   */
  private async analyzeImageWithClaude(
    base64Image: string,
    mediaType: string,
    expectedItems: string[],
    specs: MandatorySpecs
  ): Promise<DetectedItem[]> {
    console.log('🔍 [OUTFIT-VALIDATE-OPENAI] Analyzing outfit with OpenAI Vision');
    
    const dataUrl = base64ToDataUrl(base64Image, mediaType as any);
    
    const prompt = `Analyze this fashion outfit image and identify ALL clothing items visible.

Expected items (what we requested):
${expectedItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Your task:
1. List EVERY clothing item you see in the image
2. For each item, specify: type, color, style/details
3. Mark if each item was EXPECTED (in the list above) or UNEXPECTED
4. Detect any extra/unwanted items (jackets, layers, accessories not requested)

Rules:
- Be specific about colors (e.g., "light brown" not just "brown")
- Identify exact garment types (e.g., "blouse" vs "shirt" vs "top")
- Note style details (e.g., "one-shoulder", "off-shoulder", "v-neck")
- Flag ANY item not in the expected list as UNEXPECTED

Respond ONLY with valid JSON:
{
  "detectedItems": [
    {
      "type": "blouse",
      "color": "brown",
      "style": "off-shoulder",
      "confidence": 0.95,
      "isExpected": false,
      "reason": "Expected one-shoulder but detected off-shoulder"
    },
    {
      "type": "skirt",
      "color": "white",
      "style": "mini",
      "confidence": 0.90,
      "isExpected": false,
      "reason": "Expected capri pants but detected skirt"
    },
    {
      "type": "jacket",
      "color": "brown",
      "style": "casual",
      "confidence": 0.85,
      "isExpected": false,
      "reason": "Extra item - jacket not requested"
    }
  ]
}`;

    const parsed = await analyzeImageJSON<{
      detectedItems: DetectedItem[];
    }>(dataUrl, prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 1000,
      detail: 'low' // Low detail sufficient for validation
    });

    console.log('🤖 [OUTFIT-VALIDATE-OPENAI] OpenAI detected items:', parsed.detectedItems);

    return parsed.detectedItems || [];
  }

  /**
   * Build list of expected items from specifications
   */
  private buildExpectedItemsList(specs: MandatorySpecs): string[] {
    const items: string[] = [];

    if (specs.top) {
      items.push(this.formatGarmentExpectation(specs.top));
    }

    if (specs.bottom) {
      items.push(this.formatGarmentExpectation(specs.bottom));
    }

    if (specs.dress) {
      items.push(this.formatGarmentExpectation(specs.dress));
    }

    if (specs.shoes) {
      items.push(this.formatGarmentExpectation(specs.shoes));
    }

    return items;
  }

  /**
   * Format garment expectation as string
   */
  private formatGarmentExpectation(spec: GarmentSpec): string {
    const parts: string[] = [];

    if (spec.color) parts.push(spec.color);
    if (spec.style) parts.push(spec.style);
    if (spec.neckline) parts.push(`${spec.neckline} neckline`);
    if (spec.length) parts.push(`${spec.length} length`);
    if (spec.fit) parts.push(spec.fit);
    parts.push(spec.type);

    return parts.join(' ');
  }

  /**
   * Compare detected items with specifications
   */
  private compareWithSpecs(
    detectedItems: DetectedItem[],
    specs: MandatorySpecs,
    expectedItems: string[]
  ): ValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check 1: Item count
    if (detectedItems.length > specs.itemCount && !specs.allowAdditionalItems) {
      issues.push(`Extra items detected: ${detectedItems.length} items found, expected ${specs.itemCount}`);
      score -= 30;
      recommendations.push('Regenerate with stricter negative prompt to exclude extra items');
    }

    if (detectedItems.length < specs.itemCount) {
      issues.push(`Missing items: ${detectedItems.length} items found, expected ${specs.itemCount}`);
      score -= 40;
      recommendations.push('Regenerate to include all requested items');
    }

    // Check 2: Unexpected items
    const unexpectedItems = detectedItems.filter(item => !item.isExpected);
    if (unexpectedItems.length > 0) {
      issues.push(`Unexpected items: ${unexpectedItems.map(i => i.type).join(', ')}`);
      score -= 20 * unexpectedItems.length;
      recommendations.push(`Remove unwanted items: ${unexpectedItems.map(i => i.type).join(', ')}`);
    }

    // Check 3: Color matching
    if (specs.top) {
      const topItem = detectedItems.find(i => this.isTopItem(i.type));
      if (topItem && specs.top.color) {
        if (!this.colorsMatch(topItem.color || '', specs.top.color)) {
          issues.push(`Top color mismatch: expected ${specs.top.color}, got ${topItem.color || 'unknown'}`);
          score -= 25;
          recommendations.push(`Use stronger color emphasis: (${specs.top.color}:1.8)`);
        }
      }
    }

    if (specs.bottom) {
      const bottomItem = detectedItems.find(i => this.isBottomItem(i.type));
      if (bottomItem && specs.bottom.color) {
        if (!this.colorsMatch(bottomItem.color || '', specs.bottom.color)) {
          issues.push(`Bottom color mismatch: expected ${specs.bottom.color}, got ${bottomItem.color || 'unknown'}`);
          score -= 25;
          recommendations.push(`Use stronger color emphasis: (${specs.bottom.color}:1.8)`);
        }
      }
    }

    // Check 4: Style matching
    if (specs.top?.neckline) {
      const topItem = detectedItems.find(i => this.isTopItem(i.type));
      if (topItem && topItem.style) {
        if (!topItem.style.toLowerCase().includes(specs.top.neckline.toLowerCase())) {
          issues.push(`Top style mismatch: expected ${specs.top.neckline}, got ${topItem.style}`);
          score -= 20;
          recommendations.push(`Add explicit style: (${specs.top.neckline}:1.5)`);
        }
      }
    }

    // Ensure score doesn't go negative
    score = Math.max(0, score);

    // Determine validity
    const isValid = score >= 70 && issues.length <= 2;

    return {
      isValid,
      confidence: Math.max(0, Math.min(100, score)),
      score,
      issues,
      detectedItems,
      expectedItems,
      recommendations
    };
  }

  /**
   * Check if item type is a top
   */
  private isTopItem(type: string): boolean {
    const topTypes = ['blouse', 'shirt', 'top', 'sweater', 'tank', 't-shirt', 'tee', 'polo', 'tunic'];
    return topTypes.some(t => type.toLowerCase().includes(t));
  }

  /**
   * Check if item type is a bottom
   */
  private isBottomItem(type: string): boolean {
    const bottomTypes = ['pants', 'jeans', 'skirt', 'shorts', 'trousers', 'leggings'];
    return bottomTypes.some(t => type.toLowerCase().includes(t));
  }

  /**
   * Check if colors match (handles variations like "light brown" vs "brown")
   */
  private colorsMatch(detected: string, expected: string): boolean {
    const detectedLower = detected.toLowerCase();
    const expectedLower = expected.toLowerCase();

    // Exact match
    if (detectedLower === expectedLower) return true;

    // Partial match (e.g., "light brown" contains "brown")
    if (detectedLower.includes(expectedLower) || expectedLower.includes(detectedLower)) return true;

    // Color aliases
    const aliases: Record<string, string[]> = {
      'white': ['off-white', 'cream', 'ivory'],
      'black': ['dark', 'charcoal'],
      'gray': ['grey', 'silver'],
      'brown': ['tan', 'beige', 'khaki', 'camel'],
      'blue': ['navy', 'denim']
    };

    for (const [color, alts] of Object.entries(aliases)) {
      if (expectedLower === color && alts.some(alt => detectedLower.includes(alt))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Convert image to base64
   */
  private async imageToBase64(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Could not get canvas context');
          }

          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.split(',')[1];
          resolve(base64Data);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

}

// Export singleton
export const generatedOutfitValidationService = new GeneratedOutfitValidationService();
export default generatedOutfitValidationService;
