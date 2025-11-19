/**
 * Clothing Categorization Service
 * Multi-level categorization with Claude Vision AI and intelligent fallbacks
 */

export interface CategorizationResult {
  success: boolean;
  category: string;
  subcategory?: string;
  color?: string;
  style?: string;
  season?: string;
  confidence: number;
  method: 'ai' | 'heuristic' | 'default';
  error?: string;
}

export interface LocalCategorizationMetadata {
  aspectRatio: number;
  dominantColor?: string;
  filenameHints: string[];
}

class ClothingCategorizationService {
  private static warningShown = false;

  /**
   * Main categorization method with multi-level fallback
   */
  async categorizeClothing(imageUrl: string, filename?: string): Promise<CategorizationResult> {
    console.log('👔 [CATEGORIZATION] Starting categorization for:', filename || imageUrl.substring(0, 50));

    // Level 1: Try Claude Vision API
    try {
      const aiResult = await this.categorizeWithAI(imageUrl);
      if (aiResult.success) {
        console.log('✅ [CATEGORIZATION] AI categorization successful');
        return aiResult;
      }
    } catch (error) {
      console.warn('⚠️ [CATEGORIZATION] AI categorization failed, trying fallback:', error);
    }

    // Level 2: Try heuristic categorization
    try {
      const heuristicResult = await this.categorizeWithHeuristics(imageUrl, filename);
      console.log('✅ [CATEGORIZATION] Heuristic categorization used');
      return heuristicResult;
    } catch (error) {
      console.warn('⚠️ [CATEGORIZATION] Heuristic categorization failed:', error);
    }

    // Level 3: Return default categorization
    console.log('⚠️ [CATEGORIZATION] Using default categorization');
    return this.getDefaultCategory();
  }

