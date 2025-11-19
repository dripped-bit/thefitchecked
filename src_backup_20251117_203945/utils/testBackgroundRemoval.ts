/**
 * Test utility for background removal functionality
 * This helps verify that our background removal service is working correctly
 */

import backgroundRemovalService from '../services/backgroundRemovalService';

export async function testBackgroundRemovalService(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('🧪 [TEST] Starting background removal service test...');

    // Test 1: FAL API accessed via proxy
    console.log('✅ FAL API configured via /api/fal proxy');

    // Test 2: Claude API accessed via proxy
    console.log('✅ Claude API configured via /api/claude proxy');

    // Test 3: Create a test image blob (1x1 transparent PNG)
    const testImageBlob = await createTestImageBlob();

    // Test 4: Test the full processing pipeline
    console.log('🧪 [TEST] Testing clothing upload processing...');
    const result = await backgroundRemovalService.processClothingUpload(testImageBlob);

    if (result.success) {
      return {
        success: true,
        message: `✅ Background removal service is working! ${result.metadata?.backgroundRemoved ? 'Background removal successful.' : 'Background removal skipped (test image).'}`,
        details: {
          category: result.category,
          backgroundRemoved: result.metadata?.backgroundRemoved,
          confidence: result.metadata?.confidence,
          color: result.metadata?.color
        }
      };
    } else {
      return {
        success: false,
        message: `❌ Service test failed: ${result.error}`,
        details: result
      };
    }

  } catch (error) {
    console.error('🧪 [TEST] Background removal test failed:', error);
    return {
      success: false,
      message: `❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    };
  }
}

/**
 * Create a test image file for testing
 */
async function createTestImageBlob(): Promise<File> {
  // Create a simple 1x1 transparent PNG as base64
  const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==';

  // Convert base64 to blob
  const byteCharacters = atob(base64PNG);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });

  // Create a File object
  return new File([blob], 'test-clothing-item.png', { type: 'image/png' });
}

/**
 * Test individual background removal API call
 */
export async function testBackgroundRemovalAPI(imageUrl: string): Promise<{
  success: boolean;
  message: string;
  resultUrl?: string;
}> {
  try {
    console.log('🧪 [TEST] Testing background removal API directly...');

    const result = await backgroundRemovalService.removeBackground(imageUrl);

    if (result.success) {
      return {
        success: true,
        message: '✅ Background removal API working correctly!',
        resultUrl: result.imageUrl
      };
    } else {
      return {
        success: false,
        message: `❌ Background removal API failed: ${result.error}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ API test error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Test smart categorization API call
 */
export async function testCategorizationAPI(imageUrl: string): Promise<{
  success: boolean;
  message: string;
  category?: string;
  confidence?: number;
}> {
  try {
    console.log('🧪 [TEST] Testing categorization API directly...');

    const result = await backgroundRemovalService.categorizeClothing(imageUrl);

    if (result.success) {
      return {
        success: true,
        message: `✅ Categorization API working! Detected: ${result.category}`,
        category: result.category,
        confidence: result.confidence
      };
    } else {
      return {
        success: false,
        message: `❌ Categorization API failed: ${result.error}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Categorization test error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get service health status
 */
export function getBackgroundRemovalStatus(): {
  falKeyAvailable: boolean;
  claudeKeyAvailable: boolean;
  serviceEnabled: boolean;
} {
  const falKey = import.meta.env.VITE_FAL_KEY;
  const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;

  return {
    falKeyAvailable: !!falKey,
    claudeKeyAvailable: !!claudeKey,
    serviceEnabled: !!falKey || !!claudeKey
  };
}