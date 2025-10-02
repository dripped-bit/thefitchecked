/**
 * External Try-On Service
 * Handles virtual try-on for external product images from search results
 */

import directFashnService from './directFashnService';
import { ProductSearchResult } from './perplexityService';

export interface ExternalTryOnResult {
  success: boolean;
  finalImageUrl?: string;
  error?: string;
  originalProduct?: ProductSearchResult;
}

class ExternalTryOnService {
  /**
   * Try on an external product from search results
   */
  async tryOnExternalProduct(
    avatarImageUrl: string,
    product: ProductSearchResult
  ): Promise<ExternalTryOnResult> {
    try {
      console.log('🛒 [EXTERNAL-TRYON] Starting external product try-on:', {
        productTitle: product.title,
        productStore: product.store,
        productImageUrl: product.imageUrl ? product.imageUrl.substring(0, 50) + '...' : 'missing',
        avatarUrl: avatarImageUrl.substring(0, 50) + '...'
      });

      // Validate that we have all required data
      if (!avatarImageUrl) {
        throw new Error('Avatar image URL is required');
      }

      if (!product.imageUrl) {
        throw new Error('Product image URL is missing');
      }

      // Validate external image URL accessibility
      const imageValidation = await this.validateExternalImage(product.imageUrl);
      if (!imageValidation.isValid) {
        throw new Error(`Product image not accessible: ${imageValidation.error}`);
      }

      console.log('✅ [EXTERNAL-TRYON] External image validated, proceeding with FASHN...');

      // Use direct FASHN service for the try-on
      const fashnResult = await directFashnService.tryOnClothing(
        avatarImageUrl,
        product.imageUrl,
        {
          category: 'auto', // Let FASHN auto-detect the category
          timeout: 90000, // 90 seconds - FASHN typically takes 40-50s, need buffer
          source: 'external-search'
        }
      );

      if (fashnResult.success && fashnResult.imageUrl) {
        console.log('✅ [EXTERNAL-TRYON] Try-on successful:', fashnResult.imageUrl);

        return {
          success: true,
          finalImageUrl: fashnResult.imageUrl,
          originalProduct: product
        };
      } else {
        throw new Error(fashnResult.error || 'FASHN try-on failed');
      }

    } catch (error) {
      console.error('❌ [EXTERNAL-TRYON] External try-on failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        originalProduct: product
      };
    }
  }

  /**
   * Validate that an external image URL is accessible
   */
  private async validateExternalImage(imageUrl: string): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    try {
      // Basic URL validation
      if (!imageUrl || !imageUrl.startsWith('http')) {
        return {
          isValid: false,
          error: 'Invalid image URL format'
        };
      }

      // Try to fetch the image (HEAD request to check accessibility)
      const response = await fetch(imageUrl, {
        method: 'HEAD',
        mode: 'cors',
        // Add a reasonable timeout
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return {
          isValid: false,
          error: `Image not accessible: ${response.status} ${response.statusText}`
        };
      }

      // Check if it's actually an image
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.startsWith('image/')) {
        return {
          isValid: false,
          error: 'URL does not point to an image'
        };
      }

      return { isValid: true };

    } catch (error) {
      // If HEAD request fails due to CORS, try a different approach
      if (error instanceof Error && error.name === 'TypeError') {
        // CORS error - try to proceed anyway as FASHN might be able to access it
        console.warn('⚠️ [EXTERNAL-TRYON] CORS blocked direct validation, proceeding with try-on');
        return { isValid: true };
      }

      return {
        isValid: false,
        error: `Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get category suggestion based on product title/description
   */
  private suggestCategory(product: ProductSearchResult): 'tops' | 'bottoms' | 'one-pieces' | 'auto' {
    const title = product.title?.toLowerCase() || '';

    // One-pieces
    if (title.includes('dress') || title.includes('jumpsuit') || title.includes('romper') ||
        title.includes('overall') || title.includes('bodysuit')) {
      return 'one-pieces';
    }

    // Tops
    if (title.includes('shirt') || title.includes('top') || title.includes('blouse') ||
        title.includes('sweater') || title.includes('jacket') || title.includes('hoodie') ||
        title.includes('blazer') || title.includes('cardigan')) {
      return 'tops';
    }

    // Bottoms
    if (title.includes('pants') || title.includes('jeans') || title.includes('shorts') ||
        title.includes('skirt') || title.includes('trouser') || title.includes('leggings')) {
      return 'bottoms';
    }

    // Default to auto-detection
    return 'auto';
  }
}

// Export singleton instance
export const externalTryOnService = new ExternalTryOnService();
export default externalTryOnService;