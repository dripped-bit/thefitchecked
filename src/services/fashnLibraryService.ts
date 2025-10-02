/**
 * FASHN Library Service - Predefined Garments and Keychains
 * Provides curated collections of clothing items that work reliably with FASHN API
 * Used as fallback when user uploads fail or for browsing available options
 */

export interface LibraryGarment {
  id: string;
  name: string;
  category: 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'accessories';
  subcategory: string;
  imageUrl: string;
  thumbnailUrl?: string;
  description: string;
  tags: string[];
  fashnCompatible: boolean;
  popularity: number; // 1-10 rating for recommendation ordering
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
}

export interface GarmentKeychain {
  id: string;
  name: string;
  description: string;
  garments: LibraryGarment[];
  theme: string;
  occasionType: 'casual' | 'formal' | 'business' | 'athletic' | 'party' | 'vacation';
}

export interface FashnLibraryResponse {
  success: boolean;
  garments?: LibraryGarment[];
  keychain?: GarmentKeychain;
  fallbackUsed?: boolean;
  source: 'library' | 'user_upload' | 'keychain';
}

class FashnLibraryService {
  private readonly STORAGE_KEY = 'fashnLibrary';

  // Curated library of FASHN-compatible garments
  private readonly defaultLibrary: LibraryGarment[] = [
    // Tops
    {
      id: 'lib_top_001',
      name: 'Classic White Button Shirt',
      category: 'tops',
      subcategory: 'shirts',
      imageUrl: 'https://images.unsplash.com/photo-1564584217132-2271339a3210?w=500',
      description: 'Crisp white cotton button-down shirt, perfect for professional and casual looks',
      tags: ['classic', 'versatile', 'cotton', 'button-down'],
      fashnCompatible: true,
      popularity: 9,
      season: 'all'
    },
    {
      id: 'lib_top_002',
      name: 'Casual Black T-Shirt',
      category: 'tops',
      subcategory: 't-shirts',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      description: 'Comfortable black cotton t-shirt, essential wardrobe staple',
      tags: ['casual', 'basic', 'cotton', 'everyday'],
      fashnCompatible: true,
      popularity: 10,
      season: 'all'
    },
    {
      id: 'lib_top_003',
      name: 'Navy Blue Blazer',
      category: 'outerwear',
      subcategory: 'blazers',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      description: 'Tailored navy blue blazer for business and formal occasions',
      tags: ['formal', 'business', 'tailored', 'navy'],
      fashnCompatible: true,
      popularity: 8,
      season: 'all'
    },

    // Bottoms
    {
      id: 'lib_bottom_001',
      name: 'Classic Blue Jeans',
      category: 'bottoms',
      subcategory: 'jeans',
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
      description: 'Medium wash straight-leg denim jeans, timeless style',
      tags: ['denim', 'casual', 'classic', 'versatile'],
      fashnCompatible: true,
      popularity: 10,
      season: 'all'
    },
    {
      id: 'lib_bottom_002',
      name: 'Black Dress Pants',
      category: 'bottoms',
      subcategory: 'trousers',
      imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500',
      description: 'Formal black trousers perfect for business and dressy occasions',
      tags: ['formal', 'business', 'black', 'tailored'],
      fashnCompatible: true,
      popularity: 8,
      season: 'all'
    },

    // Dresses
    {
      id: 'lib_dress_001',
      name: 'Little Black Dress',
      category: 'dresses',
      subcategory: 'cocktail',
      imageUrl: 'https://images.unsplash.com/photo-1566479179817-c64d3b650b5a?w=500',
      description: 'Elegant black cocktail dress for evening events',
      tags: ['elegant', 'black', 'cocktail', 'evening'],
      fashnCompatible: true,
      popularity: 9,
      season: 'all'
    },
    {
      id: 'lib_dress_002',
      name: 'Casual Summer Dress',
      category: 'dresses',
      subcategory: 'casual',
      imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500',
      description: 'Light and breezy summer dress for casual outings',
      tags: ['casual', 'summer', 'light', 'comfortable'],
      fashnCompatible: true,
      popularity: 8,
      season: 'summer'
    }
  ];

