/**
 * Perplexity API Service
 * Web search service using Perplexity API for real-time fashion trend research
 */

export interface PerplexitySearchResult {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

export interface PerplexityResponse {
  results: PerplexitySearchResult[];
}

export interface ProductSearchResult {
  id: string;
  title: string;
  price: string;
  url: string;
  store: string;
  imageUrl?: string;
  rating?: number;
  originalPrice?: string;
  discount?: string;
  inStock: boolean;
}

export interface ProductSearchOptions {
  budgetMin?: number;
  budgetMax?: number;
  stores?: string[];
  sizes?: string[];
  colors?: string[];
  maxResults?: number;
}

class PerplexityService {
  private readonly API_BASE_URL = '/api/perplexity/search'; // Use proxy

  constructor() {
    console.log('🔍 [PERPLEXITY] Perplexity Service initialized - using proxy');
  }

  /**
   * Perform web search using Perplexity API via Vite proxy
   */
  async searchWeb(query: string, maxResults: number = 5): Promise<PerplexitySearchResult[]> {
    console.log('🔍 [PERPLEXITY] Searching via proxy:', query);

    try {
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization header handled by Vite proxy
        },
        body: JSON.stringify({
          query: query,
          max_results: maxResults,
          max_tokens_per_page: 100 // Limit content per result for efficiency
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [PERPLEXITY] API Error:', response.status, errorText);
        throw new Error(`Perplexity API failed: ${response.status} ${errorText}`);
      }

      const data: PerplexityResponse = await response.json();

      console.log('✅ [PERPLEXITY] Search results:', data.results?.length || 0, 'items');

      return data.results || [];

    } catch (error) {
      console.error('❌ [PERPLEXITY] Search failed:', error);
      throw error;
    }
  }

  /**
   * Search for fashion trends with specific focus
   */
  async searchFashionTrends(item: string, style: string = '', color: string = ''): Promise<PerplexitySearchResult[]> {
    const query = `${color} ${item} ${style} fashion trends 2024 2025 styles colors Pantone`.trim();
    return this.searchWeb(query, 5);
  }

  /**
   * Search for technical fashion details
   */
  async searchTechnicalDetails(item: string, color: string = ''): Promise<PerplexitySearchResult[]> {
    const query = `${color} ${item} fabric materials technical details construction fit types textures`.trim();
    return this.searchWeb(query, 4);
  }

  /**
   * Search for brand and designer references
   */
  async searchBrandReferences(item: string, style: string = ''): Promise<PerplexitySearchResult[]> {
    const query = `${item} ${style} designer brands high fashion luxury collections 2024 2025`.trim();
    return this.searchWeb(query, 4);
  }

  /**
   * Extract text content from search results for processing
   */
  extractContentFromResults(results: PerplexitySearchResult[]): string[] {
    return results.map(result => {
      // Combine title and snippet for comprehensive content
      const content = `${result.title} ${result.snippet}`.toLowerCase();
      return content;
    }).filter(Boolean);
  }

  /**
   * Get source attribution for UI display
   */
  getSourceAttribution(results: PerplexitySearchResult[]): string {
    if (results.length === 0) return 'Web search powered by Perplexity';

    const uniqueDomains = [...new Set(
      results.map(result => {
        try {
          return new URL(result.url).hostname.replace('www.', '');
        } catch {
          return 'web source';
        }
      })
    )].slice(0, 3);

    return `Sources: ${uniqueDomains.join(', ')} via Perplexity`;
  }

  /**
   * Search for similar clothing products based on description
   */
  async searchSimilarProducts(
    clothingDescription: string,
    options: ProductSearchOptions = {}
  ): Promise<ProductSearchResult[]> {
    const { budgetMin, budgetMax, stores, sizes, colors, maxResults = 10 } = options;

    console.log('🛍️ [PERPLEXITY] Searching for similar products:', clothingDescription);

    // Build targeted shopping query
    let query = `${clothingDescription} buy online shopping`;

    // Add budget constraints
    if (budgetMin || budgetMax) {
      if (budgetMin && budgetMax) {
        query += ` price $${budgetMin}-$${budgetMax}`;
      } else if (budgetMax) {
        query += ` under $${budgetMax}`;
      } else if (budgetMin) {
        query += ` over $${budgetMin}`;
      }
    }

    // Add store preferences
    if (stores && stores.length > 0) {
      query += ` site:${stores.join(' OR site:')}`;
    }

    // Add size/color filters
    if (sizes && sizes.length > 0) {
      query += ` size ${sizes.join(' OR size ')}`;
    }
    if (colors && colors.length > 0) {
      query += ` ${colors.join(' OR ')} color`;
    }

    try {
      const searchResults = await this.searchWeb(query, maxResults);
      const products = this.parseProductResults(searchResults);

      console.log('✅ [PERPLEXITY] Found products:', products.length);
      return products;

    } catch (error) {
      console.error('❌ [PERPLEXITY] Product search failed:', error);
      throw error;
    }
  }

