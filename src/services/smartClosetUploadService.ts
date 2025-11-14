/**
 * Smart Closet Upload Service
 * Intelligent photo upload pipeline that handles:
 * 1. Person wearing clothes → Extract garments (remove person)
 * 2. Multiple items (flat-lay/outfit) → Separate into individual items
 * 3. Single item → Simple background removal
 * 
 * Orchestrates: garmentExtractionService, closetMultiGarmentSeparationService,
 * birefnetBackgroundRemovalService, enhancedClothingCategorizationService
 */

import garmentExtractionService from './garmentExtractionService';
import closetMultiGarmentSeparationService from './closetMultiGarmentSeparationService';
import birefnetBackgroundRemovalService from './birefnetBackgroundRemovalService';
import enhancedClothingCategorizationService from './enhancedClothingCategorizationService';
import apiConfig from '../config/apiConfig';

export interface DetectedItem {
  imageUrl: string;
  name: string;
  category: string;
  confidence: number;
  wasExtractedFromPerson?: boolean;
  wasSeparated?: boolean;
  originalBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface UploadResult {
  success: boolean;
  itemsAdded: number;
  items: DetectedItem[];
  scenario?: 'person-wearing' | 'multi-item' | 'single-item';
  error?: string;
}

interface ScenarioDetection {
  type: 'person-wearing' | 'multi-item' | 'single-item';
  hasPerson: boolean;
  itemCount: number;
  confidence: number;
}

class SmartClosetUploadService {
  private readonly API_BASE = apiConfig.getEndpoint('/api/claude/v1/messages');

  /**
   * Main entry point - intelligent photo upload
   */
  async processUpload(
    imageUrl: string,
    onProgress?: (message: string) => void
  ): Promise<UploadResult> {
    console.log('🎯 [SMART-UPLOAD] Starting intelligent upload pipeline');
    
    try {
      // Step 1: Detect scenario
      onProgress?.('Analyzing photo...');
      const scenario = await this.detectScenario(imageUrl);
      console.log('🔍 [SMART-UPLOAD] Scenario detected:', scenario.type);

      // Step 2: Process based on scenario
      switch (scenario.type) {
        case 'person-wearing':
          onProgress?.('Detecting person and garments...');
          return await this.handlePersonWearing(imageUrl, onProgress);
          
        case 'multi-item':
          onProgress?.('Detecting multiple items...');
          return await this.handleMultipleItems(imageUrl, onProgress);
          
        case 'single-item':
          onProgress?.('Processing item...');
          return await this.handleSingleItem(imageUrl, onProgress);
          
        default:
          throw new Error('Unknown scenario type');
      }
      
    } catch (error) {
      console.error('❌ [SMART-UPLOAD] Upload failed:', error);
      
      // Fallback: Try simple single-item processing
      console.log('🔄 [SMART-UPLOAD] Attempting fallback processing...');
      try {
        onProgress?.('Processing with fallback method...');
        return await this.handleSingleItem(imageUrl, onProgress);
      } catch (fallbackError) {
        return {
          success: false,
          itemsAdded: 0,
          items: [],
          error: error instanceof Error ? error.message : 'Upload failed'
        };
      }
    }
  }

