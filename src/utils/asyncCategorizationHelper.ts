/**
 * Async Categorization Helper
 * Demonstrates how to use the new non-blocking categorization system
 *
 * This pattern allows clothing items to be saved immediately to the closet
 * while categorization happens asynchronously in the background.
 */

import clothingCategorizationService, { CategorizationResult } from '../services/clothingCategorizationService';
import ClosetService, { ClothingCategory } from '../services/closetService';

/**
 * Upload and save clothing item with async categorization
 *
 * Usage Example:
 * ```typescript
 * const item = await uploadClothingWithAsyncCategorization(
 *   imageFile,
 *   'My New Shirt',
 *   (itemId, result) => {
 *     console.log(`Item ${itemId} categorized as ${result.category}`);
 *     // Optionally refresh UI to show updated category
 *   }
 * );
 * ```
 */
export async function uploadClothingWithAsyncCategorization(
  file: File,
  itemName?: string,
  onCategorizationComplete?: (itemId: string, result: CategorizationResult) => void
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    console.log('📤 [ASYNC-CATEGORIZATION] Starting non-blocking upload...');

    // Step 1: Convert file to data URL for immediate storage
    const imageUrl = await fileToDataUrl(file);

    // Step 2: Save item immediately with "processing" status
    const savedItem = await ClosetService.saveClothingItemProcessing(
      imageUrl,
      itemName || file.name,
      'Uploaded from device'
    );

    console.log('✅ [ASYNC-CATEGORIZATION] Item saved immediately:', savedItem.id);

    // Step 3: Start background categorization (non-blocking)
    clothingCategorizationService.categorizeLater(
      savedItem.id.toString(),
      imageUrl,
      file.name,
      async (itemId, result) => {
        // Callback when categorization completes
        console.log(`🎯 [ASYNC-CATEGORIZATION] Categorization complete for ${itemId}:`, result);

        // Update item in closet with categorization results
        const category = result.category as ClothingCategory;
        const updated = await ClosetService.updateItemCategorizationResult(
          itemId,
          category,
          {
            subcategory: result.subcategory,
            color: result.color,
            style: result.style,
            season: result.season,
            confidence: result.confidence,
            method: result.method
          }
        );

        if (updated) {
          console.log('✅ [ASYNC-CATEGORIZATION] Item updated with categorization results');
          // Call user callback if provided
          onCategorizationComplete?.(itemId, result);
        } else {
          console.error('❌ [ASYNC-CATEGORIZATION] Failed to update item');
          await ClosetService.markItemUncategorized(itemId);
        }
      }
    );

    return {
      success: true,
      itemId: savedItem.id.toString()
    };

  } catch (error) {
    console.error('❌ [ASYNC-CATEGORIZATION] Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Batch upload multiple items with async categorization
 */
export async function uploadMultipleClothingItemsAsync(
  files: File[],
  onItemUploaded?: (itemId: string) => void,
  onItemCategorized?: (itemId: string, result: CategorizationResult) => void
): Promise<{
  success: boolean;
  uploadedCount: number;
  itemIds: string[];
  errors: string[];
}> {
  const itemIds: string[] = [];
  const errors: string[] = [];

  console.log(`📦 [BATCH-UPLOAD] Uploading ${files.length} items...`);

  for (const file of files) {
    try {
      const result = await uploadClothingWithAsyncCategorization(
        file,
        undefined,
        onItemCategorized
      );

      if (result.success && result.itemId) {
        itemIds.push(result.itemId);
        onItemUploaded?.(result.itemId);
      } else {
        errors.push(result.error || `Failed to upload ${file.name}`);
      }
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`✅ [BATCH-UPLOAD] Complete: ${itemIds.length}/${files.length} succeeded`);

  return {
    success: errors.length === 0,
    uploadedCount: itemIds.length,
    itemIds,
    errors
  };
}

/**
 * Re-categorize existing item (useful if categorization failed or was wrong)
 */
export async function recategorizeItem(
  itemId: string,
  imageUrl: string,
  filename: string,
  onComplete?: (result: CategorizationResult) => void
): Promise<void> {
  console.log(`🔄 [RE-CATEGORIZATION] Re-categorizing item ${itemId}...`);

  clothingCategorizationService.categorizeLater(
    itemId,
    imageUrl,
    filename,
    async (id, result) => {
      const category = result.category as ClothingCategory;
      await ClosetService.updateItemCategorizationResult(
        id,
        category,
        {
          subcategory: result.subcategory,
          color: result.color,
          style: result.style,
          season: result.season,
          confidence: result.confidence,
          method: result.method
        }
      );

      console.log(`✅ [RE-CATEGORIZATION] Item ${id} re-categorized as ${category}`);
      onComplete?.(result);
    }
  );
}

/**
 * Convert File to data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get categorization status summary for all items
 */
export function getCategorizationStatus(): {
  total: number;
  processing: number;
  categorized: number;
  uncategorized: number;
  aiCategorized: number;
  heuristicCategorized: number;
} {
  const allItems = ClosetService.getAllClothingItems();

  return {
    total: allItems.length,
    processing: allItems.filter(item => item.status === 'processing').length,
    categorized: allItems.filter(item => item.status === 'categorized').length,
    uncategorized: allItems.filter(item => item.status === 'uncategorized').length,
    aiCategorized: allItems.filter(item => item.categorizationMethod === 'ai').length,
    heuristicCategorized: allItems.filter(item => item.categorizationMethod === 'heuristic').length
  };
}

// Example usage in a React component:
/*

import { uploadClothingWithAsyncCategorization } from '../utils/asyncCategorizationHelper';

function MyUploadComponent() {
  const [uploadingItems, setUploadingItems] = useState<string[]>([]);

  const handleFileUpload = async (file: File) => {
    const result = await uploadClothingWithAsyncCategorization(
      file,
      file.name,
      (itemId, categorizationResult) => {
        // Called when categorization completes
        console.log('Categorized:', itemId, categorizationResult);

        // Remove from uploading list
        setUploadingItems(prev => prev.filter(id => id !== itemId));

        // Optionally refresh closet view
        refreshClosetData();
      }
    );

    if (result.success && result.itemId) {
      // Add to uploading list to show loading indicator
      setUploadingItems(prev => [...prev, result.itemId]);

      // Item is saved immediately! User can see it right away
      console.log('Item saved immediately:', result.itemId);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />
      {uploadingItems.length > 0 && (
        <p>Categorizing {uploadingItems.length} items...</p>
      )}
    </div>
  );
}

*/
