/**
 * Outfit Scan Service
 * Uses Claude Vision API to identify all clothing items visible in an outfit photo
 * Matches detected items against user's closet for wear tracking
 */

import { CapacitorHttp } from '@capacitor/core';
import { ClothingItem } from './closetService';

export interface ScannedItem {
  name: string;
  category: string;
  color: string;
  description: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface OutfitScanResult {
  success: boolean;
  items: ScannedItem[];
  totalItemsDetected: number;
  photoUrl: string;
  error?: string;
}

export interface MatchResult {
  scannedItem: ScannedItem;
  closetMatch: ClothingItem | null;
  matchConfidence: number; // 0-1
  matchReason: string;
}

class OutfitScanService {
  private readonly API_BASE = import.meta.env.DEV 
    ? '/api/claude/v1/messages' 
    : 'https://api.anthropic.com/v1/messages';
  private readonly IS_DEV = import.meta.env.DEV;
  private readonly CLAUDE_KEY = import.meta.env.VITE_CLAUDE_API_KEY || 
                                  import.meta.env.VITE_ANTHROPIC_API_KEY;

  /**
   * Scan outfit photo and identify all visible clothing items
   */
  async scanOutfitPhoto(imageUrl: string): Promise<OutfitScanResult> {
    console.log('📸 [OUTFIT-SCAN] Starting outfit photo analysis');

    try {
      // Resize image for Claude API
      const resizedImage = await this.resizeForClaude(imageUrl);
      const base64Image = resizedImage.split(',')[1];

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add auth headers for direct API calls (production/iOS)
      if (!this.IS_DEV) {
        if (this.CLAUDE_KEY) {
          headers['x-api-key'] = this.CLAUDE_KEY;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          throw new Error('Claude API key not configured');
        }
      }

      const requestBody = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{
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
              text: `Analyze this outfit photo and identify ALL visible clothing items the person is wearing.

CRITICAL: Be thorough and identify EVERY garment visible:
- Tops (shirts, t-shirts, blouses, sweaters, hoodies, jackets)
- Bottoms (pants, jeans, skirts, shorts, leggings)
- Dresses (if wearing a dress instead of separate top/bottom)
- Outerwear (coats, jackets, blazers, cardigans worn over other clothes)
- Shoes (sneakers, boots, heels, sandals, dress shoes)
- Accessories (bags, belts, hats, scarves, jewelry - if prominently visible)

For EACH item detected, provide:
1. **name**: Descriptive name (e.g., "White Cotton T-Shirt", "Blue Denim Jeans")
2. **category**: One of: tops, bottoms, dresses, outerwear, shoes, accessories
3. **color**: Primary color (e.g., "black", "blue", "white", "red")
4. **description**: Brief description including material, style, key features (1-2 sentences)
5. **confidence**: Your confidence in this detection (0.0 to 1.0)

IMPORTANT RULES:
- If wearing a dress, list it as category "dresses" (not separate top/bottom)
- If wearing jacket/cardigan OVER another top, list BOTH items separately
- Only include items you can actually see in the photo
- Be specific with colors and styles
- If uncertain about an item, still include it but with lower confidence

Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "name": "White Cotton T-Shirt",
      "category": "tops",
      "color": "white",
      "description": "Plain white cotton crew neck t-shirt with short sleeves",
      "confidence": 0.95
    },
    {
      "name": "Blue Denim Jeans",
      "category": "bottoms",
      "color": "blue",
      "description": "Classic blue denim jeans with straight leg fit",
      "confidence": 0.90
    }
  ]
}

NO additional text before or after the JSON. Just the JSON object.`
            }
          ]
        }]
      };

      let result;

      // Use native HTTP on iOS/production to bypass CORS
      if (!this.IS_DEV) {
        console.log('📱 [OUTFIT-SCAN] Using Capacitor native HTTP');
        const response = await CapacitorHttp.post({
          url: this.API_BASE,
          headers,
          data: requestBody
        });

        if (response.status !== 200) {
          throw new Error(`Claude API error: ${response.status}`);
        }

        result = response.data;
      } else {
        // Use regular fetch in development (uses proxy)
        console.log('💻 [OUTFIT-SCAN] Using fetch with proxy');
        const response = await fetch(this.API_BASE, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`Claude API error: ${response.status}`);
        }

        result = await response.json();
      }

      const content = result.content?.[0]?.text;
      if (!content) {
        throw new Error('No content in Claude response');
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const items: ScannedItem[] = parsed.items || [];

      console.log(`✅ [OUTFIT-SCAN] Detected ${items.length} items:`, 
        items.map(i => `${i.name} (${i.category})`));

      return {
        success: true,
        items,
        totalItemsDetected: items.length,
        photoUrl: imageUrl
      };

    } catch (error) {
      console.error('❌ [OUTFIT-SCAN] Failed:', error);
      return {
        success: false,
        items: [],
        totalItemsDetected: 0,
        photoUrl: imageUrl,
        error: error instanceof Error ? error.message : 'Outfit scan failed'
      };
    }
  }

  /**
   * Match scanned items to user's closet items
   */
  async matchItemsToCloset(
    scannedItems: ScannedItem[],
    closetItems: ClothingItem[]
  ): Promise<MatchResult[]> {
    console.log(`🔍 [OUTFIT-MATCH] Matching ${scannedItems.length} scanned items to ${closetItems.length} closet items`);

    const results: MatchResult[] = [];

    for (const scannedItem of scannedItems) {
      // Find potential matches
      const potentialMatches = closetItems.filter(closetItem => {
        // Must match category
        const categoryMatch = this.categoriesMatch(scannedItem.category, closetItem.category);
        return categoryMatch;
      });

      if (potentialMatches.length === 0) {
        // No match found
        results.push({
          scannedItem,
          closetMatch: null,
          matchConfidence: 0,
          matchReason: 'No items in this category found in closet'
        });
        continue;
      }

      // Score each potential match
      let bestMatch: ClothingItem | null = null;
      let bestScore = 0;
      let bestReason = '';

      for (const closetItem of potentialMatches) {
        let score = 0;
        const reasons: string[] = [];

        // Category match (already filtered, but adds confidence)
        score += 0.3;
        reasons.push('category match');

        // Color match (fuzzy)
        if (closetItem.attributes?.color) {
          const colorSimilarity = this.colorSimilarity(
            scannedItem.color,
            closetItem.attributes.color
          );
          score += colorSimilarity * 0.4;
          if (colorSimilarity > 0.7) {
            reasons.push('color match');
          }
        }

        // Name/description keyword match
        const nameSimilarity = this.textSimilarity(
          scannedItem.name + ' ' + scannedItem.description,
          closetItem.name + ' ' + (closetItem.description || '')
        );
        score += nameSimilarity * 0.3;
        if (nameSimilarity > 0.3) {
          reasons.push('description match');
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = closetItem;
          bestReason = reasons.join(', ');
        }
      }

      // Only consider it a match if confidence is above threshold
      const matchThreshold = 0.5;
      if (bestScore >= matchThreshold && bestMatch) {
        results.push({
          scannedItem,
          closetMatch: bestMatch,
          matchConfidence: bestScore,
          matchReason: bestReason
        });
        console.log(`✅ [OUTFIT-MATCH] Matched "${scannedItem.name}" → "${bestMatch.name}" (${Math.round(bestScore * 100)}%)`);
      } else {
        results.push({
          scannedItem,
          closetMatch: null,
          matchConfidence: bestScore,
          matchReason: 'Low confidence match - item may not be in closet'
        });
        console.log(`❓ [OUTFIT-MATCH] No confident match for "${scannedItem.name}" (best: ${Math.round(bestScore * 100)}%)`);
      }
    }

    return results;
  }

  /**
   * Check if two categories match (with fuzzy matching)
   */
  private categoriesMatch(category1: string, category2: string): boolean {
    const normalized1 = category1.toLowerCase().trim();
    const normalized2 = category2.toLowerCase().trim();

    if (normalized1 === normalized2) return true;

    // Category aliases
    const aliases: Record<string, string[]> = {
      'tops': ['shirts', 'top', 'shirt', 'blouse', 'sweater', 'hoodie'],
      'bottoms': ['pants', 'jeans', 'shorts', 'trousers', 'bottom'],
      'dresses': ['dress'],
      'outerwear': ['jacket', 'coat', 'blazer', 'cardigan', 'outerwear'],
      'shoes': ['shoe', 'footwear', 'boot', 'sneaker', 'heel'],
      'accessories': ['accessory', 'bag', 'belt', 'hat', 'scarf']
    };

    // Check if categories are aliases of each other
    for (const [main, aliasList] of Object.entries(aliases)) {
      if ((main === normalized1 || aliasList.includes(normalized1)) &&
          (main === normalized2 || aliasList.includes(normalized2))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate color similarity (0-1)
   */
  private colorSimilarity(color1: string, color2: string): number {
    const normalized1 = color1.toLowerCase().trim();
    const normalized2 = color2.toLowerCase().trim();

    if (normalized1 === normalized2) return 1.0;

    // Color synonyms
    const colorSynonyms: Record<string, string[]> = {
      'black': ['dark', 'charcoal', 'ebony'],
      'white': ['ivory', 'cream', 'off-white'],
      'gray': ['grey', 'silver', 'charcoal'],
      'blue': ['navy', 'cobalt', 'azure', 'denim'],
      'red': ['crimson', 'burgundy', 'wine', 'maroon'],
      'green': ['olive', 'forest', 'emerald'],
      'yellow': ['gold', 'mustard', 'lemon'],
      'pink': ['rose', 'blush', 'fuchsia'],
      'purple': ['violet', 'lavender', 'plum']
    };

    // Check if colors are synonyms
    for (const [main, synonyms] of Object.entries(colorSynonyms)) {
      if ((main === normalized1 || synonyms.includes(normalized1)) &&
          (main === normalized2 || synonyms.includes(normalized2))) {
        return 0.8;
      }
    }

    // Partial match (one color contains the other)
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return 0.6;
    }

    return 0.0;
  }

  /**
   * Calculate text similarity using simple keyword overlap (0-1)
   */
  private textSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

    if (words1.size === 0 || words2.size === 0) return 0;

    let matches = 0;
    for (const word of words1) {
      if (words2.has(word)) matches++;
    }

    return matches / Math.max(words1.size, words2.size);
  }

  /**
   * Resize image to under 5MB for Claude API
   */
  private async resizeForClaude(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Max 1024px on longest side
        let width = img.width;
        let height = img.height;
        const maxDimension = 1024;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with 85% quality
        const resized = canvas.toDataURL('image/jpeg', 0.85);
        
        const estimatedMB = (resized.length * 0.75) / 1024 / 1024;
        console.log(`✅ [RESIZE] Resized to ${width}x${height}, ~${estimatedMB.toFixed(2)}MB`);
        
        resolve(resized);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }
}

// Export singleton
export const outfitScanService = new OutfitScanService();
export default outfitScanService;
