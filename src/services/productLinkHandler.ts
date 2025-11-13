/**
 * Product Link Handler Service
 * Handles opening product links with smart routing:
 * - Mobile: In-app browser with deep link fallback to retailer apps
 * - Web: Standard window.open
 */

import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import haptics from '../utils/haptics';

interface RetailerDeepLink {
  scheme: string;
  transform?: (url: string) => string;
}

// Retailer deep link mappings
// Note: Most retailers don't support direct deep linking to product pages
// But we can try to open their app and let it handle the URL
const RETAILER_DEEP_LINKS: Record<string, RetailerDeepLink> = {
  'shein': {
    scheme: 'shein://',
    transform: (url) => url.replace(/^https?:\/\/(www\.)?shein\.com/, 'shein://'),
  },
  'amazon': {
    scheme: 'amazon://',
    transform: (url) => url.replace(/^https?:\/\/(www\.)?amazon\.com/, 'amazon://'),
  },
  'target': {
    scheme: 'target://',
    transform: (url) => url.replace(/^https?:\/\/(www\.)?target\.com/, 'target://'),
  },
  'zara': {
    scheme: 'zara://',
    transform: (url) => url.replace(/^https?:\/\/(www\.)?zara\.com/, 'zara://'),
  },
  'h&m': {
    scheme: 'hm://',
    transform: (url) => url.replace(/^https?:\/\/(www\.)?hm\.com/, 'hm://'),
  },
  'nordstrom': {
    scheme: 'nordstrom://',
    transform: (url) => url.replace(/^https?:\/\/(www\.)?nordstrom\.com/, 'nordstrom://'),
  },
  'asos': {
    scheme: 'asos://',
    transform: (url) => url.replace(/^https?:\/\/(www\.)?asos\.com/, 'asos://'),
  },
};

class ProductLinkHandler {
  private isNative: boolean;
  private browserListenersInitialized: boolean = false;
  private onBrowserClosedCallback?: (productInfo: any) => void;
  private currentProduct: any = null;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Set callback to be invoked when browser closes
   */
  setOnBrowserClosed(callback: (productInfo: any) => void) {
    this.onBrowserClosedCallback = callback;
    console.log('✅ [PRODUCT-LINK] Browser closed callback registered');
  }

  /**
   * Initialize browser event listeners
   */
  initializeBrowserListeners() {
    if (this.browserListenersInitialized || !this.isNative) {
      return;
    }

    // Listen for browser closed event
    Browser.addListener('browserFinished', () => {
      console.log('📱 [PRODUCT-LINK] User closed in-app browser');
      
      // Trigger callback with product info
      if (this.onBrowserClosedCallback && this.currentProduct) {
        console.log('🔔 [PRODUCT-LINK] Triggering browser closed callback with product:', this.currentProduct.title);
        this.onBrowserClosedCallback(this.currentProduct);
      }
    });

    // Listen for browser page loaded event
    Browser.addListener('browserPageLoaded', () => {
      console.log('📱 [PRODUCT-LINK] Product page loaded in browser');
    });

    this.browserListenersInitialized = true;
    console.log('✅ [PRODUCT-LINK] Browser listeners initialized');
  }

