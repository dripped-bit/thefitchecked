/**
 * Claude Vision Stylist API
 * Analyzes clothing and outfit photos for styling advice
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

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

  const claudeKey = process.env.ANTHROPIC_API_KEY;

  if (!claudeKey) {
    console.error('❌ Claude API key not configured');
    return res.status(500).json({ error: 'Claude API key not configured' });
  }

  try {
    const { imageUrl, imageUrls, analysisType } = req.body;
    
    // Support single or multiple images
    const images = imageUrls || (imageUrl ? [imageUrl] : []);
    
    if (images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const anthropic = new Anthropic({ apiKey: claudeKey });

    const stylingPrompt = `
Analyze this clothing/outfit photo and provide detailed fashion insights.

Describe:
1. Items visible (top, bottom, shoes, accessories, etc.)
2. Colors and color palette
3. Style category (casual, formal, streetwear, bohemian, etc.)
4. Patterns or textures
5. Occasion suitability
6. Styling suggestions (how to wear/pair these items)
7. What would complement this outfit

Format response as:

ITEMS IDENTIFIED:
[List each clothing item you see]

COLORS:
[List dominant colors]

STYLE:
[Describe the overall style]

OCCASION:
[What events/situations is this appropriate for]

STYLING SUGGESTIONS:
[How to style these items - be specific]
- Suggestion 1
- Suggestion 2
- Suggestion 3

COMPLEMENTARY PIECES:
[What items would complete or enhance this outfit]

Keep it conversational and actionable.
    `.trim();

    // Build content array with images
    const content: any[] = [
      { type: 'text', text: stylingPrompt }
    ];

    // Add all images
    for (const imgUrl of images) {
      content.push({
        type: 'image',
        source: {
          type: 'url',
          url: imgUrl
        }
      });
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content
      }]
    });

    const analysisText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse the response
    const analysis = parseAnalysis(analysisText);

    console.log('✅ [CLAUDE-VISION-STYLIST] Image analyzed successfully');

    return res.status(200).json({ analysis });

  } catch (error: any) {
    console.error('❌ [CLAUDE-VISION-STYLIST] Error:', error);
    return res.status(500).json({
      error: 'Failed to analyze image',
      message: error.message
    });
  }
}

/**
 * Parse Claude's structured response
 */
function parseAnalysis(text: string): any {
  const analysis: any = {
    description: text,
    colors: [],
    style: '',
    items: [],
    suggestions: [],
    occasion: ''
  };

  // Extract items
  const itemsMatch = text.match(/ITEMS IDENTIFIED:\s*\n((?:.*\n?){1,10})/i);
  if (itemsMatch) {
    analysis.items = itemsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());
  }

  // Extract colors
  const colorsMatch = text.match(/COLORS:\s*\n((?:.*\n?){1,5})/i);
  if (colorsMatch) {
    const colorText = colorsMatch[1];
    analysis.colors = colorText
      .split(/[,\n]/)
      .map(c => c.trim())
      .filter(c => c && !c.match(/^[A-Z\s:]+$/));
  }

  // Extract style
  const styleMatch = text.match(/STYLE:\s*\n([^\n]+)/i);
  if (styleMatch) {
    analysis.style = styleMatch[1].trim();
  }

  // Extract occasion
  const occasionMatch = text.match(/OCCASION:\s*\n((?:.*\n?){1,3})/i);
  if (occasionMatch) {
    analysis.occasion = occasionMatch[1].trim();
  }

  // Extract suggestions
  const suggestionsMatch = text.match(/STYLING SUGGESTIONS:\s*\n((?:.*\n?){1,15})/i);
  if (suggestionsMatch) {
    analysis.suggestions = suggestionsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());
  }

  return analysis;
}
