import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const claudeKey = process.env.CLAUDE_API_KEY ||
                    process.env.ANTHROPIC_API_KEY ||
                    process.env.VITE_CLAUDE_API_KEY ||
                    process.env.VITE_ANTHROPIC_API_KEY;

  if (!claudeKey) {
    console.error('❌ Claude API key not configured');
    return res.status(500).json({ error: 'Claude API key not configured' });
  }

  try {
    // Get the path from query or default to /v1/messages
    const path = req.query.path as string || '/v1/messages';
    const targetUrl = `https://api.anthropic.com${path}`;

    console.log('🤖 [CLAUDE-PROXY] Proxying request to:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': claudeKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [CLAUDE-PROXY] Error:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('✅ [CLAUDE-PROXY] Success');
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ [CLAUDE-PROXY] Exception:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
