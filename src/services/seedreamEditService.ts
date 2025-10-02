/**
 * Seedream Edit Service - fal.ai/bytedance/seedream/v4/edit
 * Provides image-to-image editing capabilities for avatar try-on
 * Implements Step 2 of the two-step clothing try-on system
 */

import { environmentConfig } from './environmentConfig';
import enhancedPromptGenerationService from './enhancedPromptGenerationService';

export interface SeedreamEditRequest {
  image: string;                    // Base image (avatar/person)
  prompt: string;                   // What to add/change (clothing description)
  negative_prompt?: string;         // What to avoid
  image_size?: {
    width: number;
    height: number;
  };
  num_inference_steps?: number;     // Default: 30
  guidance_scale?: number;          // Default: 8.0
  num_images?: number;              // Default: 1
  seed?: number;                    // For reproducibility
  enable_safety_checker?: boolean;  // Default: false
  safety_tolerance?: number;        // 1-5, default: 2
  scheduler?: string;               // Default: "DPM++ 2M Karras"
  strength?: number;                // Image-to-image strength (0.0-1.0)
}

export interface SeedreamEditResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

export interface SeedreamEditResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  processingTime?: number;
  originalPrompt?: string;
  enhancedPrompt?: string;
}

export interface TryOnPromptOptions {
  clothingDescription: string;
  avatarDescription?: string;
  style?: string;
  preserveFeatures?: boolean;
  quality?: 'draft' | 'balanced' | 'high';
}

class SeedreamEditService {
  private readonly modelId = 'fal-ai/bytedance/seedream/v4/edit';

