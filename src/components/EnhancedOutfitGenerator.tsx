import React, { useState, useEffect } from 'react';
import {
  Zap,
  Calendar,
  MapPin,
  Clock,
  Thermometer,
  Plane,
  Briefcase,
  Users,
  Home,
  Dumbbell,
  ChevronRight,
  ChevronLeft,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Heart,
  ShoppingCart,
  Sparkles
} from 'lucide-react';
import directFashnService from '../services/directFashnService';
import stylePreferencesService from '../services/stylePreferencesService';
import userDataService from '../services/userDataService';
import outfitStorageService from '../services/outfitStorageService';
import colorAnalysisService from '../services/colorAnalysisService';
import SmartOccasionPlanner from './SmartOccasionPlanner';

interface EnhancedOutfitGeneratorProps {
  onOutfitGenerate?: (outfitData: any) => void;
  avatarData?: any;
  onAvatarUpdate?: (avatarData: any) => void;
  onItemGenerated?: (imageUrl: string, prompt: string) => void;
  className?: string;
}

type GeneratorMode = 'quick' | 'occasion';
type Step = 1 | 2 | 3;

interface OccasionData {
  category: string;
  subcategory?: string;
  date?: string;
  location?: string;
  timeOfDay?: string;
  weatherTemp?: number;
  additionalContext?: string;
}

