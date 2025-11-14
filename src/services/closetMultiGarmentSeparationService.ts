/**
 * Closet Multi-Garment Separation Service
 * Detects and separates multiple garments in a single upload for closet
 * Different from multiItemDetectionService which is for try-on
 */

import apiConfig from '../config/apiConfig';
import birefnetBackgroundRemovalService from './birefnetBackgroundRemovalService';
import enhancedClothingCategorizationService, { EnhancedCategorizationResult } from './enhancedClothingCategorizationService';

export interface DetectedGarmentItem {
  name: string;
  type: string;
  boundingBox: {
    x: number; // Normalized 0-1
    y: number; // Normalized 0-1
    width: number; // Normalized 0-1
    height: number; // Normalized 0-1
  };
  confidence: number;
}

export interface SeparatedGarmentItem {
  croppedImageUrl: string;
  cleanedImageUrl: string; // After background removal
  categorization: EnhancedCategorizationResult;
  originalBoundingBox: DetectedGarmentItem['boundingBox'];
}

export interface MultiGarmentSeparationResult {
  success: boolean;
  hasMultipleItems: boolean;
  itemCount: number;
  items: SeparatedGarmentItem[];
  originalImageUrl: string;
  error?: string;
}

class ClosetMultiGarmentSeparationService {
  private readonly API_BASE = apiConfig.getEndpoint('/api/claude/v1/messages');

