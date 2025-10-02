/**
 * Centralized Image Format Validation Utility
 * Provides consistent image format validation across all components
 */

export interface ImageFormatSupport {
  supportedFormats: string[];
  acceptString: string;
  mimeTypes: string[];
  maxFileSize: number;
  maxFileSizeMB: number;
  recommendations: Record<string, string>;
}

export class ImageFormatValidator {
  private static readonly SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif'];
  private static readonly SUPPORTED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif'
  ];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  private static readonly MAX_FILE_SIZE_MB = 10;

  /**
   * Get comprehensive format support information
   */
  static getFormatSupport(): ImageFormatSupport {
    return {
      supportedFormats: ['JPEG', 'JPG', 'PNG', 'WebP', 'GIF', 'AVIF'],
      acceptString: ImageFormatValidator.SUPPORTED_MIME_TYPES.join(','),
      mimeTypes: [...ImageFormatValidator.SUPPORTED_MIME_TYPES],
      maxFileSize: ImageFormatValidator.MAX_FILE_SIZE,
      maxFileSizeMB: ImageFormatValidator.MAX_FILE_SIZE_MB,
      recommendations: {
        'jpeg': 'Best for photos with many colors',
        'jpg': 'Best for photos with many colors',
        'png': 'Best for images with transparency or simple graphics',
        'webp': 'Modern format with excellent compression and quality',
        'gif': 'Best for simple animations (first frame used for avatars)',
        'avif': 'Next-generation format with superior compression'
      }
    };
  }

  /**
   * Validate a File object
   */
  static validateFile(file: File): {
    isValid: boolean;
    errors: string[];
    format?: string;
  } {
    const errors: string[] = [];

    // Check file type
    if (!ImageFormatValidator.SUPPORTED_MIME_TYPES.includes(file.type)) {
      errors.push(`Unsupported format: ${file.type}. Supported: ${ImageFormatValidator.SUPPORTED_FORMATS.map(f => f.toUpperCase()).join(', ')}`);
    }

    // Check file size
    if (file.size > ImageFormatValidator.MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      errors.push(`File too large: ${sizeMB}MB. Maximum: ${ImageFormatValidator.MAX_FILE_SIZE_MB}MB`);
    }

    // Extract format from mime type
    const format = file.type.replace('image/', '').toLowerCase();

    return {
      isValid: errors.length === 0,
      errors,
      format: ImageFormatValidator.SUPPORTED_FORMATS.includes(format) ? format : undefined
    };
  }

  /**
   * Validate a data URL
   */
  static validateDataUrl(dataUrl: string): {
    isValid: boolean;
    errors: string[];
    format?: string;
  } {
    const errors: string[] = [];

    if (!dataUrl.startsWith('data:image/')) {
      errors.push('Invalid data URL: must start with data:image/');
      return { isValid: false, errors };
    }

    // Extract format from data URL
    const match = dataUrl.match(/^data:image\/([^;]+)/);
    const format = match ? match[1].toLowerCase() : null;

    if (!format || !ImageFormatValidator.SUPPORTED_FORMATS.includes(format)) {
      errors.push(`Unsupported data URL format: ${format}. Supported: ${ImageFormatValidator.SUPPORTED_FORMATS.map(f => f.toUpperCase()).join(', ')}`);
    }

    // Estimate size (rough approximation)
    const estimatedSize = (dataUrl.length * 3) / 4; // Base64 overhead
    if (estimatedSize > ImageFormatValidator.MAX_FILE_SIZE) {
      const sizeMB = (estimatedSize / (1024 * 1024)).toFixed(1);
      errors.push(`Data URL too large: ~${sizeMB}MB. Maximum: ${ImageFormatValidator.MAX_FILE_SIZE_MB}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      format: format || undefined
    };
  }

  /**
   * Validate image URL (HTTP/HTTPS)
   */
  static validateImageUrl(url: string): {
    isValid: boolean;
    errors: string[];
    format?: string;
  } {
    const errors: string[] = [];

    if (!url.match(/^https?:\/\/.+/)) {
      errors.push('Invalid image URL: must be HTTP or HTTPS');
      return { isValid: false, errors };
    }

    // Try to extract format from file extension
    const match = url.match(/\.([^.?#]+)(?:[?#]|$)/i);
    const ext = match ? match[1].toLowerCase() : null;
    const format = ext === 'jpg' ? 'jpeg' : ext; // Normalize jpg to jpeg

    if (format && !ImageFormatValidator.SUPPORTED_FORMATS.includes(format)) {
      errors.push(`Unsupported format from URL: ${format}. Supported: ${ImageFormatValidator.SUPPORTED_FORMATS.map(f => f.toUpperCase()).join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      format: format || undefined
    };
  }

  /**
   * Get user-friendly error message for file upload
   */
  static getUploadErrorMessage(file: File): string | null {
    const validation = this.validateFile(file);
    if (validation.isValid) return null;
    return validation.errors[0]; // Return first error for simplicity
  }

  /**
   * Get HTML accept attribute value
   */
  static getAcceptString(): string {
    return ImageFormatValidator.SUPPORTED_MIME_TYPES.join(',');
  }

  /**
   * Get user-friendly format list for UI
   */
  static getFormatListText(): string {
    return ImageFormatValidator.SUPPORTED_FORMATS.map(f => f.toUpperCase()).join(', ');
  }

  /**
   * Check if specific format is supported
   */
  static isFormatSupported(format: string): boolean {
    return ImageFormatValidator.SUPPORTED_FORMATS.includes(format.toLowerCase());
  }

  /**
   * Get format recommendation text
   */
  static getFormatRecommendation(format: string): string {
    const support = ImageFormatValidator.getFormatSupport();
    return support.recommendations[format.toLowerCase()] || 'Supported image format';
  }
}

// Export convenience functions
export const validateImageFile = ImageFormatValidator.validateFile;
export const validateImageDataUrl = ImageFormatValidator.validateDataUrl;
export const validateImageUrl = ImageFormatValidator.validateImageUrl;
export const getImageFormatSupport = ImageFormatValidator.getFormatSupport;
export const getAcceptString = ImageFormatValidator.getAcceptString;
export const getFormatListText = ImageFormatValidator.getFormatListText;

export default ImageFormatValidator;