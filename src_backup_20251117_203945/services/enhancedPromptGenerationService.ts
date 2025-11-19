/**
 * Enhanced Prompt Generation Service
 * Uses Claude API to generate precise, specific prompts with negative prompts for fal.ai Seedream
 * Prevents unwanted clothing items and improves image quality
 */

import { WeatherData } from './weatherService';
import strictPromptEnforcementService from './strictPromptEnforcementService';

export interface EnhancedPromptResult {
  mainPrompt: string;
  negativePrompt: string;
  style: string;
  confidence: number;
  reasoning: string;
  clothing_items: string[];
  colors: string[];
  materials: string[];
  unwanted_items: string[];
  strictEnforcement?: {
    enabled: boolean;
    mandatorySpecs: any;
    forbiddenItems: string[];
  };
}

export interface PromptGenerationRequest {
  userRequest: string;
  style?: string;
  weather?: WeatherData;
  gender?: 'male' | 'female' | 'unisex';
  bodyType?: string;
  preferredColors?: string[];
  avoidItems?: string[];
  occasion?: string;
  timeOfDay?: string;
  season?: string;
}

class EnhancedPromptGenerationService {
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private promptCache = new Map<string, { result: EnhancedPromptResult; timestamp: number }>();

  /**
   * Generate enhanced prompts using Claude API with strict enforcement
   */
  async generateEnhancedPrompt(
    request: PromptGenerationRequest,
    useStrictEnforcement: boolean = true
  ): Promise<EnhancedPromptResult> {
    console.log('🧠 [ENHANCED-PROMPT] Starting Claude-enhanced prompt generation');
    console.log('📝 [ENHANCED-PROMPT] Request:', request);
    console.log('🔒 [ENHANCED-PROMPT] Strict enforcement:', useStrictEnforcement);

    // Check cache first
    const cacheKey = this.createCacheKey(request);
    const cached = this.promptCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📋 [ENHANCED-PROMPT] Using cached result');
      return cached.result;
    }

    // If strict enforcement is enabled, use it first
    if (useStrictEnforcement) {
      try {
        console.log('🔒 [ENHANCED-PROMPT] Applying strict enforcement...');
        const enforcement = await strictPromptEnforcementService.enforceSpecifications(
          request.userRequest,
          request.style || 'casual'
        );

        // Build enhanced result with strict enforcement
        const result: EnhancedPromptResult = {
          mainPrompt: enforcement.positivePrompt,
          negativePrompt: enforcement.negativePrompt,
          style: request.style || 'casual',
          confidence: enforcement.confidence,
          reasoning: enforcement.reasoning,
          clothing_items: this.extractItemsFromSpecs(enforcement.mandatorySpecs),
          colors: this.extractColorsFromSpecs(enforcement.mandatorySpecs),
          materials: [],
          unwanted_items: enforcement.forbiddenItems,
          strictEnforcement: {
            enabled: true,
            mandatorySpecs: enforcement.mandatorySpecs,
            forbiddenItems: enforcement.forbiddenItems
          }
        };

        // Cache the result
        this.promptCache.set(cacheKey, { result, timestamp: Date.now() });

        console.log('✅ [ENHANCED-PROMPT] Strict enforcement applied successfully');
        return result;

      } catch (error) {
        console.warn('⚠️ [ENHANCED-PROMPT] Strict enforcement failed, falling back to standard generation:', error);
        // Continue with standard generation below
      }
    }

