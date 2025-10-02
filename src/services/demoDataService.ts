/**
 * Demo Data Service - Centralized demo data management for development
 * Provides consistent demo data across all forms and components
 */

export interface DemoMeasurements {
  heightFeet: string;
  heightInches: string;
  height: string; // For forms that use combined height
  chest: string;
  waist: string;
  hips: string;
  shoulderWidth: string;
  shoulders: string; // Alternative field name
  inseam: string;
  weight: string;
  age: string;
  gender: 'male' | 'female' | 'other';
  bodyType: string;
}

export interface DemoUserData {
  firstName: string;
  birthday: string;
}

export interface DemoStyleProfile {
  lifestyle: {
    morningRoutine: string[];
    workEnvironment: string[];
  };
  fashionPersonality: {
    archetypes: string[];
    colorPalette: string[];
    avoidColors: string[];
  };
  creative: {
    outlets: string[];
    inspirations: string[];
  };
  shopping: {
    habits: string[];
    favoriteStores: string[];
    customStores: string[];
  };
  preferences: {
    materials: string[];
    fits: string[];
  };
  occasions: {
    weekend: string[];
    nightOut: string[];
  };
  influences: {
    eras: string[];
    sources: string[];
  };
  boundaries: string[];
  descriptions: {
    personalStyle: string;
    dreamPurchase: string;
    styleGoals: string;
    inspiration: string;
  };
}

export interface DemoClothingPrompts {
  casual: string[];
  formal: string[];
  trendy: string[];
  vintage: string[];
  minimalist: string[];
  edgy: string[];
}

export interface DemoOutfitNames {
  casual: string[];
  formal: string[];
  creative: string[];
  seasonal: string[];
}

class DemoDataService {
  // Primary demo measurements matching user requirements
  private defaultMeasurements: DemoMeasurements = {
    heightFeet: '4',
    heightInches: '11',
    height: '4\'11"',
    chest: '35"',
    waist: '23"',
    hips: '24"',
    shoulderWidth: '24"',
    shoulders: '24"',
    inseam: '25"',
    weight: '115 lbs',
    age: '28',
    gender: 'female',
    bodyType: 'slim'
  };

  // Demo user data
  private defaultUserData: DemoUserData = {
    firstName: 'Alex',
    birthday: '1995-06-15'
  };

  // Demo style profile with comprehensive data
  private defaultStyleProfile: DemoStyleProfile = {
    lifestyle: {
      morningRoutine: ['Coffee first', 'Quick workout', 'Minimal makeup'],
      workEnvironment: ['Remote work', 'Casual office', 'Creative space']
    },
    fashionPersonality: {
      archetypes: ['Minimalist', 'Classic', 'Creative'],
      colorPalette: ['Black', 'White', 'Navy', 'Blush pink'],
      avoidColors: ['Neon yellow', 'Bright orange']
    },
    creative: {
      outlets: ['Photography', 'Writing', 'Design'],
      inspirations: ['Nature', 'Architecture', 'Travel']
    },
    shopping: {
      habits: ['Quality over quantity', 'Research before buying', 'Sale hunting'],
      favoriteStores: ['Zara', 'Everlane', 'COS'],
      customStores: ['Local boutiques', 'Vintage shops']
    },
    preferences: {
      materials: ['Cotton', 'Linen', 'Merino wool'],
      fits: ['Tailored', 'Relaxed', 'High-waisted']
    },
    occasions: {
      weekend: ['Brunch', 'Shopping', 'Outdoor activities'],
      nightOut: ['Dinner dates', 'Gallery openings', 'Rooftop bars']
    },
    influences: {
      eras: ['90s minimalism', 'French girl chic'],
      sources: ['Instagram', 'Pinterest', 'Street style']
    },
    boundaries: ['No fast fashion', 'Sustainable brands only', 'Investment pieces'],
    descriptions: {
      personalStyle: 'Effortless minimalism with classic touches and sustainable choices',
      dreamPurchase: 'A perfectly tailored blazer that works for any occasion',
      styleGoals: 'Build a capsule wardrobe with versatile, high-quality pieces',
      inspiration: 'French women who look chic in simple, well-fitted clothes'
    }
  };

