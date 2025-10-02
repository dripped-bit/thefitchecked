/**
 * Test API Connection Directly
 * Test if the FAL API proxy is working correctly
 */

/**
 * Test the FAL API proxy connection with a minimal request
 */
export async function testFalApiConnection(): Promise<void> {
  console.log('🧪 [API-TEST] Testing FAL API proxy connection...');

  try {
    const testRequest = {
      prompt: 'simple test image of a person standing',
      image_size: { width: 512, height: 512 },
      num_images: 1,
      enable_safety_checker: false
    };

    console.log('📤 [API-TEST] Sending test request...');
    console.log('🎯 [API-TEST] Endpoint: /api/fal/fal-ai/bytedance/seedream/v4/text-to-image');

    const response = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    console.log('📊 [API-TEST] Response status:', response.status, response.statusText);
    console.log('📋 [API-TEST] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API-TEST] Error response:', errorText);
      throw new Error(`API test failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ [API-TEST] Success! Response received:', {
      hasImages: !!(result?.images),
      imageCount: result?.images?.length || 0,
      firstImageUrl: result?.images?.[0]?.url?.substring(0, 100) + '...' || 'no URL',
      responseKeys: Object.keys(result)
    });

    return result;

  } catch (error) {
    console.error('❌ [API-TEST] Connection test failed:', error);
    throw error;
  }
}

/**
 * Test CGI service directly
 */
export async function testCgiService(): Promise<void> {
  console.log('🧪 [CGI-SERVICE-TEST] Testing CGI service directly...');

  try {
    // Import the service
    const { cgiAvatarGenerationService } = await import('../services/cgiAvatarGenerationService');

    // Test the connection method
    const result = await cgiAvatarGenerationService.testConnection();

    console.log('📊 [CGI-SERVICE-TEST] Test connection result:', result);

    if (result.success) {
      console.log('✅ [CGI-SERVICE-TEST] CGI service connection successful!');
    } else {
      console.error('❌ [CGI-SERVICE-TEST] CGI service connection failed:', result.error);
    }

  } catch (error) {
    console.error('❌ [CGI-SERVICE-TEST] Service test failed:', error);
  }
}

/**
 * Check if CGI generation would trigger with sample data
 */
export function checkCgiTriggerConditions(): void {
  console.log('🧪 [CGI-TRIGGER-TEST] Checking CGI trigger conditions...');

  // Simulate the conditions from AvatarMeasurementsPage
  const mockAvatarData = {
    headPhotoData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...', // Mock base64
    readyForCGI: true
  };

  const mockUploadedPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...';

  const headPhotoData = mockAvatarData?.headPhotoData || mockUploadedPhoto;
  const wouldTrigger = headPhotoData && mockAvatarData?.readyForCGI;

  console.log('📋 [CGI-TRIGGER-TEST] Conditions check:', {
    hasHeadPhotoData: !!headPhotoData,
    readyForCGI: mockAvatarData?.readyForCGI,
    wouldTriggerCGI: wouldTrigger,
    headPhotoSource: mockAvatarData?.headPhotoData ? 'avatarData.headPhotoData' : 'uploadedPhoto'
  });

  if (wouldTrigger) {
    console.log('✅ [CGI-TRIGGER-TEST] CGI generation WOULD trigger with this data');
  } else {
    console.log('❌ [CGI-TRIGGER-TEST] CGI generation would NOT trigger - missing conditions');
  }
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testFalApiConnection = testFalApiConnection;
  (window as any).testCgiService = testCgiService;
  (window as any).checkCgiTriggerConditions = checkCgiTriggerConditions;

  console.log('🧪 [API-TEST] Test functions available in browser console:');
  console.log('- testFalApiConnection() - Test proxy connection');
  console.log('- testCgiService() - Test CGI service');
  console.log('- checkCgiTriggerConditions() - Check trigger logic');
}

export default {
  testFalApiConnection,
  testCgiService,
  checkCgiTriggerConditions
};