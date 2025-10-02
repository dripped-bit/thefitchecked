/**
 * Virtual Try-On Service - FASHN via Proxy
 * Uses FASHN API exclusively via server-side proxy
 */

import fashnTryOnService from './fashnTryOnService';

export interface VirtualTryOnRequest {
  avatarImageUrl: string;
  clothingImageUrl: string;
  category?: 'upper_body' | 'lower_body' | 'dress' | 'auto';
  preservePose?: boolean;
  autoAlign?: boolean;
}

export interface VirtualTryOnResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  processingTime?: number;
  attempts?: number;
  api: string;
}

export class VirtualTryOnService {
  constructor() {
    console.log('🔧 [VIRTUAL-TRYON] Virtual Try-On Service initialized - using FASHN via proxy');
  }

  /**
   * Try on clothing using hybrid FASHN + fal.ai approach with intelligent fallback
   */
  async tryOnClothing(
    avatarImageUrl: string,
    clothingImageUrl: string,
    options: Partial<VirtualTryOnRequest> = {}
  ): Promise<VirtualTryOnResult> {
    console.log('🚀 [VIRTUAL-TRYON] Starting FASHN virtual try-on via proxy...');
    console.log('🔍 [VIRTUAL-TRYON] Input validation:', {
      avatarImageUrl: avatarImageUrl ? `${avatarImageUrl.substring(0, 50)}...` : 'missing',
      clothingImageUrl: clothingImageUrl ? `${clothingImageUrl.substring(0, 50)}...` : 'missing',
      category: options.category || 'auto',
      preservePose: options.preservePose,
      autoAlign: options.autoAlign
    });

    if (!avatarImageUrl || !clothingImageUrl) {
      throw new Error('Both avatar and clothing image URLs are required');
    }

    const startTime = Date.now();

    try {
      console.log('📤 [VIRTUAL-TRYON] Attempting FASHN API try-on via proxy...');
      const fashnResult = await fashnTryOnService.tryOnClothing(avatarImageUrl, clothingImageUrl, {
        category: options.category || 'auto',
        preserve_pose: options.preservePose || true,
        auto_align: options.autoAlign || true
      });

      const totalTime = Date.now() - startTime;

      if (fashnResult.success) {
        console.log('✅ [VIRTUAL-TRYON] FASHN API succeeded - using result');
        return {
          success: true,
          imageUrl: fashnResult.imageUrl,
          api: 'FASHN API',
          processingTime: totalTime / 1000,
          attempts: 1
        };
      } else {
        return {
          success: false,
          error: fashnResult.error || 'Virtual try-on failed',
          api: 'FASHN API',
          processingTime: totalTime / 1000,
          attempts: 1
        };
      }
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error('❌ [VIRTUAL-TRYON] FASHN API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Virtual try-on failed',
        api: 'FASHN API',
        processingTime: totalTime / 1000,
        attempts: 1
      };
    }
  }


  /**
   * Apply outfit to avatar using hybrid FASHN + fal.ai approach
   */
  async applyOutfitToAvatar(
    avatarImage: string,
    outfitImage: string,
    category: 'upper_body' | 'lower_body' | 'dress' = 'auto'
  ): Promise<VirtualTryOnResult> {
    console.log('🎯 [VIRTUAL-TRYON] Starting hybrid outfit application...');

    // Map old category names to new format
    let fashnCategory: 'upper_body' | 'lower_body' | 'dress' | 'auto' = 'auto';

    if (category === 'tops') {
      fashnCategory = 'upper_body';
    } else if (category === 'bottoms') {
      fashnCategory = 'lower_body';
    } else if (category === 'one-pieces') {
      fashnCategory = 'dress';
    } else {
      fashnCategory = category;
    }

    return this.tryOnClothing(avatarImage, outfitImage, {
      category: fashnCategory,
      preservePose: true,
      autoAlign: true
    });
  }

  /**
   * Batch try-on multiple clothing items (FASHN-only)
   */
  async batchTryOn(
    avatarImageUrl: string,
    clothingImageUrls: string[],
    options: Partial<VirtualTryOnRequest> = {}
  ): Promise<VirtualTryOnResult[]> {
    console.log('🔄 [VIRTUAL-TRYON] Starting batch try-on with FASHN-only:', {
      avatarImageUrl: avatarImageUrl.substring(0, 50) + '...',
      clothingCount: clothingImageUrls.length
    });

    const results: VirtualTryOnResult[] = [];

    for (let i = 0; i < clothingImageUrls.length; i++) {
      console.log(`📸 [VIRTUAL-TRYON] Processing item ${i + 1}/${clothingImageUrls.length}`);

      try {
        const result = await this.tryOnClothing(avatarImageUrl, clothingImageUrls[i], options);
        results.push(result);

        // Add small delay between requests to avoid overwhelming the API
        if (i < clothingImageUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ [VIRTUAL-TRYON] Batch item ${i + 1} failed:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Batch try-on item failed',
          api: 'FASHN-Only',
          attempts: 1
        });
      }
    }

    console.log('✅ [VIRTUAL-TRYON] Batch try-on completed:', {
      totalItems: clothingImageUrls.length,
      successfulItems: results.filter(r => r.success).length,
      failedItems: results.filter(r => !r.success).length
    });

