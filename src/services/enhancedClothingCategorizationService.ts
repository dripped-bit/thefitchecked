/**
 * Enhanced Clothing Categorization Service
 * Advanced AI categorization with brand detection, price estimation, and detailed descriptions
 */

import apiConfig from '../config/apiConfig';
import { ClothingCategory } from './closetService';

export interface EnhancedCategorizationResult {
  // Basic info
  itemName: string;
  clothingType: string;
  category: ClothingCategory;
  
  // Brand & pricing
  brand?: string;
  brandConfidence: number;
  estimatedPrice?: {
    min: number;
    max: number;
    currency: string;
    confidence: number;
  };
  
  // Detailed description
  description: string;
  attributes: {
    color: string;
    secondaryColors?: string[];
    material?: string;
    style: string;
    fit?: string;
    pattern?: string;
    season: string[];
    occasion: string[];
  };
  
  // Metadata
  confidence: number;
  method: 'ai' | 'heuristic' | 'default';
  error?: string;
}

class EnhancedClothingCategorizationService {
  private readonly API_BASE = apiConfig.getEndpoint('/api/claude/v1/messages');
  private cache = new Map<string, EnhancedCategorizationResult>();

  /**
   * Categorize clothing with enhanced details (brand, price, description)
   */
  async categorizeWithDetails(imageUrl: string): Promise<EnhancedCategorizationResult> {
    console.log('👔 [ENHANCED-CAT] Starting enhanced categorization');

    // Check cache
    const cached = this.cache.get(imageUrl);
    if (cached) {
      console.log('💾 [ENHANCED-CAT] Using cached result');
      return cached;
    }

    try {
      // Try AI categorization
      const aiResult = await this.categorizeWithAI(imageUrl);
      
      // Cache successful result
      this.cache.set(imageUrl, aiResult);
      
      return aiResult;

    } catch (error) {
      console.error('❌ [ENHANCED-CAT] AI categorization failed:', error);
      
      // Fallback to basic categorization
      return this.getFallbackCategorization();
    }
  }

