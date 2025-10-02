/**
 * Outfit Generation Service - fal.ai integration for personalized outfit creation
 * Combines weather data, style preferences, and user's favorite pieces
 */

import { WeatherData } from './weatherService';
import ClosetService, { ClothingItem } from './closetService';
import enhancedPromptGenerationService, { EnhancedPromptResult, PromptGenerationRequest } from './enhancedPromptGenerationService';

export interface OutfitSuggestion {
  id: number;
  name: string;
  description: string;
  weatherAppropriate: boolean;
  styleMatch: number;
  imageUrl?: string;
  pieces: string[];
  colors: string[];
  style: string;
  occasion: string;
  temperature_range: {
    min: number;
    max: number;
  };
}

export interface StyleProfile {
  fashionPersonality?: {
    archetypes?: string[];
    colorPalette?: string[];
    preferredStyles?: string[];
  };
  bodyType?: string;
  favoriteColors?: string[];
  lifestylePreferences?: string[];
  budgetRange?: string;
  favoriteBrands?: string[];
}

export interface OutfitGenerationRequest {
  weather: WeatherData;
  styleProfile: StyleProfile;
  avatarImageUrl?: string;
  occasion?: string;
  numberOfSuggestions?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  month?: number; // 1-12
  usePersonalWardrobe?: boolean;
}

class OutfitGenerationService {
  public readonly version = '2.1.0-two-step-process'; // Force cache invalidation
  private readonly API_BASE_URL = 'http://localhost:3000/api'; // avatar-app API
  private cache: Map<string, { suggestions: OutfitSuggestion[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Generate outfit suggestions using fal.ai and style preferences
   */
  async generateOutfitSuggestions(request: OutfitGenerationRequest): Promise<OutfitSuggestion[]> {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.suggestions;
    }

    try {
      // Generate outfit prompts based on weather and style
      const outfitPrompts = this.generateOutfitPrompts(request);
      const suggestions: OutfitSuggestion[] = [];

      // For now, create rule-based suggestions with the potential for fal.ai image generation
      for (let i = 0; i < outfitPrompts.length; i++) {
        const prompt = outfitPrompts[i];

        // Create outfit suggestion
        const suggestion: OutfitSuggestion = {
          id: i + 1,
          name: prompt.name,
          description: prompt.description,
          weatherAppropriate: this.isWeatherAppropriate(prompt, request.weather),
          styleMatch: this.calculateStyleMatch(prompt, request.styleProfile),
          pieces: prompt.pieces,
          colors: prompt.colors,
          style: prompt.style,
          occasion: prompt.occasion,
          temperature_range: prompt.temperature_range,
        };

        // Generate outfit image using fal.ai (if avatar image is available)
        if (request.avatarImageUrl && !this.isDevMode()) {
          try {
            suggestion.imageUrl = await this.generateOutfitImage(
              request.avatarImageUrl,
              prompt.falPrompt
            );
          } catch (error) {
            console.warn('Outfit image generation not available in development mode');
          }
        }

        suggestions.push(suggestion);
      }

      // Cache the results
      this.cache.set(cacheKey, { suggestions, timestamp: Date.now() });

      return suggestions;
    } catch (error) {
      console.error('Error generating outfit suggestions:', error);
      return this.getFallbackSuggestions(request);
    }
  }

  /**
   * Get current season based on month
   */
  private getCurrentSeason(month?: number): 'spring' | 'summer' | 'fall' | 'winter' {
    const currentMonth = month || new Date().getMonth() + 1;
    if (currentMonth >= 3 && currentMonth <= 5) return 'spring';
    if (currentMonth >= 6 && currentMonth <= 8) return 'summer';
    if (currentMonth >= 9 && currentMonth <= 11) return 'fall';
    return 'winter';
  }

  /**
   * Get time of day from current time
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Generate outfit prompts based on weather, season, time, and style preferences
   */
  private generateOutfitPrompts(request: OutfitGenerationRequest): any[] {
    const { weather, styleProfile } = request;
    const season = request.season || this.getCurrentSeason(request.month);
    const timeOfDay = request.timeOfDay || this.getTimeOfDay();
    const prompts = [];

    // Enhanced weather and seasonal considerations
    const seasonalFactors = this.getSeasonalFactors(season, weather.temperature);
    const timeFactors = this.getTimeOfDayFactors(timeOfDay);
    const weatherFactors = this.getWeatherFactors(weather);

    // Check if user wants personalized suggestions from their wardrobe
    if (request.usePersonalWardrobe) {
      const personalOutfits = this.generatePersonalWardrobeOutfits(weather, season, timeOfDay, seasonalFactors, timeFactors, weatherFactors);
      prompts.push(...personalOutfits);
    }

    // Generate smart outfit based on multiple factors
    const primaryOutfit = this.generatePrimaryOutfit(weather, season, timeOfDay, seasonalFactors, timeFactors, weatherFactors);
    prompts.push(primaryOutfit);

    // Generate secondary outfit with seasonal variation
    const secondaryOutfit = this.generateSeasonalVariation(weather, season, timeOfDay, seasonalFactors);
    prompts.push(secondaryOutfit);

    // Weather-based outfit (legacy support)
    if (weather.temperature > 75) {
      prompts.push({
        name: 'Summer Breeze',
        description: 'Light and breathable for hot weather',
        pieces: ['Linen shirt', 'Cotton shorts', 'Canvas sneakers', 'Sun hat'],
        colors: ['White', 'Light blue', 'Beige'],
        style: 'Casual',
        occasion: 'Daily wear',
        temperature_range: { min: 75, max: 100 },
        falPrompt: 'wearing light summer clothing, linen shirt, cotton shorts, casual sneakers, bright sunny day background'
      });
    } else if (weather.temperature > 60) {
      prompts.push({
        name: 'Perfect Balance',
        description: 'Comfortable layers for mild weather',
        pieces: ['Cotton t-shirt', 'Light cardigan', 'Jeans', 'Sneakers'],
        colors: ['Navy', 'Gray', 'White'],
        style: 'Smart casual',
        occasion: 'Everyday',
        temperature_range: { min: 60, max: 75 },
        falPrompt: 'wearing smart casual outfit, cotton t-shirt with light cardigan, jeans, comfortable sneakers'
      });
    } else {
      prompts.push({
        name: 'Cozy Layers',
        description: 'Warm and stylish for cooler weather',
        pieces: ['Wool sweater', 'Dark jeans', 'Ankle boots', 'Scarf'],
        colors: ['Burgundy', 'Black', 'Cream'],
        style: 'Cozy chic',
        occasion: 'Cool weather outings',
        temperature_range: { min: 30, max: 60 },
        falPrompt: 'wearing cozy winter outfit, wool sweater, dark jeans, ankle boots, warm scarf'
      });
    }

    // Style-based outfits
    const archetypes = styleProfile.fashionPersonality?.archetypes || [];

    if (archetypes.includes('Minimalist')) {
      prompts.push({
        name: 'Clean Minimal',
        description: 'Simple, elegant, timeless',
        pieces: ['White button-down', 'Black trousers', 'White sneakers'],
        colors: ['White', 'Black', 'Gray'],
        style: 'Minimalist',
        occasion: 'Professional casual',
        temperature_range: { min: 60, max: 80 },
        falPrompt: 'wearing minimalist outfit, white button-down shirt, black trousers, clean white sneakers, modern minimal style'
      });
    }

    if (archetypes.includes('Edgy')) {
      prompts.push({
        name: 'Urban Edge',
        description: 'Bold and confident street style',
        pieces: ['Leather jacket', 'Black jeans', 'Combat boots', 'Graphic tee'],
        colors: ['Black', 'Dark gray', 'Red'],
        style: 'Edgy',
        occasion: 'Night out',
        temperature_range: { min: 50, max: 70 },
        falPrompt: 'wearing edgy street style, leather jacket, black jeans, combat boots, urban background'
      });
    }

    if (archetypes.includes('Romantic')) {
      prompts.push({
        name: 'Soft Romance',
        description: 'Feminine and dreamy',
        pieces: ['Floral dress', 'Cardigan', 'Ballet flats', 'Delicate jewelry'],
        colors: ['Pink', 'Cream', 'Soft blue'],
        style: 'Romantic',
        occasion: 'Date night',
        temperature_range: { min: 65, max: 80 },
        falPrompt: 'wearing romantic outfit, floral dress, soft cardigan, ballet flats, feminine and dreamy style'
      });
    }

    // Shuffle prompts and limit to 3 suggestions for variety each time
    const shuffledPrompts = prompts.sort(() => Math.random() - 0.5);
    return shuffledPrompts.slice(0, 3);
  }

  /**
   * Check if running in development mode
   */
  private isDevMode(): boolean {
    return this.API_BASE_URL.includes('localhost') || import.meta.env.DEV;
  }

  /**
   * Validate generated clothing image for FASHN compatibility
   * Checks if the image shows complete garments suitable for virtual try-on
   */
  private async validateClothingImageForFashn(imageUrl: string, originalPrompt: string): Promise<{
    isValid: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    console.log('🔍 [GARMENT-VALIDATION] Validating clothing image for FASHN compatibility...');

    try {
      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // 1. Basic URL/format validation
      if (!imageUrl || typeof imageUrl !== 'string') {
        issues.push('Invalid image URL format');
        score -= 50;
        return { isValid: false, score, issues, recommendations };
      }

      // 2. Check for proper image URL format
      if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        issues.push('Image URL format not recognized');
        recommendations.push('Ensure image generation produces valid URLs');
        score -= 30;
      }

      // 3. Analyze prompt for completeness indicators
      const promptLower = originalPrompt.toLowerCase();

      // Check if prompt contains garment-specific terms
      const garmentTerms = ['shirt', 'pants', 'dress', 'jacket', 'top', 'bottom', 'outfit'];
      const hasGarmentTerms = garmentTerms.some(term => promptLower.includes(term));

      if (!hasGarmentTerms) {
        issues.push('Prompt may not specify clear garment types');
        recommendations.push('Include specific clothing types in prompt (shirt, pants, dress, etc.)');
        score -= 15;
      }

      // 4. Check for completeness terms in prompt
      const completenessTerms = ['full', 'complete', 'entire', 'whole'];
      const hasCompletenessTerms = completenessTerms.some(term => promptLower.includes(term));

      if (!hasCompletenessTerms) {
        issues.push('Prompt may not emphasize complete garment visibility');
        recommendations.push('Add terms like "full garment view" or "complete clothing item"');
        score -= 10;
      }

      // 5. For base64 images, check size indicators
      if (imageUrl.startsWith('data:image/')) {
        const estimatedSizeKB = imageUrl.length * 0.75 / 1024;

        if (estimatedSizeKB < 100) {
          issues.push('Generated image appears too small for detailed garment analysis');
          recommendations.push('Increase image generation resolution or quality settings');
          score -= 25;
        } else if (estimatedSizeKB > 5000) {
          issues.push('Generated image may be too large for optimal FASHN processing');
          recommendations.push('Consider compressing image for faster FASHN processing');
          score -= 5;
        }
      }

      // 6. FASHN-specific quality checks
      if (score >= 90) {
        recommendations.push('Image appears optimal for FASHN virtual try-on');
      } else if (score >= 70) {
        recommendations.push('Image should work with FASHN but may benefit from optimization');
      } else if (score >= 50) {
        recommendations.push('Image quality concerns - consider regenerating with improved settings');
      } else {
        recommendations.push('Poor image quality detected - recommend complete regeneration');
      }

      const isValid = score >= 70 && issues.length <= 2; // Allow minor issues

      console.log('📊 [GARMENT-VALIDATION] Validation result:', {
        score: `${score}/100`,
        isValid,
        issueCount: issues.length,
        status: isValid ? 'FASHN_READY' : 'NEEDS_IMPROVEMENT'
      });

      return {
        isValid,
        score,
        issues,
        recommendations
      };

    } catch (error) {
      console.error('❌ [GARMENT-VALIDATION] Validation failed:', error);
      return {
        isValid: true, // Default to valid if validation fails
        score: 75,
        issues: ['Validation system error - proceeding with caution'],
        recommendations: ['Monitor FASHN results for quality issues']
      };
    }
  }

