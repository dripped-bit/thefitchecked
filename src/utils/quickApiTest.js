// Quick API Test - Copy and paste this entire block into browser console

console.log('🧪 Starting Quick API Test...');

async function quickFalTest() {
  try {
    console.log('📤 Testing FAL API proxy connection...');

    const testRequest = {
      prompt: 'simple test image of a person standing',
      image_size: { width: 512, height: 512 },
      num_images: 1,
      enable_safety_checker: false
    };

    console.log('🎯 Endpoint: /api/fal/fal-ai/bytedance/seedream/v4/text-to-image');
    console.log('📋 Request:', testRequest);

    const response = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    console.log('📊 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return { success: false, error: `${response.status}: ${errorText}` };
    }

    const result = await response.json();
    console.log('✅ SUCCESS! API Response:', {
      hasImages: !!(result?.images),
      imageCount: result?.images?.length || 0,
      firstImageUrl: result?.images?.[0]?.url ? 'Image URL received!' : 'No image URL',
      responseKeys: Object.keys(result)
    });

    return { success: true, result };

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
quickFalTest().then(result => {
  if (result.success) {
    console.log('🎉 API TEST PASSED! The FAL proxy is working correctly.');
  } else {
    console.log('💥 API TEST FAILED:', result.error);
  }
});