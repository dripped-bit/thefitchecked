/**
 * Enhanced Virtual Closet Service
 * Features: categorized outfits, wishlist price monitoring, real clothing integration,
 * smart outfit combinations using recommendation algorithm
 */

import { userDataService, WishlistItem } from './userDataService';
import { personalizedFashionService } from './personalizedFashionService';
import { weatherService } from './weatherService';
import type { ClothingItem } from '../types';

export interface OutfitCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  tags: string[];
}

export interface SavedOutfit {
  id: string;
  name: string;
  items: ClothingItem[];
  imageUrl?: string;
  category: string;
  occasion: string;
  season: string[];
  weather: string[];
  lastWorn?: string;
  wearCount: number;
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isGenerated: boolean; // true if AI-generated, false if user-created
}

export interface ClothingItemWithMetadata extends ClothingItem {
  // Enhanced metadata
  purchaseInfo?: {
    store: string;
    price: number;
    date: string;
    receipt?: string;
  };
  usage: {
    timesWorn: number;
    lastWorn?: string;
    averageRating: number;
    outfitsIncluded: string[]; // outfit IDs
  };
  care: {
    washInstructions?: string;
    lastCleaned?: string;
    condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
    notes?: string;
  };
  fit: {
    actualSize?: string;
    fitRating: 'tight' | 'perfect' | 'loose';
    alterations?: string;
  };
  photos: string[]; // multiple angles/styles
  aiAnalysis?: {
    extractedColors: string[];
    detectedStyle: string[];
    versatilityScore: number;
    seasonality: string[];
  };
}

export interface WishlistItemWithPriceHistory extends WishlistItem {
  priceHistory: {
    price: number;
    date: string;
    store: string;
  }[];
  currentPrice: number;
  lowestPrice: number;
  priceAlerts: {
    enabled: boolean;
    targetPrice?: number;
    percentageOff?: number;
  };
  availability: {
    inStock: boolean;
    lastChecked: string;
    sizes: string[];
  };
  similarItems: {
    id: string;
    name: string;
    price: number;
    store: string;
    similarity: number;
  }[];
}

export interface OutfitCombination {
  id: string;
  name: string;
  items: ClothingItemWithMetadata[];
  score: number;
  reasoning: string[];
  occasion: string;
  weather: string;
  style: string;
  missingPieces?: {
    type: string;
    suggestions: WishlistItemWithPriceHistory[];
  }[];
  generatedAt: string;
}

export interface ClosetAnalytics {
  totalItems: number;
  totalValue: number;
  averageItemValue: number;
  categoryBreakdown: { [category: string]: number };
  colorAnalysis: { [color: string]: number };
  brandAnalysis: { [brand: string]: number };
  seasonalGaps: string[];
  occasionGaps: string[];
  utilizationRate: number; // percentage of items worn in last 30 days
  topPerformingItems: ClothingItemWithMetadata[];
  underutilizedItems: ClothingItemWithMetadata[];
  styleConsistency: number; // how consistent the closet style is
}

class EnhancedClosetService {
  private readonly OUTFIT_CATEGORIES: OutfitCategory[] = [
    {
      id: 'work_professional',
      name: 'Work Professional',
      description: 'Business formal and business casual outfits',
      color: '#2563eb',
      icon: '💼',
      tags: ['work', 'professional', 'business', 'formal']
    },
    {
      id: 'casual_everyday',
      name: 'Casual Everyday',
      description: 'Comfortable daily wear and weekend outfits',
      color: '#059669',
      icon: '👕',
      tags: ['casual', 'comfortable', 'everyday', 'weekend']
    },
    {
      id: 'date_night',
      name: 'Date Night',
      description: 'Romantic and dressy casual outfits',
      color: '#dc2626',
      icon: '💕',
      tags: ['date', 'romantic', 'dressy', 'evening']
    },
    {
      id: 'party_events',
      name: 'Party & Events',
      description: 'Special occasions, parties, and celebrations',
      color: '#7c3aed',
      icon: '🎉',
      tags: ['party', 'events', 'celebration', 'special']
    },
    {
      id: 'athletic_active',
      name: 'Athletic & Active',
      description: 'Workout gear and activewear',
      color: '#ea580c',
      icon: '🏃‍♀️',
      tags: ['athletic', 'workout', 'active', 'sports']
    },
    {
      id: 'travel_vacation',
      name: 'Travel & Vacation',
      description: 'Travel-friendly and vacation outfits',
      color: '#0891b2',
      icon: '✈️',
      tags: ['travel', 'vacation', 'versatile', 'packable']
    },
    {
      id: 'seasonal_weather',
      name: 'Seasonal & Weather',
      description: 'Weather-specific and seasonal outfits',
      color: '#65a30d',
      icon: '🌦️',
      tags: ['seasonal', 'weather', 'layering', 'climate']
    }
  ];

