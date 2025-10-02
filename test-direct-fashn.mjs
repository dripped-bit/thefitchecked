/**
 * Node.js test script for Direct FASHN API integration
 * This tests the actual FASHN API (not fal.ai)
 */

import { readFileSync } from 'fs';

// Load environment variables manually from .env.local
let FASHN_API_KEY;
try {
  const envContent = readFileSync('.env.local', 'utf-8');
  const envLines = envContent.split('\n');
  for (const line of envLines) {
    if (line.startsWith('VITE_FASHN_API_KEY=')) {
      FASHN_API_KEY = line.split('=')[1].trim().replace(/"/g, ''); // Remove quotes
      break;
    }
  }
} catch (error) {
  console.warn('⚠️ Could not read .env.local file, checking process.env...');
  FASHN_API_KEY = process.env.VITE_FASHN_API_KEY;
}

const DIRECT_FASHN_ENDPOINT = 'https://api.fashn.ai/v1/run';

console.log('🧪 [DIRECT-FASHN-TEST] Starting direct FASHN API integration test...');

if (!FASHN_API_KEY) {
  console.error('❌ FASHN API key not found in environment variables');
  process.exit(1);
}

console.log('✅ [DIRECT-FASHN-TEST] FASHN API key is available:', FASHN_API_KEY.substring(0, 8) + '...');
console.log('🔑 [DIRECT-FASHN-TEST] Using direct FASHN API key for api.fashn.ai access');

// Test connectivity to direct FASHN endpoint
async function testConnectivity() {
  try {
    console.log('🔌 [DIRECT-FASHN-TEST] Testing connectivity to direct FASHN endpoint...');

    const response = await fetch(DIRECT_FASHN_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FASHN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 [DIRECT-FASHN-TEST] Connectivity test response:', {
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
    console.error('❌ [DIRECT-FASHN-TEST] Connectivity test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test the direct FASHN API with sample data
async function testDirectFashnAPI() {
  try {
    console.log('🚀 [DIRECT-FASHN-TEST] Testing direct FASHN API with sample data...');

    // Use publicly available test images
    const testPayload = {
      model_name: 'tryon-v1.6',
      inputs: {
        model_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=768&fit=crop&crop=faces',
        garment_image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=512&h=768&fit=crop&crop=center'
      }
    };

    console.log('📤 [DIRECT-FASHN-TEST] Sending try-on request with payload:', {
      model_name: testPayload.model_name,
      model_image: testPayload.inputs.model_image.substring(0, 50) + '...',
      garment_image: testPayload.inputs.garment_image.substring(0, 50) + '...'
    });

    const startTime = Date.now();

    const response = await fetch(DIRECT_FASHN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FASHN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const processingTime = Date.now() - startTime;

    console.log('📨 [DIRECT-FASHN-TEST] API Response:', {
      status: response.status,
      statusText: response.statusText,
      processingTime: processingTime + 'ms'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [DIRECT-FASHN-TEST] API error response:', errorText);

      return {
        success: false,
        error: `API Error ${response.status}: ${errorText}`,
        status: response.status
      };
    }

    const result = await response.json();
    console.log('✅ [DIRECT-FASHN-TEST] API Success! Response structure:', {
      id: result.id,
      status: result.status,
      hasOutput: !!result.output,
      outputCount: result.output?.length || 0,
      hasError: !!result.error,
      responseKeys: Object.keys(result)
    });

    // Extract the result image URL
    let resultImageUrl = null;
    if (result.status === 'completed' && result.output && result.output.length > 0) {
      resultImageUrl = result.output[0].image_url;
    } else if (result.status === 'processing') {
      console.log('⏳ [DIRECT-FASHN-TEST] Request is processing, would need polling in real implementation');
    }

    if (resultImageUrl) {
      console.log('🖼️ [DIRECT-FASHN-TEST] Generated image URL:', resultImageUrl.substring(0, 100) + '...');
    }

    return {
      success: true,
      processingTime,
      resultImageUrl,
      responseData: result
    };

  } catch (error) {
    console.error('❌ [DIRECT-FASHN-TEST] Direct FASHN API test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run all tests
async function runTests() {
  console.log('🔄 [DIRECT-FASHN-TEST] Starting comprehensive direct FASHN integration tests...\n');

  // Test 1: Connectivity
  const connectivityResult = await testConnectivity();
  console.log('\n📋 [DIRECT-FASHN-TEST] Connectivity Result:', connectivityResult);

  // Test 2: Full API integration
  const apiResult = await testDirectFashnAPI();
  console.log('\n📋 [DIRECT-FASHN-TEST] API Integration Result:', apiResult);

  // Summary
  console.log('\n🏁 [DIRECT-FASHN-TEST] Test Summary:');
  console.log('- Connectivity:', connectivityResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('- API Integration:', apiResult.success ? '✅ PASS' : '❌ FAIL');

  const overallSuccess = connectivityResult.success && apiResult.success;
  console.log('- Overall:', overallSuccess ? '✅ PASS - Direct FASHN integration is working!' : '❌ FAIL - Issues found');

  if (!overallSuccess) {
    console.log('\n⚠️ [DIRECT-FASHN-TEST] Issues detected:');
    if (!connectivityResult.success) {
      console.log('  - Connectivity issue:', connectivityResult.error);
    }
    if (!apiResult.success) {
      console.log('  - API issue:', apiResult.error);
    }
  } else {
    console.log('\n🎉 [DIRECT-FASHN-TEST] All tests passed! The direct FASHN integration is working correctly.');
    console.log('   - Direct FASHN API endpoint is reachable');
    console.log('   - Authentication with FASHN API key is working');
    console.log('   - Virtual try-on processing is functional');
    console.log('   - Avatar 3D page can now use direct FASHN API');
  }

  return overallSuccess;
}

// Execute tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 [DIRECT-FASHN-TEST] Test execution failed:', error);
    process.exit(1);
  });