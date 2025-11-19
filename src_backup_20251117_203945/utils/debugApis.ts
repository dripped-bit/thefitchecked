/**
 * API Debug Utility
 * Helps diagnose API connection issues
 */

export function debugApiConfig(): void {
  console.log('🔍 API Configuration Debug:');
  console.log('============================');

  // Check environment variables
  const falKey = import.meta.env.VITE_FAL_KEY;
  const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;

  console.log('Environment Variables:');
  console.log('- VITE_FAL_KEY exists:', !!falKey);
  console.log('- VITE_FAL_KEY length:', falKey?.length || 0);
  console.log('- VITE_FAL_KEY starts with:', falKey?.substring(0, 10) + '...');
  console.log('');
  console.log('- VITE_CLAUDE_API_KEY exists:', !!claudeKey);
  console.log('- VITE_CLAUDE_API_KEY length:', claudeKey?.length || 0);
  console.log('- VITE_CLAUDE_API_KEY starts with:', claudeKey?.substring(0, 15) + '...');
  console.log('');

  // Check network connectivity
  console.log('Network & CORS Check:');
  console.log('- Current origin:', window.location.origin);
  console.log('- User agent:', navigator.userAgent.substring(0, 50) + '...');
  console.log('');

  // Check if modules can be imported
  console.log('Module Import Check:');
  console.log('- @fal-ai/client: ❌ Removed (migrated to FASHN API only)');
}

export async function testClaudeApiDetailed(): Promise<void> {
  console.log('🤖 Detailed Claude API Test (via Proxy):');
  console.log('==========================================');

  try {
    const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;

    if (!claudeKey) {
      console.log('❌ No Claude API key found');
      return;
    }

    console.log('✅ Claude API key found');
    console.log('🔗 Making request to Claude API via proxy...');

    const startTime = Date.now();
    const response = await fetch('/api/claude/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Say "test successful" if you can read this.'
        }]
      })
    });

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Response time: ${responseTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    // Log response headers
    console.log('📋 Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Success! Response data:', data);

    const responseText = data.content?.[0]?.text;
    if (responseText) {
      console.log(`🎉 Claude said: "${responseText}"`);
    }

  } catch (error) {
    console.error('❌ Claude API test failed:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
}

export async function testFalApiDetailed(): Promise<void> {
  console.log('🎨 Detailed fal.ai API Test (via Proxy):');
  console.log('==========================================');

  try {
    const falKey = import.meta.env.VITE_FAL_KEY;

    if (!falKey) {
      console.log('❌ No fal.ai API key found');
      return;
    }

    console.log('✅ fal.ai API key found');
    console.log('🔗 Making request to fal.ai API via proxy...');

    const startTime = Date.now();
    const response = await fetch('/api/fal/fal-ai/nano-banana', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'debug test - red apple',
        image_size: { width: 128, height: 128 },
        num_images: 1,
        sync_mode: true
      })
    });

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Response time: ${responseTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    // Log response headers
    console.log('📋 Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response body:', errorText);
      return;
    }

    const result = await response.json();
    console.log('📋 Result structure:', Object.keys(result));
    console.log('📋 Data structure:', result.images ? 'Has images array' : 'No images');

    if (result.images && result.images.length > 0) {
      console.log(`✅ Success! Generated ${result.images.length} image(s)`);
      console.log('🖼️ First image URL:', result.images[0].url?.substring(0, 50) + '...');
    } else {
      console.log('❌ No images in response');
      console.log('📊 Full result:', result);
    }

  } catch (error) {
    console.error('❌ fal.ai API test failed:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
}

export async function runFullDiagnostic(): Promise<void> {
  console.clear();
  console.log('🔧 Full API Diagnostic Starting...');
  console.log('=====================================');
  console.log('');

  debugApiConfig();
  console.log('');

  await testClaudeApiDetailed();
  console.log('');

  await testFalApiDetailed();
  console.log('');

  console.log('🏁 Diagnostic complete!');
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).debugApiConfig = debugApiConfig;
  (window as any).testClaudeApiDetailed = testClaudeApiDetailed;
  (window as any).testFalApiDetailed = testFalApiDetailed;
  (window as any).runFullDiagnostic = runFullDiagnostic;
}