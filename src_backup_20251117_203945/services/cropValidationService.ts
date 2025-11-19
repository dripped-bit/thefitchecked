/**
 * Crop Validation Service
 * Validates that cropped images actually contain the expected clothing item
 * Uses OpenAI Vision API (GPT-4o-mini) for fast, cost-effective validation
 */

import { analyzeImageJSON, base64ToDataUrl } from '../lib/openaiVision';

export interface CropValidationResult {
  isValid: boolean;
  confidence: number;
  detectedItem: string;
  expectedItem: string;
  issues: string[];
  suggestions: string[];
}

class CropValidationService {
  /**
   * Validate that a cropped image contains the expected clothing item
   */
  async validateCroppedItem(
    croppedImageUrl: string,
    expectedItemName: string,
    expectedCategory: string
  ): Promise<CropValidationResult> {
    try {
      console.log(`🔍 [CROP-VALIDATE-OPENAI] Validating crop for: ${expectedItemName}`);

      // Convert to base64 data URL
      const base64Image = await this.imageToBase64(croppedImageUrl);
      const dataUrl = base64ToDataUrl(base64Image, 'image/png');

      const prompt = `Analyze this cropped clothing image and identify what clothing item is visible.

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
}`;

      const parsed = await analyzeImageJSON<{
        detectedItem: string;
        matchesExpected: boolean;
        confidence: number;
        issues: string[];
      }>(dataUrl, prompt, {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 300,
        detail: 'low' // Low detail is sufficient for validation and cheaper
      });

      const validationResult: CropValidationResult = {
        isValid: parsed.matchesExpected,
        confidence: parsed.confidence || 0,
        detectedItem: parsed.detectedItem,
        expectedItem: expectedItemName,
        issues: parsed.issues || [],
        suggestions: this.generateSuggestions(parsed)
      };

      if (!validationResult.isValid) {
        console.warn(`⚠️ [CROP-VALIDATE-OPENAI] Validation FAILED:`, {
          expected: expectedItemName,
          detected: parsed.detectedItem,
          issues: parsed.issues
        });
      } else {
        console.log(`✅ [CROP-VALIDATE-OPENAI] Validation PASSED: ${expectedItemName}`);
      }

      return validationResult;

    } catch (error) {
      console.error('❌ [CROP-VALIDATE-OPENAI] Validation error:', error);
      return {
        isValid: false,
        confidence: 0,
        detectedItem: 'unknown',
        expectedItem: expectedItemName,
        issues: ['Validation failed - OpenAI Vision error'],
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

}

// Export singleton
export const cropValidationService = new CropValidationService();
export default cropValidationService;
