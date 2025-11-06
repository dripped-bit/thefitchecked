/**
 * PersonalizedFashionService - Core algorithm for generating personalized daily outfit suggestions
 * Combines: user style survey data + current weather + saved clothing preferences + occasion type
 * Generates 3 daily outfit suggestions using fal.ai APIs with avatar try-on previews
 */

import { weatherService, WeatherData, WeatherConditions, ClothingRecommendations } from './weatherService';
import { closetService } from './closetService';
import { enhancedTwoStepService } from './enhancedTwoStepService';
import type { StyleProfile } from './outfitGenerationService';
import type { ClothingItem, UserProfile } from '../types';
import outfitCoherenceValidator from './outfitCoherenceValidator';

export interface OccasionType {
  id: string;
  name: string;
  formality: 'casual' | 'business_casual' | 'formal' | 'dressy_casual' | 'athletic';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  duration: 'short' | 'medium' | 'long' | 'all_day';
}

export interface PersonalizedSuggestion {
  id: string;
  score: number;
  outfit: {
    prompt: string;
    enhancedPrompt: string;
    imageUrl?: string;
    tryOnImageUrl?: string;
  };
  reasoning: {
    weatherFactors: string[];
    styleFactors: string[];
    occasionFactors: string[];
    personalFactors: string[];
  };
  metadata: {
    weatherConditions: WeatherConditions;
    occasion: OccasionType;
    styleArchetypes: string[];
    colorPalette: string[];
    timestamp: string;
    confidence: number;
  };
}

export interface DailySuggestions {
  date: string;
  weather: WeatherData;
  occasion: OccasionType;
  suggestions: PersonalizedSuggestion[];
  generatedAt: string;
  userProfile: {
    styleProfile: StyleProfile;
    preferences: string[];
  };
}

export interface PersonalizationData {
  styleProfile: StyleProfile;
  userProfile: UserProfile;
  closetItems: ClothingItem[];
  recentChoices: string[];
  feedback: {
    liked: string[];
    disliked: string[];
  };
}

class PersonalizedFashionService {
  private readonly MAX_SUGGESTIONS = 3;
  private readonly CONFIDENCE_THRESHOLD = 0.6;

  // Predefined occasions for suggestion generation
  private readonly OCCASIONS: OccasionType[] = [
    {
      id: 'work_casual',
      name: 'Work (Casual)',
      formality: 'business_casual',
      timeOfDay: 'morning',
      duration: 'all_day'
    },
    {
      id: 'weekend_casual',
      name: 'Weekend Casual',
      formality: 'casual',
      timeOfDay: 'any',
      duration: 'medium'
    },
    {
      id: 'dinner_out',
      name: 'Dinner Out',
      formality: 'dressy_casual',
      timeOfDay: 'evening',
      duration: 'medium'
    },
    {
      id: 'gym_workout',
      name: 'Gym/Workout',
      formality: 'athletic',
      timeOfDay: 'any',
      duration: 'short'
    },
    {
      id: 'date_night',
      name: 'Date Night',
      formality: 'formal',
      timeOfDay: 'evening',
      duration: 'medium'
    }
  ];

  /**
   * Generate personalized daily outfit suggestions
   */
  async generateDailySuggestions(
    occasionId?: string,
    weatherOverride?: WeatherData
  ): Promise<DailySuggestions> {
    try {
      console.log('🎯 [FASHION] Starting personalized suggestion generation...');

      // Get current weather data
      const weather = weatherOverride || await weatherService.getCurrentWeather();
      const weatherConditions = weatherService.analyzeWeatherConditions(weather);
      const clothingRecommendations = weatherService.getClothingRecommendations(weatherConditions);

      // Get user personalization data
      const personalizationData = await this.getPersonalizationData();

      // Determine occasion (default to work casual)
      const occasion = occasionId
        ? this.OCCASIONS.find(o => o.id === occasionId) || this.OCCASIONS[0]
        : this.getDefaultOccasion();

      console.log(`🎯 [FASHION] Generating for occasion: ${occasion.name}`);
      console.log(`🌤️ [FASHION] Weather conditions: ${weatherConditions.temperature}, ${weatherConditions.overall}`);

      // Generate multiple outfit suggestions
      const suggestions = await this.generateOutfitSuggestions(
        weather,
        weatherConditions,
        clothingRecommendations,
        occasion,
        personalizationData
      );

      const dailySuggestions: DailySuggestions = {
        date: new Date().toISOString().split('T')[0],
        weather,
        occasion,
        suggestions,
        generatedAt: new Date().toISOString(),
        userProfile: {
          styleProfile: personalizationData.styleProfile,
          preferences: personalizationData.userProfile.style_preferences || []
        }
      };

      console.log(`✅ [FASHION] Generated ${suggestions.length} personalized suggestions`);
      return dailySuggestions;

    } catch (error) {
      console.error('❌ [FASHION] Failed to generate daily suggestions:', error);
      throw new Error('Failed to generate personalized suggestions');
    }
  }