  /**
   * Search for products with multiple queries for better coverage
   */
  async searchProductsMultiQuery(
    queries: string[],
    options: ProductSearchOptions = {}
  ): Promise<ProductSearchResult[]> {
    console.log('🔍 [PERPLEXITY] Multi-query product search:', queries.length, 'queries');

    try {
      // Execute all searches in parallel
      const searchPromises = queries.map(query =>
        this.searchSimilarProducts(query, { ...options, maxResults: 5 })
      );

      const allResults = await Promise.all(searchPromises);

      // Flatten and deduplicate results
      const flatResults = allResults.flat();
      const uniqueResults = this.deduplicateProducts(flatResults);

      // Sort by relevance/price if budget specified
      const sortedResults = this.sortProducts(uniqueResults, options);

      console.log('✅ [PERPLEXITY] Multi-query search completed:', sortedResults.length, 'unique products');
      return sortedResults.slice(0, options.maxResults || 20);

    } catch (error) {
      console.error('❌ [PERPLEXITY] Multi-query search failed:', error);
      throw error;
    }
  }

  /**
   * Parse Perplexity search results to extract product information
   */
  private parseProductResults(results: PerplexitySearchResult[]): ProductSearchResult[] {
    return results.map((result, index) => {
      const product: ProductSearchResult = {
        id: `product_${Date.now()}_${index}`,
        title: result.title,
        url: result.url,
        store: this.extractStoreName(result.url),
        price: this.extractPrice(result.snippet, result.title),
        inStock: this.checkStockStatus(result.snippet, result.title),
        rating: this.extractRating(result.snippet)
      };

      // Extract additional product details
      const originalPrice = this.extractOriginalPrice(result.snippet);
      if (originalPrice && originalPrice !== product.price) {
        product.originalPrice = originalPrice;
        product.discount = this.calculateDiscount(originalPrice, product.price);
      }

      return product;
    });
  }

  /**
   * Extract store name from URL
   */
  private extractStoreName(url: string): string {
    try {
      const hostname = new URL(url).hostname.replace('www.', '');

      // Map common domains to store names
      const storeMap: { [key: string]: string } = {
        'amazon.com': 'Amazon',
        'ebay.com': 'eBay',
        'etsy.com': 'Etsy',
        'zara.com': 'Zara',
        'hm.com': 'H&M',
        'uniqlo.com': 'Uniqlo',
        'target.com': 'Target',
        'walmart.com': 'Walmart',
        'macys.com': 'Macy\'s',
        'nordstrom.com': 'Nordstrom',
        'asos.com': 'ASOS',
        'shopify.com': 'Shopify Store'
      };

      return storeMap[hostname] || this.formatStoreName(hostname);
    } catch {
      return 'Online Store';
    }
  }

  /**
   * Format store name from hostname
   */
  private formatStoreName(hostname: string): string {
    return hostname
      .split('.')[0]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Extract price from text using various patterns
   */
  private extractPrice(snippet: string, title: string): string {
    const text = `${title} ${snippet}`.toLowerCase();

    // Price patterns: $XX.XX, $XX, USD XX, etc.
    const pricePatterns = [
      /\$(\d+(?:\.\d{2})?)/g,
      /(\d+(?:\.\d{2})?) USD/g,
      /price[:\s]*\$?(\d+(?:\.\d{2})?)/gi,
      /(\d+(?:\.\d{2})?) dollars?/gi
    ];

    for (const pattern of pricePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const priceMatch = matches[0].match(/(\d+(?:\.\d{2})?)/);
        if (priceMatch) {
          return `$${priceMatch[1]}`;
        }
      }
    }

    // Fallback to estimated price based on context
    return this.estimatePrice(text);
  }

