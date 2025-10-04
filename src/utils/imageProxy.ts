/**
 * Image Proxy Utilities
 * Helper functions to convert external image URLs to proxied URLs
 * Solves CORS issues when using Google Shopping / Amazon images with FASHN API
 */

/**
 * Convert an external image URL to a proxied URL through our backend
 * This avoids CORS restrictions when FASHN API tries to fetch the image
 *
 * @param url - External image URL (e.g., from Google Shopping)
 * @returns Proxied URL that goes through /api/proxy-image
 */
export function getProxiedUrl(url: string): string {
  if (!url) return url;

  // Check if already proxied
  if (url.startsWith('/api/proxy-image')) {
    return url;
  }

  // Check if it's a data URL (base64 encoded image)
  if (url.startsWith('data:')) {
    return url; // Data URLs don't need proxying
  }

  // Check if it's already from our domain
  if (url.startsWith('/') || url.includes(window.location.hostname)) {
    return url; // Internal URLs don't need proxying
  }

  // Proxy external URLs
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

/**
 * Proxy image URLs in an array of objects
 * Useful for processing search results before displaying
 *
 * @param items - Array of objects containing image URLs
 * @param imageKey - Key name where image URL is stored (e.g., 'image', 'imageUrl', 'thumbnail')
 * @returns Array with proxied image URLs
 */
export function proxyImageUrls<T extends Record<string, any>>(
  items: T[],
  imageKey: keyof T
): T[] {
  return items.map(item => ({
    ...item,
    [imageKey]: getProxiedUrl(item[imageKey] as string),
  }));
}

/**
 * Check if a URL needs proxying
 * @param url - Image URL to check
 * @returns true if URL should be proxied (external URL with potential CORS issues)
 */
export function needsProxying(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/') || url.startsWith('data:')) return false;
  if (url.includes(window.location.hostname)) return false;
  return true;
}

/**
 * Bulk proxy multiple URLs
 * @param urls - Array of image URLs
 * @returns Array of proxied URLs
 */
export function proxyUrls(urls: string[]): string[] {
  return urls.map(getProxiedUrl);
}
