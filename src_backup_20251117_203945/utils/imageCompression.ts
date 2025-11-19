/**
 * Image compression utilities for reducing file sizes before API calls
 * Helps prevent HTTP 413 "Payload Too Large" errors
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, where 1 is highest quality
  maxSizeKB?: number; // Maximum file size in KB
}

export interface CompressionResult {
  compressedDataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress an image to reduce file size for API consumption
 */
export async function compressImage(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    maxSizeKB = 500
  } = options;

  console.log('🗜️ [IMAGE-COMPRESSION] Starting compression:', {
    maxWidth,
    maxHeight,
    quality,
    maxSizeKB,
    originalSizeKB: Math.round(dataUrl.length / 1024)
  });

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      const aspectRatio = width / height;

      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress the image
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels to meet size requirements
      let currentQuality = quality;
      let compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
      let attempts = 0;
      const maxAttempts = 5;

      while (compressedDataUrl.length > maxSizeKB * 1024 * 1.37 && attempts < maxAttempts) {
        currentQuality *= 0.8; // Reduce quality by 20% each attempt
        compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        attempts++;
      }

      const originalSize = dataUrl.length;
      const compressedSize = compressedDataUrl.length;
      const compressionRatio = originalSize / compressedSize;

      console.log('✅ [IMAGE-COMPRESSION] Compression complete:', {
        originalSizeKB: Math.round(originalSize / 1024),
        compressedSizeKB: Math.round(compressedSize / 1024),
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        finalQuality: Math.round(currentQuality * 100),
        newDimensions: `${width}x${height}`,
        attempts
      });

      resolve({
        compressedDataUrl,
        originalSize,
        compressedSize,
        compressionRatio
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    img.src = dataUrl;
  });
}

/**
 * Get the file size of a data URL in KB
 */
export function getDataUrlSizeKB(dataUrl: string): number {
  // Base64 encoding adds ~37% overhead, so we divide by 1.37 to get approximate binary size
  return Math.round(dataUrl.length / 1024 / 1.37);
}

/**
 * Check if an image needs compression based on size
 */
export function needsCompression(dataUrl: string, maxSizeKB: number = 500): boolean {
  const sizeKB = getDataUrlSizeKB(dataUrl);
  return sizeKB > maxSizeKB;
}