  /**
   * Save an outfit to the virtual closet
   */
  async saveOutfit(
    name: string,
    items: ClothingItem[],
    categoryId: string,
    occasion: string,
    imageUrl?: string,
    isGenerated: boolean = false
  ): Promise<SavedOutfit> {
    const outfit: SavedOutfit = {
      id: this.generateOutfitId(),
      name,
      items,
      imageUrl,
      category: categoryId,
      occasion,
      season: this.detectSeasonality(items),
      weather: this.detectWeatherSuitability(items),
      wearCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: this.generateTags(items, occasion),
      isGenerated
    };

    // Save to user data
    const userData = userDataService.getAllUserData();
    if (userData) {
      if (!userData.savedOutfits) userData.savedOutfits = [];
      userData.savedOutfits.push(outfit);

      // Track interaction
      userDataService.trackInteraction('outfit_save', {
        outfitId: outfit.id,
        category: categoryId,
        occasion,
        itemCount: items.length,
        isGenerated
      });
    }

    console.log(`💾 [CLOSET] Saved outfit: ${name}`);
    return outfit;
  }

  /**
   * Get all saved outfits with filtering options
   */
  getSavedOutfits(filters?: {
    category?: string;
    occasion?: string;
    season?: string;
    weather?: string;
    tags?: string[];
  }): SavedOutfit[] {
    const userData = userDataService.getAllUserData();
    if (!userData?.savedOutfits) return [];

    let outfits = userData.savedOutfits;

    if (filters) {
      if (filters.category) {
        outfits = outfits.filter(o => o.category === filters.category);
      }
      if (filters.occasion) {
        outfits = outfits.filter(o => o.occasion === filters.occasion);
      }
      if (filters.season) {
        outfits = outfits.filter(o => o.season.includes(filters.season));
      }
      if (filters.weather) {
        outfits = outfits.filter(o => o.weather.includes(filters.weather));
      }
      if (filters.tags) {
        outfits = outfits.filter(o =>
          filters.tags!.some(tag => o.tags.includes(tag))
        );
      }
    }

    return outfits.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Generate smart outfit combinations from existing closet items
   */
  async generateOutfitCombinations(
    targetOccasion?: string,
    maxCombinations: number = 5
  ): Promise<OutfitCombination[]> {
    console.log('🧠 [CLOSET] Generating smart outfit combinations...');

    const userData = userDataService.getAllUserData();
    if (!userData?.closet || userData.closet.length === 0) {
      return [];
    }

    const weather = await weatherService.getCurrentWeather();
    const weatherConditions = weatherService.analyzeWeatherConditions(weather);
    const recommendations = userDataService.getPersonalizedRecommendations();

    const combinations: OutfitCombination[] = [];
    const closetItems = userData.closet as ClothingItemWithMetadata[];

    // Group items by type
    const itemsByType = this.groupItemsByType(closetItems);

    // Generate combinations based on outfit rules
    for (let i = 0; i < maxCombinations * 3; i++) { // Generate more to filter the best
      const combination = this.generateSingleCombination(
        itemsByType,
        weatherConditions,
        recommendations,
        targetOccasion
      );

      if (combination && combination.score > 0.6) {
        combinations.push(combination);
      }

      if (combinations.length >= maxCombinations) break;
    }

    // Sort by score and return top combinations
    return combinations
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCombinations);
  }

