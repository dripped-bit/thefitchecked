/**
 * SerpAPI Shopping Service
 * Provides real product search with images via Google Shopping
 * Now enhanced with user style preferences for personalized results
 */

import { PRIMARY_PRIORITY_STORES, SECONDARY_PRIORITY_STORES } from '../config/priorityStores';
import authService from './authService';
import userPreferencesService, { StyleProfilePreferences } from './userPreferencesService';
import apiConfig from '../config/apiConfig';

export interface ProductSearchResult {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  url: string;
  store: string;
  snippet?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  originalPrice?: string;
  discount?: string;
  category?: string;
}

export interface ProductSearchOptions {
  budgetMin?: number;
  budgetMax?: number;
  stores?: string[];
  maxResults?: number;
}

class SerpApiService {
  private userStyleProfile: StyleProfilePreferences | null = null;

  constructor() {
    console.log('✅ [SERPAPI] Service initialized - using backend API route');
    this.loadUserPreferences();
  }

  /**
   * Load user's style preferences from Supabase
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        this.userStyleProfile = await userPreferencesService.getStyleProfile(user.id);
        if (this.userStyleProfile) {
          console.log('✨ [SERPAPI] Loaded user style preferences for personalized search');
        }
      }
    } catch (error) {
      console.log('ℹ️ [SERPAPI] No user preferences loaded, using default search');
    }
  }

  /**
   * Enhance search query with user's style preferences AND gender/age filtering
   */
  private enhanceQueryWithPreferences(query: string): string {
    let enhancedQuery = query;

    // Get user gender from userDataService
    const userDataService = require('./userDataService').default;
    const userData = userDataService.getAllUserData();
    const gender = userData?.profile?.gender || '';

    // Add gender-specific context to search query (VERY IMPORTANT)
    if (gender === 'male') {
      // Only add if query doesn't already specify men's/male
      if (!query.match(/\b(men's|mens|male|man)\b/i)) {
        enhancedQuery = `men's ${enhancedQuery}`;
      }
    } else if (gender === 'female') {
      // Only add if query doesn't already specify women's/female
      if (!query.match(/\b(women's|womens|female|woman|ladies)\b/i)) {
        enhancedQuery = `women's ${enhancedQuery}`;
      }
    } else {
      // Unisex - add adult context
      if (!query.match(/\b(adult|unisex)\b/i)) {
        enhancedQuery = `adult ${enhancedQuery}`;
      }
    }

    if (this.userStyleProfile) {
      // Add style vibes to refine results
      if (this.userStyleProfile.style_vibes && this.userStyleProfile.style_vibes.length > 0) {
        const styleKeywords = this.userStyleProfile.style_vibes.slice(0, 2).join(' ');
        enhancedQuery = `${styleKeywords} ${enhancedQuery}`;
      }

      // Add favorite colors if relevant to the search
      if (this.userStyleProfile.favorite_colors && this.userStyleProfile.favorite_colors.length > 0) {
        // Only add colors if the query doesn't already specify colors
        if (!query.match(/\b(black|white|blue|red|green|yellow|pink|purple|brown|gray|beige|navy|cream)\b/i)) {
          const topColor = this.userStyleProfile.favorite_colors[0];
          enhancedQuery = `${enhancedQuery} ${topColor}`;
        }
      }

      // Add fit preference
      if (this.userStyleProfile.fit_preference) {
        enhancedQuery = `${enhancedQuery} ${this.userStyleProfile.fit_preference} fit`;
      }
    }

    // VERY STRICT - Add children's exclusion terms
    // This ensures Google Shopping/Amazon filters out children's products
    const childExclusions = `-kids -children -girls -boys -toddler -infant -baby -youth -junior -teen -"ages 2-16" -"2T-16" -"youth sizes" -"junior sizes"`;

    // Add gender-specific exclusions
    if (gender === 'male') {
      enhancedQuery += ` ${childExclusions} -"boys'" -"boy's" -"young men's"`;
    } else if (gender === 'female') {
      enhancedQuery += ` ${childExclusions} -"girls'" -"girl's" -"young women's" -"junior miss"`;
    } else {
      enhancedQuery += ` ${childExclusions}`;
    }

    console.log('🔍 [SERPAPI] Enhanced query with gender/age filters:', enhancedQuery);

    return enhancedQuery;
  }

  /**
   * Search for products using Google Shopping
   */
  async searchProducts(
    query: string,
    options: ProductSearchOptions = {}
  ): Promise<ProductSearchResult[]> {
    const { budgetMin, budgetMax, stores, maxResults = 20 } = options;

    // Reload preferences on each search to get latest
    await this.loadUserPreferences();

    console.log('🔍 [SERPAPI] Starting search with exact user query:', query);

    // Try exact query first
    let results = await this.searchWithExactQuery(query, options);

    // If insufficient results, try enhanced query as fallback
    if (results.length < 5) {
      console.log('🔄 [SERPAPI] Insufficient results, trying enhanced query...');
      const enhancedQuery = this.enhanceQueryWithPreferences(query);
      console.log('✨ [SERPAPI] Enhanced query:', enhancedQuery);

      const enhancedResults = await this.searchWithExactQuery(enhancedQuery, options);

      // Merge results, prioritizing exact matches
      const seenUrls = new Set(results.map(r => r.url));
      const newResults = enhancedResults.filter(r => !seenUrls.has(r.url));
      results = [...results, ...newResults].slice(0, maxResults);

      console.log(`✅ [SERPAPI] Combined results: ${results.length} (exact: ${results.length - newResults.length}, enhanced: ${newResults.length})`);
    } else {
      console.log(`✅ [SERPAPI] Sufficient results from exact query: ${results.length}`);
    }

    return results;
  }

  /**
   * Search with exact query (no enhancement)
   */
  private async searchWithExactQuery(
    query: string,
    options: ProductSearchOptions = {}
  ): Promise<ProductSearchResult[]> {
    const { budgetMin, budgetMax, stores, maxResults = 20 } = options;

    try {
      // Call both Google Shopping AND Amazon in parallel
      const [googleShoppingResponse, amazonResponse] = await Promise.allSettled([
        // Google Shopping search
        fetch(apiConfig.getEndpoint('/api/serpapi-search'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query,
            num: Math.ceil(maxResults * 0.6), // 60% Google Shopping
            budgetMin,
            budgetMax
          })
        }),
        // Amazon search
        fetch(apiConfig.getEndpoint('/api/serpapi-amazon'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query, // Use original query for Amazon (not enhanced)
            num: Math.ceil(maxResults * 0.4), // 40% Amazon
            budgetMin,
            budgetMax
          })
        })
      ]);

      let allResults: ProductSearchResult[] = [];

      // Process Amazon results first (to prioritize them)
      if (amazonResponse.status === 'fulfilled' && amazonResponse.value.ok) {
        try {
          const amazonData = await amazonResponse.value.json();
          if (amazonData.error) {
            console.error('❌ [AMAZON] API Error:', amazonData.error);
          } else {
            const amazonProducts = this.transformResults(amazonData.shopping_results || []);
            console.log(`🛍️ [AMAZON] Found ${amazonProducts.length} Amazon products`);
            allResults.push(...amazonProducts);
          }
        } catch (parseError) {
          console.error('❌ [AMAZON] Failed to parse response:', parseError);
        }
      } else if (amazonResponse.status === 'rejected') {
        console.error('❌ [AMAZON] Request failed:', amazonResponse.reason);
      }

      // Process Google Shopping results
      if (googleShoppingResponse.status === 'fulfilled' && googleShoppingResponse.value.ok) {
        try {
          const googleData = await googleShoppingResponse.value.json();
          if (googleData.error) {
            console.error('❌ [GOOGLE-SHOPPING] API Error:', googleData.error);
          } else {
            const googleProducts = this.transformResults(googleData.shopping_results || []);
            console.log(`🔍 [GOOGLE-SHOPPING] Found ${googleProducts.length} products`);
            allResults.push(...googleProducts);
          }
        } catch (parseError) {
          console.error('❌ [GOOGLE-SHOPPING] Failed to parse response:', parseError);
        }
      } else if (googleShoppingResponse.status === 'rejected') {
        console.error('❌ [GOOGLE-SHOPPING] Request failed:', googleShoppingResponse.reason);
      }

      // Deduplicate by URL (in case Amazon products appear in both searches)
      const seenUrls = new Set<string>();
      const deduplicatedResults = allResults.filter(product => {
        if (seenUrls.has(product.url)) {
          return false;
        }
        seenUrls.add(product.url);
        return true;
      });

      console.log(`📦 [SERPAPI] Total results: ${deduplicatedResults.length} (after deduplication)`);

      // Filter by priority stores if specified
      let filteredResults = deduplicatedResults;
      if (stores && stores.length > 0) {
        filteredResults = this.filterByStores(deduplicatedResults, stores);
        console.log(`🏪 [SERPAPI] Filtered to priority stores: ${filteredResults.length}/${deduplicatedResults.length}`);
        
        // NEW: If filtering eliminates all results, use all results instead
        if (filteredResults.length === 0) {
          console.log('⚠️ [SERPAPI] Store filter eliminated all results, using all products instead');
          filteredResults = deduplicatedResults;
        }
      }

      // NEW: Debug logging before adult filter
      console.log(`🔍 [DEBUG] Before adult filter: ${filteredResults.length} products`);
      
      // CONTEXT-AWARE - Filter out children's products (with adult fashion whitelist)
      // WRAPPED: If filter fails, keep original results
      try {
        filteredResults = this.filterAdultProducts(filteredResults);
        console.log(`🔍 [DEBUG] After adult filter: ${filteredResults.length} products`);
      } catch (filterError) {
        console.error(`⚠️ [FILTER] Adult filter crashed, using unfiltered results:`, filterError);
        // Keep original filtered results rather than crashing
      }
      
      if (filteredResults.length === 0) {
        console.error(`❌ [DEBUG] All products filtered out! Original count: ${deduplicatedResults.length}`);
        console.error(`❌ [DEBUG] Check filter logs above for reason - likely all products matched children's keywords`);
      }

      // Limit to maxResults
      const finalResults = filteredResults.slice(0, maxResults);
      console.log(`✅ [SERPAPI] Returning ${finalResults.length} adult products (Amazon prioritized, children's filtered)`);

      return finalResults;

    } catch (error) {
      console.error('❌ [SERPAPI] Search failed:', error);
      console.error('❌ [SERPAPI] Error details:', {
        message: error?.message || 'Unknown error',
        type: error?.constructor?.name || typeof error,
        stack: error?.stack?.split('\n').slice(0, 3).join('\n') || 'No stack trace'
      });
      return [];
    }
  }

