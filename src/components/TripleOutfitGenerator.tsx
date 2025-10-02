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
  Share2
} from 'lucide-react';
import { fal } from '@fal-ai/client';
import directFashnService from '../services/directFashnService';
import stylePreferencesService from '../services/stylePreferencesService';
import { ParsedOccasion } from './SmartOccasionInput';
import ShareModal from './ShareModal';
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
  className?: string;
}

const TripleOutfitGenerator: React.FC<TripleOutfitGeneratorProps> = ({
  occasion,
  avatarData,
  onOutfitSelected,
  onOutfitApplied,
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
    const basePrompt = occasion.occasion;
    const weatherContext = occasion.weather
      ? `${occasion.weather.temperature}°F ${occasion.weather.weatherDescription}`
      : '';
    const timeContext = occasion.time ? `for ${occasion.time}` : '';
    const locationContext = occasion.location ? `in ${occasion.location}` : '';

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

    // Structure: USER REQUEST FIRST (highest priority), then style guidance for DETAILS only
    const userRequest = `${basePrompt} ${timeContext} ${locationContext}, ${weatherContext}, ${occasion.formality} attire`;

    // Build final prompt with clear priority structure
    return `PRIMARY: ${userRequest}. ${styleGuidance}${personality.promptModifier}, single clothing piece only, one garment, no person, no model, no mannequin, isolated single garment, product photography, fashion flat lay, clean white background, centered composition, professional product photography, detailed fabric texture, well-lit, crisp details, single item display, fashion catalog style, FASHN-ready single garment image, virtual try-on optimized. IMPORTANT: If PRIMARY request specifies a color, that color MUST be used.`;
  };

  const createCleanSearchPrompt = (): string => {
    // Clean prompt for Perplexity search - just the core outfit description
    const basePrompt = occasion.occasion;
    const formalityContext = occasion.formality ? `${occasion.formality}` : '';

    // Return clean search prompt without technical instructions or style preferences
    return `${basePrompt} ${formalityContext}`.trim();
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

        const result = await fal.subscribe("fal-ai/bytedance/seedream/v4/text-to-image", {
          input: {
            prompt,
            image_size: { height: 1024, width: 1024 },
            num_images: 1,
            enable_safety_checker: true
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              setGenerationProgress(`Generating ${personality.name.toLowerCase()} outfit...`);
            }
          }
        });

        if (!result.data || !result.data.images || result.data.images.length === 0) {
          throw new Error(`Failed to generate ${personality.name} outfit`);
        }

        const reasoning = generateReasoning(personality);
        const priceRange = personality.id === 'elegant' ? '$120-$200' :
                          personality.id === 'romantic' ? '$89-$150' : '$95-$180';

        const searchPrompt = createCleanSearchPrompt();

        return {
          personality,
          imageUrl: result.data.images[0].url,
          reasoning,
          priceRange,
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

    // Auto-trigger try-on if avatar exists
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
          timeout: 30000
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {outfits.map((outfit) => (
            <div
              key={outfit.personality.id}
              className={`relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
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
              <div className="p-4">
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                  <img
                    src={outfit.imageUrl}
                    alt={`${outfit.personality.name} outfit`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity duration-200 flex items-center justify-center">
                    <button
                      onClick={() => handleOutfitSelect(outfit)}
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

                {/* Price Range */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Shop from</span>
                    <span className="font-semibold text-gray-900">{outfit.priceRange}</span>
                  </div>
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
    </div>
  );
};

export default TripleOutfitGenerator;