  /**
   * Get retailer deep link configuration by store name
   */
  private getRetailerDeepLink(store: string): RetailerDeepLink | null {
    const storeLower = store.toLowerCase();
    
    // Try exact match first
    if (RETAILER_DEEP_LINKS[storeLower]) {
      return RETAILER_DEEP_LINKS[storeLower];
    }

    // Try partial match (e.g., "SHEIN Official" -> "shein")
    for (const [key, value] of Object.entries(RETAILER_DEEP_LINKS)) {
      if (storeLower.includes(key)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Try to open retailer's native app via deep link
   * Returns true if successful, false if app not installed or link failed
   */
  private async tryDeepLink(url: string, store: string): Promise<boolean> {
    const deepLinkConfig = this.getRetailerDeepLink(store);
    
    if (!deepLinkConfig) {
      console.log(`📱 [PRODUCT-LINK] No deep link available for store: ${store}`);
      return false;
    }

    try {
      const deepLinkUrl = deepLinkConfig.transform 
        ? deepLinkConfig.transform(url) 
        : `${deepLinkConfig.scheme}${url}`;

      console.log(`📱 [PRODUCT-LINK] Attempting deep link: ${deepLinkUrl}`);
      
      // Try to open the deep link
      // Note: On iOS, this will fail silently if app is not installed
      await Browser.open({
        url: deepLinkUrl,
        presentationStyle: 'popover',
      });

      console.log(`✅ [PRODUCT-LINK] Deep link opened for ${store}`);
      haptics.light(); // Haptic feedback on successful open
      return true;
    } catch (error) {
      console.log(`❌ [PRODUCT-LINK] Deep link failed for ${store}:`, error);
      return false;
    }
  }

  /**
   * Open product URL in in-app browser with iOS-optimized settings
   */
  private async openInAppBrowser(url: string, store: string): Promise<void> {
    try {
      console.log(`📱 [PRODUCT-LINK] Opening in-app browser: ${store}`);
      
      await Browser.open({
        url: url,
        presentationStyle: 'popover', // iOS sheet-style modal
        toolbarColor: '#000000',
        windowName: '_blank',
      });

      console.log('✅ [PRODUCT-LINK] In-app browser opened');
      haptics.light(); // Haptic feedback
    } catch (error) {
      console.error('❌ [PRODUCT-LINK] Failed to open in-app browser:', error);
      // Fallback to window.open
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Main method: Smart product link opening
   * - Web: Opens in new tab via window.open
   * - Mobile: Tries deep link first, then falls back to in-app browser
   * 
   * @param url Product URL (with affiliate tracking if applicable)
   * @param store Store name (e.g., "SHEIN", "Amazon")
   * @param productInfo Optional product information to pass to callback when browser closes
   * @returns Promise that resolves when link is opened
   */
  async openProductLink(url: string, store: string = 'unknown', productInfo?: any): Promise<void> {
    console.log(`🔗 [PRODUCT-LINK] Opening product link:`, {
      url: url.substring(0, 100) + '...',
      store,
      platform: this.isNative ? 'native' : 'web',
      hasProductInfo: !!productInfo
    });

    // Store product info for callback when browser closes
    if (productInfo) {
      this.currentProduct = productInfo;
      console.log('💾 [PRODUCT-LINK] Stored product info for callback:', productInfo.title);
    }

    // Web platform: Use standard window.open
    if (!this.isNative) {
      console.log('🌐 [PRODUCT-LINK] Web platform - using window.open');
      window.open(url, '_blank', 'noopener,noreferrer');
      
      // For web platform, simulate browser close after a delay (user likely navigated away)
      // This is a workaround since we can't detect when external tab closes
      if (productInfo && this.onBrowserClosedCallback) {
        setTimeout(() => {
          console.log('🌐 [PRODUCT-LINK] Web platform - simulating browser closed event');
          if (this.onBrowserClosedCallback && this.currentProduct) {
            this.onBrowserClosedCallback(this.currentProduct);
          }
        }, 3000); // 3 second delay to give user time to see the new tab
      }
      return;
    }

    // Mobile platform: Try smart routing
    console.log('📱 [PRODUCT-LINK] Native platform - attempting smart routing');

    // Initialize browser listeners if not already done
    this.initializeBrowserListeners();

    // Strategy 1: Try deep link to retailer app
    const deepLinkSuccess = await this.tryDeepLink(url, store);
    
    if (deepLinkSuccess) {
      console.log('✅ [PRODUCT-LINK] Opened via deep link');
      return;
    }

    // Strategy 2: Fallback to in-app browser
    console.log('📱 [PRODUCT-LINK] Deep link failed or unavailable, using in-app browser');
    await this.openInAppBrowser(url, store);
  }

  /**
   * Close the in-app browser (if open)
   */
  async closeBrowser(): Promise<void> {
    if (!this.isNative) return;

    try {
      await Browser.close();
      console.log('✅ [PRODUCT-LINK] In-app browser closed');
    } catch (error) {
      console.error('❌ [PRODUCT-LINK] Failed to close browser:', error);
    }
  }

  /**
   * Check if a retailer has deep link support
   */
  hasDeepLinkSupport(store: string): boolean {
    return this.getRetailerDeepLink(store) !== null;
  }

  /**
   * Get list of all supported retailers with deep links
   */
  getSupportedRetailers(): string[] {
    return Object.keys(RETAILER_DEEP_LINKS);
  }

  /**
   * Check if running on native platform
   */
  isNativePlatform(): boolean {
    return this.isNative;
  }
}

// Export singleton instance
export default new ProductLinkHandler();
