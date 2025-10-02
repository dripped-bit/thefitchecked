/**
 * API Test Utility
 * Tests both fal.ai and Claude API connections to ensure they're working correctly
 */

export interface ApiTestResult {
  service: string;
  success: boolean;
  message: string;
  responseTime: number;
  error?: string;
}

export interface ApiTestSuite {
  fal: ApiTestResult;
  claude: ApiTestResult;
  overall: {
    success: boolean;
    summary: string;
  };
}

/**
 * Test fal.ai API connection using a simple model
 */
export async function testFalApi(): Promise<ApiTestResult> {
  const startTime = Date.now();

  try {
    console.log('🔍 Testing fal.ai API connection...');

    // Check if API key is configured
    const falKey = import.meta.env.VITE_FAL_KEY;
    if (!falKey || falKey === 'your-fal-api-key-here') {
      throw new Error('FAL API key not configured');
    }

    // Test with proxy endpoint for fal.ai
    const response = await fetch('/api/fal/fal-ai/nano-banana', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'API test - simple red apple',
        image_size: { width: 256, height: 256 },
        num_images: 1,
        sync_mode: true
      })
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    // Log the actual response structure for debugging
    console.log('📊 Full fal.ai response:', result);
    console.log('📊 Response keys:', Object.keys(result));

    // Check multiple possible response structures
    const images = result.images || result.data?.images || result.outputs || result.data?.outputs;

    if (images && images.length > 0) {
      return {
        service: 'fal.ai',
        success: true,
        message: `✅ fal.ai API working correctly via proxy. Generated ${images.length} image(s).`,
        responseTime
      };
    } else {
      console.log('❌ No images found in response structure');
      throw new Error(`No images returned from fal.ai API. Response structure: ${JSON.stringify(Object.keys(result))}`);
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ fal.ai API test failed:', error);

    return {
      service: 'fal.ai',
      success: false,
      message: '❌ fal.ai API test failed',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test Claude API connection using a simple request
 */
export async function testClaudeApi(): Promise<ApiTestResult> {
  const startTime = Date.now();

  try {
    console.log('🔍 Testing Claude API connection...');

    // Check if API key is configured
    const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!claudeKey || claudeKey === 'your-claude-api-key-here') {
      throw new Error('Claude API key not configured');
    }

    // Test Claude API via proxy
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
          content: 'Say "API test successful" if you can read this.'
        }]
      })
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const data = await response.json();

    if (data.content && data.content.length > 0) {
      return {
        service: 'Claude',
        success: true,
        message: `✅ Claude API working correctly via proxy. Response: "${data.content[0].text}"`,
        responseTime
      };
    } else {
      throw new Error('No content returned from Claude API');
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ Claude API test failed:', error);

    return {
      service: 'Claude',
      success: false,
      message: '❌ Claude API test failed',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run comprehensive API test suite
 */
export async function runApiTestSuite(): Promise<ApiTestSuite> {
  console.log('🚀 Starting API test suite...');
  console.log('');

  // Run tests in parallel for faster execution
  const [falResult, claudeResult] = await Promise.all([
    testFalApi(),
    testClaudeApi()
  ]);

  // Generate overall summary
  const overallSuccess = falResult.success && claudeResult.success;
  let summary = '';

  if (overallSuccess) {
    summary = '🎉 All APIs working correctly! Ready to build shopping features.';
  } else {
    const failedApis = [falResult, claudeResult]
      .filter(result => !result.success)
      .map(result => result.service);
    summary = `⚠️ ${failedApis.join(' and ')} API(s) failed. Check configuration.`;
  }

  return {
    fal: falResult,
    claude: claudeResult,
    overall: {
      success: overallSuccess,
      summary
    }
  };
}

/**
 * Pretty print test results to console
 */
export function printTestResults(results: ApiTestSuite): void {
  console.log('');
  console.log('📊 API Test Results:');
  console.log('==================');

  // fal.ai results
  console.log(`fal.ai API: ${results.fal.message}`);
  console.log(`Response time: ${results.fal.responseTime}ms`);
  if (results.fal.error) {
    console.log(`Error: ${results.fal.error}`);
  }
  console.log('');

  // Claude results
  console.log(`Claude API: ${results.claude.message}`);
  console.log(`Response time: ${results.claude.responseTime}ms`);
  if (results.claude.error) {
    console.log(`Error: ${results.claude.error}`);
  }
  console.log('');

  // Overall summary
  console.log(`Summary: ${results.overall.summary}`);
  console.log('==================');
  console.log('');
}