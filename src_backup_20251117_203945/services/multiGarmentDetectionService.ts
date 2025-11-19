/**
 * Multi-Garment Detection Service
 * Uses Claude Vision API to detect multiple clothing items in a single image
 * Enables intelligent batch try-on for outfit photos containing multiple garments
 */

export interface DetectedGarment {
  category: 'tops' | 'bottoms' | 'one-pieces' | 'outerwear';
  name: string;
  description: string;
  confidence: number;
  isFormalWear?: boolean; // True for suits, tuxedos, formal dresses
}

export interface MultiGarmentDetectionResult {
  success: boolean;
  garmentCount: number;
  garments: DetectedGarment[];
  suggestedOrder: string[]; // Order to apply garments (e.g., ['tops', 'bottoms'])
  isCompleteOutfit: boolean; // True if it's a coordinated outfit
  isSuit?: boolean; // True if it's a suit/tuxedo (jacket + pants)
  error?: string;
}

class MultiGarmentDetectionService {
  /**
   * Detect multiple garments in a single image using Claude Vision API
   */
  async detectMultipleGarments(
    imageUrl: string,
    userGender?: 'male' | 'female' | 'unspecified'
  ): Promise<MultiGarmentDetectionResult> {
    console.log('🔍 [MULTI-GARMENT] Starting garment detection...', {
      userGender: userGender || 'unspecified'
    });

    try {
      // Convert image to base64 if it's a URL
      const base64Image = await this.imageToBase64(imageUrl);

      // Call Claude Vision API for analysis
      const response = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: base64Image
                  }
                },
                {
                  type: 'text',
                  text: `Analyze this fashion/clothing image and detect ALL distinct garment items visible.

${userGender ? `USER GENDER: ${userGender.toUpperCase()}
${userGender === 'male' ? '- EXCLUDE dresses, skirts (these are not for male users)\n- INCLUDE suits, tuxedos, dress shirts, pants, jackets' : ''}
${userGender === 'female' ? '- INCLUDE dresses, skirts, blouses, suits, pants\n- Detect both formal and casual wear' : ''}
` : ''}
For EACH garment detected, provide:
1. Category: tops|bottoms|one-pieces|outerwear
2. Name: Specific item name (e.g., "white t-shirt", "blue denim shorts", "black suit jacket")
3. Description: Brief details (color, style, fabric)
4. Confidence: 0.0-1.0 how certain you are
5. isFormalWear: true if it's formal/business attire (suits, tuxedos, blazers, dress pants, formal dresses)

Important rules:
- If you see BOTH a shirt/top AND pants/shorts/skirt, list BOTH as separate items
- If you see a DRESS or JUMPSUIT, categorize as "one-pieces" (single item, not top+bottom)
- If you see JACKET/COAT over other clothes, list it as "outerwear" separate from what's underneath
- **SUIT DETECTION (CRITICAL)**: If you see a SUIT or TUXEDO (matching jacket + pants):
  * List jacket as "tops" with name like "black suit jacket" or "tuxedo jacket"
  * List pants as "bottoms" with name like "black dress pants" or "tuxedo pants"
  * Set isFormalWear: true for BOTH pieces
  * Set isSuit: true in the response
  * Ensure BOTH pieces are detected (jacket AND pants)
- Ignore accessories (bags, jewelry, shoes, ties, belts) - ONLY clothing garments
- If image contains just ONE garment, return single item
- If image contains MULTIPLE garments, return ALL of them

Respond ONLY with valid JSON in this exact format:
{
  "garments": [
    {
      "category": "tops",
      "name": "black suit jacket",
      "description": "formal single-breasted suit jacket in black",
      "confidence": 0.95,
      "isFormalWear": true
    },
    {
      "category": "bottoms",
      "name": "black dress pants",
      "description": "formal dress pants in black, part of suit",
      "confidence": 0.93,
      "isFormalWear": true
    }
  ],
  "suggestedOrder": ["tops", "bottoms"],
  "isCompleteOutfit": true,
  "isSuit": true
}

NO additional text, ONLY the JSON object.`
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const content = result.content?.[0]?.text;

      if (!content) {
        throw new Error('No response from Claude Vision API');
      }

      // Parse the JSON response
      let parsed: {
        garments: Array<{
          category: string;
          name: string;
          description: string;
          confidence: number;
          isFormalWear?: boolean;
        }>;
        suggestedOrder: string[];
        isCompleteOutfit: boolean;
        isSuit?: boolean;
      };

      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        console.error('❌ [MULTI-GARMENT] Failed to parse Claude response:', content);
        throw new Error('Invalid JSON response from Claude');
      }

