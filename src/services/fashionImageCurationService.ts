/**
 * Fashion Image Curation Service
 * Uses Unsplash and Pexels APIs to find fashion images
 * Curated by AI based on user's style profile
 */

import { ClothingItem } from '../hooks/useCloset';

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
}

export interface StyleProfile {
  dominantColors: string[];
  preferredCategories: string[];
  styleKeywords: string[];
  bodyType?: string;
  ageRange?: string;
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
        relevanceScore: 1.0
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
}

export default new FashionImageCurationService();