  /**
   * Transform SerpAPI results to our product format
   */
  private transformResults(results: any[]): ProductSearchResult[] {
    return results.map((item, index) => {
      // Extract price as number
      const priceStr = item.price || item.extracted_price || '';
      const priceMatch = priceStr.match(/[\d,]+\.?\d*/);
      const price = priceMatch ? `$${priceMatch[0]}` : 'Price not available';

      return {
        id: `serp_${Date.now()}_${index}`,
        title: item.title || 'Unknown Product',
        price: price,
        imageUrl: item.thumbnail || item.image || '',
        url: item.link || item.product_link || '',
        store: this.extractStoreName(item.source || item.merchant || 'Unknown Store'),
        snippet: item.snippet || item.title || '',
        rating: item.rating ? parseFloat(item.rating) : undefined,
        reviews: item.reviews ? parseInt(item.reviews) : undefined,
        inStock: true, // Assume in stock if returned by Google Shopping
        category: this.categorizeProduct(item.title || '')
      };
    });
  }

  /**
   * Extract clean store name
   */
  private extractStoreName(source: string): string {
    // Remove common suffixes
    return source
      .replace(/\.com$/i, '')
      .replace(/\s+Store$/i, '')
      .trim();
  }

  /**
   * Categorize product by title
   */
  private categorizeProduct(title: string): string {
    const titleLower = title.toLowerCase();

    // Return plural forms matching FASHN API: 'tops', 'bottoms', 'one-pieces'
    if (titleLower.includes('dress') || titleLower.includes('jumpsuit') || titleLower.includes('romper')) return 'one-pieces';
    if (titleLower.includes('top') || titleLower.includes('shirt') || titleLower.includes('blouse')) return 'tops';
    if (titleLower.includes('pants') || titleLower.includes('jeans') || titleLower.includes('trousers')) return 'bottoms';
    if (titleLower.includes('skirt')) return 'bottoms';
    if (titleLower.includes('jacket') || titleLower.includes('coat')) return 'tops';
    if (titleLower.includes('shoes') || titleLower.includes('heels') || titleLower.includes('boots')) return 'shoes';

    return 'auto'; // Default for unknown categories
  }

