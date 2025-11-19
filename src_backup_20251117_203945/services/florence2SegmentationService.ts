/**
 * Florence-2 Referring Expression Segmentation Service
 * Uses fal.ai Florence-2 to segment clothing items from images
 */

import apiConfig from '../config/apiConfig';

export interface Florence2SegmentationResult {
  success: boolean;
  segmentedImageUrl?: string;
  polygons?: any[];
  error?: string;
  processingTime?: number;
}

class Florence2SegmentationService {
  private readonly API_BASE = apiConfig.getBaseUrl();
  private readonly MODEL_ID = 'fal-ai/florence-2-large/referring-expression-segmentation';

  /**
   * Segment clothing from image using text prompt
   */
  async segmentClothing(
    imageUrl: string,
    garmentType?: string
  ): Promise<Florence2SegmentationResult> {
    const startTime = Date.now();
    
    // Generate text prompt based on garment type
    const textPrompt = this.generateSegmentationPrompt(garmentType);
    
    console.log('🎯 [FLORENCE-2] Starting referring expression segmentation');
    console.log('📝 [FLORENCE-2] Text prompt:', textPrompt);

    try {
      const falKey = import.meta.env.VITE_FAL_KEY;
      if (!falKey) {
        throw new Error('FAL API key not configured');
      }

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add authorization for direct API calls (production/iOS)
      if (!import.meta.env.DEV) {
        headers['Authorization'] = `Key ${falKey}`;
        console.log('🔑 [FLORENCE-2] Using direct fal.ai with auth');
      } else {
        console.log('🔑 [FLORENCE-2] Using dev proxy');
      }

      // Call fal.ai API endpoint through backend proxy
      // Dev: proxy at /api/fal/fal-ai/florence-2-large/referring-expression-segmentation
      // Prod: direct at https://thefitchecked.com/api/fal/fal-ai/florence-2-large/referring-expression-segmentation
      const endpoint = `${this.API_BASE}/api/fal/${this.MODEL_ID}`;
      console.log('🔗 [FLORENCE-2] Endpoint:', endpoint);

      const requestBody = {
        image_url: imageUrl,
        text_input: textPrompt
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Florence-2 API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.image) {
        throw new Error('No segmented image returned');
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ [FLORENCE-2] Segmentation complete in ${processingTime}ms`);
      console.log('🖼️ [FLORENCE-2] Segmented image URL:', result.image.url);
      console.log('📊 [FLORENCE-2] Polygons found:', result.results?.polygons?.length || 0);

      return {
        success: true,
        segmentedImageUrl: result.image.url,
        polygons: result.results?.polygons || [],
        processingTime
      };

    } catch (error) {
      console.error('❌ [FLORENCE-2] Segmentation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Generate text prompt for segmentation
   */
  private generateSegmentationPrompt(garmentType?: string): string {
    if (!garmentType) {
      // Default: most explicit prompt
      return 'the garment being worn';
    }
    
    const garmentLower = garmentType.toLowerCase();
    
    // Specific garment types
    if (garmentLower.includes('dress')) return 'the dress';
    if (garmentLower.includes('top') || garmentLower.includes('shirt') || garmentLower.includes('blouse')) return 'the top';
    if (garmentLower.includes('pants') || garmentLower.includes('trousers') || garmentLower.includes('jeans')) return 'the pants';
    if (garmentLower.includes('skirt')) return 'the skirt';
    if (garmentLower.includes('jacket') || garmentLower.includes('coat')) return 'the jacket';
    if (garmentLower.includes('sweater') || garmentLower.includes('hoodie')) return 'the sweater';
    
    // Multi-item detection (if we detect multiple garments in future)
    if (garmentLower.includes('outfit') || garmentLower.includes('multiple')) {
      return 'all clothing items';
    }
    
    // Fallback: use general clothing prompt
    return 'the clothing';
  }
}

export const florence2SegmentationService = new Florence2SegmentationService();