    try {
      // Construct detailed prompt for Claude
      const claudePrompt = this.buildClaudePrompt(request);
      console.log('📤 [ENHANCED-PROMPT] Sending request to Claude API...');
      console.log('📝 [ENHANCED-PROMPT] Prompt length:', claudePrompt.length);

      const requestBody = {
        model: 'claude-haiku-4-5',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: claudePrompt
        }]
      };

      console.log('📋 [ENHANCED-PROMPT] Request body:', {
        model: requestBody.model,
        max_tokens: requestBody.max_tokens,
        messageCount: requestBody.messages.length
      });

      // Call Claude API using the same format as webEnhancedPromptService
      const response = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ENHANCED-PROMPT] Claude API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Claude API failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [ENHANCED-PROMPT] Claude API Response received:', Object.keys(data));
      const content = data.content?.[0]?.text || '';

      if (!content) {
        console.warn('⚠️ [ENHANCED-PROMPT] No content in Claude response:', data);
        throw new Error('No content received from Claude API');
      }

      // Parse Claude's response
      const result = this.parseClaudeResponse(content, request);

      // Cache the result
      this.promptCache.set(cacheKey, { result, timestamp: Date.now() });

      console.log('✅ [ENHANCED-PROMPT] Generated enhanced prompt:', result);
      return result;

    } catch (error) {
      console.error('❌ [ENHANCED-PROMPT] Failed to generate:', error);

      // Fallback to basic prompt generation
      return this.generateFallbackPrompt(request);
    }
  }

  /**
   * Build simplified prompt for Claude API (similar to working webEnhancedPromptService)
   */
  private buildClaudePrompt(request: PromptGenerationRequest): string {
    const {
      userRequest,
      style = 'casual',
      weather,
      occasion = 'everyday'
    } = request;

    return `As a fashion expert, create an enhanced prompt for AI image generation based on: "${userRequest}".

Style: ${style}
Occasion: ${occasion}
${weather ? `Weather: ${weather.temperature}°F, ${weather.condition}` : ''}

Create a JSON response with:
1. mainPrompt - detailed positive prompt for the clothing item
2. negativePrompt - list of items to avoid
3. clothing_items - array of specific clothing pieces
4. colors - array of colors mentioned
5. confidence - number 1-100

Format:
{
  "mainPrompt": "enhanced detailed prompt",
  "negativePrompt": "unwanted items to avoid",
  "clothing_items": ["item1", "item2"],
  "colors": ["color1", "color2"],
  "confidence": 85
}`;
  }

  /**
   * Parse Claude's JSON response
   */
  private parseClaudeResponse(content: string, request: PromptGenerationRequest): EnhancedPromptResult {
    console.log('🔍 [ENHANCED-PROMPT] Parsing Claude response:', content.substring(0, 200) + '...');

    try {
      // Extract JSON from Claude's response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ [ENHANCED-PROMPT] No JSON found in response, attempting simple extraction');

        // Try to extract data without JSON
        return {
          mainPrompt: this.extractMainPromptFromText(content, request.userRequest),
          negativePrompt: this.getDefaultNegativePrompt(),
          style: request.style || 'casual',
          confidence: 70,
          reasoning: 'Extracted from non-JSON response',
          clothing_items: this.extractBasicItems(request.userRequest),
          colors: this.extractBasicColors(request.userRequest),
          materials: [],
          unwanted_items: []
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ [ENHANCED-PROMPT] Successfully parsed JSON:', Object.keys(parsed));

      // Validate and enhance the response
      return {
        mainPrompt: parsed.mainPrompt || this.extractMainPromptFromText(content, request.userRequest),
        negativePrompt: parsed.negativePrompt || this.getDefaultNegativePrompt(),
        style: parsed.style || request.style || 'casual',
        confidence: Math.min(Math.max(parsed.confidence || 80, 0), 100),
        reasoning: parsed.reasoning || 'AI-generated enhanced prompt',
        clothing_items: Array.isArray(parsed.clothing_items) ? parsed.clothing_items : this.extractBasicItems(request.userRequest),
        colors: Array.isArray(parsed.colors) ? parsed.colors : this.extractBasicColors(request.userRequest),
        materials: Array.isArray(parsed.materials) ? parsed.materials : [],
        unwanted_items: Array.isArray(parsed.unwanted_items) ? parsed.unwanted_items : []
      };

    } catch (error) {
      console.warn('⚠️ [ENHANCED-PROMPT] Failed to parse Claude response:', error);
      console.log('📋 [ENHANCED-PROMPT] Raw content:', content);
      return this.generateFallbackPrompt(request);
    }
  }

  /**
   * Extract main prompt from text when JSON parsing fails
   */
  private extractMainPromptFromText(content: string, originalPrompt: string): string {
    // Look for enhanced descriptions in the text
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.includes(originalPrompt) || line.includes('prompt') || line.includes('enhanced')) {
        return line.trim();
      }
    }

    // Fallback to enhanced original prompt
    return `${originalPrompt}, high quality fashion photography, professional studio lighting, detailed fabric texture`;
  }

  /**
   * Generate fallback prompt when Claude API fails
   */
  private generateFallbackPrompt(request: PromptGenerationRequest): EnhancedPromptResult {
    const { userRequest, style = 'casual' } = request;

    // Basic prompt enhancement
    const enhancedMain = `${userRequest}, ${style} style, high quality fashion photography, professional studio lighting, detailed fabric texture, modern design, clean background`;

    // Basic negative prompt
    const negativePrompt = this.getDefaultNegativePrompt();

    return {
      mainPrompt: enhancedMain,
      negativePrompt,
      style,
      confidence: 60,
      reasoning: 'Fallback prompt due to API unavailability',
      clothing_items: this.extractBasicItems(userRequest),
      colors: this.extractBasicColors(userRequest),
      materials: [],
      unwanted_items: []
    };
  }

  /**
   * Get default negative prompt for quality and appropriateness
   */
  private getDefaultNegativePrompt(): string {
    return [
      // Quality issues
      'blurry', 'low quality', 'distorted', 'pixelated', 'bad anatomy', 'deformed',
      'ugly', 'bad proportions', 'duplicate', 'watermark', 'signature', 'text',
      'jpeg artifacts', 'worst quality', 'lowres', 'bad hands', 'error',
      'missing fingers', 'extra digit', 'fewer digits', 'cropped',

      // Unwanted elements
      'nude', 'nsfw', 'inappropriate', 'revealing', 'sexual',
      'multiple people', 'crowd', 'group',

      // Style issues
      'cartoon', 'anime', 'drawing', 'sketch', 'painting',
      'unrealistic', 'fantasy', 'sci-fi',

      // Background issues
      'busy background', 'cluttered', 'distracting background',

      // Common AI problems
      'floating objects', 'disconnected limbs', 'extra limbs',
      'malformed', 'asymmetric', 'unnatural pose'
    ].join(', ');
  }

  /**
   * Extract basic clothing items from user request
   */
  private extractBasicItems(userRequest: string): string[] {
    const commonItems = [
      'dress', 'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'coat',
      'pants', 'jeans', 'trousers', 'skirt', 'shorts', 'suit',
      'shoes', 'boots', 'sneakers', 'heels', 'sandals',
      'hat', 'scarf', 'belt', 'bag', 'accessories'
    ];

    const found = [];
    const lowerRequest = userRequest.toLowerCase();

    for (const item of commonItems) {
      if (lowerRequest.includes(item)) {
        found.push(item);
      }
    }

    return found;
  }

  /**
   * Extract basic colors from user request
   */
  private extractBasicColors(userRequest: string): string[] {
    const commonColors = [
      'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey',
      'pink', 'purple', 'orange', 'brown', 'navy', 'beige', 'khaki',
      'burgundy', 'maroon', 'teal', 'olive', 'coral', 'mint', 'gold', 'silver'
    ];

    const found = [];
    const lowerRequest = userRequest.toLowerCase();

    for (const color of commonColors) {
      if (lowerRequest.includes(color)) {
        found.push(color);
      }
    }

    return found;
  }

  /**
   * Create cache key for prompt requests
   */
  private createCacheKey(request: PromptGenerationRequest): string {
    const keyData = {
      userRequest: request.userRequest,
      style: request.style,
      gender: request.gender,
      occasion: request.occasion,
      preferredColors: request.preferredColors?.sort(),
      avoidItems: request.avoidItems?.sort()
    };

    return btoa(JSON.stringify(keyData));
  }

  /**
   * Generate multiple prompt variations for A/B testing
   */
  async generatePromptVariations(request: PromptGenerationRequest, count: number = 3): Promise<EnhancedPromptResult[]> {
    console.log(`🔄 [ENHANCED-PROMPT] Generating ${count} prompt variations`);

    const variations = [];
    const baseRequest = { ...request };

    // Generate variations with different approaches
    const approaches = [
      { ...baseRequest, userRequest: `${baseRequest.userRequest}, detailed texture focus` },
      { ...baseRequest, userRequest: `${baseRequest.userRequest}, minimalist clean design` },
      { ...baseRequest, userRequest: `${baseRequest.userRequest}, high fashion editorial style` }
    ];

    for (let i = 0; i < Math.min(count, approaches.length); i++) {
      try {
        const variation = await this.generateEnhancedPrompt(approaches[i]);
        variations.push(variation);
      } catch (error) {
        console.warn(`⚠️ [ENHANCED-PROMPT] Failed to generate variation ${i + 1}:`, error);
      }
    }

    return variations;
  }

  /**
   * Analyze user feedback to improve future prompts
   */
  recordFeedback(originalRequest: PromptGenerationRequest, result: EnhancedPromptResult, rating: number, feedback?: string): void {
    console.log('📊 [ENHANCED-PROMPT] Recording user feedback:', { rating, feedback });

    try {
      const feedbackData = {
        request: originalRequest,
        result: result,
        rating: rating,
        feedback: feedback,
        timestamp: Date.now()
      };

      // Store in localStorage for learning (could be enhanced with backend storage)
      const existingFeedback = JSON.parse(localStorage.getItem('promptFeedback') || '[]');
      existingFeedback.push(feedbackData);

      // Keep only last 100 feedback entries
      if (existingFeedback.length > 100) {
        existingFeedback.splice(0, existingFeedback.length - 100);
      }

      localStorage.setItem('promptFeedback', JSON.stringify(existingFeedback));

      console.log('✅ [ENHANCED-PROMPT] Feedback recorded successfully');
    } catch (error) {
      console.error('❌ [ENHANCED-PROMPT] Failed to record feedback:', error);
    }
  }

  /**
   * Clear prompt cache
   */
  clearCache(): void {
    this.promptCache.clear();
    console.log('🧹 [ENHANCED-PROMPT] Cache cleared');
  }

  /**
   * Extract clothing items from mandatory specs
   */
  private extractItemsFromSpecs(specs: any): string[] {
    const items: string[] = [];

    if (specs.top) {
      items.push(specs.top.type);
    }
    if (specs.bottom) {
      items.push(specs.bottom.type);
    }
    if (specs.dress) {
      items.push(specs.dress.type);
    }
    if (specs.shoes) {
      items.push(specs.shoes.type);
    }

    return items;
  }

  /**
   * Extract colors from mandatory specs
   */
  private extractColorsFromSpecs(specs: any): string[] {
    const colors: string[] = [];

    if (specs.top?.color) {
      colors.push(specs.top.color);
    }
    if (specs.bottom?.color) {
      colors.push(specs.bottom.color);
    }
    if (specs.dress?.color) {
      colors.push(specs.dress.color);
    }

    return [...new Set(colors)]; // Remove duplicates
  }
}

export default new EnhancedPromptGenerationService();