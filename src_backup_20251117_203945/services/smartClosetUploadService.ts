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
import { CapacitorHttp } from '@capacitor/core';

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
  private readonly API_BASE = import.meta.env.DEV 
    ? '/api/claude/v1/messages' 
    : 'https://api.anthropic.com/v1/messages';
  private readonly IS_DEV = import.meta.env.DEV;
  private readonly CLAUDE_KEY = import.meta.env.VITE_CLAUDE_API_KEY || 
                                  import.meta.env.VITE_ANTHROPIC_API_KEY;

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
      console.log('🔍 [SMART-UPLOAD] Scenario detected:', {
        type: scenario.type,
        hasPerson: scenario.hasPerson,
        itemCount: scenario.itemCount,
        confidence: scenario.confidence
      });

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
   * Manual cropping upload - Process user-defined crop regions
   */
  async uploadWithManualCropping(
    imageUrl: string,
    crops: Array<{ id: string; x: number; y: number; width: number; height: number; label: string }>,
    onProgress?: (message: string, current?: number, total?: number) => void
  ): Promise<UploadResult> {
    console.log(`✂️ [MANUAL-CROP] Processing ${crops.length} user-defined regions`);

    const items: DetectedItem[] = [];

    for (let i = 0; i < crops.length; i++) {
      const crop = crops[i];
      onProgress?.(`Processing ${crop.label}...`, i + 1, crops.length);

      try {
        // 1. Crop image to user-defined region
        console.log(`✂️ [MANUAL-CROP] Cropping region ${i + 1}/${crops.length}: ${crop.label}`);
        const croppedImageUrl = await this.cropImageToRegion(imageUrl, crop);

        // 2. Resize for optimal processing (1024px max)
        console.log(`📐 [MANUAL-CROP] Resizing image for processing`);
        const resizedImageUrl = await this.resizeForProcessing(croppedImageUrl, 1024);

        // 3. BiRefNet background removal
        console.log(`🎨 [MANUAL-CROP] Removing background for: ${crop.label}`);
        const bgRemoved = await birefnetBackgroundRemovalService.removeBackground(
          resizedImageUrl,
          {
            model: "General Use (Light)",
            operating_resolution: "2048x2048",
            refine_foreground: true,
            output_format: "png"
          }
        );

        if (!bgRemoved.success || !bgRemoved.imageUrl) {
          throw new Error('Background removal failed');
        }

        // 4. Claude categorization
        console.log(`👔 [MANUAL-CROP] Categorizing: ${crop.label}`);
        const category = await enhancedClothingCategorizationService.categorizeWithDetails(
          bgRemoved.imageUrl
        );

        // 5. Create item
        items.push({
          imageUrl: bgRemoved.imageUrl,
          name: crop.label || category.itemName || 'Clothing Item',
          category: category.category || 'Unknown',
          confidence: 0.95, // High confidence since user selected
          wasExtractedFromPerson: false,
          wasSeparated: true
        });

        console.log(`✅ [MANUAL-CROP] Item processed: ${crop.label}`);

      } catch (error) {
        console.error(`❌ [MANUAL-CROP] Failed to process crop ${crop.id}:`, error);
        // Continue with other crops rather than failing entirely
      }
    }

    console.log(`✅ [MANUAL-CROP] Completed processing ${items.length}/${crops.length} items`);

    return {
      success: items.length > 0,
      itemsAdded: items.length,
      items,
      scenario: 'multi-item'
    };
  }

  /**
   * Crop image to specific region
   */
  private async cropImageToRegion(
    imageUrl: string,
    crop: { x: number; y: number; width: number; height: number }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Set canvas size to crop dimensions
          canvas.width = crop.width;
          canvas.height = crop.height;

          // Draw cropped portion
          ctx.drawImage(
            img,
            crop.x, crop.y, crop.width, crop.height, // Source
            0, 0, crop.width, crop.height           // Destination
          );

          // Convert to data URL
          const croppedUrl = canvas.toDataURL('image/png');
          console.log(`✂️ [CROP] Cropped to ${crop.width}x${crop.height}`);
          resolve(croppedUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for cropping'));
      img.src = imageUrl;
    });
  }

  /**
   * Resize image for optimal processing
   */
  private async resizeForProcessing(imageUrl: string, maxDimension: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const resizedUrl = canvas.toDataURL('image/jpeg', 0.9);
          console.log(`📐 [RESIZE] ${img.width}x${img.height} → ${width}x${height}`);
          resolve(resizedUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for resizing'));
      img.src = imageUrl;
    });
  }

  /**
   * Detect what type of photo this is using Claude Vision
   * (Public method for use in cropping flow)
   */
  async detectScenario(imageUrl: string): Promise<ScenarioDetection> {
    console.log('🔍 [SCENARIO-DETECT] Analyzing photo type...');

    try {
      // Resize image to under 5MB for Claude API
      console.log('📐 [SCENARIO-DETECT] Resizing image for Claude API...');
      const resizedImage = await this.resizeForClaude(imageUrl);
      const base64Image = resizedImage.split(',')[1];
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add auth headers for direct API calls (production/iOS)
      if (!this.IS_DEV) {
        if (this.CLAUDE_KEY) {
          headers['x-api-key'] = this.CLAUDE_KEY;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          console.error('❌ [SCENARIO-DETECT] No Claude API key found for production mode');
          throw new Error('Claude API key not configured');
        }
      }

      console.log('🔑 [SCENARIO-DETECT] Using', this.IS_DEV ? 'proxy' : 'native HTTP (bypasses CORS)');
      
      const requestBody = {
        model: 'claude-haiku-4-5',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            },
            {
              type: 'text',
              text: `Analyze this clothing photo carefully:

CRITICAL RULES FOR CLASSIFICATION:
1. If you see ONE clothing item (even if complex) → return "single-item"
   - Examples: one dress, one jacket, one two-piece outfit, one garment set
   - Ignore shadows, reflections, wrinkles, or folds that might look like separate items
   
2. Only return "multi-item" if you see 2+ CLEARLY SEPARATE garments
   - Example MULTI: shirt AND pants laid out separately
   - Example MULTI: multiple items on hangers
   - Example SINGLE: one two-piece dress (still one item)
   - Example SINGLE: one jacket with belt attached
   
3. If ANY person is visible wearing clothes → return "person-wearing"

SCENARIO TYPES:
1. PERSON-WEARING: A person/model is wearing clothing items
   - Includes full body shots, upper body shots, fashion photos
   - Person is the main subject wearing the clothes
   - Could be wearing one or multiple garments (shirt, pants, dress, skirt, etc.)
   
2. MULTI-ITEM: Multiple SEPARATE clothing items WITHOUT a person
   - Flat-lay photos with 2+ distinct items
   - Multiple outfits laid out separately
   - 2+ items hung on different hangers
   - Must be clearly separate individual garments
   
3. SINGLE-ITEM: One clothing item WITHOUT a person
   - Single shirt on hanger
   - One dress on mannequin (even if two-piece)
   - Close-up of one garment
   - One outfit set (counts as single item)

IMPORTANT:
- Be STRICT about multi-item: requires 2+ clearly separate garments
- When in doubt between single and multi → choose "single-item"
- Ignore background elements, shadows, and reflections
- For person-wearing scenarios, count ALL visible garments (top, bottom, dress, jacket, etc.)

Return ONLY valid JSON:
{
  "type": "person-wearing" | "multi-item" | "single-item",
  "hasPerson": true/false,
  "itemCount": number (count of distinct separate garments - be conservative),
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of why you chose this classification"
}`
            }
          ]
        }]
      };

      let result;
      
      // Use native HTTP on iOS/production to bypass CORS
      if (!this.IS_DEV) {
        console.log('📱 [SCENARIO-DETECT] Using Capacitor native HTTP');
        const response = await CapacitorHttp.post({
          url: this.API_BASE,
          headers,
          data: requestBody
        });

        if (response.status !== 200) {
          throw new Error(`Claude API error: ${response.status}`);
        }

        result = response.data;
      } else {
        // Use regular fetch in development (uses proxy)
        const response = await fetch(this.API_BASE, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`Claude API error: ${response.status}`);
        }

        result = await response.json();
      }
      const content = result.content?.[0]?.text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ [SCENARIO-DETECT] Result:', {
        type: parsed.type,
        hasPerson: parsed.hasPerson,
        itemCount: parsed.itemCount,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning
      });

      let finalType = parsed.type || 'single-item';
      
      // Safety check: If Claude says multi-item but only detected 1 item, treat as single
      if (finalType === 'multi-item' && parsed.itemCount <= 1) {
        console.warn('⚠️ [SCENARIO-DETECT] Multi-item detected but itemCount is 1, treating as single-item');
        console.warn('   Reasoning:', parsed.reasoning);
        finalType = 'single-item';
      }
      
      // Safety check: If low confidence on multi-item, default to single-item
      if (finalType === 'multi-item' && (parsed.confidence < 0.6 || !parsed.confidence)) {
        console.warn('⚠️ [SCENARIO-DETECT] Low confidence multi-item (', parsed.confidence, '), treating as single-item');
        console.warn('   Reasoning:', parsed.reasoning);
        finalType = 'single-item';
      }

      return {
        type: finalType,
        hasPerson: parsed.hasPerson || false,
        itemCount: parsed.itemCount || 1,
        confidence: parsed.confidence || 0.5
      };

    } catch (error) {
      console.error('❌ [SCENARIO-DETECT] Detection failed');
      console.error('Error type:', typeof error);
      console.error('Error instanceof Error:', error instanceof Error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
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
      onProgress?.('Extracting clothing from person...');
      const extraction = await garmentExtractionService.extractGarment(imageUrl);
      
      if (!extraction.success || !extraction.extractedImageUrl) {
        console.error('❌ [PERSON-WEARING] Extraction failed:', extraction.error);
        throw new Error(extraction.error || 'Failed to extract garments from person');
      }

      console.log('✅ [PERSON-WEARING] Garment extracted successfully');

      // Step 2: Check if multiple items visible on extracted garment
      onProgress?.('Checking for multiple garments...');
      const multiCheck = await closetMultiGarmentSeparationService.separateGarments(
        extraction.extractedImageUrl
      );

      if (multiCheck.success && multiCheck.hasMultipleItems && multiCheck.items.length > 1) {
        console.log(`📦 [PERSON-WEARING] Multiple items detected: ${multiCheck.items.length}`);
        console.log(`📦 [PERSON-WEARING] Items:`, multiCheck.items.map(i => ({
          name: i.categorization.itemName,
          category: i.categorization.category
        })));
        onProgress?.(`Found ${multiCheck.items.length} items! Removing backgrounds...`);
        
        return {
          success: true,
          itemsAdded: multiCheck.items.length,
          items: multiCheck.items.map(item => ({
            imageUrl: item.cleanedImageUrl,
            name: item.categorization.itemName || 'Clothing Item',
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
      const categorization = await enhancedClothingCategorizationService.categorizeWithDetails(
        extraction.extractedImageUrl
      );

      console.log('🔄 [PERSON-WEARING] Full imageUrl:', extraction.extractedImageUrl);
      console.log('🔍 [PERSON-WEARING] URL length:', extraction.extractedImageUrl?.length);
      console.log('🔍 [PERSON-WEARING] URL ends with:', extraction.extractedImageUrl?.slice(-30));

      return {
        success: true,
        itemsAdded: 1,
        items: [{
          imageUrl: extraction.extractedImageUrl,
          name: categorization.itemName || 'Clothing Item',
          category: categorization.category || 'other',
          confidence: categorization.confidence || 0.7,
          wasExtractedFromPerson: true
        }],
        scenario: 'person-wearing'
      };

    } catch (error) {
      console.error('❌ [PERSON-WEARING] Processing failed:', error);
      onProgress?.('❌ Failed to extract garments from person');
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
          name: item.categorization.itemName || 'Clothing Item',
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
      const categorization = await enhancedClothingCategorizationService.categorizeWithDetails(
        cleaned.imageUrl
      );

      console.log('✅ [SINGLE-ITEM] Item processed successfully');

      return {
        success: true,
        itemsAdded: 1,
        items: [{
          imageUrl: cleaned.imageUrl,
          name: categorization.itemName || 'Clothing Item',
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
   * Resize image to under 5MB for Claude API
   * Uses iterative compression to stay under limit
   */
  private async resizeForClaude(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Max 1024px on longest side
        let width = img.width;
        let height = img.height;
        const maxDimension = 1024;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with 85% quality (good balance)
        const resized = canvas.toDataURL('image/jpeg', 0.85);
        
        const estimatedMB = (resized.length * 0.75) / 1024 / 1024;
        console.log(`✅ [RESIZE] Resized to ${width}x${height}, ~${estimatedMB.toFixed(2)}MB`);
        
        resolve(resized);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
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
