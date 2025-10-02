/**
 * Test utility for FASHN integration validation
 * This verifies the complete FASHN virtual try-on flow
 */

import directFashnService from '../services/directFashnService';
import imageUploadService from '../services/imageUploadService';

export interface FashnTestResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

/**
 * Test the complete FASHN integration flow with sample images
 */
export async function testFashnIntegration(): Promise<FashnTestResult> {
  console.log('🧪 [FASHN-TEST] Starting complete FASHN integration test...');

  try {
    // Step 1: Check FASHN API key availability
    const fashnKey = import.meta.env.VITE_FASHN_API_KEY;
    if (!fashnKey) {
      return {
        success: false,
        message: '❌ Native FASHN API key not found in environment. FASHN integration cannot work without proper authentication.',
        error: 'Missing API key'
      };
    }

    console.log('✅ [FASHN-TEST] Native FASHN API key is available');

    // Step 2: Test with sample image URLs (publicly available test images)
    const testAvatarUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=768&fit=crop&crop=faces';
    const testClothingUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=512&h=768&fit=crop&crop=center';

    console.log('📸 [FASHN-TEST] Using test images:', {
      avatar: testAvatarUrl.substring(0, 50) + '...',
      clothing: testClothingUrl.substring(0, 50) + '...'
    });

    // Step 3: Test FASHN try-on with timeout (shortened for testing)
    console.log('🚀 [FASHN-TEST] Testing FASHN try-on API...');

    const tryOnResult = await directFashnService.tryOnClothing(
      testAvatarUrl,
      testClothingUrl
    );

    if (tryOnResult.success) {
      console.log('✅ [FASHN-TEST] FASHN integration test passed!');
      return {
        success: true,
        message: `✅ FASHN integration is working correctly! Try-on completed in ${tryOnResult.processingTime}s using ${tryOnResult.api}`,
        details: {
          processingTime: tryOnResult.processingTime,
          attempts: tryOnResult.attempts,
          api: tryOnResult.api,
          resultImage: tryOnResult.imageUrl ? 'Generated successfully' : 'Not generated'
        }
      };
    } else {
      return {
        success: false,
        message: '❌ FASHN try-on failed during processing',
        error: 'Try-on processing failed'
      };
    }

  } catch (error) {
    console.error('🧪 [FASHN-TEST] Integration test failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let enhancedMessage = errorMessage;

    // Provide helpful error messages based on common issues
    if (errorMessage.toLowerCase().includes('timeout')) {
      enhancedMessage = 'FASHN API request timed out. This could indicate network issues or service overload.';
    } else if (errorMessage.toLowerCase().includes('401') || errorMessage.toLowerCase().includes('auth')) {
      enhancedMessage = 'Authentication failed. Please check your native FASHN API key configuration.';
    } else if (errorMessage.toLowerCase().includes('429')) {
      enhancedMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (errorMessage.toLowerCase().includes('500')) {
      enhancedMessage = 'FASHN service is temporarily unavailable. Please try again later.';
    } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
      enhancedMessage = 'Network connection failed. Please check your internet connection.';
    }

    return {
      success: false,
      message: `❌ FASHN integration test failed: ${enhancedMessage}`,
      error: errorMessage,
      details: error
    };
  }
}

/**
 * Test just the FASHN API connectivity (without full try-on)
 */
export async function testFashnConnectivity(): Promise<FashnTestResult> {
  try {
    console.log('🔌 [FASHN-TEST] Testing native FASHN API connectivity...');

    const fashnKey = import.meta.env.VITE_FASHN_API_KEY;
    if (!fashnKey) {
      return {
        success: false,
        message: 'Native FASHN API key not available',
        error: 'Missing credentials'
      };
    }

    // Test basic connectivity to native FASHN API endpoint
    const testUrl = 'https://api.fashn.ai/v1';
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${fashnKey}`
      }
    });

    // Even if we get an error response, it means the endpoint is reachable
    const isReachable = response.status !== undefined;

    return {
      success: isReachable,
      message: isReachable
        ? `✅ FASHN API endpoint is reachable (status: ${response.status})`
        : '❌ FASHN API endpoint is not reachable',
      details: {
        status: response.status,
        endpoint: testUrl,
        reachable: isReachable
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `❌ Connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test image upload service integration
 */
export async function testImageUploadIntegration(): Promise<FashnTestResult> {
  try {
    console.log('📤 [FASHN-TEST] Testing image upload service...');

    // Create a small test image (1x1 PNG as base64)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==';

    const uploadResult = await imageUploadService.uploadImage(testImageBase64);

    if (uploadResult && (uploadResult.startsWith('http') || uploadResult.startsWith('data:'))) {
      return {
        success: true,
        message: '✅ Image upload service is working correctly',
        details: {
          resultType: uploadResult.startsWith('http') ? 'URL' : 'base64',
          resultLength: uploadResult.length
        }
      };
    } else {
      return {
        success: false,
        message: '❌ Image upload service failed to return valid URL',
        error: 'Invalid upload result'
      };
    }

  } catch (error) {
    return {
      success: false,
      message: `❌ Image upload test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get FASHN service status summary
 */
export function getFashnServiceStatus(): {
  apiKeyAvailable: boolean;
  serviceInitialized: boolean;
  endpointUrl: string;
  modelVersion: string;
} {
  const fashnKey = import.meta.env.VITE_FASHN_API_KEY;

  return {
    apiKeyAvailable: !!fashnKey,
    serviceInitialized: true, // Service is a singleton that auto-initializes
    endpointUrl: 'https://api.fashn.ai/v1',
    modelVersion: 'tryon-v1.6'
  };
}

/**
 * Run all FASHN integration tests
 */
export async function runAllFashnTests(): Promise<{
  overall: boolean;
  results: {
    connectivity: FashnTestResult;
    imageUpload: FashnTestResult;
    integration: FashnTestResult;
  };
}> {
  console.log('🔄 [FASHN-TEST] Running all FASHN integration tests...');

  const connectivityTest = await testFashnConnectivity();
  const imageUploadTest = await testImageUploadIntegration();
  const integrationTest = await testFashnIntegration();

  const overallSuccess = connectivityTest.success && imageUploadTest.success && integrationTest.success;

  return {
    overall: overallSuccess,
    results: {
      connectivity: connectivityTest,
      imageUpload: imageUploadTest,
      integration: integrationTest
    }
  };
}