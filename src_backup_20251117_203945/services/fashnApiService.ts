/**
 * FASHN API Service
 * Comprehensive service for virtual try-on and clothing integration
 */

import apiConfig from '../config/apiConfig';

export interface FashnTryOnParams {
  model_image: string; // URL or base64
  garment_image: string; // URL or base64
  category?: 'auto' | 'tops' | 'bottoms' | 'one-pieces';
  segmentation_free?: boolean;
  moderation_level?: 'conservative' | 'permissive' | 'none';
  garment_photo_type?: 'auto' | 'flat-lay' | 'model';
  mode?: 'performance' | 'balanced' | 'quality';
  seed?: number;
  num_samples?: number;
  output_format?: 'png' | 'jpeg';
  return_base64?: boolean;
}

export interface FashnProductToModelParams {
  product_image: string; // Required
  model_image?: string; // Optional - if not provided, generates new person
  prompt?: string; // Additional styling instructions
  aspect_ratio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '2:3' | '3:2' | '4:5' | '5:4';
  seed?: number;
  output_format?: 'png' | 'jpeg';
  return_base64?: boolean;
}

export interface FashnResponse {
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  url?: string;
  base64?: string;
  processing_time?: number;
  seed?: number;
  request_id?: string;
}

export interface FashnBatchResult {
  success: boolean;
  data?: FashnResponse;
  error?: string;
  garmentIndex: number;
}

