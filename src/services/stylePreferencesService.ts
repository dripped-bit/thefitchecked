/**
 * Style Preferences Service
 * Loads and formats user's saved style preferences for outfit generation
 * Now uses IndexedDB for 50MB+ storage capacity
 */

import indexedDBService from './indexedDBService';

export interface UserStyleProfile {
  lifestyle?: {
    morningRoutine?: string[];
    workEnvironment?: string[];
  };
  fashionPersonality?: {
    archetypes?: string[];
    colorPalette?: string[];
    avoidColors?: string[];
  };
  creative?: {
    outlets?: string[];
    inspirations?: string[];
  };
  shopping?: {
    habits?: string[];
    favoriteStores?: string[];
    customStores?: string[];
  };
  preferences?: {
    materials?: string[];
    fits?: string[];
  };
  occasions?: {
    weekend?: string[];
    nightOut?: string[];
  };
  influences?: {
    eras?: string[];
    sources?: string[];
  };
  boundaries?: string[];
  uploads?: {
    goToOutfit?: string | null;
    dreamPurchase?: string | null;
    inspiration?: string | null;
    favoritePiece?: string | null;
  };
  descriptions?: {
    threeWords?: string[];
    alwaysFollow?: string;
    loveToBreak?: string;
    neverThrowAway?: string;
  };
  seasonal?: string[];
}

export interface FormattedStylePreferences {
  styleText: string;
  hasPreferences: boolean;
  archetypes: string[];
  colors: string[];
  materials: string[];
  fits: string[];
  boundaries: string[];
}

class StylePreferencesService {
  private readonly STORE_NAME = 'styleProfile';
  private readonly STORAGE_KEY = 'current';

  /**
   * Load saved style profile from IndexedDB
   */
  async loadStyleProfile(): Promise<UserStyleProfile | null> {
    try {
      const profile = await indexedDBService.get<UserStyleProfile>(this.STORE_NAME, this.STORAGE_KEY);

      if (!profile) {
        console.log('📋 No saved style preferences found');
        return null;
      }

      console.log('✅ Loaded style preferences:', profile);
      return profile;
    } catch (error) {
      console.error('❌ Failed to load style preferences:', error);
      return null;
    }
  }

  /**
   * Save style profile to IndexedDB
   */
  async saveStyleProfile(profile: UserStyleProfile): Promise<boolean> {
    try {
      const success = await indexedDBService.set(this.STORE_NAME, this.STORAGE_KEY, profile);

      if (success) {
        console.log('✅ Style preferences saved successfully');
        return true;
      } else {
        console.error('❌ Failed to save style preferences');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to save style preferences:', error);
      return false;
    }
  }

  /**
   * Format style preferences into AI-friendly prompt text
   */
  async formatPreferencesForPrompt(): Promise<FormattedStylePreferences> {
    const profile = await this.loadStyleProfile();

    if (!profile) {
      return {
        styleText: '',
        hasPreferences: false,
        archetypes: [],
        colors: [],
        materials: [],
        fits: [],
        boundaries: []
      };
    }

    const parts: string[] = [];

    // Extract style archetypes
    const archetypes = profile.fashionPersonality?.archetypes || [];
    if (archetypes.length > 0) {
      const cleanArchetypes = archetypes.map(a => a.split(' - ')[0].toLowerCase());
      parts.push(`style: ${cleanArchetypes.join(', ')}`);
    }

    // Extract color preferences
    const colorPalette = profile.fashionPersonality?.colorPalette || [];
    if (colorPalette.length > 0) {
      const cleanColors = colorPalette.map(c => c.toLowerCase());
      parts.push(`preferred colors: ${cleanColors.join(', ')}`);
    }

    // Extract colors to avoid
    const avoidColors = profile.fashionPersonality?.avoidColors || [];
    if (avoidColors.length > 0) {
      const cleanAvoid = avoidColors.map(c => c.toLowerCase());
      parts.push(`avoid colors: ${cleanAvoid.join(', ')}`);
    }

    // Extract material preferences
    const materials = profile.preferences?.materials || [];
    if (materials.length > 0) {
      const cleanMaterials = materials.map(m => m.toLowerCase());
      parts.push(`materials: ${cleanMaterials.join(', ')}`);
    }

    // Extract fit preferences
    const fits = profile.preferences?.fits || [];
    if (fits.length > 0) {
      const cleanFits = fits.map(f => f.toLowerCase());
      parts.push(`fit: ${cleanFits.join(', ')}`);
    }

    // Extract boundaries (what to avoid)
    const boundaries = profile.boundaries || [];
    if (boundaries.length > 0) {
      const cleanBoundaries = boundaries.map(b => b.toLowerCase());
      parts.push(`avoid: ${cleanBoundaries.join(', ')}`);
    }

    // Extract shopping habits for context
    const shoppingHabits = profile.shopping?.habits || [];
    if (shoppingHabits.length > 0) {
      const relevantHabits = shoppingHabits.filter(h =>
        h.toLowerCase().includes('quality') ||
        h.toLowerCase().includes('sustainable') ||
        h.toLowerCase().includes('luxury') ||
        h.toLowerCase().includes('vintage')
      );
      if (relevantHabits.length > 0) {
        parts.push(`shopping style: ${relevantHabits.join(', ').toLowerCase()}`);
      }
    }

    // Extract 3-word style description
    const threeWords = profile.descriptions?.threeWords?.filter(w => w.trim() !== '') || [];
    if (threeWords.length > 0) {
      parts.push(`vibe: ${threeWords.join(', ').toLowerCase()}`);
    }

    const styleText = parts.join(', ');

    return {
      styleText,
      hasPreferences: parts.length > 0,
      archetypes: archetypes.map(a => a.split(' - ')[0]),
      colors: colorPalette,
      materials,
      fits,
      boundaries
    };
  }

  /**
   * Get a concise style summary for UI display
   */
  async getStyleSummary(): Promise<string> {
    const formatted = await this.formatPreferencesForPrompt();

    if (!formatted.hasPreferences) {
      return 'No style preferences saved yet';
    }

    const parts: string[] = [];

    if (formatted.archetypes.length > 0) {
      parts.push(formatted.archetypes.slice(0, 2).join(' & '));
    }

    if (formatted.colors.length > 0) {
      const firstColor = formatted.colors[0].toLowerCase();
      parts.push(firstColor);
    }

    return parts.join(' • ') || 'Custom style preferences';
  }

  /**
   * Check if user has saved style preferences
   */
  async hasStylePreferences(): Promise<boolean> {
    const profile = await this.loadStyleProfile();
    return profile !== null && Object.keys(profile).length > 0;
  }

  /**
   * Clear saved style preferences
   */
  async clearStylePreferences(): Promise<void> {
    await indexedDBService.delete(this.STORE_NAME, this.STORAGE_KEY);
    console.log('🗑️ Style preferences cleared');
  }
}

// Export singleton instance
const stylePreferencesService = new StylePreferencesService();
export default stylePreferencesService;
