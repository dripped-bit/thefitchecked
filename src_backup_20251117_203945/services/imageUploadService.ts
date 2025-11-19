/**
 * Image Upload Service - FASHN API Compatible
 * Handles base64 data and URL processing without fal-ai dependencies
 * FASHN API supports base64 data directly in FormData
 */

class ImageUploadService {
  /**
   * Process image for FASHN API usage - returns base64 or URL as-is
   * FASHN API accepts both base64 data and HTTP URLs in FormData
   */
  async uploadImage(imageData: string): Promise<string> {
    try {
      console.log('📤 [IMAGE-UPLOAD] Processing image for FASHN API...');

      // If it's already a URL, return it directly
      if (imageData.startsWith('http')) {
        console.log('✅ [IMAGE-UPLOAD] Input is HTTP URL, returning directly for FASHN');
        return imageData;
      }

      // Validate base64 format
      if (!imageData.startsWith('data:image/')) {
        console.error('❌ [IMAGE-UPLOAD] Invalid image format:', {
          startsWithData: imageData.startsWith('data:'),
          startsWithHttp: imageData.startsWith('http'),
          length: imageData.length,
          firstChars: imageData.substring(0, 50)
        });
        throw new Error('Invalid image format: must be a HTTP URL or base64 data URL');
      }

      // Extract metadata from base64
      const mimeMatch = imageData.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const sizeKB = Math.round(imageData.length * 0.75 / 1024); // Rough estimate

      console.log('🔍 [IMAGE-UPLOAD] Base64 image metadata:', {
        mimeType,
        sizeKB,
        isValidFormat: this.isValidImageFormat(mimeType)
      });

      // Validate image format for FASHN API
      if (!this.isValidImageFormat(mimeType)) {
        throw new Error(`Unsupported image format: ${mimeType}. FASHN API supports JPEG, PNG, and WebP.`);
      }

      // Validate image size (FASHN limit: ~5MB)
      if (sizeKB > 5000) {
        console.warn('⚠️ [IMAGE-UPLOAD] Image is large, may cause FASHN API issues:', { sizeKB });
      }

      // Return base64 directly - FASHN API will handle it in FormData
      console.log('✅ [IMAGE-UPLOAD] Base64 image ready for FASHN API FormData upload');
      return imageData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [IMAGE-UPLOAD] Image processing failed:', {
        error: errorMessage,
        inputType: imageData ? (imageData.startsWith('http') ? 'url' : 'base64') : 'null'
      });

      throw new Error(`Image processing failed: ${errorMessage}`);
    }
  }

  /**
   * Process multiple images for FASHN API
   */
  async uploadImages(imageDataArray: string[]): Promise<string[]> {
    console.log('📤 [IMAGE-UPLOAD] Processing multiple images for FASHN API...');

    const uploadPromises = imageDataArray.map((imageData, index) => {
      console.log(`📸 [IMAGE-UPLOAD] Processing image ${index + 1}/${imageDataArray.length}`);
      return this.uploadImage(imageData);
    });

    const results = await Promise.all(uploadPromises);
    console.log('✅ [IMAGE-UPLOAD] All images processed successfully');
    return results;
  }

  /**
   * Convert various image formats to base64 for FASHN API
   */
  async convertToBase64(imageSource: string | File | Blob): Promise<string> {
    console.log('🔄 [IMAGE-UPLOAD] Converting to base64 for FASHN API...');

    try {
      // If already base64, validate and return
      if (typeof imageSource === 'string' && imageSource.startsWith('data:image/')) {
        console.log('✅ [IMAGE-UPLOAD] Already base64 format');
        return imageSource;
      }

      // If URL, fetch and convert
      if (typeof imageSource === 'string' && imageSource.startsWith('http')) {
        console.log('🌐 [IMAGE-UPLOAD] Fetching URL and converting to base64...');
        const response = await fetch(imageSource);
        const blob = await response.blob();
        return this.blobToBase64(blob);
      }

      // If File or Blob, convert directly
      if (imageSource instanceof File || imageSource instanceof Blob) {
        console.log('📁 [IMAGE-UPLOAD] Converting File/Blob to base64...');
        return this.blobToBase64(imageSource);
      }

      throw new Error('Unsupported image source type');

    } catch (error) {
      console.error('❌ [IMAGE-UPLOAD] Base64 conversion failed:', error);
      throw new Error(`Base64 conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert Blob/File to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (result && result.startsWith('data:image/')) {
          resolve(result);
        } else {
          reject(new Error('Failed to convert to valid base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Check if image format is supported by FASHN API
   */
  private isValidImageFormat(mimeType: string): boolean {
    const supportedFormats = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    return supportedFormats.includes(mimeType.toLowerCase());
  }

  /**
   * Get image metadata without uploading
   */
  getImageInfo(imageData: string): {
    type: 'url' | 'base64' | 'invalid';
    mimeType?: string;
    sizeEstimateKB?: number;
    isValidFormat?: boolean;
  } {
    if (imageData.startsWith('http')) {
      return { type: 'url' };
    }

    if (imageData.startsWith('data:image/')) {
      const mimeMatch = imageData.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'unknown';
      const sizeKB = Math.round(imageData.length * 0.75 / 1024);

      return {
        type: 'base64',
        mimeType,
        sizeEstimateKB: sizeKB,
        isValidFormat: this.isValidImageFormat(mimeType)
      };
    }

    return { type: 'invalid' };
  }

  /**
   * Validate image before processing
   */
  validateImage(imageData: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const info = this.getImageInfo(imageData);

    if (info.type === 'invalid') {
      errors.push('Invalid image format: must be HTTP URL or base64 data URL');
    }

    if (info.type === 'base64') {
      if (!info.isValidFormat) {
        errors.push(`Unsupported image format: ${info.mimeType}. Use JPEG, PNG, or WebP.`);
      }

      if (info.sizeEstimateKB && info.sizeEstimateKB > 5000) {
        errors.push(`Image too large: ${info.sizeEstimateKB}KB. Maximum recommended: 5MB.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get service information
   */
  getServiceInfo() {
    return {
      name: 'Image Upload Service (FASHN-Compatible)',
      version: '2.0.0',
      description: 'Processes images for FASHN API usage without external dependencies',
      supportedInputs: ['HTTP URLs', 'Base64 data URLs', 'File objects', 'Blob objects'],
      supportedFormats: ['JPEG', 'PNG', 'WebP'],
      maxSize: '5MB (recommended for FASHN API)',
      features: [
        'Direct base64 processing',
        'URL passthrough',
        'Format validation',
        'Size checking',
        'FASHN API compatibility'
      ],
      migration: {
        from: 'fal.ai storage upload',
        to: 'Direct FASHN API FormData support',
        benefits: ['No external storage dependency', 'Faster processing', 'FASHN native support']
      }
    };
  }
}

export const imageUploadService = new ImageUploadService();
export default imageUploadService;