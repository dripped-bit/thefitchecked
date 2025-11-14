/**
 * Garment Extraction Service
 * Extracts clothing items from images of people wearing them
 * Uses Claude Vision for detection and BiRefNet for extraction
 */

import apiConfig from '../config/apiConfig';
import birefnetBackgroundRemovalService from './birefnetBackgroundRemovalService';

export interface GarmentDetectionResult {
  hasHuman: boolean;
  garmentType?: string;
  boundingBox?: {
    x: number; // Normalized 0-1
    y: number; // Normalized 0-1
    width: number; // Normalized 0-1
    height: number; // Normalized 0-1
  };
  photoType: 'person-wearing' | 'flat-lay' | 'mannequin' | 'unknown';
  confidence: number;
}

export interface GarmentExtractionResult {
  success: boolean;
  extractedImageUrl?: string;
  originalImageUrl: string;
  wasExtracted: boolean; // True if garment was extracted from person
  detectionResult?: GarmentDetectionResult;
  error?: string;
}

class GarmentExtractionService {
  private readonly API_BASE = apiConfig.getEndpoint('/api/claude/v1/messages');

  /**
   * Extract garment from image (handles both person-wearing and flat-lay)
   */
  async extractGarment(imageUrl: string): Promise<GarmentExtractionResult> {
    console.log('👤 [GARMENT-EXTRACT] Starting garment extraction');

    try {
      // Step 1: Detect if person is wearing clothes
      const detection = await this.detectPersonWearing(imageUrl);
      console.log('🔍 [GARMENT-EXTRACT] Detection result:', detection);

      // Step 2: If person detected, extract and crop garment area
      if (detection.hasHuman && detection.boundingBox) {
        console.log('✂️ [GARMENT-EXTRACT] Person detected, extracting garment...');
        
        // Crop to garment bounding box
        const croppedImage = await this.cropToGarment(imageUrl, detection.boundingBox);
        
        // Remove background (removes person, keeps garment)
        const cleaned = await birefnetBackgroundRemovalService.removeBackground(croppedImage, {
          model: "Portrait",
          operating_resolution: "2048x2048",
          refine_foreground: true,
          output_format: "png"
        });

        if (cleaned.success && cleaned.imageUrl) {
          console.log('✅ [GARMENT-EXTRACT] Successfully extracted garment from person');
          return {
            success: true,
            extractedImageUrl: cleaned.imageUrl,
            originalImageUrl: imageUrl,
            wasExtracted: true,
            detectionResult: detection
          };
        } else {
          throw new Error('Background removal failed after extraction');
        }

      } else {
        // No person detected, just remove background from original
        console.log('📐 [GARMENT-EXTRACT] No person detected, processing as flat-lay');
        
        const cleaned = await birefnetBackgroundRemovalService.removeBackground(imageUrl, {
          model: "General Use (Light)",
          operating_resolution: "2048x2048",
          refine_foreground: true,
          output_format: "png"
        });

        if (cleaned.success && cleaned.imageUrl) {
          return {
            success: true,
            extractedImageUrl: cleaned.imageUrl,
            originalImageUrl: imageUrl,
            wasExtracted: false,
            detectionResult: detection
          };
        } else {
          throw new Error('Background removal failed');
        }
      }

    } catch (error) {
      console.error('❌ [GARMENT-EXTRACT] Extraction failed:', error);
      return {
        success: false,
        originalImageUrl: imageUrl,
        wasExtracted: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Detect if person is wearing clothes using Claude Vision
   */
  private async detectPersonWearing(imageUrl: string): Promise<GarmentDetectionResult> {
    console.log('🔍 [PERSON-DETECT] Analyzing image for person wearing clothes...');

    try {
      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUrl);
      const mediaType = this.detectMediaType(imageUrl);

      const requestBody = {
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
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
                text: `Analyze this image to determine if it shows a person wearing clothes.

Your task:
1. Is there a human/person visible in the image?
2. If yes, what type of garment are they wearing (focus on the main/most prominent item)?
3. Provide a bounding box for the garment area (normalized 0-1 coordinates)
4. Determine the photo type

Return ONLY valid JSON:
{
  "hasHuman": true/false,
  "garmentType": "shirt|jacket|dress|pants|top|hoodie|sweater|coat",
  "boundingBox": {
    "x": 0.2,
    "y": 0.15,
    "width": 0.6,
    "height": 0.7
  },
  "photoType": "person-wearing|flat-lay|mannequin|unknown",
  "confidence": 0.95
}

Important:
- boundingBox should frame the GARMENT ONLY (not the entire person)
- x, y are top-left corner (normalized 0-1)
- width, height are dimensions (normalized 0-1)
- If no person, set hasHuman: false and photoType: "flat-lay"

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
      console.log('✅ [PERSON-DETECT] Detection complete:', {
        hasHuman: parsed.hasHuman,
        garmentType: parsed.garmentType,
        photoType: parsed.photoType
      });

      return {
        hasHuman: parsed.hasHuman || false,
        garmentType: parsed.garmentType,
        boundingBox: parsed.boundingBox,
        photoType: parsed.photoType || 'unknown',
        confidence: parsed.confidence || 0.8
      };

    } catch (error) {
      console.error('❌ [PERSON-DETECT] Detection failed:', error);
      
      // Return default (assume flat-lay)
      return {
        hasHuman: false,
        photoType: 'unknown',
        confidence: 0
      };
    }
  }

  /**
   * Crop image to garment bounding box
   */
  private async cropToGarment(
    imageUrl: string,
    boundingBox: { x: number; y: number; width: number; height: number }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Could not get canvas context');
          }

          // Add 5% padding to ensure we capture full garment
          const padding = 0.05;
          
          // Calculate pixel coordinates with padding
          let sourceX = (boundingBox.x - padding * boundingBox.width) * img.width;
          let sourceY = (boundingBox.y - padding * boundingBox.height) * img.height;
          let sourceWidth = boundingBox.width * (1 + 2 * padding) * img.width;
          let sourceHeight = boundingBox.height * (1 + 2 * padding) * img.height;

          // Clamp to image bounds
          sourceX = Math.max(0, sourceX);
          sourceY = Math.max(0, sourceY);
          sourceWidth = Math.min(img.width - sourceX, sourceWidth);
          sourceHeight = Math.min(img.height - sourceY, sourceHeight);

          console.log('✂️ [CROP] Cropping garment area:', {
            original: boundingBox,
            pixels: { x: sourceX, y: sourceY, w: sourceWidth, h: sourceHeight }
          });

          // Set canvas size to cropped dimensions
          canvas.width = sourceWidth;
          canvas.height = sourceHeight;

          // Draw cropped portion
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            sourceWidth,
            sourceHeight
          );

          // Convert to data URL
          const croppedDataUrl = canvas.toDataURL('image/png');
          resolve(croppedDataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for cropping'));
      img.src = imageUrl;
    });
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
export const garmentExtractionService = new GarmentExtractionService();
export default garmentExtractionService;
