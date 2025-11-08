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

  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get the path from query or default to /v1/messages
    const path = req.query.path as string || '/v1/messages';
    const targetUrl = `https://api.anthropic.com${path}`;

    console.log('🤖 [CLAUDE-PROXY] Proxying request to:', targetUrl);
    console.log('🤖 [CLAUDE-PROXY] Request path:', path);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': claudeKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
      signal: controller.signal, // Add timeout signal
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [CLAUDE-PROXY] Error:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('✅ [CLAUDE-PROXY] Success');
    return res.status(200).json(data);

  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error

    console.error('❌ [CLAUDE-PROXY] Exception:', error);
    console.error('❌ [CLAUDE-PROXY] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      name: error instanceof Error ? error.name : 'Unknown'
    });

    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).json({
        error: 'Request timeout',
        message: 'Request to Claude API timed out after 30 seconds'
      });
    }

    // Handle network errors (DNS, connection failures)
    if (error instanceof Error && error.message === 'fetch failed') {
      return res.status(503).json({
        error: 'Network error',
        message: 'Unable to reach Claude API - network connection failed'
      });
    }

    // Handle other errors
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
