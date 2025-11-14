/**
 * Crop Validation Service
 * Validates that cropped images actually contain the expected clothing item
 * Uses Claude Vision API to verify crop accuracy before FASHN try-on
 */

import apiConfig from '../config/apiConfig';

export interface CropValidationResult {
  isValid: boolean;
  confidence: number;
  detectedItem: string;
  expectedItem: string;
  issues: string[];
  suggestions: string[];
}

class CropValidationService {
  private readonly API_BASE = apiConfig.getEndpoint('/api/claude/v1/messages');

  /**
   * Validate that a cropped image contains the expected clothing item
   */
  async validateCroppedItem(
    croppedImageUrl: string,
    expectedItemName: string,
    expectedCategory: string
  ): Promise<CropValidationResult> {
    try {
      console.log(`🔍 [CROP-VALIDATE] Validating crop for: ${expectedItemName}`);

      // Convert to base64
      const base64Image = await this.imageToBase64(croppedImageUrl);
      const mediaType = this.detectMediaType(croppedImageUrl);

      // Ask Claude to verify what's in the cropped image
      const requestBody = {
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: `Analyze this cropped clothing image and identify what clothing item is visible.

Expected item: ${expectedItemName}
Expected category: ${expectedCategory}

Your task:
1. What clothing item do you see in this image?
2. Does it match the expected item (${expectedItemName})?
3. Confidence score (0.0-1.0)
4. Any issues with the crop?

Respond ONLY with valid JSON:
{
  "detectedItem": "description of what you see (e.g., 'white mini skirt', 'blue shorts', 'red crop top')",
  "matchesExpected": true/false,
  "confidence": 0.95,
  "issues": ["list any problems, like 'image shows shorts not skirt', 'too much background', 'partial garment only']
}

NO additional text, ONLY JSON.`
              }
            ]
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

      const validationResult: CropValidationResult = {
        isValid: parsed.matchesExpected,
        confidence: parsed.confidence || 0,
        detectedItem: parsed.detectedItem,
        expectedItem: expectedItemName,
        issues: parsed.issues || [],
        suggestions: this.generateSuggestions(parsed)
      };

      if (!validationResult.isValid) {
        console.warn(`⚠️ [CROP-VALIDATE] Validation FAILED:`, {
          expected: expectedItemName,
          detected: parsed.detectedItem,
          issues: parsed.issues
        });
      } else {
        console.log(`✅ [CROP-VALIDATE] Validation PASSED: ${expectedItemName}`);
      }

      return validationResult;

    } catch (error) {
      console.error('❌ [CROP-VALIDATE] Validation error:', error);
      return {
        isValid: false,
        confidence: 0,
        detectedItem: 'unknown',
        expectedItem: expectedItemName,
        issues: ['Validation failed'],
        suggestions: ['Skip this item or retry detection']
      };
    }
  }

  /**
   * Generate suggestions based on validation result
   */
  private generateSuggestions(parsed: any): string[] {
    const suggestions: string[] = [];

    if (parsed.issues?.includes('partial garment only')) {
      suggestions.push('Expand bounding box to capture full garment');
    }
    if (parsed.issues?.includes('too much background')) {
      suggestions.push('Tighten bounding box around garment');
    }
    if (parsed.matchesExpected === false) {
      suggestions.push('Re-run detection with more specific prompts');
      suggestions.push('Manually verify image contains expected item');
    }

    return suggestions;
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

  /**
   * Detect image media type
   */
  private detectMediaType(imageUrl: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
    if (imageUrl.startsWith('data:')) {
      const match = imageUrl.match(/^data:(image\/[^;]+);/);
      if (match) {
        const type = match[1] as any;
        if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type)) {
          return type;
        }
      }
    }
    return 'image/png';
  }
}

// Export singleton
export const cropValidationService = new CropValidationService();
export default cropValidationService;