  /**
   * Filter results by priority stores
   * Enhanced with multiple matching strategies for better accuracy
   */
  private filterByStores(results: ProductSearchResult[], storeDomains: string[]): ProductSearchResult[] {
    const storeNames = storeDomains.map(domain =>
      domain.replace('www.', '').replace('.com', '').toLowerCase()
    );

    return results.filter(product => {
      const productStore = product.store.toLowerCase();
      
      // Try multiple matching strategies
      return storeNames.some(store => {
        // Strategy 1: Exact match
        if (productStore === store) {
          console.log(`✅ [STORE-MATCH] Exact: "${productStore}" === "${store}"`);
          return true;
        }
        
        // Strategy 2: Contains match (both directions)
        if (productStore.includes(store) || store.includes(productStore)) {
          console.log(`✅ [STORE-MATCH] Contains: "${productStore}" ↔ "${store}"`);
          return true;
        }
        
        // Strategy 3: Remove spaces and try again
        const storeNoSpaces = store.replace(/\s+/g, '');
        const productNoSpaces = productStore.replace(/\s+/g, '');
        if (productNoSpaces.includes(storeNoSpaces) || storeNoSpaces.includes(productNoSpaces)) {
          console.log(`✅ [STORE-MATCH] No-spaces: "${productNoSpaces}" ↔ "${storeNoSpaces}"`);
          return true;
        }
        
        // Strategy 4: Remove common suffixes and try again
        const storeCleaned = store.replace(/\s*(online|shop|store|outlet|inc|llc|co)\s*/gi, '');
        const productCleaned = productStore.replace(/\s*(online|shop|store|outlet|inc|llc|co)\s*/gi, '');
        if (productCleaned.includes(storeCleaned) || storeCleaned.includes(productCleaned)) {
          console.log(`✅ [STORE-MATCH] Cleaned: "${productCleaned}" ↔ "${storeCleaned}"`);
          return true;
        }
        
        // Strategy 5: Fuzzy match - check if first 3-4 letters match (for abbreviations)
        if (store.length >= 3 && productStore.length >= 3) {
          const storePrefix = store.substring(0, Math.min(4, store.length));
          const productPrefix = productStore.substring(0, Math.min(4, productStore.length));
          if (storePrefix === productPrefix) {
            console.log(`✅ [STORE-MATCH] Prefix: "${productPrefix}" === "${storePrefix}"`);
            return true;
          }
        }
        
        return false;
      });
    });
  }

