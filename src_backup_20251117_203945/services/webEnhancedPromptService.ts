/**
 * Web-Enhanced Prompt Service
 * Upgrades existing prompt preview feature with real-time fashion trend data using Perplexity API
 */

import PerplexityService, { PerplexitySearchResult } from './perplexityService';

export interface FashionResearchData {
  trendingStyles: string[];
  technicalDetails: {
    fabric: string;
    construction: string;
    fitType: string;
    textures: string[];
  };
  brandReferences: string[];
  commonElements: {
    colors: string[];
    patterns: string[];
    seasonality: string[];
  };
  confidenceLevel: 'high' | 'medium' | 'low';
  sourceAttribution: string; // New field for Perplexity source attribution
  searchResults?: PerplexitySearchResult[]; // Raw search results for reference
}

export interface PromptVariation {
  title: string;
  prompt: string;
  source: string;
  confidence: string;
  icon: string;
  type: 'trending' | 'detailed' | 'designer';
}

class WebEnhancedPromptService {
  private promptCache = new Map<string, FashionResearchData>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Main function to generate 3 web-enhanced prompt variations
   */
  async generateThreePromptVariations(userPrompt: string, style: string): Promise<PromptVariation[]> {
    console.log('🌐 [WEB-ENHANCED] Starting web-enhanced prompt generation');
    console.log('🌐 [WEB-ENHANCED] Input:', { userPrompt, style });

    try {
      // Try web-enhanced version with timeout
      const webEnhanced = await Promise.race([
        this.generateWebEnhancedVariations(userPrompt, style),
        new Promise<PromptVariation[]>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);

      console.log('✅ [WEB-ENHANCED] Successfully generated web-enhanced variations');
      return webEnhanced;

    } catch (error) {
      console.warn('⚠️ [WEB-ENHANCED] Falling back to standard variations:', error);
      return this.generateStandardVariations(userPrompt, style);
    }
  }

  /**
   * Generate variations using web search data
   */
  private async generateWebEnhancedVariations(userPrompt: string, style: string): Promise<PromptVariation[]> {
    // Step 1: Search the web for fashion information
    const fashionResearch = await this.searchFashionTrends(userPrompt);

    // Step 2: Generate 3 different variations using web data
    const variations: PromptVariation[] = [
      this.generateTrendyVersion(userPrompt, style, fashionResearch),
      this.generateDetailedVersion(userPrompt, style, fashionResearch),
      this.generateBrandInspired(userPrompt, style, fashionResearch)
    ];

    return variations;
  }

  /**
   * Single comprehensive web search for all variations using Perplexity API
   */
  private async searchFashionTrends(userPrompt: string): Promise<FashionResearchData> {
    const cacheKey = userPrompt.toLowerCase().trim();

    // Check cache first
    if (this.promptCache.has(cacheKey)) {
      const cached = this.promptCache.get(cacheKey)!;
      console.log('📋 [WEB-ENHANCED] Using cached fashion data');
      return cached;
    }

    console.log('🔍 [WEB-ENHANCED] Searching web for fashion trends via Perplexity...');

    // Extract keywords from user prompt
    const keywords = this.extractKeywords(userPrompt);

    try {
      // Perform searches in parallel using Perplexity
      const [trendsResults, technicalResults, brandsResults] = await Promise.all([
        PerplexityService.searchFashionTrends(keywords.item, keywords.style, keywords.color),
        PerplexityService.searchTechnicalDetails(keywords.item, keywords.color),
        PerplexityService.searchBrandReferences(keywords.item, keywords.style)
      ]);

      // Combine all results for processing
      const allResults = [...trendsResults, ...technicalResults, ...brandsResults];

      // Extract content for processing
      const trendsContent = PerplexityService.extractContentFromResults(trendsResults);
      const technicalContent = PerplexityService.extractContentFromResults(technicalResults);
      const brandsContent = PerplexityService.extractContentFromResults(brandsResults);

      // Process and structure the results
      const fashionData: FashionResearchData = {
        trendingStyles: this.extractTrends(trendsContent),
        technicalDetails: this.extractTechnicalDetails(technicalContent),
        brandReferences: this.extractBrands(brandsContent),
        commonElements: this.extractSharedDetails([trendsContent, technicalContent, brandsContent]),
        confidenceLevel: 'high',
        sourceAttribution: PerplexityService.getSourceAttribution(allResults),
        searchResults: allResults
      };

      // Cache the results
      this.promptCache.set(cacheKey, fashionData);
      setTimeout(() => this.promptCache.delete(cacheKey), this.CACHE_DURATION);

      console.log('✅ [WEB-ENHANCED] Fashion research completed via Perplexity:', fashionData);
      return fashionData;

    } catch (error) {
      console.error('❌ [WEB-ENHANCED] Perplexity search failed:', error);
      throw error;
    }
  }


  /**
   * Extract keywords from user prompt
   */
  private extractKeywords(userPrompt: string): { item: string; color: string; style: string } {
    const prompt = userPrompt.toLowerCase();

    // Basic keyword extraction (can be enhanced with NLP)
    const colors = ['red', 'blue', 'pink', 'black', 'white', 'green', 'yellow', 'purple', 'orange', 'brown', 'gray', 'beige', 'navy', 'emerald'];
    const items = ['dress', 'shirt', 'pants', 'jeans', 'skirt', 'jacket', 'coat', 'sweater', 'blouse', 'top', 'shorts', 'suit'];
    const styles = ['casual', 'formal', 'trendy', 'vintage', 'minimalist', 'edgy', 'bohemian', 'classic'];

    const foundColor = colors.find(color => prompt.includes(color)) || '';
    const foundItem = items.find(item => prompt.includes(item)) || prompt.split(' ')[0];
    const foundStyle = styles.find(style => prompt.includes(style)) || '';

    return { item: foundItem, color: foundColor, style: foundStyle };
  }

  /**
   * Process search results to extract trending styles
   */
  private extractTrends(searchResults: string[]): string[] {
    const trendKeywords = searchResults.filter(result =>
      result.toLowerCase().includes('trend') ||
      result.toLowerCase().includes('2024') ||
      result.toLowerCase().includes('2025') ||
      result.toLowerCase().includes('popular') ||
      result.toLowerCase().includes('viral')
    );

    return trendKeywords.slice(0, 5);
  }

  /**
   * Extract technical fashion details
   */
  private extractTechnicalDetails(searchResults: string[]): FashionResearchData['technicalDetails'] {
    const fabrics = searchResults.filter(result =>
      ['cotton', 'silk', 'wool', 'polyester', 'linen', 'denim', 'chiffon', 'satin'].some(fabric =>
        result.toLowerCase().includes(fabric)
      )
    );

    const constructions = searchResults.filter(result =>
      ['A-line', 'fitted', 'oversized', 'tailored', 'flowing', 'structured'].some(construction =>
        result.toLowerCase().includes(construction)
      )
    );

    return {
      fabric: fabrics[0] || 'premium cotton blend',
      construction: constructions[0] || 'tailored fit',
      fitType: 'modern fit',
      textures: searchResults.slice(0, 3)
    };
  }

  /**
   * Extract brand references
   */
  private extractBrands(searchResults: string[]): string[] {
    const brands = searchResults.filter(result =>
      ['Zara', 'H&M', 'Uniqlo', 'COS', 'Mango', 'Massimo Dutti', 'designer', 'luxury', 'high-end'].some(brand =>
        result.toLowerCase().includes(brand.toLowerCase())
      )
    );

    return brands.slice(0, 3);
  }

  /**
   * Extract shared elements across all search results
   */
  private extractSharedDetails(searchResults: string[][]): FashionResearchData['commonElements'] {
    const allResults = searchResults.flat();

    return {
      colors: allResults.filter(result =>
        ['color', 'shade', 'hue', 'tone'].some(colorWord =>
          result.toLowerCase().includes(colorWord)
        )
      ).slice(0, 3),
      patterns: allResults.filter(result =>
        ['pattern', 'print', 'stripe', 'floral', 'geometric'].some(pattern =>
          result.toLowerCase().includes(pattern)
        )
      ).slice(0, 2),
      seasonality: [this.getCurrentSeason(), '2024 trend', 'year-round style']
    };
  }

  /**
   * VARIATION 1: Trendy/Current Style
   */
  private generateTrendyVersion(userPrompt: string, style: string, webData: FashionResearchData): PromptVariation {
    const trendElements = webData.trendingStyles.join(', ');
    const colorElements = webData.commonElements.colors.join(', ');

    const prompt = `${userPrompt}, ${trendElements}, ${this.getCurrentSeason()} 2024 trend, viral fashion style, ${colorElements}, trendy ${style} fit, Instagram-worthy, social media fashion, contemporary design`;

    return {
      title: '🔥 Trending Style',
      prompt,
      source: webData.sourceAttribution || 'Current fashion trends via Perplexity',
      confidence: 'High',
      icon: '🔥',
      type: 'trending'
    };
  }

  /**
   * VARIATION 2: Detailed/Technical
   */
  private generateDetailedVersion(userPrompt: string, style: string, webData: FashionResearchData): PromptVariation {
    const { fabric, construction, fitType } = webData.technicalDetails;

    const prompt = `${userPrompt}, ${fabric} fabric, ${construction} construction, ${fitType}, professional fashion photography, detailed texture, high-quality materials, precision tailoring, ${style} aesthetic`;

    return {
      title: '📐 Detailed Technical',
      prompt,
      source: webData.sourceAttribution || 'Fashion specifications via Perplexity',
      confidence: 'Very High',
      icon: '📐',
      type: 'detailed'
    };
  }

  /**
   * VARIATION 3: Brand/Designer Inspired
   */
  private generateBrandInspired(userPrompt: string, style: string, webData: FashionResearchData): PromptVariation {
    const brand = webData.brandReferences[0] || 'designer';
    const currentYear = new Date().getFullYear();

    const prompt = `${userPrompt}, ${brand} inspired style, high fashion aesthetic, ${brand} ${currentYear} collection influence, editorial fashion photography, luxury quality, designer ${style} piece`;

    return {
      title: '💎 Designer Inspired',
      prompt,
      source: webData.sourceAttribution || 'High fashion references via Perplexity',
      confidence: 'Medium-High',
      icon: '💎',
      type: 'designer'
    };
  }

  /**
   * Fallback to standard variations if web search fails
   */
  private generateStandardVariations(userPrompt: string, style: string): PromptVariation[] {
    console.log('📝 [WEB-ENHANCED] Using standard fallback variations');

    return [
      {
        title: '🔥 Enhanced Quality',
        prompt: `${userPrompt}, high-quality ${style} fashion, professional photography, detailed texture, premium materials`,
        source: 'Standard enhancement',
        confidence: 'Medium',
        icon: '🔥',
        type: 'trending'
      },
      {
        title: '📐 Commercial Style',
        prompt: `${userPrompt}, clean ${style} design, e-commerce product style, studio lighting, modern fit`,
        source: 'Commercial template',
        confidence: 'High',
        icon: '📐',
        type: 'detailed'
      },
      {
        title: '💎 Editorial Style',
        prompt: `${userPrompt}, editorial fashion photography, artistic ${style} composition, magazine quality`,
        source: 'Editorial template',
        confidence: 'Medium',
        icon: '💎',
        type: 'designer'
      }
    ];
  }

  /**
   * Helper to get current season
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  /**
   * Helper to get current year
   */
  private getCurrentYear(): number {
    return new Date().getFullYear();
  }
}

export default new WebEnhancedPromptService();