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

  const falKey = process.env.FAL_KEY || process.env.VITE_FAL_KEY;

  if (!falKey) {
    console.error('❌ FAL API key not configured');
    return res.status(500).json({ error: 'FAL API key not configured' });
  }

  try {
    // Extract the path from the URL
    // URL can be:
    // - /api/fal?path=/fal-ai/birefnet/v2
    // - /api/fal/fal-ai/birefnet/v2
    let path = req.query.path as string || '';
    
    // If no query param, extract from URL path
    if (!path && req.url) {
      const urlPath = req.url.replace('/api/fal', '');
      if (urlPath && urlPath !== '/') {
        path = urlPath.split('?')[0]; // Remove query string if any
      }
    }
    
    const targetUrl = `https://fal.run${path}`;

    console.log('🎨 [FAL-PROXY] Proxying request to:', targetUrl);
    console.log('🔗 [FAL-PROXY] Original URL:', req.url);
    console.log('📍 [FAL-PROXY] Extracted path:', path);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [FAL-PROXY] Error:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('✅ [FAL-PROXY] Success');
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ [FAL-PROXY] Exception:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
