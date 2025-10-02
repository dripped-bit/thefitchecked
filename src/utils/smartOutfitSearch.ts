/**
 * Smart Outfit Search Utility
 * Advanced search algorithms for outfit and wardrobe management
 */

export interface OutfitItem {
  id: string;
  name: string;
  category: string;
  primaryColor: string;
  secondaryColors?: string[];
  style: string;
  season: string[];
  occasion: string[];
  brand: string;
  price: number;
  timesWorn: number;
  dateAdded: Date;
  dateLastWorn?: Date;
  imageUrl: string;
  tags: string[];
  valueScore: number;
  weatherTags?: string[];
  materialTags?: string[];
  careInstructions?: string[];
  fit?: 'tight' | 'fitted' | 'regular' | 'loose' | 'oversized';
  condition?: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
}

export interface SearchFilters {
  categories: string[];
  colors: string[];
  styles: string[];
  seasons: string[];
  occasions: string[];
  brands: string[];
  priceRange: [number, number];
  timesWornRange?: [number, number];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags: string[];
  timesWorn?: 'never' | 'low' | 'medium' | 'high' | 'recent';
  valueScore?: [number, number];
  weatherCompatibility?: string[];
  fit?: string[];
  condition?: string[];
}

export interface WeatherConditions {
  temperature: number;
  conditions: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
  humidity?: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
}

export class SmartOutfitSearch {
  private items: OutfitItem[];

  constructor(items: OutfitItem[] = []) {
    this.items = items;
  }

  /**
   * Main search function with comprehensive filtering
   */
  search(query: string = '', filters: Partial<SearchFilters> = {}): OutfitItem[] {
    let results = [...this.items];

    // Text search
    if (query.trim()) {
      results = this.searchByText(results, query);
    }

    // Apply filters
    results = this.applyFilters(results, filters);

    return results;
  }

