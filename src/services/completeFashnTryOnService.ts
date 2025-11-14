/**
 * Complete FASHN Try-On System
 * Handles clothing, accessories, and layering using FASHN API exclusively
 */

import apiConfig from '../config/apiConfig';

// Types and Interfaces
export interface FashnRequest {
  model_name: string;
  inputs: {
    model_image: string;
    garment_image: string;
    moderation_level: 'strict' | 'permissive' | 'none';
    category: 'auto' | 'tops' | 'bottoms' | 'one-pieces';
  };
}

export interface FashnResult {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: {
    images?: string[];      // Format 1: array of images
    image?: string;         // Format 2: single image
    output?: string[];      // Format 3: output field (array of image URLs)
    data?: {                // Format 4: nested data object
      images?: string[];
    };
  };
  error?: string;
}

export interface ClothingItem {
  id: string;
  name: string;
  imageUrl: string;
  category: 'shirts' | 'pants' | 'dresses' | 'shoes' | 'accessories';
  clothingType: 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'hat' | 'jewelry' | 'bag' | 'belt';
  layer: number; // 1=base, 2=mid, 3=outer, 4=accessories
}

export interface TryOnResult {
  success: boolean;
  finalImageUrl?: string;
  itemName: string;
  itemId: string;
  error?: string;
  fashnJobId?: string;
  processingTime?: number;
}

export interface OutfitCombination {
  id: string;
  avatarUrl: string;
  items: ClothingItem[];
  finalImageUrl: string;
  createdAt: Date;
  layerResults: Array<{
    itemId: string;
    imageUrl: string;
    layer: number;
  }>;
}

class CompleteFashnTryOnService {
  private readonly baseUrl: string;
  private outfitCache: Map<string, OutfitCombination> = new Map();
  private resultCache: Map<string, string> = new Map(); // avatar+item combo -> result URL

  constructor() {
    this.baseUrl = apiConfig.getEndpoint('/api/fashn');
    this.loadCachedOutfits();
    console.log('👔 [COMPLETE-FASHN] Service initialized - URL:', this.baseUrl);
  }

  // =====================
  // Category Detection
  // =====================

  private detectCategory(clothingType: string): 'auto' | 'tops' | 'bottoms' | 'one-pieces' {
    const categoryMap: { [key: string]: 'auto' | 'tops' | 'bottoms' | 'one-pieces' } = {
      // Tops
      'top': 'tops',
      'shirt': 'tops',
      'blouse': 'tops',
      'sweater': 'tops',
      'jacket': 'tops',
      'outerwear': 'tops',
      't-shirt': 'tops',
      'tshirt': 'tops',
      
      // Bottoms
      'bottom': 'bottoms',
      'pants': 'bottoms',
      'jeans': 'bottoms',
      'shorts': 'bottoms',
      'skirt': 'bottoms',
      'trousers': 'bottoms',
      
      // One-pieces (dresses)
      'dress': 'one-pieces',
      'dresses': 'one-pieces',
      'jumpsuit': 'one-pieces',
      'romper': 'one-pieces',
      'suit': 'one-pieces',
      'gown': 'one-pieces'
    };

    return categoryMap[clothingType.toLowerCase()] || 'auto';
  }

  private getItemLayer(clothingType: string): number {
    const layerMap: { [key: string]: number } = {
      // Base layer (1)
      'underwear': 1,
      'bra': 1,
      'undershirt': 1,

      // Main clothing (2)
      'shirt': 2,
      'blouse': 2,
      'top': 2,
      'pants': 2,
      'jeans': 2,
      'shorts': 2,
      'skirt': 2,
      'dress': 2,

      // Outer layer (3)
      'jacket': 3,
      'coat': 3,
      'sweater': 3,
      'cardigan': 3,
      'hoodie': 3,

      // Accessories (4)
      'shoes': 4,
      'hat': 4,
      'cap': 4,
      'jewelry': 4,
      'necklace': 4,
      'earrings': 4,
      'bracelet': 4,
      'bag': 4,
      'purse': 4,
      'belt': 4,
      'watch': 4,
      'sunglasses': 4,
      'scarf': 4
    };

    return layerMap[clothingType.toLowerCase()] || 2;
  }

  // =====================
  // Core FASHN API
  // =====================