  /**
   * Detect what type of photo this is using Claude Vision
   */
  private async detectScenario(imageUrl: string): Promise<ScenarioDetection> {
    console.log('🔍 [SCENARIO-DETECT] Analyzing photo type...');

    try {
      const base64Image = await this.imageToBase64(imageUrl);
      
      const response = await fetch(this.API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: `Analyze this clothing photo and determine the scenario:

1. PERSON WEARING CLOTHES: Photo shows a person/model wearing clothing items
2. MULTIPLE ITEMS: Photo shows multiple clothing items laid out (flat-lay) or multiple items without a person
3. SINGLE ITEM: Photo shows only one clothing item

Return ONLY valid JSON:
{
  "type": "person-wearing" | "multi-item" | "single-item",
  "hasPerson": true/false,
  "itemCount": number (estimate of clothing items visible),
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.content?.[0]?.text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ [SCENARIO-DETECT] Result:', parsed);

      return {
        type: parsed.type || 'single-item',
        hasPerson: parsed.hasPerson || false,
        itemCount: parsed.itemCount || 1,
        confidence: parsed.confidence || 0.5
      };

    } catch (error) {
      console.error('❌ [SCENARIO-DETECT] Detection failed:', error);
      // Default to single-item on failure
      return {
        type: 'single-item',
        hasPerson: false,
        itemCount: 1,
        confidence: 0.3
      };
    }
  }

  /**
   * Handle person wearing clothes - extract garments from person
   */
  private async handlePersonWearing(
    imageUrl: string,
    onProgress?: (message: string) => void
  ): Promise<UploadResult> {
    console.log('👤 [PERSON-WEARING] Extracting garments from person...');
    
    try {
      // Step 1: Extract garment from person (removes person body)
      onProgress?.('Extracting clothing from photo...');
      const extraction = await garmentExtractionService.extractGarment(imageUrl);
      
      if (!extraction.success || !extraction.extractedImageUrl) {
        throw new Error('Garment extraction failed');
      }

      console.log('✅ [PERSON-WEARING] Garment extracted successfully');

      // Step 2: Check if multiple items visible on extracted garment
      onProgress?.('Checking for multiple items...');
      const multiCheck = await closetMultiGarmentSeparationService.separateGarments(
        extraction.extractedImageUrl
      );

      if (multiCheck.success && multiCheck.hasMultipleItems && multiCheck.items.length > 1) {
        console.log(`📦 [PERSON-WEARING] Multiple items detected: ${multiCheck.items.length}`);
        onProgress?.(`Found ${multiCheck.items.length} items! Separating...`);
        
        return {
          success: true,
          itemsAdded: multiCheck.items.length,
          items: multiCheck.items.map(item => ({
            imageUrl: item.cleanedImageUrl,
            name: item.categorization.suggestedName || 'Clothing Item',
            category: item.categorization.category || 'other',
            confidence: item.categorization.confidence || 0.7,
            wasExtractedFromPerson: true,
            wasSeparated: true,
            originalBoundingBox: item.originalBoundingBox
          })),
          scenario: 'person-wearing'
        };
      }

      // Step 3: Single item - categorize
      onProgress?.('Categorizing item...');
      const categorization = await enhancedClothingCategorizationService.categorize(
        extraction.extractedImageUrl
      );

      return {
        success: true,
        itemsAdded: 1,
        items: [{
          imageUrl: extraction.extractedImageUrl,
          name: categorization.suggestedName || 'Clothing Item',
          category: categorization.category || 'other',
          confidence: categorization.confidence || 0.7,
          wasExtractedFromPerson: true
        }],
        scenario: 'person-wearing'
      };

    } catch (error) {
      console.error('❌ [PERSON-WEARING] Processing failed:', error);
      throw error;
    }
  }

  /**
   * Handle multiple items (flat-lay or outfit photo)
   */
  private async handleMultipleItems(
    imageUrl: string,
    onProgress?: (message: string) => void
  ): Promise<UploadResult> {
    console.log('📦 [MULTI-ITEM] Processing multiple items...');

    try {
      // Use multi-garment separation service
      onProgress?.('Detecting and separating items...');
      const separation = await closetMultiGarmentSeparationService.separateGarments(imageUrl);

      if (!separation.success || separation.items.length === 0) {
        console.warn('⚠️ [MULTI-ITEM] No items separated, falling back to single item');
        return await this.handleSingleItem(imageUrl, onProgress);
      }

      console.log(`✅ [MULTI-ITEM] Separated ${separation.items.length} items`);
      onProgress?.(`Found ${separation.items.length} items!`);

      // Process each item in parallel
      onProgress?.('Removing backgrounds...');
      
      return {
        success: true,
        itemsAdded: separation.items.length,
        items: separation.items.map(item => ({
          imageUrl: item.cleanedImageUrl,
          name: item.categorization.suggestedName || 'Clothing Item',
          category: item.categorization.category || 'other',
          confidence: item.categorization.confidence || 0.7,
          wasSeparated: true,
          originalBoundingBox: item.originalBoundingBox
        })),
        scenario: 'multi-item'
      };

    } catch (error) {
      console.error('❌ [MULTI-ITEM] Processing failed:', error);
      throw error;
    }
  }

  /**
   * Handle single item (simple case)
   */
  private async handleSingleItem(
    imageUrl: string,
    onProgress?: (message: string) => void
  ): Promise<UploadResult> {
    console.log('🎯 [SINGLE-ITEM] Processing single item...');

    try {
      // Step 1: Remove background
      onProgress?.('Removing background...');
      const cleaned = await birefnetBackgroundRemovalService.removeBackground(imageUrl, {
        model: "General Use (Light)",
        operating_resolution: "2048x2048",
        refine_foreground: true,
        output_format: "png"
      });

      if (!cleaned.success || !cleaned.imageUrl) {
        throw new Error('Background removal failed');
      }

      // Step 2: Categorize
      onProgress?.('Categorizing item...');
      const categorization = await enhancedClothingCategorizationService.categorize(
        cleaned.imageUrl
      );

      console.log('✅ [SINGLE-ITEM] Item processed successfully');

      return {
        success: true,
        itemsAdded: 1,
        items: [{
          imageUrl: cleaned.imageUrl,
          name: categorization.suggestedName || 'Clothing Item',
          category: categorization.category || 'other',
          confidence: categorization.confidence || 0.7
        }],
        scenario: 'single-item'
      };

    } catch (error) {
      console.error('❌ [SINGLE-ITEM] Processing failed:', error);
      throw error;
    }
  }

  /**
   * Convert image to base64 for Claude API
   */
  private async imageToBase64(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Could not get canvas context');
          }

          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.split(',')[1];
          resolve(base64Data);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for base64 conversion'));
      };

      img.src = imageUrl;
    });
  }
}

// Export singleton instance
export const smartClosetUploadService = new SmartClosetUploadService();
export default smartClosetUploadService;