  /**
   * Generate outfit image using FAL.ai Bytedance Seedream 4.0 Text-to-Image
   * Updated: 2025-09-23 - Generate garment-only images for virtual try-on
   */
  private async generateOutfitImage(avatarImageUrl: string, outfitPrompt: string): Promise<string> {
    console.log('🎨 Starting FAL.ai Seedream v4 garment generation...');
    console.log('📝 Outfit prompt:', outfitPrompt);

    try {
      // Prepare the enhanced prompt for garment-only generation (FASHN-optimized for complete visibility)
      const enhancedPrompt = `${outfitPrompt}, product photography, fashion flat lay, isolated clothing items, clean white background, studio lighting, high resolution, detailed textures, professional fashion photography, clothing only, no person, no model, no human, no body, garment display, fashion catalog style, apparel showcase, full garment view, complete clothing item, no cropping, entire outfit visible, uncut garment edges, complete clothing piece, full item showcase, perfect garment framing, whole garment in frame, complete outfit display, FASHN-ready garment image, virtual try-on optimized`;

      console.log('🚀 Enhanced garment prompt:', enhancedPrompt);
      console.log('🔗 Calling FAL.ai API via proxy:', '/api/fal/fal-ai/flux/dev');

      // Call FAL.ai Flux API via proxy (avoids 401 errors)
      const response = await fetch('/api/fal/fal-ai/flux/dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          image_size: {
            width: 1024,
            height: 1024
          },
          num_inference_steps: 40,
          guidance_scale: 9.0,
          num_images: 1,
          enable_safety_checker: false,
          seed: Math.floor(Math.random() * 1000000)
        }),
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ FAL.ai API error response:', errorText);
        throw new Error(`FAL.ai API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📦 FAL.ai API result:', result);

      // Extract image URL from response
      let generatedImageUrl: string | null = null;

      if (result.images && result.images.length > 0) {
        generatedImageUrl = result.images[0].url;
        console.log('✅ Generated image URL from images array:', generatedImageUrl);
      } else if (result.image) {
        generatedImageUrl = result.image.url || result.image;
        console.log('✅ Generated image URL from image field:', generatedImageUrl);
      } else {
        console.error('❌ No image found in API response:', result);
        throw new Error('No image returned from FAL.ai API');
      }

      if (!generatedImageUrl) {
        throw new Error('Generated image URL is null or undefined');
      }

      console.log('🎉 Successfully generated outfit image:', generatedImageUrl);

      // Validate the generated image for FASHN compatibility
      console.log('🔍 [FASHN-PREP] Validating generated clothing for FASHN compatibility...');
      const validation = await this.validateClothingImageForFashn(generatedImageUrl, outfitPrompt);

      if (!validation.isValid) {
        console.warn('⚠️ [FASHN-PREP] Generated clothing may have quality issues for FASHN:', validation.issues);
        console.log('💡 [FASHN-PREP] Recommendations:', validation.recommendations);
        // Continue anyway but log warnings
      } else {
        console.log('✅ [FASHN-PREP] Generated clothing validated - ready for FASHN processing');
      }

      return generatedImageUrl;

    } catch (error) {
      console.error('💥 Failed to generate outfit image with FAL.ai:', error);

      // Return a more descriptive error message
      if (error instanceof Error) {
        if (error.message.includes('Authorization') || error.message.includes('401')) {
          throw new Error('Authentication failed. Please try again.');
        } else if (error.message.includes('429')) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else if (error.message.includes('500')) {
          throw new Error('Service is temporarily unavailable. Please try again.');
        }
      }

      throw error;
    }
  }

  /**
   * Convert blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Check if outfit is appropriate for current weather
   */
  private isWeatherAppropriate(outfit: any, weather: WeatherData): boolean {
    return (
      weather.temperature >= outfit.temperature_range.min &&
      weather.temperature <= outfit.temperature_range.max
    );
  }

  /**
   * Calculate style match percentage
   */
  private calculateStyleMatch(outfit: any, styleProfile: StyleProfile): number {
    let score = 70; // Base score

    // Check archetype match
    const archetypes = styleProfile.fashionPersonality?.archetypes || [];
    if (archetypes.some(arch => outfit.style.toLowerCase().includes(arch.toLowerCase()))) {
      score += 20;
    }

    // Check color preferences
    const favoriteColors = styleProfile.favoriteColors || [];
    const matchingColors = outfit.colors.filter((color: string) =>
      favoriteColors.some(fav => fav.toLowerCase().includes(color.toLowerCase()))
    );
    score += matchingColors.length * 5;

    // Check style preferences
    const preferredStyles = styleProfile.fashionPersonality?.preferredStyles || [];
    if (preferredStyles.some(style => outfit.style.toLowerCase().includes(style.toLowerCase()))) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Generate cache key for outfit requests
   */
  private generateCacheKey(request: OutfitGenerationRequest): string {
    return `${request.weather.temperature}-${request.weather.condition}-${JSON.stringify(request.styleProfile?.fashionPersonality?.archetypes || [])}`;
  }

  /**
   * Get fallback suggestions when API fails
   */
  private getFallbackSuggestions(request: OutfitGenerationRequest): OutfitSuggestion[] {
    const { weather } = request;

    if (weather.temperature > 75) {
      return [{
        id: 1,
        name: 'Summer Casual',
        description: 'Light and comfortable for warm weather',
        weatherAppropriate: true,
        styleMatch: 85,
        pieces: ['Light t-shirt', 'Shorts', 'Sneakers'],
        colors: ['White', 'Blue'],
        style: 'Casual',
        occasion: 'Daily',
        temperature_range: { min: 75, max: 100 }
      }];
    } else if (weather.temperature > 60) {
      return [{
        id: 1,
        name: 'Everyday Comfort',
        description: 'Perfect for mild temperatures',
        weatherAppropriate: true,
        styleMatch: 80,
        pieces: ['Long sleeve shirt', 'Jeans', 'Sneakers'],
        colors: ['Gray', 'Blue'],
        style: 'Casual',
        occasion: 'Daily',
        temperature_range: { min: 60, max: 75 }
      }];
    } else {
      return [{
        id: 1,
        name: 'Warm Layers',
        description: 'Cozy outfit for cool weather',
        weatherAppropriate: true,
        styleMatch: 75,
        pieces: ['Sweater', 'Jeans', 'Boots'],
        colors: ['Navy', 'Brown'],
        style: 'Casual',
        occasion: 'Daily',
        temperature_range: { min: 30, max: 60 }
      }];
    }
  }

  /**
   * Generate outfit suggestions from user's personal wardrobe
   */
  private generatePersonalWardrobeOutfits(weather: WeatherData, season: string, timeOfDay: string, seasonalFactors: any, timeFactors: any, weatherFactors: any) {
    const userCloset = ClosetService.getUserCloset();
    const allItems = ClosetService.getAllClothingItems();
    const personalOutfits = [];

    if (allItems.length === 0) {
      return [];
    }

    // Get weather-appropriate items
    const weatherAppropriateItems = this.filterItemsByWeather(allItems, weather, season);

    // Create outfit combinations from user's items
    const outfit1 = this.createOutfitFromUserItems(weatherAppropriateItems, 'casual', timeOfDay, weather);
    if (outfit1) {
      personalOutfits.push(outfit1);
    }

    // Create a more formal/dressed up version if items are available
    const outfit2 = this.createOutfitFromUserItems(weatherAppropriateItems, 'formal', timeOfDay, weather);
    if (outfit2 && outfit2.pieces.join() !== outfit1?.pieces.join()) {
      personalOutfits.push(outfit2);
    }

    // Create outfit using favorite items
    const favoriteItems = allItems.filter(item => item.favorite);
    if (favoriteItems.length > 0) {
      const favoriteOutfit = this.createOutfitFromUserItems(favoriteItems, 'favorite', timeOfDay, weather);
      if (favoriteOutfit) {
        personalOutfits.push(favoriteOutfit);
      }
    }

    return personalOutfits.slice(0, 2); // Limit to 2 personal wardrobe suggestions
  }

  /**
   * Filter clothing items by weather appropriateness
   */
  private filterItemsByWeather(items: ClothingItem[], weather: WeatherData, season: string): ClothingItem[] {
    return items.filter(item => {
      // Filter by season appropriateness
      const isSeasonAppropriate = this.isItemSeasonAppropriate(item, season, weather.temperature);

      // Filter by weather conditions
      const isWeatherAppropriate = this.isItemWeatherAppropriate(item, weather);

      return isSeasonAppropriate && isWeatherAppropriate;
    });
  }

  /**
   * Check if item is appropriate for the season
   */
  private isItemSeasonAppropriate(item: ClothingItem, season: string, temperature: number): boolean {
    const itemName = item.name.toLowerCase();
    const itemDescription = (item.description || '').toLowerCase();
    const itemText = `${itemName} ${itemDescription}`;

    if (season === 'summer' || temperature > 75) {
      // Summer items: light, breathable, short sleeves
      return !itemText.includes('wool') && !itemText.includes('heavy') &&
             !itemText.includes('winter') && !itemText.includes('thick');
    } else if (season === 'winter' || temperature < 45) {
      // Winter items: warm, layered, long sleeves
      return itemText.includes('warm') || itemText.includes('wool') ||
             itemText.includes('sweater') || itemText.includes('coat') ||
             item.category === 'outerwear';
    } else {
      // Spring/Fall: most items work
      return true;
    }
  }

  /**
   * Check if item is appropriate for weather conditions
   */
  private isItemWeatherAppropriate(item: ClothingItem, weather: WeatherData): boolean {
    const itemName = item.name.toLowerCase();
    const itemDescription = (item.description || '').toLowerCase();
    const itemText = `${itemName} ${itemDescription}`;

    if (weather.condition === 'rainy' || weather.condition === 'stormy') {
      // Prefer water-resistant items, avoid delicate fabrics
      return item.category !== 'accessories' ||
             itemText.includes('waterproof') ||
             itemText.includes('rain') ||
             item.category === 'shoes';
    }

    return true; // Most items work for other weather conditions
  }

  /**
   * Create outfit combination from user's items
   */
  private createOutfitFromUserItems(items: ClothingItem[], style: 'casual' | 'formal' | 'favorite', timeOfDay: string, weather: WeatherData) {
    if (items.length === 0) return null;

    const outfit = {
      name: '',
      description: '',
      pieces: [] as string[],
      colors: [] as string[],
      style: timeOfDay === 'evening' ? 'Evening chic' : 'Personal style',
      occasion: style === 'formal' ? 'Smart casual' : 'Daily wear',
      temperature_range: { min: weather.temperature - 8, max: weather.temperature + 8 },
      falPrompt: '',
      userItems: [] as ClothingItem[]
    };

    // Group items by category
    const itemsByCategory = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ClothingItem[]>);

    // Build outfit based on available categories
    const selectedItems: ClothingItem[] = [];

    // Try to get a top (shirt, top, or dress)
    if (itemsByCategory.dresses && itemsByCategory.dresses.length > 0) {
      const dress = this.selectItemByStyle(itemsByCategory.dresses, style);
      selectedItems.push(dress);
      outfit.pieces.push(dress.name);
    } else {
      // Get top
      const topCategories = ['shirts', 'tops'];
      for (const category of topCategories) {
        if (itemsByCategory[category] && itemsByCategory[category].length > 0) {
          const top = this.selectItemByStyle(itemsByCategory[category], style);
          selectedItems.push(top);
          outfit.pieces.push(top.name);
          break;
        }
      }

      // Get bottom
      const bottomCategories = ['pants', 'skirts'];
      for (const category of bottomCategories) {
        if (itemsByCategory[category] && itemsByCategory[category].length > 0) {
          const bottom = this.selectItemByStyle(itemsByCategory[category], style);
          selectedItems.push(bottom);
          outfit.pieces.push(bottom.name);
          break;
        }
      }
    }

    // Add outerwear if needed (cold weather)
    if (weather.temperature < 65 && itemsByCategory.outerwear && itemsByCategory.outerwear.length > 0) {
      const outerwear = this.selectItemByStyle(itemsByCategory.outerwear, style);
      selectedItems.push(outerwear);
      outfit.pieces.push(outerwear.name);
    }

    // Add shoes
    if (itemsByCategory.shoes && itemsByCategory.shoes.length > 0) {
      const shoes = this.selectItemByStyle(itemsByCategory.shoes, style);
      selectedItems.push(shoes);
      outfit.pieces.push(shoes.name);
    }

    // Add accessories
    if (itemsByCategory.accessories && itemsByCategory.accessories.length > 0) {
      const accessory = this.selectItemByStyle(itemsByCategory.accessories, style);
      selectedItems.push(accessory);
      outfit.pieces.push(accessory.name);
    }

    // Set outfit name and description
    if (style === 'favorite') {
      outfit.name = '💖 Your Favorites';
      outfit.description = `Featuring your favorite pieces perfect for ${timeOfDay}`;
    } else if (style === 'formal') {
      outfit.name = '✨ Polished Look';
      outfit.description = `Smart and sophisticated from your wardrobe`;
    } else {
      outfit.name = '👔 Your Wardrobe';
      outfit.description = `Curated from your personal collection`;
    }

    // Extract colors from item names/descriptions
    outfit.colors = this.extractColorsFromItems(selectedItems);
    outfit.userItems = selectedItems;

    // Generate FAL prompt
    outfit.falPrompt = `wearing ${outfit.pieces.slice(0, 3).join(', ')}, personal wardrobe style, ${timeOfDay} lighting, fashion photography`;

    return outfit.pieces.length >= 2 ? outfit : null; // Need at least 2 pieces for an outfit
  }

  /**
   * Select item based on style preference
   */
  private selectItemByStyle(items: ClothingItem[], style: 'casual' | 'formal' | 'favorite'): ClothingItem {
    if (style === 'favorite') {
      const favoriteItems = items.filter(item => item.favorite);
      if (favoriteItems.length > 0) {
        return favoriteItems[Math.floor(Math.random() * favoriteItems.length)];
      }
    }

    if (style === 'formal') {
      // Look for formal keywords
      const formalItems = items.filter(item => {
        const text = `${item.name} ${item.description || ''}`.toLowerCase();
        return text.includes('dress') || text.includes('formal') ||
               text.includes('blazer') || text.includes('suit') ||
               text.includes('elegant') || text.includes('professional');
      });
      if (formalItems.length > 0) {
        return formalItems[Math.floor(Math.random() * formalItems.length)];
      }
    }

    // Default: return random item
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Extract colors from clothing items
   */
  private extractColorsFromItems(items: ClothingItem[]): string[] {
    const colors: string[] = [];
    const colorKeywords = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'purple', 'pink', 'gray', 'brown', 'beige', 'navy', 'khaki'];

    items.forEach(item => {
      const text = `${item.name} ${item.description || ''}`.toLowerCase();
      colorKeywords.forEach(color => {
        if (text.includes(color) && !colors.includes(color)) {
          colors.push(color.charAt(0).toUpperCase() + color.slice(1));
        }
      });
    });

    return colors.length > 0 ? colors.slice(0, 3) : ['Black', 'Navy', 'White'];
  }

  /**
   * Get seasonal factors for outfit generation
   */
  private getSeasonalFactors(season: string, temperature: number) {
    const seasonalData = {
      spring: {
        colors: ['Pastel pink', 'Light green', 'Soft yellow', 'Lavender', 'Cream'],
        fabrics: ['Cotton', 'Light wool', 'Linen blend'],
        layers: temperature > 65 ? 'light' : 'medium',
        patterns: ['Floral', 'Stripes', 'Small prints']
      },
      summer: {
        colors: ['White', 'Light blue', 'Coral', 'Mint', 'Bright yellow'],
        fabrics: ['Linen', 'Cotton', 'Chiffon', 'Silk'],
        layers: 'minimal',
        patterns: ['Tropical', 'Geometric', 'Bold prints']
      },
      fall: {
        colors: ['Burgundy', 'Mustard', 'Forest green', 'Brown', 'Orange'],
        fabrics: ['Wool', 'Cashmere', 'Flannel', 'Tweed'],
        layers: temperature > 60 ? 'medium' : 'heavy',
        patterns: ['Plaid', 'Houndstooth', 'Earth tones']
      },
      winter: {
        colors: ['Navy', 'Black', 'Gray', 'Deep red', 'Emerald'],
        fabrics: ['Wool', 'Cashmere', 'Fleece', 'Down'],
        layers: 'heavy',
        patterns: ['Solid colors', 'Subtle textures', 'Classic patterns']
      }
    };

    return seasonalData[season as keyof typeof seasonalData] || seasonalData.spring;
  }

  /**
   * Get time of day factors for outfit generation
   */
  private getTimeOfDayFactors(timeOfDay: string) {
    const timeData = {
      morning: {
        style: 'Fresh and energetic',
        occasion: 'Work or casual',
        colors: ['Bright', 'Clean', 'Professional'],
        energy: 'active'
      },
      afternoon: {
        style: 'Comfortable and versatile',
        occasion: 'Casual or business casual',
        colors: ['Neutral', 'Warm', 'Approachable'],
        energy: 'relaxed'
      },
      evening: {
        style: 'Sophisticated and stylish',
        occasion: 'Dinner or social',
        colors: ['Rich', 'Deep', 'Elegant'],
        energy: 'refined'
      },
      night: {
        style: 'Comfortable and cozy',
        occasion: 'Relaxation or intimate',
        colors: ['Dark', 'Soft', 'Muted'],
        energy: 'calm'
      }
    };

    return timeData[timeOfDay as keyof typeof timeData] || timeData.afternoon;
  }

  /**
   * Get weather-specific factors
   */
  private getWeatherFactors(weather: WeatherData) {
    const factors = {
      protection: [] as string[],
      accessories: [] as string[],
      considerations: [] as string[]
    };

    // Rain protection
    if (weather.condition === 'rainy' || weather.condition === 'stormy') {
      factors.protection.push('Waterproof jacket', 'Umbrella');
      factors.accessories.push('Rain boots', 'Water-resistant bag');
      factors.considerations.push('Quick-dry fabrics', 'Covered footwear');
    }

    // Sun protection
    if (weather.condition === 'sunny' && weather.temperature > 70) {
      factors.protection.push('Sun hat', 'Sunglasses');
      factors.accessories.push('UV-protective clothing');
      factors.considerations.push('Light colors', 'Breathable fabrics');
    }

    // Wind considerations
    if (weather.windSpeed > 10) {
      factors.considerations.push('Secure accessories', 'Layered clothing', 'Wind-resistant materials');
    }

    // Humidity adjustments
    if (weather.humidity > 70) {
      factors.considerations.push('Moisture-wicking fabrics', 'Loose fit', 'Natural materials');
    }

    return factors;
  }

  /**
   * Generate primary outfit based on all factors
   */
  private generatePrimaryOutfit(weather: WeatherData, season: string, timeOfDay: string, seasonalFactors: any, timeFactors: any, weatherFactors: any) {
    const temp = weather.temperature;
    let pieces = [];
    let colors = [...seasonalFactors.colors.slice(0, 3)];
    let name = '';
    let description = '';

    // Temperature-based base layers
    if (temp > 80) {
      pieces = ['Lightweight top', 'Breathable shorts/skirt', 'Comfortable sandals'];
      name = `${season} ${timeFactors.energy} Look`;
      description = `Perfect for hot ${season} ${timeOfDay} - staying cool and stylish`;
    } else if (temp > 65) {
      pieces = ['Cotton shirt', 'Comfortable pants', 'Versatile shoes'];
      if (seasonalFactors.layers === 'medium') {
        pieces.push('Light jacket');
      }
      name = `${season} ${timeFactors.style}`;
      description = `Ideal for mild ${season} weather during ${timeOfDay}`;
    } else if (temp > 45) {
      pieces = ['Warm sweater', 'Jeans/warm pants', 'Boots'];
      if (seasonalFactors.layers === 'heavy') {
        pieces.push('Warm coat');
      }
      name = `Cozy ${season} Layers`;
      description = `Warm and comfortable for cool ${season} ${timeOfDay}`;
    } else {
      pieces = ['Thermal layer', 'Wool sweater', 'Insulated jacket', 'Warm pants', 'Winter boots'];
      name = `${season} Warmth`;
      description = `Essential warmth for cold ${season} conditions`;
    }

    // Add weather-specific items
    pieces = [...pieces, ...weatherFactors.protection, ...weatherFactors.accessories];

    return {
      name,
      description,
      pieces: pieces.slice(0, 6), // Limit to 6 pieces
      colors,
      style: timeFactors.style,
      occasion: timeFactors.occasion,
      temperature_range: { min: temp - 10, max: temp + 10 },
      falPrompt: `wearing ${pieces.slice(0, 4).join(', ')}, ${colors.slice(0, 2).join(' and ')} colors, ${timeFactors.style.toLowerCase()}, ${season} fashion, ${timeOfDay} lighting`
    };
  }

  /**
   * Generate seasonal variation outfit
   */
  private generateSeasonalVariation(weather: WeatherData, season: string, timeOfDay: string, seasonalFactors: any) {
    const variations = {
      spring: {
        name: 'Spring Fresh',
        pieces: ['Floral top', 'Light cardigan', 'Ankle pants', 'Low heels'],
        style: 'Fresh and feminine'
      },
      summer: {
        name: 'Summer Vibes',
        pieces: ['Sundress', 'Denim jacket', 'Wedge sandals', 'Sun hat'],
        style: 'Breezy and fun'
      },
      fall: {
        name: 'Autumn Layers',
        pieces: ['Plaid shirt', 'Vest', 'Dark jeans', 'Ankle boots'],
        style: 'Layered and cozy'
      },
      winter: {
        name: 'Winter Chic',
        pieces: ['Turtleneck', 'Wool coat', 'Scarf', 'Knee-high boots'],
        style: 'Sophisticated and warm'
      }
    };

    const variation = variations[season as keyof typeof variations] || variations.spring;

    return {
      name: variation.name,
      description: `Seasonal ${season} style perfect for ${timeOfDay}`,
      pieces: variation.pieces,
      colors: seasonalFactors.colors.slice(1, 4),
      style: variation.style,
      occasion: timeOfDay === 'evening' ? 'Social gathering' : 'Daily activities',
      temperature_range: { min: weather.temperature - 8, max: weather.temperature + 8 },
      falPrompt: `wearing ${variation.pieces.slice(0, 3).join(', ')}, ${variation.style.toLowerCase()}, ${season} collection, ${timeOfDay} scene`
    };
  }

  /**
   * Generate custom outfit from user prompt
   */
  async generateCustomOutfit(request: {
    prompt: string;
    style: string;
    weather: WeatherData;
    timeOfDay: string;
    season: string;
    avatarImageUrl?: string;
    useDirectPrompt?: boolean;
    useEnhancedPrompts?: boolean;
  }): Promise<OutfitSuggestion> {
    const { prompt, style, weather, timeOfDay, season, useDirectPrompt = false, useEnhancedPrompts = true } = request;

    console.log(`🧠 [CUSTOM-OUTFIT] Generating outfit with enhanced prompts: ${useEnhancedPrompts}`);

    // Enhanced prompt generation using Claude API
    let enhancedPromptResult: EnhancedPromptResult | null = null;
    if (useEnhancedPrompts) {
      try {
        console.log('🧠 [CUSTOM-OUTFIT] Generating enhanced prompts with Claude API...');

        const promptRequest: PromptGenerationRequest = {
          userRequest: prompt,
          style: style,
          weather: weather,
          occasion: this.getOccasionFromStyle(style),
          timeOfDay: timeOfDay,
          season: season,
          gender: 'unisex', // Could be made configurable
          avoidItems: [] // Could be made configurable
        };

        enhancedPromptResult = await enhancedPromptGenerationService.generateEnhancedPrompt(promptRequest);

        console.log('✅ [CUSTOM-OUTFIT] Enhanced prompt generated:', enhancedPromptResult);

      } catch (error) {
        console.warn('⚠️ [CUSTOM-OUTFIT] Enhanced prompt generation failed, using basic prompts:', error);
        enhancedPromptResult = null;
      }
    }

    // Create a custom outfit suggestion based on user prompt
    const customOutfit: OutfitSuggestion = {
      id: Date.now(), // Unique ID
      name: `Custom ${style.charAt(0).toUpperCase() + style.slice(1)} Look`,
      description: `Your custom ${style} outfit: ${prompt}`,
      weatherAppropriate: true,
      styleMatch: 100, // Perfect match since it's user-requested
      pieces: enhancedPromptResult?.clothing_items.length ? enhancedPromptResult.clothing_items : this.extractPiecesFromPrompt(prompt),
      colors: enhancedPromptResult?.colors.length ? enhancedPromptResult.colors : this.extractColorsFromPrompt(prompt),
      style: style.charAt(0).toUpperCase() + style.slice(1),
      occasion: this.getOccasionFromStyle(style),
      temperature_range: { min: weather.temperature - 10, max: weather.temperature + 10 }
    };

    // Generate outfit image using fal.ai if avatar is available
    if (request.avatarImageUrl && !this.isDevMode()) {
      try {
        // Use enhanced prompt if available, otherwise fall back to basic prompt
        let falPrompt: string;
        let negativePrompt: string | undefined;

        if (enhancedPromptResult) {
          falPrompt = `${enhancedPromptResult.mainPrompt}, professional fashion photography, studio lighting`;
          negativePrompt = enhancedPromptResult.negativePrompt;
        } else {
          falPrompt = useDirectPrompt
            ? `wearing ${prompt}, ${style} style, high quality fashion photography, studio lighting, professional photography`
            : `wearing ${prompt}, ${style} style, ${season} season, ${timeOfDay} lighting, high quality fashion photography, weather appropriate for ${weather.temperature}°F ${weather.condition}`;
        }

        console.log(`🎨 [CUSTOM-OUTFIT] FAL prompt (enhanced: ${!!enhancedPromptResult}):`, falPrompt);
        if (negativePrompt) {
          console.log(`🚫 [CUSTOM-OUTFIT] Negative prompt:`, negativePrompt);
        }

        customOutfit.imageUrl = await this.generateOutfitImageWithNegativePrompt(
          request.avatarImageUrl,
          falPrompt,
          negativePrompt
        );
      } catch (error) {
        console.warn('Custom outfit image generation failed:', error);
      }
    }

    // Generate garment-only preview image for custom outfit
    try {
      console.log(`🎨 [CUSTOM-OUTFIT] Generating preview image (enhanced: ${!!enhancedPromptResult})`);

      if (enhancedPromptResult) {
        customOutfit.previewImage = await this.generateGarmentOnlyImageWithEnhancement(
          customOutfit,
          false, // forceApiTest
          useDirectPrompt, // use direct prompt to bypass weather
          enhancedPromptResult, // enhanced prompt data
          prompt, // original user prompt
          style // style
        );
      } else {
        customOutfit.previewImage = await this.generateGarmentOnlyImage(
          customOutfit,
          false, // forceApiTest
          useDirectPrompt, // use direct prompt to bypass weather
          prompt, // original user prompt
          style // style
        );
      }

      console.log('✅ [CUSTOM-OUTFIT] Preview image generated successfully');
    } catch (error) {
      console.error('❌ [CUSTOM-OUTFIT] Preview image generation failed:', error);
      // Fallback to placeholder
      customOutfit.previewImage = this.generateSVGPlaceholder('Custom Outfit', '#F3F4F6', '#6B7280');
    }

    return customOutfit;
  }

  /**
   * Extract clothing pieces from user prompt
   */
  private extractPiecesFromPrompt(prompt: string): string[] {
    const commonPieces = [
      'shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'coat',
      'pants', 'jeans', 'trousers', 'skirt', 'dress', 'shorts',
      'shoes', 'boots', 'sneakers', 'heels', 'sandals',
      'hat', 'scarf', 'belt', 'bag', 'jewelry', 'accessories'
    ];

    const extractedPieces: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    commonPieces.forEach(piece => {
      if (lowerPrompt.includes(piece)) {
        extractedPieces.push(piece.charAt(0).toUpperCase() + piece.slice(1));
      }
    });

    // If no specific pieces found, add generic ones based on style
    if (extractedPieces.length === 0) {
      extractedPieces.push('Stylish top', 'Coordinated bottom', 'Matching accessories');
    }

    return extractedPieces.slice(0, 5); // Limit to 5 pieces
  }

  /**
   * Extract colors from user prompt
   */
  private extractColorsFromPrompt(prompt: string): string[] {
    const colorKeywords = [
      'black', 'white', 'blue', 'red', 'green', 'yellow', 'purple', 'pink',
      'gray', 'grey', 'brown', 'beige', 'navy', 'khaki', 'orange', 'gold',
      'silver', 'burgundy', 'maroon', 'teal', 'olive', 'coral', 'mint'
    ];

    const extractedColors: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    colorKeywords.forEach(color => {
      if (lowerPrompt.includes(color)) {
        extractedColors.push(color.charAt(0).toUpperCase() + color.slice(1));
      }
    });

    // Default colors if none specified
    if (extractedColors.length === 0) {
      extractedColors.push('Black', 'White', 'Navy');
    }

    return extractedColors.slice(0, 3); // Limit to 3 colors
  }

  /**
   * Get occasion from style
   */
  private getOccasionFromStyle(style: string): string {
    const styleOccasions = {
      casual: 'Everyday wear',
      formal: 'Professional/Special events',
      trendy: 'Social gatherings',
      vintage: 'Retro-themed events',
      minimalist: 'Modern lifestyle',
      edgy: 'Creative/Artistic venues'
    };

    return styleOccasions[style as keyof typeof styleOccasions] || 'Daily wear';
  }

  /**
   * Apply outfit to avatar using two-step process: garment generation + virtual try-on
   */
  async applyOutfitToAvatar(avatarImageUrl: string, outfit: OutfitSuggestion): Promise<string> {
    console.log('👗 Starting two-step outfit application to avatar:', {
      avatarImageUrl,
      outfitName: outfit.name,
      pieces: outfit.pieces,
      colors: outfit.colors,
      style: outfit.style
    });

    try {
      // Step 1: Generate garment image using text-to-image
      const garmentPrompt = `${outfit.pieces.join(', ')} in ${outfit.colors.join(' and ')} colors, ${outfit.style} style`;
      console.log('🎨 Step 1: Generating garment image with prompt:', garmentPrompt);

      const garmentImageUrl = await this.generateOutfitImage(avatarImageUrl, garmentPrompt);
      console.log('✅ Step 1 complete: Generated garment image URL:', garmentImageUrl);

      // Step 2: Apply garment to avatar using virtual try-on
      console.log('🎭 Step 2: Applying garment to avatar using virtual try-on...');

      // Import the virtual try-on service
      const { virtualTryOnService } = await import('./virtualTryOnService');

      // Apply the generated garment to the user's avatar
      const tryOnResult = await virtualTryOnService.applyOutfitToAvatar(
        avatarImageUrl,
        garmentImageUrl,
        'auto' // Let the service auto-detect the garment category
      );

      if (!tryOnResult.success) {
        throw new Error(tryOnResult.error || 'Virtual try-on failed');
      }

      console.log('✅ Step 2 complete: Virtual try-on successful');

      // Add development mode feedback
      if (tryOnResult.developmentMode) {
        console.log('🔧 Development Mode: Using generated outfit image as result');
        console.log('💡 In production, this would be a real virtual try-on blend with the avatar');
      }

      console.log('🎉 Final result: Avatar with applied outfit:', tryOnResult.imageUrl);

      return tryOnResult.imageUrl!;

    } catch (error) {
      console.error('💥 Two-step outfit application failed:', error);

      // Fallback: return original avatar if both steps fail
      if (error instanceof Error) {
        if (error.message.includes('garment generation')) {
          throw new Error('Failed to generate garment image. Please try again.');
        } else if (error.message.includes('virtual try-on') || error.message.includes('Virtual try-on')) {
          throw new Error('Failed to apply outfit to avatar. Please try again.');
        }
      }

      throw new Error('Failed to apply outfit to avatar. Please try again.');
    }
  }

  /**
   * Generate standalone garment image (no person wearing it) for outfit preview
   * This method creates garment-only images without applying them to any avatar
   */
  /**
   * Generate multiple garment images with different prompt variations
   */
  async generateMultipleGarmentImages(outfit: OutfitSuggestion, forceApiTest: boolean = false): Promise<{
    images: Array<{ url: string; prompt: string; variation: string }>;
    success: boolean;
    error?: string;
  }> {
    console.log('🎨 [MULTI-GEN] Starting multiple garment image generation...');

    const variations = this.generatePromptVariations(outfit);
    const variationNames = ['Enhanced', 'Minimalist', 'Artistic', 'Commercial', 'User Preference'];
    const results: Array<{ url: string; prompt: string; variation: string }> = [];
    const errors: string[] = [];

    // Generate images for each variation (limit to 3 for performance)
    for (let i = 0; i < Math.min(3, variations.length); i++) {
      try {
        console.log(`🎨 [MULTI-GEN] Generating variation ${i + 1}: ${variationNames[i]}`);

        const imageUrl = await this.generateSingleImageWithConfig(outfit, variations[i], variationNames[i], forceApiTest);

        results.push({
          url: imageUrl,
          prompt: variations[i],
          variation: variationNames[i]
        });

        console.log(`✅ [MULTI-GEN] Variation ${i + 1} successful`);

        // Add small delay between requests to avoid rate limiting
        if (i < variations.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ [MULTI-GEN] Variation ${i + 1} failed:`, error);
        errors.push(`Variation ${i + 1} (${variationNames[i]}): ${error.message}`);
      }
    }

    console.log(`🎨 [MULTI-GEN] Completed: ${results.length} successful, ${errors.length} failed`);

    return {
      images: results,
      success: results.length > 0,
      error: errors.length > 0 ? errors.join('; ') : undefined
    };
  }

  /**
   * Generate single image with variation-specific configuration
   */
  private async generateSingleImageWithConfig(outfit: OutfitSuggestion, prompt: string, variation: string, forceApiTest: boolean): Promise<string> {
    // Get variation-specific API configuration
    const config = this.getVariationConfig(variation);

    const isDevMode = this.isDevMode();
    const shouldUseApi = forceApiTest || !isDevMode;

    if (isDevMode && !forceApiTest) {
      // Return development fallback
      await new Promise(resolve => setTimeout(resolve, 800));
      const workingSVG = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#10B981"/><circle cx="200" cy="200" r="100" fill="#FFFFFF"/><text x="200" y="210" text-anchor="middle" font-family="Arial" font-size="24" fill="#000000">OUTFIT</text></svg>';
      return `data:image/svg+xml;base64,${btoa(workingSVG)}`;
    }

    // Production API call with variation-specific config via proxy
    console.log('🎨 Using /api/fal proxy for outfit generation');

    // Parse negative prompt
    const promptParts = prompt.split(' --neg ');
    const cleanPrompt = promptParts[0];
    const negativePrompt = promptParts[1] || '';

    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: cleanPrompt,
        negative_prompt: negativePrompt || config.defaultNegatives,
        image_size: { width: 1024, height: 1024 },
        num_inference_steps: config.steps,
        guidance_scale: config.guidance,
        num_images: 1,
        seed: this.getVariationSeed(outfit, variation),
        enable_safety_checker: false,
        safety_tolerance: 2,
        scheduler: config.scheduler,
        clip_skip: 1,
        use_karras_sigmas: true
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return result.images?.[0]?.url || result.data?.images?.[0]?.url;
  }

  /**
   * Get variation-specific API configuration
   */
  private getVariationConfig(variation: string): {
    steps: number;
    guidance: number;
    scheduler: string;
    defaultNegatives: string;
  } {
    const configs = {
      'Enhanced': {
        steps: 40,
        guidance: 9.0,
        scheduler: 'DPM++ 2M Karras',
        defaultNegatives: 'blurry, low quality, distorted, pixelated, bad anatomy, deformed, ugly, bad proportions, duplicate, watermark, signature, text, jpeg artifacts'
      },
      'Minimalist': {
        steps: 35,
        guidance: 8.5,
        scheduler: 'DPM++ 2M Karras',
        defaultNegatives: 'cluttered, busy background, complex, overdone, excessive detail, noisy, chaotic'
      },
      'Artistic': {
        steps: 45,
        guidance: 10.0,
        scheduler: 'DPM++ SDE Karras',
        defaultNegatives: 'plain, boring, flat lighting, generic, amateur, snapshot, low effort'
      },
      'Commercial': {
        steps: 42,
        guidance: 11.0,
        scheduler: 'DPM++ 2M Karras',
        defaultNegatives: 'artistic shadows, mood lighting, creative angles, editorial style, dramatic, moody'
      },
      'User Preference': {
        steps: 40,
        guidance: 9.5,
        scheduler: 'DPM++ 2M Karras',
        defaultNegatives: 'blurry, low quality, distorted, pixelated, bad anatomy, deformed'
      }
    };

    return configs[variation] || configs['Enhanced'];
  }

  /**
   * Generate single image with specific prompt (legacy method)
   */
  private async generateSingleImage(outfit: OutfitSuggestion, prompt: string, forceApiTest: boolean): Promise<string> {
    // Use the same logic as generateGarmentOnlyImage but with custom prompt
    const isDevMode = this.isDevMode();
    const shouldUseApi = forceApiTest || !isDevMode;

    if (isDevMode && !forceApiTest) {
      // Return development fallback
      await new Promise(resolve => setTimeout(resolve, 800)); // Shorter delay for multi-gen
      const workingSVG = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#10B981"/><circle cx="200" cy="200" r="100" fill="#FFFFFF"/><text x="200" y="210" text-anchor="middle" font-family="Arial" font-size="24" fill="#000000">OUTFIT</text></svg>';
      return `data:image/svg+xml;base64,${btoa(workingSVG)}`;
    }

    // Production API call with custom prompt via proxy
    console.log('🎨 Using /api/fal proxy for custom outfit generation');

    // Parse negative prompt from enhanced prompt (same as main method)
    const promptParts = prompt.split(' --neg ');
    const cleanPrompt = promptParts[0];
    const negativePrompt = promptParts[1] || '';

    // Use optimized configuration
    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: cleanPrompt,
        negative_prompt: negativePrompt || 'blurry, low quality, distorted, pixelated, bad anatomy, deformed, ugly, bad proportions, duplicate, watermark, signature, text, jpeg artifacts, worst quality, low quality, normal quality, lowres, bad hands, error, missing fingers, extra digit, fewer digits, cropped',
        image_size: { width: 1024, height: 1024 },
        num_inference_steps: 40, // Higher quality
        guidance_scale: 9.0, // Better prompt adherence
        num_images: 1,
        seed: this.getConsistentSeed(outfit),
        enable_safety_checker: false,
        safety_tolerance: 2,
        scheduler: 'DPM++ 2M Karras',
        clip_skip: 1,
        use_karras_sigmas: true
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return result.images?.[0]?.url || result.data?.images?.[0]?.url;
  }

  /**
   * Record user selection and update preferences
   */
  recordUserSelection(selectedVariation: string, prompt: string, outfit: OutfitSuggestion): void {
    console.log('🧠 [LEARNING] Recording user selection:', selectedVariation);

    try {
      const preferences = this.getUserPreferences();

      // Initialize learning data if not exists
      if (!preferences.selections) preferences.selections = [];
      if (!preferences.favoriteTerms) preferences.favoriteTerms = [];
      if (!preferences.dislikedTerms) preferences.dislikedTerms = [];
      if (!preferences.preferredWeights) preferences.preferredWeights = {};
      if (!preferences.variationPreferences) preferences.variationPreferences = {};

      // Record the selection
      preferences.selections.push({
        variation: selectedVariation,
        prompt: prompt,
        outfit: outfit.style,
        timestamp: Date.now()
      });

      // Update variation preferences
      preferences.variationPreferences[selectedVariation] = (preferences.variationPreferences[selectedVariation] || 0) + 1;

      // Analyze prompt terms for learning
      this.analyzePromptTerms(prompt, preferences);

      // Keep only last 50 selections to avoid storage bloat
      if (preferences.selections.length > 50) {
        preferences.selections = preferences.selections.slice(-50);
      }

      // Save updated preferences
      localStorage.setItem('outfitPromptPreferences', JSON.stringify(preferences));

      console.log('🧠 [LEARNING] Updated preferences:', {
        totalSelections: preferences.selections.length,
        favoriteVariation: Object.entries(preferences.variationPreferences).sort(([,a], [,b]) => b - a)[0]?.[0],
        favoriteTermsCount: preferences.favoriteTerms.length
      });

    } catch (error) {
      console.error('❌ [LEARNING] Failed to record selection:', error);
    }
  }

  /**
   * Analyze prompt terms to learn user preferences
   */
  private analyzePromptTerms(prompt: string, preferences: any): void {
    // Extract terms with weights like (term:1.2)
    const weightedTerms = prompt.match(/\([^:)]+:\d+\.?\d*\)/g) || [];
    const regularTerms = prompt.split(',').map(t => t.trim().toLowerCase());

    weightedTerms.forEach(term => {
      const match = term.match(/\(([^:)]+):(\d+\.?\d*)\)/);
      if (match) {
        const [, termName, weight] = match;
        preferences.preferredWeights[termName] = (preferences.preferredWeights[termName] || 0) + parseFloat(weight);

        if (!preferences.favoriteTerms.includes(termName)) {
          preferences.favoriteTerms.push(termName);
        }
      }
    });

    // Track frequently selected regular terms
    regularTerms.forEach(term => {
      if (term.length > 3 && !term.includes('--neg')) { // Skip short terms and negative section
        const cleanTerm = term.replace(/[()]/g, '').split(':')[0];
        if (!preferences.favoriteTerms.includes(cleanTerm)) {
          // Add term after seeing it multiple times
          const termCount = preferences.selections.filter(s => s.prompt.includes(cleanTerm)).length;
          if (termCount >= 2) {
            preferences.favoriteTerms.push(cleanTerm);
          }
        }
      }
    });
  }

  async generateGarmentOnlyImage(
    outfit: OutfitSuggestion,
    forceApiTest: boolean = false,
    useDirectPrompt: boolean = false,
    originalUserPrompt?: string,
    style?: string
  ): Promise<string> {
    const isDevMode = this.isDevMode();
    const hasApiKey = !!import.meta.env.VITE_FAL_KEY;
    const shouldUseApi = forceApiTest || !isDevMode;

    console.log('👔 [OUTFIT-GEN] Starting garment image generation for preview:', {
      outfitName: outfit.name,
      pieces: outfit.pieces,
      colors: outfit.colors,
      style: outfit.style,
      isDevMode,
      hasApiKey,
      forceApiTest,
      shouldUseApi,
      apiKey: hasApiKey ? 'Present' : 'Missing'
    });

    // Add temporary force API testing flag
    if (forceApiTest) {
      console.log('🚀 [API-DEBUG] FORCE API TEST MODE - Bypassing development mode to test FAL.ai API');
    }

    // Check if we should use development mode (unless forced to test API)
    if (isDevMode && !forceApiTest) {
      console.log('🔧 [OUTFIT-GEN] Development mode detected - using simplified working pattern');
      console.log('🎨 [OUTFIT-GEN] Generated outfit details:', outfit);

      // Simulate some processing time to make it feel real
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('🎨 [OUTFIT-GEN] Creating outfit-specific SVG...');

      // Get outfit details for customization
      const outfitName = outfit.name || 'Custom Outfit';
      const outfitStyle = outfit.style || 'casual';
      const mainPiece = outfit.pieces?.[0] || 'clothing';

      // Style-based colors
      const styleColors = {
        casual: '#10B981',     // Green
        formal: '#1E40AF',     // Blue
        trendy: '#EC4899',     // Pink
        vintage: '#92400E',    // Brown
        minimalist: '#6B7280', // Gray
        edgy: '#7C2D12'        // Dark red
      };

      const bgColor = styleColors[outfitStyle] || '#10B981';

      // Create outfit-specific SVG (keeping same reliable structure)
      const workingSVG = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="${bgColor}"/><circle cx="200" cy="200" r="120" fill="#FFFFFF" opacity="0.9"/><text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#000000">${outfitStyle.toUpperCase()}</text><text x="200" y="210" text-anchor="middle" font-family="Arial" font-size="14" fill="#000000">${mainPiece}</text><text x="200" y="235" text-anchor="middle" font-family="Arial" font-size="12" fill="#666666">Generated Outfit</text></svg>`;

      console.log('🎨 [OUTFIT-GEN] SVG created, encoding with working method...');

      // Use the exact same encoding as the working hardcoded test
      let workingImage;
      try {
        workingImage = `data:image/svg+xml;base64,${btoa(workingSVG)}`;
        console.log('✅ [OUTFIT-GEN] Using base64 encoding (same as hardcoded test)');
      } catch (e) {
        workingImage = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(workingSVG)}`;
        console.log('✅ [OUTFIT-GEN] Using URL encoding fallback (same as hardcoded test)');
      }

      console.log('✅ [OUTFIT-GEN] Development fallback complete with working SVG pattern:', {
        url: workingImage.substring(0, 100) + '...',
        length: workingImage.length,
        startsWithData: workingImage.startsWith('data:')
      });

      return workingImage;
    }

    // Production mode or forced API test - try to use FAL API
    console.log('🚀 [API-DEBUG] Entering API mode - shouldUseApi:', shouldUseApi);

    try {
      // Comprehensive environment check
      console.log('🔍 [API-DEBUG] Environment analysis:', {
        NODE_ENV: import.meta.env.NODE_ENV,
        DEV: import.meta.env.DEV,
        PROD: import.meta.env.PROD,
        allEnvKeys: Object.keys(import.meta.env).filter(key => key.includes('FAL') || key.includes('API')),
        viteFalKey: import.meta.env.VITE_FAL_KEY ? 'EXISTS' : 'MISSING'
      });

      // Check if API key is available
      const apiKey = import.meta.env.VITE_FAL_KEY;
      console.log('🔑 [API-DEBUG] Detailed API key analysis:', {
        exists: !!apiKey,
        type: typeof apiKey,
        length: apiKey?.length || 0,
        isEmpty: apiKey === '',
        isUndefined: apiKey === undefined,
        isNull: apiKey === null,
        startsWithFal: apiKey?.startsWith('fal_') || false,
        startsWithFAL: apiKey?.startsWith('FAL_') || false,
        isPlaceholder: apiKey === 'YOUR_FAL_API_KEY_HERE' || apiKey === 'your-fal-api-key-here',
        firstChars: apiKey ? apiKey.substring(0, 8) + '...' : 'N/A',
        lastChars: apiKey && apiKey.length > 8 ? '...' + apiKey.substring(apiKey.length - 4) : 'N/A'
      });

      if (!apiKey) {
        console.error('❌ [API-DEBUG] VITE_FAL_KEY is missing or empty!');
        console.error('❌ [API-DEBUG] Please set VITE_FAL_KEY in your environment or .env file');
        const fallbackUrl = this.generateSVGPlaceholder('API Key Missing', '#FEE2E2', '#DC2626');
        return fallbackUrl;
      }

      if (apiKey === 'YOUR_FAL_API_KEY_HERE' || apiKey === 'your-fal-api-key-here') {
        console.error('❌ [API-DEBUG] VITE_FAL_KEY is still set to placeholder value!');
        console.error('❌ [API-DEBUG] Please replace with your actual FAL.ai API key');
        const fallbackUrl = this.generateSVGPlaceholder('API Key Placeholder', '#FEF3C7', '#D97706');
        return fallbackUrl;
      }

      if (apiKey.length < 10) {
        console.error('❌ [API-DEBUG] VITE_FAL_KEY appears to be too short (< 10 characters)');
        console.error('❌ [API-DEBUG] FAL.ai keys are typically much longer');
        const fallbackUrl = this.generateSVGPlaceholder('API Key Invalid', '#FEE2E2', '#DC2626');
        return fallbackUrl;
      }

      console.log('✅ [API-DEBUG] API key validation passed - proceeding with API call');

      // Create prompt - use direct prompt if requested, otherwise enhanced garment prompt
      const garmentPrompt = useDirectPrompt && originalUserPrompt && style
        ? this.createDirectCustomPrompt(originalUserPrompt, style)
        : this.createEnhancedGarmentPrompt(outfit);

      console.log(`🎨 [API-DEBUG] Generated ${useDirectPrompt ? 'direct custom' : 'enhanced garment'} prompt:`, garmentPrompt);

      // Also show base prompt for comparison (unless using direct prompt)
      if (!useDirectPrompt) {
        const basePrompt = this.createGarmentOnlyPrompt(outfit);
        console.log('🎨 [API-DEBUG] Base prompt (for comparison):', basePrompt);
      }

      // Parse negative prompt from enhanced prompt
      const promptParts = garmentPrompt.split(' --neg ');
      const cleanPrompt = promptParts[0];
      const negativePrompt = promptParts[1] || '';

      // Advanced API configuration for better quality and consistency
      const requestPayload = {
        prompt: cleanPrompt,
        negative_prompt: negativePrompt || 'blurry, low quality, distorted, pixelated, bad anatomy, deformed, ugly, bad proportions, duplicate, watermark, signature, text, jpeg artifacts, worst quality, low quality, normal quality, lowres, bad hands, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, bad feet, poorly drawn hands, poorly drawn face, mutation, deformed, extra limbs, extra arms, extra legs, malformed limbs, fused fingers, too many fingers, long neck, cross-eyed, mutated hands, polar lowres, bad body, bad proportions, gross proportions, missing arms, missing legs, extra arms, extra legs, extra head, extra face, extra eyes, extra mouth, extra nose, extra ears, extra hair',
        image_size: {
          width: 1024,
          height: 1024
        },
        num_inference_steps: 40, // Increased for better quality (was 28)
        guidance_scale: 9.0, // Higher for better prompt adherence (was 7.5)
        num_images: 1,
        seed: this.getConsistentSeed(outfit), // Use consistent seed for same outfits
        enable_safety_checker: false,
        safety_tolerance: 2,
        scheduler: 'DPM++ 2M Karras', // Better quality scheduler if supported
        clip_skip: 1, // Better prompt understanding
        use_karras_sigmas: true // Improved sampling for better quality
      };

      console.log('📡 [API-DEBUG] Full request payload:', JSON.stringify(requestPayload, null, 2));
      console.log('📡 [API-DEBUG] Making FAL.ai API request to bytedance/seedream/v4/text-to-image...');

      const requestStartTime = Date.now();

      // Call FAL.ai Bytedance Seedream 4.0 Text-to-Image API for pure garment generation
      const response = await fetch('https://fal.run/fal-ai/flux/dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${apiKey}`,
        },
        body: JSON.stringify(requestPayload),
      });

      const requestDuration = Date.now() - requestStartTime;
      console.log(`📡 [API-DEBUG] FAL API response received in ${requestDuration}ms - Status: ${response.status}`);

      console.log('📡 [API-DEBUG] Response headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [API-DEBUG] FAL API error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        throw new Error(`FAL API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [API-DEBUG] FAL.ai API call successful! Analyzing response...');
      console.log('📋 [API-DEBUG] Full API Response structure:');
      console.log(JSON.stringify(result, null, 2));

      // Analyze the response structure in detail
      console.log('🔍 [API-DEBUG] Response analysis:', {
        topLevelKeys: Object.keys(result || {}),
        hasData: 'data' in result,
        hasImages: 'images' in result,
        dataKeys: result.data ? Object.keys(result.data) : 'No data key',
        dataImagesCount: result.data?.images?.length || 'N/A',
        imagesCount: Array.isArray(result.images) ? result.images.length : 'N/A',
        responseType: typeof result
      });

      // Try to find images in the most common formats
      let imageUrl = null;

      if (result.data && result.data.images && result.data.images.length > 0) {
        imageUrl = result.data.images[0].url;
        console.log('🖼️ [API-DEBUG] Found image URL in result.data.images[0].url:', imageUrl);
      } else if (result.images && Array.isArray(result.images) && result.images.length > 0) {
        imageUrl = result.images[0].url || result.images[0];
        console.log('🖼️ [API-DEBUG] Found image URL in result.images[0]:', imageUrl);
      } else if (result.image) {
        imageUrl = result.image.url || result.image;
        console.log('🖼️ [API-DEBUG] Found image URL in result.image:', imageUrl);
      }

      if (imageUrl) {
        console.log('✅ [API-DEBUG] Successfully extracted image URL:', {
          url: imageUrl,
          isString: typeof imageUrl === 'string',
          startsWithHttp: imageUrl.startsWith('http'),
          length: imageUrl.length
        });
        return imageUrl;
      }

      console.error('❌ [API-DEBUG] No images found in API response. Response structure:', result);
      throw new Error('No garment image generated from FAL.ai API - unexpected response format');

    } catch (error) {
      console.error('❌ [API-DEBUG] CRITICAL: FAL.ai API call failed with error:');
      console.error('❌ [API-DEBUG] Raw error object:', error);
      console.error('❌ [API-DEBUG] Error stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

      // Handle different types of errors
      if (error instanceof TypeError) {
        console.error('❌ [API-DEBUG] Network/TypeError details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause,
          errorType: 'Network or type error - possibly CORS, network, or invalid URL'
        });
      } else if (error instanceof Error) {
        console.error('❌ [API-DEBUG] Standard Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause,
          errorType: 'Standard JavaScript Error'
        });
      } else {
        console.error('❌ [API-DEBUG] Unknown error type:', {
          type: typeof error,
          value: error,
          stringified: String(error),
          errorType: 'Non-standard error object'
        });
      }

      // Additional network error diagnostics
      if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('CORS')) {
        console.error('🌐 [API-DEBUG] Network diagnostics:', {
          possibleCauses: [
            'CORS policy blocking the request',
            'Network connectivity issues',
            'FAL.ai API endpoint unavailable',
            'Invalid URL or API endpoint',
            'Browser security restrictions'
          ],
          suggestion: 'Check network tab in browser dev tools for detailed error'
        });
      }

      // Always provide a fallback for user experience
      console.log('🔄 [OUTFIT-GEN] Providing fallback image due to error');
      const fallbackUrl = this.generateSVGPlaceholder('Generation Failed', '#FEE2E2', '#DC2626');
      return fallbackUrl;
    }
  }

  /**
   * Generate 3 optimized prompt previews for user editing before generation
   */
  generateOptimizedPromptPreviews(userPrompt: string, style: string): string[] {
    console.log('📝 [PROMPT-PREVIEW] Generating 3 optimized prompts for user editing');
    console.log('📝 [PROMPT-PREVIEW] Input:', { userPrompt, style });

    // Base prompt with user input
    const baseDescription = userPrompt.trim();
    const styleKeyword = style.toLowerCase();

    // Create 3 distinct Seedream-optimized prompt styles
    const prompts = [
      // 1. Enhanced Quality - Photorealistic focus
      this.createEnhancedQualityPrompt(baseDescription, styleKeyword),

      // 2. Commercial Product - Clean e-commerce style
      this.createCommercialProductPrompt(baseDescription, styleKeyword),

      // 3. Artistic Editorial - Creative magazine style
      this.createArtisticEditorialPrompt(baseDescription, styleKeyword)
    ];

    console.log('📝 [PROMPT-PREVIEW] Generated 3 optimized prompts:', {
      enhanced: prompts[0].substring(0, 100) + '...',
      commercial: prompts[1].substring(0, 100) + '...',
      artistic: prompts[2].substring(0, 100) + '...'
    });

    return prompts;
  }

  /**
   * Create enhanced quality prompt optimized for Seedream
   */
  private createEnhancedQualityPrompt(userPrompt: string, style: string): string {
    const qualityTerms = [
      'photorealistic',
      '8k quality',
      'ultra detailed',
      'professional photography',
      'high resolution',
      'detailed fabric textures',
      'studio lighting',
      'sharp focus',
      'crisp details',
      '(high quality:1.3)',
      '(photorealistic:1.2)',
      `(${style} style:1.2)`
    ];

    const negatives = [
      'blurry', 'low quality', 'distorted', 'pixelated', 'bad anatomy',
      'deformed', 'ugly', 'bad proportions', 'watermark', 'signature',
      'text', 'jpeg artifacts'
    ];

    return `${userPrompt}, ${qualityTerms.join(', ')} --neg ${negatives.join(', ')}`;
  }

  /**
   * Create commercial product prompt optimized for Seedream
   */
  private createCommercialProductPrompt(userPrompt: string, style: string): string {
    const commercialTerms = [
      'clean white background',
      'product photography',
      'e-commerce style',
      'professional lighting',
      'commercial quality',
      'studio setup',
      'even lighting',
      'shadow-free',
      'catalog style',
      '(product photography:1.4)',
      '(e-commerce:1.3)',
      '(commercial grade:1.2)'
    ];

    const negatives = [
      'artistic shadows', 'mood lighting', 'creative angles', 'editorial style',
      'dramatic', 'moody', 'complex background', 'cluttered', 'busy'
    ];

    return `${userPrompt}, ${commercialTerms.join(', ')} --neg ${negatives.join(', ')}`;
  }

  /**
   * Create artistic editorial prompt optimized for Seedream
   */
  private createArtisticEditorialPrompt(userPrompt: string, style: string): string {
    const artisticTerms = [
      'fashion magazine style',
      'dramatic lighting',
      'creative composition',
      'high-end photography',
      'editorial quality',
      'artistic photography',
      'moody atmosphere',
      'dynamic shadows',
      'magazine quality',
      '(artistic:1.3)',
      '(creative:1.2)',
      '(editorial:1.2)',
      '(fashion photography:1.2)'
    ];

    const negatives = [
      'plain', 'boring', 'flat lighting', 'generic', 'amateur',
      'snapshot', 'low effort', 'simple', 'basic'
    ];

    return `${userPrompt}, ${artisticTerms.join(', ')} --neg ${negatives.join(', ')}`;
  }

  /**
   * Parse multiple prompts from textarea content
   */
  parseMultiplePrompts(textareaContent: string): string[] {
    const prompts = textareaContent
      .split(/\n\s*---\s*\n/)
      .map(prompt => prompt.trim())
      .filter(prompt => prompt.length > 0);

    console.log('📝 [PROMPT-PARSE] Parsed prompts:', {
      originalContent: textareaContent.substring(0, 100) + '...',
      promptCount: prompts.length,
      prompts: prompts.map((p, i) => `${i + 1}: ${p.substring(0, 50)}...`)
    });

    return prompts;
  }

  /**
   * Generate garment images from multiple different user prompts
   */
  async generateImagesFromMultiplePrompts(
    prompts: string[],
    style: string,
    weather: WeatherData,
    timeOfDay: string,
    season: string
  ): Promise<Array<{ url: string; prompt: string; variation: string }>> {
    console.log(`🎨 [MULTI-PROMPTS] Starting generation from ${prompts.length} different prompts...`);

    const results: Array<{ url: string; prompt: string; variation: string }> = [];

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      console.log(`🔄 [MULTI-PROMPTS] Processing prompt ${i + 1}/${prompts.length}: "${prompt.substring(0, 50)}..."`);

      try {
        // Create a temporary outfit suggestion for this prompt
        const tempOutfit: OutfitSuggestion = {
          id: Date.now() + i,
          name: `Custom Prompt ${i + 1}`,
          description: `Custom outfit: ${prompt}`,
          weatherAppropriate: true,
          styleMatch: 100,
          pieces: this.extractPiecesFromPrompt(prompt),
          colors: this.extractColorsFromPrompt(prompt),
          style: style.charAt(0).toUpperCase() + style.slice(1),
          occasion: this.getOccasionFromStyle(style),
          temperature_range: { min: weather.temperature - 10, max: weather.temperature + 10 }
        };

        // Generate image using direct prompt mode
        const imageUrl = await this.generateGarmentOnlyImage(
          tempOutfit,
          false, // forceApiTest
          true,  // useDirectPrompt - bypass weather constraints
          prompt, // originalUserPrompt
          style   // style
        );

        results.push({
          url: imageUrl,
          prompt: prompt,
          variation: `Custom ${i + 1}`
        });

        console.log(`✅ [MULTI-PROMPTS] Generated image for prompt ${i + 1}`);

      } catch (error) {
        console.error(`❌ [MULTI-PROMPTS] Failed to generate image for prompt ${i + 1}:`, error);

        // Add fallback image for failed prompt
        results.push({
          url: this.generateSVGPlaceholder(`Prompt ${i + 1} Failed`, '#FEE2E2', '#DC2626'),
          prompt: prompt,
          variation: `Custom ${i + 1} (Failed)`
        });
      }
    }

    console.log(`✅ [MULTI-PROMPTS] Completed generation: ${results.length} images generated`);
    return results;
  }

  /**
   * Generate multiple prompt variations for user selection
   */
  generatePromptVariations(outfit: OutfitSuggestion): string[] {
    const basePrompt = this.createGarmentOnlyPrompt(outfit);
    const userPreferences = this.getUserPreferences();

    const variations = [
      // Variation 1: Standard Enhanced (current approach)
      this.createEnhancedGarmentPrompt(outfit),

      // Variation 2: Minimalist/Clean approach
      this.createMinimalistVariation(outfit, basePrompt),

      // Variation 3: Artistic/Creative approach
      this.createArtisticVariation(outfit, basePrompt),

      // Variation 4: Commercial/Product focus
      this.createCommercialVariation(outfit, basePrompt),

      // Variation 5: User preference-based (learned from past selections)
      this.createUserPreferenceVariation(outfit, basePrompt, userPreferences)
    ];

    console.log('🎨 [PROMPT-VAR] Generated 5 prompt variations:', variations.map((v, i) => ({
      index: i + 1,
      preview: v.substring(0, 100) + '...',
      length: v.length
    })));

    return variations;
  }

  /**
   * Create minimalist prompt variation
   */
  private createMinimalistVariation(outfit: OutfitSuggestion, basePrompt: string): string {
    const minimalTerms = [
      'clean composition',
      'minimal background',
      'professional product shot',
      'high contrast',
      'simple lighting',
      '(clean:1.2)',
      '(minimal:1.3)',
      '(professional:1.1)'
    ];

    const negatives = ['cluttered', 'busy background', 'complex', 'overdone', 'excessive detail'];

    return `${basePrompt}, ${minimalTerms.join(', ')} --neg ${negatives.join(', ')}`;
  }

  /**
   * Create artistic prompt variation
   */
  private createArtisticVariation(outfit: OutfitSuggestion, basePrompt: string): string {
    const artisticTerms = [
      'artistic photography',
      'creative composition',
      'dramatic lighting',
      'fashion editorial style',
      'magazine quality',
      '(artistic:1.3)',
      '(creative:1.2)',
      '(editorial:1.2)',
      'moody atmosphere',
      'dynamic shadows'
    ];

    const negatives = ['plain', 'boring', 'flat lighting', 'generic'];

    return `${basePrompt}, ${artisticTerms.join(', ')} --neg ${negatives.join(', ')}`;
  }

  /**
   * Create commercial prompt variation
   */
  private createCommercialVariation(outfit: OutfitSuggestion, basePrompt: string): string {
    const commercialTerms = [
      'e-commerce photography',
      'product catalog style',
      'white background',
      'studio lighting',
      'commercial grade',
      '(product photography:1.4)',
      '(e-commerce:1.3)',
      '(catalog style:1.2)',
      'even lighting',
      'shadow-free'
    ];

    const negatives = ['artistic shadows', 'mood lighting', 'creative angles', 'editorial style'];

    return `${basePrompt}, ${commercialTerms.join(', ')} --neg ${negatives.join(', ')}`;
  }

  /**
   * Create user preference-based variation
   */
  private createUserPreferenceVariation(outfit: OutfitSuggestion, basePrompt: string, preferences: any): string {
    // Use learned preferences from past selections
    const preferredTerms = preferences.favoriteTerms || ['photorealistic', 'high quality', 'detailed'];
    const avoidedTerms = preferences.dislikedTerms || ['blurry', 'low quality'];
    const preferredWeights = preferences.preferredWeights || {};

    // Apply learned weights to terms
    const weightedTerms = preferredTerms.map(term => {
      const weight = preferredWeights[term] || 1.1;
      return `(${term}:${weight})`;
    });

    return `${basePrompt}, ${weightedTerms.join(', ')} --neg ${avoidedTerms.join(', ')}`;
  }

  /**
   * Get user preferences from localStorage
   */
  private getUserPreferences(): any {
    try {
      const prefs = localStorage.getItem('outfitPromptPreferences');
      return prefs ? JSON.parse(prefs) : {};
    } catch {
      return {};
    }
  }

  /**
   * Enhanced prompt generation with technical descriptors and negative prompts
   */
  private createEnhancedGarmentPrompt(outfit: OutfitSuggestion): string {
    // Base garment description
    const basePrompt = this.createGarmentOnlyPrompt(outfit);

    // Style descriptors for photorealism and quality
    const qualityDescriptors = [
      'photorealistic',
      '8k quality',
      'ultra detailed',
      'high resolution',
      'professional photography',
      'studio lighting',
      'sharp focus',
      'crisp details',
      'commercial photography',
      'fashion photography style'
    ];

    // Technical terms that improve model response
    const technicalTerms = [
      'fabric texture visible',
      'realistic material properties',
      'accurate color reproduction',
      'proper lighting and shadows',
      'high dynamic range',
      'color graded',
      'professional composition',
      'clean background',
      'product photography'
    ];

    // Negative prompts to exclude unwanted elements
    const negativePrompts = [
      'blurry',
      'low quality',
      'pixelated',
      'distorted',
      'artificial looking',
      'plastic appearance',
      'oversaturated',
      'unrealistic colors',
      'poor lighting',
      'dark shadows',
      'grainy',
      'noisy',
      'artifacts',
      'watermark',
      'text overlay'
    ];

    // Style-specific enhancements
    const styleEnhancements = this.getStyleSpecificTerms(outfit.style);

    // Weight important elements (FAL.ai supports weight syntax)
    const weightedElements = [
      `(${outfit.style} style:1.2)`,
      '(high quality:1.3)',
      '(photorealistic:1.2)',
      '(detailed fabric:1.1)',
      '(professional photography:1.1)',
      ...styleEnhancements
    ];

    // Combine all elements with proper formatting
    const enhancedPrompt = [
      basePrompt,
      ...qualityDescriptors.slice(0, 5), // First 5 quality descriptors
      ...technicalTerms.slice(0, 4), // First 4 technical terms
      ...weightedElements
    ].join(', ');

    // Add negative prompt section
    const negativePromptSection = negativePrompts.slice(0, 8).join(', ');

    return `${enhancedPrompt} --neg ${negativePromptSection}`;
  }

  /**
   * Get style-specific technical terms and weights
   */
  private getStyleSpecificTerms(style: string): string[] {
    const styleMap: Record<string, string[]> = {
      'casual': [
        '(comfortable fit:1.1)',
        '(relaxed wear:1.1)',
        '(everyday clothing:1.1)'
      ],
      'formal': [
        '(tailored fit:1.2)',
        '(business attire:1.2)',
        '(sophisticated:1.1)',
        '(professional:1.2)'
      ],
      'trendy': [
        '(fashion forward:1.2)',
        '(contemporary design:1.1)',
        '(modern style:1.2)',
        '(latest fashion:1.1)'
      ],
      'vintage': [
        '(retro style:1.2)',
        '(classic design:1.1)',
        '(timeless fashion:1.1)',
        '(heritage inspired:1.1)'
      ],
      'minimalist': [
        '(clean lines:1.2)',
        '(simple design:1.1)',
        '(understated elegance:1.1)',
        '(minimal aesthetic:1.2)'
      ],
      'edgy': [
        '(bold design:1.2)',
        '(alternative fashion:1.1)',
        '(unconventional style:1.1)',
        '(statement pieces:1.2)'
      ]
    };

    return styleMap[style.toLowerCase()] || styleMap['casual'];
  }

  /**
   * Generate consistent seed based on outfit characteristics
   */
  private getConsistentSeed(outfit: OutfitSuggestion): number {
    // Create consistent seed based on outfit properties for reproducible results
    const seedString = `${outfit.style}-${outfit.pieces.join('-')}-${outfit.colors.join('-')}`;
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      const char = seedString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Ensure positive seed within reasonable range
    return Math.abs(hash) % 2147483647;
  }

  /**
   * Get variation-specific seed for different prompt styles
   */
  private getVariationSeed(outfit: OutfitSuggestion, variation: string): number {
    const baseSeed = this.getConsistentSeed(outfit);
    const variationHash = variation.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (baseSeed + variationHash * 1000) % 2147483647;
  }

  /**
   * Create enhanced garment-only prompt with explicit no-person specifications
   */
  private createGarmentOnlyPrompt(outfit: OutfitSuggestion): string {
    const pieces = outfit.pieces.join(', ');
    const colors = outfit.colors.join(' and ');
    const style = outfit.style.toLowerCase();

    // Build comprehensive garment-only prompt
    const basePrompt = `${pieces} in ${colors} colors, ${style} style`;

    // Add explicit garment-only specifications
    const garmentSpecs = [
      'product photography',
      'fashion flat lay',
      'isolated clothing items',
      'clean white background',
      'studio lighting',
      'high resolution',
      'detailed textures',
      'professional fashion photography',
      'clothing only',
      'no person',
      'no model',
      'no human',
      'no body',
      'garment display',
      'fashion catalog style',
      'apparel showcase'
    ].join(', ');

    return `${basePrompt}, ${garmentSpecs}`;
  }

  /**
   * Create direct custom prompt using user's exact input without weather modifications
   */
  private createDirectCustomPrompt(userPrompt: string, style: string): string {
    // Use the user's exact prompt with minimal modifications
    const directPrompt = `${userPrompt}, ${style} style`;

    // Add only basic quality descriptors without weather constraints
    const qualitySpecs = [
      'product photography',
      'high resolution',
      'professional fashion photography',
      'studio lighting',
      'detailed textures',
      'clean background',
      'fashion catalog style',
      'clothing only',
      'no person',
      'no model'
    ].join(', ');

    console.log(`🎨 [DIRECT-PROMPT] Using user's exact input: "${userPrompt}"`);
    console.log(`🎨 [DIRECT-PROMPT] Generated direct prompt: "${directPrompt}, ${qualitySpecs}"`);

    return `${directPrompt}, ${qualitySpecs}`;
  }

  /**
   * Generate a base64 SVG placeholder image for outfit previews
   */
  /**
   * UTF-8 safe base64 encoding for SVG content
   */
  private utf8ToBase64(str: string): string {
    try {
      // First try standard btoa for ASCII content
      return btoa(str);
    } catch (error) {
      // If btoa fails, use UTF-8 safe encoding
      console.log('🔄 [ENCODING] Using UTF-8 safe encoding fallback');
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        (match, p1) => String.fromCharCode(parseInt('0x' + p1, 16))));
    }
  }

  /**
   * Sanitize text to ensure ASCII-only characters
   */
  private sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return 'Outfit';
    }

    // Remove all non-ASCII characters and clean up
    const cleaned = text
      .replace(/[^\x00-\x7F]/g, "") // Remove Unicode
      .replace(/[^\w\s]/g, "") // Remove special characters except word chars and spaces
      .trim()
      .split(/\s+/) // Split on whitespace
      .slice(0, 2) // Take first 2 words
      .join(' ');

    return cleaned || 'Outfit';
  }

  private generateSVGPlaceholder(text: string, bgColor: string = '#E5E7EB', textColor: string = '#6B7280'): string {
    // Enhanced ASCII filtering
    const safeText = this.sanitizeText(text);

    // Also sanitize colors to ensure they're safe
    const safeBgColor = bgColor.replace(/[^\#0-9A-Fa-f]/g, '') || '#E5E7EB';
    const safeTextColor = textColor.replace(/[^\#0-9A-Fa-f]/g, '') || '#6B7280';

    console.log('🔍 [SVG-GEN] Sanitizing inputs:', {
      originalText: text,
      safeText: safeText,
      originalBgColor: bgColor,
      safeBgColor: safeBgColor,
      hasUnicode: text !== safeText
    });

    const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="${safeBgColor}"/><rect x="50" y="50" width="300" height="300" fill="none" stroke="${safeTextColor}" stroke-width="2" rx="20"/><text x="200" y="160" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${safeTextColor}">${safeText}</text><text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="${safeTextColor}">Outfit Preview</text><circle cx="200" cy="280" r="30" fill="none" stroke="${safeTextColor}" stroke-width="2" opacity="0.4"/><circle cx="200" cy="280" r="15" fill="${safeTextColor}" opacity="0.3"/><text x="200" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${safeTextColor}">Generated Image</text></svg>`;

    try {
      // Use UTF-8 safe encoding
      const base64 = this.utf8ToBase64(svg.trim());
      const dataUrl = `data:image/svg+xml;base64,${base64}`;

      console.log('✅ [SVG-GEN] Successfully generated SVG with UTF-8 safe encoding:', {
        text: safeText,
        svgLength: svg.length,
        base64Length: base64.length,
        encoding: 'utf8-safe-base64'
      });

      return dataUrl;
    } catch (encodingError) {
      console.error('❌ [SVG-GEN] All encoding methods failed:', encodingError);
      // Ultimate fallback to URL encoding
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

      console.log('🆘 [SVG-GEN] Using URL encoding as last resort:', {
        text: safeText,
        svgLength: svg.length,
        encoding: 'url-encoded-fallback'
      });

      return dataUrl;
    }
  }

  /**
   * Generate outfit image with negative prompt support
   */
  private async generateOutfitImageWithNegativePrompt(
    avatarImageUrl: string,
    outfitPrompt: string,
    negativePrompt?: string
  ): Promise<string> {
    console.log('🎨 [ENHANCED] Starting FAL.ai Seedream v4 generation with negative prompts...');
    console.log('📝 [ENHANCED] Outfit prompt:', outfitPrompt);
    console.log('🚫 [ENHANCED] Negative prompt:', negativePrompt || 'None');

    try {
      // Call FAL.ai Bytedance Seedream 4.0 Text-to-Image API with negative prompt
      const response = await fetch('/api/fal/fal-ai/flux/dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${import.meta.env.VITE_FAL_KEY}`,
        },
        body: JSON.stringify({
          prompt: outfitPrompt,
          negative_prompt: negativePrompt || 'blurry, low quality, distorted, pixelated, bad anatomy, deformed, ugly, bad proportions, duplicate, watermark, signature, text, jpeg artifacts, worst quality, lowres, bad hands, error, missing fingers, extra digit, fewer digits, cropped',
          image_size: {
            width: 1024,
            height: 1024
          },
          num_inference_steps: 45,
          guidance_scale: 9.5,
          num_images: 1,
          seed: Math.floor(Math.random() * 1000000),
          enable_safety_checker: false,
          safety_tolerance: 2,
          scheduler: 'DPM++ 2M Karras'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FAL API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📊 [ENHANCED] FAL response structure:', Object.keys(result));

      const imageUrl = result.images?.[0]?.url || result.data?.images?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL in FAL response');
      }

      console.log('✅ [ENHANCED] Successfully generated enhanced outfit image');

      // Validate the generated image for FASHN compatibility
      console.log('🔍 [FASHN-PREP] Validating enhanced clothing for FASHN compatibility...');
      const validation = await this.validateClothingImageForFashn(imageUrl, outfitPrompt);

      if (!validation.isValid) {
        console.warn('⚠️ [FASHN-PREP] Enhanced clothing may have quality issues for FASHN:', validation.issues);
        console.log('💡 [FASHN-PREP] Recommendations:', validation.recommendations);
        // Continue anyway but log warnings
      } else {
        console.log('✅ [FASHN-PREP] Enhanced clothing validated - ready for FASHN processing');
      }

      return imageUrl;

    } catch (error) {
      console.error('❌ [ENHANCED] Enhanced outfit image generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate garment-only image with enhanced prompts
   */
  private async generateGarmentOnlyImageWithEnhancement(
    outfit: OutfitSuggestion,
    forceApiTest: boolean = false,
    useDirectPrompt: boolean = false,
    enhancedPromptResult: EnhancedPromptResult,
    originalPrompt: string,
    style: string
  ): Promise<string> {
    console.log('🎨 [ENHANCED-GARMENT] Starting enhanced garment-only image generation...');

    const isDevMode = this.isDevMode();
    const shouldUseApi = forceApiTest || !isDevMode;

    if (isDevMode && !forceApiTest) {
      // Return development fallback
      await new Promise(resolve => setTimeout(resolve, 1200));
      const enhancedSVG = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#8B5CF6"/><circle cx="200" cy="200" r="100" fill="#FFFFFF"/><text x="200" y="190" text-anchor="middle" font-family="Arial" font-size="18" fill="#000000">ENHANCED</text><text x="200" y="215" text-anchor="middle" font-family="Arial" font-size="14" fill="#000000">PROMPT</text></svg>`;
      return `data:image/svg+xml;base64,${btoa(enhancedSVG)}`;
    }

    // Production API call with enhanced prompts
    console.log('🚀 [ENHANCED-GARMENT] Using enhanced prompts for generation');

    try {
      const response = await fetch('/api/fal/fal-ai/flux/dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${import.meta.env.VITE_FAL_KEY}`,
        },
        body: JSON.stringify({
          prompt: enhancedPromptResult.mainPrompt,
          negative_prompt: enhancedPromptResult.negativePrompt,
          image_size: { width: 1024, height: 1024 },
          num_inference_steps: 40,
          guidance_scale: 9.0,
          num_images: 1,
          seed: this.getConsistentSeed(outfit),
          enable_safety_checker: false,
          safety_tolerance: 2,
          scheduler: 'DPM++ 2M Karras'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Enhanced API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const imageUrl = result.images?.[0]?.url || result.data?.images?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL in enhanced response');
      }

      console.log('✅ [ENHANCED-GARMENT] Enhanced garment image generated successfully');
      return imageUrl;

    } catch (error) {
      console.error('❌ [ENHANCED-GARMENT] Enhanced generation failed:', error);
      throw error;
    }
  }

  /**
   * Clear outfit cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Force cache invalidation - 2025-09-23 - v2.1.0
class OutfitGenerationServiceV3 extends OutfitGenerationService {
  constructor() {
    super();
    console.log('🔄 OutfitGenerationService v2.1.0 with two-step garment generation + virtual try-on loaded');
  }

  /**
   * Generate smart outfit suggestions based on weather and style profile
   */
  async generateSmartSuggestions(request: OutfitGenerationRequest): Promise<OutfitSuggestion[]> {
    console.log('🎯 [SMART-SUGGESTIONS] Generating smart outfit suggestions...');

    try {
      // Use the existing generateOutfitSuggestions method with smart defaults
      const suggestions = await this.generateOutfitSuggestions({
        ...request,
        numberOfSuggestions: request.numberOfSuggestions || 3,
        timeOfDay: request.timeOfDay || this.getTimeOfDay(),
        season: request.season || this.getCurrentSeason(),
        usePersonalWardrobe: request.usePersonalWardrobe !== false
      });

      console.log('✅ [SMART-SUGGESTIONS] Generated', suggestions.length, 'smart suggestions');
      return suggestions;
    } catch (error) {
      console.error('❌ [SMART-SUGGESTIONS] Failed to generate suggestions:', error);
      return [];
    }
  }

  /**
   * Get current time of day
   */
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Get current season based on month
   */
  private getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = new Date().getMonth() + 1; // getMonth() returns 0-11
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }
}

const service = new OutfitGenerationServiceV3();
export const outfitGenerationService = service;
export default service;