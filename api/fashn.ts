import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow both GET and POST requests (GET for status checks, POST for try-on)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const fashnKey = process.env.FASHN_API_KEY ||
                   process.env.VITE_FASHN_API_KEY;

  if (!fashnKey) {
    console.error('❌ FASHN API key not configured');
    return res.status(500).json({ error: 'FASHN API key not configured' });
  }

  try {
    // Extract path from URL (e.g., /api/fashn/v1/run -> /v1/run)
    const urlPath = req.url?.replace(/^\/api\/fashn/, '') || '';
    const targetUrl = `https://api.fashn.ai${urlPath}`;

    console.log('👗 [FASHN-PROXY] Request Details:', {
      originalUrl: req.url,
      extractedPath: urlPath,
      targetUrl: targetUrl,
      method: req.method,
      hasKey: !!fashnKey,
      keyPreview: fashnKey ? fashnKey.substring(0, 20) + '...' : 'none'
    });

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${fashnKey}`,
        'Content-Type': 'application/json',
      },
    };

    // Only add body for POST requests
    if (req.method === 'POST') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [FASHN-PROXY] Error:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('✅ [FASHN-PROXY] Success');
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ [FASHN-PROXY] Exception:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
