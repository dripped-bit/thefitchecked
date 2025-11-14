/**
 * Multi-Item Detection Service
 * Detects multiple clothing items in a single image and splits them into separate items
 * Uses Claude Vision API for intelligent detection and bounding box extraction
 */

import apiConfig from '../config/apiConfig';

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
  validationResult?: {
    isValid: boolean;
    confidence: number;
    detectedItem: string;
    expectedItem: string;
    issues: string[];
    suggestions: string[];
  };
}

export interface MultiItemDetectionResult {
  hasMultipleItems: boolean;
  itemCount: number;
  items: DetectedItem[];
  originalImageUrl: string;
  error?: string;
}

class MultiItemDetectionService {
  private readonly API_BASE = apiConfig.getEndpoint('/api/claude/v1/messages');

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

      // NEW: Validate each cropped image to ensure it contains the expected item
      console.log('🔍 [MULTI-ITEM-V2] Validating cropped images...');
      const { cropValidationService } = await import('./cropValidationService');
      
      const validatedItems = await Promise.all(
        itemsWithCrops.map(async (item) => {
          const validation = await cropValidationService.validateCroppedItem(
            item.croppedImageUrl!,
            item.name,
            item.category
          );

          if (!validation.isValid) {
            console.warn(`⚠️ [CROP-VALIDATE] Item "${item.name}" failed validation:`, {
              expected: item.name,
              detected: validation.detectedItem,
              issues: validation.issues,
              suggestions: validation.suggestions
            });
          }

          return {
            ...item,
            validationResult: validation
          };
        })
      );

      // Filter out items that failed validation with low confidence
      const validItems = validatedItems.filter(item => {
        if (!item.validationResult.isValid && item.validationResult.confidence < 0.3) {
          console.warn(`❌ [MULTI-ITEM-V2] Excluding "${item.name}" - validation confidence too low (${item.validationResult.confidence})`);
          return false;
        }
        return true;
      });

      if (validItems.length === 0) {
        console.warn('⚠️ [MULTI-ITEM-V2] All items failed validation - falling back to original image');
        return {
          hasMultipleItems: false,
          itemCount: 1,
          items: [],
          originalImageUrl: imageUrl
        };
      }

      console.log(`✅ [MULTI-ITEM-V2] ${validItems.length}/${itemsWithCrops.length} items passed validation`);

      return {
        hasMultipleItems: true,
        itemCount: validItems.length,
        items: validItems,
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

⚠️ CRITICAL - BOUNDING BOX ACCURACY:
Each item's bounding box MUST frame THAT EXACT item! Common mistake: providing boxes in wrong order.

STEP 1: Identify items by their SPATIAL POSITION (top to bottom):
- TOP AREA (y: 0.0-0.35): Upper garment (crop top, shirt, blouse, tank top)
- MIDDLE AREA (y: 0.3-0.65): Lower garment (skirt, pants, shorts)
- BOTTOM AREA (y: 0.6-1.0): Footwear (shoes, sneakers, boots)

STEP 2: For EACH item, ensure bounding box frames ONLY that specific garment:
- "White Crop Top" → box must frame the TOP/SHIRT (upper body area)
- "White Mini Skirt" → box must frame the SKIRT (waist to mid-thigh area)
- "White Sneakers" → box must frame the SHOES (foot area only)

📐 Bounding box requirements:
- TOPS: Frame neckline → bottom hem (shoulders to waist)
- BOTTOMS: Frame waistline → hem (waist to knees/ankles, NOT legs)
- SHOES: Frame entire shoe (NOT the leg, just the footwear)
- Box should be CENTERED on the garment, tightly framed

CATEGORY RULES:
- Tops/Shirts/Blouses/Tank Tops → "tops"
- Pants/Skirts/Shorts → "pants"
- Dresses/Jumpsuits → "dresses"
- Keep NAME descriptive (e.g., "White Crop Top", "White Mini Skirt")

For each detected garment piece, provide its bounding box. Return ONLY valid JSON:

{
  "hasMultipleItems": true/false,
  "items": [
    {
      "name": "Item description (e.g., Pink Tank Top, White Skirt, Blue Shorts)",
      "category": "tops|pants|dresses|shoes|accessories|outerwear|sweaters|other",
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

EXAMPLE - Person wearing crop top + skirt + sneakers:
{
  "hasMultipleItems": true,
  "items": [
    {
      "name": "White Crop Top",
      "category": "tops",
      "boundingBox": { "x": 0.2, "y": 0.1, "width": 0.6, "height": 0.25 },  ← TOP area (shoulders to waist)
      "confidence": 0.95
    },
    {
      "name": "White Mini Skirt",
      "category": "pants",
      "boundingBox": { "x": 0.2, "y": 0.35, "width": 0.6, "height": 0.2 }, ← MIDDLE area (waist to mid-thigh)
      "confidence": 0.95
    },
    {
      "name": "White Sneakers",
      "category": "shoes",
      "boundingBox": { "x": 0.25, "y": 0.75, "width": 0.5, "height": 0.2 }, ← BOTTOM area (feet only)
      "confidence": 0.95
    }
  ]
}

⚠️ VERIFY: Each bounding box must correspond to its item name!

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
            pixels: { x: sourceX, y: sourceY, w: sourceWidth, h: sourceHeight },
            imageSize: { width: img.width, height: img.height }
          });

          // Visual debugging: Draw bounding box overlay for inspection
          if (process.env.NODE_ENV === 'development') {
            this.debugDrawBoundingBox(img, sourceX, sourceY, sourceWidth, sourceHeight);
          }

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
   * Visual debugging: Draw bounding box overlay for inspection
   * Creates a visual representation of the crop area for debugging
   */
  private debugDrawBoundingBox(
    img: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const debugCanvas = document.createElement('canvas');
    debugCanvas.width = img.width;
    debugCanvas.height = img.height;
    const ctx = debugCanvas.getContext('2d');

    if (!ctx) return;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Draw bounding box overlay
    ctx.strokeStyle = '#00FF00'; // Green
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);

    // Add crosshairs at center
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    ctx.strokeStyle = '#FF0000'; // Red
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 20, centerY);
    ctx.lineTo(centerX + 20, centerY);
    ctx.moveTo(centerX, centerY - 20);
    ctx.lineTo(centerX, centerY + 20);
    ctx.stroke();

    // Log the debug image
    const debugUrl = debugCanvas.toDataURL('image/png');
    console.log('🎨 [DEBUG-CROP] Bounding box visualization (green box = crop area):');
    console.log('%c ', `
      padding: 100px 200px;
      background: url(${debugUrl}) no-repeat center;
      background-size: contain;
      font-size: 0;
    `);
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
