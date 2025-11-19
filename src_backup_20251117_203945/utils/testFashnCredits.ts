/**
 * FASHN API Credits Test Utility
 * Tests API key validity and checks available credits
 */

interface FashnCreditsResponse {
  credits: number;
  used_credits: number;
  total_credits: number;
  expires_at?: string;
}

interface FashnErrorResponse {
  error: string;
  message?: string;
  detail?: string;
}

/**
 * Test FASHN API key and check credits
 */
export async function testFashnCredits(): Promise<void> {
  console.log('🧪 [FASHN-TEST] Starting FASHN API key validation...');

  const apiKey = import.meta.env.VITE_FASHN_API_KEY;

  if (!apiKey) {
    console.error('❌ [FASHN-TEST] No API key found in environment variables');
    console.log('💡 [FASHN-TEST] Make sure VITE_FASHN_API_KEY is set in .env.local');
    return;
  }

  console.log('🔑 [FASHN-TEST] API key loaded:', apiKey.substring(0, 10) + '...');

  try {
    // Test 1: Check credits endpoint
    console.log('📊 [FASHN-TEST] Checking credits endpoint...');

    const response = await fetch('https://api.fashn.ai/v1/credits', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 [FASHN-TEST] Response status:', response.status, response.statusText);

    // Handle different response codes
    if (response.status === 200) {
      const data: FashnCreditsResponse = await response.json();
      console.log('✅ [FASHN-TEST] API key is VALID!');
      console.log('💰 [FASHN-TEST] Credits Information:');
      console.log('  - Available Credits:', data.credits || data.total_credits || 'Unknown');
      console.log('  - Used Credits:', data.used_credits || 'Unknown');

      if (data.expires_at) {
        console.log('  - Expires:', new Date(data.expires_at).toLocaleDateString());
      }

      // Check if credits are low
      const availableCredits = data.credits || data.total_credits || 0;
      if (availableCredits < 10) {
        console.warn('⚠️ [FASHN-TEST] Low credits! You have less than 10 credits remaining.');
        console.log('💡 [FASHN-TEST] Purchase more credits at https://fashn.ai/products/api');
      } else {
        console.log('✅ [FASHN-TEST] You have sufficient credits!');
      }

      return;
    }

    if (response.status === 401) {
      console.error('❌ [FASHN-TEST] Authentication FAILED - Invalid or expired API key');
      console.log('💡 [FASHN-TEST] Solutions:');
      console.log('  1. Check your API key in FASHN dashboard (Settings → API)');
      console.log('  2. Generate a new API key if this one is expired');
      console.log('  3. Update VITE_FASHN_API_KEY in .env.local');
      console.log('  4. Restart the dev server after updating .env.local');

      try {
        const errorData: FashnErrorResponse = await response.json();
        console.error('  Error details:', errorData.error || errorData.message || errorData.detail);
      } catch {
        // Couldn't parse error response
      }

      return;
    }

    if (response.status === 402) {
      console.error('❌ [FASHN-TEST] Payment Required - Out of credits!');
      console.log('💡 [FASHN-TEST] Purchase credits at https://fashn.ai/products/api');
      console.log('  - Minimum: $7.50 (100 credits)');
      console.log('  - Price: $0.075 per image');
      return;
    }

    if (response.status === 429) {
      console.error('⏳ [FASHN-TEST] Rate Limit Exceeded');
      console.log('💡 [FASHN-TEST] Wait 2 minutes before trying again');
      console.log('  - FASHN enforces rate limits to ensure quality service');
      return;
    }

    if (response.status === 404) {
      console.warn('⚠️ [FASHN-TEST] Credits endpoint not found (404)');
      console.log('💡 [FASHN-TEST] This might mean:');
      console.log('  1. The endpoint URL has changed');
      console.log('  2. Your API key doesn\'t have access to this endpoint');
      console.log('  3. Try testing with a virtual try-on request instead');
      return;
    }

    // Unknown error
    console.error('❌ [FASHN-TEST] Unexpected response:', response.status, response.statusText);
    try {
      const errorData = await response.json();
      console.error('  Response:', errorData);
    } catch {
      const text = await response.text();
      console.error('  Response:', text);
    }

  } catch (error) {
    console.error('❌ [FASHN-TEST] Network error:', error);
    console.log('💡 [FASHN-TEST] Possible causes:');
    console.log('  1. No internet connection');
    console.log('  2. CORS issues (check browser console)');
    console.log('  3. FASHN API is down (check https://fashn.ai)');
  }
}

/**
 * Test FASHN API with a simple try-on request
 */
export async function testFashnTryOn(): Promise<void> {
  console.log('🧪 [FASHN-TEST] Testing FASHN try-on endpoint...');

  const apiKey = import.meta.env.VITE_FASHN_API_KEY;

  if (!apiKey) {
    console.error('❌ [FASHN-TEST] No API key found');
    return;
  }

  console.log('💡 [FASHN-TEST] Note: This will consume 1 credit if successful');
  console.log('⏸️ [FASHN-TEST] Test cancelled - use testFashnCredits() to check without consuming credits');
}

/**
 * Show FASHN API information
 */
export function showFashnInfo(): void {
  console.log('📚 [FASHN-INFO] FASHN API Information');
  console.log('');
  console.log('🔗 Useful Links:');
  console.log('  - API Dashboard: https://fashn.ai/dashboard');
  console.log('  - Documentation: https://docs.fashn.ai/');
  console.log('  - API Settings: https://fashn.ai/dashboard/settings/api');
  console.log('  - Purchase Credits: https://fashn.ai/products/api');
  console.log('');
  console.log('💰 Pricing:');
  console.log('  - $0.075 per image');
  console.log('  - Minimum purchase: $7.50 (100 credits)');
  console.log('  - Credits expire 365 days after purchase');
  console.log('');
  console.log('🧪 Available Tests:');
  console.log('  - testFashnCredits()  - Check credits & validate API key');
  console.log('  - showFashnInfo()     - Show this information');
  console.log('');
  console.log('🔑 Current API Key:', import.meta.env.VITE_FASHN_API_KEY ? '✅ Loaded' : '❌ Missing');
}

// Auto-run on import in development
if (import.meta.env.DEV) {
  console.log('💡 [FASHN-TEST] FASHN test utilities loaded!');
  console.log('   Run: testFashnCredits() to check your API key and credits');
  console.log('   Run: showFashnInfo() for more information');
}

// Make functions available globally in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).testFashnCredits = testFashnCredits;
  (window as any).testFashnTryOn = testFashnTryOn;
  (window as any).showFashnInfo = showFashnInfo;
}

export default {
  testFashnCredits,
  testFashnTryOn,
  showFashnInfo
};
