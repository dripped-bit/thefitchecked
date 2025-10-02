/**
 * Seamless Two-Step Virtual Try-On Service
 * Combines text-to-image clothing generation with automatic virtual try-on
 *
 * WORKFLOW:
 * 1. User enters clothing description → fal-ai/bytedance/seedream/v4/text-to-image generates clothing
 * 2. Automatically → fal-ai/image-apps-v2 virtual try-on puts clothing on avatar
 * 3. Result: Avatar wearing the generated clothing (seamless experience)
 */

import { environmentConfig } from './environmentConfig';
import enhancedPromptGenerationService from './enhancedPromptGenerationService';
import { virtualTryOnService } from './virtualTryOnService';

export interface SeamlessTryOnRequest {
  clothingDescription: string;
  avatarImage: string;
  style?: 'casual' | 'formal' | 'trendy' | 'vintage' | 'minimalist' | 'edgy';
  quality?: 'draft' | 'balanced' | 'high';
  enhancePrompts?: boolean;
}

export interface SeamlessTryOnResult {
  success: boolean;
  clothingImageUrl?: string;     // Step 1 result: Generated clothing
  finalImageUrl?: string;        // Step 2 result: Avatar wearing clothing
  error?: string;
  step1Time?: number;            // Time for clothing generation
  step2Time?: number;            // Time for virtual try-on
  totalTime?: number;            // Total processing time
  clothingCategory?: string;     // Auto-detected category
  enhancedPrompt?: string;       // LLM-enhanced prompt used
  fallbackMode?: boolean;        // Whether fallback was used
}

export interface TryOnProgress {
  step: 'generating-clothing' | 'applying-to-avatar' | 'completed' | 'error';
  message: string;
  progress: number; // 0-100
  clothingImageUrl?: string;
  finalImageUrl?: string;
}

export type ProgressCallback = (progress: TryOnProgress) => void;

class SeamlessTryOnService {
  private readonly clothingModelId = 'fal-ai/bytedance/seedream/v4/text-to-image';

