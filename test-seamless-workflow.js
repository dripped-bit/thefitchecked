/**
 * Node.js test script to verify the seamless workflow APIs
 * This tests the API endpoints that the seamless service uses
 */

import http from 'http';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5173',
  testClothing: 'red casual t-shirt',
  testAvatarUrl: 'https://fal.media/files/lion/test-avatar.jpg'
};

/**
 * Make HTTP request to test API endpoint
 */
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

/**
 * Test Claude API endpoint
 */
async function testClaudeAPI() {
  console.log('🤖 Testing Claude API endpoint...');

  try {
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: '/api/claude/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const postData = JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: 'Reply with "API Working" if you receive this message.'
      }]
    });

    const response = await makeRequest(options, postData);

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      const content = data.content?.[0]?.text || '';
      console.log('✅ Claude API: Working');
      console.log(`   Response: "${content}"`);
      return true;
    } else {
      console.log(`❌ Claude API: Failed (${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Claude API: Error - ${error.message}`);
    return false;
  }
}

/**
 * Test Seedream text-to-image API endpoint
 */
async function testSeedreamTextToImage() {
  console.log('👔 Testing Seedream text-to-image API endpoint...');

  try {
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: '/api/fal/fal-ai/bytedance/seedream/v4/text-to-image',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const postData = JSON.stringify({
      prompt: 'red casual t-shirt, clothing item photography, white background, high resolution',
      negative_prompt: 'blurry, low quality, distorted',
      image_size: { width: 512, height: 768 },
      num_inference_steps: 20,
      guidance_scale: 8.0,
      num_images: 1,
      seed: 123456,
      enable_safety_checker: true,
      safety_tolerance: 2,
      scheduler: 'DPM++ 2M Karras'
    });

    const response = await makeRequest(options, postData);

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      const imageUrl = data.images?.[0]?.url || data.data?.images?.[0]?.url;
      if (imageUrl) {
        console.log('✅ Seedream Text-to-Image: Working');
        console.log(`   Generated image URL: ${imageUrl.substring(0, 50)}...`);
        return true;
      } else {
        console.log('❌ Seedream Text-to-Image: No image URL in response');
        return false;
      }
    } else {
      console.log(`❌ Seedream Text-to-Image: Failed (${response.statusCode})`);
      console.log(`   Error: ${response.body.substring(0, 200)}...`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Seedream Text-to-Image: Error - ${error.message}`);
    return false;
  }
}

/**
 * Test Virtual Try-On API endpoint
 */
async function testVirtualTryOn() {
  console.log('👤 Testing Virtual Try-On API endpoint...');

  try {
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: '/api/fal/fal-ai/image-apps-v2/virtual-try-on',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const postData = JSON.stringify({
      person_image_url: TEST_CONFIG.testAvatarUrl,
      clothing_image_url: 'https://fal.media/files/lion/test-garment.jpg',
      preserve_pose: true
    });

    const response = await makeRequest(options, postData);

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      const imageUrl = data.image?.url || data.data?.image?.url;
      if (imageUrl) {
        console.log('✅ Virtual Try-On: Working');
        console.log(`   Try-on result URL: ${imageUrl.substring(0, 50)}...`);
        return true;
      } else {
        console.log('❌ Virtual Try-On: No image URL in response');
        return false;
      }
    } else {
      console.log(`❌ Virtual Try-On: Failed (${response.statusCode})`);
      console.log(`   Error: ${response.body.substring(0, 200)}...`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Virtual Try-On: Error - ${error.message}`);
    return false;
  }
}

/**
 * Check if the development server is running
 */
async function checkServer() {
  console.log('🌐 Checking development server...');

  try {
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: '/',
      method: 'GET'
    };

    const response = await makeRequest(options);

    if (response.statusCode === 200) {
      console.log('✅ Development server: Running');
      return true;
    } else {
      console.log(`❌ Development server: Unexpected status (${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Development server: Not accessible - ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 SEAMLESS TRY-ON API ENDPOINT TESTS');
  console.log('=====================================');
  console.log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`Test Clothing: "${TEST_CONFIG.testClothing}"`);
  console.log(`Test Avatar: ${TEST_CONFIG.testAvatarUrl}`);
  console.log('');

  const results = {
    server: await checkServer(),
    claude: await testClaudeAPI(),
    seedream: await testSeedreamTextToImage(),
    tryOn: await testVirtualTryOn()
  };

  console.log('');
  console.log('📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  console.log(`Development Server: ${results.server ? '✅' : '❌'}`);
  console.log(`Claude API: ${results.claude ? '✅' : '❌'}`);
  console.log(`Seedream Text-to-Image: ${results.seedream ? '✅' : '❌'}`);
  console.log(`Virtual Try-On: ${results.tryOn ? '✅' : '❌'}`);

  const allWorking = Object.values(results).every(Boolean);
  console.log('');
  console.log(`Overall Status: ${allWorking ? '🎉 ALL APIS WORKING!' : '⚠️ SOME ISSUES DETECTED'}`);

  if (allWorking) {
    console.log('');
    console.log('✨ The seamless workflow is ready for testing!');
    console.log('   Open http://localhost:5173/ in your browser');
    console.log('   1. Upload an avatar image');
    console.log('   2. Enter a clothing description (e.g., "red t-shirt")');
    console.log('   3. Click "Generate & Try On" button');
    console.log('   4. Watch the seamless two-step process!');
  }

  process.exit(allWorking ? 0 : 1);
}

// Run the tests
runAllTests().catch(console.error);