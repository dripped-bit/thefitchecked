/**
 * Fashion Web Search API
 * Uses SerpAPI to search for fashion trends and styling advice
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serpApiKey = process.env.SERP_API_KEY;

  if (!serpApiKey) {
    console.error('❌ SerpAPI key not configured');
    return res.status(500).json({ error: 'SerpAPI key not configured' });
  }

  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    console.log('🔍 [FASHION-SEARCH] Searching for:', query);

    // Search using SerpAPI Google Search
    const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=5`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract organic results
    const results = (data.organic_results || []).map((result: any) => ({
      title: result.title,
      snippet: result.snippet,
      url: result.link,
      source: result.displayed_link || result.link
    }));

    console.log(`✅ [FASHION-SEARCH] Found ${results.length} results`);

    return res.status(200).json({ results });

  } catch (error: any) {
    console.error('❌ [FASHION-SEARCH] Error:', error);
    return res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
}