  // Predefined keychains/collections
  private readonly defaultKeychains: GarmentKeychain[] = [
    {
      id: 'keychain_business_001',
      name: 'Professional Business Look',
      description: 'Complete business attire for office and meetings',
      theme: 'professional',
      occasionType: 'business',
      garments: [
        this.defaultLibrary.find(g => g.id === 'lib_top_001')!,
        this.defaultLibrary.find(g => g.id === 'lib_bottom_002')!,
        this.defaultLibrary.find(g => g.id === 'lib_top_003')!
      ]
    },
    {
      id: 'keychain_casual_001',
      name: 'Weekend Casual',
      description: 'Relaxed and comfortable weekend outfit',
      theme: 'casual',
      occasionType: 'casual',
      garments: [
        this.defaultLibrary.find(g => g.id === 'lib_top_002')!,
        this.defaultLibrary.find(g => g.id === 'lib_bottom_001')!
      ]
    },
    {
      id: 'keychain_evening_001',
      name: 'Evening Elegance',
      description: 'Sophisticated look for dinner and events',
      theme: 'elegant',
      occasionType: 'party',
      garments: [
        this.defaultLibrary.find(g => g.id === 'lib_dress_001')!
      ]
    }
  ];

  /**
   * Get all available garments from library
   */
  getAllGarments(): LibraryGarment[] {
    return [...this.defaultLibrary].sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Get garments by category
   */
  getGarmentsByCategory(category: LibraryGarment['category']): LibraryGarment[] {
    return this.defaultLibrary
      .filter(garment => garment.category === category)
      .sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Get garments by tags
   */
  getGarmentsByTags(tags: string[]): LibraryGarment[] {
    return this.defaultLibrary
      .filter(garment => tags.some(tag => garment.tags.includes(tag)))
      .sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Get a specific garment by ID
   */
  getGarmentById(id: string): LibraryGarment | null {
    return this.defaultLibrary.find(garment => garment.id === id) || null;
  }

  /**
   * Get all available keychains
   */
  getAllKeychains(): GarmentKeychain[] {
    return [...this.defaultKeychains];
  }

  /**
   * Get keychain by occasion type
   */
  getKeychainsByOccasion(occasionType: GarmentKeychain['occasionType']): GarmentKeychain[] {
    return this.defaultKeychains.filter(keychain => keychain.occasionType === occasionType);
  }

  /**
   * Get a specific keychain by ID
   */
  getKeychainById(id: string): GarmentKeychain | null {
    return this.defaultKeychains.find(keychain => keychain.id === id) || null;
  }

  /**
   * Get recommended fallback garments when user upload fails
   */
  getFallbackGarments(category?: LibraryGarment['category'], limit: number = 3): LibraryGarment[] {
    const garments = category
      ? this.getGarmentsByCategory(category)
      : this.getAllGarments();

    return garments
      .filter(garment => garment.fashnCompatible)
      .slice(0, limit);
  }

  /**
   * Search garments by name or description
   */
  searchGarments(query: string): LibraryGarment[] {
    const lowerQuery = query.toLowerCase();
    return this.defaultLibrary
      .filter(garment =>
        garment.name.toLowerCase().includes(lowerQuery) ||
        garment.description.toLowerCase().includes(lowerQuery) ||
        garment.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Get seasonal recommendations
   */
  getSeasonalRecommendations(season: LibraryGarment['season']): LibraryGarment[] {
    return this.defaultLibrary
      .filter(garment => garment.season === season || garment.season === 'all')
      .sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Get compatibility info for FASHN
   */
  getFashnCompatibleGarments(): LibraryGarment[] {
    return this.defaultLibrary.filter(garment => garment.fashnCompatible);
  }

  /**
   * Add custom garment to library (user contributions)
   */
  addCustomGarment(garment: Omit<LibraryGarment, 'id'>): LibraryGarment {
    const customGarment: LibraryGarment = {
      ...garment,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // In a real app, this would persist to storage
    console.log('📚 [FASHN-LIBRARY] Custom garment added:', customGarment.name);
    return customGarment;
  }

  /**
   * Get popular/trending garments
   */
  getPopularGarments(limit: number = 5): LibraryGarment[] {
    return this.defaultLibrary
      .filter(garment => garment.popularity >= 8)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  /**
   * Test garment URL for FASHN compatibility
   */
  async testGarmentCompatibility(imageUrl: string): Promise<{ compatible: boolean; issues: string[] }> {
    try {
      // Basic URL validation
      const issues: string[] = [];

      if (!imageUrl.includes('http') && !imageUrl.includes('data:image/')) {
        issues.push('Invalid image URL format');
      }

      if (imageUrl.length < 50) {
        issues.push('URL appears too short');
      }

      // In a real implementation, you might test the actual image
      console.log('🧪 [FASHN-LIBRARY] Testing garment compatibility:', imageUrl.substring(0, 100));

      return {
        compatible: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        compatible: false,
        issues: ['Failed to test compatibility']
      };
    }
  }
}

export const fashnLibraryService = new FashnLibraryService();
export default fashnLibraryService;