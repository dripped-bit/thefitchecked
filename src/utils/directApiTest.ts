/**
 * Direct API Test - Simplified debugging
 * This bypasses complex imports and tests the most basic functionality
 */

// Test environment variable loading
export function testEnvVars(): { success: boolean; details: any } {
  console.log('🔍 Testing Environment Variables...');

  const falKey = import.meta.env.VITE_FAL_KEY;
  const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;

  const details = {
    falKey: {
      exists: !!falKey,
      length: falKey?.length || 0,
      preview: falKey?.substring(0, 20) + '...' || 'undefined',
      isDefault: falKey === 'your-fal-api-key-here'
    },
    claudeKey: {
      exists: !!claudeKey,
      length: claudeKey?.length || 0,
      preview: claudeKey?.substring(0, 20) + '...' || 'undefined',
      isDefault: claudeKey === 'your-claude-api-key-here'
    },
    allEnvVars: Object.keys(import.meta.env).filter(key => key.includes('FAL') || key.includes('CLAUDE'))
  };

  console.log('Environment Variables Check:', details);

  const success = details.falKey.exists && details.claudeKey.exists &&
                 !details.falKey.isDefault && !details.claudeKey.isDefault;

  return { success, details };
}

// Test Claude API with detailed error handling
export async function testClaudeSimple(): Promise<{ success: boolean; error?: string; response?: string }> {
  console.log('🤖 Testing Claude API (Simple via Proxy)...');

  try {
    const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;

    if (!claudeKey || claudeKey === 'your-claude-api-key-here') {
      return { success: false, error: 'Claude API key not configured or is placeholder' };
    }

    console.log('✅ Claude key found, making request via proxy...');

    const response = await fetch('/api/claude/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Reply "working" if you can read this.'
        }]
      })
    });

    console.log('📊 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`
      };
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text || 'No text in response';

    console.log('✅ Claude API Success:', responseText);
    return { success: true, response: responseText };

  } catch (error) {
    console.error('❌ Claude API Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Test fal.ai with minimal setup
export async function testFalSimple(): Promise<{ success: boolean; error?: string }> {
  console.log('🎨 Testing fal.ai API (Simple via Proxy)...');

  try {
    const falKey = import.meta.env.VITE_FAL_KEY;

    if (!falKey || falKey === 'your-fal-api-key-here') {
      return { success: false, error: 'fal.ai API key not configured or is placeholder' };
    }

    console.log('✅ fal.ai key found, making direct API test...');

    // Test with a simple direct API call to fal.ai queue API
    const response = await fetch('/api/fal/fal-ai/nano-banana', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'red apple',
        image_size: { width: 64, height: 64 },
        num_images: 1,
        sync_mode: true
      })
    });

    console.log('📊 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`
      };
    }

    const result = await response.json();
    console.log('📊 fal.ai response structure:', Object.keys(result));
    console.log('📊 Full fal.ai response:', result);

    // Check multiple possible response structures
    const images = result.images || result.data?.images || result.outputs || result.data?.outputs;

    if (!images?.[0]) {
      console.error('❌ No images in fal.ai response:', result);
      return { success: false, error: `No images generated. Response keys: ${Object.keys(result).join(', ')}` };
    }

    console.log('✅ fal.ai API Success - generated image');
    return { success: true };

  } catch (error) {
    console.error('❌ fal.ai API Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run all tests in sequence
export async function runSimpleTests(): Promise<void> {
  console.clear();
  console.log('🚀 Running Simple API Tests');
  console.log('============================');

  // Test 1: Environment Variables
  console.log('\n1. Environment Variables:');
  const envTest = testEnvVars();
  if (!envTest.success) {
    console.log('❌ Environment variables not properly loaded');
    console.log('💡 Try restarting the dev server');
    return;
  }
  console.log('✅ Environment variables loaded');

  // Test 2: Claude API
  console.log('\n2. Claude API:');
  const claudeTest = await testClaudeSimple();
  if (claudeTest.success) {
    console.log(`✅ Claude API working: "${claudeTest.response}"`);
  } else {
    console.log(`❌ Claude API failed: ${claudeTest.error}`);
  }

  // Test 3: fal.ai API
  console.log('\n3. fal.ai API:');
  const falTest = await testFalSimple();
  if (falTest.success) {
    console.log('✅ fal.ai API working');
  } else {
    console.log(`❌ fal.ai API failed: ${falTest.error}`);
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`Environment: ${envTest.success ? '✅' : '❌'}`);
  console.log(`Claude API: ${claudeTest.success ? '✅' : '❌'}`);
  console.log(`fal.ai API: ${falTest.success ? '✅' : '❌'}`);

  const allWorking = envTest.success && claudeTest.success && falTest.success;
  console.log(`\nOverall: ${allWorking ? '🎉 All Working!' : '⚠️ Issues Found'}`);

  if (!allWorking) {
    console.log('\n🔧 Next Steps:');
    if (!envTest.success) console.log('- Restart dev server');
    if (!claudeTest.success) console.log('- Check Claude API key and network');
    if (!falTest.success) console.log('- Check fal.ai API key and @fal-ai/client package');
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).runSimpleTests = runSimpleTests;
  (window as any).testEnvVars = testEnvVars;
  (window as any).testClaudeSimple = testClaudeSimple;
  (window as any).testFalSimple = testFalSimple;
}