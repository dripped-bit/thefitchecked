/**
 * SerpAPI Shopping Service
 * Provides real product search with images via Google Shopping
 */

import { PRIMARY_PRIORITY_STORES, SECONDARY_PRIORITY_STORES } from '../config/priorityStores';

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
  constructor() {
    console.log('✅ [SERPAPI] Service initialized - using backend API route');
  }

  /**
   * Search for products using Google Shopping
   */
  async searchProducts(
    query: string,
    options: ProductSearchOptions = {}
  ): Promise<ProductSearchResult[]> {
    const { budgetMin, budgetMax, stores, maxResults = 20 } = options;

    // Enhance query for better try-on compatible images (front-facing model photos)
    const enhancedQuery = `${query} model wearing full body front view`;

    console.log('🛍️ [SERPAPI] Searching Google Shopping:', {
      originalQuery: query,
      enhancedQuery,
      budgetMin,
      budgetMax,
      maxResults
    });

    try {
      // Call backend API route instead of SerpAPI directly (fixes CORS)
      const response = await fetch('/api/serpapi-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: enhancedQuery,
          num: maxResults,
          budgetMin,
          budgetMax
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [SERPAPI] API Error:', response.status, errorText);
        throw new Error(`SerpAPI failed: ${response.status}`);
      }

      const data = await response.json();

      console.log('📥 [SERPAPI] Raw response:', {
        hasResults: !!data.shopping_results,
        count: data.shopping_results?.length || 0
      });

      const results = this.transformResults(data.shopping_results || []);

      // Filter by priority stores if specified
      let filteredResults = results;
      if (stores && stores.length > 0) {
        filteredResults = this.filterByStores(results, stores);
        console.log(`🏪 [SERPAPI] Filtered to priority stores: ${filteredResults.length}/${results.length}`);
      }

      console.log(`✅ [SERPAPI] Found ${filteredResults.length} products`);
      return filteredResults;

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
