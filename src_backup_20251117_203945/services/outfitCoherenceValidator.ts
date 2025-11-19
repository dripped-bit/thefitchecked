/**
 * Outfit Coherence Validator
 * Ensures outfit pieces are compatible and don't conflict (e.g., dress + pants)
 */

// Clothing category definitions
const ONE_PIECE_GARMENTS = [
  'dress', 'dresses', 'gown', 'maxi dress', 'midi dress', 'mini dress',
  'jumpsuit', 'romper', 'playsuit', 'overall dress', 'shirt dress'
];

const TOPS = [
  'shirt', 'blouse', 'top', 't-shirt', 'tee', 'tank top', 'camisole',
  'sweater', 'pullover', 'hoodie', 'crop top', 'tunic', 'polo',
  'button-up', 'button-down', 'henley', 'sweatshirt'
];

const BOTTOMS = [
  'pants', 'jeans', 'trousers', 'slacks', 'chinos', 'leggings',
  'skirt', 'shorts', 'culottes', 'joggers', 'sweatpants', 'capris',
  'palazzo pants', 'wide-leg pants', 'skinny jeans', 'bootcut jeans'
];

const LAYERS = [
  'jacket', 'blazer', 'cardigan', 'coat', 'vest', 'waistcoat',
  'shawl', 'poncho', 'cape', 'bomber jacket', 'leather jacket',
  'denim jacket', 'trench coat', 'pea coat', 'overcoat'
];

const ACCESSORIES = [
  'shoes', 'boots', 'sneakers', 'heels', 'flats', 'sandals', 'loafers',
  'bag', 'purse', 'handbag', 'clutch', 'backpack', 'tote',
  'belt', 'scarf', 'hat', 'cap', 'beanie', 'sunglasses', 'glasses',
  'jewelry', 'necklace', 'bracelet', 'earrings', 'ring', 'watch'
];

interface ValidationResult {
  isValid: boolean;
  validatedPieces: string[];
  removedPieces: string[];
  reason?: string;
}

class OutfitCoherenceValidator {
  /**
   * Categorize a clothing piece
   */
  private categorizePiece(piece: string): 'one-piece' | 'top' | 'bottom' | 'layer' | 'accessory' | 'unknown' {
    const normalized = piece.toLowerCase().trim();

    if (ONE_PIECE_GARMENTS.some(garment => normalized.includes(garment))) {
      return 'one-piece';
    }
    if (TOPS.some(top => normalized.includes(top))) {
      return 'top';
    }
    if (BOTTOMS.some(bottom => normalized.includes(bottom))) {
      return 'bottom';
    }
    if (LAYERS.some(layer => normalized.includes(layer))) {
      return 'layer';
    }
    if (ACCESSORIES.some(accessory => normalized.includes(accessory))) {
      return 'accessory';
    }

    return 'unknown';
  }

  /**
   * Validate outfit pieces for coherence
   */
  validateOutfitPieces(pieces: string[]): ValidationResult {
    if (!pieces || pieces.length === 0) {
      return {
        isValid: false,
        validatedPieces: [],
        removedPieces: [],
        reason: 'No pieces provided'
      };
    }

    // Categorize all pieces
    const categorized = pieces.map(piece => ({
      original: piece,
      category: this.categorizePiece(piece)
    }));

    const hasOnePiece = categorized.some(p => p.category === 'one-piece');
    const hasTops = categorized.some(p => p.category === 'top');
    const hasBottoms = categorized.some(p => p.category === 'bottom');

    let validatedPieces: string[] = [];
    let removedPieces: string[] = [];

    // RULE 1: If outfit has a one-piece garment (dress/jumpsuit),
    // remove all separate tops and bottoms
    if (hasOnePiece) {
      validatedPieces = categorized
        .filter(p => p.category !== 'top' && p.category !== 'bottom')
        .map(p => p.original);

      removedPieces = categorized
        .filter(p => p.category === 'top' || p.category === 'bottom')
        .map(p => p.original);

      console.log('✅ [OUTFIT-VALIDATOR] One-piece outfit detected, removed separate tops/bottoms:', removedPieces);
    }
    // RULE 2: If outfit has separate tops OR bottoms,
    // remove all one-piece garments
    else if (hasTops || hasBottoms) {
      validatedPieces = categorized
        .filter(p => p.category !== 'one-piece')
        .map(p => p.original);

      removedPieces = categorized
        .filter(p => p.category === 'one-piece')
        .map(p => p.original);

      if (removedPieces.length > 0) {
        console.log('✅ [OUTFIT-VALIDATOR] Two-piece outfit detected, removed one-piece garments:', removedPieces);
      }
    }
    // RULE 3: No conflicting pieces detected, keep all
    else {
      validatedPieces = pieces;
    }

    return {
      isValid: true,
      validatedPieces,
      removedPieces,
      reason: removedPieces.length > 0
        ? `Removed ${removedPieces.length} conflicting piece(s)`
        : 'All pieces are compatible'
    };
  }

