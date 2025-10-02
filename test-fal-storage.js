/**
 * Test FAL Storage Upload Functionality
 * Isolate and debug the storage upload issue
 */

import { fal } from '@fal-ai/client';

// Configure fal with API key
const falApiKey = process.env.VITE_FAL_KEY || "c8504b08-f57b-4bc2-8456-f68381053b3b:bd3a70e5187ff04c3c74a3d3e7fad404";

console.log('🔧 FAL Storage Upload Test');
console.log('='.repeat(50));

console.log('FAL API Key configured:', !!falApiKey);
console.log('FAL API Key length:', falApiKey?.length || 0);

if (!falApiKey) {
  console.error('❌ No FAL API key found!');
  process.exit(1);
}

fal.config({
  credentials: falApiKey
});

console.log('✅ FAL client configured');

async function testStorageUpload() {
  try {
    console.log('\n🧪 Testing FAL storage upload with simple text file...');

    // Create a simple test file
    const testFile = new File(['Hello, World!'], 'test.txt', { type: 'text/plain' });
    console.log('📄 Test file created:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });

    // Attempt upload
    console.log('📤 Uploading to FAL storage...');
    const uploadResult = await fal.storage.upload(testFile);
    console.log('✅ Upload successful:', uploadResult);

    return uploadResult;

  } catch (error) {
    console.error('❌ FAL storage upload failed:', error);
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function testImageDataUrlUpload() {
  try {
    console.log('\n🖼️  Testing FAL storage upload with image data URL...');

    // Create a minimal PNG data URL (1x1 transparent pixel)
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    console.log('🔍 Data URL length:', dataUrl.length);

    // Convert to blob
    console.log('🔄 Converting data URL to blob...');
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    console.log('📦 Blob created:', {
      size: blob.size,
      type: blob.type
    });

    // Create File from blob
    const imageFile = new File([blob], 'test.png', { type: 'image/png' });
    console.log('📄 Image file created:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });

    // Attempt upload
    console.log('📤 Uploading image to FAL storage...');
    const uploadResult = await fal.storage.upload(imageFile);
    console.log('✅ Image upload successful:', uploadResult);

    return uploadResult;

  } catch (error) {
    console.error('❌ FAL image storage upload failed:', error);
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function runTests() {
  console.log('\n🚀 Starting FAL storage tests...');

  // Test 1: Simple text file upload
  const textResult = await testStorageUpload();

  // Test 2: Image data URL upload
  const imageResult = await testImageDataUrlUpload();

  console.log('\n📊 Test Results:');
  console.log('Text file upload:', textResult ? '✅ Success' : '❌ Failed');
  console.log('Image file upload:', imageResult ? '✅ Success' : '❌ Failed');

  if (textResult && imageResult) {
    console.log('\n✅ All tests passed! FAL storage is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.');
  }
}

// Run the tests
runTests().catch(console.error);