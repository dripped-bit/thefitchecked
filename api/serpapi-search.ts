import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serpApiKey = process.env.VITE_SERPAPI_KEY;

  if (!serpApiKey) {
    console.error('❌ [SERPAPI-PROXY] VITE_SERPAPI_KEY not configured');
    return res.status(500).json({ error: 'SerpAPI key not configured' });
  }

  try {
    const { query, num = 20, budgetMin, budgetMax } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log('🔍 [SERPAPI-PROXY] Searching Google Shopping:', {
      query,
      num,
      budgetMin,
      budgetMax
    });

    const params = new URLSearchParams({
      api_key: serpApiKey,
      engine: 'google_shopping',
      q: query,
      location: 'Austin, Texas, United States',
      hl: 'en',
      gl: 'us',
      num: num.toString()
    });

    // Add price range filter if budget specified
    if (budgetMin !== undefined || budgetMax !== undefined) {
      const min = budgetMin || 0;
      const max = budgetMax || 999999;
      params.append('tbs', `ppr_min:${min},ppr_max:${max}`);
      console.log(`💰 [SERPAPI-PROXY] Budget filter: $${min}-$${max}`);
    }

    const response = await fetch(`https://serpapi.com/search.json?${params}`);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [SERPAPI-PROXY] Error:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('✅ [SERPAPI-PROXY] Success:', {
      hasResults: !!data.shopping_results,
      count: data.shopping_results?.length || 0
    });

    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ [SERPAPI-PROXY] Exception:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
