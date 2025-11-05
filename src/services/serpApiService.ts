/**
 * SerpAPI Shopping Service
 * Provides real product search with images via Google Shopping
 * Now enhanced with user style preferences for personalized results
 */

import { PRIMARY_PRIORITY_STORES, SECONDARY_PRIORITY_STORES } from '../config/priorityStores';
import authService from './authService';
import userPreferencesService, { StyleProfilePreferences } from './userPreferencesService';

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
   * Enhance search query with user's style preferences
   */
  private enhanceQueryWithPreferences(query: string): string {
    let enhancedQuery = query;

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

    // Removed try-on filters - they're for virtual try-on, not shopping search
    // These filters were excluding valid product listings

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
        fetch('/api/serpapi-search', {
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
        fetch('/api/serpapi-amazon', {
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
        const amazonData = await amazonResponse.value.json();
        const amazonProducts = this.transformResults(amazonData.shopping_results || []);
        console.log(`🛍️ [AMAZON] Found ${amazonProducts.length} Amazon products`);
        allResults.push(...amazonProducts);
      }

      // Process Google Shopping results
      if (googleShoppingResponse.status === 'fulfilled' && googleShoppingResponse.value.ok) {
        const googleData = await googleShoppingResponse.value.json();
        const googleProducts = this.transformResults(googleData.shopping_results || []);
        console.log(`🔍 [GOOGLE-SHOPPING] Found ${googleProducts.length} products`);
        allResults.push(...googleProducts);
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
      }

      // Limit to maxResults
      const finalResults = filteredResults.slice(0, maxResults);
      console.log(`✅ [SERPAPI] Returning ${finalResults.length} products (Amazon prioritized)`);

      return finalResults;

    } catch (error) {
      console.error('❌ [SERPAPI] Search failed:', error);
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

    if (titleLower.includes('dress')) return 'dress';
    if (titleLower.includes('top') || titleLower.includes('shirt') || titleLower.includes('blouse')) return 'top';
    if (titleLower.includes('pants') || titleLower.includes('jeans') || titleLower.includes('trousers')) return 'bottom';
    if (titleLower.includes('skirt')) return 'skirt';
    if (titleLower.includes('jacket') || titleLower.includes('coat')) return 'outerwear';
    if (titleLower.includes('shoes') || titleLower.includes('heels') || titleLower.includes('boots')) return 'shoes';

    return 'clothing';
  }

  /**
   * Filter results by priority stores
   */
  private filterByStores(results: ProductSearchResult[], storeDomains: string[]): ProductSearchResult[] {
    const storeNames = storeDomains.map(domain =>
      domain.replace('www.', '').replace('.com', '').toLowerCase()
    );

    return results.filter(product => {
      const productStore = product.store.toLowerCase();
      return storeNames.some(store =>
        productStore.includes(store) || store.includes(productStore)
      );
    });
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
