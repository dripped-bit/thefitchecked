/**
 * Claude Vision Color Analysis Service
 * Uses Claude 3.5 Sonnet Vision API to analyze clothing images and extract dominant colors
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabaseClient';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface ColorAnalysisResult {
  itemId: string;
  color: string;
  success: boolean;
  error?: string;
}

export interface BatchAnalysisResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: ColorAnalysisResult[];
}

/**
 * Analyze a single clothing image and extract dominant color
 */
export async function analyzeClothingColor(imageUrl: string): Promise<string> {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
    throw new Error('VITE_ANTHROPIC_API_KEY not configured');
  }

  try {
    console.log('🎨 [CLAUDE-VISION] Analyzing color for image:', imageUrl);

    // Fetch the image and convert to base64
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    
    // Extract media type and base64 data
    const mediaTypeMatch = base64.match(/^data:([^;]+);base64,(.+)$/);
    if (!mediaTypeMatch) {
      throw new Error('Invalid base64 data URL');
    }
    
    const mediaType = mediaTypeMatch[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    const base64Data = mediaTypeMatch[2];

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Analyze this clothing item photo. What is the dominant/primary color? 

Respond with ONE word only from this list: black, white, gray, navy, blue, red, pink, purple, green, yellow, orange, brown, beige, tan, cream, khaki, olive, maroon, burgundy, teal, turquoise, gold, silver, denim, multi-color.

If the item has multiple colors, choose the most prominent one. Be specific (e.g., "navy" instead of just "blue" if it's dark blue).

Respond with ONLY the color word, nothing else.`
            }
          ]
        }
      ]
    });

    const color = message.content[0]?.type === 'text' 
      ? message.content[0].text.trim().toLowerCase()
      : 'unknown';

    console.log('✅ [CLAUDE-VISION] Color detected:', color);
    return color;

  } catch (error: any) {
    console.error('❌ [CLAUDE-VISION] Error analyzing color:', error.message);
    throw new Error(`Color analysis failed: ${error.message}`);
  }
}

/**
 * Convert blob to base64 data URL
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Analyze color for a single item and update database
 */
export async function analyzeAndUpdateItem(itemId: string, imageUrl: string): Promise<ColorAnalysisResult> {
  try {
    const color = await analyzeClothingColor(imageUrl);

    // Update database
    const { error } = await supabase
      .from('clothing_items')
      .update({ 
        color,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (error) {
      throw new Error(`Database update failed: ${error.message}`);
    }

    console.log(`✅ [CLAUDE-VISION] Updated item ${itemId} with color: ${color}`);

    return {
      itemId,
      color,
      success: true
    };

  } catch (error: any) {
    console.error(`❌ [CLAUDE-VISION] Failed to analyze item ${itemId}:`, error.message);
    return {
      itemId,
      color: 'unknown',
      success: false,
      error: error.message
    };
  }
}

/**
 * Batch analyze all items that don't have colors yet
 */
export async function batchAnalyzeAllItems(
  skipExisting: boolean = true,
  onProgress?: (current: number, total: number, itemName: string) => void
): Promise<BatchAnalysisResult> {
  console.log('🚀 [CLAUDE-VISION] Starting batch color analysis...');

  try {
    // Get user ID from current session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch items that need color analysis
    let query = supabase
      .from('clothing_items')
      .select('id, name, image_url, thumbnail_url, color')
      .eq('user_id', user.id);

    if (skipExisting) {
      query = query.or('color.is.null,color.eq.Unknown,color.eq.unknown,color.eq.');
    }

    const { data: items, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch items: ${error.message}`);
    }

    if (!items || items.length === 0) {
      console.log('✅ [CLAUDE-VISION] No items need color analysis');
      return {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        results: []
      };
    }

    console.log(`📊 [CLAUDE-VISION] Found ${items.length} items to analyze`);

    const results: ColorAnalysisResult[] = [];
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    // Process items in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      // Process batch with delay between items
      for (const item of batch) {
        const imageUrl = item.thumbnail_url || item.image_url;

        if (!imageUrl) {
          console.warn(`⚠️ [CLAUDE-VISION] Skipping item ${item.id} - no image`);
          skipped++;
          results.push({
            itemId: item.id,
            color: 'unknown',
            success: false,
            error: 'No image URL'
          });
          continue;
        }

        // Report progress
        if (onProgress) {
          onProgress(i + batch.indexOf(item) + 1, items.length, item.name || 'Unnamed item');
        }

        const result = await analyzeAndUpdateItem(item.id, imageUrl);
        results.push(result);

        if (result.success) {
          successful++;
        } else {
          failed++;
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Longer delay between batches
      if (i + batchSize < items.length) {
        console.log(`⏳ [CLAUDE-VISION] Batch complete, waiting before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const summary = {
      total: items.length,
      successful,
      failed,
      skipped,
      results
    };

    console.log('✅ [CLAUDE-VISION] Batch analysis complete:', summary);
    return summary;

  } catch (error: any) {
    console.error('❌ [CLAUDE-VISION] Batch analysis error:', error.message);
    throw error;
  }
}

/**
 * Analyze specific items by IDs
 */
export async function batchAnalyzeItems(
  itemIds: string[],
  onProgress?: (current: number, total: number, itemName: string) => void
): Promise<BatchAnalysisResult> {
  console.log(`🚀 [CLAUDE-VISION] Analyzing ${itemIds.length} specific items...`);

  try {
    // Fetch items
    const { data: items, error } = await supabase
      .from('clothing_items')
      .select('id, name, image_url, thumbnail_url')
      .in('id', itemIds);

    if (error) {
      throw new Error(`Failed to fetch items: ${error.message}`);
    }

    if (!items || items.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        results: []
      };
    }

    const results: ColorAnalysisResult[] = [];
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const imageUrl = item.thumbnail_url || item.image_url;

      if (!imageUrl) {
        skipped++;
        results.push({
          itemId: item.id,
          color: 'unknown',
          success: false,
          error: 'No image URL'
        });
        continue;
      }

      if (onProgress) {
        onProgress(i + 1, items.length, item.name || 'Unnamed item');
      }

      const result = await analyzeAndUpdateItem(item.id, imageUrl);
      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Delay between requests
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      total: items.length,
      successful,
      failed,
      skipped,
      results
    };

  } catch (error: any) {
    console.error('❌ [CLAUDE-VISION] Batch analysis error:', error.message);
    throw error;
  }
}

export default {
  analyzeClothingColor,
  analyzeAndUpdateItem,
  batchAnalyzeAllItems,
  batchAnalyzeItems
};