  /**
   * Generate a single outfit combination
   */
  private generateSingleCombination(
    itemsByType: { [type: string]: ClothingItemWithMetadata[] },
    weatherConditions: any,
    recommendations: any,
    targetOccasion?: string
  ): OutfitCombination | null {
    const combination: ClothingItemWithMetadata[] = [];
    let score = 0.5;
    const reasoning: string[] = [];

    // Start with a top (required)
    const tops = itemsByType.tops || itemsByType.shirts || [];
    if (tops.length === 0) return null;

    const selectedTop = this.selectRandomItem(tops, recommendations);
    combination.push(selectedTop);
    reasoning.push(`Selected ${selectedTop.name} as the foundation piece`);

    // Add bottom (required for most outfits)
    const bottoms = [...(itemsByType.pants || []), ...(itemsByType.skirts || [])];
    if (bottoms.length > 0) {
      const selectedBottom = this.selectRandomItem(bottoms, recommendations);
      combination.push(selectedBottom);
      reasoning.push(`Paired with ${selectedBottom.name} for a complete look`);
    }

    // Add shoes if available
    const shoes = itemsByType.shoes || [];
    if (shoes.length > 0) {
      const selectedShoes = this.selectRandomItem(shoes, recommendations);
      combination.push(selectedShoes);
      reasoning.push(`Completed with ${selectedShoes.name}`);
    }

    // Add weather-appropriate layers
    if (weatherConditions.temperature === 'cold' || weatherConditions.temperature === 'cool') {
      const outerwear = [...(itemsByType.jackets || []), ...(itemsByType.coats || [])];
      if (outerwear.length > 0) {
        const selectedOuterwear = this.selectRandomItem(outerwear, recommendations);
        combination.push(selectedOuterwear);
        reasoning.push(`Added ${selectedOuterwear.name} for warmth`);
        score += 0.1;
      }
    }

    // Add accessories for style
    const accessories = [...(itemsByType.accessories || []), ...(itemsByType.jewelry || [])];
    if (accessories.length > 0 && Math.random() > 0.5) {
      const selectedAccessory = this.selectRandomItem(accessories, recommendations);
      combination.push(selectedAccessory);
      reasoning.push(`Enhanced with ${selectedAccessory.name} for style`);
      score += 0.05;
    }

    // Calculate combination score
    score += this.calculateCombinationScore(combination, recommendations, weatherConditions);

    const occasion = targetOccasion || this.detectOccasion(combination);
    const style = this.detectStyle(combination);

    return {
      id: this.generateCombinationId(),
      name: this.generateCombinationName(combination, occasion),
      items: combination,
      score,
      reasoning,
      occasion,
      weather: `${weatherConditions.temperature} ${weatherConditions.overall}`,
      style,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Group closet items by type
   */
  private groupItemsByType(items: ClothingItemWithMetadata[]): { [type: string]: ClothingItemWithMetadata[] } {
    const grouped: { [type: string]: ClothingItemWithMetadata[] } = {};

    items.forEach(item => {
      const type = item.type || item.category || 'misc';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(item);
    });

    return grouped;
  }

  /**
   * Select item based on recommendations and usage
   */
  private selectRandomItem(items: ClothingItemWithMetadata[], recommendations: any): ClothingItemWithMetadata {
    // Prefer items that match user preferences
    const preferredItems = items.filter(item =>
      recommendations.preferredColors.some((color: string) =>
        item.color?.toLowerCase().includes(color.toLowerCase())
      ) ||
      recommendations.preferredStyles.some((style: string) =>
        item.style?.toLowerCase().includes(style.toLowerCase())
      )
    );

    const candidateItems = preferredItems.length > 0 ? preferredItems : items;

    // Prefer less-worn items to increase utilization
    const sortedByUsage = candidateItems.sort((a, b) =>
      (a.usage?.timesWorn || 0) - (b.usage?.timesWorn || 0)
    );

    // Select from top 3 least-worn items
    const topCandidates = sortedByUsage.slice(0, Math.min(3, sortedByUsage.length));
    return topCandidates[Math.floor(Math.random() * topCandidates.length)];
  }

  /**
   * Calculate outfit combination score
   */
  private calculateCombinationScore(
    items: ClothingItemWithMetadata[],
    recommendations: any,
    weatherConditions: any
  ): number {
    let score = 0;

    // Color coordination (20%)
    score += this.calculateColorHarmony(items) * 0.2;

    // Style consistency (25%)
    score += this.calculateStyleConsistency(items) * 0.25;

    // Weather appropriateness (20%)
    score += this.calculateWeatherAppropriatenessScore(items, weatherConditions) * 0.2;

    // Personal preference alignment (25%)
    score += this.calculatePersonalPreferenceScore(items, recommendations) * 0.25;

    // Versatility bonus (10%)
    score += this.calculateVersatilityScore(items) * 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Calculate color harmony score
   */
  private calculateColorHarmony(items: ClothingItemWithMetadata[]): number {
    const colors = items.map(item => item.color?.toLowerCase()).filter(Boolean);
    if (colors.length < 2) return 0.7;

    // Simple color harmony rules
    const neutralColors = ['black', 'white', 'gray', 'grey', 'beige', 'navy'];
    const neutralCount = colors.filter(color =>
      neutralColors.some(neutral => color.includes(neutral))
    ).length;

    // High score for neutral-based combinations
    if (neutralCount >= colors.length - 1) return 0.9;

    // Medium score for similar color families
    const colorFamilies = this.groupColorsByFamily(colors);
    if (colorFamilies.size <= 2) return 0.7;

    return 0.5;
  }

  /**
   * Group colors by family for harmony analysis
   */
  private groupColorsByFamily(colors: string[]): Set<string> {
    const families = new Set<string>();

    colors.forEach(color => {
      if (['red', 'pink', 'burgundy', 'maroon'].some(c => color.includes(c))) {
        families.add('red');
      } else if (['blue', 'navy', 'teal', 'turquoise'].some(c => color.includes(c))) {
        families.add('blue');
      } else if (['green', 'olive', 'emerald'].some(c => color.includes(c))) {
        families.add('green');
      } else if (['yellow', 'gold', 'mustard'].some(c => color.includes(c))) {
        families.add('yellow');
      } else if (['purple', 'violet', 'lavender'].some(c => color.includes(c))) {
        families.add('purple');
      } else if (['orange', 'coral', 'peach'].some(c => color.includes(c))) {
        families.add('orange');
      } else {
        families.add('neutral');
      }
    });

    return families;
  }

  /**
   * Calculate style consistency score
   */
  private calculateStyleConsistency(items: ClothingItemWithMetadata[]): number {
    const styles = items.map(item => item.style?.toLowerCase()).filter(Boolean);
    if (styles.length === 0) return 0.5;

    // Count style overlap
    const styleMap = new Map<string, number>();
    styles.forEach(style => {
      styleMap.set(style, (styleMap.get(style) || 0) + 1);
    });

    const dominantStyleCount = Math.max(...styleMap.values());
    return dominantStyleCount / styles.length;
  }

  /**
   * Calculate weather appropriateness score
   */
  private calculateWeatherAppropriatenessScore(
    items: ClothingItemWithMetadata[],
    weatherConditions: any
  ): number {
    let score = 0.5;

    const hasOuterwear = items.some(item =>
      ['jacket', 'coat', 'cardigan', 'sweater'].some(type =>
        item.type?.toLowerCase().includes(type)
      )
    );

    const hasLightClothing = items.some(item =>
      ['tank', 'shorts', 'sandals', 't-shirt'].some(type =>
        item.type?.toLowerCase().includes(type)
      )
    );

    // Temperature appropriateness
    if (weatherConditions.temperature === 'hot' || weatherConditions.temperature === 'warm') {
      score += hasLightClothing ? 0.3 : -0.2;
      score += hasOuterwear ? -0.2 : 0.1;
    } else if (weatherConditions.temperature === 'cold' || weatherConditions.temperature === 'cool') {
      score += hasOuterwear ? 0.3 : -0.2;
      score += hasLightClothing ? -0.2 : 0.1;
    }

    // Precipitation appropriateness
    if (weatherConditions.precipitation !== 'none') {
      const hasWaterResistant = items.some(item =>
        item.material?.toLowerCase().includes('waterproof') ||
        item.material?.toLowerCase().includes('water-resistant')
      );
      score += hasWaterResistant ? 0.2 : 0;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate personal preference alignment score
   */
  private calculatePersonalPreferenceScore(
    items: ClothingItemWithMetadata[],
    recommendations: any
  ): number {
    let score = 0.5;
    let matchCount = 0;

    items.forEach(item => {
      // Check color preferences
      if (recommendations.preferredColors.some((color: string) =>
        item.color?.toLowerCase().includes(color.toLowerCase())
      )) {
        score += 0.1;
        matchCount++;
      }

      // Check style preferences
      if (recommendations.preferredStyles.some((style: string) =>
        item.style?.toLowerCase().includes(style.toLowerCase())
      )) {
        score += 0.1;
        matchCount++;
      }

      // Avoid disliked items
      if (recommendations.avoidedItems.some((avoided: string) =>
        item.style?.toLowerCase().includes(avoided.toLowerCase()) ||
        item.color?.toLowerCase().includes(avoided.toLowerCase())
      )) {
        score -= 0.2;
      }
    });

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate versatility score
   */
  private calculateVersatilityScore(items: ClothingItemWithMetadata[]): number {
    let score = 0.5;

    // Basic pieces get higher versatility scores
    items.forEach(item => {
      if (item.aiAnalysis?.versatilityScore) {
        score += item.aiAnalysis.versatilityScore * 0.1;
      } else {
        // Simple heuristic for versatility
        const versatilePieces = ['jeans', 'white shirt', 'black pants', 'blazer', 'little black dress'];
        const isVersatile = versatilePieces.some(piece =>
          item.name?.toLowerCase().includes(piece)
        );
        score += isVersatile ? 0.1 : 0;
      }
    });

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Detect seasonality from items
   */
  private detectSeasonality(items: ClothingItem[]): string[] {
    const seasons: string[] = [];

    items.forEach(item => {
      const name = item.name?.toLowerCase() || '';
      const type = item.type?.toLowerCase() || '';

      if (['coat', 'sweater', 'boots', 'scarf'].some(winter => name.includes(winter) || type.includes(winter))) {
        if (!seasons.includes('winter')) seasons.push('winter');
      }
      if (['shorts', 'tank', 'sandals', 'sundress'].some(summer => name.includes(summer) || type.includes(summer))) {
        if (!seasons.includes('summer')) seasons.push('summer');
      }
      if (['jacket', 'cardigan', 'jeans'].some(fall => name.includes(fall) || type.includes(fall))) {
        if (!seasons.includes('fall')) seasons.push('fall');
        if (!seasons.includes('spring')) seasons.push('spring');
      }
    });

    return seasons.length > 0 ? seasons : ['year-round'];
  }

  /**
   * Detect weather suitability
   */
  private detectWeatherSuitability(items: ClothingItem[]): string[] {
    const weather: string[] = [];

    items.forEach(item => {
      const name = item.name?.toLowerCase() || '';
      const material = item.material?.toLowerCase() || '';

      if (['rain', 'waterproof', 'umbrella'].some(rain => name.includes(rain) || material.includes(rain))) {
        if (!weather.includes('rainy')) weather.push('rainy');
      }
      if (['heavy', 'thick', 'wool', 'down'].some(warm => material.includes(warm))) {
        if (!weather.includes('cold')) weather.push('cold');
      }
      if (['light', 'cotton', 'linen', 'breathable'].some(cool => material.includes(cool))) {
        if (!weather.includes('warm')) weather.push('warm');
      }
    });

    return weather.length > 0 ? weather : ['mild'];
  }

  /**
   * Generate tags for outfit
   */
  private generateTags(items: ClothingItem[], occasion: string): string[] {
    const tags = new Set<string>();

    tags.add(occasion);

    items.forEach(item => {
      if (item.color) tags.add(item.color.toLowerCase());
      if (item.style) tags.add(item.style.toLowerCase());
      if (item.brand) tags.add(item.brand.toLowerCase());
    });

    return Array.from(tags);
  }

  /**
   * Detect occasion from combination
   */
  private detectOccasion(items: ClothingItemWithMetadata[]): string {
    const formalItems = items.filter(item =>
      ['suit', 'dress', 'heels', 'blazer', 'tie'].some(formal =>
        item.name?.toLowerCase().includes(formal) || item.type?.toLowerCase().includes(formal)
      )
    );

    const casualItems = items.filter(item =>
      ['jeans', 'sneakers', 't-shirt', 'hoodie'].some(casual =>
        item.name?.toLowerCase().includes(casual) || item.type?.toLowerCase().includes(casual)
      )
    );

    if (formalItems.length > casualItems.length) return 'formal';
    if (casualItems.length > 0) return 'casual';
    return 'business_casual';
  }

  /**
   * Detect style from combination
   */
  private detectStyle(items: ClothingItemWithMetadata[]): string {
    const styles = items.map(item => item.style).filter(Boolean);
    const styleCount = new Map<string, number>();

    styles.forEach(style => {
      styleCount.set(style, (styleCount.get(style) || 0) + 1);
    });

    if (styleCount.size === 0) return 'mixed';

    const dominantStyle = Array.from(styleCount.entries())
      .sort(([,a], [,b]) => b - a)[0][0];

    return dominantStyle;
  }

  /**
   * Generate combination name
   */
  private generateCombinationName(items: ClothingItemWithMetadata[], occasion: string): string {
    const adjectives = ['Chic', 'Elegant', 'Casual', 'Stylish', 'Modern', 'Classic', 'Trendy'];
    const occasions = {
      'formal': 'Professional',
      'casual': 'Weekend',
      'business_casual': 'Work',
      'date': 'Date Night',
      'party': 'Party'
    };

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const occasionName = occasions[occasion as keyof typeof occasions] || 'Daily';

    return `${adjective} ${occasionName} Look`;
  }

  /**
   * Monitor wishlist item prices
   */
  async monitorWishlistPrices(): Promise<WishlistItemWithPriceHistory[]> {
    console.log('💰 [CLOSET] Monitoring wishlist prices...');

    const userData = userDataService.getAllUserData();
    if (!userData?.wishlist) return [];

    const enhancedWishlist: WishlistItemWithPriceHistory[] = [];

    for (const item of userData.wishlist) {
      const enhanced: WishlistItemWithPriceHistory = {
        ...item,
        priceHistory: await this.fetchPriceHistory(item),
        currentPrice: item.price || 0,
        lowestPrice: 0,
        priceAlerts: {
          enabled: false
        },
        availability: {
          inStock: true,
          lastChecked: new Date().toISOString(),
          sizes: []
        },
        similarItems: []
      };

      // Calculate lowest price from history
      if (enhanced.priceHistory.length > 0) {
        enhanced.lowestPrice = Math.min(...enhanced.priceHistory.map(p => p.price));
      }

      enhancedWishlist.push(enhanced);
    }

    return enhancedWishlist;
  }

  /**
   * Fetch price history for an item (mock implementation)
   */
  private async fetchPriceHistory(item: WishlistItem): Promise<{ price: number; date: string; store: string }[]> {
    // In a real implementation, this would call price tracking APIs
    // For now, generate mock price history
    const history = [];
    const basePrice = item.price || 100;

    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const priceVariation = (Math.random() - 0.5) * 0.3; // ±15% variation
      const price = Math.round(basePrice * (1 + priceVariation));

      history.push({
        price,
        date: date.toISOString(),
        store: item.store || 'Unknown Store'
      });
    }

    return history;
  }

  /**
   * Analyze closet for insights and recommendations
   */
  analyzeCloset(): ClosetAnalytics {
    const userData = userDataService.getAllUserData();
    if (!userData?.closet) {
      return this.getEmptyAnalytics();
    }

    const items = userData.closet as ClothingItemWithMetadata[];

    const analytics: ClosetAnalytics = {
      totalItems: items.length,
      totalValue: this.calculateTotalValue(items),
      averageItemValue: 0,
      categoryBreakdown: this.calculateCategoryBreakdown(items),
      colorAnalysis: this.calculateColorAnalysis(items),
      brandAnalysis: this.calculateBrandAnalysis(items),
      seasonalGaps: this.identifySeasonalGaps(items),
      occasionGaps: this.identifyOccasionGaps(items),
      utilizationRate: this.calculateUtilizationRate(items),
      topPerformingItems: this.getTopPerformingItems(items),
      underutilizedItems: this.getUnderutilizedItems(items),
      styleConsistency: this.calculateOverallStyleConsistency(items)
    };

    analytics.averageItemValue = analytics.totalValue / Math.max(analytics.totalItems, 1);

    return analytics;
  }

  /**
   * Get outfit categories
   */
  getOutfitCategories(): OutfitCategory[] {
    return [...this.OUTFIT_CATEGORIES];
  }

  /**
   * Helper methods for analytics
   */
  private getEmptyAnalytics(): ClosetAnalytics {
    return {
      totalItems: 0,
      totalValue: 0,
      averageItemValue: 0,
      categoryBreakdown: {},
      colorAnalysis: {},
      brandAnalysis: {},
      seasonalGaps: [],
      occasionGaps: [],
      utilizationRate: 0,
      topPerformingItems: [],
      underutilizedItems: [],
      styleConsistency: 0
    };
  }

  private calculateTotalValue(items: ClothingItemWithMetadata[]): number {
    return items.reduce((total, item) => total + (item.purchaseInfo?.price || 0), 0);
  }

  private calculateCategoryBreakdown(items: ClothingItemWithMetadata[]): { [category: string]: number } {
    const breakdown: { [category: string]: number } = {};
    items.forEach(item => {
      const category = item.category || item.type || 'Other';
      breakdown[category] = (breakdown[category] || 0) + 1;
    });
    return breakdown;
  }

  private calculateColorAnalysis(items: ClothingItemWithMetadata[]): { [color: string]: number } {
    const analysis: { [color: string]: number } = {};
    items.forEach(item => {
      if (item.color) {
        analysis[item.color] = (analysis[item.color] || 0) + 1;
      }
    });
    return analysis;
  }

  private calculateBrandAnalysis(items: ClothingItemWithMetadata[]): { [brand: string]: number } {
    const analysis: { [brand: string]: number } = {};
    items.forEach(item => {
      if (item.brand) {
        analysis[item.brand] = (analysis[item.brand] || 0) + 1;
      }
    });
    return analysis;
  }

  private identifySeasonalGaps(items: ClothingItemWithMetadata[]): string[] {
    const gaps: string[] = [];
    const seasons = ['spring', 'summer', 'fall', 'winter'];

    seasons.forEach(season => {
      const seasonalItems = items.filter(item =>
        item.aiAnalysis?.seasonality?.includes(season)
      );
      if (seasonalItems.length < 3) {
        gaps.push(season);
      }
    });

    return gaps;
  }

  private identifyOccasionGaps(items: ClothingItemWithMetadata[]): string[] {
    const gaps: string[] = [];
    const occasions = ['work', 'casual', 'formal', 'party', 'athletic'];

    occasions.forEach(occasion => {
      const occasionItems = items.filter(item =>
        item.name?.toLowerCase().includes(occasion) ||
        item.type?.toLowerCase().includes(occasion)
      );
      if (occasionItems.length < 2) {
        gaps.push(occasion);
      }
    });

    return gaps;
  }

  private calculateUtilizationRate(items: ClothingItemWithMetadata[]): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyWornItems = items.filter(item =>
      item.usage?.lastWorn && new Date(item.usage.lastWorn) > thirtyDaysAgo
    );

    return items.length > 0 ? recentlyWornItems.length / items.length : 0;
  }

  private getTopPerformingItems(items: ClothingItemWithMetadata[]): ClothingItemWithMetadata[] {
    return items
      .filter(item => item.usage?.timesWorn > 0)
      .sort((a, b) => (b.usage?.timesWorn || 0) - (a.usage?.timesWorn || 0))
      .slice(0, 5);
  }

  private getUnderutilizedItems(items: ClothingItemWithMetadata[]): ClothingItemWithMetadata[] {
    return items
      .filter(item => (item.usage?.timesWorn || 0) < 2)
      .sort((a, b) => (a.usage?.timesWorn || 0) - (b.usage?.timesWorn || 0))
      .slice(0, 5);
  }

  private calculateOverallStyleConsistency(items: ClothingItemWithMetadata[]): number {
    const styles = items.map(item => item.style).filter(Boolean);
    if (styles.length === 0) return 0;

    const styleMap = new Map<string, number>();
    styles.forEach(style => {
      styleMap.set(style, (styleMap.get(style) || 0) + 1);
    });

    const dominantStyleCount = Math.max(...styleMap.values());
    return dominantStyleCount / styles.length;
  }

  /**
   * Generate unique IDs
   */
  private generateOutfitId(): string {
    return `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCombinationId(): string {
    return `combination_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Add savedOutfits to user data interface (extending existing)
declare module './userDataService' {
  interface CompleteUserData {
    savedOutfits?: SavedOutfit[];
  }
}

// Singleton instance
export const enhancedClosetService = new EnhancedClosetService();
export default enhancedClosetService;