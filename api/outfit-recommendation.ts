import type { VercelRequest, VercelResponse } from '@vercel/node';

// IMPORTANT: This is a Vercel serverless function
// It runs server-side, so API keys are secure

interface OutfitRequest {
  occasion: string;
  weather: string;
  temperature?: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  lifestyle: string;
  userWardrobe?: any[];
}

interface OutfitRecommendation {
  top: string;
  bottom: string;
  shoes: string;
  outerwear?: string;
  accessories?: string[];
  reasoning: string;
  styleNotes: string;
  approved: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as OutfitRequest;
    
    const { 
      occasion, 
      weather, 
      temperature,
      timeOfDay, 
      lifestyle 
    } = body;

    // Validate required fields
    if (!occasion || !weather || !timeOfDay || !lifestyle) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['occasion', 'weather', 'timeOfDay', 'lifestyle']
      });
    }

    console.log('🎨 [OUTFIT-API] Starting dual-AI styling...');
    console.log('🎨 [OUTFIT-API] Request:', { occasion, weather, temperature, timeOfDay, lifestyle });

    // STEP 1: Get Claude analysis
    const claudeAnalysis = await getClaudeAnalysis(req.body);
    console.log('✅ [OUTFIT-API] Claude analysis complete');

    // STEP 2: Get ChatGPT validation
    const chatGPTValidation = await getChatGPTValidation(claudeAnalysis, req.body);
    console.log('✅ [OUTFIT-API] ChatGPT validation complete');

    // STEP 3: Combine results
    const outfit = combineResults(claudeAnalysis, chatGPTValidation);
    console.log('✅ [OUTFIT-API] Final outfit generated');

    return res.status(200).json({
      success: true,
      outfit,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [OUTFIT-API] Error:', error.message);
    
    // User-friendly error messages
    if (error.message.includes('STYLE_VIOLATION')) {
      return res.status(422).json({
        error: 'Could not create a suitable outfit combination',
        details: error.message,
        suggestion: 'Try different parameters or preferences'
      });
    }

    if (error.message.includes('Claude')) {
      return res.status(503).json({
        error: 'Claude AI service unavailable',
        details: 'Falling back to ChatGPT-only mode'
      });
    }

    if (error.message.includes('ChatGPT') || error.message.includes('OpenAI')) {
      return res.status(503).json({
        error: 'OpenAI service unavailable',
        details: 'Please try again later'
      });
    }
    
    return res.status(500).json({
      error: 'Failed to generate recommendation',
      details: error.message
    });
  }
}

/**
 * Get Claude's strategic analysis
 */
async function getClaudeAnalysis(request: OutfitRequest) {
  const claudeKey = process.env.CLAUDE_API_KEY ||
                    process.env.ANTHROPIC_API_KEY ||
                    process.env.VITE_CLAUDE_API_KEY ||
                    process.env.VITE_ANTHROPIC_API_KEY;

  if (!claudeKey) {
    throw new Error('Claude API key not configured');
  }

  const prompt = `You are a wardrobe planning expert. Analyze this outfit request:

CONTEXT:
- Occasion: ${request.occasion}
- Weather: ${request.weather} ${request.temperature ? `(${request.temperature}°F)` : ''}
- Time of Day: ${request.timeOfDay}
- Lifestyle: ${request.lifestyle}

YOUR TASK:
Determine the appropriate outfit CATEGORIES and FORMALITY level.

Consider:
1. What type of top is appropriate? (t-shirt, blouse, sweater, tank, etc.)
2. What type of bottom? (jeans, trousers, skirt, shorts, leggings)
3. What type of shoes? (sneakers, boots, heels, flats, sandals)
4. Is outerwear needed?
5. What's the formality level (1-10)?

RESPOND WITH JSON ONLY:
{
  "topCategory": "specific category",
  "topStyle": "style description",
  "bottomCategory": "specific category",
  "bottomStyle": "style description",
  "shoesCategory": "specific category",
  "shoesStyle": "style description",
  "outerwearNeeded": boolean,
  "outerwearCategory": "category if needed",
  "formalityLevel": number,
  "layeringAdvice": "brief advice",
  "colorPalette": ["color1", "color2", "color3"],
  "reasoning": "why this works"
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'X-API-Key': claudeKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.5,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Parse JSON from Claude's response
  let cleanedResponse = content.trim();
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  return JSON.parse(cleanedResponse);
}

/**
 * Get ChatGPT's validation
 */
async function getChatGPTValidation(claudeAnalysis: any, request: OutfitRequest) {
  const openaiKey = process.env.OPENAI_API_KEY ||
                    process.env.VITE_OPENAI_API_KEY;

  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are a fashion critic and styling validator. Review this outfit recommendation:

ORIGINAL REQUEST:
- Occasion: ${request.occasion}
- Weather: ${request.weather} ${request.temperature ? `(${request.temperature}°F)` : ''}
- Time: ${request.timeOfDay}
- Lifestyle: ${request.lifestyle}

CLAUDE'S RECOMMENDATION:
- Top: ${claudeAnalysis.topCategory} (${claudeAnalysis.topStyle})
- Bottom: ${claudeAnalysis.bottomCategory} (${claudeAnalysis.bottomStyle})
- Shoes: ${claudeAnalysis.shoesCategory} (${claudeAnalysis.shoesStyle})
- Outerwear: ${claudeAnalysis.outerwearNeeded ? claudeAnalysis.outerwearCategory : 'None'}
- Formality: ${claudeAnalysis.formalityLevel}/10
- Colors: ${claudeAnalysis.colorPalette.join(', ')}
- Reasoning: ${claudeAnalysis.reasoning}

YOUR TASK:
Validate this recommendation. Check for:
1. Weather appropriateness (temperature, conditions)
2. Occasion appropriateness (formality, context)
3. Time-of-day suitability
4. Practical considerations (comfort, mobility)
5. Style coherence (do pieces work together?)

RESPOND WITH JSON ONLY:
{
  "approved": boolean,
  "confidence": "high" | "medium" | "low",
  "suggestions": ["specific improvement 1", "specific improvement 2"],
  "warnings": ["potential issue 1", "potential issue 2"],
  "alternativeApproach": "optional alternative if disapproved",
  "styleNotes": "final styling tips"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional fashion stylist with expertise in weather-appropriate dressing. Respond ONLY with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Parse JSON from ChatGPT's response
  let cleanedResponse = content.trim();
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  return JSON.parse(cleanedResponse);
}

/**
 * Combine both AI results
 */
function combineResults(claudeAnalysis: any, chatGPTValidation: any): OutfitRecommendation {
  return {
    top: `${claudeAnalysis.topCategory} - ${claudeAnalysis.topStyle}`,
    bottom: `${claudeAnalysis.bottomCategory} - ${claudeAnalysis.bottomStyle}`,
    shoes: `${claudeAnalysis.shoesCategory} - ${claudeAnalysis.shoesStyle}`,
    outerwear: claudeAnalysis.outerwearNeeded 
      ? claudeAnalysis.outerwearCategory 
      : undefined,
    accessories: [], // Could extend this
    reasoning: `${claudeAnalysis.reasoning}\n\n${chatGPTValidation.suggestions.length > 0 ? 'Refinements: ' + chatGPTValidation.suggestions.join(', ') : ''}`,
    styleNotes: chatGPTValidation.styleNotes,
    approved: chatGPTValidation.approved,
    confidence: chatGPTValidation.confidence
  };
}
