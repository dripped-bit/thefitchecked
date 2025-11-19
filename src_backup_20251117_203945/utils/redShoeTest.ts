/**
 * Red Shoe Test Function
 * Tests specific prompt and negative prompt to fix unwanted clothing items
 */

export interface RedShoeTestResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  prompt: string;
  negativePrompt: string;
  timestamp: number;
}

/**
 * Test function to generate red shoe with specific prompt and negative prompts
 */
export async function testRedShoeGeneration(): Promise<RedShoeTestResult> {
  console.log('🔴 [RED-SHOE-TEST] Starting red shoe generation test...');

  const testPrompt = 'person wearing ONLY red shoes, bare legs, clean background, focus on footwear';
  const testNegativePrompt = 'borrowing shirt, t-shirt, extra clothing, unwanted garments';

  const result: RedShoeTestResult = {
    success: false,
    prompt: testPrompt,
    negativePrompt: testNegativePrompt,
    timestamp: Date.now()
  };

  try {
    console.log('📝 [RED-SHOE-TEST] Using exact prompt:', testPrompt);
    console.log('🚫 [RED-SHOE-TEST] Using negative prompt:', testNegativePrompt);

    // Call FAL.ai Bytedance Seedream 4.0 Text-to-Image API via proxy
    const response = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: testPrompt,
        negative_prompt: testNegativePrompt,
        image_size: {
          width: 512,
          height: 768
        },
        num_inference_steps: 30,
        guidance_scale: 8.0,
        num_images: 1,
        seed: Math.floor(Math.random() * 1000000),
        enable_safety_checker: false,
        safety_tolerance: 2,
        scheduler: 'DPM++ 2M Karras'
      })
    });

    console.log('📊 [RED-SHOE-TEST] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [RED-SHOE-TEST] API Error Response:', errorText);
      result.error = `HTTP ${response.status}: ${errorText.substring(0, 200)}`;
      return result;
    }

    const data = await response.json();
    console.log('📊 [RED-SHOE-TEST] Response structure:', Object.keys(data));

    // Check multiple possible response structures
    const imageUrl = data.images?.[0]?.url || data.data?.images?.[0]?.url || data.outputs?.[0]?.url;

    if (!imageUrl) {
      console.error('❌ [RED-SHOE-TEST] No image URL in response:', data);
      result.error = `No image generated. Response keys: ${Object.keys(data).join(', ')}`;
      return result;
    }

    console.log('✅ [RED-SHOE-TEST] Successfully generated red shoe image');
    result.success = true;
    result.imageUrl = imageUrl;

    return result;

  } catch (error) {
    console.error('❌ [RED-SHOE-TEST] Exception:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

/**
 * Test function with enhanced error handling and retry logic
 */
export async function testRedShoeGenerationWithRetry(maxRetries: number = 3): Promise<RedShoeTestResult> {
  console.log(`🔴 [RED-SHOE-RETRY] Starting red shoe test with ${maxRetries} retries...`);

  let lastResult: RedShoeTestResult | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 [RED-SHOE-RETRY] Attempt ${attempt}/${maxRetries}`);

    try {
      const result = await testRedShoeGeneration();

      if (result.success) {
        console.log(`✅ [RED-SHOE-RETRY] Success on attempt ${attempt}`);
        return result;
      }

      lastResult = result;
      console.warn(`⚠️ [RED-SHOE-RETRY] Attempt ${attempt} failed:`, result.error);

      if (attempt < maxRetries) {
        const delay = 1000 * attempt; // Incremental delay
        console.log(`⏳ [RED-SHOE-RETRY] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    } catch (error) {
      console.error(`❌ [RED-SHOE-RETRY] Attempt ${attempt} exception:`, error);
      lastResult = {
        success: false,
        prompt: 'person wearing ONLY red shoes, bare legs, clean background, focus on footwear',
        negativePrompt: 'borrowing shirt, t-shirt, extra clothing, unwanted garments',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  console.error(`❌ [RED-SHOE-RETRY] All ${maxRetries} attempts failed`);
  return lastResult || {
    success: false,
    prompt: 'person wearing ONLY red shoes, bare legs, clean background, focus on footwear',
    negativePrompt: 'borrowing shirt, t-shirt, extra clothing, unwanted garments',
    timestamp: Date.now(),
    error: 'All retry attempts failed'
  };
}

/**
 * Test variations of the red shoe prompt to find optimal settings
 */
export async function testRedShoeVariations(): Promise<RedShoeTestResult[]> {
  console.log('🔴 [RED-SHOE-VARIATIONS] Testing multiple red shoe prompt variations...');

  const variations = [
    {
      prompt: 'person wearing ONLY red shoes, bare legs, clean background, focus on footwear',
      negativePrompt: 'borrowing shirt, t-shirt, extra clothing, unwanted garments'
    },
    {
      prompt: 'red shoes on bare feet, minimal clothing, white background, product photography',
      negativePrompt: 'shirt, top, blouse, jacket, coat, dress, pants, jeans, extra garments, unwanted clothing'
    },
    {
      prompt: 'elegant red high heels, bare legs, studio lighting, fashion photography',
      negativePrompt: 'shirt, t-shirt, blouse, top, jacket, coat, dress, pants, jeans, socks, stockings, extra clothing items'
    },
    {
      prompt: 'red sneakers, bare legs only, clean white background, footwear focus',
      negativePrompt: 'upper body clothing, shirts, tops, jackets, coats, dresses, pants, shorts, unwanted garments, extra items'
    }
  ];

  const results: RedShoeTestResult[] = [];

  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i];
    console.log(`🔄 [RED-SHOE-VARIATIONS] Testing variation ${i + 1}/${variations.length}`);

    try {
      const response = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: variation.prompt,
          negative_prompt: variation.negativePrompt,
          image_size: { width: 512, height: 768 },
          num_inference_steps: 30,
          guidance_scale: 8.0,
          num_images: 1,
          seed: Math.floor(Math.random() * 1000000),
          enable_safety_checker: false,
          safety_tolerance: 2,
          scheduler: 'DPM++ 2M Karras'
        })
      });

      const result: RedShoeTestResult = {
        success: false,
        prompt: variation.prompt,
        negativePrompt: variation.negativePrompt,
        timestamp: Date.now()
      };

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.images?.[0]?.url || data.data?.images?.[0]?.url;

        if (imageUrl) {
          result.success = true;
          result.imageUrl = imageUrl;
          console.log(`✅ [RED-SHOE-VARIATIONS] Variation ${i + 1} successful`);
        } else {
          result.error = 'No image URL in response';
          console.warn(`⚠️ [RED-SHOE-VARIATIONS] Variation ${i + 1} no image`);
        }
      } else {
        const errorText = await response.text();
        result.error = `HTTP ${response.status}: ${errorText.substring(0, 100)}`;
        console.warn(`⚠️ [RED-SHOE-VARIATIONS] Variation ${i + 1} failed:`, result.error);
      }

      results.push(result);

      // Small delay between requests
      if (i < variations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ [RED-SHOE-VARIATIONS] Variation ${i + 1} exception:`, error);
      results.push({
        success: false,
        prompt: variation.prompt,
        negativePrompt: variation.negativePrompt,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  console.log(`📊 [RED-SHOE-VARIATIONS] Completed ${results.length} variations`);
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ [RED-SHOE-VARIATIONS] ${successCount}/${results.length} successful`);

  return results;
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testRedShoe = testRedShoeGeneration;
  (window as any).testRedShoeRetry = testRedShoeGenerationWithRetry;
  (window as any).testRedShoeVariations = testRedShoeVariations;
}