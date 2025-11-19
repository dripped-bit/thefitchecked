/**
 * Optional Product Search Service
 * Handles user-prompted product searches when items are added to wishlist
 */

import perplexityService, { ProductSearchResult, ProductSearchOptions } from './perplexityService';
import { STORE_URLS, StoreInfo, getStoresByGender, getStoresByClothingType, getRandomStores } from '../data/storeUrls';

export interface ClothingPiece {
  id: string;
  type: 'shirt' | 'pants' | 'dress' | 'jacket' | 'shoes' | 'accessory' | 'other';
  description: string;
  searchQuery: string;
}

export interface SearchResults {
  piece: ClothingPiece;
  products: ProductSearchResult[];
  searchQuery: string;
  timestamp: string;
}

export interface OutfitSearchResults {
  outfitId: string;
  originalImageUrl: string;
  pieces: SearchResults[];
  totalResults: number;
  searchTimestamp: string;
  selectedStores?: StoreInfo[];
  gender?: 'men' | 'women';
}

class OptionalProductSearchService {
  private readonly RESULTS_PER_PIECE = 3;
  private readonly SEARCH_TIMEOUT = 10000; // 10 seconds per search
  private readonly STORES_PER_SEARCH = 5; // Number of stores to target per search

  /**
   * Detect gender from prompt for store targeting
   */
  private detectGender(prompt: string): 'men' | 'women' | undefined {
    const promptLower = prompt.toLowerCase();

    const menKeywords = ['men', 'male', 'man', 'boy', 'guy', 'masculine'];
    const womenKeywords = ['women', 'female', 'woman', 'girl', 'lady', 'feminine'];

    const menMatches = menKeywords.filter(keyword => promptLower.includes(keyword)).length;
    const womenMatches = womenKeywords.filter(keyword => promptLower.includes(keyword)).length;

    if (menMatches > womenMatches) return 'men';
    if (womenMatches > menMatches) return 'women';

    return undefined; // Gender neutral or unclear
  }

  /**
   * Select appropriate stores for search based on clothing type and gender
   */
  private selectTargetStores(clothingType: string, gender?: 'men' | 'women'): StoreInfo[] {
    console.log(`🏪 [STORE-SELECTION] Selecting stores for ${clothingType} (${gender || 'unisex'})`);

    let targetStores: StoreInfo[];

    if (gender) {
      // Get stores by gender and clothing type
      targetStores = getStoresByClothingType(clothingType, gender);
    } else {
      // Use a mix of men's and women's stores
      const menStores = getStoresByClothingType(clothingType, 'men').slice(0, Math.ceil(this.STORES_PER_SEARCH / 2));
      const womenStores = getStoresByClothingType(clothingType, 'women').slice(0, Math.floor(this.STORES_PER_SEARCH / 2));
      targetStores = [...menStores, ...womenStores];
    }

    // Limit to configured number of stores
    const selectedStores = targetStores.slice(0, this.STORES_PER_SEARCH);

    console.log(`✅ [STORE-SELECTION] Selected ${selectedStores.length} stores:`,
      selectedStores.map(store => store.name).join(', '));

    return selectedStores;
  }

  /**
   * Analyze outfit image to identify clothing pieces
   */
  async analyzeOutfitPieces(imageUrl: string, originalPrompt?: string): Promise<ClothingPiece[]> {
    console.log('🔍 [OUTFIT-ANALYSIS] Analyzing outfit for clothing pieces...');

    try {
      // For now, use simple prompt analysis
      // In future, could integrate with AI vision service
      const pieces = this.extractPiecesFromPrompt(originalPrompt || '');

      console.log('✅ [OUTFIT-ANALYSIS] Found', pieces.length, 'clothing pieces');
      return pieces;
    } catch (error) {
      console.error('❌ [OUTFIT-ANALYSIS] Failed to analyze outfit:', error);
      return [];
    }
  }

