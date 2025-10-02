import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const falKey = process.env.FAL_KEY || process.env.VITE_FAL_KEY;
  if (!falKey) {
    console.error('❌ BiRefNet API key not configured');
    return res.status(500).json({ error: 'FAL API key not configured' });
  }

  try {
    console.log('🎨 [BIREFNET-PROXY] Starting background removal...');
    console.log('📤 [BIREFNET-PROXY] Request body:', JSON.stringify(req.body).substring(0, 200));

    const response = await fetch('https://fal.run/fal-ai/birefnet', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [BIREFNET-PROXY] Error:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('✅ [BIREFNET-PROXY] Background removed successfully:', {
      hasImage: !!data?.image,
      hasUrl: !!data?.image?.url,
      dataKeys: Object.keys(data || {})
    });

    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ [BIREFNET-PROXY] Exception:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
