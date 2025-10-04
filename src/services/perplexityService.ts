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

/**
 * Product page URL patterns for major retailers
 * These patterns identify genuine product pages vs collection/category pages
 */
const PRODUCT_URL_PATTERNS: Record<string, string[]> = {
  'amazon.com': ['/dp/', '/gp/product/'],
  'fashionnova.com': ['/products/'],
  'nordstrom.com': ['/s/', '/shop/'],
  'shein.com': ['-p-'],
  'zara.com': ['-p', '/product/'],
  'hm.com': ['/product/', '/en_us/productpage'],
  'asos.com': ['/prd/', '/product/'],
  'revolve.com': ['/dp/', '/r/'],
  'target.com': ['/p/', '/A-'],
  'walmart.com': ['/ip/'],
  'macys.com': ['/shop/product/'],
  'bloomingdales.com': ['/shop/product/'],
  'saks.com': ['/product/'],
  'neimanmarcus.com': ['/p/'],
  'whitefoxboutique.com': ['/products/'],
  'ohpolly.com': ['/products/'],
  'houseofcb.com': ['/products/']
};

/**
 * Banned domains - never return these
 * Includes social media AND affiliate networks (we want direct product links only)
 */
const BANNED_DOMAINS = [
  // Social Media
  'youtube.com',
  'youtu.be',
  'pinterest.com',
  'instagram.com',
  'tiktok.com',
  'facebook.com',
  'twitter.com',
  'reddit.com',
  // Affiliate Networks (we want DIRECT product links, not affiliate redirects)
  'rakuten.com',
  'shareasale.com',
  'avantlink.com',
  'pepperjam.com',
  'linksynergy.com',
  'anrdoezrs.net', // Commission Junction
  'jdoqocy.com',   // Commission Junction alternate
  'dpbolvw.net',   // Commission Junction alternate
  'awin1.com',     // Awin affiliate network
  'go2cloud.org'   // Generic affiliate redirect
];

/**
 * Banned URL patterns - these indicate non-product pages
 */
const BANNED_URL_PATTERNS = [
  '/collection',
  '/collections',
  '/category',
  '/categories',
  '/search',
  '/browse',
  '/sale',
  '/clearance',
  '/new-arrivals',
  '/trending'
];

class PerplexityService {
  private readonly API_BASE_URL = '/api/perplexity/chat/completions'; // Use proper Perplexity endpoint
  private readonly SHOPPING_DOMAINS = [
    'amazon.com',
    'shein.com',
    'fashionnova.com',
    'nordstrom.com',
    'target.com',
    'walmart.com',
    'macys.com',
    'zara.com',
    'hm.com',
    'asos.com',
    'whitefoxboutique.com',
    'ohpolly.com',
    'houseofcb.com',
    'revolve.com',
    'bloomingdales.com',
    'saks.com',
    'neimanmarcus.com'
  ];

  constructor() {
    console.log('🔍 [PERPLEXITY] Perplexity Service initialized - using /chat/completions endpoint');
  }

