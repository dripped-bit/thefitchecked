import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers for iOS WebView and web requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    // Build Amazon search parameters (using ONLY valid params from SerpAPI docs)
    const params = new URLSearchParams({
      api_key: serpApiKey,
      engine: 'amazon',
      q: `${query} women clothing`, // Add "women clothing" to query
      amazon_domain: 'amazon.com',
      language: 'en_US'
    });

    // Use node parameter for Women's Fashion category (node ID: 7141123011)
    params.append('node', '7141123011');

    // Note: Amazon SerpAPI doesn't support direct price filtering via params
    // Price filtering would need to be done client-side after results are returned
    if (budgetMin !== undefined || budgetMax !== undefined) {
      console.log(`💰 [AMAZON-PROXY] Budget filter requested: $${budgetMin || 0}-$${budgetMax || 999999} (will be applied client-side)`);
    }

    const response = await fetch(`https://serpapi.com/search.json?${params}`);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [AMAZON-PROXY] SerpAPI Error Details:', {
        status: response.status,
        statusText: response.statusText,
        errorData: JSON.stringify(data, null, 2),
        requestParams: params.toString(),
        query: query
      });
      return res.status(response.status).json(data);
    }

    console.log('✅ [AMAZON-PROXY] Success:', {
      hasResults: !!data.organic_results,
      count: data.organic_results?.length || 0,
      searchId: data.search_metadata?.id
    });

    // Transform Amazon results to match Google Shopping format
    // Add Amazon affiliate tag (thefitchecked-20) to all product links
    const AMAZON_AFFILIATE_TAG = 'thefitchecked-20';

    const transformedResults = {
      shopping_results: (data.organic_results || []).slice(0, num).map((item: any) => {
        // Add affiliate tag to Amazon link
        let affiliateLink = item.link || '';
        if (affiliateLink) {
          try {
            const urlObj = new URL(affiliateLink);
            urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
            affiliateLink = urlObj.toString();
          } catch (error) {
            console.warn('⚠️ [AMAZON-PROXY] Could not parse URL for affiliate tag:', affiliateLink);
          }
        }

        return {
          title: item.title,
          price: item.price?.raw || item.price?.value || 'N/A',
          thumbnail: item.thumbnail || item.image,
          link: affiliateLink, // ✅ Now includes affiliate tag
          source: 'Amazon',
          rating: item.rating,
          reviews: item.reviews_count,
          position: item.position
        };
      })
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