    return results;
  }

  /**
   * Get service status and capabilities
   */
  getServiceStatus() {
    const fashnConfig = fashnTryOnService.validateConfiguration();

    return {
      serviceName: 'Virtual Try-On Service (FASHN-Only)',
      version: '2.0.0',
      integration: 'FASHN API Only',
      removedIntegrations: ['fal-ai', 'fal.ai Image-Apps-V2', 'fal.ai CAT-VTON'],
      fashnAvailable: fashnConfig.isValid,
      fashnErrors: fashnConfig.errors,
      capabilities: {
        singleTryOn: true,
        batchTryOn: true,
        categories: ['upper_body', 'lower_body', 'dress', 'auto'],
        supportedFormats: ['File', 'Blob', 'base64', 'HTTP URLs'],
        features: ['preserve_pose', 'auto_align', 'category_detection']
      },
      fallbackApis: [], // No more fallbacks - FASHN only
      migration: {
        from: 'Hybrid fal-ai + FASHN system',
        to: 'FASHN-only system',
        benefits: ['Simplified architecture', 'Single API consistency', 'No fallback complexity'],
        date: new Date().toISOString()
      }
    };
  }

  /**
   * Validate that the service is ready to use
   */
  validateServiceReady(): { ready: boolean; errors: string[] } {
    const errors: string[] = [];

    const fashnConfig = fashnTryOnService.validateConfiguration();
    if (!fashnConfig.isValid) {
      errors.push(...fashnConfig.errors.map(err => `FASHN: ${err}`));
    }

    return {
      ready: errors.length === 0,
      errors
    };
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return true; // Always available via proxy
  }

  /**
   * Get virtual try-on service capabilities (FASHN-only)
   */
  getServiceInfo() {
    return {
      primaryApi: 'FASHN API',
      fallbackApis: [], // Removed all fal-ai fallbacks
      capabilities: {
        primaryResolution: 'High-quality fashion try-on',
        preservePose: true,
        maxImageSize: '5MB',
        supportedFormats: ['JPEG', 'PNG', 'WebP']
      },
      features: [
        'FASHN API for best fashion results',
        'FormData-based file uploads',
        'Pose preservation technology',
        'Fashion-optimized processing',
        'Robust error handling',
        'Single API consistency'
      ],
      apiPriority: [
        '1. FASHN API (Only option - best fashion quality)'
      ],
      isAvailable: this.isAvailable(),
      migration: {
        removed: 'All fal-ai integrations and dependencies',
        simplified: 'Single FASHN API workflow',
        benefits: 'Consistent results, no fallback complexity'
      }
    };
  }

  /**
   * Legacy method for backward compatibility - now uses FASHN only
   * @deprecated Use tryOnClothing directly - no more hybrid/fallback logic
   */
  async tryOnClothingWithFallback(
    avatarImageUrl: string,
    clothingImageUrl: string,
    options: Partial<VirtualTryOnRequest> = {}
  ): Promise<VirtualTryOnResult> {
    console.warn('⚠️ [VIRTUAL-TRYON] tryOnClothingWithFallback is deprecated - now uses FASHN-only');
    return this.tryOnClothing(avatarImageUrl, clothingImageUrl, options);
  }

  /**
   * Detect clothing category (simplified for FASHN)
   */
  detectGarmentCategory(imagePath: string): 'upper_body' | 'lower_body' | 'dress' | 'auto' {
    console.log('🔍 [CATEGORY] Analyzing garment category for:', imagePath);

    const lowerCase = imagePath.toLowerCase();

    // Dresses and one-pieces
    const dressKeywords = ['dress', 'gown', 'jumpsuit', 'romper', 'overall'];
    if (dressKeywords.some(keyword => lowerCase.includes(keyword))) {
      console.log('✅ [CATEGORY] Detected as DRESS');
      return 'dress';
    }

    // Tops - upper body garments
    const topKeywords = ['shirt', 'top', 'blouse', 'tee', 'tank', 'jacket', 'sweater', 'hoodie'];
    if (topKeywords.some(keyword => lowerCase.includes(keyword))) {
      console.log('✅ [CATEGORY] Detected as UPPER_BODY');
      return 'upper_body';
    }

    // Bottoms - lower body garments
    const bottomKeywords = ['pants', 'trouser', 'jeans', 'short', 'skirt', 'leggings'];
    if (bottomKeywords.some(keyword => lowerCase.includes(keyword))) {
      console.log('✅ [CATEGORY] Detected as LOWER_BODY');
      return 'lower_body';
    }

    console.log('⚠️ [CATEGORY] Unable to determine category, using AUTO');
    return 'auto';
  }

  /**
   * Validate image format
   */
  validateImage(imageData: string): boolean {
    const isBase64 = imageData.startsWith('data:image/');
    const isUrl = imageData.startsWith('http://') || imageData.startsWith('https://');

    if (!isBase64 && !isUrl) {
      console.error('❌ Invalid image format: must be base64 or URL');
      return false;
    }

    // Check size for base64 (max 5MB for FASHN)
    if (isBase64 && imageData.length > 5 * 1024 * 1024) {
      console.error('❌ Image too large: max 5MB for FASHN processing');
      return false;
    }

    console.log('✅ Image validation passed');
    return true;
  }
}

// Export singleton instance
export const virtualTryOnService = new VirtualTryOnService();
export default virtualTryOnService;