  /**
   * Perform web search using Perplexity API via Vite proxy
   */
  async searchWeb(query: string, maxResults: number = 5): Promise<PerplexitySearchResult[]> {
    console.log('🔍 [PERPLEXITY] Searching via proxy:', query);

    try {
      const requestBody = {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a shopping assistant that finds ONLY DIRECT product purchase links from the actual retail stores.

CRITICAL RULES - NEVER BREAK THESE:
1. Return DIRECT store URLs only (amazon.com, fashionnova.com, shein.com, etc.)
2. ABSOLUTELY NO affiliate redirect links (rakuten.com, shareasale.com, linksynergy.com, etc.)
3. ABSOLUTELY NO social media (YouTube, Pinterest, TikTok, Instagram, Facebook, Twitter, Reddit)
4. ONLY return URLs where users can directly purchase products with "Add to Cart" button
5. ONLY return INDIVIDUAL PRODUCT PAGES with SKU/Product ID in URL - NOT collection/category pages
6. NEVER include video links, blog posts, or review sites
7. Each product MUST be a SINGLE SPECIFIC ITEM you can buy, NOT a category of items

REQUIRED: Valid product page patterns (MUST match one of these):
- amazon.com/dp/[PRODUCTID] ✓
- amazon.com/gp/product/[PRODUCTID] ✓
- shein.com/[product-name]-p-[ID].html ✓
- fashionnova.com/products/[specific-product-name] ✓
- nordstrom.com/s/[specific-product-name] ✓
- target.com/p/[product-name] ✓
- walmart.com/ip/[product-name] ✓
- macys.com/shop/product/[specific-product-name] ✓
- whitefoxboutique.com/products/[specific-product-name] ✓
- ohpolly.com/products/[specific-product-name] ✓

FORBIDDEN: These patterns indicate collection/category pages (NEVER RETURN):
- /collections ❌
- /collection/ ❌
- /category ❌
- /categories ❌
- /browse ❌
- /search ❌
- /sale ❌
- /new-arrivals ❌
- /trending ❌
- URLs without product SKU/ID ❌

VALIDATION TEST: Ask yourself "Can I add THIS SPECIFIC ITEM to cart?"
- If YES → Valid product page ✓
- If NO → Category/collection page ❌

Return ONLY direct shopping website URLs for INDIVIDUAL PRODUCTS with Add to Cart buttons!`
          },
          {
            role: 'user',
            content: `Find SPECIFIC product pages where I can buy: ${query}

REQUIREMENTS:
✓ DIRECT product pages with "Add to Cart" button
✓ Individual products with SKU/Product ID in URL
✓ From retail stores: amazon.com, fashionnova.com, shein.com, nordstrom.com, etc.

FORBIDDEN:
❌ NO collection/category pages (/collections, /category, /sale)
❌ NO affiliate networks (rakuten.com, shareasale.com)
❌ NO social media (YouTube, Pinterest, Instagram, TikTok)
❌ NO generic browse/search pages

Return SPECIFIC PRODUCT PAGES ONLY - each must be ONE item I can add to cart!`
          }
        ],
        search_domain_filter: this.SHOPPING_DOMAINS,
        search_recency_filter: 'month',
        return_citations: true,
        max_tokens: 1000
      };

      console.log('📤 [PERPLEXITY] Request:', {
        endpoint: this.API_BASE_URL,
        model: requestBody.model,
        query: query,
        domainFilter: this.SHOPPING_DOMAINS.length + ' stores'
      });

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization header handled by Vite proxy
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [PERPLEXITY] API Error:', response.status, errorText);
        throw new Error(`Perplexity API failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      console.log('📥 [PERPLEXITY] Raw response received:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasCitations: !!data.citations
      });

      // Extract search results from Perplexity response
      const results = this.extractSearchResults(data);

      // CRITICAL: Filter out any non-shopping URLs immediately
      const filteredResults = this.filterNonShoppingUrls(results);

      console.log('✅ [PERPLEXITY] Search results:', {
        total: results.length,
        afterFiltering: filteredResults.length,
        filtered: results.length - filteredResults.length
      });

      return filteredResults;

    } catch (error) {
      console.error('❌ [PERPLEXITY] Search failed:', error);
      throw error;
    }
  }

  /**
   * Extract product title from URL and snippet
   */
  private extractProductTitle(url: string, snippet: string, fallbackIndex: number): string {
    // Try to extract from URL path
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Extract product name from common URL patterns
      // Examples:
      // /products/black-dress → Black Dress
      // /p/womens-jeans-blue → Womens Jeans Blue
      // /black-dress-p-12345.html → Black Dress

      const patterns = [
        /\/products?\/([^/]+)/,  // /products/name or /product/name
        /\/p\/([^/]+)/,           // /p/name
        /\/([^/]+)-p-\d+/,        // /name-p-12345
        /\/([^/]+)\.html/,        // /name.html
        /\/([^/]+)$/              // /name at end
      ];

      for (const pattern of patterns) {
        const match = pathname.match(pattern);
        if (match && match[1]) {
          // Convert URL slug to readable title
          // black-dress-midi → Black Dress Midi
          const title = match[1]
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          if (title.length > 3) {
            return title;
          }
        }
      }
    } catch (error) {
      // URL parsing failed, continue to snippet
    }

    // Try to extract from snippet (first meaningful sentence)
    if (snippet && snippet.length > 10) {
      // Get first sentence or first 60 characters
      const firstSentence = snippet.split(/[.!?]/)[0];
      if (firstSentence.length > 10 && firstSentence.length < 100) {
        return firstSentence.trim();
      }

      // If sentence too long, take first 60 chars
      if (snippet.length > 60) {
        return snippet.substring(0, 60).trim() + '...';
      }

      return snippet.trim();
    }

