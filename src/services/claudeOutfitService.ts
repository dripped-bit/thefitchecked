/**
 * Claude AI Outfit Suggestion Service
 * Uses Claude AI to generate intelligent outfit suggestions based on:
 * - Event type and occasion
 * - Weather conditions
 * - Time of day
 * - User's closet clothing items
 * - Clothing categories
 * - Past outfit history
 */

import Anthropic from '@anthropic-ai/sdk';
import { CalendarEvent, WeatherData, OutfitItem, OutfitHistory } from './smartCalendarService';
import outfitHistoryService from './outfitHistoryService';

export interface OutfitSuggestion {
  id: string;
  outfitItems: OutfitItem[];
  confidence: number; // 0-100
  reasoning: string;
  styleNotes: string[];
  weatherAppropriate: boolean;
}

export interface SuggestionRequest {
  event?: CalendarEvent;
  weather: WeatherData;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  availableItems: OutfitItem[];
  outfitHistory?: OutfitHistory[];
  occasion?: string;
  preferences?: {
    formalityLevel?: number; // 1-10
    colorPreferences?: string[];
    avoidRepeat?: boolean;
  };
}

class ClaudeOutfitService {
  private client: Anthropic | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY ||
                  import.meta.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
                  null;

    if (this.apiKey) {
      this.client = new Anthropic({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true // Only for development - move to backend in production
      });
      console.log('✅ [CLAUDE-AI] Claude AI client initialized');
    } else {
      console.warn('⚠️ [CLAUDE-AI] No API key found - set VITE_ANTHROPIC_API_KEY in .env');
    }
  }

  /**
   * Generate 3 outfit suggestions using Claude AI
   */
  async generateOutfitSuggestions(request: SuggestionRequest): Promise<OutfitSuggestion[]> {
    try {
      console.log('🤖 [CLAUDE-AI] Generating outfit suggestions...');

      if (!this.client) {
        console.warn('⚠️ Claude AI not configured, using fallback suggestions');
        return this.getFallbackSuggestions(request);
      }

      // Load outfit history from Supabase for better AI learning
      let outfitHistory = request.outfitHistory || [];
      if (!request.outfitHistory || request.outfitHistory.length === 0) {
        const supabaseHistory = await outfitHistoryService.getHistoryForAI(10);
        outfitHistory = supabaseHistory.map(record => ({
          date: record.worn_date,
          outfitItems: record.outfit_items,
          eventId: record.event_id,
          rating: record.user_rating
        }));
      }

      const prompt = this.buildPrompt({ ...request, outfitHistory });

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const suggestions = this.parseClaudeResponse(responseText, request.availableItems);

      console.log('✅ [CLAUDE-AI] Generated', suggestions.length, 'outfit suggestions');
      return suggestions;

    } catch (error) {
      console.error('❌ [CLAUDE-AI] Failed to generate suggestions:', error);
      return this.getFallbackSuggestions(request);
    }
  }

  /**
   * Build the prompt for Claude AI
   */
  private buildPrompt(request: SuggestionRequest): string {
    const { event, weather, timeOfDay, availableItems, outfitHistory, occasion, preferences } = request;

    // Group items by category
    const itemsByCategory = availableItems.reduce((acc, item) => {
      const category = item.category.toLowerCase();
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as { [key: string]: OutfitItem[] });

    // Build available items description
    const itemsDescription = Object.entries(itemsByCategory)
      .map(([category, items]) => {
        const itemList = items.map(item =>
          `- ${item.name} (formality: ${item.formalityLevel}/10${item.weatherSuitability ? `, weather: ${item.weatherSuitability.join(', ')}` : ''})`
        ).join('\n');
        return `${category.toUpperCase()}:\n${itemList}`;
      })
      .join('\n\n');

    // Build context
    const eventContext = event
      ? `Event: ${event.title}\nType: ${event.eventType}\n${event.location ? `Location: ${event.location}\n` : ''}Time: ${event.startTime.toLocaleTimeString()}`
      : occasion
        ? `Occasion: ${occasion}`
        : 'General daily wear';

    const weatherContext = `Temperature: ${weather.temperature}°F (feels like ${weather.feels_like}°F)
Condition: ${weather.condition}
Precipitation chance: ${weather.precipitationChance}%
Humidity: ${weather.humidity}%
UV Index: ${weather.uvIndex}`;

    // Build outfit history context
    const historyContext = outfitHistory && outfitHistory.length > 0
      ? `\n\nRECENT OUTFIT HISTORY (to avoid repetition):\n${outfitHistory.slice(0, 5).map(h =>
          `- ${h.date.toLocaleDateString()}: ${h.outfitItems.map(i => i.name).join(', ')}${h.rating ? ` (rated ${h.rating}/5)` : ''}`
        ).join('\n')}`
      : '';

    const preferencesContext = preferences
      ? `\n\nUSER PREFERENCES:\n${preferences.formalityLevel ? `- Preferred formality level: ${preferences.formalityLevel}/10\n` : ''}${preferences.colorPreferences ? `- Color preferences: ${preferences.colorPreferences.join(', ')}\n` : ''}${preferences.avoidRepeat ? '- Avoid repeating recent outfits\n' : ''}`
      : '';

    return `You are a professional fashion stylist and outfit coordinator. Your task is to create 3 complete outfit suggestions for the user based on the following context:

EVENT/OCCASION:
${eventContext}

WEATHER:
${weatherContext}

TIME OF DAY: ${timeOfDay}

AVAILABLE CLOTHING ITEMS:
${itemsDescription}${historyContext}${preferencesContext}

TASK:
Generate exactly 3 complete outfit suggestions. Each outfit MUST include:
- At least one TOP (shirt, blouse, sweater, etc.)
- At least one BOTTOM (pants, skirt, shorts, etc.) OR a DRESS/JUMPSUIT
- SHOES
- Optional: ACCESSORIES, OUTERWEAR, etc.

For each outfit, provide:
1. List of item names to wear (must match exactly from available items)
2. Confidence score (0-100) based on how well it matches the occasion and weather
3. Brief reasoning (why this outfit works for this situation)
4. 2-3 style notes (tips for wearing this outfit)

IMPORTANT RULES:
- ONLY use items from the "AVAILABLE CLOTHING ITEMS" list above
- Match item names EXACTLY as shown
- Consider weather appropriateness (temperature, precipitation, condition)
- Match formality level to the event type
- Avoid repeating items from recent history if possible
- Each outfit should be complete and ready to wear
- Provide variety across the 3 suggestions (casual to formal range)

OUTPUT FORMAT (JSON):
{
  "outfits": [
    {
      "items": ["exact item name 1", "exact item name 2", "exact item name 3"],
      "confidence": 85,
      "reasoning": "Brief explanation of why this works",
      "styleNotes": ["tip 1", "tip 2", "tip 3"]
    },
    ... (2 more outfits)
  ]
}`;
  }

  /**
   * Parse Claude's response and match items to actual OutfitItem objects
   */
  private parseClaudeResponse(response: string, availableItems: OutfitItem[]): OutfitSuggestion[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ Could not find JSON in Claude response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const suggestions: OutfitSuggestion[] = [];

      for (const outfit of parsed.outfits || []) {
        // Match item names to actual items
        const matchedItems: OutfitItem[] = [];

        for (const itemName of outfit.items || []) {
          const foundItem = availableItems.find(item =>
            item.name.toLowerCase() === itemName.toLowerCase() ||
            item.name.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(item.name.toLowerCase())
          );

          if (foundItem) {
            matchedItems.push(foundItem);
          }
        }

        if (matchedItems.length >= 2) { // At least 2 items for a valid outfit
          suggestions.push({
            id: `claude_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            outfitItems: matchedItems,
            confidence: outfit.confidence || 75,
            reasoning: outfit.reasoning || 'AI-generated suggestion',
            styleNotes: outfit.styleNotes || [],
            weatherAppropriate: true
          });
        }
      }

      return suggestions.slice(0, 3); // Maximum 3 suggestions

    } catch (error) {
      console.error('❌ Failed to parse Claude response:', error);
      return [];
    }
  }

  /**
   * Fallback suggestions when Claude AI is not available
   */
  private getFallbackSuggestions(request: SuggestionRequest): OutfitSuggestion[] {
    const { availableItems, weather, event } = request;

    if (availableItems.length < 2) {
      return [];
    }

    // Simple rule-based fallback
    const tops = availableItems.filter(item =>
      item.category.toLowerCase().includes('top') ||
      item.category.toLowerCase().includes('shirt')
    );

    const bottoms = availableItems.filter(item =>
      item.category.toLowerCase().includes('bottom') ||
      item.category.toLowerCase().includes('pants') ||
      item.category.toLowerCase().includes('skirt')
    );

    const shoes = availableItems.filter(item =>
      item.category.toLowerCase().includes('shoe') ||
      item.category.toLowerCase().includes('footwear')
    );

    const suggestions: OutfitSuggestion[] = [];

    // Create up to 3 simple combinations
    for (let i = 0; i < Math.min(3, Math.min(tops.length, bottoms.length)); i++) {
      const items = [tops[i], bottoms[i]];
      if (shoes[i]) items.push(shoes[i]);

      suggestions.push({
        id: `fallback_${i}`,
        outfitItems: items,
        confidence: 70,
        reasoning: `Basic outfit combination for ${event?.eventType || 'casual'} occasion`,
        styleNotes: [
          'Weather-appropriate layers recommended',
          'Adjust formality based on occasion',
          'Consider adding accessories'
        ],
        weatherAppropriate: weather.temperature > 60
      });
    }

    return suggestions;
  }
}

export const claudeOutfitService = new ClaudeOutfitService();
export default claudeOutfitService;
