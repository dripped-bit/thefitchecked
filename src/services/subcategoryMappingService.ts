/**
 * Subcategory Mapping Service
 * Provides detailed subcategories for each clothing category
 */

export const SUBCATEGORIES: Record<string, string[]> = {
  // TOPS & BLOUSES (5)
  tops: [
    'T-shirts',
    'Button-down shirts / Blouses',
    'Tank tops / Camisoles',
    'Bodysuits',
    'Crop tops'
  ],
  
  // BOTTOMS (5)
  bottoms: [
    'Jeans',
    'Leggings',
    'Trousers',
    'Shorts',
    'Skirts'
  ],
  
  // DRESSES (5)
  dresses: [
    'Casual day dresses / Sundresses',
    'Midi dresses',
    'Maxi dresses',
    'Cocktail dresses / Party dresses',
    'Little black dress (LBD) / Bodycon dresses'
  ],
  
  // ACTIVEWEAR (5)
  activewear: [
    'Leggings',
    'Sports bras',
    'Athletic shorts',
    'Athletic tops',
    'Hoodies / Joggers'
  ],
  
  // OUTERWEAR (5)
  outerwear: [
    'Sweaters',
    'Hoodies / Sweatshirts',
    'Denim jackets',
    'Blazers',
    'Puffer jackets / Down coats'
  ],
  
  // SHOES (5)
  shoes: [
    'Sneakers',
    'Ankle boots',
    'Flats',
    'Heels',
    'Sandals'
  ],
  
  // ACCESSORIES (5)
  accessories: [
    'Bags',
    'Jewelry',
    'Sunglasses',
    'Belts',
    'Scarves'
  ]
};

export const getSubcategoriesForCategory = (category: string): string[] => {
  return SUBCATEGORIES[category] || [];
};
