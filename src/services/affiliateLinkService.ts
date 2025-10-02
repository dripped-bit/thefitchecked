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
    // Add your Amazon Associates tag if you have one
    // amazonAssociatesTag: 'yourtag-20',
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

    // Check for common store domains
    if (urlLower.includes('shein.com')) return 'shein';
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
   * Convert a product URL to an affiliate link
   */
  convertToAffiliateLink(url: string, storeName: string): string {
    if (!url) return url;

    const storeNameLower = storeName.toLowerCase();

    // Amazon links
    if (url.includes('amazon.com') || storeNameLower.includes('amazon')) {
      return this.wrapAmazonLink(url);
    }

    // Rakuten partner stores - redirect through Rakuten
    if (this.isRakutenPartner(storeNameLower)) {
      return this.wrapRakutenLink(url);
    }

    // Target
    if (url.includes('target.com') || storeNameLower.includes('target')) {
      return this.wrapRakutenLink(url);
    }

    // Walmart
    if (url.includes('walmart.com') || storeNameLower.includes('walmart')) {
      return this.wrapRakutenLink(url);
    }

    // Macy's
    if (url.includes('macys.com') || storeNameLower.includes('macy')) {
      return this.wrapRakutenLink(url);
    }

    // Nordstrom
    if (url.includes('nordstrom.com') || storeNameLower.includes('nordstrom')) {
      return this.wrapRakutenLink(url);
    }

    // For all other stores, return original URL
    // You can add more affiliate networks here
    return url;
  }

  /**
   * Wrap Amazon URL with affiliate tag
   */
  private wrapAmazonLink(url: string): string {
    if (!this.config.amazonAssociatesTag) {
      // If no Amazon tag configured, try Rakuten
      return this.wrapRakutenLink(url);
    }

    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('tag', this.config.amazonAssociatesTag);
      return urlObj.toString();
    } catch (error) {
      console.error('[AFFILIATE] Error wrapping Amazon link:', error);
      return url;
    }
  }

  /**
   * Wrap URL with Rakuten affiliate link
   */
  private wrapRakutenLink(url: string): string {
    // Rakuten link format: https://www.rakuten.com/r/MEMBERID?eeid=EEID&u=ENCODED_URL
    const encodedUrl = encodeURIComponent(url);
    return `https://www.rakuten.com/r/${this.config.rakutenId}?eeid=${this.config.rakutenEEID}&u=${encodedUrl}`;
  }

  /**
   * Check if store is a Rakuten partner
   */
  private isRakutenPartner(storeName: string): boolean {
    const rakutenPartners = [
      'macy',
      'nordstrom',
      'sephora',
      'walmart',
      'target',
      'gap',
      'old navy',
      'banana republic',
      'nike',
      'adidas',
      'zara',
      'h&m',
      'asos',
      'bloomingdale',
      'saks',
      'neiman marcus',
      'best buy',
      'ebay',
    ];

    return rakutenPartners.some(partner => storeName.includes(partner));
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
}

// Export singleton instance
export const affiliateLinkService = new AffiliateLinkService();
export default affiliateLinkService;
