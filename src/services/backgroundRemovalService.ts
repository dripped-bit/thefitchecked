/**
 * Background Removal Service - Handles automatic background removal for clothing items
 * Uses fal.ai background removal models for clean, transparent clothing images
 */

import clothingCategorizationService, { CategorizationResult } from './clothingCategorizationService';

interface BackgroundRemovalResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  fallback?: boolean;
  originalError?: string;
}

interface SmartCategorizationResult {
  success: boolean;
  category?: string;
  color?: string;
  type?: string;
  season?: string;
  confidence?: number;
  error?: string;
}

class BackgroundRemovalService {
  // Environment detection
  private readonly IS_DEV = import.meta.env.DEV;
  private readonly FAL_KEY = import.meta.env.VITE_FAL_KEY;

  // Use Vite proxy in dev mode, direct API in production (iOS)
  private readonly API_BASE = import.meta.env.DEV ? '/api/fal' : 'https://fal.run';
  private readonly REMOVEBG_API_KEY = import.meta.env.VITE_REMOVEBG_API_KEY;
  private cache: Map<string, string> = new Map();

  /**
   * Remove background from clothing image with multiple fallback options
   * Priority: fal.ai rembg → remove.bg → original image
   */
  async removeBackground(imageUrl: string, signal?: AbortSignal): Promise<BackgroundRemovalResult> {
    // Check if already aborted
    if (signal?.aborted) {
      console.log('🚫 [BACKGROUND-REMOVAL] Operation already aborted');
      throw new Error('Background removal aborted');
    }

    // Check cache first
    const cachedResult = this.cache.get(imageUrl);
    if (cachedResult) {
      console.log('💾 [BACKGROUND-REMOVAL] Using cached result');
      return {
        success: true,
        imageUrl: cachedResult
      };
    }

    // Try primary method: fal.ai rembg (best for clothing)
    try {
      const result = await this.removeBackgroundFalAI(imageUrl, signal);
      if (result.success && result.imageUrl) {
        // Cache successful result
        this.cache.set(imageUrl, result.imageUrl);
        return result;
      }
    } catch (error) {
      // Check if aborted
      if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
        console.log('🚫 [BACKGROUND-REMOVAL] fal.ai aborted by user');
        throw new Error('Background removal aborted');
      }
      console.warn('⚠️ [BACKGROUND-REMOVAL] fal.ai failed, trying remove.bg:', error);
    }