  /**
   * Generate multiple outfit suggestions based on all factors
   */
  private async generateOutfitSuggestions(
    weather: WeatherData,
    weatherConditions: WeatherConditions,
    clothingRecommendations: ClothingRecommendations,
    occasion: OccasionType,
    personalizationData: PersonalizationData
  ): Promise<PersonalizedSuggestion[]> {
    const suggestions: PersonalizedSuggestion[] = [];

    // Generate 3 different outfit approaches
    const approaches = [
      'style_focused', // Focus on user's style preferences
      'weather_optimal', // Optimize for weather conditions
      'occasion_perfect' // Perfect for the occasion
    ];

    for (let i = 0; i < this.MAX_SUGGESTIONS; i++) {
      const approach = approaches[i];
      const suggestion = await this.generateSingleSuggestion(
        weather,
        weatherConditions,
        clothingRecommendations,
        occasion,
        personalizationData,
        approach,
        i
      );

      if (suggestion && suggestion.metadata.confidence >= this.CONFIDENCE_THRESHOLD) {
        suggestions.push(suggestion);
      }
    }

    // Sort by score (highest first)
    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate a single personalized outfit suggestion
   */
  private async generateSingleSuggestion(
    weather: WeatherData,
    weatherConditions: WeatherConditions,
    clothingRecommendations: ClothingRecommendations,
    occasion: OccasionType,
    personalizationData: PersonalizationData,
    approach: string,
    index: number
  ): Promise<PersonalizedSuggestion | null> {
    try {
      // Build outfit prompt based on approach
      const promptData = this.buildOutfitPrompt(
        weatherConditions,
        clothingRecommendations,
        occasion,
        personalizationData,
        approach
      );

      // Generate outfit using enhanced two-step service
      const outfitResult = await enhancedTwoStepService.generateStandaloneOutfit(
        promptData.prompt,
        this.mapFormalityToStyle(occasion.formality),
        true // Use enhanced prompts
      );

      if (!outfitResult.success || !outfitResult.imageUrl) {
        console.warn(`⚠️ [FASHION] Failed to generate outfit ${index + 1}`);
        return null;
      }

      // Calculate suggestion score
      const score = this.calculateSuggestionScore(
        weatherConditions,
        occasion,
        personalizationData,
        approach
      );

      // Build reasoning
      const reasoning = this.buildReasoning(
        weatherConditions,
        clothingRecommendations,
        occasion,
        personalizationData,
        approach
      );

      const suggestion: PersonalizedSuggestion = {
        id: `suggestion_${Date.now()}_${index}`,
        score,
        outfit: {
          prompt: promptData.prompt,
          enhancedPrompt: promptData.enhancedPrompt,
          imageUrl: outfitResult.imageUrl
        },
        reasoning,
        metadata: {
          weatherConditions,
          occasion,
          styleArchetypes: personalizationData.styleProfile.fashionPersonality?.archetypes || [],
          colorPalette: personalizationData.styleProfile.fashionPersonality?.colorPalette || [],
          timestamp: new Date().toISOString(),
          confidence: outfitResult.metadata?.confidence || 0.8
        }
      };

      console.log(`✅ [FASHION] Generated suggestion ${index + 1} (score: ${score.toFixed(2)})`);
      return suggestion;

    } catch (error) {
      console.error(`❌ [FASHION] Failed to generate suggestion ${index + 1}:`, error);
      return null;
    }
  }

  /**
   * Build outfit prompt based on all factors
   */
  private buildOutfitPrompt(
    weatherConditions: WeatherConditions,
    clothingRecommendations: ClothingRecommendations,
    occasion: OccasionType,
    personalizationData: PersonalizationData,
    approach: string
  ): { prompt: string; enhancedPrompt: string } {
    const { styleProfile } = personalizationData;
    const archetypes = styleProfile.fashionPersonality?.archetypes || [];
    const colorPalette = styleProfile.fashionPersonality?.colorPalette || [];
    const preferredStyles = styleProfile.fashionPersonality?.preferredStyles || [];

    let basePrompt = '';
    let focusAreas: string[] = [];

    // Build prompt based on approach
    switch (approach) {
      case 'style_focused':
        basePrompt = `${archetypes.join(' and ')} style outfit`;
        focusAreas = [...preferredStyles, ...archetypes];
        break;

      case 'weather_optimal':
        basePrompt = `${weatherConditions.temperature} weather ${clothingRecommendations.layers} outfit`;
        focusAreas = clothingRecommendations.materials;
        break;

      case 'occasion_perfect':
        basePrompt = `${occasion.formality} ${occasion.name.toLowerCase()} outfit`;
        focusAreas = [occasion.formality, occasion.timeOfDay];
        break;
    }

    // Add weather-appropriate elements
    if (weatherConditions.temperature === 'hot' || weatherConditions.temperature === 'warm') {
      basePrompt += ` with ${clothingRecommendations.materials.join(', ')} materials`;
    }

    if (weatherConditions.precipitation !== 'none') {
      basePrompt += ' with weather protection';
    }

    // Add color preferences
    if (colorPalette.length > 0) {
      const selectedColors = colorPalette.slice(0, 2).join(' and ');
      basePrompt += ` in ${selectedColors} colors`;
    }

    // Add style elements
    if (preferredStyles.length > 0) {
      basePrompt += ` with ${preferredStyles.slice(0, 2).join(' and ')} elements`;
    }

    // Create enhanced prompt
    const enhancedPrompt = this.enhancePromptWithContext(
      basePrompt,
      weatherConditions,
      clothingRecommendations,
      occasion,
      styleProfile
    );

    return {
      prompt: basePrompt,
      enhancedPrompt
    };
  }

  /**
   * Enhance prompt with additional context and quality modifiers
   */
  private enhancePromptWithContext(
    basePrompt: string,
    weatherConditions: WeatherConditions,
    clothingRecommendations: ClothingRecommendations,
    occasion: OccasionType,
    styleProfile: StyleProfile
  ): string {
    let enhanced = basePrompt;

    // Add quality modifiers
    enhanced += ', high fashion, well-coordinated, stylish, contemporary';

    // Add weather-specific details
    if (weatherConditions.overall === 'sunny') {
      enhanced += ', bright lighting appropriate';
    } else if (weatherConditions.overall === 'rainy') {
      enhanced += ', weather-resistant materials';
    }

    // Add occasion-specific details
    if (occasion.formality === 'formal') {
      enhanced += ', elegant, sophisticated, refined';
    } else if (occasion.formality === 'casual') {
      enhanced += ', comfortable, relaxed, effortless';
    } else if (occasion.formality === 'athletic') {
      enhanced += ', activewear, performance materials, sporty';
    }

    // Add body type considerations
    if (styleProfile.bodyType) {
      enhanced += `, flattering for ${styleProfile.bodyType} body type`;
    }

    // Add styling details
    enhanced += ', professional photography, clean background, detailed textures, realistic materials';

    return enhanced;
  }

  /**
   * Calculate suggestion score based on multiple factors
   */
  private calculateSuggestionScore(
    weatherConditions: WeatherConditions,
    occasion: OccasionType,
    personalizationData: PersonalizationData,
    approach: string
  ): number {
    let score = 0.5; // Base score

    // Weather appropriateness (30% weight)
    score += this.calculateWeatherScore(weatherConditions) * 0.3;

    // Style alignment (25% weight)
    score += this.calculateStyleScore(personalizationData.styleProfile) * 0.25;

    // Occasion appropriateness (25% weight)
    score += this.calculateOccasionScore(occasion) * 0.25;

    // Personal preference alignment (20% weight)
    score += this.calculatePersonalScore(personalizationData) * 0.2;

    // Approach bonus
    if (approach === 'style_focused') score += 0.05;
    else if (approach === 'weather_optimal') score += 0.03;
    else if (approach === 'occasion_perfect') score += 0.04;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate weather appropriateness score
   */
  private calculateWeatherScore(conditions: WeatherConditions): number {
    let score = 0.7; // Base weather score

    // Temperature appropriateness
    if (conditions.temperature === 'mild') score += 0.2;
    else if (conditions.temperature === 'warm' || conditions.temperature === 'cool') score += 0.15;
    else if (conditions.temperature === 'hot' || conditions.temperature === 'cold') score += 0.1;

    // Weather condition bonus
    if (conditions.overall === 'sunny') score += 0.1;
    else if (conditions.overall === 'cloudy') score += 0.05;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate style alignment score
   */
  private calculateStyleScore(styleProfile: StyleProfile): number {
    let score = 0.6;

    // Style archetype diversity
    const archetypes = styleProfile.fashionPersonality?.archetypes || [];
    if (archetypes.length > 0) score += 0.2;
    if (archetypes.length > 2) score += 0.1;

    // Color palette richness
    const colorPalette = styleProfile.fashionPersonality?.colorPalette || [];
    if (colorPalette.length > 0) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate occasion appropriateness score
   */
  private calculateOccasionScore(occasion: OccasionType): number {
    let score = 0.7;

    // Time of day appropriateness
    const currentHour = new Date().getHours();
    if (occasion.timeOfDay === 'morning' && currentHour < 12) score += 0.15;
    else if (occasion.timeOfDay === 'afternoon' && currentHour >= 12 && currentHour < 17) score += 0.15;
    else if (occasion.timeOfDay === 'evening' && currentHour >= 17) score += 0.15;
    else if (occasion.timeOfDay === 'any') score += 0.1;

    // Formality appropriateness
    if (occasion.formality === 'casual' || occasion.formality === 'business_casual') score += 0.15;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate personal preference score
   */
  private calculatePersonalScore(personalizationData: PersonalizationData): number {
    let score = 0.5;

    // User preference alignment
    const preferences = personalizationData.userProfile.style_preferences || [];
    if (preferences.length > 0) score += 0.2;
    if (preferences.length > 3) score += 0.1;

    // Feedback consideration
    if (personalizationData.feedback.liked.length > 0) score += 0.15;

    // Closet item integration potential
    if (personalizationData.closetItems.length > 0) score += 0.15;

    return Math.min(score, 1.0);
  }

  /**
   * Build reasoning explanation for the suggestion
   */
  private buildReasoning(
    weatherConditions: WeatherConditions,
    clothingRecommendations: ClothingRecommendations,
    occasion: OccasionType,
    personalizationData: PersonalizationData,
    approach: string
  ): PersonalizedSuggestion['reasoning'] {
    const weatherFactors = [
      `${weatherConditions.temperature} temperature (${weatherConditions.overall})`,
      `${clothingRecommendations.layers} layering recommended`
    ];

    if (weatherConditions.precipitation !== 'none') {
      weatherFactors.push(`${weatherConditions.precipitation} precipitation expected`);
    }

    const styleFactors = [];
    const archetypes = personalizationData.styleProfile.fashionPersonality?.archetypes || [];
    if (archetypes.length > 0) {
      styleFactors.push(`Matches your ${archetypes.join(' and ')} style`);
    }

    const colorPalette = personalizationData.styleProfile.fashionPersonality?.colorPalette || [];
    if (colorPalette.length > 0) {
      styleFactors.push(`Uses your preferred ${colorPalette.slice(0, 2).join(' and ')} colors`);
    }

    const occasionFactors = [
      `Perfect for ${occasion.name.toLowerCase()}`,
      `${occasion.formality} formality level`,
      `Suitable for ${occasion.timeOfDay} activities`
    ];

    const personalFactors = [];
    if (personalizationData.userProfile.style_preferences?.length > 0) {
      personalFactors.push('Aligns with your style preferences');
    }
    if (personalizationData.closetItems.length > 0) {
      personalFactors.push('Complements items in your closet');
    }

    // Add approach-specific reasoning
    if (approach === 'style_focused') {
      personalFactors.push('Emphasizes your personal style');
    } else if (approach === 'weather_optimal') {
      weatherFactors.push('Optimized for current weather conditions');
    } else if (approach === 'occasion_perfect') {
      occasionFactors.push('Tailored specifically for this occasion');
    }

    return {
      weatherFactors,
      styleFactors,
      occasionFactors,
      personalFactors
    };
  }

  /**
   * Get user personalization data from various sources
   */
  private async getPersonalizationData(): Promise<PersonalizationData> {
    // Get style profile from localStorage (from outfit generation service)
    const styleProfile = this.getStoredStyleProfile();

    // Get user profile from localStorage
    const userProfile = this.getStoredUserProfile();

    // Get closet items
    const closetItems = closetService.getClosetItems();

    // Get recent choices and feedback (would be stored in localStorage)
    const recentChoices = this.getRecentChoices();
    const feedback = this.getUserFeedback();

    return {
      styleProfile,
      userProfile,
      closetItems,
      recentChoices,
      feedback
    };
  }

  /**
   * Get stored style profile from localStorage
   */
  private getStoredStyleProfile(): StyleProfile {
    try {
      const stored = localStorage.getItem('styleProfile');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load style profile');
    }

    // Return default style profile
    return {
      fashionPersonality: {
        archetypes: ['casual', 'modern'],
        colorPalette: ['blue', 'black', 'white'],
        preferredStyles: ['comfortable', 'contemporary']
      }
    };
  }

  /**
   * Get stored user profile from localStorage
   */
  private getStoredUserProfile(): UserProfile {
    try {
      const stored = localStorage.getItem('userProfile');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load user profile');
    }

    // Return default user profile
    return {
      id: 'default',
      name: 'User',
      age: 25,
      gender: 'unspecified',
      style_preferences: ['casual', 'comfortable', 'modern'],
      created_at: new Date().toISOString()
    };
  }

  /**
   * Get recent outfit choices
   */
  private getRecentChoices(): string[] {
    try {
      const stored = localStorage.getItem('recentOutfitChoices');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get user feedback on previous suggestions
   */
  private getUserFeedback(): { liked: string[]; disliked: string[] } {
    try {
      const stored = localStorage.getItem('outfitFeedback');
      return stored ? JSON.parse(stored) : { liked: [], disliked: [] };
    } catch {
      return { liked: [], disliked: [] };
    }
  }

  /**
   * Map formality to style for outfit generation
   */
  private mapFormalityToStyle(formality: OccasionType['formality']): 'casual' | 'formal' | 'trendy' | 'vintage' | 'minimalist' | 'edgy' {
    switch (formality) {
      case 'formal': return 'formal';
      case 'business_casual': return 'minimalist';
      case 'dressy_casual': return 'trendy';
      case 'athletic': return 'casual';
      case 'casual':
      default: return 'casual';
    }
  }

  /**
   * Get default occasion based on time of day
   */
  private getDefaultOccasion(): OccasionType {
    const hour = new Date().getHours();

    if (hour >= 9 && hour < 17) {
      return this.OCCASIONS.find(o => o.id === 'work_casual') || this.OCCASIONS[0];
    } else if (hour >= 17 && hour < 22) {
      return this.OCCASIONS.find(o => o.id === 'dinner_out') || this.OCCASIONS[0];
    } else {
      return this.OCCASIONS.find(o => o.id === 'weekend_casual') || this.OCCASIONS[0];
    }
  }

  /**
   * Try on outfit with user's avatar
   */
  async tryOnOutfit(
    suggestion: PersonalizedSuggestion,
    avatarImageUrl: string
  ): Promise<string | null> {
    try {
      if (!suggestion.outfit.imageUrl) {
        throw new Error('No outfit image available');
      }

      console.log('👗 [FASHION] Trying on outfit with avatar...');

      const tryOnResult = await enhancedTwoStepService.performVirtualTryOn(
        avatarImageUrl,
        suggestion.outfit.imageUrl
      );

      if (tryOnResult.success && tryOnResult.finalImageUrl) {
        // Update suggestion with try-on result
        suggestion.outfit.tryOnImageUrl = tryOnResult.finalImageUrl;
        console.log('✅ [FASHION] Virtual try-on completed successfully');
        return tryOnResult.finalImageUrl;
      }

      return null;
    } catch (error) {
      console.error('❌ [FASHION] Virtual try-on failed:', error);
      return null;
    }
  }

  /**
   * Save user feedback on a suggestion
   */
  saveFeedback(suggestionId: string, feedback: 'like' | 'dislike'): void {
    try {
      const currentFeedback = this.getUserFeedback();

      if (feedback === 'like') {
        if (!currentFeedback.liked.includes(suggestionId)) {
          currentFeedback.liked.push(suggestionId);
        }
        // Remove from disliked if present
        currentFeedback.disliked = currentFeedback.disliked.filter(id => id !== suggestionId);
      } else {
        if (!currentFeedback.disliked.includes(suggestionId)) {
          currentFeedback.disliked.push(suggestionId);
        }
        // Remove from liked if present
        currentFeedback.liked = currentFeedback.liked.filter(id => id !== suggestionId);
      }

      localStorage.setItem('outfitFeedback', JSON.stringify(currentFeedback));
      console.log(`💾 [FASHION] Saved ${feedback} feedback for suggestion ${suggestionId}`);
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  }

  /**
   * Get available occasions
   */
  getAvailableOccasions(): OccasionType[] {
    return [...this.OCCASIONS];
  }
}

// Singleton instance
export const personalizedFashionService = new PersonalizedFashionService();
export default personalizedFashionService;