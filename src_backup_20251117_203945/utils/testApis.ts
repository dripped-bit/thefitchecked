/**
 * Simple API Test Functions
 * Easy-to-use functions for testing API connectivity
 */

/**
 * One-line function to test both APIs
 * Usage: testApis().then(console.log)
 */
export async function testApis(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔍 Testing API keys...');

    // Quick configuration check
    const falKey = import.meta.env.VITE_FAL_KEY;
    const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;

    if (!falKey || falKey === 'your-fal-api-key-here') {
      return { success: false, message: '❌ FAL API key not configured' };
    }

    if (!claudeKey || claudeKey === 'your-claude-api-key-here') {
      return { success: false, message: '❌ Claude API key not configured' };
    }

    console.log('✅ Both API keys are configured');

    // Test Claude API (faster than fal.ai)
    console.log('🤖 Testing Claude API...');
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': claudeKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Reply "OK" if working.' }]
      })
    });

    if (!claudeResponse.ok) {
      return { success: false, message: `❌ Claude API failed: ${claudeResponse.status}` };
    }

    console.log('✅ Claude API working');

    // Test fal.ai API
    console.log('🎨 Testing fal.ai API...');
    const { fal } = await import('@fal-ai/client');

    const falResult = await fal.subscribe('fal-ai/nano-banana', {
      input: {
        prompt: 'test',
        image_size: { width: 64, height: 64 },
        num_images: 1,
        sync_mode: true
      },
      logs: false,
      onQueueUpdate: () => {}
    });

    if (!falResult.data?.images?.[0]) {
      return { success: false, message: '❌ fal.ai API failed to generate image' };
    }

    console.log('✅ fal.ai API working');

    return {
      success: true,
      message: '🎉 Both APIs working perfectly! Ready for shopping features.'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ API test failed:', errorMessage);
    return {
      success: false,
      message: `❌ API test failed: ${errorMessage}`
    };
  }
}

/**
 * Quick check if APIs are configured (doesn't make actual calls)
 */
export function checkApiConfig(): { fal: boolean; claude: boolean; both: boolean } {
  const falKey = import.meta.env.VITE_FAL_KEY;
  const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;

  const fal = !!(falKey && falKey !== 'your-fal-api-key-here');
  const claude = !!(claudeKey && claudeKey !== 'your-claude-api-key-here');

  return { fal, claude, both: fal && claude };
}

/**
 * Test just Claude API (fastest test)
 */
export async function testClaudeOnly(): Promise<{ success: boolean; message: string; response?: string }> {
  try {
    const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!claudeKey) {
      return { success: false, message: '❌ Claude API key not configured' };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': claudeKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "Claude working" if you can read this.' }]
      })
    });

    if (!response.ok) {
      return { success: false, message: `❌ Claude API failed: ${response.status}` };
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text || 'No response';

    return {
      success: true,
      message: '✅ Claude API working',
      response: responseText
    };

  } catch (error) {
    return {
      success: false,
      message: `❌ Claude test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Test just fal.ai API
 */
export async function testFalOnly(): Promise<{ success: boolean; message: string }> {
  try {
    const falKey = import.meta.env.VITE_FAL_KEY;
    if (!falKey) {
      return { success: false, message: '❌ FAL API key not configured' };
    }

    const { fal } = await import('@fal-ai/client');

    const result = await fal.subscribe('fal-ai/nano-banana', {
      input: {
        prompt: 'simple test',
        image_size: { width: 128, height: 128 },
        num_images: 1,
        sync_mode: true
      },
      logs: false,
      onQueueUpdate: () => {}
    });

    if (!result.data?.images?.[0]) {
      return { success: false, message: '❌ fal.ai failed to generate image' };
    }

    return { success: true, message: '✅ fal.ai API working' };

  } catch (error) {
    return {
      success: false,
      message: `❌ fal.ai test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testApis = testApis;
  (window as any).testClaudeOnly = testClaudeOnly;
  (window as any).testFalOnly = testFalOnly;
  (window as any).checkApiConfig = checkApiConfig;
}