/**
 * OpenAI Insights Service
 * Analyzes trip data and generates intelligent packing insights
 */

import OpenAI from 'openai';
import type {
  TripAnalysisData,
  AIInsights,
  PackingInsight,
  MissingItemCategory,
  OutfitRecommendation,
} from './tripInsightsService';
import {
  getOutfitDescription,
  countByCategory,
  getDayNumber,
  buildClosetSummary,
} from './tripInsightsService';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ============================================
// AI ANALYSIS
// ============================================

/**
 * Analyze trip with OpenAI and generate insights
 */
export async function analyzeTrip(data: TripAnalysisData): Promise<AIInsights> {
  console.log('🤖 [AI-INSIGHTS] Starting OpenAI analysis');

  try {
    const prompt = buildAnalysisPrompt(data);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    const insights = parseAIResponse(result);
    console.log('✅ [AI-INSIGHTS] Analysis complete');
    
    return insights;
  } catch (error) {
    console.error('❌ [AI-INSIGHTS] Analysis failed:', error);
    throw error;
  }
}

// ============================================
// PROMPT BUILDING
// ============================================

function getSystemPrompt(): string {
  return `You are a fashion and travel packing expert. Analyze the user's trip and provide insights on:
1. Packing appropriateness (weather, activities, overpacking/underpacking)
2. Missing essential items based on activities and weather
3. Outfit improvements for each day

Consider:
- Weather conditions and temperature ranges
- Activity types and formality levels
- Fashion coordination and style
- Practical packing advice
- User's existing closet items
- Trip type and destination

Provide constructive, helpful advice with specific reasoning.`;
}

function buildAnalysisPrompt(data: TripAnalysisData): string {
  const closetSummary = buildClosetSummary(data.clothingItems);
  
  const prompt = `
Analyze this trip and provide packing insights:

TRIP DETAILS:
- Destination: ${data.trip.destination}
- Dates: ${data.trip.start_date} to ${data.trip.end_date} (${getDaysCount(data.trip.start_date, data.trip.end_date)} days)
- Type: ${data.trip.trip_type}
- Travelers: ${data.trip.number_of_travelers}
- Accommodation: ${data.trip.accommodation_type || 'Not specified'}

WEATHER FORECAST:
${data.weatherData.map(w => `  ${w.date}: ${w.temp_low}-${w.temp_high}°F, ${w.condition}`).join('\n')}

PLANNED ACTIVITIES (${data.activities.length} activities):
${data.activities.map(a => `
  Day ${getDayNumber(a.date, data.trip.start_date)}, ${formatTimeSlot(a.time_slot)}:
  - Activity: ${a.title}
  - Type: ${a.activity_type || 'General'}
  - Location: ${a.location || 'Not specified'}
  - Formality: ${a.formality_level || 'Not specified'}/5
  - Planned Outfit: ${getOutfitDescription(a.id, data.outfits, data.clothingItems)}
`).join('\n')}

USER'S CLOSET SUMMARY:
${Object.entries(closetSummary).map(([category, count]) => `  - ${capitalize(category)}: ${count}`).join('\n')}

Please analyze and return JSON with:
{
  "packingInsights": [
    {
      "type": "warning" | "confirmation" | "info",
      "icon": "emoji",
      "message": "brief message",
      "details": "optional additional details"
    }
  ],
  "missingItems": [
    {
      "category": "category-slug",
      "label": "Shop Category Name",
      "reason": "why this is needed",
      "items": ["specific item 1", "specific item 2"]
    }
  ],
  "outfitRecommendations": [
    {
      "day": 1,
      "date": "2024-11-20",
      "activityTitle": "Activity Name",
      "currentOutfit": ["item1", "item2"],
      "suggestion": "What could be better",
      "fashionTip": "Helpful fashion advice",
      "suggestedItems": ["suggested item 1"]
    }
  ]
}

Guidelines:
- Only include recommendations if there are actual issues or improvements
- Be specific and actionable
- Consider weather, formality, and activity type
- If everything looks good, return empty arrays for missingItems and outfitRecommendations
- Limit to most important insights (max 5 per category)
`;

  return prompt;
}

// ============================================
// RESPONSE PARSING
// ============================================

function parseAIResponse(response: string): AIInsights {
  try {
    const parsed = JSON.parse(response);
    
    return {
      packingInsights: parsed.packingInsights || [],
      missingItems: parsed.missingItems || [],
      outfitRecommendations: parsed.outfitRecommendations || [],
    };
  } catch (error) {
    console.error('❌ [AI-INSIGHTS] Failed to parse response:', error);
    throw new Error('Failed to parse AI response');
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDaysCount(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

function formatTimeSlot(timeSlot: string): string {
  const labels: Record<string, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
  };
  return labels[timeSlot] || timeSlot;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
