import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers to allow requests from iOS app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const perplexityKey = process.env.PERPLEXITY_API_KEY ||
                         process.env.VITE_PERPLEXITY_API_KEY;

  if (!perplexityKey) {
    console.error('❌ Perplexity API key not configured');
    return res.status(500).json({ error: 'Perplexity API key not configured' });
  }

  try {
    // Get the path from query or default to /chat/completions
    const path = req.query.path as string || '/chat/completions';
    const targetUrl = `https://api.perplexity.ai${path}`;

    console.log('🔍 [PERPLEXITY-PROXY] Proxying request to:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [PERPLEXITY-PROXY] Error:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('✅ [PERPLEXITY-PROXY] Success');
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ [PERPLEXITY-PROXY] Exception:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