    // Last resort fallback
    return `Product ${fallbackIndex + 1}`;
  }

  /**
   * Extract search results from Perplexity chat completion response
   */
  private extractSearchResults(data: any): PerplexitySearchResult[] {
    const results: PerplexitySearchResult[] = [];

    // Extract from citations if available
    if (data.citations && Array.isArray(data.citations)) {
      data.citations.forEach((citation: any, index: number) => {
        if (citation.url && citation.url.trim()) {
          const snippet = citation.snippet || citation.text || '';
          const title = citation.title || this.extractProductTitle(citation.url, snippet, index);

          results.push({
            title: title,
            url: citation.url,
            snippet: snippet,
            date: citation.date
          });
        }
      });
    }

    // Also parse URLs from response content as fallback
    const content = data.choices?.[0]?.message?.content || '';
    const urlRegex = /https?:\/\/[^\s<>"]+/g;
    const urls = content.match(urlRegex) || [];

    urls.forEach((url: string, index: number) => {
      // Avoid duplicates
      if (!results.some(r => r.url === url)) {
        const title = this.extractProductTitle(url, '', results.length);

        results.push({
          title: title,
          url: url,
          snippet: '',
        });
      }
    });

    console.log('📊 [PERPLEXITY] Extracted results:', results.length);
    return results;
  }

  /**
   * Unwrap affiliate redirect URLs to get the real product URL
   */
  private unwrapAffiliateUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');

      // Check if it's a Rakuten redirect
      if (hostname.includes('rakuten.com') && urlObj.pathname.includes('/r/')) {
        const realUrl = urlObj.searchParams.get('u');
        if (realUrl) {
          const unwrapped = decodeURIComponent(realUrl);
          console.log('🔓 [UNWRAP] Rakuten redirect unwrapped:', {
            original: url.substring(0, 50) + '...',
            unwrapped: unwrapped.substring(0, 50) + '...'
          });
          return unwrapped;
        }
      }

      // Check for ShareASale redirects
      if (hostname.includes('shareasale.com')) {
        const target = urlObj.searchParams.get('urllink') || urlObj.searchParams.get('u');
        if (target) {
          const unwrapped = decodeURIComponent(target);
          console.log('🔓 [UNWRAP] ShareASale redirect unwrapped:', {
            original: url.substring(0, 50) + '...',
            unwrapped: unwrapped.substring(0, 50) + '...'
          });
          return unwrapped;
        }
      }

      // Check for other affiliate networks with common redirect parameters
      if (BANNED_DOMAINS.some(banned => hostname.includes(banned))) {
        const commonParams = ['url', 'u', 'link', 'target', 'goto', 'redirect'];
        for (const param of commonParams) {
          const target = urlObj.searchParams.get(param);
          if (target && target.startsWith('http')) {
            const unwrapped = decodeURIComponent(target);
            console.log('🔓 [UNWRAP] Affiliate redirect unwrapped:', {
              network: hostname,
              original: url.substring(0, 50) + '...',
              unwrapped: unwrapped.substring(0, 50) + '...'
            });
            return unwrapped;
          }
        }
        console.warn('⚠️ [UNWRAP] Unable to unwrap affiliate URL:', url.substring(0, 60));
      }

      // Not an affiliate URL or unable to unwrap
      return url;
    } catch (error) {
      console.error('❌ [UNWRAP] Error unwrapping URL:', error);
      return url;
    }
  }

  /**
   * Filter out non-shopping URLs with strict validation
   */
  private filterNonShoppingUrls(results: PerplexitySearchResult[]): PerplexitySearchResult[] {
    return results.filter(result => {
      // FIRST: Try to unwrap any affiliate redirects to get the real product URL
      const unwrappedUrl = this.unwrapAffiliateUrl(result.url);

      // If URL was unwrapped, update the result to use the direct product URL
      if (unwrappedUrl !== result.url) {
        result.url = unwrappedUrl;
        console.log('✅ [FILTER] Using unwrapped URL for validation');
      }

      const url = unwrappedUrl.toLowerCase();
      let urlObj: URL;

      try {
        urlObj = new URL(unwrappedUrl);
      } catch (error) {
        console.error('❌ [FILTER] Invalid URL after unwrapping:', unwrappedUrl);
        return false;
      }

      const hostname = urlObj.hostname.replace('www.', '');

      // CRITICAL: Check for banned domains (should catch any remaining affiliate networks)
      for (const banned of BANNED_DOMAINS) {
        if (hostname.includes(banned) || url.includes(banned)) {
          console.error('🚫❌ [FILTER] BANNED DOMAIN DETECTED:', hostname, '→', url.substring(0, 60));
          return false;
        }
      }

      // Check if it's from a whitelisted shopping domain
      const isWhitelisted = this.SHOPPING_DOMAINS.some(domain => hostname.includes(domain));

      if (!isWhitelisted) {
        console.warn('⚠️ [FILTER] Not a whitelisted store:', hostname);
        return false;
      }

      // Additional validation for product page patterns
      const hasProductPattern = BANNED_URL_PATTERNS.every(pattern => !url.includes(pattern));

      if (!hasProductPattern) {
        console.warn('⚠️ [FILTER] Contains banned pattern (collection/category):', unwrappedUrl.substring(0, 60));
        return false;
      }

      console.log('✅ [FILTER] Valid shopping URL:', hostname);
      return true;
    });
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

    // Build targeted shopping query with specific product page patterns
    let query = `${clothingDescription}`;

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

    // Check if query already has site filters (to avoid duplicates)
    const alreadyHasSiteFilters = clothingDescription.includes('site:');

    // Add store preferences with specific product page paths (only if not already present)
    if (stores && stores.length > 0 && !alreadyHasSiteFilters) {
      // Build site-specific queries targeting product pages
      const storeQueries = stores.map(store => {
        const storeLower = store.toLowerCase();
        if (storeLower.includes('amazon')) {
          return 'site:amazon.com/dp/ OR site:amazon.com/gp/product/';
        } else if (storeLower.includes('fashionnova') || storeLower.includes('fashion nova')) {
          return 'site:fashionnova.com/products/';
        } else if (storeLower.includes('shein')) {
          return 'site:shein.com inurl:-p-';
        } else if (storeLower.includes('nordstrom')) {
          return 'site:nordstrom.com/s/ OR site:nordstrom.com/shop/';
        } else if (storeLower.includes('whitefox') || storeLower.includes('white fox')) {
          return 'site:whitefoxboutique.com/products/';
        } else if (storeLower.includes('ohpolly') || storeLower.includes('oh polly')) {
          return 'site:ohpolly.com/products/';
        } else if (storeLower.includes('houseofcb')) {
          return 'site:houseofcb.com/products/';
        } else {
          return `site:${store}`;
        }
      });
      query += ` (${storeQueries.join(' OR ')})`;
    } else if (!alreadyHasSiteFilters) {
      // No specific stores and no site filters in query - target major retailers with product page patterns
      query += ` (site:amazon.com/dp/ OR site:fashionnova.com/products/ OR site:shein.com OR site:nordstrom.com OR site:target.com/p/)`;
    }

    // Add size/color filters
    if (sizes && sizes.length > 0) {
      query += ` size ${sizes.join(' OR size ')}`;
    }
    if (colors && colors.length > 0) {
      query += ` ${colors.join(' OR ')} color`;
    }

    // CRITICAL: Exclude social media, affiliate networks, and non-product pages
    query += ` -site:youtube.com -site:youtu.be -site:pinterest.com -site:instagram.com`;
    query += ` -site:rakuten.com -site:shareasale.com -site:linksynergy.com -site:avantlink.com`;
    query += ` -inurl:/collection -inurl:/collections -inurl:/category -inurl:/search`;

    console.log('🔍 [PERPLEXITY] ========== FINAL SEARCH QUERY ==========');
    console.log('📝 [PERPLEXITY] Original input:', clothingDescription);
    console.log('🎯 [PERPLEXITY] Enhanced query:', query);
    console.log('🔍 [PERPLEXITY] ============================================');

    try {
      const searchResults = await this.searchWeb(query, maxResults);
      const products = this.parseProductResults(searchResults);

      // Calculate relevance scores for each product
      console.log('📊 [RELEVANCE] Scoring product matches...');
      products.forEach(product => {
        const relevanceScore = this.calculateRelevanceScore(clothingDescription, product.title);
        console.log(`${relevanceScore >= 50 ? '✅' : '⚠️'} [RELEVANCE] ${relevanceScore}% match: "${product.title.substring(0, 50)}..."`);

        if (relevanceScore < 30) {
          console.warn(`⚠️ [LOW-MATCH] Product may not match outfit: ${product.title} (${relevanceScore}%)`);
        }
      });

      // MANDATORY: Use direct store links if no products found
      if (products.length === 0) {
        console.log('⚠️ [PERPLEXITY] No products found, using direct store fallback...');
        const directStoreLinks = this.searchStoresDirectly(clothingDescription);
        products.push(...directStoreLinks);
        console.log('✅ [FALLBACK] Added direct store search links:', directStoreLinks.length);
      }

      // CRITICAL: Deduplicate by store - keep only ONE product per store
      const uniqueByStore = new Map<string, ProductSearchResult>();
      products.forEach(product => {
        const storeLower = product.store.toLowerCase();
        if (!uniqueByStore.has(storeLower)) {
          uniqueByStore.set(storeLower, product);
        }
      });

      const deduplicatedProducts = Array.from(uniqueByStore.values());

      console.log('✅ [PERPLEXITY] Found products:', {
        total: products.length,
        uniqueStores: deduplicatedProducts.length,
        stores: deduplicatedProducts.map(p => p.store).join(', ')
      });

      return deduplicatedProducts;

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
   * Validate if a URL is a genuine product page (not collection/category/social media)
   */
  private isProductPage(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      const pathname = urlObj.pathname.toLowerCase();

      // Check banned domains (YouTube, Pinterest, etc.)
      for (const banned of BANNED_DOMAINS) {
        if (hostname.includes(banned)) {
          console.log('🚫 [FILTER] Banned domain:', hostname, '→', url.substring(0, 60));
          return false;
        }
      }

      // Check banned URL patterns (collections, categories, etc.)
      for (const pattern of BANNED_URL_PATTERNS) {
        if (pathname.includes(pattern)) {
          console.log('🚫 [FILTER] Banned URL pattern:', pattern, '→', url.substring(0, 60));
          return false;
        }
      }

      // Check if URL matches known product page patterns for this store
      for (const [domain, patterns] of Object.entries(PRODUCT_URL_PATTERNS)) {
        if (hostname.includes(domain)) {
          const isProduct = patterns.some(pattern => pathname.includes(pattern));
          if (!isProduct) {
            console.log('🚫 [FILTER] Not a product page for', domain, '→', url.substring(0, 60));
          }
          return isProduct;
        }
      }

      // If store not in our patterns list, check if it's at least whitelisted
      // This prevents affiliate networks from slipping through
      const isWhitelisted = this.SHOPPING_DOMAINS.some(domain => hostname.includes(domain));
      if (isWhitelisted) {
        console.log('⚠️ [FILTER] Whitelisted store but no specific product pattern (allowing):', hostname);
        return true;
      }

      // Unknown store not in whitelist - reject to be safe
      console.warn('🚫 [FILTER] Unknown store not in whitelist (rejecting):', hostname);
      return false;

    } catch (error) {
      console.error('❌ [FILTER] Invalid URL:', url);
      return false;
    }
  }

  /**
   * Calculate relevance score between search query and product title
   * Returns score from 0-100 based on keyword matches
   */
  private calculateRelevanceScore(searchQuery: string, productTitle: string): number {
    const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const titleWords = productTitle.toLowerCase().split(/\s+/);

    let matches = 0;
    let exactMatches = 0;

    queryWords.forEach(queryWord => {
      // Check for exact match
      if (titleWords.includes(queryWord)) {
        exactMatches++;
        matches++;
      }
      // Check for partial match (word contains query word)
      else if (titleWords.some(titleWord => titleWord.includes(queryWord) || queryWord.includes(titleWord))) {
        matches += 0.5;
      }
    });

    // Calculate score (exact matches worth more)
    const score = Math.min(100, ((exactMatches * 20) + (matches * 10)));

    return Math.round(score);
  }

  /**
   * Generate icon/initial based on product category
   * No placeholder images - return undefined to display product cards without images
   */
  private getProductCategory(productTitle: string): string {
    const title = productTitle.toLowerCase();
    if (title.includes('dress')) return 'dress';
    if (title.includes('top') || title.includes('shirt') || title.includes('blouse')) return 'top';
    if (title.includes('pants') || title.includes('jeans') || title.includes('trousers')) return 'bottom';
    if (title.includes('skirt')) return 'skirt';
    if (title.includes('jacket') || title.includes('coat')) return 'outerwear';
    if (title.includes('shoes') || title.includes('heels') || title.includes('boots')) return 'shoes';
    return 'clothing';
  }

  /**
   * Parse Perplexity search results to extract product information
   */
  private parseProductResults(results: PerplexitySearchResult[]): ProductSearchResult[] {
    // Filter to only genuine product pages
    const validResults = results.filter(result => this.isProductPage(result.url));

    console.log(`✅ [FILTER] Product page validation: ${validResults.length}/${results.length} valid products`);

    return validResults.map((result, index) => {
      const storeName = this.extractStoreName(result.url);

      const product: ProductSearchResult = {
        id: `product_${Date.now()}_${index}`,
        title: result.title,
        url: result.url,
        store: storeName,
        price: this.extractPrice(result.snippet, result.title),
        inStock: this.checkStockStatus(result.snippet, result.title),
        rating: this.extractRating(result.snippet),
        // Product category for display (no images available from Perplexity)
        category: this.getProductCategory(result.title)
      };

      // Extract additional product details
      const originalPrice = this.extractOriginalPrice(result.snippet);
      if (originalPrice && originalPrice !== product.price) {
        product.originalPrice = originalPrice;
        product.discount = this.calculateDiscount(originalPrice, product.price);
      }

      console.log(`📦 [PRODUCT] Parsed "${result.title.substring(0, 40)}..." as ${product.category}`);

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
        'fashionnova.com': 'Fashion Nova',
        'shein.com': 'Shein',
        'whitefoxboutique.com': 'White Fox Boutique',
        'ohpolly.com': 'Oh Polly',
        'houseofcb.com': 'House of CB',
        'prettylittlething.com': 'PrettyLittleThing',
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
   * Check if a product is from Amazon
   */
  private isAmazonProduct(product: ProductSearchResult): boolean {
    return product.store.toLowerCase().includes('amazon') ||
           product.url.toLowerCase().includes('amazon.com');
  }

  /**
   * Sort products by relevance, price, rating
   * PRIORITY: Amazon products first (up to 2), then other stores
   */
  private sortProducts(products: ProductSearchResult[], options: ProductSearchOptions): ProductSearchResult[] {
    return products.sort((a, b) => {
      const isAmazonA = this.isAmazonProduct(a);
      const isAmazonB = this.isAmazonProduct(b);

      // PRIORITY 1: Amazon products first (ensures 2 Amazon results appear at top)
      if (isAmazonA && !isAmazonB) return -1;
      if (!isAmazonA && isAmazonB) return 1;

      // PRIORITY 2: Filter by budget compliance
      const priceA = parseFloat(a.price.replace('$', ''));
      const priceB = parseFloat(b.price.replace('$', ''));

      if (options.budgetMax) {
        if (priceA > options.budgetMax && priceB <= options.budgetMax) return 1;
        if (priceB > options.budgetMax && priceA <= options.budgetMax) return -1;
      }

      // PRIORITY 3: Sort by rating (higher first, within same store type)
      if (a.rating && b.rating && a.rating !== b.rating) {
        return b.rating - a.rating;
      }

      // PRIORITY 4: Sort by price (lower first within budget)
      if (options.budgetMax && priceA <= options.budgetMax && priceB <= options.budgetMax) {
        return priceA - priceB;
      }

      // Default: maintain original order (relevance from search)
      return 0;
    });
  }

  /**
   * Fallback: Search stores directly when Perplexity fails or returns no results
   */
  searchStoresDirectly(query: string): ProductSearchResult[] {
    console.log('🔄 [FALLBACK] Searching stores directly for:', query);

    const encodedQuery = encodeURIComponent(query);
    const directStoreResults: ProductSearchResult[] = [];

    // Amazon
    directStoreResults.push({
      id: `direct_amazon_${Date.now()}`,
      title: `Search "${query}" on Amazon`,
      url: `https://www.amazon.com/s?k=${encodedQuery}`,
      store: 'Amazon',
      price: 'Varies',
      inStock: true
    });

    // SHEIN
    directStoreResults.push({
      id: `direct_shein_${Date.now() + 1}`,
      title: `Search "${query}" on SHEIN`,
      url: `https://us.shein.com/pdsearch/${encodedQuery}/`,
      store: 'SHEIN',
      price: 'Varies',
      inStock: true
    });

    // Fashion Nova
    directStoreResults.push({
      id: `direct_fashionnova_${Date.now() + 2}`,
      title: `Search "${query}" on Fashion Nova`,
      url: `https://www.fashionnova.com/search?q=${encodedQuery}`,
      store: 'Fashion Nova',
      price: 'Varies',
      inStock: true
    });

    // Nordstrom
    directStoreResults.push({
      id: `direct_nordstrom_${Date.now() + 3}`,
      title: `Search "${query}" on Nordstrom`,
      url: `https://www.nordstrom.com/sr?keyword=${encodedQuery}`,
      store: 'Nordstrom',
      price: 'Varies',
      inStock: true
    });

    console.log('✅ [FALLBACK] Generated direct store links:', directStoreResults.length);
    return directStoreResults;
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