  /**
   * Search by text across multiple fields
   */
  private searchByText(items: OutfitItem[], query: string): OutfitItem[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    return items.filter(item => {
      const searchableText = [
        item.name,
        item.category,
        item.brand,
        item.style,
        item.primaryColor,
        ...(item.secondaryColors || []),
        ...(item.season || []),
        ...(item.occasion || []),
        ...(item.tags || []),
        ...(item.weatherTags || []),
        ...(item.materialTags || [])
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  /**
   * Apply comprehensive filters
   */
  private applyFilters(items: OutfitItem[], filters: Partial<SearchFilters>): OutfitItem[] {
    return items.filter(item => {
      // Category filter
      if (filters.categories?.length && !filters.categories.includes(item.category)) {
        return false;
      }

      // Color filter
      if (filters.colors?.length) {
        const itemColors = [item.primaryColor, ...(item.secondaryColors || [])];
        if (!filters.colors.some(color => itemColors.includes(color))) {
          return false;
        }
      }

      // Style filter
      if (filters.styles?.length && !filters.styles.includes(item.style)) {
        return false;
      }

      // Season filter
      if (filters.seasons?.length) {
        if (!filters.seasons.some(season => item.season.includes(season))) {
          return false;
        }
      }

      // Occasion filter
      if (filters.occasions?.length) {
        if (!filters.occasions.some(occasion => item.occasion.includes(occasion))) {
          return false;
        }
      }

      // Brand filter
      if (filters.brands?.length && !filters.brands.includes(item.brand)) {
        return false;
      }

      // Price range filter
      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        if (item.price < min || item.price > max) {
          return false;
        }
      }

      // Times worn filter
      if (filters.timesWorn) {
        if (!this.matchesWearFrequency(item, filters.timesWorn)) {
          return false;
        }
      }

      // Times worn range filter
      if (filters.timesWornRange) {
        const [min, max] = filters.timesWornRange;
        if (item.timesWorn < min || item.timesWorn > max) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        if (item.dateAdded < filters.dateRange.start || item.dateAdded > filters.dateRange.end) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags?.length) {
        if (!filters.tags.some(tag => item.tags.includes(tag))) {
          return false;
        }
      }

      // Value score filter
      if (filters.valueScore) {
        const [min, max] = filters.valueScore;
        if (item.valueScore < min || item.valueScore > max) {
          return false;
        }
      }

      // Weather compatibility filter
      if (filters.weatherCompatibility?.length) {
        if (!filters.weatherCompatibility.some(weather => item.weatherTags?.includes(weather))) {
          return false;
        }
      }

      // Fit filter
      if (filters.fit?.length && !filters.fit.includes(item.fit || '')) {
        return false;
      }

      // Condition filter
      if (filters.condition?.length && !filters.condition.includes(item.condition || '')) {
        return false;
      }

      return true;
    });
  }

  /**
   * Search by wearing frequency
   */
  searchByFrequency(threshold: 'never' | 'low' | 'medium' | 'high' | 'recent'): OutfitItem[] {
    return this.items.filter(item => this.matchesWearFrequency(item, threshold));
  }

  private matchesWearFrequency(item: OutfitItem, threshold: string): boolean {
    switch (threshold) {
      case 'never':
        return item.timesWorn === 0;
      case 'low':
        return item.timesWorn >= 1 && item.timesWorn <= 3;
      case 'medium':
        return item.timesWorn >= 4 && item.timesWorn <= 10;
      case 'high':
        return item.timesWorn > 10;
      case 'recent':
        if (!item.dateLastWorn) return false;
        const daysSinceWorn = (Date.now() - item.dateLastWorn.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceWorn <= 7;
      default:
        return true;
    }
  }

  /**
   * Search by cost-per-wear value
   */
  searchByValue(sortOrder: 'best' | 'worst' = 'best'): OutfitItem[] {
    return [...this.items].sort((a, b) => {
      const cpwA = a.price / Math.max(a.timesWorn, 1);
      const cpwB = b.price / Math.max(b.timesWorn, 1);
      return sortOrder === 'best' ? cpwA - cpwB : cpwB - cpwA;
    });
  }

  /**
   * Search by weather compatibility
   */
  searchByWeather(weather: WeatherConditions): OutfitItem[] {
    return this.items.filter(item => {
      if (!item.weatherTags) return true;

      // Temperature-based filtering
      const tempCompatible = this.isTemperatureCompatible(item, weather.temperature);
      if (!tempCompatible) return false;

      // Condition-based filtering
      const conditionCompatible = this.isConditionCompatible(item, weather.conditions);
      if (!conditionCompatible) return false;

      // Season compatibility
      const seasonCompatible = item.season.includes(weather.season);

      return seasonCompatible;
    });
  }

  private isTemperatureCompatible(item: OutfitItem, temperature: number): boolean {
    if (!item.weatherTags) return true;

    if (temperature < 40) {
      return item.weatherTags.some(tag => ['cold', 'winter', 'warm', 'insulated'].includes(tag));
    } else if (temperature < 60) {
      return item.weatherTags.some(tag => ['cool', 'layering', 'transitional'].includes(tag));
    } else if (temperature < 80) {
      return item.weatherTags.some(tag => ['mild', 'comfortable', 'versatile'].includes(tag));
    } else {
      return item.weatherTags.some(tag => ['hot', 'summer', 'breathable', 'lightweight'].includes(tag));
    }
  }

  private isConditionCompatible(item: OutfitItem, conditions: string): boolean {
    if (!item.weatherTags) return true;

    switch (conditions) {
      case 'rainy':
        return item.weatherTags.some(tag => ['waterproof', 'water-resistant', 'rain'].includes(tag));
      case 'windy':
        return item.weatherTags.some(tag => ['wind-resistant', 'fitted', 'secure'].includes(tag));
      case 'snowy':
        return item.weatherTags.some(tag => ['snow', 'waterproof', 'warm', 'insulated'].includes(tag));
      default:
        return true;
    }
  }

  /**
   * Find matching pieces for mix and match
   */
  findMatchingPieces(selectedItem: OutfitItem, maxResults: number = 10): OutfitItem[] {
    return this.items
      .filter(item => item.id !== selectedItem.id)
      .filter(item => {
        // Color compatibility
        const colorMatch = this.colorsComplement(selectedItem.primaryColor, item.primaryColor);

        // Style compatibility
        const styleMatch = this.stylesCompatible(selectedItem.style, item.style);

        // Occasion compatibility
        const occasionMatch = selectedItem.occasion.some(occ => item.occasion.includes(occ));

        // Season compatibility
        const seasonMatch = selectedItem.season.some(season => item.season.includes(season));

        // Category compatibility (don't match same categories)
        const categoryMatch = selectedItem.category !== item.category;

        return colorMatch && styleMatch && occasionMatch && seasonMatch && categoryMatch;
      })
      .sort((a, b) => this.calculateCompatibilityScore(selectedItem, b) - this.calculateCompatibilityScore(selectedItem, a))
      .slice(0, maxResults);
  }

  /**
   * Check if colors complement each other
   */
  private colorsComplement(color1: string, color2: string): boolean {
    const complementaryPairs = [
      ['Black', 'White'],
      ['Navy', 'White'],
      ['Gray', 'White'],
      ['Beige', 'Navy'],
      ['Brown', 'Cream'],
      ['Red', 'Black'],
      ['Blue', 'White'],
      ['Green', 'Beige']
    ];

    const neutrals = ['Black', 'White', 'Gray', 'Beige', 'Brown', 'Navy', 'Cream'];

    // Neutrals go with everything
    if (neutrals.includes(color1) || neutrals.includes(color2)) {
      return true;
    }

    // Check specific complementary pairs
    return complementaryPairs.some(pair =>
      (pair.includes(color1) && pair.includes(color2))
    );
  }

  /**
   * Check if styles are compatible
   */
  private stylesCompatible(style1: string, style2: string): boolean {
    const compatibleStyles = {
      'Casual': ['Smart Casual', 'Athleisure', 'Streetwear'],
      'Smart Casual': ['Casual', 'Business Casual'],
      'Business Casual': ['Smart Casual', 'Business Formal'],
      'Business Formal': ['Business Casual'],
      'Athleisure': ['Casual', 'Streetwear'],
      'Streetwear': ['Casual', 'Athleisure'],
      'Date Night': ['Smart Casual', 'Party'],
      'Party': ['Date Night', 'Festival'],
      'Festival': ['Party', 'Casual']
    };

    return style1 === style2 ||
           compatibleStyles[style1]?.includes(style2) ||
           compatibleStyles[style2]?.includes(style1);
  }

  /**
   * Calculate compatibility score between two items
   */
  private calculateCompatibilityScore(item1: OutfitItem, item2: OutfitItem): number {
    let score = 0;

    // Color compatibility
    if (this.colorsComplement(item1.primaryColor, item2.primaryColor)) score += 3;

    // Style compatibility
    if (this.stylesCompatible(item1.style, item2.style)) score += 2;

    // Occasion overlap
    const occasionOverlap = item1.occasion.filter(occ => item2.occasion.includes(occ)).length;
    score += occasionOverlap;

    // Season overlap
    const seasonOverlap = item1.season.filter(season => item2.season.includes(season)).length;
    score += seasonOverlap;

    // Brand synergy (same brand gets bonus)
    if (item1.brand === item2.brand) score += 1;

    // Value score consideration
    score += (item1.valueScore + item2.valueScore) / 20;

    return score;
  }

  /**
   * Get outfit recommendations based on user preferences and context
   */
  getOutfitRecommendations(context: {
    occasion?: string;
    weather?: WeatherConditions;
    mood?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    duration?: 'short' | 'medium' | 'long';
  }): OutfitItem[][] {
    let candidates = [...this.items];

    // Filter by occasion
    if (context.occasion) {
      candidates = candidates.filter(item => item.occasion.includes(context.occasion!));
    }

    // Filter by weather
    if (context.weather) {
      candidates = this.searchByWeather(context.weather);
    }

    // Generate outfit combinations
    const outfits: OutfitItem[][] = [];
    const tops = candidates.filter(item => ['T-Shirts', 'Blouses', 'Sweaters', 'Tank Tops', 'Hoodies'].includes(item.category));
    const bottoms = candidates.filter(item => ['Jeans', 'Trousers', 'Shorts', 'Skirts', 'Leggings'].includes(item.category));
    const shoes = candidates.filter(item => ['Sneakers', 'Heels', 'Boots', 'Sandals', 'Flats'].includes(item.category));

    // Create combinations
    for (const top of tops.slice(0, 5)) {
      for (const bottom of bottoms.slice(0, 3)) {
        if (this.colorsComplement(top.primaryColor, bottom.primaryColor) &&
            this.stylesCompatible(top.style, bottom.style)) {

          const matchingShoes = shoes.filter(shoe =>
            this.stylesCompatible(top.style, shoe.style) &&
            (this.colorsComplement(top.primaryColor, shoe.primaryColor) ||
             this.colorsComplement(bottom.primaryColor, shoe.primaryColor))
          );

          if (matchingShoes.length > 0) {
            outfits.push([top, bottom, matchingShoes[0]]);
          }
        }
      }
    }

    // Sort by compatibility score
    return outfits
      .sort((a, b) => this.calculateOutfitScore(b) - this.calculateOutfitScore(a))
      .slice(0, 10);
  }

  /**
   * Calculate overall outfit compatibility score
   */
  private calculateOutfitScore(outfit: OutfitItem[]): number {
    if (outfit.length < 2) return 0;

    let totalScore = 0;
    let comparisons = 0;

    for (let i = 0; i < outfit.length; i++) {
      for (let j = i + 1; j < outfit.length; j++) {
        totalScore += this.calculateCompatibilityScore(outfit[i], outfit[j]);
        comparisons++;
      }
    }

    // Add bonus for outfit completeness
    const completenessBonus = outfit.length * 2;

    // Add bonus for high-value items
    const valueBonus = outfit.reduce((sum, item) => sum + item.valueScore, 0) / outfit.length;

    return (totalScore / comparisons) + completenessBonus + valueBonus;
  }

  /**
   * Find items that need more wear (low cost-per-wear efficiency)
   */
  findUnderutilizedItems(limit: number = 10): OutfitItem[] {
    return this.items
      .filter(item => item.timesWorn < 3 && item.price > 50)
      .sort((a, b) => (b.price / Math.max(b.timesWorn, 1)) - (a.price / Math.max(a.timesWorn, 1)))
      .slice(0, limit);
  }

  /**
   * Analyze wardrobe gaps and suggest new purchases
   */
  analyzeWardrobeGaps(): {
    missingCategories: string[];
    colorGaps: string[];
    styleGaps: string[];
    seasonalGaps: { season: string; gaps: string[] }[];
  } {
    const categories = new Set(this.items.map(item => item.category));
    const colors = new Set(this.items.map(item => item.primaryColor));
    const styles = new Set(this.items.map(item => item.style));

    const essentialCategories = ['T-Shirts', 'Jeans', 'Sneakers', 'Blouses', 'Trousers'];
    const essentialColors = ['Black', 'White', 'Navy', 'Gray'];
    const essentialStyles = ['Casual', 'Business Casual', 'Smart Casual'];

    const seasonalNeeds = ['Spring', 'Summer', 'Fall', 'Winter'].map(season => {
      const seasonItems = this.items.filter(item => item.season.includes(season));
      const seasonCategories = new Set(seasonItems.map(item => item.category));

      return {
        season,
        gaps: essentialCategories.filter(cat => !seasonCategories.has(cat))
      };
    });

    return {
      missingCategories: essentialCategories.filter(cat => !categories.has(cat)),
      colorGaps: essentialColors.filter(color => !colors.has(color)),
      styleGaps: essentialStyles.filter(style => !styles.has(style)),
      seasonalGaps: seasonalNeeds.filter(season => season.gaps.length > 0)
    };
  }

  /**
   * Update item data (for when items are worn, added, etc.)
   */
  updateItem(itemId: string, updates: Partial<OutfitItem>): void {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...updates };
    }
  }

  /**
   * Add new item to the search index
   */
  addItem(item: OutfitItem): void {
    this.items.push(item);
  }

  /**
   * Remove item from the search index
   */
  removeItem(itemId: string): void {
    this.items = this.items.filter(item => item.id !== itemId);
  }

  /**
   * Get search suggestions based on partial query
   */
  getSuggestions(partialQuery: string, limit: number = 5): string[] {
    const query = partialQuery.toLowerCase();
    const suggestions = new Set<string>();

    this.items.forEach(item => {
      // Add matching names
      if (item.name.toLowerCase().includes(query)) {
        suggestions.add(item.name);
      }

      // Add matching brands
      if (item.brand.toLowerCase().includes(query)) {
        suggestions.add(item.brand);
      }

      // Add matching categories
      if (item.category.toLowerCase().includes(query)) {
        suggestions.add(item.category);
      }

      // Add matching colors
      if (item.primaryColor.toLowerCase().includes(query)) {
        suggestions.add(item.primaryColor);
      }

      // Add matching styles
      if (item.style.toLowerCase().includes(query)) {
        suggestions.add(item.style);
      }

      // Add matching tags
      item.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query)) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }
}

export default SmartOutfitSearch;