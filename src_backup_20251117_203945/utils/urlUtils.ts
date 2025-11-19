/**
 * URL utilities for converting relative paths to absolute URLs
 * Essential for external APIs that need publicly accessible URLs
 */

/**
 * Convert a relative path to an absolute URL for external API access
 * Handles both development and production environments
 */
export function toAbsoluteUrl(relativePath: string): string {
  // If already an absolute URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // If it's a data URL, return as-is
  if (relativePath.startsWith('data:')) {
    return relativePath;
  }

  // Get the current origin (protocol + host + port)
  const origin = window.location.origin;

  // Ensure the path starts with /
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  // Combine origin with path
  const absoluteUrl = `${origin}${cleanPath}`;

  console.log('🌐 [URL-UTILS] Converting relative to absolute:', {
    input: relativePath,
    output: absoluteUrl,
    origin: origin,
    cleanPath: cleanPath
  });

  return absoluteUrl;
}

/**
 * Validate if a URL is accessible for external APIs
 * Checks format and accessibility requirements
 */
export function isValidExternalApiUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Must be HTTP/HTTPS for external API access
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }

  // Basic URL format validation
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure URL is suitable for external API consumption
 * Converts relative paths and validates accessibility
 */
export function prepareUrlForExternalApi(url: string, context: string = 'external-api'): string {
  console.log(`🔗 [URL-UTILS] Preparing URL for ${context}:`, {
    input: url,
    isRelative: !url.startsWith('http') && !url.startsWith('data:'),
    isDataUrl: url.startsWith('data:')
  });

  // Convert relative paths to absolute URLs
  const absoluteUrl = toAbsoluteUrl(url);

  // Validate the result
  if (!isValidExternalApiUrl(absoluteUrl) && !absoluteUrl.startsWith('data:')) {
    throw new Error(`Invalid URL for external API: ${absoluteUrl}. External APIs require accessible HTTP/HTTPS URLs.`);
  }

  console.log(`✅ [URL-UTILS] URL ready for ${context}:`, absoluteUrl);
  return absoluteUrl;
}