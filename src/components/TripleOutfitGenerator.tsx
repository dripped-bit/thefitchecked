import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Heart,
  Zap,
  Star,
  ShoppingBag,
  Calendar,
  Thermometer,
  Users,
  RefreshCw,
  Check,
  ChevronDown,
  Eye,
  Share2,
  X
} from 'lucide-react';
import directFashnService from '../services/directFashnService';
import stylePreferencesService from '../services/stylePreferencesService';
import userDataService from '../services/userDataService';
import outfitStorageService from '../services/outfitStorageService';
import multiItemDetectionService from '../services/multiItemDetectionService';
import completeFashnTryOnService from '../services/completeFashnTryOnService';
import apiConfig from '../config/apiConfig';
// Color analysis temporarily disabled for deployment
// import colorAnalysisService from '../services/colorAnalysisService';
import { ParsedOccasion } from './SmartOccasionInput';
import ShareModal from './ShareModal';
import CalendarEntryModal from './CalendarEntryModal';
import imageExporter from '../utils/imageExporter';

export interface OutfitPersonality {
  id: 'elegant' | 'romantic' | 'bold';
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  promptModifier: string;
}

export interface GeneratedOutfit {
  personality: OutfitPersonality;
  imageUrl: string;
  reasoning: string[];
  priceRange: string;
  confidence: number;
  isSelected: boolean;
  originalPrompt: string;
  searchPrompt: string;
  supabaseId?: string;  // Database ID for tracking
  seed?: number;         // Seedream seed used
}

interface TripleOutfitGeneratorProps {
  occasion: ParsedOccasion;
  avatarData?: any;
  onOutfitSelected: (outfit: GeneratedOutfit) => void;
  onOutfitApplied: (outfit: GeneratedOutfit, avatarUrl: string) => void;
  onShopThisLook?: () => void;
  hasTriedOn?: boolean;
  className?: string;
}

