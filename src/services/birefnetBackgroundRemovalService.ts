/**
 * BiRefNet Background Removal Service
 * Uses fal-ai/birefnet/v2 for superior background removal quality
 * Supports multiple models for different image types
 */

import apiConfig from '../config/apiConfig';

export type BiRefNetModel = 
  | "General Use (Light)" 
  | "General Use (Light 2K)" 
  | "General Use (Heavy)" 
  | "Matting" 
  | "Portrait" 
  | "General Use (Dynamic)";

export type BiRefNetResolution = "1024x1024" | "2048x2048" | "2304x2304";

export type BiRefNetOutputFormat = "png" | "webp";

export interface BiRefNetOptions {
  model?: BiRefNetModel;
  operating_resolution?: BiRefNetResolution;
  output_mask?: boolean;
  refine_foreground?: boolean;
  output_format?: BiRefNetOutputFormat;
  sync_mode?: boolean;
}

export interface BiRefNetResult {
  success: boolean;
  imageUrl?: string;
  maskUrl?: string;
  error?: string;
  processingTime?: number;
  modelUsed?: BiRefNetModel;
}

class BiRefNetBackgroundRemovalService {
  private readonly API_BASE = '/api/fal'; // Use proxy
  private cache = new Map<string, BiRefNetResult>();

  /**
   * Remove background using BiRefNet v2
   */
  async removeBackground(
    imageUrl: string,
    options: BiRefNetOptions = {}
  ): Promise<BiRefNetResult> {
    const startTime = Date.now();
    
    console.log('🎨 [BIREFNET] Starting background removal with BiRefNet v2');
    console.log('📝 [BIREFNET] Options:', options);

    // Check cache
    const cacheKey = this.getCacheKey(imageUrl, options);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('💾 [BIREFNET] Using cached result');
      return cached;
    }

    try {
      // Default options
      const config: Required<BiRefNetOptions> = {
        model: options.model || "General Use (Light)",
        operating_resolution: options.operating_resolution || "2048x2048",
        output_mask: options.output_mask || false,
        refine_foreground: options.refine_foreground !== false, // Default true
        output_format: options.output_format || "png",
        sync_mode: options.sync_mode || false
      };

      console.log('🚀 [BIREFNET] Calling BiRefNet API with config:', config);

      // Call fal-ai/birefnet/v2
      const response = await fetch(`${this.API_BASE}/fal-ai/birefnet/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_url: imageUrl,
          model: config.model,
          operating_resolution: config.operating_resolution,
          output_mask: config.output_mask,
          refine_foreground: config.refine_foreground,
          output_format: config.output_format,
          sync_mode: config.sync_mode
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`BiRefNet API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📦 [BIREFNET] API response received:', {
        hasImage: !!result.image,
        hasMask: !!result.mask_image
      });

      // Extract image URL from response
      const processedImageUrl = result.image?.url || result.image;
      const maskImageUrl = result.mask_image?.url || result.mask_image;

      if (!processedImageUrl) {
        throw new Error('No image URL in BiRefNet response');
      }

      const processingTime = Date.now() - startTime;
      const finalResult: BiRefNetResult = {
        success: true,
        imageUrl: processedImageUrl,
        maskUrl: maskImageUrl,
        processingTime,
        modelUsed: config.model
      };

      // Cache successful result
      this.cache.set(cacheKey, finalResult);

      console.log(`✅ [BIREFNET] Background removal complete in ${processingTime}ms`);
      console.log('🖼️ [BIREFNET] Result image:', processedImageUrl.substring(0, 100) + '...');

      return finalResult;

    } catch (error) {
      console.error('❌ [BIREFNET] Background removal failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Remove background with automatic model selection based on image analysis
   */
  async removeBackgroundAuto(imageUrl: string): Promise<BiRefNetResult> {
    console.log('🤖 [BIREFNET-AUTO] Analyzing image for optimal model selection...');

    try {
      // Analyze image type
      const imageType = await this.analyzeImageType(imageUrl);
      console.log('📊 [BIREFNET-AUTO] Image type detected:', imageType);

      // Select optimal model
      let model: BiRefNetModel;
      let resolution: BiRefNetResolution;

      if (imageType === 'person-wearing') {
        model = "Portrait";
        resolution = "2048x2048";
        console.log('👤 [BIREFNET-AUTO] Using Portrait model for person image');
      } else if (imageType === 'flat-lay') {
        model = "General Use (Light)";
        resolution = "2048x2048";
        console.log('📐 [BIREFNET-AUTO] Using General Use (Light) for flat-lay');
      } else if (imageType === 'high-resolution') {
        model = "General Use (Dynamic)";
        resolution = "2304x2304";
        console.log('🔬 [BIREFNET-AUTO] Using General Use (Dynamic) for high-res');
      } else {
        model = "General Use (Light)";
        resolution = "1024x1024";
        console.log('📷 [BIREFNET-AUTO] Using General Use (Light) as default');
      }

      return await this.removeBackground(imageUrl, {
        model,
        operating_resolution: resolution,
        refine_foreground: true,
        output_format: "png"
      });

    } catch (error) {
      console.warn('⚠️ [BIREFNET-AUTO] Auto-selection failed, using default:', error);
      
      // Fallback to default settings
      return await this.removeBackground(imageUrl, {
        model: "General Use (Light)",
        operating_resolution: "2048x2048"
      });
    }
  }

  /**
   * Analyze image type for model selection
   */
  private async analyzeImageType(imageUrl: string): Promise<'person-wearing' | 'flat-lay' | 'mannequin' | 'high-resolution' | 'unknown'> {
    try {
      // Quick heuristic analysis based on image properties
      const img = await this.loadImage(imageUrl);
      
      // Check resolution
      if (img.width > 2000 || img.height > 2000) {
        return 'high-resolution';
      }

      // For more accurate detection, we'd use Claude Vision API
      // For now, return unknown to use default
      return 'unknown';

    } catch (error) {
      console.warn('⚠️ [BIREFNET-AUTO] Image analysis failed:', error);
      return 'unknown';
    }
  }

  /**
   * Load image to check properties
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Generate cache key
   */
  private getCacheKey(imageUrl: string, options: BiRefNetOptions): string {
    return `${imageUrl}-${JSON.stringify(options)}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 [BIREFNET] Cache cleared');
  }

  /**
   * Get available models
   */
  getAvailableModels(): BiRefNetModel[] {
    return [
      "General Use (Light)",
      "General Use (Light 2K)",
      "General Use (Heavy)",
      "Matting",
      "Portrait",
      "General Use (Dynamic)"
    ];
  }

  /**
   * Get model recommendations
   */
  getModelRecommendations(): Record<string, BiRefNetModel> {
    return {
      'person-wearing': "Portrait",
      'flat-lay-product': "General Use (Light)",
      'high-resolution': "General Use (Dynamic)",
      'matting-alpha': "Matting",
      'heavy-quality': "General Use (Heavy)",
      'default': "General Use (Light)"
    };
  }
}

// Export singleton
export const birefnetBackgroundRemovalService = new BiRefNetBackgroundRemovalService();
export default birefnetBackgroundRemovalService;
