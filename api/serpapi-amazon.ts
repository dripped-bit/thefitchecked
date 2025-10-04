import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serpApiKey = process.env.VITE_SERPAPI_KEY;

  if (!serpApiKey) {
    console.error('❌ [AMAZON-PROXY] VITE_SERPAPI_KEY not configured');
    return res.status(500).json({ error: 'SerpAPI key not configured' });
  }

  try {
    const { query, num = 10, budgetMin, budgetMax } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log('🛍️ [AMAZON-PROXY] Searching Amazon:', {
      query,
      num,
      budgetMin,
      budgetMax
    });

    // Build Amazon search parameters
    const params = new URLSearchParams({
      api_key: serpApiKey,
      engine: 'amazon',
      q: query,
      amazon_domain: 'amazon.com',
      location: 'Austin, Texas, United States',
      hl: 'en',
      gl: 'us'
    });

    // Add department filter for clothing
    params.append('department', 'fashion');

    // Add price range filter if budget specified
    if (budgetMin !== undefined || budgetMax !== undefined) {
      const min = budgetMin || 0;
      const max = budgetMax || 999999;
      params.append('min_price', min.toString());
      params.append('max_price', max.toString());
      console.log(`💰 [AMAZON-PROXY] Budget filter: $${min}-$${max}`);
    }

    const response = await fetch(`https://serpapi.com/search.json?${params}`);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [AMAZON-PROXY] Error:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('✅ [AMAZON-PROXY] Success:', {
      hasResults: !!data.organic_results,
      count: data.organic_results?.length || 0
    });

    // Transform Amazon results to match Google Shopping format
    const transformedResults = {
      shopping_results: (data.organic_results || []).slice(0, num).map((item: any) => ({
        title: item.title,
        price: item.price?.raw || item.price?.value || 'N/A',
        thumbnail: item.thumbnail || item.image,
        link: item.link,
        source: 'Amazon',
        rating: item.rating,
        reviews: item.reviews_count,
        position: item.position
      }))
    };

    return res.status(200).json(transformedResults);

  } catch (error) {
    console.error('❌ [AMAZON-PROXY] Exception:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