  /**
   * Main seamless try-on method - handles both steps automatically
   */
  async generateAndTryOn(
    request: SeamlessTryOnRequest,
    onProgress?: ProgressCallback
  ): Promise<SeamlessTryOnResult> {
    console.log('🚀 [SEAMLESS] Starting seamless two-step try-on workflow...');
    console.log('👕 [SEAMLESS] Clothing description:', request.clothingDescription);

    const startTime = Date.now();

    try {
      // Validate inputs
      if (!request.clothingDescription || !request.avatarImage) {
        throw new Error('Both clothing description and avatar image are required');
      }

      // Step 1: Generate clothing using text-to-image
      onProgress?.({
        step: 'generating-clothing',
        message: 'Generating clothing from description...',
        progress: 10
      });

      const clothingResult = await this.generateClothing(
        request.clothingDescription,
        request.style || 'casual',
        request.enhancePrompts !== false
      );

      if (!clothingResult.success || !clothingResult.imageUrl) {
        throw new Error(clothingResult.error || 'Failed to generate clothing');
      }

      const step1Time = Date.now() - startTime;
      console.log(`✅ [SEAMLESS] Step 1 completed in ${step1Time}ms`);

      onProgress?.({
        step: 'applying-to-avatar',
        message: 'Applying clothing to your avatar...',
        progress: 60,
        clothingImageUrl: clothingResult.imageUrl
      });

      // Auto-detect clothing category for virtual try-on
      const clothingCategory = this.detectClothingCategory(request.clothingDescription);
      console.log('🔍 [SEAMLESS] Auto-detected category:', clothingCategory);

      // Step 2: Automatically apply clothing to avatar using virtual try-on
      const step2StartTime = Date.now();
      const tryOnResult = await virtualTryOnService.applyOutfitToAvatar(
        request.avatarImage,
        clothingResult.imageUrl,
        clothingCategory
      );

      const step2Time = Date.now() - step2StartTime;
      const totalTime = Date.now() - startTime;

      if (!tryOnResult.success) {
        console.warn('⚠️ [SEAMLESS] Virtual try-on failed, showing clothing only');
        // Return clothing result if try-on fails
        onProgress?.({
          step: 'completed',
          message: 'Clothing generated (try-on unavailable)',
          progress: 100,
          clothingImageUrl: clothingResult.imageUrl
        });

        return {
          success: true,
          clothingImageUrl: clothingResult.imageUrl,
          error: `Clothing generated successfully, but try-on failed: ${tryOnResult.error}`,
          step1Time: step1Time / 1000,
          step2Time: step2Time / 1000,
          totalTime: totalTime / 1000,
          clothingCategory,
          enhancedPrompt: clothingResult.enhancedPrompt,
          fallbackMode: true
        };
      }

      // Success! Both steps completed
      console.log(`🎉 [SEAMLESS] Complete workflow finished in ${totalTime}ms`);

      onProgress?.({
        step: 'completed',
        message: 'Virtual try-on completed!',
        progress: 100,
        clothingImageUrl: clothingResult.imageUrl,
        finalImageUrl: tryOnResult.imageUrl
      });

      return {
        success: true,
        clothingImageUrl: clothingResult.imageUrl,
        finalImageUrl: tryOnResult.imageUrl,
        step1Time: step1Time / 1000,
        step2Time: step2Time / 1000,
        totalTime: totalTime / 1000,
        clothingCategory,
        enhancedPrompt: clothingResult.enhancedPrompt,
        fallbackMode: tryOnResult.developmentMode || false
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error('❌ [SEAMLESS] Workflow failed:', error);

      onProgress?.({
        step: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        progress: 0
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalTime: totalTime / 1000
      };
    }
  }

  /**
   * Step 1: Generate clothing using Seedream text-to-image
   */
  private async generateClothing(
    description: string,
    style: string,
    enhancePrompts: boolean
  ): Promise<{ success: boolean; imageUrl?: string; enhancedPrompt?: string; error?: string }> {
    console.log('👔 [SEAMLESS-STEP1] Generating clothing from description...');

    try {
      let finalPrompt = description;

      // Enhance prompt using LLM if enabled
      if (enhancePrompts) {
        try {
          const enhancedResult = await enhancedPromptGenerationService.generateEnhancedPrompt({
            userRequest: description,
            style: style as any,
            occasion: 'everyday'
          });

          finalPrompt = `${enhancedResult.mainPrompt}, clothing item photography, white background, high resolution, detailed fabric texture`;
          console.log('🧠 [SEAMLESS-STEP1] Enhanced prompt:', finalPrompt);
        } catch (error) {
          console.warn('⚠️ [SEAMLESS-STEP1] Prompt enhancement failed, using basic prompt');
          finalPrompt = `${description}, clothing item, white background, high quality, detailed`;
        }
      }

      // Generate clothing using Seedream text-to-image
      const response = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          negative_prompt: 'blurry, low quality, distorted, multiple items, background clutter, watermark, text, bad anatomy',
          image_size: {
            width: 512,
            height: 768
          },
          num_inference_steps: 30,
          guidance_scale: 8.0,
          num_images: 1,
          seed: Math.floor(Math.random() * 1000000),
          enable_safety_checker: false,
          safety_tolerance: 2,
          scheduler: 'DPM++ 2M Karras'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Clothing generation failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const imageUrl = data.images?.[0]?.url || data.data?.images?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No clothing image generated');
      }

      console.log('✅ [SEAMLESS-STEP1] Clothing generated successfully');

      return {
        success: true,
        imageUrl,
        enhancedPrompt: finalPrompt
      };

    } catch (error) {
      console.error('❌ [SEAMLESS-STEP1] Clothing generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Auto-detect clothing category from description for virtual try-on
   */
  private detectClothingCategory(description: string): 'tops' | 'bottoms' | 'one-pieces' | 'auto' {
    const lowerDesc = description.toLowerCase();

    // Tops - upper body garments
    const topKeywords = [
      'shirt', 'top', 'blouse', 'tee', 't-shirt', 'tank', 'camisole',
      'jacket', 'sweater', 'cardigan', 'hoodie', 'pullover', 'sweatshirt',
      'blazer', 'coat', 'vest', 'polo', 'henley', 'crop', 'tube', 'halter',
      'bodysuit', 'corset', 'bra', 'bikini top'
    ];

    // Bottoms - lower body garments
    const bottomKeywords = [
      'pants', 'shorts', 'jeans', 'skirt', 'trouser', 'slacks',
      'leggings', 'joggers', 'sweatpants', 'chinos', 'cargo',
      'capri', 'culottes', 'palazzo', 'bermuda',
      'mini skirt', 'midi skirt', 'maxi skirt', 'pencil skirt', 'a-line skirt',
      'bikini bottom', 'underwear', 'panties'
    ];

    // One-pieces - full body garments
    const onePieceKeywords = [
      'dress', 'jumpsuit', 'romper', 'overall', 'overalls',
      'playsuit', 'catsuit', 'bodycon', 'wrap dress',
      'shift dress', 'cocktail dress', 'gown', 'sundress',
      'maxi dress', 'midi dress', 'mini dress', 'evening dress',
      'wedding dress', 'prom dress', 'bikini', 'swimsuit', 'bathing suit'
    ];

    // Check for one-pieces first (most specific)
    if (onePieceKeywords.some(keyword => lowerDesc.includes(keyword))) {
      console.log('🔍 [SEAMLESS] Detected: one-pieces');
      return 'one-pieces';
    }

    // Check for tops
    if (topKeywords.some(keyword => lowerDesc.includes(keyword))) {
      console.log('🔍 [SEAMLESS] Detected: tops');
      return 'tops';
    }

    // Check for bottoms
    if (bottomKeywords.some(keyword => lowerDesc.includes(keyword))) {
      console.log('🔍 [SEAMLESS] Detected: bottoms');
      return 'bottoms';
    }

    // Use auto for unknown or complex descriptions
    console.log('🔍 [SEAMLESS] Using auto-detection for:', description);
    return 'auto';
  }

  /**
   * Generate multiple clothing variations and try them on
   */
  async generateVariationsAndTryOn(
    baseDescription: string,
    avatarImage: string,
    variationCount: number = 3,
    onProgress?: ProgressCallback
  ): Promise<SeamlessTryOnResult[]> {
    console.log(`🔄 [SEAMLESS] Generating ${variationCount} clothing variations...`);

    const variations = [
      `${baseDescription}, classic style`,
      `${baseDescription}, modern trendy style`,
      `${baseDescription}, elegant sophisticated style`
    ];

    const results: SeamlessTryOnResult[] = [];

    for (let i = 0; i < Math.min(variationCount, variations.length); i++) {
      const variation = variations[i];
      console.log(`📦 [SEAMLESS] Processing variation ${i + 1}/${variationCount}: ${variation}`);

      onProgress?.({
        step: 'generating-clothing',
        message: `Generating variation ${i + 1}/${variationCount}...`,
        progress: (i / variationCount) * 100
      });

      try {
        const result = await this.generateAndTryOn({
          clothingDescription: variation,
          avatarImage,
          enhancePrompts: true
        });

        results.push(result);

        // Small delay between variations
        if (i < variationCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ [SEAMLESS] Variation ${i + 1} failed:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    onProgress?.({
      step: 'completed',
      message: `Generated ${results.filter(r => r.success).length} variations`,
      progress: 100
    });

    console.log(`✅ [SEAMLESS] Completed ${results.filter(r => r.success).length}/${results.length} variations`);
    return results;
  }

  /**
   * Quick clothing generation (Step 1 only) for preview
   */
  async generateClothingOnly(
    description: string,
    style: string = 'casual',
    enhancePrompts: boolean = true
  ): Promise<{ success: boolean; imageUrl?: string; enhancedPrompt?: string; error?: string }> {
    console.log('👔 [SEAMLESS] Quick clothing generation (preview mode)...');

    return await this.generateClothing(description, style, enhancePrompts);
  }

  /**
   * Get service capabilities and status
   */
  getServiceInfo() {
    return {
      name: 'Seamless Two-Step Virtual Try-On',
      version: '1.0.0',
      steps: [
        {
          step: 1,
          name: 'Clothing Generation',
          api: 'fal-ai/bytedance/seedream/v4/text-to-image',
          description: 'Generate clothing from text description'
        },
        {
          step: 2,
          name: 'Virtual Try-On',
          api: 'fal-ai/image-apps-v2/virtual-try-on',
          description: 'Apply generated clothing to avatar'
        }
      ],
      features: [
        'Seamless automatic workflow',
        'LLM-enhanced prompts',
        'Auto clothing category detection',
        'Real-time progress tracking',
        'Graceful error handling',
        'Fallback to clothing-only if try-on fails',
        'Multiple variation generation',
        'Quality level control'
      ],
      isAvailable: environmentConfig.isFalApiAvailable() && environmentConfig.shouldUseProductionApi()
    };
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return environmentConfig.isFalApiAvailable() && environmentConfig.shouldUseProductionApi();
  }
}

// Export singleton instance
export const seamlessTryOnService = new SeamlessTryOnService();
export default seamlessTryOnService;