  async applyClothingToAvatar(
    avatarUrl: string,
    clothingUrl: string,
    clothingType: string,
    onProgress?: (progress: number) => void
  ): Promise<TryOnResult> {
    try {
      console.log('👔 [FASHN] Applying clothing to avatar...', { clothingType });

      // Check cache first
      const cacheKey = `${avatarUrl}+${clothingUrl}`;
      if (this.resultCache.has(cacheKey)) {
        console.log('💾 [FASHN] Using cached result');
        return {
          success: true,
          finalImageUrl: this.resultCache.get(cacheKey)!,
          itemName: clothingType,
          itemId: clothingUrl
        };
      }

      const startTime = Date.now();

      const requestBody: FashnRequest = {
        model_name: 'tryon-v1.6',
        inputs: {
          model_image: avatarUrl,
          garment_image: clothingUrl,
          moderation_level: 'none',
          category: this.detectCategory(clothingType)
        }
      };

      console.log('🚀 [FASHN] Starting try-on job...', requestBody);

      const response = await fetch(`${this.baseUrl}/v1/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FASHN API error: ${response.status} - ${errorText}`);
      }

      const { id } = await response.json();
      console.log('⏳ [FASHN] Job started, polling for results...', { jobId: id });

      const result = await this.pollFashnResult(id, 30, onProgress, startTime);
      const processingTime = Date.now() - startTime;

      if (result.success && result.finalImageUrl) {
        // Cache the result
        this.resultCache.set(cacheKey, result.finalImageUrl);
        console.log('✅ [FASHN] Try-on completed successfully', {
          processingTime: `${processingTime}ms`
        });
      }

      return {
        ...result,
        processingTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('❌ [FASHN] Try-on failed:', errorMessage);
      console.error('❌ [FASHN] Error details:', error);
      return {
        success: false,
        itemName: clothingType,
        itemId: clothingUrl,
        error: errorMessage
      };
    }
  }

