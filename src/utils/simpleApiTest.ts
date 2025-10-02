/**
 * Simple API Test Function
 * Tests both fal.ai and Claude API with basic calls
 */

export interface SimpleTestResult {
  falApi: {
    success: boolean;
    message: string;
    error?: string;
  };
  claudeApi: {
    success: boolean;
    message: string;
    response?: string;
    error?: string;
  };
  overall: {
    success: boolean;
    summary: string;
  };
}

/**
 * Simple test function that makes basic calls to both APIs
 */
export async function testBothApis(): Promise<SimpleTestResult> {
  console.log('🚀 Testing both API keys...');

  // Test results container
  const results: SimpleTestResult = {
    falApi: { success: false, message: '' },
    claudeApi: { success: false, message: '' },
    overall: { success: false, summary: '' }
  };

  // Test 1: fal.ai API (via proxy)
  try {
    console.log('🎨 Testing fal.ai API via proxy...');

    const falKey = import.meta.env.VITE_FAL_KEY;
    if (!falKey || falKey === 'your-fal-api-key-here') {
      throw new Error('FAL API key not configured');
    }

    // Use proxy endpoint for fal.ai
    const response = await fetch('/api/fal/fal-ai/nano-banana', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'API test - simple apple',
        image_size: { width: 256, height: 256 },
        num_images: 1,
        sync_mode: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const falResult = await response.json();

    if (falResult.images && falResult.images.length > 0) {
      results.falApi = {
        success: true,
        message: '✅ fal.ai API working via proxy - generated image successfully'
      };
      console.log('✅ fal.ai test passed');
    } else {
      throw new Error('No images returned from fal.ai');
    }

  } catch (error) {
    results.falApi = {
      success: false,
      message: '❌ fal.ai API failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    console.error('❌ fal.ai test failed:', error);
  }

  // Test 2: Claude API (via proxy)
  try {
    console.log('🤖 Testing Claude API via proxy...');

    const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!claudeKey || claudeKey === 'your-claude-api-key-here') {
      throw new Error('Claude API key not configured');
    }

    const response = await fetch('/api/claude/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku',
        max_tokens: 20,
        messages: [{
          role: 'user',
          content: 'Say "API working" if you can read this.'
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text || 'No response text';

    results.claudeApi = {
      success: true,
      message: '✅ Claude API working via proxy - received response',
      response: responseText
    };
    console.log('✅ Claude test passed:', responseText);

  } catch (error) {
    results.claudeApi = {
      success: false,
      message: '❌ Claude API failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    console.error('❌ Claude test failed:', error);
  }

  // Overall result
  const bothWorking = results.falApi.success && results.claudeApi.success;
  results.overall = {
    success: bothWorking,
    summary: bothWorking
      ? '🎉 Both APIs working perfectly!'
      : '⚠️ One or more APIs failed. Check configuration.'
  };

  console.log('📊 Test Results:', results.overall.summary);
  return results;
}

/**
 * Quick test function - just checks if keys are configured
 */
export function quickApiCheck(): { fal: boolean; claude: boolean; both: boolean } {
  const falKey = import.meta.env.VITE_FAL_KEY;
  const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;

  const falConfigured = !!(falKey && falKey !== 'your-fal-api-key-here');
  const claudeConfigured = !!(claudeKey && claudeKey !== 'your-claude-api-key-here');

  return {
    fal: falConfigured,
    claude: claudeConfigured,
    both: falConfigured && claudeConfigured
  };
}

/**
 * Log API status to console
 */
export function logApiStatus(): void {
  const status = quickApiCheck();
  console.log('🔍 API Configuration Status:');
  console.log(`fal.ai: ${status.fal ? '✅ Configured' : '❌ Missing'}`);
  console.log(`Claude: ${status.claude ? '✅ Configured' : '❌ Missing'}`);
  console.log(`Overall: ${status.both ? '✅ Ready' : '❌ Incomplete'}`);
}