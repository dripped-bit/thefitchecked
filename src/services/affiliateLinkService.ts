/**
 * Affiliate Link Service
 * Manages affiliate tracking codes and converts product URLs to affiliate links
 */

export interface AffiliateConfig {
  rakutenId: string;
  rakutenEEID: string;
  amazonAssociatesTag?: string;
  // Add more affiliate programs as needed
}

export interface ClickTrackingData {
  url: string;
  affiliateUrl: string;
  storeName: string;
  outfitId?: string;
  timestamp: number;
  productInfo?: any;
}

class AffiliateLinkService {
  private config: AffiliateConfig = {
    rakutenId: 'DRIPPE62',
    rakutenEEID: '28187',
    // Amazon Associates tag for affiliate revenue
    amazonAssociatesTag: 'thefitchecked-20',
  };

  private clickHistory: ClickTrackingData[] = [];
  private readonly STORAGE_KEY = 'affiliate_click_history';

  constructor() {
    this.loadClickHistory();
  }

  /**
   * Detect store name from URL
   */
  detectStoreFromUrl(url: string): string {
    if (!url) return 'unknown';

    const urlLower = url.toLowerCase();

    // Priority fashion stores (user's preferred stores)
    if (urlLower.includes('shein.com')) return 'shein';
    if (urlLower.includes('fashionnova.com')) return 'fashionnova';
    if (urlLower.includes('whitefoxboutique.com')) return 'whitefox';
    if (urlLower.includes('ohpolly.com')) return 'ohpolly';
    if (urlLower.includes('princesspolly.com')) return 'princesspolly';

    // Major retailers
    if (urlLower.includes('amazon.com')) return 'amazon';
    if (urlLower.includes('target.com')) return 'target';
    if (urlLower.includes('walmart.com')) return 'walmart';
    if (urlLower.includes('macys.com')) return 'macys';
    if (urlLower.includes('nordstrom.com')) return 'nordstrom';
    if (urlLower.includes('gap.com')) return 'gap';
    if (urlLower.includes('oldnavy.com')) return 'old navy';
    if (urlLower.includes('bananarepublic.com')) return 'banana republic';
    if (urlLower.includes('nike.com')) return 'nike';
    if (urlLower.includes('adidas.com')) return 'adidas';
    if (urlLower.includes('zara.com')) return 'zara';
    if (urlLower.includes('hm.com') || urlLower.includes('h&m')) return 'h&m';
    if (urlLower.includes('asos.com')) return 'asos';
    if (urlLower.includes('bloomingdales.com')) return 'bloomingdales';
    if (urlLower.includes('saks.com')) return 'saks';
    if (urlLower.includes('neimanmarcus.com')) return 'neiman marcus';
    if (urlLower.includes('sephora.com')) return 'sephora';
    if (urlLower.includes('tapto.shop') || urlLower.includes('dripped')) return 'dripped';
    if (urlLower.includes('rakuten.com')) return 'rakuten';

    return 'unknown';
  }

  /**
   * Check if URL is a specific product page (not collection/category)
   */
  isProductUrl(url: string): boolean {
    const productPatterns = [
      '/dp/',        // Amazon
      '/gp/product/', // Amazon alternate
      '/products/',  // Fashion Nova, Shopify stores
      '/goods',      // SHEIN
      '-p-',         // SHEIN product code
      '-p[0-9]+',    // Zara
      '/s/',         // Nordstrom
      '/shop/',      // Nordstrom alternate
      '/item/',      // Generic
      '/p/',         // Target, Neiman Marcus
      'sku=',        // SKU parameter
      'product_id=', // Product ID parameter
      '/A-'          // Target product code
    ];

    return productPatterns.some(pattern =>
      url.match(new RegExp(pattern))
    );
  }