export class FashnApiService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = apiConfig.getEndpoint('/api/fashn');
    console.log('🎯 [FASHN-API] Service initialized - URL:', this.apiUrl);
  }

  /**
   * Convert File to base64 with proper MIME type prefix
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;

        // Ensure proper base64 prefix format
        if (!base64.startsWith('data:')) {
          const mimeType = file.type || 'image/jpeg';
          resolve(`data:${mimeType};base64,${base64.split(',')[1] || base64}`);
        } else {
          resolve(base64);
        }
      };
      reader.onerror = (error) => {
        console.error('File to base64 conversion failed:', error);
        reject(new Error('Failed to convert file to base64'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate image file before processing
   */
  private validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'Image size must be less than 10MB' };
    }

    // Check supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return { valid: false, error: 'Supported formats: JPEG, PNG, WebP' };
    }

    return { valid: true };
  }

  /**
   * Check if API is configured and available
   * Returns true because the /api/fashn proxy is always available
   * (API keys are handled server-side by the proxy/serverless function)
   */
  isConfigured(): boolean {
    return true;
  }

  /**
   * Virtual Try-On endpoint - Apply garment to model
   */
  async virtualTryOn(
    modelImage: File | string,
    garmentImage: File | string,
    options: Partial<FashnTryOnParams> = {}
  ): Promise<FashnResponse> {
    try {
      console.log('👕 Starting FASHN virtual try-on...');

      // Validate files if they are File objects
      if (modelImage instanceof File) {
        const validation = this.validateImageFile(modelImage);
        if (!validation.valid) {
          throw new Error(`Model image error: ${validation.error}`);
        }
      }

      if (garmentImage instanceof File) {
        const validation = this.validateImageFile(garmentImage);
        if (!validation.valid) {
          throw new Error(`Garment image error: ${validation.error}`);
        }
      }

      // Convert files to base64 if needed
      const model_image = modelImage instanceof File
        ? await this.fileToBase64(modelImage)
        : modelImage;

      const garment_image = garmentImage instanceof File
        ? await this.fileToBase64(garmentImage)
        : garmentImage;

      const params: FashnTryOnParams = {
        model_image,
        garment_image,
        category: options.category || 'auto',
        segmentation_free: options.segmentation_free || false, // Default false - use segmentation to remove original clothes
        moderation_level: options.moderation_level || 'none',
        garment_photo_type: options.garment_photo_type || 'auto',
        mode: options.mode || 'quality',
        seed: options.seed || Math.floor(Math.random() * 1000000),
        num_samples: options.num_samples || 1,
        output_format: options.output_format || 'png',
        return_base64: options.return_base64 || false
      };

      console.log('🚀 Calling FASHN try-on API...', {
        category: params.category,
        mode: params.mode,
        num_samples: params.num_samples
      });

      const response = await fetch(`${this.apiUrl}/try-on`, {
        method: 'POST',
        headers: {
          // Authorization header added by serverless function
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FASHN API error response:', errorText);
        throw new Error(`FASHN API error (${response.status}): ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ FASHN try-on completed successfully:', {
        hasImages: !!(result.images && result.images.length > 0),
        processingTime: result.processing_time,
        seed: result.seed
      });

      return result;

    } catch (error) {
      console.error('❌ FASHN virtual try-on failed:', error);
      throw error;
    }
  }

  /**
   * Product to Model endpoint - Generate model wearing clothing or apply to existing model
   */
  async productToModel(
    productImage: File | string,
    modelImage?: File | string,
    options: Partial<FashnProductToModelParams> = {}
  ): Promise<FashnResponse> {
    try {
      console.log('🎭 Starting FASHN product-to-model generation...');

      // Validate files
      if (productImage instanceof File) {
        const validation = this.validateImageFile(productImage);
        if (!validation.valid) {
          throw new Error(`Product image error: ${validation.error}`);
        }
      }

      if (modelImage instanceof File) {
        const validation = this.validateImageFile(modelImage);
        if (!validation.valid) {
          throw new Error(`Model image error: ${validation.error}`);
        }
      }

      const product_image = productImage instanceof File
        ? await this.fileToBase64(productImage)
        : productImage;

      const params: FashnProductToModelParams = {
        product_image,
        output_format: options.output_format || 'png',
        return_base64: options.return_base64 || false,
        seed: options.seed || Math.floor(Math.random() * 1000000)
      };

      // Add optional parameters
      if (modelImage) {
        params.model_image = modelImage instanceof File
          ? await this.fileToBase64(modelImage)
          : modelImage;
      }

      if (options.prompt) {
        params.prompt = options.prompt;
      }

      if (options.aspect_ratio && !modelImage) {
        // Only apply aspect ratio when generating new model (not in try-on mode)
        params.aspect_ratio = options.aspect_ratio;
      }

      console.log('🚀 Calling FASHN product-to-model API...', {
        hasModelImage: !!params.model_image,
        aspectRatio: params.aspect_ratio,
        prompt: params.prompt
      });

      const response = await fetch(`${this.apiUrl}/product-to-model`, {
        method: 'POST',
        headers: {
          // Authorization header added by serverless function
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FASHN API error response:', errorText);
        throw new Error(`FASHN API error (${response.status}): ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ FASHN product-to-model completed successfully:', {
        hasImage: !!(result.url || result.base64),
        processingTime: result.processing_time,
        seed: result.seed
      });

      return result;

    } catch (error) {
      console.error('❌ FASHN product-to-model failed:', error);
      throw error;
    }
  }

  /**
   * Batch processing for multiple garments with single model
   */
  async batchTryOn(
    modelImage: File | string,
    garmentImages: (File | string)[],
    options: Partial<FashnTryOnParams> = {}
  ): Promise<FashnBatchResult[]> {
    console.log(`🔄 Starting batch try-on for ${garmentImages.length} garments...`);

    const results: FashnBatchResult[] = [];

    for (let i = 0; i < garmentImages.length; i++) {
      const garment = garmentImages[i];

      try {
        console.log(`Processing garment ${i + 1}/${garmentImages.length}...`);

        const result = await this.virtualTryOn(modelImage, garment, {
          ...options,
          // Add small delay between requests to avoid rate limiting
          seed: options.seed ? options.seed + i : undefined
        });

        results.push({
          success: true,
          data: result,
          garmentIndex: i
        });

        // Small delay between requests
        if (i < garmentImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Batch try-on failed for garment ${i + 1}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          garmentIndex: i
        });
      }
    }

    console.log('✅ Batch try-on completed:', {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;
  }

  /**
   * Generate multiple variations of the same try-on
   */
  async generateVariations(
    modelImage: File | string,
    garmentImage: File | string,
    numVariations: number = 3,
    options: Partial<FashnTryOnParams> = {}
  ): Promise<FashnBatchResult[]> {
    console.log(`🎨 Generating ${numVariations} try-on variations...`);

    const results: FashnBatchResult[] = [];

    for (let i = 0; i < numVariations; i++) {
      try {
        const result = await this.virtualTryOn(modelImage, garmentImage, {
          ...options,
          seed: Math.floor(Math.random() * 1000000), // Different seed for each variation
          num_samples: 1
        });

        results.push({
          success: true,
          data: result,
          garmentIndex: i
        });

        // Small delay between requests
        if (i < numVariations - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`Variation ${i + 1} failed:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          garmentIndex: i
        });
      }
    }

    return results;
  }

  /**
   * Get service status and configuration info
   */
  getServiceInfo() {
    return {
      name: 'FASHN API Service',
      version: '1.0.0',
      description: 'Virtual try-on and clothing generation service',
      isConfigured: this.isConfigured(),
      apiUrl: this.apiUrl,
      supportedFormats: ['JPEG', 'PNG', 'WebP'],
      maxFileSize: '10MB',
      endpoints: {
        tryOn: `${this.apiUrl}/try-on`,
        productToModel: `${this.apiUrl}/product-to-model`
      },
      capabilities: [
        'Virtual try-on with user avatar',
        'Generate model wearing clothing',
        'Batch processing multiple garments',
        'Generate variations with different seeds',
        'Support for multiple garment categories',
        'Flexible quality and performance modes'
      ]
    };
  }
}

// Export singleton instance
export const fashnApiService = new FashnApiService();
export default fashnApiService;