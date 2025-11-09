/**
 * FASHN-Only Virtual Try-On Service
 * Pure FASHN API implementation without any fal-ai dependencies
 * Uses FormData for proper file uploads as required by FASHN API
 */

import apiConfig from '../config/apiConfig';

interface FashnTryOnRequest {
  person_image: File | Blob;
  cloth_image: File | Blob;
  category: 'upper_body' | 'lower_body' | 'dress' | 'auto';
  preserve_pose?: boolean;
  auto_align?: boolean;
}

interface FashnTryOnResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  processingTime?: number;
  api: string;
}

export class FashnTryOnService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = apiConfig.getEndpoint('/api/fashn');
    console.log('🎯 [FASHN-ONLY] Service initialized:', {
      baseUrl: this.baseUrl,
      integration: 'FASHN API via proxy'
    });
  }

  /**
   * Convert image data to File/Blob for FASHN FormData upload
   */
  private async convertToFile(imageData: string | File | Blob, filename: string): Promise<File> {
    if (imageData instanceof File) {
      return imageData;
    }

    if (imageData instanceof Blob) {
      return new File([imageData], filename, { type: imageData.type || 'image/jpeg' });
    }

    // Handle base64 data URLs
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:')) {
        const response = await fetch(imageData);
        const blob = await response.blob();
        return new File([blob], filename, { type: blob.type || 'image/jpeg' });
      }

      // Handle regular HTTP URLs
      if (imageData.startsWith('http')) {
        const response = await fetch(imageData);
        const blob = await response.blob();
        return new File([blob], filename, { type: blob.type || 'image/jpeg' });
      }
    }

    throw new Error('Invalid image data format - must be File, Blob, base64 data URL, or HTTP URL');
  }

  /**
   * Detect clothing category from image data or filename
   */
  private detectClothingCategory(clothingData: any): 'upper_body' | 'lower_body' | 'dress' | 'auto' {
    const dataStr = typeof clothingData === 'string' ? clothingData.toLowerCase() : '';

    if (dataStr.includes('shirt') || dataStr.includes('top') || dataStr.includes('blouse') ||
        dataStr.includes('sweater') || dataStr.includes('jacket') || dataStr.includes('tshirt')) {
      return 'upper_body';
    } else if (dataStr.includes('pants') || dataStr.includes('jeans') || dataStr.includes('trouser') ||
               dataStr.includes('short') || dataStr.includes('skirt')) {
      return 'lower_body';
    } else if (dataStr.includes('dress') || dataStr.includes('gown') || dataStr.includes('jumpsuit')) {
      return 'dress';
    }

    return 'auto'; // Let FASHN auto-detect
  }

  /**
   * Main virtual try-on function using FASHN API with FormData
   */
  async tryOnClothing(
    avatarImage: string | File | Blob,
    clothingImage: string | File | Blob,
    options: Partial<FashnTryOnRequest> = {}
  ): Promise<FashnTryOnResult> {
    console.log('🚀 [FASHN-ONLY] Starting FASHN-only virtual try-on...');

    const startTime = Date.now();

    try {
      // Convert images to File objects for FormData
      console.log('🔄 [FASHN-ONLY] Converting images to File objects...');
      const personFile = await this.convertToFile(avatarImage, 'person.jpg');
      const clothFile = await this.convertToFile(clothingImage, 'cloth.jpg');

      console.log('📤 [FASHN-ONLY] Prepared files:', {
        personFile: `${personFile.name} (${(personFile.size / 1024).toFixed(2)}KB)`,
        clothFile: `${clothFile.name} (${(clothFile.size / 1024).toFixed(2)}KB)`,
        personType: personFile.type,
        clothType: clothFile.type
      });

      // Create FormData as required by FASHN API
      const formData = new FormData();
      formData.append('person_image', personFile);
      formData.append('cloth_image', clothFile);

      // Add category (auto-detect if not specified)
      const category = options.category || this.detectClothingCategory(clothingImage);
      formData.append('category', category);

      // Add optional parameters
      if (options.preserve_pose !== undefined) {
        formData.append('preserve_pose', String(options.preserve_pose));
      }
      if (options.auto_align !== undefined) {
        formData.append('auto_align', String(options.auto_align));
      }

      console.log('📤 [FASHN-ONLY] Submitting FormData to FASHN API:', {
        endpoint: `${this.baseUrl}/v1/run`,
        category,
        preserve_pose: options.preserve_pose,
        auto_align: options.auto_align,
        method: 'FormData upload'
      });

      // Submit to FASHN API via proxy
      const response = await fetch(`${this.baseUrl}/v1/run`, {
        method: 'POST',
        headers: {
          'User-Agent': 'FitChecked-App-FASHN-Only/1.0'
          // Note: Don't set Content-Type - let browser set it with boundary for FormData
          // Authorization handled by proxy
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FASHN-ONLY] FASHN API request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        throw new Error(`FASHN API error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [FASHN-ONLY] FASHN API response received:', {
        hasId: !!result.id,
        status: result.status,
        hasOutput: !!result.output
      });

      // Handle immediate completion or start polling
      if (result.output && result.output.length > 0) {
        const processingTime = Date.now() - startTime;
        console.log('🎯 [FASHN-ONLY] Try-on completed immediately!');

        return {
          success: true,
          imageUrl: result.output[0],
          api: 'FASHN-Only',
          processingTime: processingTime / 1000
        };
      }

      // Poll for completion if we have a job ID
      if (result.id) {
        console.log('⏳ [FASHN-ONLY] Starting polling for job:', result.id);
        return await this.pollForCompletion(result.id, startTime);
      }

      throw new Error('FASHN API returned unexpected response format');

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ [FASHN-ONLY] Try-on failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Virtual try-on failed',
        api: 'FASHN-Only',
        processingTime: processingTime / 1000
      };
    }
  }

  /**
   * Poll FASHN API for job completion
   */
  private async pollForCompletion(jobId: string, startTime: number): Promise<FashnTryOnResult> {
    const maxPollTime = 120000; // 2 minutes
    const pollInterval = 2000; // 2 seconds
    const statusUrl = `${this.baseUrl}/v1/status/${jobId}`;

    console.log('🔄 [FASHN-ONLY] Starting status polling:', {
      jobId,
      maxPollTime: maxPollTime / 1000 + 's',
      pollInterval: pollInterval / 1000 + 's'
    });

    while (Date.now() - startTime < maxPollTime) {
      try {
        const statusResponse = await fetch(statusUrl, {
          headers: {
            'User-Agent': 'FitChecked-App-FASHN-Only/1.0'
            // Authorization handled by proxy
          }
        });

        if (!statusResponse.ok) {
          throw new Error(`Status polling failed: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        const elapsed = Math.round((Date.now() - startTime) / 1000);

        console.log(`🔍 [FASHN-ONLY] Status check (${elapsed}s):`, {
          status: statusData.status,
          hasOutput: !!statusData.output
        });

        if (statusData.status === 'COMPLETED' || statusData.status === 'completed') {
          if (statusData.output && statusData.output.length > 0) {
            const processingTime = Date.now() - startTime;
            console.log('✅ [FASHN-ONLY] Try-on completed via polling!');

            return {
              success: true,
              imageUrl: statusData.output[0],
              api: 'FASHN-Only',
              processingTime: processingTime / 1000
            };
          } else {
            throw new Error('FASHN processing completed but no output image found');
          }
        } else if (statusData.status === 'FAILED' || statusData.status === 'failed') {
          throw new Error(`FASHN processing failed: ${statusData.error || 'Unknown error'}`);
        }

        // Continue polling
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        console.error('⚠️ [FASHN-ONLY] Polling error:', error);
        throw error;
      }
    }

    throw new Error(`FASHN processing timed out after ${maxPollTime / 1000} seconds`);
  }

  /**
   * Validate service configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.baseUrl) {
      errors.push('FASHN API base URL is missing');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get service status and configuration info
   */
  getServiceInfo() {
    return {
      name: 'FASHN-Only Virtual Try-On Service',
      version: '1.0.0',
      apiEndpoint: this.baseUrl,
      integration: 'FASHN API via proxy',
      supportedFormats: ['File', 'Blob', 'base64 data URLs', 'HTTP URLs'],
      supportedCategories: ['upper_body', 'lower_body', 'dress', 'auto']
    };
  }
}

// Export singleton instance
export const fashnTryOnService = new FashnTryOnService();
export default fashnTryOnService;