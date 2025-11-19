/**
 * Replicate Clothing Segmentation Service
 * Uses naklecha/clothing-segmentation to extract garments from person
 */

import { CapacitorHttp } from '@capacitor/core';

export interface ClothingSegmentationResult {
  success: boolean;
  imageUrl?: string;
  maskUrl?: string;
  maskedImageUrl?: string; // Clothing only - person removed!
  error?: string;
  processingTime?: number;
}

class ReplicateClothingSegmentationService {
  private readonly API_BASE = 'https://api.replicate.com/v1/predictions';
  private readonly MODEL_VERSION = '501aa8488496fffc6bbee9544729dc28654649f2e3c80de0bf08fb9fe71898f8';

  /**
   * Segment clothing and extract garment (removes person)
   */
  async segmentClothing(
    imageUrl: string,
    clothingType: 'topwear' | 'bottomwear' = 'topwear'
  ): Promise<ClothingSegmentationResult> {
    const startTime = Date.now();
    
    console.log('👕 [CLOTHING-SEG] Starting clothing segmentation');
    console.log('📝 [CLOTHING-SEG] Type:', clothingType);

    try {
      const replicateKey = import.meta.env.VITE_REPLICATE_API_KEY;
      if (!replicateKey) {
        throw new Error('Replicate API key not configured');
      }

      console.log('🔑 [CLOTHING-SEG] Using native HTTP (bypasses CORS)');

      const requestBody = {
        version: this.MODEL_VERSION,
        input: {
          image: imageUrl,
          clothing: clothingType
        }
      };

      // Create prediction
      console.log('📱 [CLOTHING-SEG] Creating prediction with Capacitor native HTTP');
      const createResponse = await CapacitorHttp.post({
        url: this.API_BASE,
        headers: {
          'Authorization': `Bearer ${replicateKey}`,
          'Content-Type': 'application/json'
        },
        data: requestBody
      });

      // Accept 200, 201, or 202 status codes
      if (createResponse.status !== 200 && createResponse.status !== 201 && createResponse.status !== 202) {
        const errorText = typeof createResponse.data === 'string' 
          ? createResponse.data 
          : JSON.stringify(createResponse.data);
        throw new Error(`Replicate API error: ${createResponse.status} - ${errorText}`);
      }

      let result = createResponse.data;
      
      // If prediction is still processing, poll for completion
      if (result.status === 'starting' || result.status === 'processing') {
        console.log('⏳ [CLOTHING-SEG] Prediction processing, polling for completion...');
        result = await this.pollPrediction(result.urls.get, replicateKey);
      }
      
      // Check final status
      if (result.status === 'failed') {
        throw new Error(result.error || 'Prediction failed');
      }

      if (result.status !== 'succeeded') {
        throw new Error(`Unexpected prediction status: ${result.status}`);
      }

      // Output array: [image.png, mask.png, masked_img.png]
      if (!result.output || result.output.length < 3) {
        throw new Error('Incomplete output from segmentation');
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ [CLOTHING-SEG] Segmentation complete in ${processingTime}ms`);
      console.log('📊 [CLOTHING-SEG] Output array length:', result.output.length);
      console.log('🖼️ [CLOTHING-SEG] Output[0] (original):', result.output[0]);
      console.log('🖼️ [CLOTHING-SEG] Output[1] (mask):', result.output[1]);
      console.log('🖼️ [CLOTHING-SEG] Output[2] (masked):', result.output[2]);
      console.log('🔍 [CLOTHING-SEG] Masked URL length:', result.output[2].length);

      return {
        success: true,
        imageUrl: result.output[0],
        maskUrl: result.output[1],
        maskedImageUrl: result.output[2], // Clothing only - PERSON REMOVED!
        processingTime
      };

    } catch (error) {
      console.error('❌ [CLOTHING-SEG] Segmentation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Poll prediction URL until completion
   */
  private async pollPrediction(
    predictionUrl: string,
    apiKey: string,
    maxAttempts: number = 60,
    delayMs: number = 1000
  ): Promise<any> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`🔄 [CLOTHING-SEG] Polling attempt ${attempt + 1}/${maxAttempts}`);
      
      // Wait before polling (except first attempt)
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      const response = await CapacitorHttp.get({
        url: predictionUrl,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status !== 200) {
        throw new Error(`Poll failed: ${response.status}`);
      }

      const result = response.data;

      // Check if completed
      if (result.status === 'succeeded' || result.status === 'failed' || result.status === 'canceled') {
        console.log(`✅ [CLOTHING-SEG] Prediction status: ${result.status}`);
        return result;
      }

      console.log(`⏳ [CLOTHING-SEG] Status: ${result.status}, waiting...`);
    }

    throw new Error('Prediction timed out after maximum polling attempts');
  }

  /**
   * Determine clothing type from garment detection
   */
  determineClothingType(garmentType?: string): 'topwear' | 'bottomwear' {
    if (!garmentType) return 'topwear';
    
    const lowerGarments = ['pants', 'skirt', 'shorts', 'jeans', 'trousers'];
    const garmentLower = garmentType.toLowerCase();
    
    return lowerGarments.some(g => garmentLower.includes(g)) ? 'bottomwear' : 'topwear';
  }
}

export const replicateClothingSegmentationService = new ReplicateClothingSegmentationService();