  /**
   * Convert a product URL to an affiliate link
   */
  convertToAffiliateLink(url: string, storeName: string): string {
    console.log('🔗 [AFFILIATE] ========== CONVERSION START ==========');
    console.log('📥 [AFFILIATE] INPUT:', {
      url: url,
      storeName: storeName,
      urlLength: url?.length || 0
    });

    if (!url) {
      console.warn('⚠️ [AFFILIATE] No URL provided, returning empty');
      return url;
    }

    // Validate it's a product page
    if (!this.isProductUrl(url)) {
      console.warn('⚠️ [AFFILIATE] Not a product page URL:', url.substring(0, 60));
      console.warn('⚠️ [AFFILIATE] This may be a collection/category page - affiliate link may not convert');
    }

    const storeNameLower = storeName.toLowerCase();
    let affiliateUrl: string;

    // Amazon links
    if (url.includes('amazon.com') || storeNameLower.includes('amazon')) {
      affiliateUrl = this.wrapAmazonLink(url);
      console.log('📤 [AFFILIATE] OUTPUT (Amazon):', affiliateUrl);
      console.log('🔗 [AFFILIATE] ========== CONVERSION END ==========');
      return affiliateUrl;
    }

    // Rakuten partner stores - redirect through Rakuten
    if (this.isRakutenPartner(storeNameLower)) {
      affiliateUrl = this.wrapRakutenLink(url);
      console.log('📤 [AFFILIATE] OUTPUT (Rakuten Partner):', affiliateUrl);
      console.log('🔗 [AFFILIATE] ========== CONVERSION END ==========');
      return affiliateUrl;
    }

    // Target (Rakuten disabled - returning original URL)
    if (url.includes('target.com') || storeNameLower.includes('target')) {
      console.log('📤 [AFFILIATE] OUTPUT (Target - Rakuten disabled):', url);
      console.log('🔗 [AFFILIATE] ========== CONVERSION END ==========');
      return url;
    }

    // Walmart (Rakuten disabled - returning original URL)
    if (url.includes('walmart.com') || storeNameLower.includes('walmart')) {
      console.log('📤 [AFFILIATE] OUTPUT (Walmart - Rakuten disabled):', url);
      console.log('🔗 [AFFILIATE] ========== CONVERSION END ==========');
      return url;
    }

    // Macy's (Rakuten disabled - returning original URL)
    if (url.includes('macys.com') || storeNameLower.includes('macy')) {
      console.log('📤 [AFFILIATE] OUTPUT (Macys - Rakuten disabled):', url);
      console.log('🔗 [AFFILIATE] ========== CONVERSION END ==========');
      return url;
    }

    // Nordstrom (Rakuten disabled - returning original URL)
    if (url.includes('nordstrom.com') || storeNameLower.includes('nordstrom')) {
      console.log('📤 [AFFILIATE] OUTPUT (Nordstrom - Rakuten disabled):', url);
      console.log('🔗 [AFFILIATE] ========== CONVERSION END ==========');
      return url;
    }

    // For all other stores, return original URL
    console.warn('⚠️ [AFFILIATE] No affiliate match for store:', storeName);
    console.log('📤 [AFFILIATE] OUTPUT (No Match - Original URL):', url);
    console.log('🔗 [AFFILIATE] ========== CONVERSION END ==========');
    return url;
  }