  /**
   * Categorize using Claude Vision API
   */
  private async categorizeWithAI(imageUrl: string): Promise<CategorizationResult> {
    const apiUrl = '/api/claude/v1/messages';

    try {
      console.log('🤖 [CATEGORIZATION-AI] Starting Claude Vision API call...');
      console.log('📍 [CATEGORIZATION-AI] Endpoint:', apiUrl);

      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUrl);
      console.log('📷 [CATEGORIZATION-AI] Image converted to base64, length:', base64Image.length);

      // Detect correct media type
      const mediaType = this.detectMediaType(imageUrl);
      console.log('🎨 [CATEGORIZATION-AI] Detected media type:', mediaType);

      const requestBody = {
        model: 'claude-haiku-4-5', // Cheaper, faster model for categorization
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
                text: `Analyze this clothing item and categorize it. Return ONLY valid JSON with these fields:
{
  "category": "tops|bottoms|dresses|shoes|accessories|outerwear|jackets|skirts|other",
  "subcategory": "specific type (e.g., t-shirt, jeans, sneakers, blazer)",
  "color": "primary color name",
  "style": "casual|formal|athletic|business|evening",
  "season": "spring|summer|fall|winter|all",
  "confidence": 0.95
}

Important: category must be one of: tops, bottoms, dresses, shoes, accessories, outerwear, jackets, skirts, other
Return ONLY the JSON object, no additional text.`
              }
            ]
          }
        ]
      };

      console.log('📤 [CATEGORIZATION-AI] Sending request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 [CATEGORIZATION-AI] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CATEGORIZATION-AI] API Error Response:', errorText);
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📦 [CATEGORIZATION-AI] API Response received:', {
        hasContent: !!result.content,
        contentLength: result.content?.length
      });

      const content = result.content?.[0]?.text;

      if (!content) {
        console.error('❌ [CATEGORIZATION-AI] No content in Claude response:', result);
        throw new Error('No content in Claude response');
      }

      console.log('📄 [CATEGORIZATION-AI] Content received:', content.substring(0, 200));

      // Extract JSON from response (Claude sometimes adds markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ [CATEGORIZATION-AI] No JSON found in response:', content);
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ [CATEGORIZATION-AI] Parsed result:', parsed);

      // Validate category
      const validCategories = ['tops', 'bottoms', 'dresses', 'shoes', 'accessories', 'outerwear', 'jackets', 'skirts', 'shirts', 'pants', 'other'];
      if (!validCategories.includes(parsed.category)) {
        console.warn(`⚠️ [CATEGORIZATION-AI] Invalid category "${parsed.category}", using "other"`);
        parsed.category = 'other';
      }

      console.log('✅ [CATEGORIZATION-AI] AI categorization successful:', {
        category: parsed.category,
        confidence: parsed.confidence
      });

      return {
        success: true,
        category: this.mapToClosetCategory(parsed.category),
        subcategory: parsed.subcategory,
        color: parsed.color,
        style: parsed.style,
        season: parsed.season,
        confidence: parsed.confidence || 0.85,
        method: 'ai'
      };

    } catch (error) {
      console.error('❌ [CATEGORIZATION-AI] Complete error details:', {
        error: error,
        message: error instanceof Error ? error.message : String(error),
        endpoint: apiUrl,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Map AI categories to closet storage categories
   * Fixes mismatch between Claude's output and closet structure
   */
  private mapToClosetCategory(aiCategory: string): string {
    const categoryMap: Record<string, string> = {
      'bottoms': 'pants',        // Claude says "bottoms" → Closet needs "pants"
      'tops': 'tops',            // Direct match
      'dresses': 'dresses',      // Direct match
      'shoes': 'shoes',          // Direct match
      'accessories': 'accessories', // Direct match
      'outerwear': 'outerwear',  // Direct match
      'jackets': 'jackets',      // Direct match
      'skirts': 'skirts',        // Direct match
      'shirts': 'tops',          // Map shirts to tops category
      'sweaters': 'sweaters',    // Direct match
      'pants': 'pants',          // Already correct
      'other': 'other'           // Direct match
    };

    const mappedCategory = categoryMap[aiCategory.toLowerCase()] || aiCategory;

    if (mappedCategory !== aiCategory) {
      console.log(`🔄 [CATEGORIZATION] Mapped "${aiCategory}" → "${mappedCategory}"`);
    }

    return mappedCategory;
  }

  /**
   * Categorize using local heuristics (filename, image analysis)
   */
  private async categorizeWithHeuristics(imageUrl: string, filename?: string): Promise<CategorizationResult> {
    const metadata = await this.analyzeImageLocally(imageUrl, filename);

    // Filename-based categorization
    let category = 'other';
    let subcategory = 'clothing';
    let confidence = 0.5;

    if (filename) {
      const name = filename.toLowerCase();
      const hints = metadata.filenameHints;

      // Check filename keywords (expanded for better coverage)
      if (name.includes('shirt') || name.includes('blouse') || name.includes('top') ||
          name.includes('tank') || name.includes('tee') || name.includes('cami') ||
          name.includes('sweater') || name.includes('hoodie') || hints.includes('shirt')) {
        category = 'tops';
        subcategory = 'shirt';
        confidence = 0.7;
      } else if (name.includes('pants') || name.includes('jeans') || name.includes('trouser') ||
                 name.includes('short') || name.includes('legging') || hints.includes('pants')) {
        category = 'bottoms';
        subcategory = 'pants';
        confidence = 0.7;
      } else if (name.includes('dress') || hints.includes('dress')) {
        category = 'dresses';
        subcategory = 'dress';
        confidence = 0.75;
      } else if (name.includes('skirt') || hints.includes('skirt')) {
        category = 'skirts';
        subcategory = 'skirt';
        confidence = 0.7;
      } else if (name.includes('shoe') || name.includes('sneaker') || name.includes('boot') ||
                 name.includes('heel') || name.includes('sandal') || hints.includes('shoes')) {
        category = 'shoes';
        subcategory = 'footwear';
        confidence = 0.7;
      } else if (name.includes('jacket') || name.includes('coat') || name.includes('blazer') || hints.includes('jacket')) {
        category = 'jackets';
        subcategory = 'jacket';
        confidence = 0.7;
      } else if (name.includes('accessory') || name.includes('bag') || name.includes('hat') ||
                 name.includes('scarf') || name.includes('belt') || hints.includes('accessories')) {
        category = 'accessories';
        subcategory = 'accessory';
        confidence = 0.6;
      }
    }

    // Image aspect ratio hints
    if (metadata.aspectRatio > 1.5 && category === 'other') {
      category = 'accessories';
      subcategory = 'wide item';
      confidence = Math.max(confidence, 0.4);
    } else if (metadata.aspectRatio < 0.6 && category === 'other') {
      category = 'dresses';
      subcategory = 'tall item';
      confidence = Math.max(confidence, 0.4);
    } else if (category === 'other') {
      category = 'tops';
      subcategory = 'general';
      confidence = 0.3;
    }

    const result = {
      success: true,
      category: this.mapToClosetCategory(category),
      subcategory,
      color: metadata.dominantColor || 'unknown',
      style: 'casual',
      season: 'all',
      confidence,
      method: 'heuristic'
    };

    console.log(`✅ [CATEGORIZATION-HEURISTIC] Detected: ${result.category} (${subcategory}) with ${Math.round(confidence * 100)}% confidence`);

    return result;
  }

  /**
   * Analyze image locally for metadata
   */
  private async analyzeImageLocally(imageUrl: string, filename?: string): Promise<LocalCategorizationMetadata> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const aspectRatio = img.width / img.height;

        // Extract filename hints
        const filenameHints: string[] = [];
        if (filename) {
          const name = filename.toLowerCase();
          ['shirt', 'pants', 'dress', 'skirt', 'shoes', 'jacket', 'accessories'].forEach(keyword => {
            if (name.includes(keyword)) {
              filenameHints.push(keyword);
            }
          });
        }

        // Try to extract dominant color (basic implementation)
        let dominantColor: string | undefined;
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = 50;
            canvas.height = 50;
            ctx.drawImage(img, 0, 0, 50, 50);
            const imageData = ctx.getImageData(0, 0, 50, 50);
            const pixels = imageData.data;

            // Simple dominant color extraction (average RGB)
            let r = 0, g = 0, b = 0;
            for (let i = 0; i < pixels.length; i += 4) {
              r += pixels[i];
              g += pixels[i + 1];
              b += pixels[i + 2];
            }
            const pixelCount = pixels.length / 4;
            r = Math.round(r / pixelCount);
            g = Math.round(g / pixelCount);
            b = Math.round(b / pixelCount);

            // Convert to color name (simplified)
            if (r > 200 && g > 200 && b > 200) dominantColor = 'white';
            else if (r < 50 && g < 50 && b < 50) dominantColor = 'black';
            else if (r > g && r > b) dominantColor = 'red';
            else if (g > r && g > b) dominantColor = 'green';
            else if (b > r && b > g) dominantColor = 'blue';
            else dominantColor = 'mixed';
          }
        } catch (error) {
          console.warn('Color extraction failed:', error);
        }

        resolve({
          aspectRatio,
          dominantColor,
          filenameHints
        });
      };

      img.onerror = () => {
        // Return defaults on error
        resolve({
          aspectRatio: 1.0,
          filenameHints: filename ? [filename.toLowerCase()] : []
        });
      };

      img.src = imageUrl;
    });
  }

  /**
   * Get default fallback category
   */
  private getDefaultCategory(): CategorizationResult {
    return {
      success: true,
      category: 'other',
      subcategory: 'uncategorized',
      color: 'unknown',
      style: 'casual',
      season: 'all',
      confidence: 0.1,
      method: 'default'
    };
  }

  /**
   * Detect image media type from data URL or file type
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

    // Default to PNG for safety (most common and widely supported)
    return 'image/png';
  }

  /**
   * Convert image to base64 for API calls
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

            console.log('✅ [CATEGORIZATION] Image converted to PNG base64, length:', base64Data.length);
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
   * Categorize in background without blocking
   */
  async categorizeLater(
    itemId: string,
    imageUrl: string,
    filename: string,
    updateCallback: (itemId: string, result: CategorizationResult) => void
  ): Promise<void> {
    // Run categorization asynchronously
    setTimeout(async () => {
      try {
        const result = await this.categorizeClothing(imageUrl, filename);
        console.log(`✅ [CATEGORIZATION] Background categorization complete for item ${itemId}`);
        updateCallback(itemId, result);
      } catch (error) {
        console.error(`❌ [CATEGORIZATION] Background categorization failed for item ${itemId}:`, error);
        // Call with default category on failure
        updateCallback(itemId, this.getDefaultCategory());
      }
    }, 100); // Small delay to ensure UI doesn't block
  }

  /**
   * Batch categorize multiple items
   */
  async categorizeBatch(items: Array<{ id: string; imageUrl: string; filename?: string }>): Promise<Map<string, CategorizationResult>> {
    const results = new Map<string, CategorizationResult>();

    // Process items in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks: typeof items[] = [];

    for (let i = 0; i < items.length; i += concurrencyLimit) {
      chunks.push(items.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (item) => {
        const result = await this.categorizeClothing(item.imageUrl, item.filename);
        results.set(item.id, result);
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Show one-time warning about categorization
   */
  showWarningOnce(message: string): void {
    if (!ClothingCategorizationService.warningShown) {
      console.warn(`⚠️ [CATEGORIZATION] ${message}`);
      ClothingCategorizationService.warningShown = true;
    }
  }
}

// Export singleton instance
export const clothingCategorizationService = new ClothingCategorizationService();
export default clothingCategorizationService;
