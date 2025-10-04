/**
 * Multi-Item Detection Service
 * Detects multiple clothing items in a single image and splits them into separate items
 * Uses Claude Vision API for intelligent detection and bounding box extraction
 */

export interface DetectedItem {
  name: string;
  category: string;
  boundingBox: {
    x: number;      // Normalized 0-1
    y: number;      // Normalized 0-1
    width: number;  // Normalized 0-1
    height: number; // Normalized 0-1
  };
  croppedImageUrl?: string;
  confidence: number;
}

export interface MultiItemDetectionResult {
  hasMultipleItems: boolean;
  itemCount: number;
  items: DetectedItem[];
  originalImageUrl: string;
  error?: string;
}

class MultiItemDetectionService {
  private readonly API_BASE = '/api/claude/v1/messages';

  /**
   * Detect if image contains multiple clothing items
   */
  async detectMultipleItems(imageUrl: string): Promise<MultiItemDetectionResult> {
    try {
      console.log('🔍 [MULTI-ITEM-V2] Starting enhanced multi-item detection (outfit photos + flat-lays)...');

      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUrl);
      const mediaType = this.detectMediaType(imageUrl);

      // Call Claude Vision to detect multiple items (V2: now handles outfit photos)
      const detectionResult = await this.analyzeWithClaude(base64Image, mediaType);

      if (!detectionResult.hasMultipleItems || detectionResult.items.length <= 1) {
        console.log('ℹ️ [MULTI-ITEM-V2] Single item detected, no splitting needed');
        return {
          hasMultipleItems: false,
          itemCount: detectionResult.items.length,
          items: detectionResult.items,
          originalImageUrl: imageUrl
        };
      }

      // Crop each detected item from the original image
      console.log(`✂️ [MULTI-ITEM-V2] Cropping ${detectionResult.items.length} items...`);
      const itemsWithCrops = await Promise.all(
        detectionResult.items.map(async (item) => ({
          ...item,
          croppedImageUrl: await this.cropImage(imageUrl, item.boundingBox)
        }))
      );

      console.log(`✅ [MULTI-ITEM-V2] Successfully detected and cropped ${itemsWithCrops.length} items:`, itemsWithCrops.map(i => `${i.name} (${i.category})`));

      return {
        hasMultipleItems: true,
        itemCount: itemsWithCrops.length,
        items: itemsWithCrops,
        originalImageUrl: imageUrl
      };

    } catch (error) {
      console.error('❌ [MULTI-ITEM] Detection failed:', error);
      return {
        hasMultipleItems: false,
        itemCount: 1,
        items: [],
        originalImageUrl: imageUrl,
        error: error instanceof Error ? error.message : 'Detection failed'
      };
    }
  }

  /**
   * Analyze image with Claude Vision to detect multiple items
   */
  private async analyzeWithClaude(
    base64Image: string,
    mediaType: string
  ): Promise<{ hasMultipleItems: boolean; items: DetectedItem[] }> {
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
              text: `Analyze this image and detect all individual clothing items. This includes BOTH:
1. Flat-lay photos with items laid out separately
2. Outfit photos where a person is wearing multiple garments

DETECTION RULES:
✅ DETECT separate items when you see:
- Person wearing shirt + pants/skirt/shorts (split into 2+ items)
- Person wearing outfit with shoes visible (include shoes as separate item)
- Person wearing accessories (bags, hats, jewelry - separate items)
- Flat-lay photo with multiple items laid out
- Items photographed side-by-side

❌ TREAT AS SINGLE ITEM only when:
- One-piece garment (dress, jumpsuit, romper) with NO other visible items
- Only outerwear visible (coat covering everything)
- Single item only (just a shirt, just shoes, etc.)

BOUNDING BOX INSTRUCTIONS - VERY IMPORTANT:
📐 Frame the COMPLETE garment from top edge to bottom edge:
- For TOPS: Include neckline/shoulders → bottom hem (full shirt/blouse)
- For BOTTOMS (pants/skirts/shorts): Include waistline → bottom hem (full garment, not just lower portion)
- For SHOES: Include entire shoe from top to sole
- For DRESSES: Include neckline → bottom hem
- The bounding box should tightly frame the ENTIRE visible garment, centered on the garment itself

For each detected garment piece, provide its bounding box. Return ONLY valid JSON:

{
  "hasMultipleItems": true/false,
  "items": [
    {
      "name": "Item description (e.g., Pink Tank Top, Denim Skirt)",
      "category": "tops|pants|dresses|skirts|shoes|accessories|outerwear|sweaters|other",
      "boundingBox": {
        "x": 0.1,     // Left edge (0-1, normalized to image)
        "y": 0.2,     // Top edge (0-1, normalized to image)
        "width": 0.4, // Width (0-1, normalized to image)
        "height": 0.5 // Height (0-1, normalized to image)
      },
      "confidence": 0.9
    }
  ]
}

EXAMPLES:
- Photo of person wearing tank top + skirt → hasMultipleItems: true, 2 items (top, skirt)
- Photo of person wearing dress only → hasMultipleItems: false, 1 item
- Flat-lay with shirt and shorts → hasMultipleItems: true, 2 items
- Person wearing complete outfit with shoes → hasMultipleItems: true, 3+ items

Return ONLY the JSON object, no additional text.`
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
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.content?.[0]?.text;

    if (!content) {
      throw new Error('No content in Claude response');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('🤖 [MULTI-ITEM-V2] Claude analysis result:', parsed);

    return {
      hasMultipleItems: parsed.hasMultipleItems || false,
      items: parsed.items || []
    };
  }

  /**
   * Crop image based on bounding box coordinates
   */
  private async cropImage(
    imageUrl: string,
    boundingBox: { x: number; y: number; width: number; height: number }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // Create canvas for cropping
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Could not get canvas context');
          }

          // Add 10% padding to ensure we capture full garment
          const padding = 0.1; // 10% padding in all directions

          // Calculate pixel coordinates from normalized values with padding
          let sourceX = (boundingBox.x - padding * boundingBox.width) * img.width;
          let sourceY = (boundingBox.y - padding * boundingBox.height) * img.height;
          let sourceWidth = boundingBox.width * (1 + 2 * padding) * img.width;
          let sourceHeight = boundingBox.height * (1 + 2 * padding) * img.height;

          // Clamp to image bounds to prevent overflow
          sourceX = Math.max(0, sourceX);
          sourceY = Math.max(0, sourceY);
          sourceWidth = Math.min(img.width - sourceX, sourceWidth);
          sourceHeight = Math.min(img.height - sourceY, sourceHeight);

          console.log('✂️ [CROP] Applying bounds with 10% padding:', {
            original: { x: boundingBox.x, y: boundingBox.y, w: boundingBox.width, h: boundingBox.height },
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

      img.onerror = () => {
        reject(new Error('Failed to load image for cropping'));
      };

      img.src = imageUrl;
    });
  }

  /**
   * Convert image to base64
   * Normalizes all formats (AVIF, WebP, etc.) to PNG for Claude API compatibility
   */
  private async imageToBase64(imageUrl: string): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('Could not get canvas context');
            }

            ctx.drawImage(img, 0, 0);

            // Convert to PNG base64 (removes data:image/png;base64, prefix)
            const dataUrl = canvas.toDataURL('image/png');
            const base64Data = dataUrl.split(',')[1];

            resolve(base64Data);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error('Failed to load image for base64 conversion'));
        };

        img.src = imageUrl;
      });
    } catch (error) {
      console.error('❌ Image to base64 conversion failed:', error);
      throw error;
    }
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

// Export singleton instance
export const multiItemDetectionService = new MultiItemDetectionService();
export default multiItemDetectionService;
