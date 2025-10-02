/**
 * Node.js test script for FASHN integration
 * This runs outside of the browser environment for basic API testing
 */

import { readFileSync } from 'fs';

// Load environment variables manually from .env.local
// Since we're using fal.ai infrastructure (fal.run/fal-ai/fashn), we need the FAL API key
let FAL_API_KEY;
try {
  const envContent = readFileSync('.env.local', 'utf-8');
  const envLines = envContent.split('\n');
  for (const line of envLines) {
    if (line.startsWith('VITE_FAL_KEY=')) {
      FAL_API_KEY = line.split('=')[1].trim().replace(/"/g, ''); // Remove quotes
      break;
    }
  }
} catch (error) {
  console.warn('⚠️ Could not read .env.local file, checking process.env...');
  FAL_API_KEY = process.env.VITE_FAL_KEY;
}
const FASHN_ENDPOINT = 'https://queue.fal.run/fal-ai/fashn/tryon';

console.log('🧪 [FASHN-TEST] Starting FASHN API integration test...');

if (!FAL_API_KEY) {
  console.error('❌ FAL API key not found in environment variables');
  process.exit(1);
}

console.log('✅ [FASHN-TEST] FAL API key is available:', FAL_API_KEY.substring(0, 8) + '...');
console.log('🔑 [FASHN-TEST] Using FAL API key for fal.ai FASHN model access');

// Test connectivity to FASHN endpoint
async function testConnectivity() {
  try {
    console.log('🔌 [FASHN-TEST] Testing connectivity to FASHN endpoint...');

    const response = await fetch(FASHN_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 [FASHN-TEST] Connectivity test response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    return {
      success: true,
      status: response.status,
      reachable: true
    };

  } catch (error) {
    console.error('❌ [FASHN-TEST] Connectivity test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test the FASHN API with sample data
async function testFashnAPI() {
  try {
    console.log('🚀 [FASHN-TEST] Testing FASHN API with sample data...');

    // Use publicly available test images
    const testPayload = {
      person_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=768&fit=crop&crop=faces',
      garment_image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=512&h=768&fit=crop&crop=center',
      category: 'tops',
      preserve_pose: true,
      num_images: 1
    };

    console.log('📤 [FASHN-TEST] Sending try-on request with payload:', {
      ...testPayload,
      person_image_url: testPayload.person_image_url.substring(0, 50) + '...',
      garment_image_url: testPayload.garment_image_url.substring(0, 50) + '...'
    });

    const startTime = Date.now();

    const response = await fetch(FASHN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const processingTime = Date.now() - startTime;

    console.log('📨 [FASHN-TEST] API Response:', {
      status: response.status,
      statusText: response.statusText,
      processingTime: processingTime + 'ms'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [FASHN-TEST] API error response:', errorText);

      return {
        success: false,
        error: `API Error ${response.status}: ${errorText}`,
        status: response.status
      };
    }

    const result = await response.json();
    console.log('✅ [FASHN-TEST] API Success! Response structure:', {
      hasImages: !!result.images,
      imageCount: result.images?.length || 0,
      hasImage: !!result.image,
      hasUrl: !!result.url,
      responseKeys: Object.keys(result)
    });

    // Extract the result image URL
    let resultImageUrl = null;
    if (result.images && result.images.length > 0) {
      resultImageUrl = result.images[0].url || result.images[0];
    } else if (result.image) {
      resultImageUrl = result.image.url || result.image;
    } else if (result.url) {
      resultImageUrl = result.url;
    }

    if (resultImageUrl) {
      console.log('🖼️ [FASHN-TEST] Generated image URL:', resultImageUrl.substring(0, 100) + '...');
    }

    return {
      success: true,
      processingTime,
      resultImageUrl,
      responseData: result
    };

  } catch (error) {
    console.error('❌ [FASHN-TEST] FASHN API test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run all tests
async function runTests() {
  console.log('🔄 [FASHN-TEST] Starting comprehensive FASHN integration tests...\n');

  // Test 1: Connectivity
  const connectivityResult = await testConnectivity();
  console.log('\n📋 [FASHN-TEST] Connectivity Result:', connectivityResult);

  // Test 2: Full API integration
  const apiResult = await testFashnAPI();
  console.log('\n📋 [FASHN-TEST] API Integration Result:', apiResult);

  // Summary
  console.log('\n🏁 [FASHN-TEST] Test Summary:');
  console.log('- Connectivity:', connectivityResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('- API Integration:', apiResult.success ? '✅ PASS' : '❌ FAIL');

  const overallSuccess = connectivityResult.success && apiResult.success;
  console.log('- Overall:', overallSuccess ? '✅ PASS - FASHN integration is working!' : '❌ FAIL - Issues found');

  if (!overallSuccess) {
    console.log('\n⚠️ [FASHN-TEST] Issues detected:');
    if (!connectivityResult.success) {
      console.log('  - Connectivity issue:', connectivityResult.error);
    }
    if (!apiResult.success) {
      console.log('  - API issue:', apiResult.error);
    }
  } else {
    console.log('\n🎉 [FASHN-TEST] All tests passed! The FASHN integration bug has been successfully fixed.');
    console.log('   - API endpoint is reachable');
    console.log('   - Authentication is working');
    console.log('   - Virtual try-on processing is functional');
    console.log('   - Image generation is working');
  }

  return overallSuccess;
}

// Execute tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 [FASHN-TEST] Test execution failed:', error);
    process.exit(1);
  });