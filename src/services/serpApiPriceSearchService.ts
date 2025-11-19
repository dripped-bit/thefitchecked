/**
 * SerpAPI Price Search Service
 * Searches for fashion items across retailers to find best deals
 */

import { SearchQueries } from './claudeComparisonService';

export interface DealResult {
  title: string;
  price: string;
  priceValue: number;
  retailer: string;
  url: string;
  image?: string;
  rating?: number;
  reviews?: number;
}

export interface ComparisonResults {
  exactMatches: DealResult[];
  similarItems: DealResult[];
}

class SerpApiPriceSearchService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_SERPAPI_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ [SERPAPI-PRICE] No API key found');
    }
  }

  async searchDeals(queries: SearchQueries): Promise<ComparisonResults> {
    try {
      console.log('🔍 [SERPAPI-PRICE] Searching for deals...');
      console.log('📝 [SERPAPI-PRICE] Exact match query:', queries.exactMatch);
      console.log('📝 [SERPAPI-PRICE] Similar items queries:', queries.similarItems);

      // Search for exact matches
      const exactMatches = await this.search(queries.exactMatch);
      console.log(`✅ [SERPAPI-PRICE] Found ${exactMatches.length} exact matches`);

      // Search for similar items
      const similarResults = await Promise.all(
        queries.similarItems.map(q => this.search(q))
      );
      const similarItems = similarResults.flat();
      console.log(`✅ [SERPAPI-PRICE] Found ${similarItems.length} similar items`);

      return {
        exactMatches: exactMatches.sort((a, b) => a.priceValue - b.priceValue),
        similarItems: similarItems.sort((a, b) => a.priceValue - b.priceValue)
      };
    } catch (error) {
      console.error('❌ [SERPAPI-PRICE] Error searching for deals:', error);
      return {
        exactMatches: [],
        similarItems: []
      };
    }
  }

  private async search(query: string): Promise<DealResult[]> {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ [SERPAPI-PRICE] No API key, skipping search');
        return [];
      }

      const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${this.apiKey}&num=10`;
      
      console.log(`🌐 [SERPAPI-PRICE] Fetching: ${query}`);
      console.log(`🔑 [SERPAPI-PRICE] API Key present: ${!!this.apiKey}, length: ${this.apiKey?.length || 0}`);
      
      const response = await fetch(url);
      
      console.log(`📡 [SERPAPI-PRICE] Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [SERPAPI-PRICE] Error response:`, errorText);
        throw new Error(`SerpAPI returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`📦 [SERPAPI-PRICE] Got data:`, JSON.stringify(data).substring(0, 200));
      
      if (!data.shopping_results || data.shopping_results.length === 0) {
        console.log(`⚠️ [SERPAPI-PRICE] No results for: ${query}`);
        return [];
      }

      const results: DealResult[] = data.shopping_results
        .slice(0, 10)
        .map((result: any) => ({
          title: result.title || 'Unknown',
          price: result.price || 'N/A',
          priceValue: this.extractPrice(result.price || '0'),
          retailer: result.source || 'Unknown',
          url: result.link || '',
          image: result.thumbnail,
          rating: result.rating,
          reviews: result.reviews
        }))
        .filter((r: DealResult) => r.priceValue > 0); // Filter out invalid prices

      console.log(`✅ [SERPAPI-PRICE] Processed ${results.length} valid results for: ${query}`);
      return results;
    } catch (error: any) {
      console.error(`❌ [SERPAPI-PRICE] Search failed for "${query}":`, error);
      console.error(`❌ [SERPAPI-PRICE] Error details:`, {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      return [];
    }
  }

  private extractPrice(priceString: string): number {
    // Extract numeric value from price string like "$49.99" or "49.99 USD"
    const match = priceString.match(/[\d,]+\.?\d*/);
    if (!match) return 0;
    return parseFloat(match[0].replace(/,/g, ''));
  }
}

export default new SerpApiPriceSearchService();
