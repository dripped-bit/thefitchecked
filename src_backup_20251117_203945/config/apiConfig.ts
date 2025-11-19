import { Capacitor } from '@capacitor/core';

/**
 * API Configuration for TheFitChecked
 *
 * Determines the correct base URL for API calls based on the platform:
 * - Native iOS: Uses production Vercel backend (https://thefitchecked.com)
 * - Web Dev: Uses Vite proxy (empty string for relative URLs)
 */

class ApiConfig {
  private readonly productionUrl = 'https://thefitchecked.com';

  /**
   * Get the base URL for API calls
   * @returns Base URL string (empty for dev proxy, full URL for production)
   */
  getBaseUrl(): string {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      console.log('📱 [API-CONFIG] Running on native platform, using production URL:', this.productionUrl);
      return this.productionUrl;
    }

    console.log('🌐 [API-CONFIG] Running on web, using Vite proxy (relative URLs)');
    return '';
  }

  /**
   * Get full endpoint URL
   * @param path API path (e.g., '/api/fal/fal-ai/bytedance/seedream/v4/edit')
   * @returns Full URL for the endpoint
   */
  getEndpoint(path: string): string {
    const baseUrl = this.getBaseUrl();
    const fullUrl = `${baseUrl}${path}`;
    console.log(`🔗 [API-CONFIG] Endpoint: ${fullUrl}`);
    return fullUrl;
  }

  /**
   * Check if running on native platform
   */
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Get platform name
   */
  getPlatform(): string {
    return Capacitor.getPlatform();
  }
}

// Export singleton instance
const apiConfig = new ApiConfig();
export default apiConfig;