  /**
   * Wrap Amazon URL with affiliate tag
   */
  private wrapAmazonLink(url: string): string {
    if (!this.config.amazonAssociatesTag) {
      // If no Amazon tag configured, return original URL (Rakuten disabled)
      console.log('⚠️ [AFFILIATE] No Amazon tag configured, returning original URL');
      return url;
    }

    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('tag', this.config.amazonAssociatesTag);
      const affiliateUrl = urlObj.toString();
      console.log('✅ [AFFILIATE] Wrapped with Amazon tag:', {
        original: url.substring(0, 50),
        affiliate: affiliateUrl.substring(0, 80),
        tag: this.config.amazonAssociatesTag
      });
      return affiliateUrl;
    } catch (error) {
      console.error('❌ [AFFILIATE] Error wrapping Amazon link:', error);
      return url;
    }
  }

  /**
   * Wrap URL with Rakuten affiliate link
   */
  private wrapRakutenLink(url: string): string {
    // Rakuten link format: https://www.rakuten.com/r/MEMBERID?eeid=EEID&u=ENCODED_URL
    const encodedUrl = encodeURIComponent(url);
    const affiliateUrl = `https://www.rakuten.com/r/${this.config.rakutenId}?eeid=${this.config.rakutenEEID}&u=${encodedUrl}`;
    console.log('✅ [AFFILIATE] Wrapped with Rakuten:', {
      original: url,
      affiliate: affiliateUrl,
      rakutenId: this.config.rakutenId,
      eeid: this.config.rakutenEEID
    });
    return affiliateUrl;
  }

  /**
   * Check if store is a Rakuten partner
   * DISABLED: Rakuten affiliate integration temporarily disabled
   */
  private isRakutenPartner(storeName: string): boolean {
    // Rakuten is currently disabled
    return false;

    // Original Rakuten partners list (kept for future re-enablement):
    // const rakutenPartners = [
    //   // Priority fashion stores (user's preferred stores)
    //   'shein',
    //   'fashion nova',
    //   'fashionnova',
    //   'white fox',
    //   'whitefox',
    //   'oh polly',
    //   'ohpolly',
    //   'princess polly',
    //   'princesspolly',
    //   // Major retailers
    //   'macy',
    //   'nordstrom',
    //   'sephora',
    //   'walmart',
    //   'target',
    //   'gap',
    //   'old navy',
    //   'banana republic',
    //   'nike',
    //   'adidas',
    //   'zara',
    //   'h&m',
    //   'asos',
    //   'bloomingdale',
    //   'saks',
    //   'neiman marcus',
    //   'best buy',
    //   'ebay',
    // ];
    //
    // return rakutenPartners.some(partner => storeName.includes(partner));
  }

  /**
   * Get Rakuten coupons link
   */
  getRakutenLink(): string {
    return `https://www.rakuten.com/r/${this.config.rakutenId}?eeid=${this.config.rakutenEEID}`;
  }

  /**
   * Get Dripped Shop link (TapTo.shop affiliate)
   */
  getDrippedShopLink(): string {
    return 'https://tapto.shop/dripped';
  }

  /**
   * Track affiliate link click
   */
  trackClick(affiliateUrl: string, outfitId?: string, productInfo?: any): void {
    const trackingData: ClickTrackingData = {
      url: productInfo?.url || affiliateUrl,
      affiliateUrl,
      storeName: productInfo?.store || productInfo?.storeName || 'unknown',
      outfitId,
      timestamp: Date.now(),
      productInfo: productInfo ? {
        title: productInfo.title,
        price: productInfo.price,
        imageUrl: productInfo.imageUrl,
      } : undefined,
    };

    this.clickHistory.push(trackingData);
    this.saveClickHistory();

    console.log('[AFFILIATE] Click tracked:', {
      store: trackingData.storeName,
      outfitId: trackingData.outfitId,
      timestamp: new Date(trackingData.timestamp).toISOString(),
    });
  }

  /**
   * Get click analytics
   */
  getAnalytics(): {
    totalClicks: number;
    clicksByStore: Record<string, number>;
    clicksByOutfit: Record<string, number>;
    recentClicks: ClickTrackingData[];
  } {
    const clicksByStore: Record<string, number> = {};
    const clicksByOutfit: Record<string, number> = {};

    this.clickHistory.forEach(click => {
      // Count by store
      clicksByStore[click.storeName] = (clicksByStore[click.storeName] || 0) + 1;

      // Count by outfit
      if (click.outfitId) {
        clicksByOutfit[click.outfitId] = (clicksByOutfit[click.outfitId] || 0) + 1;
      }
    });

    return {
      totalClicks: this.clickHistory.length,
      clicksByStore,
      clicksByOutfit,
      recentClicks: this.clickHistory.slice(-10).reverse(), // Last 10 clicks
    };
  }

  /**
   * Load click history from localStorage
   */
  private loadClickHistory(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.clickHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[AFFILIATE] Error loading click history:', error);
      this.clickHistory = [];
    }
  }

  /**
   * Save click history to localStorage
   */
  private saveClickHistory(): void {
    try {
      // Keep only last 100 clicks to avoid storage bloat
      const recentClicks = this.clickHistory.slice(-100);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentClicks));
    } catch (error) {
      console.error('[AFFILIATE] Error saving click history:', error);
    }
  }

  /**
   * Clear click history
   */
  clearHistory(): void {
    this.clickHistory = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Update affiliate configuration
   */
  updateConfig(newConfig: Partial<AffiliateConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get conversion analytics from notification click-throughs
   */
  getConversionAnalytics(): {
    totalConversions: number;
    conversionsByOccasion: Record<string, number>;
    averageLinksPerConversion: number;
    recentConversions: any[];
  } {
    try {
      const conversions = JSON.parse(localStorage.getItem('notification_conversions') || '[]');

      const byOccasion: Record<string, number> = {};
      let totalLinks = 0;

      conversions.forEach((conv: any) => {
        if (conv.occasion) {
          byOccasion[conv.occasion] = (byOccasion[conv.occasion] || 0) + 1;
        }
        totalLinks += conv.linksCount || 0;
      });

      return {
        totalConversions: conversions.length,
        conversionsByOccasion: byOccasion,
        averageLinksPerConversion: conversions.length > 0 ? totalLinks / conversions.length : 0,
        recentConversions: conversions.slice(-10).reverse()
      };
    } catch (error) {
      console.error('[AFFILIATE] Error loading conversion analytics:', error);
      return {
        totalConversions: 0,
        conversionsByOccasion: {},
        averageLinksPerConversion: 0,
        recentConversions: []
      };
    }
  }

  /**
   * Get combined analytics (clicks + conversions)
   */
  getCombinedAnalytics(): {
    clicks: ReturnType<typeof this.getAnalytics>;
    conversions: ReturnType<typeof this.getConversionAnalytics>;
    conversionRate: number;
  } {
    const clicks = this.getAnalytics();
    const conversions = this.getConversionAnalytics();

    const conversionRate = clicks.totalClicks > 0
      ? (conversions.totalConversions / clicks.totalClicks) * 100
      : 0;

    return {
      clicks,
      conversions,
      conversionRate
    };
  }
}

// Export singleton instance
export const affiliateLinkService = new AffiliateLinkService();
export default affiliateLinkService;
