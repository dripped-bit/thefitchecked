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

  const personalities: OutfitPersonality[] = [
    {
      id: 'elegant',
      name: 'Elegant',
      description: 'Timeless sophistication',
      icon: <Star className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      promptModifier: 'elegant, sophisticated, classic, refined, timeless style'
    },
    {
      id: 'romantic',
      name: 'Romantic',
      description: 'Soft and feminine',
      icon: <Heart className="w-5 h-5" />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 border-pink-200',
      promptModifier: 'romantic, feminine, soft, flowing, delicate details'
    },
    {
      id: 'bold',
      name: 'Bold',
      description: 'Modern and striking',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      promptModifier: 'bold, modern, striking, contemporary, fashion-forward'
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

  const createPersonalizedPrompt = async (personality: OutfitPersonality): Promise<string> => {
    // Combine user's typed input with selected occasion category
    // If user typed custom details, prioritize those alongside the occasion
    const hasCustomInput = occasion.originalInput &&
                          occasion.originalInput.trim().length > 0 &&
                          occasion.originalInput.trim().toLowerCase() !== occasion.occasion.trim().toLowerCase();

    const basePrompt = hasCustomInput
      ? `${occasion.originalInput} (for ${occasion.occasion})`
      : occasion.occasion;

    console.log('📝 [PROMPT] Building prompt with:', {
      originalInput: occasion.originalInput,
      occasion: occasion.occasion,
      hasCustomInput,
      basePrompt,
      usingCustomInput: hasCustomInput ? 'YES - User typed custom details' : 'NO - Using occasion only'
    });

    const weatherContext = occasion.weather
      ? `${occasion.weather.temperature}°F ${occasion.weather.weatherDescription}`
      : '';
    const timeContext = occasion.time ? `for ${occasion.time}` : '';
    const locationContext = occasion.location ? `in ${occasion.location}` : '';

    // Get user's gender from profile
    const userData = userDataService.getAllUserData();
    const userGender = userData?.profile?.gender;
    console.log('👤 [GENDER] User gender detected:', userGender || 'unspecified');

    // Build gender-specific clothing guidance with exclusions
    let genderGuidance = '';
    if (userGender === 'female') {
      genderGuidance = "women's clothing, women's fashion, feminine style, for women. EXCLUDE: men's suits, ties, dress shirts, men's formal wear, masculine clothing";
    } else if (userGender === 'male') {
      genderGuidance = "men's clothing, men's fashion, masculine style, for men. EXCLUDE: dresses, skirts, women's blouses, feminine clothing";
    }

    // Check if user explicitly specified a color in their request
    const colorKeywords = ['pink', 'red', 'blue', 'green', 'black', 'white', 'yellow', 'purple', 'brown', 'orange', 'beige', 'navy', 'grey', 'gray', 'cream', 'tan', 'burgundy', 'teal', 'lavender', 'coral', 'emerald', 'olive'];
    const hasExplicitColor = colorKeywords.some(color =>
      basePrompt.toLowerCase().includes(color)
    );

    // Get user's style preferences
    const stylePrefs = await stylePreferencesService.formatPreferencesForPrompt();

    // Build style guidance WITHOUT colors if user specified a color
    let styleGuidance = '';
    if (stylePrefs.hasPreferences) {
      const guidanceParts: string[] = [];

      // Add non-color style elements
      if (stylePrefs.archetypes.length > 0) {
        guidanceParts.push(`style vibe: ${stylePrefs.archetypes.join(', ')}`);
      }
      if (stylePrefs.fits.length > 0) {
        guidanceParts.push(`fit preference: ${stylePrefs.fits.join(', ')}`);
      }
      if (stylePrefs.materials.length > 0) {
        guidanceParts.push(`materials: ${stylePrefs.materials.join(', ')}`);
      }
      if (stylePrefs.boundaries.length > 0) {
        guidanceParts.push(`avoid: ${stylePrefs.boundaries.join(', ')}`);
      }

      // ONLY add color preferences if user didn't specify a color
      if (!hasExplicitColor && stylePrefs.colors.length > 0) {
        guidanceParts.push(`preferred colors: ${stylePrefs.colors.join(', ')}`);
      }

      styleGuidance = guidanceParts.length > 0 ? `(Style guidance for details: ${guidanceParts.join(', ')}) ` : '';

      if (hasExplicitColor) {
        console.log(`🎨 User specified color explicitly - excluding color preferences from style guidance`);
      } else {
        console.log('✨ No explicit color in request - including color preferences');
      }
    }

    // Structure: GENDER FIRST (highest priority), then user request, style guidance
    const userRequest = `${basePrompt} ${timeContext} ${locationContext}, ${weatherContext}, ${occasion.formality} attire`;

    // Build final prompt with gender as highest priority
    const genderPrefix = genderGuidance ? `${genderGuidance}. ` : '';

    return `⚠️ CRITICAL: GENERATE EXACTLY 1 SINGLE OUTFIT ONLY - NOT 2, NOT 3, JUST 1 ⚠️

QUANTITY REQUIREMENTS (MOST IMPORTANT):
- COUNT: Exactly 1 outfit (singular, not plural)
- If dress: Show ONLY 1 dress (NOT 2 dresses, NOT multiple dresses, NOT dress options)
- If separates: Show ONLY 1 top + 1 bottom (NOT multiple tops, NOT outfit variations)
- NEVER generate: 2 dresses, multiple outfits, outfit comparisons, style options, variations
- REJECT: Any image showing more than 1 complete garment set

${genderPrefix}OUTFIT REQUEST: ${userRequest}. ${styleGuidance}${personality.promptModifier}.

HOW TO GENERATE THE SINGLE OUTFIT:
- If dress/jumpsuit: Show 1 complete one-piece garment
- If separates: Show 1 top AND 1 bottom overlapped together as unified outfit
- ALL pieces must touch/overlap to form single coordinated look
- Layout: Flat-lay style as if ready to wear (top on top, bottom below)

STYLE REQUIREMENTS:
Product photography, clean white background, centered composition, professional fashion photography, detailed fabric texture, well-lit, crisp details, fashion catalog style, FASHN-ready outfit image, virtual try-on optimized, no person, no model, no mannequin.

FINAL REMINDER: Generate EXACTLY 1 OUTFIT - if you're showing a dress, show ONLY 1 dress, NOT 2 or more.`;
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

      const response = await fetch('/api/claude/v1/messages', {
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
                  text: `Analyze this ${personalityName} outfit for ${occasion.occasion}.

USER REQUESTED: "${occasion.originalInput || occasion.occasion}"

Build a PRECISE shopping search query that prioritizes the user's exact request:

STEP 1: Start with user's exact keywords (e.g., if they said "blue dress", START with "blue dress")
STEP 2: Add visible garment details:
- GARMENT TYPE (dress/skirt/top/pants/jumpsuit/romper)
- LENGTH if visible (maxi/midi/mini/long/short)
- FIT STYLE (fitted/flowy/loose/bodycon/a-line)
STEP 3: Add ONLY obvious details:
- PRIMARY COLOR if not already in user request
- PATTERN if clearly visible (floral/solid/striped/polka dot)

CRITICAL: If user said "blue dress", query MUST start with "blue dress" not generic terms.

Return ONLY the search query like: "blue dress maxi flowy bohemian" or "red skirt midi fitted leather"
NO explanations, just keywords.`
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

  const generateReasoning = (personality: OutfitPersonality): string[] => {
    const reasons = [];

    // Weather-based reasoning
    if (occasion.weather) {
      const temp = occasion.weather.temperature;
      if (temp < 60) {
        reasons.push(`Warm layers for ${temp}°F weather`);
      } else if (temp > 80) {
        reasons.push(`Breathable fabrics for ${temp}°F heat`);
      } else {
        reasons.push(`Perfect temperature at ${temp}°F`);
      }
    }

    // Occasion-based reasoning
    if (occasion.formality === 'formal') {
      reasons.push('Formal dress code appropriate');
    } else if (occasion.formality === 'casual') {
      reasons.push('Comfortable for casual setting');
    }

    // Location-based reasoning
    if (occasion.tags.includes('beach')) {
      reasons.push('Won\'t drag in sand, beach-appropriate');
    } else if (occasion.tags.includes('work')) {
      reasons.push('Professional and workplace-suitable');
    }

    // Personality-specific reasoning
    switch (personality.id) {
      case 'elegant':
        reasons.push('Timeless style that never goes out of fashion');
        break;
      case 'romantic':
        reasons.push('Soft, feminine touches perfect for the occasion');
        break;
      case 'bold':
        reasons.push('Modern statement piece that stands out');
        break;
    }

    return reasons;
  };

  const generateTripleOutfits = async () => {
    setIsGenerating(true);
    setGenerationProgress('Generating your personalized outfit options...');

    try {
      const outfitPromises = personalities.map(async (personality) => {
        const prompt = await createPersonalizedPrompt(personality);

        setGenerationProgress(`Creating ${personality.name.toLowerCase()} option...`);

        // Use proxy endpoint instead of direct FAL client to avoid 401 errors
        const response = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            image_size: { height: 1536, width: 1536 },
            num_images: 1,
            enable_safety_checker: true
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        setGenerationProgress(`Generating ${personality.name.toLowerCase()} outfit...`);

        if (!result.images || result.images.length === 0) {
          throw new Error(`Failed to generate ${personality.name} outfit`);
        }

        const reasoning = generateReasoning(personality);

        // Analyze the generated outfit image to create intelligent search prompts
        const searchPrompt = await analyzeOutfitImage(result.images[0].url, personality.name);

        return {
          personality,
          imageUrl: result.images[0].url,
          reasoning,
          priceRange: '', // Will be set when user selects budget
          confidence: 0.85 + Math.random() * 0.1, // Mock confidence between 85-95%
          isSelected: false,
          originalPrompt: prompt,
          searchPrompt: searchPrompt
        };
      });

      const generatedOutfits = await Promise.all(outfitPromises);
      setOutfits(generatedOutfits);

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

      const tryOnResult = await directFashnService.tryOnClothing(
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

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            {occasion.date && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{occasion.date} {occasion.time}</span>
              </div>
            )}
            {occasion.weather && (
              <div className="flex items-center space-x-1">
                <Thermometer className="w-4 h-4" />
                <span>{occasion.weather.temperature}°F {occasion.weather.weatherDescription}</span>
              </div>
            )}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              occasion.formality === 'formal' ? 'bg-blue-100 text-blue-700' :
              occasion.formality === 'semi-formal' ? 'bg-purple-100 text-purple-700' :
              'bg-green-100 text-green-700'
            }`}>
              {occasion.formality}
            </div>
          </div>
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
              {/* Personality Header */}
              <div className={`p-4 border-b ${outfit.personality.bgColor} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 bg-white rounded-lg ${outfit.personality.color}`}>
                      {outfit.personality.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{outfit.personality.name}</h4>
                      <p className="text-sm text-gray-600">{outfit.personality.description}</p>
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
                <div className="relative aspect-[2/3] min-h-[500px] bg-gray-100 rounded-xl overflow-hidden mb-4">
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