  /**
   * Categorize using Claude Vision API with enhanced prompts
   */
  private async categorizeWithAI(imageUrl: string): Promise<EnhancedCategorizationResult> {
    console.log('🤖 [ENHANCED-CAT] Calling Claude Vision API...');

    // Convert image to base64
    const base64Image = await this.imageToBase64(imageUrl);
    const mediaType = this.detectMediaType(imageUrl);

    const requestBody = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
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
              text: `Analyze this clothing item in comprehensive detail:

1. ITEM IDENTIFICATION:
   - Create a descriptive name (include brand if visible on logos/labels)
   - Specify exact clothing type (e.g., "button-down oxford shirt" not just "shirt")
   - Assign category: tops|bottoms|dresses|shoes|accessories|outerwear|jackets|sweaters|skirts|shirts|pants

2. BRAND DETECTION:
   - Look carefully for visible logos, labels, tags, or distinctive brand design elements
   - If brand identifiable, provide name and confidence (0.0-1.0)
   - Common brands: Nike, Adidas, Ralph Lauren, Levi's, H&M, Zara, Gucci, etc.

3. PRICE ESTIMATION (USD):
   - Estimate based on: brand recognition, material quality, construction, design complexity
   - Luxury brands (Gucci, Prada): $500-3000+
   - Premium brands (Ralph Lauren, Tommy Hilfiger): $100-500
   - Mid-range (Levi's, Nike, Adidas): $50-200
   - Fast fashion (H&M, Zara, Forever 21): $20-80
   - Provide confidence score for estimate

4. DETAILED DESCRIPTION:
   - Primary color and any secondary colors
   - Material/fabric (cotton, polyester, denim, leather, wool, silk, etc.)
   - Style (casual, formal, athletic, business, streetwear, vintage)
   - Fit (slim, regular, loose, oversized, fitted, relaxed)
   - Pattern (solid, striped, plaid, floral, geometric, printed)
   - Notable features (buttons, pockets, zippers, collar type, sleeve length)
   - Best seasons (spring, summer, fall, winter)
   - Suitable occasions (casual, work, formal, athletic, evening)

Return ONLY valid JSON:
{
  "itemName": "Ralph Lauren Blue Oxford Button-Down Shirt",
  "clothingType": "button-down oxford shirt",
  "category": "tops",
  "brand": "Ralph Lauren",
  "brandConfidence": 0.85,
  "estimatedPrice": {
    "min": 80,
    "max": 150,
    "currency": "USD",
    "confidence": 0.75
  },
  "description": "Classic blue Oxford cotton button-down shirt with long sleeves and button cuffs. Features a traditional button-down collar, single chest pocket with button closure, and curved hem. The Oxford weave fabric provides durability and breathability. Perfect for business casual or smart casual occasions.",
  "attributes": {
    "color": "blue",
    "secondaryColors": ["white"],
    "material": "cotton",
    "style": "casual",
    "fit": "regular fit",
    "pattern": "solid",
    "season": ["spring", "summer", "fall"],
    "occasion": ["casual", "business casual", "work"]
  },
  "confidence": 0.90
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
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
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
    console.log('✅ [ENHANCED-CAT] Claude analysis complete:', {
      itemName: parsed.itemName,
      brand: parsed.brand,
      priceRange: parsed.estimatedPrice ? `$${parsed.estimatedPrice.min}-${parsed.estimatedPrice.max}` : 'N/A'
    });

    // Map category to closet format
    const mappedCategory = this.mapToClosetCategory(parsed.category);

    return {
      itemName: parsed.itemName || 'Unknown Item',
      clothingType: parsed.clothingType || 'clothing',
      category: mappedCategory,
      brand: parsed.brand,
      brandConfidence: parsed.brandConfidence || 0,
      estimatedPrice: parsed.estimatedPrice,
      description: parsed.description || '',
      attributes: {
        color: parsed.attributes?.color || 'unknown',
        secondaryColors: parsed.attributes?.secondaryColors || [],
        material: parsed.attributes?.material,
        style: parsed.attributes?.style || 'casual',
        fit: parsed.attributes?.fit,
        pattern: parsed.attributes?.pattern,
        season: parsed.attributes?.season || ['all'],
        occasion: parsed.attributes?.occasion || ['casual']
      },
      confidence: parsed.confidence || 0.85,
      method: 'ai'
    };
  }

  /**
   * Map AI category to closet storage categories
   */
  private mapToClosetCategory(aiCategory: string): ClothingCategory {
    const categoryMap: Record<string, ClothingCategory> = {
      'tops': 'tops',
      'bottoms': 'pants',
      'pants': 'pants',
      'shirts': 'shirts',
      'dresses': 'dresses',
      'shoes': 'shoes',
      'accessories': 'accessories',
      'outerwear': 'outerwear',
      'jackets': 'jackets',
      'sweaters': 'sweaters',
      'skirts': 'skirts',
      'other': 'other'
    };

    return categoryMap[aiCategory.toLowerCase()] || 'other';
  }

  /**
   * Fallback categorization when AI fails
   */
  private getFallbackCategorization(): EnhancedCategorizationResult {
    return {
      itemName: 'Clothing Item',
      clothingType: 'garment',
      category: 'other',
      brandConfidence: 0,
      description: 'No detailed information available',
      attributes: {
        color: 'unknown',
        style: 'casual',
        season: ['all'],
        occasion: ['casual']
      },
      confidence: 0.5,
      method: 'default',
      error: 'AI categorization failed'
    };
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

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 [ENHANCED-CAT] Cache cleared');
  }
}

// Export singleton
export const enhancedClothingCategorizationService = new EnhancedClothingCategorizationService();
export default enhancedClothingCategorizationService;
