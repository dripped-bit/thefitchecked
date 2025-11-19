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
import { getAppropriateSubcategories, getTempCategory, getQuickRefForTemp } from './subcategoryWeatherMatrix';
import { getChatGPTJSON } from '../lib/openai';

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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.9, // Increased for more variety (was 0.7)
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const suggestions = this.parseClaudeResponse(responseText, request.availableItems);

      console.log('✅ [CLAUDE-AI] Generated', suggestions.length, 'outfit suggestions');
      
      // NEW: Validate each outfit with OpenAI
      console.log('🔍 [DUAL-AI] Validating outfits with OpenAI...');
      
      const validatedSuggestions = await Promise.all(
        suggestions.map(async (outfit) => {
          const validation = await this.validateWithOpenAI(
            outfit,
            request.weather,
            request.timeOfDay,
            request.occasion || 'casual'
          );
          
          // Add validation notes to outfit
          return {
            ...outfit,
            confidence: validation.confidence === 'high' ? 90 : 
                       validation.confidence === 'medium' ? 75 : 60,
            styleNotes: [
              ...outfit.styleNotes,
              ...validation.suggestions
            ],
            reasoning: `${outfit.reasoning}\n\nOpenAI Validation: ${validation.approved ? '✓ Approved' : '⚠ Needs adjustment'}`
          };
        })
      );

      console.log('✅ [DUAL-AI] All outfits validated');
      return validatedSuggestions;

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

    // NEW: Add comprehensive weather matrix guidance
    const dayType = this.getDayType(new Date());
    const appropriateSubcategories = getAppropriateSubcategories(
      weather.temperature,
      timeOfDay,
      dayType,
      occasion || 'casual'
    );

    const matrixGuidance = `

WEATHER & SUBCATEGORY MATRIX GUIDANCE:

Current Context:
- Temperature: ${weather.temperature}°F → ${getTempCategory(weather.temperature)}
- Time: ${timeOfDay} ${dayType}
- Occasion: ${occasion || 'casual daily'}

RECOMMENDED SUBCATEGORIES FOR THESE CONDITIONS:
${appropriateSubcategories.slice(0, 10).map(sc => 
  `✓ ${sc.subcategory} (${sc.category}): ${sc.bestFor}`
).join('\n')}

TEMPERATURE QUICK REFERENCE:
→ ${getTempCategory(weather.temperature)}: ${getQuickRefForTemp(weather.temperature)}

TIME OF DAY CONSIDERATIONS:
${timeOfDay === 'morning' ? '→ MORNING (CURRENT): Activewear if athletic, work attire if professional, casual basics for remote/student lifestyles' : ''}
${timeOfDay === 'afternoon' ? '→ AFTERNOON (CURRENT): Peak temperature clothing, work attire continues, casual wear' : ''}
${timeOfDay === 'evening' ? '→ EVENING (CURRENT): Layering pieces return, date night attire (Thu-Sun), formal wear, temperature drops' : ''}

OUTFIT SELECTION GUIDELINES:
1. Prioritize subcategories listed above that match current temperature
2. Consider time-of-day appropriateness (morning work vs evening social)
3. Match day type: weekday = work/casual, weekend = brunch/social
4. Layer appropriately for temperature changes
5. Select complete outfits (top + bottom OR dress, plus shoes)
`;

    return `You are a professional fashion stylist and outfit coordinator with EXPERT knowledge of weather-appropriate dressing. Your task is to create 3 complete outfit suggestions for the user based on the following context:

EVENT/OCCASION:
${eventContext}

WEATHER:
${weatherContext}

TIME OF DAY: ${timeOfDay}
${matrixGuidance}

AVAILABLE CLOTHING ITEMS:
${itemsDescription}${historyContext}${preferencesContext}

TASK:
Generate 1-3 complete outfit suggestions based on available items. Each outfit MUST include:
- At least one TOP (shirt, blouse, sweater, etc.)
- At least one BOTTOM (pants, skirt, shorts, etc.) OR a DRESS/JUMPSUIT
- SHOES
- Optional: ACCESSORIES, OUTERWEAR, etc.

For each outfit, provide:
1. List of item names to wear (must match exactly from available items)
2. Confidence score (0-100) based on how well it matches the occasion and weather
3. Brief reasoning (why this outfit works - MENTION TEMPERATURE SUITABILITY)
4. 2-3 style notes (tips for wearing this outfit)

QUANTITY GUIDELINES:
- If many items (10+): Generate 3 diverse outfits
- If moderate items (5-9): Generate 2 outfits
- If limited items (2-4): Generate 1 outfit
- Quality over quantity - better to have 1 great outfit than 3 mediocre ones

IMPORTANT RULES:
- ONLY use items from the "AVAILABLE CLOTHING ITEMS" list above
- Match item names EXACTLY as shown
- PRIORITIZE items matching the recommended subcategories for ${weather.temperature}°F
- Consider weather appropriateness (temperature, precipitation, condition)
- Match formality level to the event type and time of day
- Avoid repeating items from recent history if possible
- Each outfit should be complete and ready to wear
- CREATE COMPLETELY DIFFERENT OUTFITS - do NOT reuse the same item combinations!
- Each of the 3 outfits MUST use different items - maximum 1 shared item between any two outfits
- Provide variety across the 3 suggestions (casual to formal range, different colors, different styles)
- EXPLAIN in reasoning how outfit matches temperature and occasion

OUTPUT FORMAT (JSON):
{
  "outfits": [
    {
      "items": ["exact item name 1", "exact item name 2", "exact item name 3"],
      "confidence": 85,
      "reasoning": "Brief explanation including temperature suitability",
      "styleNotes": ["tip 1", "tip 2", "tip 3"]
    },
    ... (2 more outfits)
  ]
}`;
  }

  /**
   * Get day type (weekday, saturday, sunday) for matrix
   */
  private getDayType(date: Date): 'weekday' | 'saturday' | 'sunday' {
    const day = date.getDay();
    if (day === 0) return 'sunday';
    if (day === 6) return 'saturday';
    return 'weekday';
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
   * Enhanced with multiple strategies to always return at least 1 outfit
   */
  private getFallbackSuggestions(request: SuggestionRequest): OutfitSuggestion[] {
    const { availableItems, weather, event, occasion } = request;

    if (availableItems.length < 2) {
      return [];
    }

    // Enhanced categorization with regex for better matching
    const tops = availableItems.filter(item =>
      /top|shirt|blouse|sweater|tee|tank/i.test(item.category) ||
      /top|shirt|blouse|sweater|tee|tank/i.test(item.name)
    );

    const bottoms = availableItems.filter(item =>
      /bottom|pant|jean|short|skirt|trouser/i.test(item.category) ||
      /bottom|pant|jean|short|skirt|trouser/i.test(item.name)
    );

    const dresses = availableItems.filter(item =>
      /dress|jumpsuit|romper/i.test(item.category) ||
      /dress|jumpsuit|romper/i.test(item.name)
    );

    const shoes = availableItems.filter(item =>
      /shoe|footwear|sneaker|boot|sandal/i.test(item.category) ||
      /shoe|footwear|sneaker|boot|sandal/i.test(item.name)
    );

    const suggestions: OutfitSuggestion[] = [];

    // Strategy 1: Dresses (easiest - just 1 item + shoes)
    if (dresses.length > 0) {
      for (let i = 0; i < Math.min(2, dresses.length); i++) {
        const items = [dresses[i]];
        if (shoes.length > 0) {
          items.push(shoes[i % shoes.length]);
        }
        
        suggestions.push({
          id: `fallback_dress_${i}`,
          outfitItems: items,
          confidence: 75,
          reasoning: `Simple and elegant dress outfit for ${occasion || event?.eventType || 'the day'}`,
          styleNotes: ['Comfortable and easy to wear', 'Add accessories to personalize'],
          weatherAppropriate: true
        });
      }
    }

    // Strategy 2: Top + Bottom combinations
    const maxCombos = Math.min(3 - suggestions.length, tops.length, bottoms.length);
    for (let i = 0; i < maxCombos; i++) {
      const items = [tops[i], bottoms[i]];
      if (shoes.length > 0) {
        items.push(shoes[i % shoes.length]);
      }

      suggestions.push({
        id: `fallback_combo_${i}`,
        outfitItems: items,
        confidence: 70,
        reasoning: `Classic combination for ${occasion || event?.eventType || 'daily wear'}`,
        styleNotes: ['Layer with jacket if needed', 'Weather-appropriate', 'Adjust formality based on occasion'],
        weatherAppropriate: true
      });
    }

    // Strategy 3: If still no suggestions, create from ANY items (last resort)
    if (suggestions.length === 0 && availableItems.length >= 2) {
      const items = availableItems.slice(0, Math.min(3, availableItems.length));
      suggestions.push({
        id: 'fallback_basic',
        outfitItems: items,
        confidence: 60,
        reasoning: 'Basic outfit from available items',
        styleNotes: ['Mix and match as needed', 'Add your personal style'],
        weatherAppropriate: true
      });
    }

    console.log('🔄 [FALLBACK] Generated', suggestions.length, 'fallback outfits');
    return suggestions.slice(0, 3); // Max 3
  }

  /**
   * Validate outfit with OpenAI for styling coherence and trends
   */
  private async validateWithOpenAI(
    outfit: OutfitSuggestion,
    weather: WeatherData,
    timeOfDay: string,
    occasion: string
  ): Promise<{ approved: boolean; suggestions: string[]; confidence: string }> {
    
    try {
      const outfitDescription = outfit.outfitItems.map(item => 
        `${item.name} (${item.category})`
      ).join(', ');
      
      const prompt = `You are a fashion expert validating an outfit recommendation.

OUTFIT: ${outfitDescription}

CONTEXT:
- Weather: ${weather.temperature}°F, ${weather.condition}
- Time: ${timeOfDay}
- Occasion: ${occasion}
- Day: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

YOUR TASK:
1. Check if items work together visually
2. Validate weather appropriateness
3. Check for style disasters (e.g., athletic wear + heels)
4. Assess trend-awareness and fashion-forward thinking
5. Provide confidence level

RESPOND WITH JSON ONLY:
{
  "approved": true/false,
  "confidence": "high" | "medium" | "low",
  "suggestions": ["improvement 1", "improvement 2"],
  "warnings": ["potential issue 1"],
  "trendScore": 1-10,
  "reasoning": "brief explanation"
}`;

      const validation = await getChatGPTJSON(prompt, {
        model: 'gpt-4o',
        temperature: 0.3,
        systemMessage: 'You are a professional fashion stylist with expertise in current trends and weather-appropriate styling. Respond ONLY with valid JSON.'
      });
      
      console.log('✅ [OPENAI-VALIDATE] Outfit validated:', validation);
      
      return {
        approved: validation.approved,
        suggestions: validation.suggestions || [],
        confidence: validation.confidence
      };
      
    } catch (error) {
      console.warn('⚠️ [OPENAI-VALIDATE] Validation failed, approving anyway:', error);
      // Fallback: approve if OpenAI fails
      return {
        approved: true,
        suggestions: [],
        confidence: 'medium'
      };
    }
  }
}

export const claudeOutfitService = new ClaudeOutfitService();
export default claudeOutfitService;