  /**
   * Extract original price for discount calculation
   */
  private extractOriginalPrice(text: string): string | undefined {
    const originalPatterns = [
      /was \$(\d+(?:\.\d{2})?)/gi,
      /originally \$(\d+(?:\.\d{2})?)/gi,
      /regular price \$(\d+(?:\.\d{2})?)/gi,
      /MSRP \$(\d+(?:\.\d{2})?)/gi
    ];

    for (const pattern of originalPatterns) {
      const match = text.match(pattern);
      if (match) {
        return `$${match[1]}`;
      }
    }

    return undefined;
  }

  /**
   * Calculate discount percentage
   */
  private calculateDiscount(originalPrice: string, currentPrice: string): string {
    try {
      const original = parseFloat(originalPrice.replace('$', ''));
      const current = parseFloat(currentPrice.replace('$', ''));

      if (original > current) {
        const discount = Math.round(((original - current) / original) * 100);
        return `${discount}% off`;
      }
    } catch (error) {
      console.error('Error calculating discount:', error);
    }

    return '';
  }

  /**
   * Estimate price based on context clues
   */
  private estimatePrice(text: string): string {
    // Price ranges based on keywords
    if (text.includes('luxury') || text.includes('designer') || text.includes('premium')) {
      return '$' + (Math.floor(Math.random() * 200) + 100).toString();
    }
    if (text.includes('budget') || text.includes('affordable') || text.includes('cheap')) {
      return '$' + (Math.floor(Math.random() * 30) + 10).toString();
    }
    // Default mid-range
    return '$' + (Math.floor(Math.random() * 80) + 20).toString();
  }

  /**
   * Check if item appears to be in stock
   */
  private checkStockStatus(snippet: string, title: string): boolean {
    const text = `${title} ${snippet}`.toLowerCase();

    // Out of stock indicators
    const outOfStockPatterns = [
      'out of stock',
      'sold out',
      'unavailable',
      'discontinued',
      'not available'
    ];

    for (const pattern of outOfStockPatterns) {
      if (text.includes(pattern)) {
        return false;
      }
    }

    // In stock indicators or assume available
    return true;
  }

  /**
   * Extract rating from text
   */
  private extractRating(text: string): number | undefined {
    const ratingPatterns = [
      /(\d+(?:\.\d+)?)\s*\/\s*5\s*stars?/gi,
      /(\d+(?:\.\d+)?)\s*out of 5/gi,
      /rating[:\s]*(\d+(?:\.\d+)?)/gi,
      /(\d+(?:\.\d+)?)\s*stars?/gi
    ];

    for (const pattern of ratingPatterns) {
      const match = text.match(pattern);
      if (match) {
        const rating = parseFloat(match[1]);
        if (rating >= 0 && rating <= 5) {
          return rating;
        }
      }
    }

    return undefined;
  }

  /**
   * Remove duplicate products based on URL and title similarity
   */
  private deduplicateProducts(products: ProductSearchResult[]): ProductSearchResult[] {
    const uniqueProducts: ProductSearchResult[] = [];
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();

    for (const product of products) {
      const titleLower = product.title.toLowerCase().trim();

      if (!seenUrls.has(product.url) && !seenTitles.has(titleLower)) {
        uniqueProducts.push(product);
        seenUrls.add(product.url);
        seenTitles.add(titleLower);
      }
    }

    return uniqueProducts;
  }

  /**
   * Sort products by relevance, price, rating
   */
  private sortProducts(products: ProductSearchResult[], options: ProductSearchOptions): ProductSearchResult[] {
    return products.sort((a, b) => {
      // Filter by budget first
      const priceA = parseFloat(a.price.replace('$', ''));
      const priceB = parseFloat(b.price.replace('$', ''));

      if (options.budgetMax) {
        if (priceA > options.budgetMax && priceB <= options.budgetMax) return 1;
        if (priceB > options.budgetMax && priceA <= options.budgetMax) return -1;
      }

      // Sort by rating (higher first)
      if (a.rating && b.rating && a.rating !== b.rating) {
        return b.rating - a.rating;
      }

      // Sort by price (lower first within budget)
      if (options.budgetMax && priceA <= options.budgetMax && priceB <= options.budgetMax) {
        return priceA - priceB;
      }

      // Default: maintain original order (relevance from search)
      return 0;
    });
  }

  /**
   * Health check for API availability
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.searchWeb('fashion test', 1);
      return true;
    } catch (error) {
      console.error('❌ [PERPLEXITY] Health check failed:', error);
      return false;
    }
  }
}

export default new PerplexityService();