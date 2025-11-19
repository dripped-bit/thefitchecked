/**
 * Qwen Image Edit Service
 * Remove unwanted elements (people, objects) from images
 */

import apiConfig from '../config/apiConfig';

export interface QwenRemoveOptions {
  prompt?: string;
  guidance_scale?: number;
  num_inference_steps?: number;
  output_format?: 'png' | 'jpeg' | 'webp';
  sync_mode?: boolean;
}

export interface QwenRemoveResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  processingTime?: number;
}

class QwenImageEditService {
  private readonly API_BASE = import.meta.env.DEV ? '/api/fal' : 'https://fal.run';

  /**
   * Remove specified elements from image
   */
  async removeElement(
    imageUrl: string,
    options: QwenRemoveOptions = {}
  ): Promise<QwenRemoveResult> {
    const startTime = Date.now();
    
    console.log('🎨 [QWEN] Starting element removal');
    console.log('📝 [QWEN] Prompt:', options.prompt || 'Remove the person from the image');

    try {
      const config = {
        image_urls: [imageUrl],
        prompt: options.prompt || "Remove the person from the image",
        guidance_scale: options.guidance_scale || 1,
        num_inference_steps: options.num_inference_steps || 6,
        output_format: options.output_format || "png",
        sync_mode: options.sync_mode || false,
        enable_safety_checker: true
      };

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add authorization for direct API calls (production/iOS)
      if (!import.meta.env.DEV) {
        const falKey = import.meta.env.VITE_FAL_KEY;
        if (falKey) {
          headers['Authorization'] = `Key ${falKey}`;
        } else {
          throw new Error('FAL API key not configured');
        }
      }

      console.log('🚀 [QWEN] Calling Qwen Image Edit API');

      const response = await fetch(
        `${this.API_BASE}/fal-ai/qwen-image-edit-plus-lora-gallery/remove-element`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(config)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.images || !result.images[0] || !result.images[0].url) {
        throw new Error('No image returned from Qwen API');
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ [QWEN] Element removal complete in ${processingTime}ms`);
      console.log('🖼️ [QWEN] Result image:', result.images[0].url.substring(0, 80) + '...');

      return {
        success: true,
        imageUrl: result.images[0].url,
        processingTime
      };

    } catch (error) {
      console.error('❌ [QWEN] Element removal failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }
}

export const qwenImageEditService = new QwenImageEditService();