  /**
   * Build a coherent outfit prompt from pieces
   */
  buildCoherentPrompt(pieces: string[], options?: {
    colors?: string[];
    style?: string;
    includeNegativePrompt?: boolean;
  }): { prompt: string; negativePrompt?: string } {
    // Validate pieces first
    const validation = this.validateOutfitPieces(pieces);
    const coherentPieces = validation.validatedPieces;

    if (coherentPieces.length === 0) {
      console.warn('⚠️ [OUTFIT-VALIDATOR] No valid pieces after validation');
      return { prompt: 'casual outfit' };
    }

    // Build prompt
    let prompt = `wearing ${coherentPieces.join(', ')}`;

    if (options?.colors && options.colors.length > 0) {
      prompt += ` in ${options.colors.join(' and ')} colors`;
    }

    if (options?.style) {
      prompt += `, ${options.style} style`;
    }

    // Build negative prompt if requested
    let negativePrompt: string | undefined;
    if (options?.includeNegativePrompt) {
      negativePrompt = this.getNegativePrompt(coherentPieces);
    }

    console.log('✅ [OUTFIT-VALIDATOR] Built coherent prompt:', prompt);
    if (negativePrompt) {
      console.log('🚫 [OUTFIT-VALIDATOR] Negative prompt:', negativePrompt);
    }

    return { prompt, negativePrompt };
  }

  /**
   * Generate negative prompt to exclude conflicting pieces
   */
  getNegativePrompt(validatedPieces: string[]): string {
    const categorized = validatedPieces.map(piece => ({
      original: piece,
      category: this.categorizePiece(piece)
    }));

    const hasOnePiece = categorized.some(p => p.category === 'one-piece');
    const hasTops = categorized.some(p => p.category === 'top');
    const hasBottoms = categorized.some(p => p.category === 'bottom');

    const negativeTerms: string[] = [];

    // If outfit has a dress/jumpsuit, exclude separate pieces
    if (hasOnePiece) {
      negativeTerms.push(
        'separate pants', 'separate jeans', 'separate skirt', 'separate shorts',
        'separate top', 'separate shirt', 'two-piece outfit'
      );
    }

    // If outfit has pants/jeans, exclude dresses and skirts
    if (hasBottoms) {
      const hasSkirt = validatedPieces.some(p => p.toLowerCase().includes('skirt'));
      if (!hasSkirt) {
        negativeTerms.push('dress', 'gown', 'jumpsuit', 'skirt');
      } else {
        negativeTerms.push('dress', 'gown', 'jumpsuit', 'pants', 'jeans');
      }
    }

    // If outfit has top, exclude dresses
    if (hasTops && !hasBottoms) {
      negativeTerms.push('dress', 'gown', 'jumpsuit');
    }

    // Always exclude multiple conflicting pieces
    negativeTerms.push(
      'wearing multiple dresses',
      'wearing dress and pants',
      'wearing pants and skirt',
      'nude', 'naked', 'underwear only'
    );

    return negativeTerms.join(', ');
  }

  /**
   * Quick check if outfit pieces are compatible
   */
  areCompatible(pieces: string[]): boolean {
    const validation = this.validateOutfitPieces(pieces);
    return validation.removedPieces.length === 0;
  }

  /**
   * Filter out conflicting pieces and return valid ones
   */
  filterConflictingPieces(pieces: string[]): string[] {
    const validation = this.validateOutfitPieces(pieces);
    return validation.validatedPieces;
  }
}

// Export singleton instance
export default new OutfitCoherenceValidator();
