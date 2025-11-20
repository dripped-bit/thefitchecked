/**
 * Fashion Image Curation Service
 * Uses Unsplash and Pexels APIs to find fashion images
 * Curated by AI based on user's style profile
 */

import { ClothingItem } from '../hooks/useCloset';
import stylePreferencesService from './stylePreferencesService';
import styleQuizService from './styleQuizService';
import { supabase } from './supabaseClient';

export interface CuratedImage {
  id: string;
  url: string;
  thumbnail: string;
  source: 'unsplash' | 'pexels';
  photographer?: string;
  photographerUrl?: string;
  description?: string;
  tags: string[];
  relevanceScore: number;
  downloadLocation?: string; // Unsplash download tracking URL
}

export interface StyleProfile {
  dominantColors: string[];
  preferredCategories: string[];
  styleKeywords: string[];
  bodyType?: string;
  ageRange?: string;
}

export interface PersonalizedSearchContext {
  // From closet analysis
  closetCategories: string[];
  closetBrands: string[];
  closetColors: string[];
  
  // From style profile
  styleArchetypes: string[];
  favoriteColors: string[];
  avoidColors: string[];
  preferredMaterials: string[];
  genderContext: 'women' | 'men' | 'unisex';
  
  // From wishlist/shopping
  wishlistCategories: string[];
  favoriteStores: string[];
  
  // From occasions
  commonOccasions: string[];
  
  // NEW: From style quiz
  quizStyleType?: string;
  quizPriorities?: string[];
  quizRecommendedBrands?: string[];
}

interface WishlistItem {
  category: string;
}

class FashionImageCurationService {
  private unsplashAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  private pexelsApiKey = import.meta.env.VITE_PEXELS_API_KEY;

  /**
   * Analyze user's closet to build style profile
   */
  async buildStyleProfile(items: ClothingItem[]): Promise<StyleProfile> {
    if (items.length === 0) {
      return {
        dominantColors: ['black', 'white', 'neutral'],
        preferredCategories: ['tops', 'bottoms'],
        styleKeywords: ['minimalist', 'casual', 'modern']
      };
    }

    // Analyze colors
    const colorCounts = new Map<string, number>();
    items.forEach(item => {
      if (item.color) {
        const normalizedColor = item.color.toLowerCase();
        colorCounts.set(normalizedColor, (colorCounts.get(normalizedColor) || 0) + 1);
      }
    });

    const dominantColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);

    // Analyze categories
    const categoryCounts = new Map<string, number>();
    items.forEach(item => {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
    });

    const preferredCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Generate style keywords based on closet analysis
    const styleKeywords = this.inferStyleKeywords(items, dominantColors);

