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
    category: 'auto' | 'upper' | 'lower' | 'dress' | 'full';
  };
}

export interface FashnResult {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: {
    images: string[];
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

  private detectCategory(clothingType: string): 'auto' | 'upper' | 'lower' | 'dress' | 'full' {
    const categoryMap: { [key: string]: 'auto' | 'upper' | 'lower' | 'dress' | 'full' } = {
      'top': 'upper',
      'shirt': 'upper',
      'blouse': 'upper',
      'sweater': 'upper',
      'jacket': 'upper',
      'outerwear': 'upper',
      'bottom': 'lower',
      'pants': 'lower',
      'jeans': 'lower',
      'shorts': 'lower',
      'skirt': 'lower',
      'dress': 'dress',
      'jumpsuit': 'full',
      'suit': 'full'
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
    clothingType: string
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

      const result = await this.pollFashnResult(id);
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

  private async pollFashnResult(jobId: string, maxAttempts: number = 30): Promise<TryOnResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.log(`🔄 [FASHN] Polling attempt ${attempt + 1}/${maxAttempts}...`);

        const response = await fetch(`${this.baseUrl}/v1/status/${jobId}`);

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const result: FashnResult = await response.json();
        console.log('📊 [FASHN] Job status:', result.status);

        switch (result.status) {
          case 'completed':
            if (result.result?.images?.[0]) {
              return {
                success: true,
                finalImageUrl: result.result.images[0],
                itemName: 'Clothing Item',
                itemId: jobId,
                fashnJobId: jobId
              };
            } else {
              throw new Error('No image result returned');
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
        if (attempt === maxAttempts - 1) {
          return {
            success: false,
            itemName: 'Clothing Item',
            itemId: jobId,
            error: error instanceof Error ? error.message : 'Polling failed'
          };
        }

        // Wait before retry
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
    accessoryType: 'jewelry' | 'bag' | 'belt' | 'hat' | 'shoes'
  ): Promise<TryOnResult> {
    try {
      console.log('💎 [FASHN] Applying accessory...', { accessoryType });

      // Different handling based on accessory type
      switch (accessoryType) {
        case 'jewelry':
          // Apply jewelry as overlay after clothing
          return await this.applyJewelryOverlay(avatarUrl, accessoryUrl);

        case 'bag':
        case 'belt':
          // Include in garment image with auto category
          return await this.applyClothingToAvatar(avatarUrl, accessoryUrl, accessoryType);

        case 'hat':
          // Use separate head region application
          return await this.applyHeadAccessory(avatarUrl, accessoryUrl);

        case 'shoes':
          // Apply with lower body category
          return await this.applyClothingToAvatar(avatarUrl, accessoryUrl, 'shoes');

        default:
          return await this.applyClothingToAvatar(avatarUrl, accessoryUrl, accessoryType);
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

  private async applyJewelryOverlay(avatarUrl: string, jewelryUrl: string): Promise<TryOnResult> {
    // For jewelry, we'll use the auto category with special handling
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
    return await this.pollFashnResult(id);
  }

  private async applyHeadAccessory(avatarUrl: string, hatUrl: string): Promise<TryOnResult> {
    // For hats, use upper body category to focus on head region
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
    return await this.pollFashnResult(id);
  }

  // =====================
  // Sequential Layering System
  // =====================

  async applyOutfitSequentially(
    avatarUrl: string,
    items: ClothingItem[]
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
            accessoryType
          );
        } else {
          result = await this.applyClothingToAvatar(
            currentAvatarUrl,
            item.imageUrl,
            item.clothingType
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
    items: ClothingItem[]
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
    const result = await this.applyOutfitSequentially(avatarUrl, items);

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
      console.error('❌ [FASHN] Failed to load cache:', error);
    }
  }

  private saveCachedOutfits(): void {
    try {
      const outfits = Array.from(this.outfitCache.values());
      localStorage.setItem('fashn_outfit_cache', JSON.stringify(outfits));

      const results = Object.fromEntries(this.resultCache);
      localStorage.setItem('fashn_result_cache', JSON.stringify(results));
    } catch (error) {
      console.error('❌ [FASHN] Failed to save cache:', error);
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
    item: ClothingItem
  ): Promise<TryOnResult> {
    return await this.applyClothingToAvatar(avatarUrl, item.imageUrl, item.clothingType);
  }

  async tryOnFullOutfit(
    avatarUrl: string,
    items: ClothingItem[]
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
    const quickResult = await this.quickOutfitChange(avatarUrl, items);

    if (quickResult.success) {
      return {
        success: true,
        finalImageUrl: quickResult.finalImageUrl,
        layerResults: [],
        fromCache: quickResult.fromCache
      };
    }

    // Fall back to sequential application
    const result = await this.applyOutfitSequentially(avatarUrl, items);
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