  /**
   * CONTEXT-AWARE filter to remove children's clothing products
   * Analyzes product titles for children's keywords, sizes, and brand indicators
   * Now includes whitelist for valid adult fashion terms that contain problematic keywords
   */
  private filterAdultProducts(results: ProductSearchResult[]): ProductSearchResult[] {
    let gender = '';
    
    // TRY to get user gender, but don't fail if unavailable
    try {
      const userDataService = require('./userDataService').default;
      const userData = userDataService.getAllUserData();
      gender = userData?.profile?.gender || '';
    } catch (error) {
      console.log('ℹ️ [FILTER] User data unavailable, using gender-neutral filter');
    }

    // NEW: Whitelist of valid adult fashion terms (checked FIRST before filtering)
    const adultFashionTerms = [
      'baby doll dress',      // Popular adult style
      'babydoll dress',       // Alternative spelling
      'baby doll top',        // Adult top style
      'baby tee',             // Adult cropped tee
      'baby blue',            // Color name
      'baby pink',            // Color name
      'mini dress',           // Valid adult garment
      'mini skirt',           // Valid adult garment
      'mini bag',             // Accessory
      'young contemporary',   // Valid adult fashion category
      "women's mini",         // Adult sizing
      "men's mini",           // Adult sizing
      'petite mini',          // Adult sizing
      'junior bridesmaid',    // Wedding category (could be adult)
      'junior size',          // Sometimes used for adult petite sizing
    ];

    // Very comprehensive list of children's keywords
    const childrenKeywords = [
      // General children's terms
      'kids', 'children', 'child', 'toddler', 'infant', 'youth',
      'teen', 'tween', 'pre-teen', 'preteen', 'adolescent', 'juvenile',

      // Gender-specific
      'boys', "boys'", "boy's", 'girls', "girls'", "girl's",

      // Age ranges
      'ages 0-3', 'ages 4-6', 'ages 7-9', 'ages 10-12', 'ages 13-16',
      'age 2t-16', '2t-16', '0-16',

      // Size indicators
      '2t', '3t', '4t', '5t', '6x', '7x', '8x', '10/12', '14/16',
      'youth small', 'youth medium', 'youth large', 'youth xl', 'youth xxl',

      // School-related
      'grade school', 'elementary', 'middle school', 'back to school',
      'school uniform', 'schoolwear',

      // Brand indicators - REMOVED: 'baby', 'mini', 'young', 'junior', 'petit' (too many false positives)
      'little kids', 'big kids'
    ];

    // Gender-specific exclusions
    if (gender === 'male') {
      childrenKeywords.push('teen boy', 'boy');
    } else if (gender === 'female') {
      childrenKeywords.push('teen girl', 'girl');
    }

    const filtered = results.filter(product => {
      const titleLower = product.title.toLowerCase();
      const snippetLower = (product.snippet || '').toLowerCase();
      const combinedText = `${titleLower} ${snippetLower}`;

      // NEW: Check whitelist FIRST - if product contains adult fashion terms, allow it
      for (const adultTerm of adultFashionTerms) {
        if (combinedText.includes(adultTerm.toLowerCase())) {
          console.log(`✅ [FILTER] Allowing adult fashion term: "${product.title}" (matched: ${adultTerm})`);
          return true; // Don't filter out - it's an adult product
        }
      }

      // THEN check for children's keywords
      for (const keyword of childrenKeywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          console.log(`🚫 [FILTER] Removed children's product: "${product.title}" (matched: ${keyword})`);
          return false;
        }
      }

      // Check for suspicious size patterns (e.g., "size 8" without "size 8 women's")
      if (combinedText.match(/\bsize\s+[2-9]\b/i) && !combinedText.match(/\b(women's|men's|adult|xs|s|m|l|xl)\b/i)) {
        console.log(`🚫 [FILTER] Removed suspicious size product: "${product.title}"`);
        return false;
      }

      // Additional safety check: if price is suspiciously low for adult clothing (under $5), might be children's
      if (product.price) {
        const priceMatch = product.price.match(/[\d.]+/);
        if (priceMatch) {
          const priceNum = parseFloat(priceMatch[0]);
          if (priceNum < 5) {
            console.log(`🚫 [FILTER] Removed suspiciously cheap product (likely children's): "${product.title}" (${product.price})`);
            return false;
          }
        }
      }

      return true;
    });

