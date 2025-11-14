/**
 * Outfit Category Detector
 * Analyzes outfit descriptions and extracts individual clothing categories
 * for targeted shopping searches
 */

export interface OutfitCategory {
  type: 'tops' | 'bottoms' | 'one-pieces' | 'outerwear' | 'shoes' | 'accessories';
  searchTerm: string; // Extracted item description for search
  displayName: string; // User-friendly tab name
  priority: number; // Sort order (lower = higher priority)
}

export interface OutfitComposition {
  isMultiPiece: boolean;
  categories: OutfitCategory[];
  fullQuery: string; // Original search as fallback
}

// Clothing category keywords with priority ordering
const CATEGORY_KEYWORDS = {
  'one-pieces': {
    keywords: [
      'dress', 'dresses', 'gown', 'maxi dress', 'midi dress', 'mini dress', 'sundress',
      'jumpsuit', 'romper', 'playsuit', 'overall dress', 'shirt dress', 'wrap dress',
      'bathing suit', 'swimsuit', 'bikini', 'swimwear', 'one-piece swim'
    ],
    displayName: 'Dresses & Jumpsuits',
    priority: 1
  },
  'tops': {
    keywords: [
      'shirt', 'blouse', 'top', 't-shirt', 'tee', 'tank top', 'tank', 'camisole',
      'sweater', 'pullover', 'hoodie', 'crop top', 'tunic', 'polo',
      'button-up', 'button-down', 'henley', 'sweatshirt', 'turtleneck',
      'halter', 'off-shoulder', 'bodysuit'
    ],
    displayName: 'Tops',
    priority: 2
  },
  'bottoms': {
    keywords: [
      'pants', 'trousers', 'jeans', 'slacks', 'chinos', 'khakis',
      'skirt', 'shorts', 'leggings', 'joggers', 'sweatpants',
      'culottes', 'palazzo', 'wide-leg', 'skinny jeans', 'bootcut'
    ],
    displayName: 'Bottoms',
    priority: 3
  },
  'outerwear': {
    keywords: [
      'jacket', 'coat', 'blazer', 'cardigan', 'bomber', 'trench',
      'parka', 'peacoat', 'overcoat', 'duster', 'windbreaker',
      'vest', 'puffer', 'leather jacket', 'denim jacket'
    ],
    displayName: 'Jackets & Coats',
    priority: 4
  },
  'shoes': {
    keywords: [
      'shoes', 'heels', 'boots', 'sneakers', 'sandals', 'flats',
      'pumps', 'loafers', 'mules', 'wedges', 'stilettos',
      'ankle boots', 'knee-high boots', 'booties'
    ],
    displayName: 'Shoes',
    priority: 5
  },
  'accessories': {
    keywords: [
      'bag', 'purse', 'handbag', 'clutch', 'backpack', 'tote',
      'belt', 'scarf', 'hat', 'jewelry', 'necklace', 'earrings',
      'bracelet', 'watch', 'sunglasses', 'gloves'
    ],
    displayName: 'Accessories',
    priority: 6
  }
};

class OutfitCategoryDetector {
  /**
   * Detect categories from outfit description
   */
  detectCategories(searchPrompt: string, originalInput: string): OutfitComposition {
    console.log('🔍 [CATEGORY-DETECTOR] Analyzing outfit...');
    console.log('📝 [CATEGORY-DETECTOR] Search prompt:', searchPrompt);
    console.log('📝 [CATEGORY-DETECTOR] Original input:', originalInput);

    const fullText = `${searchPrompt} ${originalInput}`.toLowerCase();
    const detectedCategories: OutfitCategory[] = [];

    // Check each category for keyword matches
    Object.entries(CATEGORY_KEYWORDS).forEach(([type, config]) => {
      const matchedKeywords = config.keywords.filter(keyword => 
        fullText.includes(keyword.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        // Extract specific item description around the keyword
        const searchTerm = this.extractItemDescription(
          fullText, 
          matchedKeywords[0],
          type as OutfitCategory['type']
        );

        detectedCategories.push({
          type: type as OutfitCategory['type'],
          searchTerm,
          displayName: config.displayName,
          priority: config.priority
        });

        console.log(`✅ [CATEGORY-DETECTOR] Detected ${type}: "${searchTerm}"`);
      }
    });

    // Apply priority rules
    const finalCategories = this.applyPriorityRules(detectedCategories);

    // Determine if multi-piece
    const isMultiPiece = finalCategories.length > 1;

    console.log(`🎯 [CATEGORY-DETECTOR] Final composition: ${isMultiPiece ? 'Multi-piece' : 'Single-piece'} (${finalCategories.length} categories)`);

    return {
      isMultiPiece,
      categories: finalCategories,
      fullQuery: originalInput || searchPrompt
    };
  }

  /**
   * Extract item description from text around a keyword
   */
  private extractItemDescription(
    text: string, 
    keyword: string,
    categoryType: OutfitCategory['type']
  ): string {
    // Find the keyword position
    const keywordIndex = text.indexOf(keyword.toLowerCase());
    if (keywordIndex === -1) return keyword;

    // Extract context window (5 words before and after)
    const words = text.split(/\s+/);
    const keywordWordIndex = words.findIndex(word => word.includes(keyword.toLowerCase()));
    
    if (keywordWordIndex === -1) return keyword;

    const startIndex = Math.max(0, keywordWordIndex - 3);
    const endIndex = Math.min(words.length, keywordWordIndex + 4);
    const contextWords = words.slice(startIndex, endIndex);

    // Clean up and return
    let description = contextWords.join(' ').trim();
    
    // Remove common filler words at start/end
    description = description.replace(/^(with|and|the|a|an|for|in|on|at)\s+/i, '');
    description = description.replace(/\s+(with|and|for|in|on|at)$/i, '');

    return description || keyword;
  }

  /**
   * Apply priority rules to resolve conflicts
   */
  private applyPriorityRules(categories: OutfitCategory[]): OutfitCategory[] {
    // Rule 1: If one-piece detected, remove tops and bottoms
    const hasOnePiece = categories.some(c => c.type === 'one-pieces');
    if (hasOnePiece) {
      console.log('🎯 [PRIORITY-RULE] One-piece detected, removing separate tops/bottoms');
      return categories.filter(c => c.type !== 'tops' && c.type !== 'bottoms');
    }

    // Rule 2: If tops OR bottoms detected, remove one-pieces
    const hasTopsOrBottoms = categories.some(c => c.type === 'tops' || c.type === 'bottoms');
    if (hasTopsOrBottoms) {
      const filtered = categories.filter(c => c.type !== 'one-pieces');
      if (filtered.length < categories.length) {
        console.log('🎯 [PRIORITY-RULE] Tops/bottoms detected, removed one-piece references');
      }
      categories = filtered;
    }

    // Rule 3: Maximum 4 categories (prioritize clothing over accessories)
    if (categories.length > 4) {
      console.log('⚠️ [PRIORITY-RULE] Too many categories, limiting to 4 (removing accessories/shoes)');
      categories = categories
        .filter(c => c.type !== 'accessories')
        .filter(c => c.type !== 'shoes')
        .slice(0, 4);
    }

    // Sort by priority
    return categories.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check if query is a single-item search
   */
  isSingleItem(searchPrompt: string): boolean {
    const categories = this.detectCategories(searchPrompt, searchPrompt);
    return categories.categories.length === 1;
  }
}

// Export singleton instance
export const outfitCategoryDetector = new OutfitCategoryDetector();
export default outfitCategoryDetector;
