/**
 * Supabase Storage Test Utility
 * Use this to verify avatar storage bucket is configured correctly
 */

import { supabase } from '../services/supabaseClient';

/**
 * Test upload with a base64 image
 */
export async function testBase64Upload(): Promise<void> {
  console.log('🧪 [TEST] Testing Supabase Storage upload with base64 image...');

  // Create a simple 1x1 red pixel PNG as base64
  const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

  // Convert base64 to blob
  const base64Data = testImageBase64.split(',')[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'image/png' });

  // Upload to Supabase Storage
  const testPath = `test/test-${Date.now()}.png`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(testPath, blob, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'image/png'
    });

  if (error) {
    console.error('❌ [TEST] Upload failed:', error);
    return;
  }

  console.log('✅ [TEST] Upload successful:', data);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(testPath);

  console.log('🔗 [TEST] Public URL:', urlData.publicUrl);

  // Test if URL is accessible
  try {
    const response = await fetch(urlData.publicUrl);
    if (response.ok) {
      console.log('✅ [TEST] Public URL is accessible');
    } else {
      console.error('❌ [TEST] Public URL returned:', response.status);
    }
  } catch (err) {
    console.error('❌ [TEST] Failed to fetch public URL:', err);
  }

  // Clean up test file
  const { error: deleteError } = await supabase.storage
    .from('avatars')
    .remove([testPath]);

  if (deleteError) {
    console.warn('⚠️ [TEST] Failed to delete test file:', deleteError);
  } else {
    console.log('🗑️ [TEST] Test file cleaned up');
  }
}

/**
 * Test upload with file input
 */
export async function testFileUpload(file: File): Promise<void> {
  console.log('🧪 [TEST] Testing Supabase Storage upload with file:', file.name);

  const testPath = `test/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(testPath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('❌ [TEST] Upload failed:', error);
    return;
  }

  console.log('✅ [TEST] Upload successful:', data);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(testPath);

  console.log('🔗 [TEST] Public URL:', urlData.publicUrl);

  // Clean up test file
  const { error: deleteError } = await supabase.storage
    .from('avatars')
    .remove([testPath]);

  if (deleteError) {
    console.warn('⚠️ [TEST] Failed to delete test file:', deleteError);
  } else {
    console.log('🗑️ [TEST] Test file cleaned up');
  }
}

/**
 * Test database insert
 */
export async function testDatabaseInsert(): Promise<void> {
  console.log('🧪 [TEST] Testing avatars table insert...');

  const testAvatar = {
    user_id: 'test-user',
    name: 'Test Avatar',
    storage_path: 'https://example.com/test.png',
    is_default: false,
    is_perfect: false,
    metadata: { quality: 'test', source: 'test' },
    try_on_history: []
  };

  const { data, error } = await supabase
    .from('avatars')
    .insert(testAvatar)
    .select()
    .single();

  if (error) {
    console.error('❌ [TEST] Database insert failed:', error);
    return;
  }

  console.log('✅ [TEST] Database insert successful:', data);

  // Clean up test record
  const { error: deleteError } = await supabase
    .from('avatars')
    .delete()
    .eq('id', data.id);

  if (deleteError) {
    console.warn('⚠️ [TEST] Failed to delete test record:', deleteError);
  } else {
    console.log('🗑️ [TEST] Test record cleaned up');
  }
}

/**
 * Run all tests
 */
export async function runAllStorageTests(): Promise<void> {
  console.log('🚀 [TEST] Running all Supabase Storage tests...\n');

  try {
    await testBase64Upload();
    console.log('\n');
    await testDatabaseInsert();
    console.log('\n✅ [TEST] All tests completed!');
  } catch (error) {
    console.error('❌ [TEST] Test suite failed:', error);
  }
}

// Browser console helpers
if (typeof window !== 'undefined') {
  (window as any).testSupabaseStorage = {
    testBase64Upload,
    testFileUpload,
    testDatabaseInsert,
    runAllStorageTests
  };
  console.log('💡 [TEST] Supabase Storage tests available:');
  console.log('  - window.testSupabaseStorage.runAllStorageTests()');
  console.log('  - window.testSupabaseStorage.testBase64Upload()');
  console.log('  - window.testSupabaseStorage.testFileUpload(file)');
  console.log('  - window.testSupabaseStorage.testDatabaseInsert()');
}
