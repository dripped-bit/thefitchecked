/**
 * Claude API Test Utilities
 * Test the Claude API connection and enhanced prompt generation
 */

/**
 * Simple test of Claude API using the working format from webEnhancedPromptService
 */
export async function testClaudeApiSimple(): Promise<{ success: boolean; response?: string; error?: string }> {
  console.log('🤖 [CLAUDE-TEST] Testing Claude API with simple request...');

  try {
    const response = await fetch('/api/claude/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: 'Reply with "API Working" if you receive this message.'
        }]
      })
    });

    console.log('📊 [CLAUDE-TEST] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CLAUDE-TEST] API Error:', errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    console.log('📊 [CLAUDE-TEST] Response structure:', Object.keys(data));

    const content = data.content?.[0]?.text || 'No content received';
    console.log('✅ [CLAUDE-TEST] Claude response:', content);

    return {
      success: true,
      response: content
    };

  } catch (error) {
    console.error('❌ [CLAUDE-TEST] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test enhanced prompt generation with a simple request
 */
export async function testEnhancedPromptGeneration(): Promise<{ success: boolean; result?: any; error?: string }> {
  console.log('🧠 [ENHANCED-TEST] Testing enhanced prompt generation...');

  try {
    const testPrompt = `As a fashion expert, create an enhanced prompt for AI image generation based on: "red dress".

Style: casual
Occasion: everyday

Create a JSON response with:
1. mainPrompt - detailed positive prompt for the clothing item
2. negativePrompt - list of items to avoid
3. clothing_items - array of specific clothing pieces
4. colors - array of colors mentioned
5. confidence - number 1-100

Format:
{
  "mainPrompt": "enhanced detailed prompt",
  "negativePrompt": "unwanted items to avoid",
  "clothing_items": ["item1", "item2"],
  "colors": ["color1", "color2"],
  "confidence": 85
}`;

    const response = await fetch('/api/claude/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: testPrompt
        }]
      })
    });

    console.log('📊 [ENHANCED-TEST] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [ENHANCED-TEST] API Error:', errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    console.log('📋 [ENHANCED-TEST] Raw response:', content);

    // Try to parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ [ENHANCED-TEST] Successfully parsed JSON:', parsed);
        return {
          success: true,
          result: parsed
        };
      } else {
        console.warn('⚠️ [ENHANCED-TEST] No JSON found in response');
        return {
          success: false,
          error: 'No JSON found in Claude response'
        };
      }
    } catch (parseError) {
      console.error('❌ [ENHANCED-TEST] JSON parse error:', parseError);
      return {
        success: false,
        error: `JSON parse failed: ${parseError}`
      };
    }

  } catch (error) {
    console.error('❌ [ENHANCED-TEST] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test the enhanced prompt service directly
 */
export async function testEnhancedPromptService(): Promise<{ success: boolean; result?: any; error?: string }> {
  console.log('🚀 [SERVICE-TEST] Testing enhanced prompt service...');

  try {
    // Dynamic import to avoid circular dependencies
    const { default: enhancedPromptGenerationService } = await import('../services/enhancedPromptGenerationService');

    const result = await enhancedPromptGenerationService.generateEnhancedPrompt({
      userRequest: 'red dress',
      style: 'casual',
      gender: 'unisex',
      occasion: 'everyday'
    });

    console.log('✅ [SERVICE-TEST] Service test successful:', result);
    return {
      success: true,
      result: result
    };

  } catch (error) {
    console.error('❌ [SERVICE-TEST] Service test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run all Claude API tests
 */
export async function runAllClaudeTests(): Promise<void> {
  console.clear();
  console.log('🧪 Running Claude API Tests');
  console.log('============================');

  // Test 1: Simple API test
  console.log('\n1. Simple Claude API Test:');
  const simpleTest = await testClaudeApiSimple();
  if (simpleTest.success) {
    console.log(`✅ Claude API working: "${simpleTest.response}"`);
  } else {
    console.log(`❌ Claude API failed: ${simpleTest.error}`);
  }

  // Test 2: Enhanced prompt generation (direct API)
  console.log('\n2. Enhanced Prompt Generation (Direct API):');
  const enhancedTest = await testEnhancedPromptGeneration();
  if (enhancedTest.success) {
    console.log('✅ Enhanced prompt generation working:', enhancedTest.result);
  } else {
    console.log(`❌ Enhanced prompt generation failed: ${enhancedTest.error}`);
  }

  // Test 3: Enhanced prompt service
  console.log('\n3. Enhanced Prompt Service:');
  const serviceTest = await testEnhancedPromptService();
  if (serviceTest.success) {
    console.log('✅ Enhanced prompt service working:', serviceTest.result);
  } else {
    console.log(`❌ Enhanced prompt service failed: ${serviceTest.error}`);
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`Simple API: ${simpleTest.success ? '✅' : '❌'}`);
  console.log(`Enhanced API: ${enhancedTest.success ? '✅' : '❌'}`);
  console.log(`Service: ${serviceTest.success ? '✅' : '❌'}`);

  const allWorking = simpleTest.success && enhancedTest.success && serviceTest.success;
  console.log(`\nOverall: ${allWorking ? '🎉 All Working!' : '⚠️ Issues Found'}`);
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testClaudeSimple = testClaudeApiSimple;
  (window as any).testEnhancedPrompt = testEnhancedPromptGeneration;
  (window as any).testEnhancedService = testEnhancedPromptService;
  (window as any).runAllClaudeTests = runAllClaudeTests;
}