const EnhancedOutfitGenerator: React.FC<EnhancedOutfitGeneratorProps> = ({
  onOutfitGenerate,
  avatarData,
  onAvatarUpdate,
  onItemGenerated,
  className = ''
}) => {
  const [mode, setMode] = useState<GeneratorMode>('quick');
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionData>({
    category: '',
    weatherTemp: 72
  });
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');

  // Enhanced workflow state for clothing preview
  const [generatedClothingImage, setGeneratedClothingImage] = useState<string | null>(null);
  const [showClothingPreview, setShowClothingPreview] = useState(false);
  const [enhancedClothingPrompt, setEnhancedClothingPrompt] = useState('');
  const [isApplyingToAvatar, setIsApplyingToAvatar] = useState(false);
  const [clothingCategory, setClothingCategory] = useState<'tops' | 'bottoms' | 'one-pieces' | 'auto'>('auto');

  // Style preferences state
  const [hasStylePreferences, setHasStylePreferences] = useState(false);
  const [styleSummary, setStyleSummary] = useState('');

  // Service availability check
  const isSeamlessServiceAvailable = true; // Using working FASHN service instead

  // Load style preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      const hasPrefs = await stylePreferencesService.hasStylePreferences();
      setHasStylePreferences(hasPrefs);
      if (hasPrefs) {
        const summary = await stylePreferencesService.getStyleSummary();
        setStyleSummary(summary);
        console.log('✨ Style preferences loaded:', summary);
      }
    };
    loadPreferences();
  }, []);

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

    const base = "children's clothes, kids outfit, toddler dress, baby clothes, children's clothing, kids apparel, children wear, toddler outfit, kids fashion";

    if (gender === 'male') return `${base}, boys' clothes, boys outfit, boy's clothing`;
    if (gender === 'female') return `${base}, girls' clothes, girls outfit, girl's clothing`;
    return base;
  };

  // Weather icon helper
  const getWeatherIcon = (temp: number) => {
    if (temp < 40) return <Snowflake className="w-4 h-4 text-blue-300" />;
    if (temp < 60) return <Cloud className="w-4 h-4 text-gray-400" />;
    if (temp < 75) return <CloudRain className="w-4 h-4 text-blue-500" />;
    return <Sun className="w-4 h-4 text-yellow-500" />;
  };

  // Occasion categories
  const occasionCategories = [
    {
      id: 'travel',
      name: 'Travel & Vacation',
      icon: <Plane className="w-6 h-6" />,
      color: 'bg-blue-500',
      subcategories: [
        { id: 'beach', name: 'Beach Vacation', needsWeather: true },
        { id: 'city', name: 'City Trip', needsWeather: true },
        { id: 'mountain', name: 'Mountain/Hiking', needsWeather: true },
        { id: 'business_travel', name: 'Business Travel', needsWeather: false },
        { id: 'cruise', name: 'Cruise', needsWeather: false }
      ]
    },
    {
      id: 'formal',
      name: 'Formal Events',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'bg-purple-500',
      subcategories: [
        { id: 'wedding_guest', name: 'Wedding Guest', options: ['Garden', 'Beach', 'Church', 'Evening'] },
        { id: 'gala', name: 'Gala/Black Tie', needsWeather: false },
        { id: 'conference', name: 'Business Conference', needsWeather: false },
        { id: 'awards', name: 'Awards Ceremony', needsWeather: false },
        { id: 'religious', name: 'Religious Ceremonies', options: ['Wedding', 'Funeral', 'Baptism', 'Bar Mitzvah'] }
      ]
    },
    {
      id: 'social',
      name: 'Social Occasions',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-green-500',
      subcategories: [
        { id: 'dinner_party', name: 'Dinner Party', options: ['Casual', 'Formal', 'Outdoor'] },
        { id: 'birthday', name: 'Birthday Party', options: ['Daytime', 'Evening', 'Club', 'Home'] },
        { id: 'date_night', name: 'Date Night', needsWeather: false },
        { id: 'cocktail', name: 'Cocktail Party', needsWeather: false },
        { id: 'festive', name: 'Festive/Holiday Events', options: ['Christmas', 'Halloween', 'NYE', 'Theme Party'] }
      ]
    },
    {
      id: 'daily',
      name: 'Daily Life',
      icon: <Home className="w-6 h-6" />,
      color: 'bg-orange-500',
      subcategories: [
        { id: 'work_office', name: 'Work From Office', options: ['Casual', 'Business Casual', 'Formal'] },
        { id: 'work_home', name: 'Work From Home', needsWeather: false },
        { id: 'errands', name: 'Running Errands', needsWeather: true },
        { id: 'home_relax', name: 'Relaxing at Home', needsWeather: false },
        { id: 'school', name: 'School/University', needsWeather: true }
      ]
    },
    {
      id: 'activities',
      name: 'Activities',
      icon: <Dumbbell className="w-6 h-6" />,
      color: 'bg-red-500',
      subcategories: [
        { id: 'gym', name: 'Gym/Working Out', options: ['Cardio', 'Weights', 'Yoga', 'Outdoor'] },
        { id: 'sports_event', name: 'Sports Event (Attending)', needsWeather: true },
        { id: 'outdoor_activities', name: 'Outdoor Activities', needsWeather: true },
        { id: 'concert', name: 'Concert/Festival', needsWeather: true }
      ]
    }
  ];

  const handleModeSwitch = () => {
    setMode(mode === 'quick' ? 'occasion' : 'quick');
    setCurrentStep(1);
    setSelectedOccasion({ category: '', weatherTemp: 72 });
    setQuickPrompt('');
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedOccasion(prev => ({ ...prev, category: categoryId }));
    setCurrentStep(2);
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedOccasion(prev => ({ ...prev, subcategory: subcategoryId }));
    setCurrentStep(3);
  };

  /**
   * Extract colors from outfit in background (non-blocking)
   */
  const extractColorsInBackground = async (outfit: any) => {
    console.log('🎨 [COLOR-EXTRACTION] Starting color analysis for outfit', outfit.id);

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
      // Don't throw - just log
    }
  };

  const handleGenerateOutfit = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setGenerationProgress('Starting outfit generation...');

    try {
      if (mode === 'quick') {
        await handleQuickGenerate();
      } else {
        await handleOccasionGenerate();
      }
    } catch (error) {
      console.error('❌ Outfit generation failed:', error);
      setGenerationProgress('Generation failed. Please try again.');
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress('');
      }, 3000);
    }
  };

  const handleQuickGenerate = async () => {
    console.log('🚀 Starting clothing generation with Seedream V4...');

    if (!isSeamlessServiceAvailable) {
      throw new Error('Seamless Try-On Service is not available. Please check your API configuration.');
    }

    const clothingPrompt = await enhanceClothingPrompt(quickPrompt);
    console.log('📝 Enhanced clothing prompt:', clothingPrompt);
    setEnhancedClothingPrompt(clothingPrompt);

    // Step 1: Generate clothing only using Seedream V4
    setGenerationProgress('Generating clothing from your description...');

    // Use proxy endpoint instead of direct FAL client to avoid 401 errors
    const response = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `${clothingPrompt}, ${getClothingGenderText()} - no children's clothes, no kids' outfits`,
        negative_prompt: `${getChildrensExclusionTerms()}, multiple outfits, duplicate outfits`,
        image_size: { height: 2048, width: 2048 },
        num_images: 1,
        enable_safety_checker: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    setGenerationProgress('Generating clothing...');

    if (!result.images || result.images.length === 0) {
      throw new Error('Failed to generate clothing image');
    }

    const imageUrl = result.images[0].url;

    console.log('✅ Clothing generated successfully:', imageUrl);

    // Save to Supabase with color extraction
    try {
      const userData = userDataService.getAllUserData();
      const userId = userData?.profile?.email || 'anonymous';
      const gender = userData?.profile?.gender || 'unisex';

      const savedOutfit = await outfitStorageService.saveOutfit(userId, {
        occasion: 'Quick Generate',
        style: 'quick_generate',
        imageUrl: imageUrl,
        userPrompt: quickPrompt,
        gender: gender
      });

      if (savedOutfit) {
        console.log('✅ [QUICK-GENERATE] Saved outfit to Supabase');

        // Extract colors in background (non-blocking)
        extractColorsInBackground(savedOutfit);
      }
    } catch (error) {
      console.error('❌ [QUICK-GENERATE] Failed to save to Supabase:', error);
      // Continue anyway - don't block UX
    }

    // Auto-detect clothing category for future try-on
    const detectedCategory = detectClothingCategory(clothingPrompt);
    setClothingCategory(detectedCategory);

    // Store generated clothing and show preview
    setGeneratedClothingImage(imageUrl);
    setShowClothingPreview(true);
    setGenerationProgress('Clothing generated! Choose your next step.');

    // Notify item generation for immediate feedback
    if (onItemGenerated) {
      onItemGenerated(imageUrl, quickPrompt);
    }

    // Keep generating state active until user makes a choice
    setTimeout(() => {
      setGenerationProgress('');
    }, 2000);
  };

  const handleOccasionGenerate = async () => {
    console.log('🎯 Starting occasion-based generate with direct FAL API...');

    // Generate enhanced prompt from occasion data
    const occasionPrompt = await generateOccasionPrompt(selectedOccasion);
    console.log('📝 Occasion-based prompt:', occasionPrompt);

    // Step 1: Generate clothing using proxy API
    setGenerationProgress('Generating occasion-appropriate clothing...');

    // Use proxy endpoint instead of direct FAL client to avoid 401 errors
    const response = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `${occasionPrompt}, ${getClothingGenderText()} - no children's clothes, no kids' outfits`,
        negative_prompt: `${getChildrensExclusionTerms()}, multiple outfits, duplicate outfits`,
        image_size: { height: 2048, width: 2048 },
        num_images: 1,
        enable_safety_checker: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    setGenerationProgress('Generating clothing...');

    if (!result.images || result.images.length === 0) {
      throw new Error('Failed to generate clothing');
    }

    const clothingImageUrl = result.images[0].url;
    console.log('✅ Clothing generated:', clothingImageUrl);

    // Save to Supabase with color extraction
    try {
      const userData = userDataService.getAllUserData();
      const userId = userData?.profile?.email || 'anonymous';
      const gender = userData?.profile?.gender || 'unisex';

      const savedOutfit = await outfitStorageService.saveOutfit(userId, {
        occasion: `${selectedOccasion.category} - ${selectedOccasion.subcategory}`,
        style: selectedOccasion.category,
        imageUrl: clothingImageUrl,
        userPrompt: occasionPrompt,
        gender: gender
      });

      if (savedOutfit) {
        console.log('✅ [OCCASION-GENERATE] Saved outfit to Supabase');

        // Extract colors in background (non-blocking)
        extractColorsInBackground(savedOutfit);
      }
    } catch (error) {
      console.error('❌ [OCCASION-GENERATE] Failed to save to Supabase:', error);
      // Continue anyway - don't block UX
    }

    // Update UI with clothing result
    if (onItemGenerated) {
      onItemGenerated(clothingImageUrl, occasionPrompt);
    }

    // Update generated clothing image for display
    setGeneratedClothingImage(clothingImageUrl);

    // Legacy callback
    if (onOutfitGenerate) {
      onOutfitGenerate({
        mode: 'occasion',
        occasion: selectedOccasion,
        prompt: occasionPrompt,
        clothingImageUrl: clothingImageUrl,
        type: 'direct_fal_generation',
        processingTime: Date.now()
      });
    }

    setGenerationProgress('Perfect occasion outfit ready!');

    setTimeout(() => {
      setIsGenerating(false);
      setGenerationProgress('');
    }, 2000);
  };

  // Style modifier mappings - map existing archetypes to visual descriptors
  const styleModifiers = {
    Bold: {
      keywords: ['bright color blocking', 'asymmetric cut', 'statement sleeves'],
      archetypes: ['edgy', 'trendy', 'sporty']
    },
    Romantic: {
      keywords: ['floral print', 'ruffled details', 'wrap silhouette'],
      archetypes: ['bohemian', 'vintage']
    },
    Elegant: {
      keywords: ['monochrome', 'fitted bodice', 'A-line skirt'],
      archetypes: ['formal', 'minimalist', 'casual']
    }
  };

  // Color palettes for each style
  const colorPalettes = {
    Bold: ['coral', 'cobalt blue', 'emerald', 'fuchsia', 'electric purple'],
    Romantic: ['blush pink', 'lavender', 'sage green', 'cream', 'powder blue'],
    Elegant: ['navy', 'burgundy', 'black', 'champagne', 'deep emerald green']
  };

  // Fabric types for each style
  const fabricTypes = {
    Bold: ['structured cotton', 'ponte knit', 'scuba fabric'],
    Romantic: ['chiffon', 'silk', 'lace', 'organza'],
    Elegant: ['silk crepe', 'wool crepe', 'satin', 'velvet']
  };

  // Map occasions to formality levels
  const occasionFormality: Record<string, string> = {
    // Formal Events
    'wedding_guest': 'formal',
    'gala': 'formal black-tie',
    'conference': 'business formal',
    'awards': 'formal',
    'religious': 'formal',

    // Social Occasions
    'dinner_party': 'semi-formal',
    'birthday': 'semi-formal',
    'date_night': 'semi-formal',
    'cocktail': 'semi-formal cocktail',
    'festive': 'festive semi-formal',

    // Daily Life
    'work_office': 'business casual',
    'work_home': 'casual comfortable',
    'errands': 'casual',
    'home_relax': 'casual relaxed',
    'school': 'casual',

    // Travel
    'beach': 'casual resort',
    'city': 'casual',
    'mountain': 'casual outdoor',
    'business_travel': 'business casual',
    'cruise': 'semi-formal resort',

    // Activities
    'gym': 'athletic',
    'sports_event': 'casual sporty',
    'outdoor_activities': 'casual outdoor',
    'concert': 'casual trendy'
  };

  // Helper function to determine style category from user's archetypes
  const getStyleCategory = async (): Promise<keyof typeof styleModifiers> => {
    const profile = await stylePreferencesService.loadStyleProfile();
    const archetypes = profile?.fashionPersonality?.archetypes || [];

    // Map user's archetypes to style categories
    for (const [category, data] of Object.entries(styleModifiers)) {
      for (const archetype of archetypes) {
        const archetypeLower = archetype.toLowerCase().split(' - ')[0];
        if (data.archetypes.some(a => archetypeLower.includes(a))) {
          return category as keyof typeof styleModifiers;
        }
      }
    }

    // Default to Elegant if no match
    return 'Elegant';
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

  // Smart prompt optimizer - transforms user descriptions into concrete Seedream prompts
  const optimizePromptForSeedream = async (
    userDescription: string,
    occasion?: OccasionData
  ): Promise<string> => {
    // Get style category
    const styleCategory = await getStyleCategory();

    // Get formality level from occasion
    let formality = '';
    let occasionName = '';
    if (occasion?.subcategory) {
      formality = occasionFormality[occasion.subcategory] || 'casual';
      occasionName = occasion.subcategory.replace(/_/g, ' ');
    }

    // Detect garment type from user input or formality
    const garmentType = detectGarmentType(userDescription, formality);

    // Pick random color from style palette
    const colors = colorPalettes[styleCategory];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Pick random fabric from style fabrics
    const fabrics = fabricTypes[styleCategory];
    const randomFabric = fabrics[Math.floor(Math.random() * fabrics.length)];

    // Pick one style keyword (key visual detail)
    const styleKeywords = styleModifiers[styleCategory].keywords;
    const keyDetail = styleKeywords[Math.floor(Math.random() * styleKeywords.length)];

    // Determine fit description based on formality
    let fitDescription = 'tailored fit';
    if (formality.includes('formal')) fitDescription = 'elegant silhouette';
    if (formality.includes('casual')) fitDescription = 'relaxed fit';
    if (formality.includes('athletic')) fitDescription = 'performance fit';

    // Build the new formula: {GARMENT_TYPE} for {OCCASION}, {COLOR}, {FABRIC}, {KEY_DETAIL}, {FIT}, on white background
    const parts: string[] = [];

    // 1. Garment type with occasion
    if (occasionName) {
      parts.push(`${garmentType} for ${occasionName}`);
    } else {
      parts.push(garmentType);
    }

    // 2. Color
    parts.push(randomColor);

    // 3. Fabric
    parts.push(`${randomFabric} fabric`);

    // 4. Key visual detail
    parts.push(keyDetail);

    // 5. Fit
    parts.push(fitDescription);

    // 6. Background (always last)
    parts.push('on white background');

    const optimizedPrompt = parts.join(', ');

    console.log('✨ Optimized Seedream prompt:', optimizedPrompt);
    console.log(`📊 Style: ${styleCategory}, Garment: ${garmentType}, Color: ${randomColor}, Fabric: ${randomFabric}`);

    return optimizedPrompt;
  };

  // Helper function to enhance clothing prompts for Quick Generate
  const enhanceClothingPrompt = async (userPrompt: string): Promise<string> => {
    // Use the optimizer without occasion context
    return await optimizePromptForSeedream(userPrompt);
  };

  // Helper function to generate occasion-specific prompts
  const generateOccasionPrompt = async (occasion: OccasionData): Promise<string> => {
    // Build user description from occasion
    const parts: string[] = [];

    // Add occasion name
    const category = occasionCategories.find(cat => cat.id === occasion.category);
    const subcategory = category?.subcategories.find(sub => sub.id === occasion.subcategory);
    if (subcategory) {
      parts.push(`${subcategory.name} outfit`);
    }

    // Add user's additional context (highest priority - their specific request)
    if (occasion.additionalContext) {
      parts.push(occasion.additionalContext);
    }

    // Add time of day if specified
    if (occasion.timeOfDay) {
      parts.push(`${occasion.timeOfDay} wear`);
    }

    // Add weather-appropriate descriptors
    if (occasion.weatherTemp) {
      if (occasion.weatherTemp < 50) {
        parts.push('warm layered');
      } else if (occasion.weatherTemp > 80) {
        parts.push('light breathable');
      }
    }

    const userDescription = parts.join(', ');

    // Use optimizer with occasion context
    return await optimizePromptForSeedream(userDescription, occasion);
  };

  // Helper function to determine style based on occasion
  const getOccasionStyle = (occasion: OccasionData): 'casual' | 'formal' | 'trendy' | 'vintage' | 'minimalist' | 'edgy' => {
    switch (occasion.category) {
      case 'formal':
        return 'formal';
      case 'travel':
        return 'casual';
      case 'social':
        return 'trendy';
      case 'activities':
        return 'casual';
      case 'daily':
      default:
        return 'casual';
    }
  };

  // Helper function to detect clothing category from description
  const detectClothingCategory = (description: string): 'tops' | 'bottoms' | 'one-pieces' | 'auto' => {
    const lowerDesc = description.toLowerCase();

    // Tops - upper body garments
    const topKeywords = [
      'shirt', 'top', 'blouse', 'tee', 't-shirt', 'tank', 'camisole',
      'jacket', 'sweater', 'cardigan', 'hoodie', 'pullover', 'sweatshirt',
      'blazer', 'coat', 'vest', 'polo', 'henley', 'crop', 'tube', 'halter',
      'bodysuit', 'corset', 'bra', 'bikini top'
    ];

    // Bottoms - lower body garments
    const bottomKeywords = [
      'pants', 'shorts', 'jeans', 'skirt', 'trouser', 'slacks',
      'leggings', 'joggers', 'sweatpants', 'chinos', 'cargo',
      'capri', 'culottes', 'palazzo', 'bermuda',
      'mini skirt', 'midi skirt', 'maxi skirt', 'pencil skirt', 'a-line skirt',
      'bikini bottom', 'underwear', 'panties'
    ];

    // One-pieces - full body garments
    const onePieceKeywords = [
      'dress', 'jumpsuit', 'romper', 'overall', 'overalls',
      'playsuit', 'catsuit', 'bodycon', 'wrap dress',
      'shift dress', 'cocktail dress', 'gown', 'sundress',
      'maxi dress', 'midi dress', 'mini dress', 'evening dress',
      'wedding dress', 'prom dress', 'bikini', 'swimsuit', 'bathing suit'
    ];

    // Check for one-pieces first (most specific)
    if (onePieceKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'one-pieces';
    }

    // Check for tops
    if (topKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'tops';
    }

    // Check for bottoms
    if (bottomKeywords.some(keyword => lowerDesc.includes(keyword))) {
      return 'bottoms';
    }

    // Use auto for unknown or complex descriptions
    return 'auto';
  };

  // Apply generated clothing to avatar using FASHN API
  const handleApplyToAvatar = async () => {
    if (!generatedClothingImage || !avatarData?.imageUrl) {
      console.error('Missing generated clothing or avatar image');
      return;
    }

    setIsApplyingToAvatar(true);
    setGenerationProgress('Applying outfit to your avatar...');

    try {
      console.log('🎭 Starting FASHN virtual try-on...');

      const tryOnResult = await directFashnService.tryOnClothing(
        avatarData.imageUrl,
        generatedClothingImage,
        {
          category: clothingCategory,
          timeout: 90000  // 90 seconds - FASHN typically takes 40-50s
        }
      );

      if (tryOnResult?.success && tryOnResult?.imageUrl) {
        const finalImageUrl = tryOnResult.imageUrl;
        console.log('✅ Virtual try-on completed:', finalImageUrl);

        // Update avatar with new outfit
        if (onAvatarUpdate) {
          onAvatarUpdate({
            ...avatarData,
            imageUrl: finalImageUrl,
            lastGenerated: {
              type: 'quick_generate_enhanced',
              prompt: quickPrompt,
              enhancedPrompt: enhancedClothingPrompt,
              clothingImageUrl: generatedClothingImage,
              finalImageUrl,
              timestamp: new Date().toISOString(),
              clothingCategory
            }
          });
        }

        // Notify item generation with final result
        if (onItemGenerated) {
          onItemGenerated(finalImageUrl, quickPrompt);
        }

        // Call legacy callback
        if (onOutfitGenerate) {
          onOutfitGenerate({
            mode: 'quick',
            prompt: quickPrompt,
            clothingImageUrl: generatedClothingImage,
            finalImageUrl,
            type: 'enhanced_try_on_generation',
            clothingCategory
          });
        }

        setGenerationProgress('Outfit applied successfully!');

        // Reset preview state
        setTimeout(() => {
          setShowClothingPreview(false);
          setGeneratedClothingImage(null);
          setIsGenerating(false);
          setIsApplyingToAvatar(false);
          setGenerationProgress('');
        }, 2000);

      } else {
        throw new Error('No result from virtual try-on');
      }

    } catch (error) {
      console.error('❌ Virtual try-on failed:', error);
      setGenerationProgress('Try-on failed. Keeping clothing preview.');

      setTimeout(() => {
        setIsApplyingToAvatar(false);
        setGenerationProgress('');
      }, 3000);
    }
  };

  // Generate new clothing with same or different prompt
  const handleGenerateAgain = (newPrompt?: string) => {
    const promptToUse = newPrompt || quickPrompt;

    // Reset preview state
    setShowClothingPreview(false);
    setGeneratedClothingImage(null);
    setIsApplyingToAvatar(false);

    // Update prompt if provided
    if (newPrompt) {
      setQuickPrompt(newPrompt);
    }

    // Clear previous progress
    setGenerationProgress('');

    // Small delay to allow UI reset, then generate again
    setTimeout(() => {
      handleGenerateOutfit();
    }, 100);
  };

  // Render clothing preview with Try-On and Generate Again options
  const renderClothingPreview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Here's Your Generated Outfit!</h2>
        <p className="text-gray-600">Choose what you'd like to do next</p>
      </div>

      {/* Generated Clothing Image */}
      <div className="flex justify-center">
        <div className="glass-beige rounded-2xl p-6 max-w-md w-full">
          {generatedClothingImage && (
            <img
              src={generatedClothingImage}
              alt="Generated clothing"
              className="w-full h-auto rounded-lg shadow-lg"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
          )}

          {/* Clothing Details */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Style:</strong> {clothingCategory.charAt(0).toUpperCase() + clothingCategory.slice(1)}
            </p>
            <p className="text-xs text-gray-500">
              "{quickPrompt}"
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
        {/* Try-On Button */}
        <button
          onClick={handleApplyToAvatar}
          disabled={isApplyingToAvatar || !avatarData?.imageUrl}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all transform hover:scale-105"
        >
          {isApplyingToAvatar ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Applying to Avatar...</span>
            </>
          ) : (
            <>
              <Users className="w-5 h-5" />
              <span>Try-On</span>
            </>
          )}
        </button>

        {/* Generate Again Button */}
        <button
          onClick={() => handleGenerateAgain()}
          disabled={isApplyingToAvatar}
          className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 px-6 rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all transform hover:scale-105"
        >
          <Zap className="w-5 h-5" />
          <span>Generate Again</span>
        </button>
      </div>

      {/* Additional Options */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => {
            // Copy prompt to clipboard for easy modification
            navigator.clipboard.writeText(quickPrompt);
            alert('Prompt copied to clipboard!');
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 text-sm"
        >
          <Heart className="w-4 h-4 text-gray-400" />
          <span>Copy Prompt</span>
        </button>
      </div>

      {/* Progress/Status */}
      {generationProgress && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-blue-800 text-sm font-medium">{generationProgress}</p>
        </div>
      )}

      {/* Disclaimer */}
      {!avatarData?.imageUrl && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <p className="text-amber-800 text-sm">
            💡 Create an avatar first to use the Try-On feature!
          </p>
        </div>
      )}
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= step
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}>
            {step}
          </div>
          {step < 3 && (
            <ChevronRight className={`w-4 h-4 mx-2 ${
              currentStep > step ? 'text-purple-600' : 'text-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderQuickMode = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quick Generate</h2>

        {hasStylePreferences && (
          <div className="mt-3 inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Using your style: {styleSummary}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-lg font-bold text-gray-700 mb-2 text-center">
            Describe your desired outfit in detail (colors, style, fabrics, fits)
          </label>
          <textarea
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            placeholder="Describe your outfit..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={4}
          />
        </div>

        <button
          onClick={handleGenerateOutfit}
          disabled={!quickPrompt.trim() || isGenerating}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white py-3 px-4 rounded-full font-medium hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Zap className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span className="text-black italic text-lg">{isGenerating ? 'Generating...' : 'Generate Outfit'}</span>
        </button>

        {generationProgress && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm font-medium">{generationProgress}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderOccasionStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Occasion</h2>
        <p className="text-gray-600">Select the type of event or activity you're dressing for</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {occasionCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center text-white mb-4 mx-auto group-hover:scale-110 transition-transform`}>
              {category.icon}
            </div>
            <h3 className="font-semibold text-gray-900 text-center">{category.name}</h3>
          </button>
        ))}
      </div>
    </div>
  );

  const renderOccasionStep2 = () => {
    const selectedCategory = occasionCategories.find(cat => cat.id === selectedOccasion.category);
    if (!selectedCategory) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`w-12 h-12 ${selectedCategory.color} rounded-lg flex items-center justify-center text-white mb-4 mx-auto`}>
            {selectedCategory.icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCategory.name}</h2>
          <p className="text-gray-600">Choose the specific occasion</p>
        </div>

        <button
          onClick={() => setCurrentStep(1)}
          className="flex items-center text-purple-600 hover:text-purple-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to categories
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedCategory.subcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => handleSubcategorySelect(sub.id)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{sub.name}</h3>
              {sub.needsWeather && (
                <div className="flex items-center text-sm text-gray-500">
                  <Thermometer className="w-4 h-4 mr-1" />
                  Weather-dependent
                </div>
              )}
              {sub.options && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {sub.options.map((option, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-600">
                      {option}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderOccasionStep3 = () => {
    const selectedCategory = occasionCategories.find(cat => cat.id === selectedOccasion.category);
    const selectedSubcategory = selectedCategory?.subcategories.find(sub => sub.id === selectedOccasion.subcategory);
    if (!selectedCategory || !selectedSubcategory) return null;

    const needsWeather = selectedSubcategory.needsWeather;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`w-12 h-12 ${selectedCategory.color} rounded-lg flex items-center justify-center text-white mb-4 mx-auto`}>
            {selectedCategory.icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedSubcategory.name}</h2>
          <p className="text-gray-600">Add details for your outfit</p>
        </div>

        <button
          onClick={() => setCurrentStep(2)}
          className="flex items-center text-purple-600 hover:text-purple-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to occasions
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date & Time */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={selectedOccasion.date || ''}
                onChange={(e) => setSelectedOccasion(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Time of Day
              </label>
              <select
                value={selectedOccasion.timeOfDay || ''}
                onChange={(e) => setSelectedOccasion(prev => ({ ...prev, timeOfDay: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select time</option>
                <option value="morning">Morning (6AM - 12PM)</option>
                <option value="afternoon">Afternoon (12PM - 6PM)</option>
                <option value="evening">Evening (6PM - 12AM)</option>
                <option value="night">Night (12AM - 6AM)</option>
              </select>
            </div>
          </div>

          {/* Location & Weather */}
          <div className="space-y-4">
            {needsWeather && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={selectedOccasion.location || ''}
                    onChange={(e) => setSelectedOccasion(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, State or Country"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Thermometer className="w-4 h-4 inline mr-1" />
                    Expected Temperature
                  </label>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={selectedOccasion.weatherTemp}
                      onChange={(e) => setSelectedOccasion(prev => ({ ...prev, weatherTemp: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex items-center justify-center space-x-2">
                      {getWeatherIcon(selectedOccasion.weatherTemp || 72)}
                      <span className="text-2xl font-bold text-gray-900">{selectedOccasion.weatherTemp}°F</span>
                      <div className="text-sm text-gray-600">
                        {selectedOccasion.weatherTemp! < 40 ? 'Very Cold' :
                         selectedOccasion.weatherTemp! < 60 ? 'Cool' :
                         selectedOccasion.weatherTemp! < 75 ? 'Comfortable' :
                         selectedOccasion.weatherTemp! < 85 ? 'Warm' : 'Hot'}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Subcategory options */}
            {selectedSubcategory.options && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style/Type
                </label>
                <select
                  value={selectedOccasion.additionalContext || ''}
                  onChange={(e) => setSelectedOccasion(prev => ({ ...prev, additionalContext: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select style</option>
                  {selectedSubcategory.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={handleGenerateOutfit}
            disabled={isGenerating}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Calendar className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating...' : 'Generate Occasion Outfit'}</span>
          </button>

          <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Heart className="w-5 h-5 text-gray-400" />
          </button>

          <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {generationProgress && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm font-medium">{generationProgress}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`enhanced-outfit-generator ${className}`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => mode !== 'quick' && handleModeSwitch()}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                mode === 'quick'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Zap className="w-4 h-4 inline mr-2" />
              Quick Generate
            </button>
            <button
              onClick={() => mode !== 'occasion' && handleModeSwitch()}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                mode === 'occasion'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Occasion Planner
            </button>
          </div>
        </div>

        {/* Content */}
        {showClothingPreview ? (
          renderClothingPreview()
        ) : mode === 'quick' ? (
          renderQuickMode()
        ) : (
          <SmartOccasionPlanner
            onOutfitGenerate={onOutfitGenerate}
            avatarData={avatarData}
            onAvatarUpdate={onAvatarUpdate}
            onItemGenerated={onItemGenerated}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedOutfitGenerator;