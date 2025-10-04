import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Image Proxy API
 * Proxies external images (Google Shopping, Amazon, etc.) to avoid CORS restrictions
 * FASHN API can't fetch Google Shopping images directly due to CORS
 * This serverless function fetches images server-side (no CORS) and returns them
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    console.log('🖼️ [PROXY-IMAGE] Fetching external image:', url.substring(0, 100));

    // Fetch the external image (server-side, no CORS restrictions)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FitChecked/1.0)',
      },
    });

    if (!response.ok) {
      console.error('❌ [PROXY-IMAGE] Failed to fetch image:', response.status, response.statusText);
      return res.status(response.status).json({
        error: 'Failed to fetch image',
        status: response.status,
      });
    }

    // Get image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log('✅ [PROXY-IMAGE] Successfully fetched image:', {
      size: imageBuffer.byteLength,
      contentType,
      url: url.substring(0, 80),
    });

    // Set CORS headers to allow FASHN API to access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year

    // Return the image
    return res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('❌ [PROXY-IMAGE] Exception:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