  /**
   * Extract clothing pieces from text prompt (simple implementation)
   */
  private extractPiecesFromPrompt(prompt: string): ClothingPiece[] {
    const pieces: ClothingPiece[] = [];
    const promptLower = prompt.toLowerCase();

    // Common clothing item patterns
    const patterns = [
      {
        keywords: ['shirt', 'blouse', 'top', 't-shirt', 'tshirt', 'tank'],
        type: 'shirt' as const,
        description: 'shirt/top'
      },
      {
        keywords: ['pants', 'jeans', 'trousers', 'leggings', 'chinos'],
        type: 'pants' as const,
        description: 'pants/bottoms'
      },
      {
        keywords: ['dress', 'gown', 'sundress'],
        type: 'dress' as const,
        description: 'dress'
      },
      {
        keywords: ['jacket', 'blazer', 'coat', 'cardigan', 'hoodie'],
        type: 'jacket' as const,
        description: 'jacket/outerwear'
      },
      {
        keywords: ['shoes', 'sneakers', 'boots', 'heels', 'sandals'],
        type: 'shoes' as const,
        description: 'shoes'
      }
    ];

    patterns.forEach((pattern, index) => {
      const found = pattern.keywords.some(keyword => promptLower.includes(keyword));
      if (found) {
        pieces.push({
          id: `piece_${index}_${Date.now()}`,
          type: pattern.type,
          description: pattern.description,
          searchQuery: prompt // Will be regenerated with store targeting later
        });
      }
    });

    // If no specific pieces found, assume it's a general outfit
    if (pieces.length === 0) {
      pieces.push({
        id: `general_${Date.now()}`,
        type: 'other',
        description: 'outfit',
        searchQuery: prompt // Will be regenerated with store targeting later
      });
    }

    return pieces;
  }

  /**
   * Generate optimized search query for clothing piece with store targeting
   */
  private generateSearchQuery(type: ClothingPiece['type'], originalPrompt: string, targetStores?: StoreInfo[]): string {
    const basePrompt = originalPrompt.toLowerCase();

    // Extract color, style, material keywords
    const colors = this.extractColors(basePrompt);
    const styles = this.extractStyles(basePrompt);
    const materials = this.extractMaterials(basePrompt);

    let query = type === 'other' ? 'outfit' : type;

    // Add descriptive terms
    if (colors.length > 0) query += ` ${colors[0]}`;
    if (styles.length > 0) query += ` ${styles[0]}`;
    if (materials.length > 0) query += ` ${materials[0]}`;

    // Add store targeting
    if (targetStores && targetStores.length > 0) {
      const storeNames = targetStores.map(store => store.name).slice(0, 3); // Limit to 3 stores per query
      query += ` site:${targetStores[0].url.replace('https://', '').replace('http://', '').split('/')[0]}`;

      // Add alternative stores as OR conditions
      if (storeNames.length > 1) {
        const additionalStores = targetStores.slice(1, 3).map(store =>
          ` OR site:${store.url.replace('https://', '').replace('http://', '').split('/')[0]}`
        ).join('');
        query += additionalStores;
      }
    } else {
      // Fallback to general shopping terms
      query += ' buy online store';
    }

    return query.trim();
  }

  /**
   * Generate multiple search queries with different store combinations
   */
  private generateStoreSpecificQueries(type: ClothingPiece['type'], originalPrompt: string, targetStores: StoreInfo[]): string[] {
    const baseQuery = this.generateSearchQuery(type, originalPrompt);
    const queries: string[] = [];

    // Create store-specific query (reduced to 1 to avoid rate limits)
    targetStores.slice(0, 1).forEach(store => {
      const domain = store.url.replace('https://', '').replace('http://', '').split('/')[0];
      const storeQuery = `${baseQuery} site:${domain}`;
      queries.push(storeQuery);
    });

    // Add a general query as fallback
    if (queries.length === 0) {
      queries.push(`${baseQuery} buy online`);
    }

    return queries;
  }