    console.log(`✅ [FILTER] Filtered ${results.length - filtered.length} children's products, ${filtered.length} adult products remain`);

    return filtered;
  }

  /**
   * AI-powered validation for ambiguous products
   * Uses Claude to analyze product titles/descriptions that pass keyword filter but might still be children's
   */
  private async validateProductWithAI(product: ProductSearchResult): Promise<boolean> {
    try {
      const userDataService = require('./userDataService').default;
      const userData = userDataService.getAllUserData();
      const gender = userData?.profile?.gender || '';
      const genderText = gender === 'male' ? "men's" : gender === 'female' ? "women's" : "adult";

      const validationPrompt = `Analyze this product to determine if it's ADULT clothing or CHILDREN'S clothing.

PRODUCT TITLE: "${product.title}"
PRODUCT DESCRIPTION: "${product.snippet || 'N/A'}"
PRICE: ${product.price}
STORE: ${product.store}
EXPECTED: ${genderText} adult clothing

Is this adult clothing or children's/youth clothing?

Respond with ONLY:
ADULT or CHILDREN

Be VERY STRICT - if there's ANY indication this is for children/youth/teens (ages 0-18), respond CHILDREN.`;

      const response = await fetch(apiConfig.getEndpoint('/api/claude'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: validationPrompt,
          maxTokens: 10
        })
      });

      if (!response.ok) {
        // If AI validation fails, assume adult to avoid blocking legitimate products
        return true;
      }

      const result = await response.json();
      const analysisText = (result.content || result.analysis || '').toUpperCase();

      const isAdult = analysisText.includes('ADULT') && !analysisText.includes('CHILDREN');

      if (!isAdult) {
        console.log(`🤖 [AI-FILTER] AI detected children's product: "${product.title}"`);
      }

      return isAdult;

    } catch (error) {
      console.error('❌ [AI-FILTER] AI validation failed:', error);
      // On error, assume adult to avoid blocking legitimate products
      return true;
    }
  }

  /**
   * Search with budget filter
   */
  async searchByBudget(
    query: string,
    budget: 'value' | 'budget' | 'mid' | 'luxury'
  ): Promise<ProductSearchResult[]> {
    const budgetRanges = {
      value: { min: 0, max: 30 },
      budget: { min: 0, max: 50 },
      mid: { min: 50, max: 150 },
      luxury: { min: 150, max: 999999 }
    };

    const range = budgetRanges[budget] || budgetRanges.mid;

    console.log(`💰 [SERPAPI] Searching with ${budget} budget: $${range.min}-$${range.max}`);

    return this.searchProducts(query, {
      budgetMin: range.min,
      budgetMax: range.max,
      maxResults: 20
    });
  }

  /**
   * Search with store prioritization
   */
  async searchWithStores(
    query: string,
    options: ProductSearchOptions = {}
  ): Promise<ProductSearchResult[]> {
    // Try primary stores first
    const primaryStoreDomains = PRIMARY_PRIORITY_STORES.slice(0, 10).map(s => s.domain);

    console.log('🏪 [SERPAPI] Searching priority stores first:', primaryStoreDomains.length);

    const primaryResults = await this.searchProducts(query, {
      ...options,
      stores: primaryStoreDomains,
      maxResults: 15
    });

    // If not enough results, try general search
    if (primaryResults.length < 5) {
      console.log('🔄 [SERPAPI] Not enough results from priority stores, expanding search...');
      const generalResults = await this.searchProducts(query, {
        ...options,
        maxResults: 20
      });

      // Combine and deduplicate
      const combined = [...primaryResults];
      generalResults.forEach(result => {
        if (!combined.find(r => r.url === result.url)) {
          combined.push(result);
        }
      });

      return combined;
    }

    return primaryResults;
  }
}

// Export singleton instance
export const serpApiService = new SerpApiService();
export default serpApiService;