  // Demo clothing prompts for different styles
  private clothingPrompts: DemoClothingPrompts = {
    casual: [
      'Comfortable oversized sweater with high-waisted jeans',
      'Flowy midi dress perfect for weekend brunch',
      'Soft cotton t-shirt with relaxed joggers',
      'Denim jacket with white sneakers and casual pants'
    ],
    formal: [
      'Professional blazer with tailored trousers',
      'Elegant midi dress suitable for business meetings',
      'Classic button-down shirt with pencil skirt',
      'Sophisticated wrap dress in navy blue'
    ],
    trendy: [
      'Cropped oversized hoodie with bike shorts',
      'Vintage-inspired wide-leg jeans with crop top',
      'Chunky knit cardigan with mini skirt',
      'Platform boots with flowy midi dress'
    ],
    vintage: [
      'High-waisted wide-leg trousers with blouse',
      '1960s A-line mini dress',
      'Retro polka dot dress with cardigan',
      'Classic trench coat with midi skirt'
    ],
    minimalist: [
      'Clean white button-down with black trousers',
      'Simple cashmere sweater with straight-leg jeans',
      'Monochrome outfit in neutral tones',
      'Structured blazer with minimal accessories'
    ],
    edgy: [
      'Leather jacket with ripped jeans and boots',
      'All-black outfit with statement accessories',
      'Metallic top with dark wash denim',
      'Oversized blazer with combat boots'
    ]
  };

  // Demo outfit names
  private outfitNames: DemoOutfitNames = {
    casual: [
      'Weekend Wanderer',
      'Coffee Shop Chic',
      'Lazy Sunday',
      'Brunch Ready',
      'Cozy Vibes'
    ],
    formal: [
      'Office Power',
      'Meeting Ready',
      'Professional Polish',
      'Executive Elegance',
      'Business Boss'
    ],
    creative: [
      'Artist at Work',
      'Creative Flow',
      'Inspiration Station',
      'Design Mode',
      'Studio Style'
    ],
    seasonal: [
      'Spring Freshness',
      'Summer Breeze',
      'Autumn Layers',
      'Winter Warmth',
      'Holiday Sparkle'
    ]
  };

  /**
   * Get default measurements for auto-fill
   */
  getMeasurements(): DemoMeasurements {
    return { ...this.defaultMeasurements };
  }

  /**
   * Get demo user data for auto-fill
   */
  getUserData(): DemoUserData {
    return { ...this.defaultUserData };
  }

  /**
   * Get demo style profile for auto-fill
   */
  getStyleProfile(): DemoStyleProfile {
    return JSON.parse(JSON.stringify(this.defaultStyleProfile));
  }

  /**
   * Get random clothing prompt by style
   */
  getClothingPrompt(style: keyof DemoClothingPrompts = 'casual'): string {
    const prompts = this.clothingPrompts[style] || this.clothingPrompts.casual;
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  /**
   * Get all clothing prompts for a style
   */
  getAllClothingPrompts(style: keyof DemoClothingPrompts): string[] {
    return [...(this.clothingPrompts[style] || this.clothingPrompts.casual)];
  }

  /**
   * Get random outfit name by category
   */
  getOutfitName(category: keyof DemoOutfitNames = 'casual'): string {
    const names = this.outfitNames[category] || this.outfitNames.casual;
    return names[Math.floor(Math.random() * names.length)];
  }

  /**
   * Get all outfit names for a category
   */
  getAllOutfitNames(category: keyof DemoOutfitNames): string[] {
    return [...(this.outfitNames[category] || this.outfitNames.casual)];
  }

  /**
   * Generate random variation of measurements (for testing different body types)
   */
  getVariationMeasurements(variation: 'petite' | 'tall' | 'curvy' | 'athletic'): DemoMeasurements {
    const base = this.getMeasurements();

    switch (variation) {
      case 'petite':
        return {
          ...base,
          heightFeet: '5',
          heightInches: '2',
          height: '5\'2"',
          chest: '32"',
          waist: '26"',
          hips: '34"',
          inseam: '28"'
        };
      case 'tall':
        return {
          ...base,
          heightFeet: '5',
          heightInches: '8',
          height: '5\'8"',
          chest: '36"',
          waist: '28"',
          hips: '38"',
          inseam: '32"'
        };
      case 'curvy':
        return {
          ...base,
          chest: '38"',
          waist: '28"',
          hips: '40"',
          bodyType: 'curvy'
        };
      case 'athletic':
        return {
          ...base,
          chest: '36"',
          waist: '26"',
          hips: '36"',
          shoulders: '38"',
          shoulderWidth: '38"',
          bodyType: 'athletic'
        };
      default:
        return base;
    }
  }

  /**
   * Save demo data to localStorage for persistence
   */
  saveDemoProfile(name: string, data: any): void {
    const profiles = this.getDemoProfiles();
    profiles[name] = {
      ...data,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('demoProfiles', JSON.stringify(profiles));
  }

  /**
   * Load saved demo profiles
   */
  getDemoProfiles(): Record<string, any> {
    try {
      const saved = localStorage.getItem('demoProfiles');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  /**
   * Clear all demo data from localStorage
   */
  clearAllDemoData(): void {
    localStorage.removeItem('demoProfiles');
    localStorage.removeItem('styleProfile');
    localStorage.removeItem('userOnboarding');
    localStorage.removeItem('measurements');
    console.log('🧹 All demo data cleared');
  }
}

// Singleton instance
export const demoDataService = new DemoDataService();
export default demoDataService;