    return {
      dominantColors: dominantColors.length > 0 ? dominantColors : ['black', 'white', 'neutral'],
      preferredCategories: preferredCategories.length > 0 ? preferredCategories : ['tops', 'bottoms'],
      styleKeywords
    };
  }

  /**
   * Infer style keywords from closet composition
   */
  private inferStyleKeywords(items: ClothingItem[], colors: string[]): string[] {
    const keywords: string[] = [];

    // Analyze color palette
    const neutralColors = ['black', 'white', 'gray', 'beige', 'navy', 'camel', 'brown'];
    const neutralCount = colors.filter(c => neutralColors.some(n => c.includes(n))).length;
    
    if (neutralCount >= 3) {
      keywords.push('minimalist');
    }

    // Analyze brand presence
    const hasBrands = items.some(i => i.brand);
    if (hasBrands) {
      keywords.push('curated');
    }

    // Analyze categories
    const hasActivewear = items.some(i => i.category === 'activewear');
    if (hasActivewear) {
      keywords.push('athleisure');
    }

    const hasDresses = items.some(i => i.category === 'dresses');
    if (hasDresses) {
      keywords.push('feminine');
    }

    // Default keywords
    if (keywords.length === 0) {
      keywords.push('casual', 'modern', 'classic');
    } else {
      keywords.push('modern');
    }

    return keywords.slice(0, 5);
  }

  /**
   * Search Unsplash for fashion images
   */
  async searchUnsplash(query: string, perPage: number = 10): Promise<CuratedImage[]> {
    if (!this.unsplashAccessKey) {
      console.warn('Unsplash API key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`,
        {
          headers: {
            'Authorization': `Client-ID ${this.unsplashAccessKey}`
          }
        }
      );

      if (!response.ok) {
        console.error('Unsplash API error:', response.status);
        return [];
      }

      const data = await response.json();
      
      return data.results.map((photo: any) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumbnail: photo.urls.small,
        source: 'unsplash' as const,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        description: photo.description || photo.alt_description,
        tags: photo.tags?.map((t: any) => t.title) || [],
        relevanceScore: 1.0,
        downloadLocation: photo.links?.download_location
      }));
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      return [];
    }
  }

  /**
   * Search Pexels for fashion images
   */
  async searchPexels(query: string, perPage: number = 10): Promise<CuratedImage[]> {
    if (!this.pexelsApiKey) {
      console.warn('Pexels API key not configured');
      return [];
    }

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`,
        {
          headers: {
            'Authorization': this.pexelsApiKey
          }
        }
      );

      if (!response.ok) {
        console.error('Pexels API error:', response.status);
        return [];
      }

      const data = await response.json();
      
      return data.photos.map((photo: any) => ({
        id: photo.id.toString(),
        url: photo.src.large,
        thumbnail: photo.src.medium,
        source: 'pexels' as const,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        description: photo.alt,
        tags: [],
        relevanceScore: 1.0
      }));
    } catch (error) {
      console.error('Error searching Pexels:', error);
      return [];
    }
  }

  /**
   * Get curated images for "Style Steal" section
   */
  async getStyleStealImages(
    userItems: ClothingItem[],
    count: number = 6
  ): Promise<CuratedImage[]> {
    const profile = await this.buildStyleProfile(userItems);
    
    const queries = [
      `${profile.styleKeywords[0]} fashion outfit`,
      `street style ${profile.dominantColors[0]}`,
      `${profile.styleKeywords[1] || 'modern'} outfit inspiration`,
      `casual outfit ideas`
    ];

    const allImages: CuratedImage[] = [];
    
    // Try Unsplash first
    for (const query of queries.slice(0, 2)) {
      const images = await this.searchUnsplash(query, 3);
      allImages.push(...images);
    }

    // If we have API key for Pexels, use it too
    if (this.pexelsApiKey && allImages.length < count) {
      for (const query of queries.slice(2)) {
        const images = await this.searchPexels(query, 2);
        allImages.push(...images);
      }
    }

    // Return top results
    return allImages.slice(0, count);
  }

  /**
   * Get images for specific styling scenarios
   */
  async getStylingIdeas(
    scenario: string,
    userColors: string[],
    count: number = 4
  ): Promise<CuratedImage[]> {
    const color = userColors[0] || 'neutral';
    const query = `${scenario} ${color} outfit`;
    
    // Try Unsplash first, fallback to Pexels
    let images = await this.searchUnsplash(query, count);
    
    if (images.length < count && this.pexelsApiKey) {
      const pexelsImages = await this.searchPexels(query, count - images.length);
      images = [...images, ...pexelsImages];
    }
    
    return images.slice(0, count);
  }

  /**
   * Get color-specific outfit inspiration
   */
  async getColorInspiration(
    color: string,
    count: number = 4
  ): Promise<CuratedImage[]> {
    const query = `${color} minimalist fashion outfit`;
    return this.searchUnsplash(query, count);
  }

  /**
   * Get trend-specific images
   */
  async getTrendImages(
    trend: string,
    count: number = 4
  ): Promise<CuratedImage[]> {
    const queries = [
      `${trend} fashion trend`,
      `${trend} street style`,
      `${trend} outfit inspiration`
    ];

    const allImages: CuratedImage[] = [];
    
    for (const query of queries) {
      const images = await this.searchUnsplash(query, 2);
      allImages.push(...images);
      
      if (allImages.length >= count) break;
    }

    return allImages.slice(0, count);
  }

  /**
   * Get trending style images for current season
   */
  async getTrendingStyleImages(
    trendName: string,
    count: number = 4
  ): Promise<CuratedImage[]> {
    const query = `${trendName} fashion trend 2024`;
    return this.searchUnsplash(query, count);
  }

  /**
   * Trigger Unsplash download event (required for production API compliance)
   * Must be called when user views or interacts with an Unsplash image
   * https://unsplash.com/documentation#track-a-photo-download
   */
  async triggerUnsplashDownload(photoId: string, downloadLocation?: string): Promise<void> {
    if (!this.unsplashAccessKey) {
      console.warn('⚠️ [UNSPLASH] Cannot track download - API key not configured');
      return;
    }

    try {
      // Use download_location if provided, otherwise construct URL
      const url = downloadLocation || `https://api.unsplash.com/photos/${photoId}/download`;
      
      console.log('📸 [UNSPLASH] Tracking download for photo:', photoId);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Client-ID ${this.unsplashAccessKey}`
        }
      });

      if (response.ok) {
        console.log('✅ [UNSPLASH] Download tracked successfully:', photoId);
      } else {
        console.error('❌ [UNSPLASH] Download tracking failed:', response.status);
      }
    } catch (error) {
      console.error('❌ [UNSPLASH] Error tracking download:', error);
    }
  }

  /**
   * Build comprehensive personalization context from all user data
   */
  async buildPersonalizationContext(
    items: ClothingItem[],
    userId: string
  ): Promise<PersonalizedSearchContext> {
    // 1. Analyze closet
    const closetAnalysis = this.analyzeClosetComposition(items);
    
    // 2. Load style profile
    const styleProfile = await stylePreferencesService.loadStyleProfile();
    
    // 3. Load style quiz results (NEW - adds quiz personalization)
    const quizResults = await styleQuizService.getQuizResults();
    
    // 4. Load wishlist
    const wishlist = await this.getWishlistItems(userId);
    
    // Merge quiz results with existing preferences
    const styleArchetypes = styleProfile?.fashionPersonality?.archetypes || [];
    if (quizResults?.visualStyle) {
      styleArchetypes.push(...quizResults.visualStyle);
    }
    
    // Use quiz color palette if available, otherwise fall back to style profile
    const favoriteColors = quizResults?.recommendedPalette?.map(c => c.name.toLowerCase()) || 
                          styleProfile?.fashionPersonality?.colorPalette || [];
    
    return {
      closetCategories: closetAnalysis.topCategories,
      closetBrands: closetAnalysis.brands,
      closetColors: closetAnalysis.dominantColors,
      styleArchetypes: [...new Set(styleArchetypes)], // Remove duplicates
      favoriteColors: [...new Set(favoriteColors)], // Remove duplicates
      avoidColors: styleProfile?.fashionPersonality?.avoidColors || [],
      preferredMaterials: styleProfile?.preferences?.materials || [],
      genderContext: styleProfile?.sizes?.gender || 'women',
      wishlistCategories: wishlist.map(w => w.category).filter(Boolean),
      favoriteStores: styleProfile?.shopping?.favoriteStores || [],
      commonOccasions: this.extractOccasions(styleProfile),
      // NEW: Quiz-specific preferences
      quizStyleType: quizResults?.styleType,
      quizPriorities: quizResults?.priorities || [],
      quizRecommendedBrands: quizResults?.recommendedBrands || []
    };
  }

  /**
   * Analyze closet composition for personalization
   */
  private analyzeClosetComposition(items: ClothingItem[]) {
    // Categories
    const categoryCounts = new Map<string, number>();
    items.forEach(item => {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
    });
    
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
    
    // Brands
    const brands = Array.from(new Set(
      items.filter(i => i.brand).map(i => i.brand!)
    ));
    
    // Colors
    const colorCounts = new Map<string, number>();
    items.forEach(item => {
      if (item.color) {
        colorCounts.set(item.color.toLowerCase(), (colorCounts.get(item.color.toLowerCase()) || 0) + 1);
      }
    });
    
    const dominantColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);
    
    return {
      topCategories,
      brands: brands.slice(0, 5),
      dominantColors
    };
  }

  /**
   * Generate smart search queries based on personalization context
   */
  private generatePersonalizedQueries(
    context: PersonalizedSearchContext,
    targetColor?: string
  ): string[] {
    const queries: string[] = [];
    
    // Gender-specific context
    const genderTerm = context.genderContext === 'men' ? 'mens' :
                       context.genderContext === 'women' ? 'womens' : '';
    
    // Style archetype queries
    if (context.styleArchetypes.length > 0) {
      const style = context.styleArchetypes[0];
      const color = targetColor || context.favoriteColors[0] || '';
      queries.push(`${genderTerm} ${style} ${color} outfit`.trim());
    }
    
    // Category-specific queries
    if (context.closetCategories.length > 0) {
      const cat = context.closetCategories[0];
      const color = targetColor || context.favoriteColors[0] || '';
      queries.push(`${genderTerm} ${cat} ${color} fashion`.trim());
    }
    
    // Material-based queries
    if (context.preferredMaterials.length > 0) {
      const material = context.preferredMaterials[0];
      queries.push(`${genderTerm} ${material} ${targetColor || ''} outfit inspiration`.trim());
    }
    
    // Occasion-based queries
    if (context.commonOccasions.length > 0) {
      const occasion = context.commonOccasions[0];
      const color = targetColor || context.favoriteColors[0] || '';
      queries.push(`${genderTerm} ${occasion} outfit ${color}`.trim());
    }
    
    // Wishlist-based (what they WANT but don't have)
    if (context.wishlistCategories.length > 0) {
      const wishCat = context.wishlistCategories[0];
      queries.push(`${genderTerm} ${wishCat} styling ideas ${targetColor || ''}`.trim());
    }
    
    // Color combination from their favorites
    if (context.favoriteColors.length >= 2) {
      const color1 = context.favoriteColors[0];
      const color2 = context.favoriteColors[1];
      queries.push(`${genderTerm} ${color1} and ${color2} outfit`.trim());
    }
    
    // Fallback to basic query if no personalization available
    if (queries.length === 0) {
      queries.push(`${genderTerm} ${targetColor || 'fashion'} outfit`.trim());
    }
    
    return queries.filter(q => q.length > 0);
  }

  /**
   * Get personalized color inspiration based on user's complete profile
   */
  async getPersonalizedColorInspiration(
    items: ClothingItem[],
    userId: string,
    targetColor: string,
    count: number = 4
  ): Promise<CuratedImage[]> {
    try {
      // Build comprehensive context
      const context = await this.buildPersonalizationContext(items, userId);
      
      console.log('🎨 [INSPIRATION] Personalization context:', {
        gender: context.genderContext,
        styles: context.styleArchetypes,
        favoriteColors: context.favoriteColors,
        topCategories: context.closetCategories
      });
      
      // Generate smart queries
      const queries = this.generatePersonalizedQueries(context, targetColor);
      
      console.log('🔍 [INSPIRATION] Search queries:', queries);
      
      // Search with personalized queries
      const allImages: CuratedImage[] = [];
      
      for (const query of queries.slice(0, 3)) {
        const images = await this.searchUnsplash(query, 2);
        allImages.push(...images);
        
        if (allImages.length >= count) break;
      }
      
      // Filter out images with avoided colors
      const filtered = allImages.filter(img => {
        const desc = (img.description || '').toLowerCase();
        return !context.avoidColors.some(avoid => 
          desc.includes(avoid.toLowerCase())
        );
      });
      
      return filtered.slice(0, count);
      
    } catch (error) {
      console.error('Error getting personalized inspiration:', error);
      // Fallback to basic search
      return this.searchUnsplash(`${targetColor} fashion outfit`, count);
    }
  }

  /**
   * Get wishlist items from Supabase
   */
  private async getWishlistItems(userId: string): Promise<WishlistItem[]> {
    if (!userId) return [];
    
    try {
      const { data } = await supabase
        .from('wishlist_items')
        .select('category')
        .eq('user_id', userId)
        .limit(20);
      
      return (data || []) as WishlistItem[];
    } catch (error) {
      console.error('Error loading wishlist:', error);
      return [];
    }
  }

  /**
   * Extract occasions from style profile
   */
  private extractOccasions(profile: any): string[] {
    if (!profile?.occasions) return [];
    
    const occasions: string[] = [];
    
    if (profile.occasions.weekend) {
      occasions.push(...profile.occasions.weekend);
    }
    if (profile.occasions.nightOut) {
      occasions.push(...profile.occasions.nightOut);
    }
    
    return occasions.slice(0, 3);
  }
}

export default new FashionImageCurationService();