  /**
   * Detect and separate multiple garments from single image
   */
  async separateGarments(imageUrl: string): Promise<MultiGarmentSeparationResult> {
    console.log('📦 [MULTI-GARMENT] Starting multi-garment separation');

    try {
      // Step 1: Detect multiple items
      const detection = await this.detectMultipleGarments(imageUrl);
      console.log(`🔍 [MULTI-GARMENT] Detected ${detection.items.length} items`);

      if (!detection.hasMultipleItems || detection.items.length <= 1) {
        console.log('ℹ️ [MULTI-GARMENT] Single item or no items detected');
        return {
          success: true,
          hasMultipleItems: false,
          itemCount: detection.items.length,
          items: [],
          originalImageUrl: imageUrl
        };
      }

      // Step 2: Process each garment in parallel
      console.log(`⚙️ [MULTI-GARMENT] Processing ${detection.items.length} garments...`);
      
      const processedItems = await Promise.all(
        detection.items.map((item, index) => 
          this.processIndividualGarment(imageUrl, item, index + 1, detection.items.length)
        )
      );

      // Filter out any failed items
      const successfulItems = processedItems.filter(item => item !== null) as SeparatedGarmentItem[];

      console.log(`✅ [MULTI-GARMENT] Successfully processed ${successfulItems.length}/${detection.items.length} items`);

      return {
        success: true,
        hasMultipleItems: true,
        itemCount: successfulItems.length,
        items: successfulItems,
        originalImageUrl: imageUrl
      };

    } catch (error) {
      console.error('❌ [MULTI-GARMENT] Separation failed:', error);
      return {
        success: false,
        hasMultipleItems: false,
        itemCount: 0,
        items: [],
        originalImageUrl: imageUrl,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Detect multiple garments using Claude Vision
   */
  private async detectMultipleGarments(imageUrl: string): Promise<{
    hasMultipleItems: boolean;
    items: DetectedGarmentItem[];
  }> {
    console.log('🔍 [MULTI-DETECT] Detecting multiple garments...');

    try {
      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUrl);
      const mediaType = this.detectMediaType(imageUrl);

      const requestBody = {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
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
                text: `Analyze this image for multiple clothing items that should be added to a closet.

Your task:
1. Identify EACH separate, distinct clothing item visible
2. For EACH item, provide:
   - Descriptive name
   - Garment type
   - Bounding box (normalized 0-1 coordinates)
   - Confidence score

Rules:
- Only detect actual clothing garments (not accessories like bags, jewelry, watches)
- Each item should be a separate piece (shirt, pants, jacket, shoes, etc.)
- Provide bounding box that tightly frames just that garment
- If items overlap, provide best estimate for individual boxes

Return ONLY valid JSON:
{
  "hasMultipleItems": true/false,
  "items": [
    {
      "name": "Blue Denim Jacket",
      "type": "jacket",
      "boundingBox": {
        "x": 0.1,
        "y": 0.2,
        "width": 0.4,
        "height": 0.5
      },
      "confidence": 0.95
    },
    {
      "name": "White T-Shirt",
      "type": "shirt",
      "boundingBox": {
        "x": 0.5,
        "y": 0.2,
        "width": 0.4,
        "height": 0.4
      },
      "confidence": 0.90
    }
  ]
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
      console.log('✅ [MULTI-DETECT] Detection complete:', {
        hasMultiple: parsed.hasMultipleItems,
        itemCount: parsed.items?.length || 0
      });

      return {
        hasMultipleItems: parsed.hasMultipleItems || false,
        items: parsed.items || []
      };

    } catch (error) {
      console.error('❌ [MULTI-DETECT] Detection failed:', error);
      return {
        hasMultipleItems: false,
        items: []
      };
    }
  }

  /**
   * Process individual garment (crop, clean, categorize)
   */
  private async processIndividualGarment(
    originalImageUrl: string,
    item: DetectedGarmentItem,
    index: number,
    total: number
  ): Promise<SeparatedGarmentItem | null> {
    console.log(`⚙️ [PROCESS-${index}/${total}] Processing ${item.name}...`);

    try {
      // Step 1: Crop to individual box
      console.log(`✂️ [PROCESS-${index}/${total}] Cropping...`);
      const croppedImageUrl = await this.cropToBox(originalImageUrl, item.boundingBox);

      // Step 2: Remove background
      console.log(`🎨 [PROCESS-${index}/${total}] Removing background...`);
      const cleaned = await birefnetBackgroundRemovalService.removeBackground(croppedImageUrl, {
        model: "General Use (Light)",
        operating_resolution: "2048x2048",
        refine_foreground: true,
        output_format: "png"
      });

      if (!cleaned.success || !cleaned.imageUrl) {
        throw new Error('Background removal failed');
      }

      // Step 3: Enhanced categorization
      console.log(`📋 [PROCESS-${index}/${total}] Categorizing...`);
      const categorization = await enhancedClothingCategorizationService.categorizeWithDetails(
        cleaned.imageUrl
      );

      console.log(`✅ [PROCESS-${index}/${total}] Complete: ${categorization.itemName}`);

      return {
        croppedImageUrl,
        cleanedImageUrl: cleaned.imageUrl,
        categorization,
        originalBoundingBox: item.boundingBox
      };

    } catch (error) {
      console.error(`❌ [PROCESS-${index}/${total}] Failed:`, error);
      return null;
    }
  }

  /**
   * Crop image to bounding box
   */
  private async cropToBox(
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

          // Add 10% padding
          const padding = 0.1;
          
          let sourceX = (boundingBox.x - padding * boundingBox.width) * img.width;
          let sourceY = (boundingBox.y - padding * boundingBox.height) * img.height;
          let sourceWidth = boundingBox.width * (1 + 2 * padding) * img.width;
          let sourceHeight = boundingBox.height * (1 + 2 * padding) * img.height;

          // Clamp to image bounds
          sourceX = Math.max(0, sourceX);
          sourceY = Math.max(0, sourceY);
          sourceWidth = Math.min(img.width - sourceX, sourceWidth);
          sourceHeight = Math.min(img.height - sourceY, sourceHeight);

          canvas.width = sourceWidth;
          canvas.height = sourceHeight;

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

          const croppedDataUrl = canvas.toDataURL('image/png');
          resolve(croppedDataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
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
export const closetMultiGarmentSeparationService = new ClosetMultiGarmentSeparationService();
export default closetMultiGarmentSeparationService;