  /**
   * Apply clothing to avatar using Seedream edit (image-to-image)
   * This is Step 2 of the two-step try-on process
   */
  async applyClothingToAvatar(
    avatarImage: string,
    clothingDescription: string,
    options: Partial<TryOnPromptOptions> = {}
  ): Promise<SeedreamEditResult> {
    console.log('👔 [SEEDREAM-EDIT] Starting clothing application to avatar...');
    console.log('📝 [SEEDREAM-EDIT] Clothing description:', clothingDescription);

    try {
      // Validate inputs
      if (!avatarImage || !clothingDescription) {
        throw new Error('Both avatar image and clothing description are required');
      }

      // Check if API is available
      if (!environmentConfig.isFalApiAvailable() || !environmentConfig.shouldUseProductionApi()) {
        console.log('🔧 [SEEDREAM-EDIT] Using fallback mode - API not available');
        return this.generateFallbackEdit(avatarImage, clothingDescription);
      }

      // Generate optimized try-on prompt using LLM
      const tryOnPrompt = await this.generateTryOnPrompt(clothingDescription, options);

      // Prepare Seedream edit request
      const request: SeedreamEditRequest = {
        image: avatarImage,
        prompt: tryOnPrompt.enhancedPrompt,
        negative_prompt: tryOnPrompt.negativePrompt,
        image_size: {
          width: 512,
          height: 768
        },
        num_inference_steps: options.quality === 'high' ? 50 : options.quality === 'draft' ? 20 : 30,
        guidance_scale: 8.0,
        num_images: 1,
        seed: Math.floor(Math.random() * 1000000),
        enable_safety_checker: false,
        safety_tolerance: 2,
        scheduler: 'DPM++ 2M Karras',
        strength: 0.8 // High strength for clothing replacement
      };

      console.log('📤 [SEEDREAM-EDIT] Sending request to Seedream edit API...');
      console.log('🎯 [SEEDREAM-EDIT] Enhanced prompt:', tryOnPrompt.enhancedPrompt);

      const startTime = Date.now();

      // Use the existing proxy endpoint
      const response = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      console.log('📊 [SEEDREAM-EDIT] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [SEEDREAM-EDIT] API Error:', errorText);
        throw new Error(`Seedream edit API failed: ${response.status} - ${errorText}`);
      }

      const data: SeedreamEditResponse = await response.json();
      const processingTime = Date.now() - startTime;

      console.log('📊 [SEEDREAM-EDIT] Response structure:', Object.keys(data));

      // Extract image URL from response
      const imageUrl = data.images?.[0]?.url || (data as any).data?.images?.[0]?.url;

      if (!imageUrl) {
        console.error('❌ [SEEDREAM-EDIT] No image URL in response:', data);
        throw new Error('No image generated from Seedream edit');
      }

      console.log('✅ [SEEDREAM-EDIT] Successfully applied clothing to avatar');
      console.log(`⏱️ [SEEDREAM-EDIT] Processing time: ${processingTime}ms`);

      return {
        success: true,
        imageUrl: imageUrl,
        processingTime: processingTime / 1000,
        originalPrompt: clothingDescription,
        enhancedPrompt: tryOnPrompt.enhancedPrompt
      };

    } catch (error) {
      console.error('❌ [SEEDREAM-EDIT] Failed to apply clothing:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalPrompt: clothingDescription
      };
    }
  }

  /**
   * Generate optimized try-on prompt using LLM enhancement
   */
  private async generateTryOnPrompt(
    clothingDescription: string,
    options: Partial<TryOnPromptOptions>
  ): Promise<{ enhancedPrompt: string; negativePrompt: string }> {
    console.log('🧠 [SEEDREAM-EDIT] Generating optimized try-on prompt...');

    try {
      // Create a specialized prompt for try-on scenarios
      const tryOnRequest = `Transform this person to wear: ${clothingDescription}.
      Style: ${options.style || 'casual'}.
      ${options.preserveFeatures ? 'Preserve facial features and body proportions.' : ''}
      Create a natural, realistic appearance as if they are actually wearing this clothing.`;

      // Use the enhanced prompt generation service
      const enhancedResult = await enhancedPromptGenerationService.generateEnhancedPrompt({
        userRequest: tryOnRequest,
        style: options.style as any || 'casual',
        occasion: 'everyday'
      });

      // Customize the prompt for avatar try-on
      const tryOnSpecificPrompt = `person wearing ${clothingDescription}, ${enhancedResult.mainPrompt},
      natural pose, realistic clothing fit, proper proportions, high quality photograph, studio lighting`;

      // Enhanced negative prompt for try-on scenarios
      const tryOnNegativePrompt = `${enhancedResult.negativePrompt},
      floating clothes, disconnected clothing, unrealistic fit, wrong proportions,
      multiple people, nude, partial clothing, torn clothes, damaged garments,
      clothing clipping, unnatural pose, distorted body, missing body parts`;

      console.log('✅ [SEEDREAM-EDIT] Generated optimized try-on prompt');

      return {
        enhancedPrompt: tryOnSpecificPrompt,
        negativePrompt: tryOnNegativePrompt
      };

    } catch (error) {
      console.warn('⚠️ [SEEDREAM-EDIT] LLM enhancement failed, using basic prompt:', error);

      // Fallback to basic prompt
      return {
        enhancedPrompt: `person wearing ${clothingDescription}, realistic clothing, natural pose, high quality photograph`,
        negativePrompt: 'blurry, low quality, distorted, nude, partial clothing, floating clothes, unrealistic'
      };
    }
  }

  /**
   * Generate fallback edit for development mode
   */
  private async generateFallbackEdit(
    avatarImage: string,
    clothingDescription: string
  ): Promise<SeedreamEditResult> {
    console.log('🎭 [SEEDREAM-EDIT] Generating fallback edit (development mode)');
    console.log('👤 [SEEDREAM-EDIT] Avatar image type:', avatarImage.startsWith('data:') ? 'base64' : 'url');
    console.log('👕 [SEEDREAM-EDIT] Clothing description:', clothingDescription);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In development mode, return the avatar image with a note
    console.log('✅ [SEEDREAM-EDIT] Development fallback: Returning original avatar');
    console.log('💡 [SEEDREAM-EDIT] In production, this would show avatar wearing the clothing');

    return {
      success: true,
      imageUrl: avatarImage, // Return original avatar in development
      processingTime: 2.0,
      originalPrompt: clothingDescription,
      enhancedPrompt: `person wearing ${clothingDescription}, realistic clothing, high quality`
    };
  }

  /**
   * Batch apply multiple clothing items to avatar
   */
  async applyMultipleItems(
    avatarImage: string,
    clothingItems: string[],
    options: Partial<TryOnPromptOptions> = {}
  ): Promise<SeedreamEditResult[]> {
    console.log(`🔄 [SEEDREAM-EDIT] Applying ${clothingItems.length} clothing items...`);

    const results: SeedreamEditResult[] = [];

    for (let i = 0; i < clothingItems.length; i++) {
      const item = clothingItems[i];
      console.log(`📦 [SEEDREAM-EDIT] Processing item ${i + 1}/${clothingItems.length}: ${item}`);

      try {
        const result = await this.applyClothingToAvatar(avatarImage, item, options);
        results.push(result);

        // Use the result image as base for next item (layering effect)
        if (result.success && result.imageUrl) {
          avatarImage = result.imageUrl;
        }

        // Small delay to avoid rate limiting
        if (i < clothingItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ [SEEDREAM-EDIT] Failed to apply item ${i + 1}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          originalPrompt: item
        });
      }
    }

    console.log(`✅ [SEEDREAM-EDIT] Completed batch application: ${results.filter(r => r.success).length}/${results.length} successful`);
    return results;
  }

  /**
   * Get service information and capabilities
   */
  getServiceInfo() {
    return {
      modelId: this.modelId,
      version: 'Seedream v4 Edit',
      capabilities: {
        imageToImage: true,
        clothingApplication: true,
        strengthControl: true,
        llmOptimization: true,
        batchProcessing: true
      },
      features: [
        'Image-to-image clothing application',
        'LLM-optimized try-on prompts',
        'Realistic clothing fit',
        'Batch multiple items',
        'Quality level control',
        'Feature preservation options'
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
export const seedreamEditService = new SeedreamEditService();
export default seedreamEditService;