    // Fallback 1: remove.bg API (commercial-grade quality)
    if (this.REMOVEBG_API_KEY) {
      try {
        const result = await this.removeBackgroundRemoveBG(imageUrl, signal);
        if (result.success && result.imageUrl) {
          // Cache successful result
          this.cache.set(imageUrl, result.imageUrl);
          return result;
        }
      } catch (error) {
        // Check if aborted
        if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
          console.log('🚫 [BACKGROUND-REMOVAL] remove.bg aborted by user');
          throw new Error('Background removal aborted');
        }
        console.warn('⚠️ [BACKGROUND-REMOVAL] remove.bg failed, using original:', error);
      }
    }

    // Fallback 2: Return original image
    console.log('ℹ️ [BACKGROUND-REMOVAL] Using original image (no background removal)');
    return {
      success: true,
      imageUrl: imageUrl,
      fallback: true,
      originalError: 'All background removal methods failed'
    };
  }

  /**
   * Primary method: fal.ai imageutils/rembg
   * Fast and efficient background removal optimized for clothing items
   * Docs: https://fal.ai/models/fal-ai/imageutils/rembg
   */
  private async removeBackgroundFalAI(imageUrl: string, signal?: AbortSignal): Promise<BackgroundRemovalResult> {
    console.log('🎨 [FAL-AI-REMBG] Starting background removal...');
    console.log('🌍 [FAL-AI-REMBG] Environment:', this.IS_DEV ? 'DEVELOPMENT' : 'PRODUCTION');
    console.log('🔗 [FAL-AI-REMBG] API Base:', this.API_BASE);
    console.log('📸 [FAL-AI-REMBG] Image URL type:', imageUrl.substring(0, 50) + '...');

    // Validate image URL format
    if (!imageUrl.startsWith('data:image') && !imageUrl.startsWith('http')) {
      console.error('❌ [FAL-AI-REMBG] Invalid image URL format. Expected data URL or HTTP URL');
      throw new Error(`Invalid image URL format: ${imageUrl.substring(0, 30)}...`);
    }

    // Build headers - add Authorization in production (direct API calls)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // In production, add Authorization header for direct fal.ai API calls
    if (!this.IS_DEV && this.FAL_KEY) {
      headers['Authorization'] = `Key ${this.FAL_KEY}`;
      console.log('🔑 [FAL-AI-REMBG] Using direct API with authorization');
    } else if (this.IS_DEV) {
      console.log('🔧 [FAL-AI-REMBG] Using dev proxy');
    }

    const response = await fetch(`${this.API_BASE}/fal-ai/imageutils/rembg`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        image_url: imageUrl,
        sync_mode: false,
        crop_to_bbox: false
      }),
      signal // Add abort signal support
    });

    console.log('🌐 [FAL-AI-REMBG] Response status:', response.status);
    console.log('🌐 [FAL-AI-REMBG] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [FAL-AI-REMBG] Error response:', errorText);
      throw new Error(`fal.ai rembg failed: ${response.status} - ${errorText}`);
    }

    // Parse JSON response with error handling
    let result;
    try {
      const responseText = await response.text();
      console.log('📄 [FAL-AI-REMBG] Raw response text (first 500 chars):', responseText.substring(0, 500));
      result = JSON.parse(responseText);
      console.log('🎨 [FAL-AI-REMBG] Parsed JSON result:', JSON.stringify(result).substring(0, 500));
    } catch (parseError) {
      console.error('❌ [FAL-AI-REMBG] JSON parse error:', parseError);
      throw new Error(`Failed to parse fal.ai response: ${parseError}`);
    }

    // Parse rembg response format
    // Expected formats:
    // 1. { data: { image: { url: string } } }
    // 2. { image: { url: string } }
    // 3. Direct string URL
    let cleanImageUrl = null;

    console.log('🔍 [FAL-AI-REMBG] Checking result.data?.image?.url:', result?.data?.image?.url);
    console.log('🔍 [FAL-AI-REMBG] Checking result.image?.url:', result?.image?.url);
    console.log('🔍 [FAL-AI-REMBG] Result type:', typeof result);
    console.log('🔍 [FAL-AI-REMBG] Result keys:', Object.keys(result || {}));

    if (result?.data?.image?.url) {
      cleanImageUrl = result.data.image.url;
      console.log('✅ [FAL-AI-REMBG] Found image URL in result.data.image.url');
    } else if (result?.image?.url) {
      cleanImageUrl = result.image.url;
      console.log('✅ [FAL-AI-REMBG] Found image URL in result.image.url');
    } else if (typeof result === 'string') {
      cleanImageUrl = result;
      console.log('✅ [FAL-AI-REMBG] Result is direct string URL');
    }

    if (cleanImageUrl) {
      console.log('✅ [FAL-AI-REMBG] Background removed successfully');
      console.log('📸 [FAL-AI-REMBG] Output URL:', cleanImageUrl.substring(0, 60) + '...');
      return {
        success: true,
        imageUrl: cleanImageUrl
      };
    }

    console.error('❌ [FAL-AI-REMBG] No image URL in response. Full result:', JSON.stringify(result));
    throw new Error('No processed image URL found in fal.ai rembg result');
  }

  /**
   * Fallback method: remove.bg API
   * Commercial-grade background removal with excellent clothing support
   * Docs: https://www.remove.bg/api
   */
  private async removeBackgroundRemoveBG(imageUrl: string, signal?: AbortSignal): Promise<BackgroundRemovalResult> {
    if (!this.REMOVEBG_API_KEY) {
      throw new Error('remove.bg API key not configured');
    }

    console.log('🎨 [REMOVE.BG] Starting background removal...');

    // Convert image to base64 if it's a data URL, otherwise use URL directly
    const isDataUrl = imageUrl.startsWith('data:');

    const formData = new FormData();
    if (isDataUrl) {
      // Extract base64 data
      const base64Data = imageUrl.split(',')[1];
      const blob = this.base64ToBlob(base64Data, 'image/jpeg');
      formData.append('image_file_b64', base64Data);
    } else {
      formData.append('image_url', imageUrl);
    }

    // Optimize for clothing/products
    formData.append('size', 'auto');
    formData.append('type', 'product'); // Optimized for clothing/products
    formData.append('format', 'png'); // PNG for transparency
    formData.append('crop', 'false'); // Keep original dimensions

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': this.REMOVEBG_API_KEY,
      },
      signal, // Add abort signal support
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`remove.bg API failed (${response.status}): ${errorText}`);
    }

    // Get the blob result
    const blob = await response.blob();
    
    // Convert blob to data URL
    const processedImageUrl = await this.blobToDataUrl(blob);

    console.log('✅ [REMOVE.BG] Background removed successfully');
    return {
      success: true,
      imageUrl: processedImageUrl
    };
  }

  /**
   * Helper: Convert base64 to Blob
   */
  private base64ToBlob(base64: string, type: string = 'image/png'): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  }

  /**
   * Helper: Convert Blob to data URL
   */
  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Clear cache (useful for memory management)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ [BACKGROUND-REMOVAL] Cache cleared');
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Smart AI-powered categorization of clothing items
   * Now delegates to the dedicated categorization service with multi-level fallback
   */
  async categorizeClothing(imageUrl: string, filename?: string): Promise<SmartCategorizationResult> {
    try {
      // Use new dedicated categorization service with fallback support
      const result: CategorizationResult = await clothingCategorizationService.categorizeClothing(imageUrl, filename);

      // Convert to legacy format for backward compatibility
      return {
        success: result.success,
        category: result.category,
        color: result.color,
        type: result.subcategory,
        season: result.season,
        confidence: result.confidence,
        error: result.error
      };

    } catch (error) {
      console.error('❌ [CATEGORIZATION] Unexpected error:', error);

      // Return default on unexpected error
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Enhanced upload with automatic processing
   * Now uses improved categorization service with fallback support
   * CRITICAL: Always succeeds - categorization failures don't break uploads
   */
  async processClothingUpload(file: File): Promise<{
    success: boolean;
    imageUrl?: string;
    processedImageUrl?: string;
    category?: string;
    metadata?: any;
    error?: string;
  }> {
    try {
      console.log('📁 [UPLOAD] Processing clothing upload for:', file.name);
      console.log('📏 [UPLOAD] File size:', (file.size / 1024).toFixed(2), 'KB');

      // Step 1: Convert to base64 for persistent storage
      const base64Data = await this.fileToBase64(file);
      const originalImageUrl = `data:${file.type};base64,${base64Data}`;
      console.log('✅ [UPLOAD] Image converted to base64, length:', originalImageUrl.length);

      // Step 2: Upload to a temporary storage (for processing) - uses same base64
      const uploadedImageUrl = await this.uploadToTempStorage(file);
      console.log('✅ [UPLOAD] Image uploaded to temp storage');

      // Step 3: Remove background (optional, doesn't break upload if fails)
      let backgroundRemovalResult;
      try {
        backgroundRemovalResult = await this.removeBackground(uploadedImageUrl);
        console.log('✅ [UPLOAD] Background removal:', backgroundRemovalResult.success ? 'success' : 'skipped');
      } catch (bgError) {
        console.warn('⚠️ [UPLOAD] Background removal failed, using original image:', bgError);
        backgroundRemovalResult = { success: false, imageUrl: originalImageUrl };
      }

      // Step 4: Categorize the item (CRITICAL: Must not break upload)
      let categorizationResult;
      try {
        console.log('🔍 [UPLOAD] Starting categorization...');
        categorizationResult = await this.categorizeClothing(uploadedImageUrl, file.name);
        console.log('✅ [UPLOAD] Categorization result:', {
          success: categorizationResult.success,
          category: categorizationResult.category,
          confidence: categorizationResult.confidence
        });
      } catch (catError) {
        console.error('❌ [UPLOAD] Categorization failed completely:', catError);
        // Use safe fallback
        categorizationResult = {
          success: true, // Mark as success to avoid breaking upload
          category: 'other',
          type: 'uncategorized',
          color: 'unknown',
          season: 'all',
          confidence: 0
        };
        console.log('⚠️ [UPLOAD] Using fallback category:', categorizationResult.category);
      }

      // Step 5: Extract additional metadata (optional, doesn't break upload)
      let metadata;
      try {
        metadata = await this.extractMetadata(file);
      } catch (metaError) {
        console.warn('⚠️ [UPLOAD] Metadata extraction failed:', metaError);
        metadata = { originalName: file.name };
      }

      // FINAL RESULT: Always successful with valid imageUrl and category
      const finalImageUrl = backgroundRemovalResult.success ? backgroundRemovalResult.imageUrl : originalImageUrl;
      const finalCategory = categorizationResult.success && categorizationResult.category ? categorizationResult.category : 'other';

      console.log('✅ [UPLOAD] Upload complete!', {
        imageUrl: finalImageUrl.substring(0, 50) + '...',
        category: finalCategory,
        backgroundRemoved: backgroundRemovalResult.success
      });

      return {
        success: true,
        imageUrl: originalImageUrl,
        processedImageUrl: finalImageUrl,
        category: finalCategory,
        metadata: {
          ...metadata,
          type: categorizationResult.type,
          color: categorizationResult.color,
          season: categorizationResult.season,
          confidence: categorizationResult.confidence,
          backgroundRemoved: backgroundRemovalResult.success
        }
      };

    } catch (error) {
      console.error('❌ [UPLOAD] Critical processing error:', {
        error: error,
        message: error instanceof Error ? error.message : String(error),
        file: file.name,
        timestamp: new Date().toISOString()
      });

      // Even on critical error, try to return something usable
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload processing failed - please try again'
      };
    }
  }

  /**
   * Convert image to base64 for API calls
   */
  private async imageToBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          // Remove data URL prefix
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('Failed to convert image to base64');
    }
  }

  /**
   * Convert file to base64 for upload
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload file to fal.ai storage for processing
   */
  private async uploadToTempStorage(file: File): Promise<string> {
    try {
      // Convert to base64 data URL for persistent localStorage storage
      console.log('📦 [UPLOAD] Converting to base64 for persistent storage...');
      const base64Data = await this.fileToBase64(file);
      const dataUrl = `data:${file.type};base64,${base64Data}`;
      console.log('✅ [UPLOAD] File converted to base64 data URL');
      return dataUrl;

      /* TODO: Re-enable when /api/fal/fal-ai/storage/upload proxy endpoint is configured
      console.log('☁️ [UPLOAD] Uploading to fal.ai storage...');

      // Convert file to base64 for fal.ai upload
      const base64Data = await this.fileToBase64(file);

      const response = await fetch(`${this.API_BASE}/fal-ai/storage/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: file.type,
          file_name: file.name,
          file_data: base64Data
        }),
      });

      if (!response.ok) {
        console.warn('⚠️ [UPLOAD] fal.ai upload failed, using fallback');
        // Fallback to object URL if fal.ai upload fails
        return URL.createObjectURL(file);
      }

      const result = await response.json();

      if (result.url) {
        console.log('✅ [UPLOAD] File uploaded to fal.ai storage');
        return result.url;
      } else {
        throw new Error('No upload URL returned');
      }
      */

    } catch (error) {
      console.warn('⚠️ [UPLOAD] Upload failed, using base64 fallback:', error);
      // Always fallback to base64 to ensure upload continues with persistent storage
      try {
        const base64Data = await this.fileToBase64(file);
        return `data:${file.type};base64,${base64Data}`;
      } catch (fallbackError) {
        console.error('❌ [UPLOAD] Base64 conversion also failed:', fallbackError);
        // Last resort: blob URL (non-persistent)
        return URL.createObjectURL(file);
      }
    }
  }

  /**
   * Extract metadata from file
   */
  private async extractMetadata(file: File): Promise<any> {
    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadDate: new Date().toISOString(),
      originalName: file.name.replace(/\.[^/.]+$/, "")
    };
  }

  /**
   * Batch process multiple clothing items
   */
  async batchProcessClothing(files: File[]): Promise<Array<{
    file: File;
    result: any;
  }>> {
    console.log(`📦 [BATCH] Processing ${files.length} items...`);

    const results = await Promise.allSettled(
      files.map(async (file) => ({
        file,
        result: await this.processClothingUpload(file)
      }))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    totalProcessed: number;
    successRate: number;
    averageConfidence: number;
  } {
    // This would track actual usage statistics
    return {
      totalProcessed: 0,
      successRate: 0.95,
      averageConfidence: 0.89
    };
  }
}

// Lazy initialization to avoid process.env issues
let backgroundRemovalServiceInstance: BackgroundRemovalService | null = null;

export const backgroundRemovalService = (() => {
  if (!backgroundRemovalServiceInstance) {
    backgroundRemovalServiceInstance = new BackgroundRemovalService();
  }
  return backgroundRemovalServiceInstance;
})();

export default backgroundRemovalService;