      // Validate and map categories
      const validCategories = ['tops', 'bottoms', 'one-pieces', 'outerwear'];
      const garments: DetectedGarment[] = parsed.garments
        .filter(g => validCategories.includes(g.category))
        .map(g => ({
          category: g.category as DetectedGarment['category'],
          name: g.name,
          description: g.description,
          confidence: g.confidence,
          isFormalWear: g.isFormalWear
        }));

      console.log(`✅ [MULTI-GARMENT] Detected ${garments.length} garment(s):`, garments);
      if (parsed.isSuit) {
        console.log('🎩 [MULTI-GARMENT] Suit/Tuxedo detected!');
      }

      return {
        success: true,
        garmentCount: garments.length,
        garments: garments,
        suggestedOrder: parsed.suggestedOrder || garments.map(g => g.category),
        isCompleteOutfit: parsed.isCompleteOutfit || false,
        isSuit: parsed.isSuit || false
      };

    } catch (error) {
      console.error('❌ [MULTI-GARMENT] Detection failed:', error);
      return {
        success: false,
        garmentCount: 0,
        garments: [],
        suggestedOrder: [],
        isCompleteOutfit: false,
        isSuit: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert image URL or data URL to base64
   */
  private async imageToBase64(imageUrl: string): Promise<string> {
    try {
      // If already base64 data URL, extract the base64 part
      if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.split(',')[1];
        return base64Data;
      }

      // If it's a regular URL, fetch and convert
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ [MULTI-GARMENT] Failed to convert image to base64:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Check if an image likely contains multiple garments (quick heuristic check)
   * This is a faster pre-check before calling the full Claude Vision API
   */
  async quickCheckForMultipleGarments(imageUrl: string): Promise<boolean> {
    // For now, always assume possible multiple garments and do full detection
    // In the future, this could use a lightweight ML model for faster pre-screening
    return true;
  }

  /**
   * Get recommended try-on strategy for detected garments
   */
  getRecommendedStrategy(detectionResult: MultiGarmentDetectionResult): {
    shouldBatch: boolean;
    applicationOrder: string[];
    estimatedTime: number;
    reasoning: string;
  } {
    const { garmentCount, garments, suggestedOrder } = detectionResult;

    if (garmentCount === 1) {
      return {
        shouldBatch: false,
        applicationOrder: [garments[0].category],
        estimatedTime: 10,
        reasoning: 'Single garment detected - standard try-on'
      };
    }

    if (garmentCount === 2) {
      return {
        shouldBatch: true,
        applicationOrder: suggestedOrder,
        estimatedTime: 20,
        reasoning: `Multiple garments detected (${garments.map(g => g.name).join(' + ')}) - will apply sequentially`
      };
    }

    // 3+ garments
    return {
      shouldBatch: true,
      applicationOrder: suggestedOrder,
      estimatedTime: garmentCount * 10,
      reasoning: `Complex outfit with ${garmentCount} items - sequential layered try-on`
    };
  }

  /**
   * Get service status
   */
  isAvailable(): boolean {
    // Check if Claude API is available via proxy
    return true; // Using /api/claude proxy
  }
}

// Export singleton instance
export const multiGarmentDetectionService = new MultiGarmentDetectionService();
export default multiGarmentDetectionService;