  private async pollFashnResult(jobId: string, maxAttempts: number = 30, onProgress?: (progress: number) => void, startTime?: number): Promise<TryOnResult> {
    const pollStartTime = startTime || Date.now();
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let result: FashnResult | undefined;
      try {
        console.log(`🔄 [FASHN] Polling attempt ${attempt + 1}/${maxAttempts}...`);

        // Report progress based on elapsed time (estimate 60s completion)
        if (onProgress) {
          const elapsed = (Date.now() - pollStartTime) / 1000;
          const estimatedProgress = Math.min((elapsed / 60) * 100, 95);
          onProgress(Math.round(estimatedProgress));
        }

        const response = await fetch(`${this.baseUrl}/v1/status/${jobId}`);

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        result = await response.json();
        console.log('📊 [FASHN] Job status:', result.status);

        // Add detailed logging for completed jobs to diagnose issues
        if (result.status === 'completed') {
          console.log('🔍 [FASHN] Completed job full response:', JSON.stringify(result, null, 2));
          console.log('📦 [FASHN] Result object:', result.result);
          console.log('🖼️ [FASHN] Images array:', result.result?.images);
        }

        switch (result.status) {
          case 'completed':
            // Try multiple possible response formats
            let imageUrl: string | null = null;
            
            // Format 1: result.output[0] (current FASHN API format - check this FIRST!)
            if (result.output?.[0]) {
              imageUrl = result.output[0];
              console.log('✅ [FASHN] Found image in result.output[0] (current API format)');
            }
            // Format 2: result.images[0]
            else if (result.result?.images?.[0]) {
              imageUrl = result.result.images[0];
              console.log('✅ [FASHN] Found image in result.result.images[0]');
            }
            // Format 3: result.image (singular)
            else if (result.result?.image) {
              imageUrl = result.result.image;
              console.log('✅ [FASHN] Found image in result.result.image');
            }
            // Format 4: result.result.output[0] (legacy nested format)
            else if (result.result?.output?.[0]) {
              imageUrl = result.result.output[0];
              console.log('✅ [FASHN] Found image in result.result.output[0]');
            }
            // Format 5: result.data.images[0]
            else if (result.result?.data?.images?.[0]) {
              imageUrl = result.result.data.images[0];
              console.log('✅ [FASHN] Found image in result.data.images[0]');
            }
            
            if (imageUrl) {
              // Report 100% completion
              if (onProgress) {
                onProgress(100);
              }

              return {
                success: true,
                finalImageUrl: imageUrl,
                itemName: 'Clothing Item',
                itemId: jobId,
                fashnJobId: jobId
              };
            } else {
              // Log entire response for debugging
              console.error('❌ [FASHN] Completed but no image found. Full response:', JSON.stringify(result, null, 2));
              throw new Error('Job completed but no image URL found in response');
            }

          case 'failed':
            throw new Error(result.error || 'FASHN job failed');

          case 'queued':
          case 'processing':
            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;

          default:
            throw new Error(`Unknown status: ${result.status}`);
        }

      } catch (error) {
        // Don't retry if job was completed (even if image extraction failed)
        // or if this was the last attempt
        const shouldStopPolling = attempt === maxAttempts - 1 || 
                                  (result && result.status === 'completed');
        
        if (shouldStopPolling) {
          console.error('❌ [FASHN] Polling failed:', error);
          return {
            success: false,
            itemName: 'Clothing Item',
            itemId: jobId,
            error: error instanceof Error ? error.message : 'Polling failed'
          };
        }

        // Only retry if job is still processing or status check failed
        console.warn('⚠️ [FASHN] Polling error, retrying...', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      success: false,
      itemName: 'Clothing Item',
      itemId: jobId,
      error: 'Polling timeout - job may still be processing'
    };
  }

  // =====================
  // Accessory Handling
  // =====================

  async applyAccessoryToAvatar(
    avatarUrl: string,
    accessoryUrl: string,
    accessoryType: 'jewelry' | 'bag' | 'belt' | 'hat' | 'shoes',
    onProgress?: (progress: number) => void
  ): Promise<TryOnResult> {
    try {
      console.log('💎 [FASHN] Applying accessory...', { accessoryType });

      // Different handling based on accessory type
      switch (accessoryType) {
        case 'jewelry':
          // Apply jewelry as overlay after clothing
          return await this.applyJewelryOverlay(avatarUrl, accessoryUrl, onProgress);

        case 'bag':
        case 'belt':
          // Include in garment image with auto category
          return await this.applyClothingToAvatar(avatarUrl, accessoryUrl, accessoryType, onProgress);

        case 'hat':
          // Use separate head region application
          return await this.applyHeadAccessory(avatarUrl, accessoryUrl, onProgress);

        case 'shoes':
          // Apply with lower body category
          return await this.applyClothingToAvatar(avatarUrl, accessoryUrl, 'shoes', onProgress);

        default:
          return await this.applyClothingToAvatar(avatarUrl, accessoryUrl, accessoryType, onProgress);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('❌ [FASHN] Accessory application failed:', errorMessage);
      console.error('❌ [FASHN] Error details:', error);
      return {
        success: false,
        itemName: accessoryType,
        itemId: accessoryUrl,
        error: errorMessage
      };
    }
  }

  private async applyJewelryOverlay(avatarUrl: string, jewelryUrl: string, onProgress?: (progress: number) => void): Promise<TryOnResult> {
    // For jewelry, we'll use the auto category with special handling
    const startTime = Date.now();
    const requestBody = {
      model_name: 'tryon-v1.6',
      inputs: {
        model_image: avatarUrl,
        garment_image: jewelryUrl,
        moderation_level: 'none',
        category: 'auto'
      }
    };

    const response = await fetch(`${this.baseUrl}/v1/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const { id } = await response.json();
    return await this.pollFashnResult(id, 30, onProgress, startTime);
  }

  private async applyHeadAccessory(avatarUrl: string, hatUrl: string, onProgress?: (progress: number) => void): Promise<TryOnResult> {
    // For hats, use upper body category to focus on head region
    const startTime = Date.now();
    const requestBody = {
      model_name: 'tryon-v1.6',
      inputs: {
        model_image: avatarUrl,
        garment_image: hatUrl,
        moderation_level: 'none',
        category: 'upper'
      }
    };

    const response = await fetch(`${this.baseUrl}/v1/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const { id } = await response.json();
    return await this.pollFashnResult(id, 30, onProgress, startTime);
  }

  // =====================
  // Sequential Layering System
  // =====================

  async applyOutfitSequentially(
    avatarUrl: string,
    items: ClothingItem[],
    onProgress?: (progress: number) => void
  ): Promise<{
    success: boolean;
    finalImageUrl?: string;
    layerResults: Array<{
      itemId: string;
      itemName: string;
      imageUrl: string;
      layer: number;
      success: boolean;
      error?: string;
    }>;
    error?: string;
  }> {
    try {
      console.log('👗 [FASHN] Starting sequential outfit application...', {
        itemCount: items.length
      });

      // Sort items by layer (base to accessories)
      const sortedItems = items
        .map(item => ({
          ...item,
          layer: this.getItemLayer(item.clothingType)
        }))
        .sort((a, b) => a.layer - b.layer);

      console.log('📋 [FASHN] Layer order:', sortedItems.map(item =>
        `${item.name} (layer ${item.layer})`
      ));

      const layerResults: Array<{
        itemId: string;
        itemName: string;
        imageUrl: string;
        layer: number;
        success: boolean;
        error?: string;
      }> = [];

      let currentAvatarUrl = avatarUrl;

      // Apply items sequentially
      for (const item of sortedItems) {
        console.log(`🔄 [FASHN] Applying layer ${item.layer}: ${item.name}`);

        let result: TryOnResult;

        // Check if this is an accessory
        const isAccessory = item.layer === 4;

        if (isAccessory) {
          const accessoryType = this.getAccessoryType(item.clothingType);
          result = await this.applyAccessoryToAvatar(
            currentAvatarUrl,
            item.imageUrl,
            accessoryType,
            onProgress
          );
        } else {
          result = await this.applyClothingToAvatar(
            currentAvatarUrl,
            item.imageUrl,
            item.clothingType,
            onProgress
          );
        }

        layerResults.push({
          itemId: item.id,
          itemName: item.name,
          imageUrl: result.finalImageUrl || currentAvatarUrl,
          layer: item.layer,
          success: result.success,
          error: result.error
        });

        if (result.success && result.finalImageUrl) {
          // Use the result as the base for the next layer
          currentAvatarUrl = result.finalImageUrl;
          console.log(`✅ [FASHN] Layer ${item.layer} applied successfully`);
        } else {
          console.warn(`⚠️ [FASHN] Layer ${item.layer} failed, continuing with previous result`);
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const finalSuccess = layerResults.some(result => result.success);

      return {
        success: finalSuccess,
        finalImageUrl: currentAvatarUrl,
        layerResults
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('❌ [FASHN] Sequential outfit application failed:', errorMessage);
      console.error('❌ [FASHN] Error details:', error);
      return {
        success: false,
        layerResults: [],
        error: errorMessage
      };
    }
  }

  private getAccessoryType(clothingType: string): 'jewelry' | 'bag' | 'belt' | 'hat' | 'shoes' {
    const accessoryMap: { [key: string]: 'jewelry' | 'bag' | 'belt' | 'hat' | 'shoes' } = {
      'jewelry': 'jewelry',
      'necklace': 'jewelry',
      'earrings': 'jewelry',
      'bracelet': 'jewelry',
      'ring': 'jewelry',
      'bag': 'bag',
      'purse': 'bag',
      'handbag': 'bag',
      'backpack': 'bag',
      'belt': 'belt',
      'hat': 'hat',
      'cap': 'hat',
      'beanie': 'hat',
      'shoes': 'shoes',
      'sneakers': 'shoes',
      'boots': 'shoes',
      'heels': 'shoes'
    };

    return accessoryMap[clothingType.toLowerCase()] || 'jewelry';
  }

  // =====================
  // Outfit Combination Caching
  // =====================

  async saveOutfitCombination(
    avatarUrl: string,
    items: ClothingItem[],
    finalImageUrl: string,
    layerResults: Array<{
      itemId: string;
      imageUrl: string;
      layer: number;
    }>
  ): Promise<string> {
    const outfitId = this.generateOutfitId(avatarUrl, items);

    const combination: OutfitCombination = {
      id: outfitId,
      avatarUrl,
      items,
      finalImageUrl,
      createdAt: new Date(),
      layerResults
    };

    this.outfitCache.set(outfitId, combination);
    this.saveCachedOutfits();

    console.log('💾 [FASHN] Outfit combination saved:', { outfitId });
    return outfitId;
  }

  getCachedOutfit(avatarUrl: string, items: ClothingItem[]): OutfitCombination | null {
    const outfitId = this.generateOutfitId(avatarUrl, items);
    const cached = this.outfitCache.get(outfitId);

    if (cached) {
      console.log('💾 [FASHN] Using cached outfit combination:', { outfitId });
    }

    return cached || null;
  }

  private generateOutfitId(avatarUrl: string, items: ClothingItem[]): string {
    const itemIds = items
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(item => item.id)
      .join(',');

    return btoa(`${avatarUrl}:${itemIds}`).replace(/[/+=]/g, '');
  }

  // =====================
  // Quick Outfit Changes
  // =====================

  async quickOutfitChange(
    avatarUrl: string,
    items: ClothingItem[],
    onProgress?: (progress: number) => void
  ): Promise<{
    success: boolean;
    finalImageUrl?: string;
    fromCache: boolean;
    processingTime: number;
  }> {
    const startTime = Date.now();

    // Check cache first
    const cached = this.getCachedOutfit(avatarUrl, items);
    if (cached) {
      return {
        success: true,
        finalImageUrl: cached.finalImageUrl,
        fromCache: true,
        processingTime: Date.now() - startTime
      };
    }

    // Apply outfit sequentially if not cached
    console.log('🚀 [FASHN] Generating new outfit combination...');
    const result = await this.applyOutfitSequentially(avatarUrl, items, onProgress);

    if (result.success && result.finalImageUrl) {
      // Cache the successful result
      await this.saveOutfitCombination(
        avatarUrl,
        items,
        result.finalImageUrl,
        result.layerResults.map(lr => ({
          itemId: lr.itemId,
          imageUrl: lr.imageUrl,
          layer: lr.layer
        }))
      );
    }

    return {
      success: result.success,
      finalImageUrl: result.finalImageUrl,
      fromCache: false,
      processingTime: Date.now() - startTime
    };
  }

  // =====================
  // Storage Management
  // =====================

  private loadCachedOutfits(): void {
    try {
      const cached = localStorage.getItem('fashn_outfit_cache');
      if (cached) {
        const outfits: OutfitCombination[] = JSON.parse(cached);
        outfits.forEach(outfit => {
          this.outfitCache.set(outfit.id, {
            ...outfit,
            createdAt: new Date(outfit.createdAt)
          });
        });
        console.log(`💾 [FASHN] Loaded ${outfits.length} cached outfits`);
      }

      const resultCache = localStorage.getItem('fashn_result_cache');
      if (resultCache) {
        const results = JSON.parse(resultCache);
        Object.entries(results).forEach(([key, value]) => {
          this.resultCache.set(key, value as string);
        });
        console.log(`💾 [FASHN] Loaded ${Object.keys(results).length} cached results`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('❌ [FASHN] Failed to load cache:', errorMessage);
      console.error('❌ [FASHN] Error details:', error);
    }
  }

  private saveCachedOutfits(): void {
    try {
      const outfits = Array.from(this.outfitCache.values());
      localStorage.setItem('fashn_outfit_cache', JSON.stringify(outfits));

      const results = Object.fromEntries(this.resultCache);
      localStorage.setItem('fashn_result_cache', JSON.stringify(results));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('❌ [FASHN] Failed to save cache:', errorMessage);
      console.error('❌ [FASHN] Error details:', error);
    }
  }

  clearCache(): void {
    this.outfitCache.clear();
    this.resultCache.clear();
    localStorage.removeItem('fashn_outfit_cache');
    localStorage.removeItem('fashn_result_cache');
    console.log('🗑️ [FASHN] Cache cleared');
  }

  // =====================
  // Public API Methods
  // =====================

  async tryOnSingleItem(
    avatarUrl: string,
    item: ClothingItem,
    onProgress?: (progress: number) => void
  ): Promise<TryOnResult> {
    return await this.applyClothingToAvatar(avatarUrl, item.imageUrl, item.clothingType, onProgress);
  }

  async tryOnFullOutfit(
    avatarUrl: string,
    items: ClothingItem[],
    onProgress?: (progress: number) => void
  ): Promise<{
    success: boolean;
    finalImageUrl?: string;
    layerResults: Array<{
      itemId: string;
      itemName: string;
      imageUrl: string;
      layer: number;
      success: boolean;
      error?: string;
    }>;
    fromCache: boolean;
  }> {
    // Try quick change first (checks cache)
    const quickResult = await this.quickOutfitChange(avatarUrl, items, onProgress);

    if (quickResult.success) {
      return {
        success: true,
        finalImageUrl: quickResult.finalImageUrl,
        layerResults: [],
        fromCache: quickResult.fromCache
      };
    }

    // Fall back to sequential application
    const result = await this.applyOutfitSequentially(avatarUrl, items, onProgress);
    return {
      ...result,
      fromCache: false
    };
  }

  getCacheStats(): {
    outfitCount: number;
    resultCount: number;
    cacheSize: string;
  } {
    const outfitCacheSize = JSON.stringify(Array.from(this.outfitCache.values())).length;
    const resultCacheSize = JSON.stringify(Object.fromEntries(this.resultCache)).length;
    const totalSize = outfitCacheSize + resultCacheSize;

    return {
      outfitCount: this.outfitCache.size,
      resultCount: this.resultCache.size,
      cacheSize: `${(totalSize / 1024).toFixed(1)} KB`
    };
  }
}

// Export singleton instance
export default new CompleteFashnTryOnService();