  /**
   * Extract color keywords from prompt
   */
  private extractColors(prompt: string): string[] {
    const colorKeywords = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'gray', 'navy', 'beige', 'cream'];
    return colorKeywords.filter(color => prompt.includes(color));
  }

  /**
   * Extract style keywords from prompt
   */
  private extractStyles(prompt: string): string[] {
    const styleKeywords = ['casual', 'formal', 'vintage', 'modern', 'chic', 'elegant', 'sporty', 'bohemian', 'minimalist', 'oversized', 'fitted'];
    return styleKeywords.filter(style => prompt.includes(style));
  }

  /**
   * Extract material keywords from prompt
   */
  private extractMaterials(prompt: string): string[] {
    const materialKeywords = ['cotton', 'denim', 'silk', 'wool', 'leather', 'linen', 'polyester', 'cashmere'];
    return materialKeywords.filter(material => prompt.includes(material));
  }

  /**
   * Search for similar products for each clothing piece
   */
  async searchSimilarProducts(
    pieces: ClothingPiece[],
    options: ProductSearchOptions = {},
    gender?: 'men' | 'women'
  ): Promise<SearchResults[]> {
    console.log('🛍️ [PRODUCT-SEARCH] Searching for', pieces.length, 'clothing pieces...');

    const searchOptions = {
      maxResults: this.RESULTS_PER_PIECE,
      ...options
    };

    const results: SearchResults[] = [];

    // Search for each piece in parallel with timeout
    const searchPromises = pieces.map(async (piece) => {
      try {
        // Select target stores for this clothing piece
        const targetStores = this.selectTargetStores(`${piece.type} ${piece.description}`, gender);

        // Generate store-specific search queries
        const storeQueries = this.generateStoreSpecificQueries(piece.type, piece.searchQuery, targetStores);

        console.log(`🔍 [PRODUCT-SEARCH] Searching for ${piece.type} with ${storeQueries.length} targeted queries`);

        const products = await Promise.race([
          perplexityService.searchProductsMultiQuery(storeQueries, searchOptions),
          new Promise<ProductSearchResult[]>((_, reject) =>
            setTimeout(() => reject(new Error('Search timeout')), this.SEARCH_TIMEOUT)
          )
        ]);

        // Update the piece's search query to the first targeted query
        const finalSearchQuery = storeQueries[0] || piece.searchQuery;

        const searchResult: SearchResults = {
          piece: {
            ...piece,
            searchQuery: finalSearchQuery
          },
          products: products.slice(0, this.RESULTS_PER_PIECE),
          searchQuery: finalSearchQuery,
          timestamp: new Date().toISOString()
        };

        console.log(`✅ [PRODUCT-SEARCH] Found ${searchResult.products.length} products for ${piece.type}`);
        return searchResult;

      } catch (error) {
        console.error(`❌ [PRODUCT-SEARCH] Search failed for ${piece.type}:`, error);
        return {
          piece,
          products: [],
          searchQuery: piece.searchQuery,
          timestamp: new Date().toISOString()
        };
      }
    });

    try {
      const searchResults = await Promise.all(searchPromises);
      results.push(...searchResults);
    } catch (error) {
      console.error('❌ [PRODUCT-SEARCH] Batch search failed:', error);
    }

    const totalResults = results.reduce((sum, result) => sum + result.products.length, 0);
    console.log(`🎯 [PRODUCT-SEARCH] Search complete: ${totalResults} total products found`);

    return results;
  }

  /**
   * Search for products for a complete outfit
   */
  async searchOutfitProducts(
    imageUrl: string,
    originalPrompt?: string,
    options: ProductSearchOptions = {}
  ): Promise<OutfitSearchResults> {
    console.log('👗 [OUTFIT-SEARCH] Starting outfit product search...');

    const outfitId = `outfit_${Date.now()}`;

    try {
      // Step 1: Detect gender from prompt for better store targeting
      const detectedGender = originalPrompt ? this.detectGender(originalPrompt) : undefined;
      console.log(`🧑‍🤝‍🧑 [GENDER-DETECTION] Detected gender: ${detectedGender || 'neutral'}`);

      // Step 2: Analyze outfit to identify pieces
      const pieces = await this.analyzeOutfitPieces(imageUrl, originalPrompt);

      if (pieces.length === 0) {
        console.warn('⚠️ [OUTFIT-SEARCH] No clothing pieces identified');
        return {
          outfitId,
          originalImageUrl: imageUrl,
          pieces: [],
          totalResults: 0,
          searchTimestamp: new Date().toISOString(),
          gender: detectedGender
        };
      }

      // Step 3: Search for similar products with store targeting
      const searchResults = await this.searchSimilarProducts(pieces, options, detectedGender);

      // Step 4: Get the selected stores for reference
      const selectedStores = pieces.length > 0 ?
        this.selectTargetStores(`${pieces[0].type} ${pieces[0].description}`, detectedGender) : [];

      const result: OutfitSearchResults = {
        outfitId,
        originalImageUrl: imageUrl,
        pieces: searchResults,
        totalResults: searchResults.reduce((sum, result) => sum + result.products.length, 0),
        searchTimestamp: new Date().toISOString(),
        selectedStores,
        gender: detectedGender
      };

      console.log('✅ [OUTFIT-SEARCH] Outfit search complete:', result.totalResults, 'products found');
      return result;

    } catch (error) {
      console.error('❌ [OUTFIT-SEARCH] Outfit search failed:', error);
      return {
        outfitId,
        originalImageUrl: imageUrl,
        pieces: [],
        totalResults: 0,
        searchTimestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get recommended search options based on user preferences
   */
  getRecommendedSearchOptions(userPreferences?: any): ProductSearchOptions {
    // Get a mix of popular stores from our database
    const popularStores = getRandomStores(5);
    const storeNames = popularStores.map(store => store.name.toLowerCase().replace(/\s+/g, ''));

    return {
      maxResults: this.RESULTS_PER_PIECE,
      stores: storeNames,
      // Could add budget, size preferences from user data
      ...userPreferences
    };
  }

  /**
   * Get available store categories for filtering
   */
  getAvailableStoreCategories(): string[] {
    return ['luxury', 'mid-range', 'budget', 'designer', 'fast-fashion'];
  }

  /**
   * Get stores by specific criteria
   */
  getStoresByCriteria(criteria: {
    gender?: 'men' | 'women';
    budget?: 'low' | 'medium' | 'high';
    category?: string;
    limit?: number;
  }) {
    const { gender, budget, category, limit = 10 } = criteria;

    let stores = STORE_URLS;

    if (gender) {
      stores = getStoresByGender(gender);
    }

    if (category) {
      stores = stores.filter(store => store.category === category);
    }

    return stores.slice(0, limit);
  }

  /**
   * Search for similar products for a single clothing item
   */
  async searchSingleItem(item: {
    name: string;
    imageUrl?: string;
    category?: string;
    description?: string;
  }, options: ProductSearchOptions = {}): Promise<OutfitSearchResults> {
    console.log('🔍 [SINGLE-ITEM-SEARCH] Starting search for:', item.name);

    const searchId = `single_${Date.now()}`;

    try {
      // Detect gender from item name and description
      const itemText = `${item.name} ${item.description || ''} ${item.category || ''}`;
      const detectedGender = this.detectGender(itemText);
      console.log(`🧑‍🤝‍🧑 [GENDER-DETECTION] Detected gender for item: ${detectedGender || 'neutral'}`);

      // Create a clothing piece from the item
      const clothingPiece: ClothingPiece = {
        id: `single_${Date.now()}`,
        type: this.mapCategoryToType(item.category || 'other'),
        description: item.name,
        searchQuery: item.name
      };

      // Search for similar products with store targeting
      const searchResults = await this.searchSimilarProducts([clothingPiece], options, detectedGender);

      // Get the selected stores for reference
      const selectedStores = this.selectTargetStores(`${clothingPiece.type} ${clothingPiece.description}`, detectedGender);

      const result: OutfitSearchResults = {
        outfitId: searchId,
        originalImageUrl: item.imageUrl || '',
        pieces: searchResults,
        totalResults: searchResults.reduce((sum, result) => sum + result.products.length, 0),
        searchTimestamp: new Date().toISOString(),
        selectedStores,
        gender: detectedGender
      };

      console.log('✅ [SINGLE-ITEM-SEARCH] Search complete:', result.totalResults, 'products found');
      return result;

    } catch (error) {
      console.error('❌ [SINGLE-ITEM-SEARCH] Search failed:', error);
      return {
        outfitId: searchId,
        originalImageUrl: item.imageUrl || '',
        pieces: [],
        totalResults: 0,
        searchTimestamp: new Date().toISOString(),
        gender: undefined
      };
    }
  }

  /**
   * Map category string to ClothingPiece type
   */
  private mapCategoryToType(category: string): ClothingPiece['type'] {
    const categoryLower = category.toLowerCase();

    if (categoryLower.includes('shirt') || categoryLower.includes('top') || categoryLower.includes('blouse')) {
      return 'shirt';
    }
    if (categoryLower.includes('pant') || categoryLower.includes('jean') || categoryLower.includes('trouser')) {
      return 'pants';
    }
    if (categoryLower.includes('dress') || categoryLower.includes('gown')) {
      return 'dress';
    }
    if (categoryLower.includes('jacket') || categoryLower.includes('coat') || categoryLower.includes('blazer')) {
      return 'jacket';
    }
    if (categoryLower.includes('shoe') || categoryLower.includes('boot') || categoryLower.includes('sneaker')) {
      return 'shoes';
    }
    if (categoryLower.includes('accessor')) {
      return 'accessory';
    }

    return 'other';
  }
}

export default new OptionalProductSearchService();