const TripleOutfitGenerator: React.FC<TripleOutfitGeneratorProps> = ({
  occasion,
  avatarData,
  onOutfitSelected,
  onOutfitApplied,
  onShopThisLook,
  hasTriedOn = false,
  className = ''
}) => {
  const [outfits, setOutfits] = useState<GeneratedOutfit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<GeneratedOutfit | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [hasStylePreferences, setHasStylePreferences] = useState(false);
  const [styleSummary, setStyleSummary] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareOutfit, setShareOutfit] = useState<GeneratedOutfit | null>(null);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [zoomOutfit, setZoomOutfit] = useState<GeneratedOutfit | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [outfitToSave, setOutfitToSave] = useState<any>(null);

  // Style interpretation categories for outfit variations
  const styleInterpretations = [
    {
      name: 'Romantic',
      description: 'flowing fabrics, delicate details, ruffles OR lace OR floral elements, dreamy feminine style, soft draping',
      colorPalette: 'soft pastels, blush pink, cream, lavender, or powder blue',
      silhouette: 'flowing and draped, A-line or empire waist',
      negativeExclusions: 'structured, geometric, minimalist, monochrome, harsh lines'
    },
    {
      name: 'Elegant',
      description: 'tailored silhouette, classic lines, refined details, structured pieces, timeless elegance',
      colorPalette: 'classic neutrals, navy, black, ivory, burgundy, or emerald',
      silhouette: 'tailored and structured, fitted waist, clean lines',
      negativeExclusions: 'casual, bohemian, loose-fitting, distressed, oversized'
    },
    {
      name: 'Edgy',
      description: 'leather OR metal details, bold cuts, asymmetric elements, statement pieces, urban aesthetic',
      colorPalette: 'bold colors, black, deep red, metallic silver, electric blue',
      silhouette: 'asymmetric or deconstructed, fitted or oversized extremes',
      negativeExclusions: 'delicate, romantic, pastel, flowing, soft fabrics'
    },
    {
      name: 'Minimalist',
      description: 'clean lines, neutral colors, simple silhouettes, understated elegance',
      colorPalette: 'monochromatic neutrals, white, beige, gray, camel, or black',
      silhouette: 'simple and streamlined, straight or slightly relaxed',
      negativeExclusions: 'embellished, patterned, ruffled, layered, ornate details'
    },
    {
      name: 'Bohemian',
      description: 'layered textures, earthy tones, loose fits, eclectic patterns, free-spirited',
      colorPalette: 'earthy warm tones, terracotta, olive, mustard, rust, or burnt orange',
      silhouette: 'loose and relaxed, layered, flowy maxi or oversized',
      negativeExclusions: 'structured, tailored, minimalist, sleek, form-fitting'
    },
    {
      name: 'Glam',
      description: 'sequins OR metallics, bold colors, luxury fabrics, embellished details',
      colorPalette: 'jewel tones or metallics, gold, emerald, ruby red, sapphire, or champagne',
      silhouette: 'form-fitting or dramatic, bodycon or voluminous statement',
      negativeExclusions: 'casual, muted, understated, simple, minimalist'
    }
  ];

  // Simple variations without personality branding
  const variations: OutfitPersonality[] = [
    {
      id: 'option1' as 'elegant',
      name: 'Option 1',
      description: 'First variation',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      promptModifier: ''
    },
    {
      id: 'option2' as 'romantic',
      name: 'Option 2',
      description: 'Second variation',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      promptModifier: ''
    },
    {
      id: 'option3' as 'bold',
      name: 'Option 3',
      description: 'Third variation',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      promptModifier: ''
    }
  ];

  // Load style preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      const hasPrefs = await stylePreferencesService.hasStylePreferences();
      setHasStylePreferences(hasPrefs);
      if (hasPrefs) {
        const summary = await stylePreferencesService.getStyleSummary();
        setStyleSummary(summary);
        console.log('✨ Style preferences loaded for triple outfit generation:', summary);
      }
    };
    loadPreferences();
  }, []);

  useEffect(() => {
    if (occasion) {
      generateTripleOutfits();
    }
  }, [occasion]);

  // Get user gender-appropriate clothing text
  const getClothingGenderText = (): string => {
    const userData = userDataService.getAllUserData();
    const gender = userData?.profile?.gender || '';

    if (gender === 'male') return "ADULT MEN'S CLOTHING ONLY";
    if (gender === 'female') return "ADULT WOMEN'S CLOTHING ONLY";
    return "ADULT CLOTHING ONLY"; // unisex or not set
  };

  // Get gender-appropriate children's exclusion terms
  const getChildrensExclusionTerms = (): string => {
    const userData = userDataService.getAllUserData();
    const gender = userData?.profile?.gender || '';

    const base = "children's clothes, kids outfit, toddler dress, baby clothes, children's clothing, kids apparel, children wear, toddler outfit, kids fashion, youth clothing, junior sizes, child clothing, juvenile wear, schoolwear, age 2T-16, infant sizes, nursery clothes, preschool outfit, elementary wear, kidswear, childrenwear, tween, tween clothing, pre-teen, preteen, preteen clothing, teen clothing, teenage wear, XXS sizes, petite children, age 16-18, young teen, adolescent clothing, youth sizes XXS";

    if (gender === 'male') return `${base}, boys' clothes, boys outfit, boy's clothing, boys wear, boys sizes, boy sizes, teen boy clothing`;
    if (gender === 'female') return `${base}, girls' clothes, girls outfit, girl's clothing, girls wear, girls sizes, girl sizes, teen girl clothing`;
    return base;
  };

  // Map occasion name to formality descriptor
  const getFormalityDescriptor = (occasionName: string, formalityLevel: string): string => {
    const occasionLower = occasionName.toLowerCase();

    // Check specific occasions first
    if (occasionLower.includes('wedding')) return 'formal attire';
    if (occasionLower.includes('cocktail party')) return 'semi-formal attire';
    if (occasionLower.includes('date night')) return 'semi-formal attire';
    if (occasionLower.includes('business meeting')) return 'professional attire';
    if (occasionLower.includes('casual brunch') || occasionLower.includes('brunch')) return 'casual attire';
    if (occasionLower.includes('night out')) return 'party attire';
    if (occasionLower.includes('job interview') || occasionLower.includes('interview')) return 'professional attire';
    if (occasionLower.includes('festival')) return 'casual festival attire';

    // Fall back to formality level
    if (formalityLevel.includes('formal') || formalityLevel.includes('black-tie')) return 'formal attire';
    if (formalityLevel.includes('semi-formal') || formalityLevel.includes('cocktail')) return 'semi-formal attire';
    if (formalityLevel.includes('business') || formalityLevel.includes('professional')) return 'professional attire';
    if (formalityLevel.includes('casual')) return 'casual attire';
    if (formalityLevel.includes('athletic')) return 'athletic attire';
    if (formalityLevel.includes('party')) return 'party attire';

    return 'casual attire'; // default fallback
  };

  // Get occasion-specific styling modifiers for enhanced context
  const getOccasionModifiers = (occasionName: string): string => {
    const lowerOccasion = occasionName.toLowerCase();

    // Wedding-related occasions
    if (lowerOccasion.includes('wedding')) {
      if (lowerOccasion.includes('beach')) return 'beach wedding appropriate, lightweight breathable fabrics, sand-friendly styling, outdoor ceremony wear';
      if (lowerOccasion.includes('garden')) return 'garden wedding appropriate, outdoor ceremony wear, nature-friendly styling, floral-appropriate';
      return 'wedding-appropriate, elegant ceremony attire, formal event styling, celebration wear';
    }

    // Beach/outdoor occasions
    if (lowerOccasion.includes('beach')) return 'beach-appropriate, lightweight breathable fabrics, resort wear styling, sand-friendly';
    if (lowerOccasion.includes('garden party')) return 'garden party appropriate, outdoor event styling, floral-friendly, daytime elegant';
    if (lowerOccasion.includes('outdoor') || lowerOccasion.includes('picnic')) return 'outdoor event appropriate, weather-appropriate, comfortable for outdoor activities';

    // Professional occasions
    if (lowerOccasion.includes('interview') || lowerOccasion.includes('job')) return 'interview-appropriate, conservative professional styling, business formal, polished appearance';
    if (lowerOccasion.includes('business') || lowerOccasion.includes('meeting')) return 'business-appropriate, professional workplace styling, office-ready';
    if (lowerOccasion.includes('conference') || lowerOccasion.includes('presentation')) return 'conference-appropriate, professional event wear, polished business styling';

    // Evening/social occasions
    if (lowerOccasion.includes('date night') || lowerOccasion.includes('date')) return 'date-appropriate, evening romantic styling, special occasion wear, dinner-ready';
    if (lowerOccasion.includes('cocktail')) return 'cocktail party appropriate, evening social event, semi-formal party wear';
    if (lowerOccasion.includes('gala') || lowerOccasion.includes('ball')) return 'gala-appropriate, formal evening event, luxury occasion wear, black-tie styling';
    if (lowerOccasion.includes('party') || lowerOccasion.includes('celebration')) return 'party-appropriate, social event styling, celebration wear, festive';

    // Casual/daytime occasions
    if (lowerOccasion.includes('brunch')) return 'brunch-appropriate, daytime casual elegant, weekend social wear';
    if (lowerOccasion.includes('festival') || lowerOccasion.includes('concert')) return 'festival-appropriate, concert-ready, comfortable for standing/dancing, bohemian-friendly';
    if (lowerOccasion.includes('vacation') || lowerOccasion.includes('travel')) return 'travel-appropriate, vacation wear, comfortable for activities, versatile styling';

    // Active/athletic occasions
    if (lowerOccasion.includes('gym') || lowerOccasion.includes('workout')) return 'athletic-appropriate, workout-ready, moisture-wicking, performance wear';
    if (lowerOccasion.includes('yoga')) return 'yoga-appropriate, flexible comfortable fit, athletic wear, breathable';

    // Default - no specific modifiers
    return '';
  };

  // Garment type detection - detects specific garment from user input or defaults by formality
  const detectGarmentType = (userInput: string, formality: string): string => {
    const inputLower = userInput.toLowerCase();

    // Check for specific garments mentioned by user
    if (inputLower.includes('dress')) return 'dress';
    if (inputLower.includes('jumpsuit')) return 'jumpsuit';
    if (inputLower.includes('suit')) return 'suit';
    if (inputLower.includes('gown')) return 'gown';
    if (inputLower.includes('blazer')) return 'blazer';
    if (inputLower.includes('skirt')) return 'midi skirt';
    if (inputLower.includes('pants') || inputLower.includes('trousers')) return 'tailored pants';
    if (inputLower.includes('top')) return 'blouse';
    if (inputLower.includes('shirt')) return 'shirt';

    // Default by formality level
    if (formality.includes('formal') || formality.includes('black-tie')) return 'floor-length gown';
    if (formality.includes('semi-formal') || formality.includes('cocktail')) return 'knee-length cocktail dress';
    if (formality.includes('business')) return 'tailored blazer and pants';
    if (formality.includes('casual')) return 'casual dress';
    if (formality.includes('athletic')) return 'activewear set';

    return 'outfit'; // fallback
  };

  // Parse garment details from user input
  const parseGarmentDetails = (input: string): {
    garmentType: string;
    color?: string;
    fabric?: string;
    length?: string;
    fit?: string;
  } => {
    const lowerInput = input.toLowerCase();

    // Extract garment type (prioritize specific types over generic)
    const garmentTypes = [
      'gown', 'gowns', 'ball gown', 'evening gown', 'floor-length gown',
      'dress', 'dresses', 'maxi dress', 'midi dress', 'mini dress',
      'skirt', 'skirts', 'maxi skirt', 'midi skirt', 'mini skirt',
      'jumpsuit', 'jumpsuits',
      'romper', 'rompers',
      'suit', 'suits', 'blazer',
      'pants', 'trousers', 'jeans', 'slacks',
      'jacket', 'coat',
      'top', 'tops', 'blouse', 'shirt', 't-shirt', 'tshirt',
      'outfit'
    ];

    let garmentType = 'outfit'; // default
    for (const type of garmentTypes) {
      if (lowerInput.includes(type)) {
        garmentType = type;
        break;
      }
    }

    // Extract color
    const colorKeywords = ['pink', 'red', 'blue', 'green', 'black', 'white', 'yellow', 'purple', 'brown', 'orange', 'beige', 'navy', 'grey', 'gray', 'cream', 'tan', 'burgundy', 'teal', 'lavender', 'coral', 'emerald', 'olive', 'gold', 'silver'];
    let color: string | undefined;
    for (const colorWord of colorKeywords) {
      if (lowerInput.includes(colorWord)) {
        color = colorWord;
        break;
      }
    }

    // Extract fabric
    const fabricKeywords = ['silk', 'satin', 'cotton', 'linen', 'chiffon', 'velvet', 'denim', 'leather', 'lace', 'knit', 'wool', 'cashmere', 'polyester', 'rayon'];
    let fabric: string | undefined;
    for (const fabricWord of fabricKeywords) {
      if (lowerInput.includes(fabricWord)) {
        fabric = fabricWord;
        break;
      }
    }

    // Extract length
    const lengthKeywords = ['maxi', 'midi', 'mini', 'knee-length', 'floor-length', 'ankle-length', 'long', 'short'];
    let length: string | undefined;
    for (const lengthWord of lengthKeywords) {
      if (lowerInput.includes(lengthWord)) {
        length = lengthWord;
        break;
      }
    }

    // Extract fit/style
    const fitKeywords = ['corset', 'corset top', 'corset bodice', 'fitted', 'tight', 'loose', 'flowy', 'relaxed', 'oversized', 'bodycon', 'a-line', 'wrap', 'shift', 'halter', 'strapless', 'off-shoulder', 'sweetheart'];
    let fit: string | undefined;
    for (const fitWord of fitKeywords) {
      if (lowerInput.includes(fitWord)) {
        fit = fitWord;
        break;
      }
    }

    return { garmentType, color, fabric, length, fit };
  };

  const createPersonalizedPrompt = async (variationIndex: number): Promise<string> => {
    // PRESERVE user's exact input - NEVER modify this
    const userExactInput = occasion.originalInput || occasion.occasion;
    const formality = occasion.formality || 'casual';
    const occasionName = occasion.occasion;

    // Select style interpretation for this variation (3 different styles for 3 variations)
    // Use different styles for each variation to ensure variety
    const styleIndex = variationIndex % styleInterpretations.length;
    const selectedStyle = styleInterpretations[styleIndex];

    // Get formality descriptor for the occasion
    const formalityDescriptor = getFormalityDescriptor(occasionName, formality);

    // Parse garment details to extract primary garment vs style modifiers
    const garmentDetails = parseGarmentDetails(userExactInput);

    // If user specified any details, those become ABSOLUTE requirements across ALL variations
    const userHasColor = !!garmentDetails.color;
    const userHasLength = !!garmentDetails.length;
    const userHasFit = !!garmentDetails.fit;
    const userHasFabric = !!garmentDetails.fabric;

    // Build list of what user specified (these are NON-NEGOTIABLE)
    const userSpecifiedMandatory: string[] = [];
    if (userHasColor) userSpecifiedMandatory.push(`COLOR: ${garmentDetails.color!.toUpperCase()}`);
    if (userHasLength) userSpecifiedMandatory.push(`LENGTH: ${garmentDetails.length}`);
    if (userHasFit) userSpecifiedMandatory.push(`FIT: ${garmentDetails.fit}`);
    if (userHasFabric) userSpecifiedMandatory.push(`FABRIC: ${garmentDetails.fabric}`);

    // Build list of what can vary (for creating 3 different options)
    const variableAspects: string[] = [];
    if (!userHasColor) variableAspects.push('color palette');
    if (!userHasLength) variableAspects.push('length');
    if (!userHasFit) variableAspects.push('fit/silhouette');
    if (!userHasFabric) variableAspects.push('fabric texture');
    // Always can vary these
    variableAspects.push('neckline', 'sleeve style', 'embellishments', 'design details');

    // Determine if this is a complete garment (dress, gown, jumpsuit) vs separates
    const isCompleteGarment = ['gown', 'gowns', 'dress', 'dresses', 'jumpsuit', 'jumpsuits', 'romper', 'rompers'].includes(garmentDetails.garmentType);

    // Determine color and silhouette - user specifications ALWAYS take priority
    const userColor = garmentDetails.color;
    const userHasSpecificFit = garmentDetails.fit || garmentDetails.length;
    // USER COLOR ALWAYS WINS - style variations only affect texture/embellishments
    const finalColor = userColor 
      ? `${userColor} (MANDATORY - EXACT SHADE REQUIRED)` 
      : selectedStyle.colorPalette;
    const finalSilhouette = userHasSpecificFit
      ? `${garmentDetails.fit || ''} ${garmentDetails.length || ''}`.trim()
      : selectedStyle.silhouette;

    // Build the new prompt format - USER REQUEST FIRST, then style interpretation
    const prompt = `COMPLETE USER REQUEST (MANDATORY - NON-NEGOTIABLE): ${userExactInput}

PRIMARY GARMENT TYPE: ${garmentDetails.garmentType.toUpperCase()}

${userSpecifiedMandatory.length > 0 ? `
MANDATORY USER SPECIFICATIONS (MUST BE EXACTLY AS SPECIFIED):
${userSpecifiedMandatory.map(spec => `  ✓ ${spec}`).join('\n')}

THESE SPECIFICATIONS ARE ABSOLUTE AND MUST APPEAR IN ALL 3 VARIATIONS.
` : ''}

${isCompleteGarment ? `CRITICAL: This is a COMPLETE ${garmentDetails.garmentType.toUpperCase()} - ONE SINGLE full-length piece from top to bottom.
All specified features describe DESIGN ELEMENTS of the ${garmentDetails.garmentType}, NOT separate items.
Generate the ENTIRE ${garmentDetails.garmentType} as ONE cohesive garment.

` : ''}VARIABLE ASPECTS FOR CREATING VARIATIONS (Variation ${variationIndex + 1} - ${selectedStyle.name}):
You may vary the following to create a unique option:
${variableAspects.map(aspect => `  • ${aspect}`).join('\n')}

STYLE INTERPRETATION - ${selectedStyle.name.toUpperCase()} VARIATION:
Apply ${selectedStyle.name.toLowerCase()} styling ONLY to the variable aspects above:
- Fabric/Texture Approach: ${selectedStyle.description}
${!userHasColor ? `- Color Palette: ${selectedStyle.colorPalette}` : `- Color: KEEP ${garmentDetails.color?.toUpperCase()} (USER SPECIFIED - DO NOT CHANGE)`}
${!userHasLength && !userHasFit ? `- Silhouette: ${selectedStyle.silhouette}` : `- Silhouette: KEEP ${(garmentDetails.fit || '') + ' ' + (garmentDetails.length || '')} (USER SPECIFIED - DO NOT CHANGE)`}

OCCASION CONTEXT: ${occasionName}, ${formalityDescriptor}${getOccasionModifiers(occasionName) ? `
OCCASION-SPECIFIC REQUIREMENTS: ${getOccasionModifiers(occasionName)}` : ''}

REQUIREMENTS: Full-sized adult clothing proportions only - ${getClothingGenderText()}
CRITICAL: This outfit MUST be appropriate for: ${occasionName}

CRITICAL HIERARCHY:
1. User's mandatory specifications above are ABSOLUTE and NON-NEGOTIABLE across ALL 3 variations
2. Style interpretation applies ONLY to variable aspects: ${variableAspects.join(', ')}
3. Create uniqueness through different: ${variableAspects.filter(a => !a.includes('/')).join(', ')}

${userHasColor ? `
EXAMPLE: For "yellow dress", ALL 3 variations must be YELLOW:
  Variation 1 (Romantic): Yellow A-line dress, lace trim, sweetheart neckline, flowing chiffon
  Variation 2 (Elegant): Yellow sheath dress, tailored fit, V-neck, structured silk
  Variation 3 (Edgy): Yellow bodycon dress, asymmetric cut, off-shoulder, bold design
  (All are YELLOW, all are DRESSES, varying ONLY in style details)
` : ''}
Generate ONE SINGLE complete outfit matching the specific request above.

CRITICAL COMPOSITION RULES:
1. If request mentions multiple items (like "capris and top", "pants and shirt"), they MUST be arranged together in a SINGLE cohesive flat-lay composition
2. Multiple items must be positioned as if being worn together - tops positioned above bottoms, layered naturally
3. Items should overlap slightly to show they form ONE complete outfit, not separate pieces
4. DO NOT generate separate/isolated items laid out individually
5. DO NOT show multiple outfit options side-by-side
6. Result must be ONE unified outfit composition suitable for virtual try-on as a single garment set

MUST INCLUDE: Complete clothing items only (tops, bottoms, dresses, jumpsuits, blazers, jackets, coats, cardigans, skirts, pants, rompers). All clothing pieces must be arranged in a SINGLE cohesive outfit layout showing how they work together.

MUST EXCLUDE: All accessories including shoes, footwear, bags, purses, scarves, jewelry, hats, belts, sunglasses, gloves. No accessories of any kind.

MUST BE ADULT CLOTHING ONLY - absolutely no children's clothes, no kids' outfits, no toddler clothes, no baby clothes, no youth sizes.

FORBIDDEN: Multiple separate items laid out individually, side-by-side outfit comparisons, outfit variations shown together, 2+ distinct pieces displayed separately.

Flat-lay product photography style, clean white background, professional lighting, no person, no model, no text, no labels, no tags, no size indicators. Result must be one cohesive, wearable outfit composition suitable for virtual try-on.`;

    console.log(`✨ Variation ${variationIndex + 1} Generation:`);
    console.log(`   User Request: "${userExactInput}"`);
    console.log(`   Mandatory Specs: ${userSpecifiedMandatory.join(', ') || 'None - style has freedom'}`);
    console.log(`   Variable Aspects: ${variableAspects.join(', ')}`);
    console.log(`   Style Variation: ${selectedStyle.name}`);
    console.log(`   Occasion: ${occasionName}, ${formalityDescriptor}`);
    if (userHasColor) {
      console.log(`   🎨 COLOR LOCKED: ${garmentDetails.color?.toUpperCase()} (user specified)`);
    }
    if (userHasLength) {
      console.log(`   📏 LENGTH LOCKED: ${garmentDetails.length} (user specified)`);
    }
    if (userHasFit) {
      console.log(`   👗 FIT LOCKED: ${garmentDetails.fit} (user specified)`);
    }

    return prompt;
  };

  const createCleanSearchPrompt = (): string => {
    // Enhanced search prompt with context
    const basePrompt = occasion.occasion;
    const formalityContext = occasion.formality ? `${occasion.formality}` : '';

    // Add weather context for better matching
    let weatherContext = '';
    if (occasion.weather) {
      const temp = occasion.weather.temperature;
      if (temp < 60) {
        weatherContext = 'warm layers';
      } else if (temp > 80) {
        weatherContext = 'breathable summer';
      } else {
        weatherContext = 'comfortable';
      }
    }

    // Return enhanced search prompt
    return `${weatherContext} ${basePrompt} ${formalityContext}`.trim();
  };

  /**
   * Analyze generated outfit image to extract colors, styles, and garment types
   * This creates much more specific search queries for better product matching
   */
  const analyzeOutfitImage = async (imageUrl: string, personalityName: string): Promise<string> => {
    try {
      console.log('🔍 [IMAGE-ANALYSIS] Analyzing outfit image for better search matching...');

      // Convert image to base64 for Claude Vision API
      const base64Image = await imageToBase64(imageUrl);

      const response = await fetch(apiConfig.getEndpoint('/api/claude/v1/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: base64Image
                  }
                },
                {
                  type: 'text',
                  text: `User searched for: "${occasion.originalInput || occasion.occasion}"

Analyze this outfit image and create a SHORT shopping search query.

RULES:
1. START with user's exact keywords (e.g., if they said "blue dress", START with "blue dress")
2. Add ONLY 1-2 core visible details (length/style if obvious)
3. Keep query under 5 words total
4. DO NOT over-describe or add excessive adjectives

Examples:
- User: "blue dress" → Return: "blue maxi dress"
- User: "casual top" → Return: "casual striped top"
- User: "black pants" → Return: "black wide leg pants"
- User: "red skirt" → Return: "red midi skirt"

CRITICAL: Preserve user's original intent. Less is more.

Return ONLY the search query, nothing else.`
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const result = await response.json();
      const searchQuery = result.content?.[0]?.text?.trim() || '';

      console.log('✅ [IMAGE-ANALYSIS] Extracted search query:', searchQuery);
      return searchQuery;

    } catch (error) {
      console.error('❌ [IMAGE-ANALYSIS] Failed:', error);
      // Fallback to basic prompt
      return createCleanSearchPrompt();
    }
  };

  /**
   * Convert image URL to base64
   */
  const imageToBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Image to base64 conversion failed:', error);
      throw error;
    }
  };

  /**
   * Extract colors from outfits in background (non-blocking)
   */
  const extractColorsInBackground = async (savedOutfits: any[]) => {
    console.log('🎨 [COLOR-EXTRACTION] Starting background color analysis for', savedOutfits.length, 'outfits');

    // Color extraction temporarily disabled for deployment
    /* Commented out for deployment
    // Process each outfit's colors in parallel (non-blocking)
    Promise.all(
      savedOutfits.map(async (outfit) => {
        try {
          // Extract colors from the image
          const analysis = await colorAnalysisService.analyzeImage(outfit.image_url);

          if (analysis) {
            // Save color data to Supabase
            await outfitStorageService.updateOutfitColors(
              outfit.id,
              analysis.primaryColors,
              analysis.palette
            );

            console.log(`🎨 [COLOR-EXTRACTION] Extracted colors for outfit ${outfit.id}:`, {
              primaryColors: analysis.primaryColors,
              dominantColor: analysis.dominantColor,
              colorFamily: analysis.colorFamily,
              brightness: analysis.brightness,
              saturation: analysis.saturation
            });
          }
        } catch (error) {
          console.error(`❌ [COLOR-EXTRACTION] Failed to extract colors for outfit ${outfit.id}:`, error);
          // Don't throw - just log and continue with other outfits
        }
      })
    ).then(() => {
      console.log('✅ [COLOR-EXTRACTION] Background color analysis complete');
    }).catch((error) => {
      console.error('❌ [COLOR-EXTRACTION] Background color analysis failed:', error);
    });
    */
  };

  const generateReasoning = (): string[] => {
    const reasons = [];

    // Occasion-based reasoning
    if (occasion.formality === 'formal') {
      reasons.push('Formal dress code appropriate');
    } else if (occasion.formality === 'casual') {
      reasons.push('Comfortable for casual setting');
    }

    // Location-based reasoning
    if (occasion.tags && occasion.tags.includes('beach')) {
      reasons.push('Won\'t drag in sand, beach-appropriate');
    } else if (occasion.tags && occasion.tags.includes('work')) {
      reasons.push('Professional and workplace-suitable');
    }

    // General reasoning
    reasons.push('Perfectly suited for the occasion');

    return reasons;
  };

  // Generate unique seed for each variation using fixed ranges
  const generateVariationSeed = (variationIndex: number): number => {
    // Fixed seed ranges for each variation to ensure distinct outputs
    const seedRanges = [
      { min: 1000, max: 2000 }, // Variation 1
      { min: 3000, max: 4000 }, // Variation 2
      { min: 5000, max: 6000 }  // Variation 3
    ];

    const range = seedRanges[variationIndex] || { min: 1000, max: 2000 };
    const seed = range.min + Math.floor(Math.random() * (range.max - range.min));

    console.log(`🎲 [SEED] Variation ${variationIndex + 1} seed: ${seed} (range ${range.min}-${range.max})`);
    return seed;
  };

  const generateTripleOutfits = async () => {
    setIsGenerating(true);
    setGenerationProgress('Generating your personalized outfit options...');

    try {
      const outfitPromises = variations.map(async (variation, index) => {
        const prompt = await createPersonalizedPrompt(index);
        const seed = generateVariationSeed(index);

        setGenerationProgress(`Creating ${variation.name.toLowerCase()}...`);

        // Parse garment details to build defensive negative prompt
        const userInput = occasion.originalInput || occasion.occasion;
        const garmentDetails = parseGarmentDetails(userInput);
        const isCompleteGarment = ['gown', 'gowns', 'dress', 'dresses', 'jumpsuit', 'jumpsuits', 'romper', 'rompers'].includes(garmentDetails.garmentType);

        // Add partial garment exclusions for complete garments (dresses, gowns, jumpsuits)
        const partialGarmentExclusions = isCompleteGarment
          ? ', crop top only, corset top only, corset only, bodice only, top only, top without skirt, partial garment, incomplete dress, incomplete gown, separated top and bottom, top and skirt as separate pieces, bodice without attached skirt, upper portion only, torso only, bust only'
          : '';

        // Add style-specific negative exclusions to ensure variety between outfits
        const styleIndex = index % styleInterpretations.length;
        const selectedStyle = styleInterpretations[styleIndex];
        const styleExclusions = selectedStyle.negativeExclusions ? `, ${selectedStyle.negativeExclusions}` : '';

        // Add guidance_scale variation to increase diversity between outfits
        // Different guidance values create different levels of prompt adherence
        const guidanceScales = [7.5, 9.0, 10.5]; // Variation 1: moderate, Variation 2: high, Variation 3: very high
        const guidanceScale = guidanceScales[index] || 9.0;

        console.log(`🎨 [VARIATION ${index + 1}] Style: ${selectedStyle.name}, Guidance: ${guidanceScale}, Seed: ${seed}`);

        // Use proxy endpoint instead of direct FAL client to avoid 401 errors
        const response = await fetch(apiConfig.getEndpoint('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            negative_prompt: `${getChildrensExclusionTerms()}, children, kids, child, youth, junior, toddler, baby, infant, boy, girl, ages 0-16, age 2T-16, youth sizes, junior sizing, kid sizes, text, labels, tags, size labels, "XS", "S", "M", "L", "XL", "XXL", size chart, sizing guide, price tags, clothing tags, printed text, written text, typography, letters, words, size indicators, multiple outfits, 2 dresses, 2 outfits, outfit comparison, variations, side by side, outfit options, outfit choices, multiple options, two outfits, several outfits, duplicate outfits, separate items, isolated clothing, individual pieces laid out separately, disconnected garments, spread out items, separated clothing pieces, items not touching, far apart clothing, clothing items with gaps between them, non-cohesive layout, disjointed outfit, fragmented composition${partialGarmentExclusions}${styleExclusions}, shoes, footwear, boots, sneakers, heels, sandals, slippers, pumps, wedges, flats, loafers, oxfords, mules, espadrilles, bags, purse, handbag, shoulder bag, clutch, tote, backpack, crossbody, satchel, wallet, pouch, scarves, scarf, shawl, wrap, pashmina, bandana, jewelry, necklace, bracelet, earrings, rings, watch, chain, pendant, anklet, accessories, accessory, belt, hat, cap, beanie, fedora, beret, visor, headband, hair accessories, sunglasses, glasses, eyewear, gloves, mittens`,
            image_size: { height: 1536, width: 1536 },
            num_images: 1,
            enable_safety_checker: true,
            seed, // Force unique outputs per variation
            num_inference_steps: 28, // Increase quality and variation
            guidance_scale: guidanceScale // Vary prompt adherence per outfit for diversity
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        setGenerationProgress(`Generating ${variation.name.toLowerCase()}...`);

        if (!result.images || result.images.length === 0) {
          throw new Error(`Failed to generate ${variation.name} outfit`);
        }

        const reasoning = generateReasoning();

        // Analyze the generated outfit image to create intelligent search prompts
        const searchPrompt = await analyzeOutfitImage(result.images[0].url, variation.name);

        return {
          personality: variation,
          imageUrl: result.images[0].url,
          reasoning,
          priceRange: '', // Will be set when user selects budget
          confidence: 0.85 + Math.random() * 0.1, // Mock confidence between 85-95%
          isSelected: false,
          originalPrompt: prompt,
          searchPrompt: searchPrompt,
          seed // Store seed for database
        };
      });

      const generatedOutfits = await Promise.all(outfitPromises);
      setOutfits(generatedOutfits);

      // Save all 3 outfits to Supabase with color analysis
      try {
        const userData = userDataService.getAllUserData();
        const gender = userData?.profile?.gender || 'unisex';

        const outfitsToSave = generatedOutfits.map(outfit => ({
          occasion: occasion.name,
          style: outfit.personality.id,
          imageUrl: outfit.imageUrl,
          userPrompt: occasion.userInput || occasion.name,
          gender: gender,
          seedreamSeed: outfit.seed
        }));

        const savedOutfits = await outfitStorageService.saveMultipleOutfits(outfitsToSave);

        // Update outfits with Supabase IDs
        if (savedOutfits.length === generatedOutfits.length) {
          const updatedOutfits = generatedOutfits.map((outfit, index) => ({
            ...outfit,
            supabaseId: savedOutfits[index]?.id
          }));
          setOutfits(updatedOutfits);
          console.log('✅ [TRIPLE-OUTFIT] Saved 3 outfits to Supabase');

          // Extract colors from all outfits in background (non-blocking)
          extractColorsInBackground(savedOutfits);
        }
      } catch (error) {
        console.error('❌ [TRIPLE-OUTFIT] Failed to save outfits to Supabase:', error);
        // Continue anyway - don't block user experience
      }

      setGenerationProgress('All outfit options ready!');
      setTimeout(() => setGenerationProgress(''), 2000);

    } catch (error) {
      console.error('Triple outfit generation failed:', error);
      setGenerationProgress('Generation failed. Please try again.');
      setTimeout(() => setGenerationProgress(''), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOutfitSelect = async (outfit: GeneratedOutfit) => {
    const updatedOutfits = outfits.map(o => ({
      ...o,
      isSelected: o.personality.id === outfit.personality.id
    }));
    setOutfits(updatedOutfits);
    setSelectedOutfit(outfit);
    onOutfitSelected(outfit);

    // Track click in Supabase
    try {
      if (outfit.supabaseId) {
        await outfitStorageService.markOutfitClicked(outfit.supabaseId);

        const userData = userDataService.getAllUserData();
        const userId = userData?.profile?.email || 'anonymous';

        await outfitStorageService.trackInteraction(
          userId,
          'outfit_clicked',
          outfit.personality.id,
          {
            outfit_id: outfit.supabaseId,
            occasion: occasion.name,
            style: outfit.personality.name
          }
        );

        console.log('✅ [TRIPLE-OUTFIT] Tracked outfit click');
      }
    } catch (error) {
      console.error('❌ [TRIPLE-OUTFIT] Failed to track click:', error);
      // Continue anyway - don't block user experience
    }

    // Directly trigger try-on if avatar exists (budget selection moved to "Shop This Look")
    if (avatarData?.imageUrl) {
      await handleApplyToAvatar(outfit);
    }
  };

  const handleApplyToAvatar = async (outfit: GeneratedOutfit) => {
    if (!avatarData?.imageUrl) {
      alert('Avatar not available for try-on');
      return;
    }

    setIsApplying(true);
    try {
      console.log('🎭 Starting FASHN virtual try-on for occasion outfit...');

      // Step 1: Detect if outfit image contains multiple items
      console.log('🔍 [TRY-ON] Checking for multiple items in outfit image...');
      const detection = await multiItemDetectionService.detectMultipleItems(outfit.imageUrl);

      let tryOnResult;

      if (detection.hasMultipleItems && detection.items.length > 1) {
        // Multiple items detected - use sequential layering
        console.log(`📦 [TRY-ON] Detected ${detection.items.length} separate items, using sequential layering`);
        console.log('📋 [TRY-ON] Items detected:', detection.items.map(i => `${i.name} (${i.category})`));

        // Convert detected items to ClothingItem format
        const clothingItems = detection.items.map((item, idx) => ({
          id: `${outfit.personality.id}-item-${idx}`,
          name: item.name,
          imageUrl: item.croppedImageUrl || outfit.imageUrl,
          category: mapCategoryToClothingCategory(item.category),
          clothingType: mapCategoryToClothingType(item.category),
          layer: 0 // Will be determined by completeFashnTryOnService
        }));

        // Apply items sequentially (bottom first, then top)
        const sequentialResult = await completeFashnTryOnService.applyOutfitSequentially(
          avatarData.imageUrl,
          clothingItems
        );

        if (sequentialResult.success && sequentialResult.finalImageUrl) {
          console.log('✅ [TRY-ON] Sequential layering completed successfully');
          tryOnResult = {
            success: true,
            imageUrl: sequentialResult.finalImageUrl
          };
        } else {
          throw new Error('Sequential layering failed - falling back to single image try-on');
        }
      } else {
        // Single cohesive outfit - use standard try-on
        console.log('👔 [TRY-ON] Single cohesive outfit detected, using standard try-on');

        tryOnResult = await directFashnService.tryOnClothing(
          avatarData.imageUrl,    // Your avatar
          outfit.imageUrl,        // The generated clothing from Seedream
          {
            category: 'auto',     // Let FASHN auto-detect clothing category
            timeout: 90000,       // 90 seconds - FASHN typically takes 40-50s
            garmentDescription: outfit.originalPrompt || outfit.searchPrompt, // Use prompt for intelligent segmentation
            context: 'try_on',    // Use JPEG for speed during try-on
            source: 'ai-generated' // AI-generated outfits are flat-lay style
          }
        );
      }

      if (tryOnResult?.success && tryOnResult?.imageUrl) {
        console.log('✅ Virtual try-on completed:', tryOnResult.imageUrl);
        onOutfitApplied(outfit, tryOnResult.imageUrl); // Use FASHN result, not raw clothing
      } else {
        throw new Error('FASHN try-on failed - no result returned');
      }
    } catch (error) {
      console.error('❌ Virtual try-on failed:', error);
      alert(`Try-on failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsApplying(false);
    }
  };

  // Helper function to map detection categories to ClothingItem category
  const mapCategoryToClothingCategory = (category: string): 'shirts' | 'pants' | 'dresses' | 'shoes' | 'accessories' => {
    const categoryMap: { [key: string]: 'shirts' | 'pants' | 'dresses' | 'shoes' | 'accessories' } = {
      'tops': 'shirts',
      'pants': 'pants',
      'dresses': 'dresses',
      'shoes': 'shoes',
      'accessories': 'accessories',
      'outerwear': 'shirts',
      'sweaters': 'shirts',
      'other': 'shirts'
    };
    return categoryMap[category] || 'shirts';
  };

  // Helper function to map detection categories to ClothingItem clothingType
  const mapCategoryToClothingType = (category: string): 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'hat' | 'jewelry' | 'bag' | 'belt' => {
    const typeMap: { [key: string]: 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'hat' | 'jewelry' | 'bag' | 'belt' } = {
      'tops': 'top',
      'pants': 'bottom',
      'dresses': 'dress',
      'shoes': 'shoes',
      'accessories': 'jewelry',
      'outerwear': 'outerwear',
      'sweaters': 'outerwear',
      'other': 'top'
    };
    return typeMap[category] || 'top';
  };

  const handleShareOutfit = (outfit: GeneratedOutfit) => {
    setShareOutfit(outfit);
    setShowShareModal(true);
  };

  const handleDownloadOutfit = async (shareId: string) => {
    if (!shareOutfit) return;

    try {
      await imageExporter.downloadImage(shareOutfit.imageUrl, {
        fileName: `outfit-${occasion.occasion.replace(/\s+/g, '-').toLowerCase()}`,
        addWatermark: true
      });
    } catch (error) {
      console.error('Failed to download outfit:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const handleImagePreview = (outfit: GeneratedOutfit) => {
    console.log('🔍 [PREVIEW] Preview button clicked for outfit:', outfit.personality.name);
    console.log('🖼️ [PREVIEW] Opening zoom modal with image:', outfit.imageUrl);
    setZoomOutfit(outfit);
    setShowImageZoom(true);
    console.log('✅ [PREVIEW] Zoom modal state set to true');
  };

  const handleAddToCalendar = (outfit: GeneratedOutfit) => {
    console.log('📅 [CALENDAR] Opening calendar modal for outfit:', outfit.personality.name);

    // Prepare outfit data for calendar
    setOutfitToSave({
      outfit: outfit,
      occasion: occasion.occasion,
      image: outfit.imageUrl,
      avatarUrl: outfit.imageUrl,
      imageUrl: outfit.imageUrl,
      description: `${outfit.personality.name} outfit for ${occasion.occasion}`,
      personality: outfit.personality,
      searchPrompt: outfit.searchPrompt,
      originalPrompt: outfit.originalPrompt
    });

    // Open the modal
    setShowCalendarModal(true);
    console.log('✅ [CALENDAR] Calendar modal opened');
  };

  const handleCalendarSave = (calendarEntry: any) => {
    console.log('💾 [CALENDAR] Calendar entry saved:', calendarEntry);
    // Modal will be closed by CalendarEntryModal component
    setShowCalendarModal(false);
  };

  if (isGenerating) {
    return (
      <div className={`triple-outfit-generator ${className}`}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Creating Your Perfect Outfits</h3>
            <p className="text-gray-600 mb-6">
              Generating 3 personalized options for your {occasion.occasion}
            </p>
            <div className="max-w-md mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
              <p className="text-sm text-gray-500">{generationProgress}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`triple-outfit-generator ${className}`}>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header with Occasion Context */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            Perfect for your {occasion.occasion}
          </h3>

          {hasStylePreferences && (
            <div className="mt-2 mb-3 inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Personalized to your style: {styleSummary}</span>
            </div>
          )}

          {/* Date/Time/Weather display removed - was showing placeholder demo data */}
        </div>

        {/* Triple Outfit Display */}
        <div className="space-y-6">
          {outfits.map((outfit) => (
            <div
              key={outfit.personality.id}
              className={`block w-full relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                outfit.isSelected ? 'border-purple-500 shadow-lg ring-4 ring-purple-100' : 'border-gray-200'
              }`}
            >
              {/* Simple Header */}
              <div className="p-4 border-b bg-purple-50 border-purple-200 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg text-purple-600">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{outfit.personality.name}</h4>
                    </div>
                  </div>
                  {outfit.isSelected && (
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Outfit Image */}
              <div className="p-6">
                <div className="relative aspect-[3/4] min-h-[400px] max-w-sm mx-auto bg-gray-100 rounded-xl overflow-hidden mb-4">
                  <img
                    src={outfit.imageUrl}
                    alt={`${outfit.personality.name} outfit`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity duration-200 flex items-center justify-center">
                    <button
                      onClick={() => handleImagePreview(outfit)}
                      className="opacity-0 hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-opacity duration-200"
                    >
                      <Eye className="w-4 h-4 inline mr-2" />
                      Preview
                    </button>
                  </div>
                </div>

                {/* Why We Picked This */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Why we picked this:</h5>
                  <ul className="space-y-1">
                    {outfit.reasoning.map((reason, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Match Confidence */}
                <div className="flex justify-end mb-4">
                  <div className="text-xs text-gray-500">
                    {Math.round(outfit.confidence * 100)}% match
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {avatarData?.imageUrl ? (
                    <button
                      onClick={() => handleOutfitSelect(outfit)}
                      disabled={isApplying}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                        outfit.isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                      }`}
                    >
                      {isApplying ? (
                        <>
                          <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                          Trying On...
                        </>
                      ) : outfit.isSelected ? (
                        <>
                          <Check className="w-4 h-4 inline mr-2" />
                          Tried On
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 inline mr-2" />
                          Try This On
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => alert('Please create an avatar first to try on outfits')}
                      className="w-full py-3 px-4 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      Try This On (Create Avatar First)
                    </button>
                  )}

                  {/* Shop This Look - Only show on selected outfit AFTER try-on */}
                  {outfit.isSelected && hasTriedOn && onShopThisLook && (
                    <button
                      onClick={onShopThisLook}
                      className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-colors shadow-lg flex items-center justify-center space-x-2"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Shop This Look</span>
                    </button>
                  )}

                  {/* Calendar Button */}
                  <button
                    onClick={() => handleAddToCalendar(outfit)}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Add to Calendar</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShareOutfit(outfit)}
                    className="w-full py-2 px-4 border border-blue-300 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Outfit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Generate New Options */}
        <div className="text-center">
          <button
            onClick={generateTripleOutfits}
            disabled={isGenerating}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Generate New Options</span>
          </button>
        </div>

        {generationProgress && (
          <div className="text-center">
            <p className="text-sm text-purple-600 font-medium">{generationProgress}</p>
          </div>
        )}
      </div>

      {/* Calendar Modal */}
      {showCalendarModal && outfitToSave && (
        <CalendarEntryModal
          outfit={outfitToSave}
          onSave={handleCalendarSave}
          onClose={() => setShowCalendarModal(false)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && shareOutfit && (
        <ShareModal
          outfitData={{
            avatarImageUrl: avatarData?.imageUrl || '',
            outfitImageUrl: shareOutfit.imageUrl,
            outfitDetails: {
              description: shareOutfit.originalPrompt,
              occasion: occasion.occasion,
              weather: occasion.weather
                ? `${occasion.weather.temperature}°F ${occasion.weather.weatherDescription}`
                : undefined,
              formality: occasion.formality,
              date: occasion.date,
              time: occasion.time,
              location: occasion.location
            },
            generatedBy: 'occasion-planner'
          }}
          onClose={() => {
            setShowShareModal(false);
            setShareOutfit(null);
          }}
          onDownload={handleDownloadOutfit}
        />
      )}

      {/* Image Zoom Modal */}
      {showImageZoom && zoomOutfit && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageZoom(false)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setShowImageZoom(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {zoomOutfit.personality.name} Outfit
                  </h3>
                  <p className="text-sm text-gray-600">
                    {occasion.occasion}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${zoomOutfit.personality.bgColor}`}>
                  {zoomOutfit.personality.description}
                </div>
              </div>
              <div className="bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center min-h-[600px]">
                <img
                  src={zoomOutfit.imageUrl}
                  alt={`${zoomOutfit.personality.name} outfit`}
                  className="w-full h-auto max-h-[85vh] max-w-[700px] object-contain mx-auto"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripleOutfitGenerator;