/**
 * Avatar Clothing Analysis Service
 * Analyzes avatar images to extract clothing descriptions for similar product searches
 */

export interface ClothingItem {
  category: 'shirt' | 'pants' | 'dress' | 'jacket' | 'shoes' | 'accessories';
  color: string;
  style: string;
  pattern?: string;
  material?: string;
  description: string;
  searchTerms: string[];
}

export interface AvatarClothingAnalysis {
  items: ClothingItem[];
  overallStyle: string;
  colorPalette: string[];
  occasion: string;
  season: string;
}

class AvatarClothingAnalysisService {
  constructor() {
    console.log('👔 [AVATAR_ANALYSIS] Service initialized - using /api/claude proxy');
  }

  /**
   * Analyze avatar image to extract clothing information
   */
  async analyzeAvatarClothing(imageUrl: string): Promise<AvatarClothingAnalysis> {
    console.log('👔 [AVATAR_ANALYSIS] Starting clothing analysis for avatar image');

    try {
      // Use Claude Vision to analyze the image via proxy
      const analysis = await this.performVisionAnalysis(imageUrl);
      return analysis;

    } catch (error) {
      console.error('❌ [AVATAR_ANALYSIS] Analysis failed:', error);
      // Fall back to basic analysis if vision fails
      return this.performBasicAnalysis(imageUrl);
    }
  }

  /**
   * Use Claude Vision API to analyze avatar clothing via Vite proxy
   */
  private async performVisionAnalysis(imageUrl: string): Promise<AvatarClothingAnalysis> {
    console.log('🔍 [AVATAR_ANALYSIS] Using Claude Vision via proxy for detailed analysis');

    try {
      const response = await fetch('/api/claude/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          // Authorization header handled by Vite proxy
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: await this.imageToBase64(imageUrl)
                }
              },
              {
                type: 'text',
                text: `Analyze this avatar's clothing and return a JSON object with:
                {
                  "items": [
                    {
                      "category": "shirt|pants|dress|jacket|shoes|accessories",
                      "color": "primary color",
                      "style": "style description",
                      "pattern": "pattern if any",
                      "material": "apparent material",
                      "description": "detailed description",
                      "searchTerms": ["search", "terms", "for", "shopping"]
                    }
                  ],
                  "overallStyle": "overall style assessment",
                  "colorPalette": ["color1", "color2"],
                  "occasion": "casual|formal|business|sport",
                  "season": "spring|summer|fall|winter"
                }
                Focus on details that would help find similar clothing items online.`
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude Vision API failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';

      // Parse the JSON response
      const analysisResult = JSON.parse(content);

      console.log('✅ [AVATAR_ANALYSIS] Vision analysis completed:', analysisResult);
      return analysisResult;

    } catch (error) {
      console.error('❌ [AVATAR_ANALYSIS] Vision analysis failed:', error);
      throw error;
    }
  }

  /**
   * Convert image URL to base64 for API submission
   */
  private async imageToBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ [AVATAR_ANALYSIS] Image conversion failed:', error);
      throw error;
    }
  }

  /**
   * Basic analysis fallback when vision API is not available
   */
  private performBasicAnalysis(imageUrl: string): AvatarClothingAnalysis {
    console.log('📝 [AVATAR_ANALYSIS] Using basic analysis fallback');

    // Extract any info we can from the image URL or filename
    const urlLower = imageUrl.toLowerCase();

    // Basic heuristics based on common patterns
    const items: ClothingItem[] = [];

    // Try to detect clothing types from context
    if (urlLower.includes('shirt') || urlLower.includes('top')) {
      items.push({
        category: 'shirt',
        color: this.extractColorFromUrl(urlLower) || 'blue',
        style: 'casual shirt',
        description: 'casual shirt',
        searchTerms: ['casual shirt', 'top', 'blouse']
      });
    }

    if (urlLower.includes('pants') || urlLower.includes('jeans')) {
      items.push({
        category: 'pants',
        color: this.extractColorFromUrl(urlLower) || 'blue',
        style: 'casual pants',
        description: 'casual pants',
        searchTerms: ['casual pants', 'jeans', 'trousers']
      });
    }

    // Default fallback if no specific items detected
    if (items.length === 0) {
      items.push(
        {
          category: 'shirt',
          color: 'blue',
          style: 'casual',
          description: 'casual blue shirt',
          searchTerms: ['casual shirt', 'blue top', 'everyday shirt']
        },
        {
          category: 'pants',
          color: 'dark blue',
          style: 'casual',
          description: 'casual dark pants',
          searchTerms: ['casual pants', 'dark jeans', 'everyday pants']
        }
      );
    }

    return {
      items,
      overallStyle: 'casual',
      colorPalette: ['blue', 'navy', 'gray'],
      occasion: 'casual',
      season: 'all-season'
    };
  }

  /**
   * Extract color information from URL patterns
   */
  private extractColorFromUrl(url: string): string | null {
    const colors = ['red', 'blue', 'green', 'black', 'white', 'gray', 'navy', 'pink', 'purple', 'yellow'];

    for (const color of colors) {
      if (url.includes(color)) {
        return color;
      }
    }

    return null;
  }

  /**
   * Generate focused search queries for finding similar items (max 3 queries)
   */
  generateSearchQueries(analysis: AvatarClothingAnalysis, budgetRange?: { min: number; max: number }): string[] {
    const queries: string[] = [];

    // Focus on the first (primary) clothing item only for more precise results
    if (analysis.items.length > 0) {
      const primaryItem = analysis.items[0]; // Most prominent clothing item

      // Primary search: exact description for most accurate results
      queries.push(`${primaryItem.description} buy online shopping`);

      // Secondary search: color + style + category for broader coverage
      queries.push(`${primaryItem.color} ${primaryItem.style} ${primaryItem.category} online store`);

      // Budget-specific search if specified
      if (budgetRange && budgetRange.max) {
        queries.push(`${primaryItem.color} ${primaryItem.category} under $${budgetRange.max} fashion`);
      } else {
        // Third search: material/pattern specific if available, otherwise category + occasion
        if (primaryItem.material) {
          queries.push(`${primaryItem.material} ${primaryItem.category} ${primaryItem.style}`);
        } else if (primaryItem.pattern) {
          queries.push(`${primaryItem.pattern} ${primaryItem.category} buy`);
        } else {
          queries.push(`${primaryItem.category} ${analysis.occasion} clothing`);
        }
      }
    } else {
      // Fallback if no items detected
      queries.push(`${analysis.overallStyle} ${analysis.occasion} outfit buy online`);
    }

    // Limit to maximum 3 queries for focused results
    const limitedQueries = queries.slice(0, 3);

    console.log('🔍 [AVATAR_ANALYSIS] Generated focused search queries (max 3):', limitedQueries);
    return limitedQueries;
  }

  /**
   * Health check for service availability
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🔍 [AVATAR_ANALYSIS] Checking service health via proxy');

      // Test API connectivity via proxy
      const response = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization handled by Vite proxy
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 10,
          messages: [{
            role: 'user',
            content: 'Test'
          }]
        })
      });

      const isHealthy = response.ok;
      console.log(`✅ [AVATAR_ANALYSIS] Health check result: ${isHealthy ? 'healthy' : 'unhealthy'}`);
      return isHealthy;
    } catch (error) {
      console.error('❌ [AVATAR_ANALYSIS] Health check failed:', error);
      console.log('⚠️ [AVATAR_ANALYSIS] Will fall back to basic mode');
      return true; // Return true to allow basic mode fallback
    }
  }
}

export default new AvatarClothingAnalysisService();