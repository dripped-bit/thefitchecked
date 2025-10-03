import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Upload, Save, CheckCircle, Camera, Loader2, Sparkles, Brain } from 'lucide-react';
import styleAnalysisService, { StyleAnalysisResult } from '../services/styleAnalysisService';
import stylePreferencesService from '../services/stylePreferencesService';

interface Page4ComponentProps {
  onNext: () => void;
  onBack: () => void;
  avatarData?: any;
  measurements?: any;
  autoFillData?: UserProfile | null;
}

interface UserProfile {
  lifestyle: {
    morningRoutine: string[];
    workEnvironment: string[];
  };
  fashionPersonality: {
    archetypes: string[];
    colorPalette: string[];
    avoidColors: string[];
  };
  creative: {
    outlets: string[];
    inspirations: string[];
  };
  shopping: {
    habits: string[];
    favoriteStores: string[];
    customStores: string[];
  };
  preferences: {
    materials: string[];
    fits: string[];
  };
  occasions: {
    weekend: string[];
    nightOut: string[];
  };
  influences: {
    eras: string[];
    sources: string[];
  };
  boundaries: string[];
  uploads: {
    goToOutfit: string | null;
    dreamPurchase: string | null;
    inspiration: string | null;
    favoritePiece: string | null;
  };
  descriptions: {
    threeWords: string[];
    alwaysFollow: string;
    loveToBreak: string;
    neverThrowAway: string;
  };
  seasonal: string[];
  sizes: {
    gender: 'women' | 'men' | 'unisex' | '';
    tops: string;
    bottoms: string;
    dresses: string;
    outerwear: string;
    shoes: string;
  };
}

const Page4Component: React.FC<Page4ComponentProps> = ({
  onNext,
  onBack,
  avatarData,
  measurements,
  autoFillData
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    lifestyle: { morningRoutine: [], workEnvironment: [] },
    fashionPersonality: { archetypes: [], colorPalette: [], avoidColors: [] },
    creative: { outlets: [], inspirations: [] },
    shopping: { habits: [], favoriteStores: [], customStores: [] },
    preferences: { materials: [], fits: [] },
    occasions: { weekend: [], nightOut: [] },
    influences: { eras: [], sources: [] },
    boundaries: [],
    uploads: { goToOutfit: null, dreamPurchase: null, inspiration: null, favoritePiece: null },
    descriptions: { threeWords: ['', '', ''], alwaysFollow: '', loveToBreak: '', neverThrowAway: '' },
    seasonal: [],
    sizes: { gender: '', tops: '', bottoms: '', dresses: '', outerwear: '', shoes: '' }
  });

  const [showStyleAnalysis, setShowStyleAnalysis] = useState(false);
  const [styleAnalysisResult, setStyleAnalysisResult] = useState<StyleAnalysisResult | null>(null);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Auto-fill data when provided
  useEffect(() => {
    if (autoFillData) {
      console.log('🔄 Auto-filling style profile with saved data:', autoFillData);
      setUserProfile(autoFillData);
      setIsAutoFilled(true);
    } else {
      setIsAutoFilled(false);
    }
  }, [autoFillData]);

  // Load saved preferences on component mount
  useEffect(() => {
    const loadSavedPreferences = async () => {
      // Don't auto-load if we already have autoFillData
      if (autoFillData) {
        console.log('⏭️ Skipping auto-load - using autoFillData prop instead');
        return;
      }

      console.log('🔍 Checking for saved style preferences...');
      const savedProfile = await stylePreferencesService.loadStyleProfile();

      if (savedProfile) {
        console.log('✅ Loaded saved style preferences from IndexedDB:', savedProfile);
        setUserProfile(savedProfile as UserProfile);
        setIsAutoFilled(true); // Mark as auto-filled so user knows data was loaded
      } else {
        console.log('📋 No saved style preferences found - starting with fresh form');
      }
    };

    loadSavedPreferences();
  }, []); // Empty dependency array = run once on mount

  const sections = [
    'Lifestyle & Daily Rhythm',
    'Fashion Personality',
    'Color Psychology',
    'Creative Expression',
    'Shopping Philosophy',
    'Fabric & Texture',
    'Occasions & Moods',
    'Style Icons',
    'Personal Boundaries',
    'Style Samples',
    'Seasonal Preferences',
    'Your Sizes'
  ];

  const calculateProgress = () => {
    const totalFields = Object.keys(userProfile).reduce((acc, key) => {
      if (key === 'uploads') return acc + 4;
      if (key === 'descriptions') return acc + 4;
      if (key === 'lifestyle') return acc + 2;
      if (key === 'fashionPersonality') return acc + 3;
      if (key === 'creative') return acc + 2;
      if (key === 'shopping') return acc + 3;
      if (key === 'preferences') return acc + 2;
      if (key === 'occasions') return acc + 2;
      if (key === 'influences') return acc + 2;
      if (key === 'sizes') return acc + 6; // gender + 5 size fields (tops, bottoms, dresses, outerwear, shoes)
      return acc + 1;
    }, 0);

    const filledFields = Object.entries(userProfile).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) return acc + (value.length > 0 ? 1 : 0);
      if (typeof value === 'object' && value !== null) {
        return acc + Object.values(value).filter(v =>
          Array.isArray(v) ? v.length > 0 : v !== null && v !== ''
        ).length;
      }
      return acc;
    }, 0);

    return Math.round((filledFields / totalFields) * 100);
  };

  const handleCheckboxChange = (section: keyof UserProfile, subsection: string | null, value: string) => {
    setUserProfile(prev => {
      if (subsection) {
        const sectionData = prev[section] as any;
        const currentArray = sectionData[subsection] || [];
        const newArray = currentArray.includes(value)
          ? currentArray.filter((item: string) => item !== value)
          : [...currentArray, value];

        return {
          ...prev,
          [section]: {
            ...sectionData,
            [subsection]: newArray
          }
        };
      } else {
        const currentArray = prev[section] as string[];
        const newArray = currentArray.includes(value)
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value];

        return {
          ...prev,
          [section]: newArray
        };
      }
    });
  };

  const handleTextInputChange = (section: 'descriptions', field: string, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleThreeWordsChange = (index: number, value: string) => {
    setUserProfile(prev => {
      const newThreeWords = [...prev.descriptions.threeWords];
      // Ensure the array has at least 3 elements
      while (newThreeWords.length < 3) {
        newThreeWords.push('');
      }
      newThreeWords[index] = value;

      return {
        ...prev,
        descriptions: {
          ...prev.descriptions,
          threeWords: newThreeWords
        }
      };
    });
  };

  const handleImageUpload = (uploadType: keyof UserProfile['uploads'], file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUserProfile(prev => ({
        ...prev,
        uploads: {
          ...prev.uploads,
          [uploadType]: e.target?.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const generateStyleAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    setStyleAnalysisResult(null);

    try {
      console.log('🎨 Starting AI-powered style analysis...');

      // Generate comprehensive analysis using Claude API
      const result = await styleAnalysisService.analyzeUserStyle(userProfile);

      if (result.success && result.analysis) {
        setStyleAnalysisResult(result);
        setShowStyleAnalysis(true);
        console.log('✅ Style analysis completed successfully');
      } else {
        throw new Error(result.error || 'Failed to generate analysis');
      }
    } catch (error) {
      console.error('❌ Style analysis failed:', error);

      // Show error but don't block user progression
      setStyleAnalysisResult({
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed - please try again'
      });
      setShowStyleAnalysis(true);
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const canCompleteProfile = () => {
    const progress = calculateProgress();
    const hasImage = Object.values(userProfile.uploads).some(upload => upload !== null);
    const hasThreeWords = userProfile.descriptions.threeWords.filter(word => word.trim() !== '').length >= 3;

    return progress >= 40 && hasImage && hasThreeWords;
  };

  const renderSection = () => {
    switch (currentSection) {
      case 0: // Lifestyle & Daily Rhythm
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Morning Routine</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Early riser (5-7am)', 'Standard schedule (7-9am)', 'Night owl (after 9am)',
                  'Coffee shop regular', 'Gym/workout first thing', 'Meditation/yoga practice',
                  'Quick & minimal routine', 'Extended self-care ritual'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.lifestyle.morningRoutine.includes(option)}
                      onChange={() => handleCheckboxChange('lifestyle', 'morningRoutine', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Work Environment</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Corporate office', 'Creative studio', 'Remote/home office', 'Outdoor/field work',
                  'Retail/customer-facing', 'Healthcare/uniforms', 'Education/academia', 'Freelance/varied locations'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.lifestyle.workEnvironment.includes(option)}
                      onChange={() => handleCheckboxChange('lifestyle', 'workEnvironment', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 1: // Fashion Personality
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Style Archetypes (select all that resonate)</h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  'Minimalist - Clean lines, neutral palette',
                  'Maximalist - Bold patterns, layered looks',
                  'Romantic - Soft textures, feminine details',
                  'Edgy - Leather, hardware, dark palette',
                  'Bohemian - Flowy, ethnic prints, natural fibers',
                  'Classic - Timeless pieces, refined elegance',
                  'Streetwear - Sneakers, oversized, urban',
                  'Preppy - Collegiate, clean-cut, traditional',
                  'Avant-garde - Experimental, artistic, unconventional',
                  'Athleisure - Comfort-first, sporty chic',
                  'Vintage - Retro pieces, thrifted finds',
                  'Grunge - Distressed, layered, effortless'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.fashionPersonality.archetypes.includes(option)}
                      onChange={() => handleCheckboxChange('fashionPersonality', 'archetypes', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Color Psychology
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Everyday Palette</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'All black everything', 'Neutrals (beige, cream, tan)', 'Earth tones (brown, olive, rust)',
                  'Jewel tones (emerald, sapphire, ruby)', 'Pastels (soft pink, lavender, mint)',
                  'Bold brights (red, yellow, cobalt)', 'Monochrome matching', 'High contrast mixing'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.fashionPersonality.colorPalette.includes(option)}
                      onChange={() => handleCheckboxChange('fashionPersonality', 'colorPalette', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Colors You Avoid</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Neon/fluorescent', 'Brown/beige', 'Yellow/gold', 'Orange',
                  'Pink', 'Purple', 'Green', 'Prints/patterns'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.fashionPersonality.avoidColors.includes(option)}
                      onChange={() => handleCheckboxChange('fashionPersonality', 'avoidColors', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Creative Expression
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Creative Outlets</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Photography', 'Drawing/Painting', 'Writing/Blogging', 'Music/Performance',
                  'Crafting/DIY', 'Cooking/Baking', 'Dance/Movement', 'Interior Design',
                  'Fashion Design', 'Graphic Design', 'Jewelry Making', 'Vintage Collecting'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.creative.outlets.includes(option)}
                      onChange={() => handleCheckboxChange('creative', 'outlets', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Style Inspirations</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Art museums/galleries', 'Street style photography', 'Vintage films/TV', 'Music videos',
                  'Fashion magazines', 'Nature/architecture', 'Travel destinations', 'Historical periods',
                  'Subcultures/movements', 'Social media', 'Fashion weeks', 'Personal memories'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.creative.inspirations.includes(option)}
                      onChange={() => handleCheckboxChange('creative', 'inspirations', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4: // Shopping Philosophy
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Shopping Habits</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Quality over quantity', 'Trendy & seasonal', 'Budget-conscious', 'Luxury investment pieces',
                  'Thrift/vintage hunting', 'Online shopping', 'In-store browsing', 'Brand loyal',
                  'Impulse purchases', 'Research before buying', 'Sale shopping', 'Sustainable/ethical'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.shopping.habits.includes(option)}
                      onChange={() => handleCheckboxChange('shopping', 'habits', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Favorite Stores</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Zara', 'H&M', 'Target', 'Nordstrom', 'Uniqlo', 'COS',
                  'Madewell', 'J.Crew', 'Reformation', 'Everlane', 'Sezane', 'Local boutiques'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.shopping.favoriteStores.includes(option)}
                      onChange={() => handleCheckboxChange('shopping', 'favoriteStores', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other favorite stores (comma-separated):
              </label>
              <input
                type="text"
                defaultValue={userProfile.shopping.customStores.join(', ')}
                onBlur={(e) => {
                  const stores = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                  setUserProfile(prev => ({
                    ...prev,
                    shopping: { ...prev.shopping, customStores: stores }
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Aritzia, Free People, local thrift shops"
              />
            </div>
          </div>
        );

      case 5: // Fabric & Texture
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Preferred Materials</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Cotton & linen', 'Silk & satin', 'Wool & cashmere', 'Denim & chambray',
                  'Leather & suede', 'Knits & sweaters', 'Synthetic blends', 'Sustainable fabrics',
                  'Vintage textiles', 'Technical fabrics', 'Velvet & corduroy', 'Lace & embroidery'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.preferences.materials.includes(option)}
                      onChange={() => handleCheckboxChange('preferences', 'materials', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Preferred Fits</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Oversized & relaxed', 'Tailored & structured', 'Slim & fitted', 'Flowy & draped',
                  'High-waisted bottoms', 'Low-rise bottoms', 'Cropped tops', 'Longer lengths',
                  'Wide-leg pants', 'Skinny fits', 'A-line silhouettes', 'Bodycon styles'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.preferences.fits.includes(option)}
                      onChange={() => handleCheckboxChange('preferences', 'fits', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 6: // Occasions & Moods
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Weekend Style</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Athleisure & comfort', 'Elevated casual', 'Bohemian & free', 'Edgy & alternative',
                  'Preppy & polished', 'Minimalist chic', 'Romantic & feminine', 'Vintage inspired',
                  'Streetwear influenced', 'Nature & outdoorsy', 'Artist & creative', 'Cozy & homey'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.occasions.weekend.includes(option)}
                      onChange={() => handleCheckboxChange('occasions', 'weekend', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Night Out Vibes</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Glamorous & dramatic', 'Sleek & sophisticated', 'Fun & playful', 'Mysterious & dark',
                  'Colorful & bold', 'Classic & timeless', 'Trendy & current', 'Unique & artistic',
                  'Comfortable & practical', 'Sexy & confident', 'Ethereal & dreamy', 'Power & statement'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.occasions.nightOut.includes(option)}
                      onChange={() => handleCheckboxChange('occasions', 'nightOut', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 7: // Style Icons
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Fashion Eras That Inspire You</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  '1920s - Art Deco glamour', '1950s - Classic elegance', '1960s - Mod & minimalist', '1970s - Bohemian freedom',
                  '1980s - Power & excess', '1990s - Grunge & minimalism', '2000s - Y2K & experimentation', '2010s - Social media influence',
                  'Victorian romance', 'Edwardian sophistication', 'Jazz Age rebellion', 'Contemporary trends'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.influences.eras.includes(option)}
                      onChange={() => handleCheckboxChange('influences', 'eras', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Style Sources</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Celebrities & red carpet', 'Street style bloggers', 'Fashion influencers', 'Vintage icons',
                  'Musicians & artists', 'Movie characters', 'Royal fashion', 'Sports & athleisure',
                  'Cultural traditions', 'Travel destinations', 'Architecture & design', 'Personal role models'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.influences.sources.includes(option)}
                      onChange={() => handleCheckboxChange('influences', 'sources', option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 8: // Personal Boundaries
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Style Boundaries (select what you avoid)</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Very tight clothing', 'Very loose clothing', 'Short hemlines', 'Long hemlines',
                  'Low necklines', 'High necklines', 'Bright colors', 'Dark colors',
                  'Patterns & prints', 'Plain/solid colors', 'Sheer fabrics', 'Heavy fabrics',
                  'Uncomfortable shoes', 'Flat shoes only', 'High heels only', 'Synthetic materials',
                  'Animal products', 'Fast fashion', 'Expensive items', 'Trendy pieces'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.boundaries.includes(option)}
                      onChange={() => handleCheckboxChange('boundaries', null, option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 9: // Style Samples
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'goToOutfit', label: 'Your GO-TO Outfit' },
                { key: 'dreamPurchase', label: 'Dream Purchase' },
                { key: 'inspiration', label: 'Style Inspiration Photo' },
                { key: 'favoritePiece', label: 'Favorite Current Piece' }
              ].map(({ key, label }) => (
                <div key={key} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    ref={el => fileInputRefs.current[key] = el}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(key as keyof UserProfile['uploads'], file);
                    }}
                    className="hidden"
                  />

                  {userProfile.uploads[key as keyof UserProfile['uploads']] ? (
                    <div className="space-y-2">
                      <img
                        src={userProfile.uploads[key as keyof UserProfile['uploads']] || ''}
                        alt={label}
                        className="w-full h-24 object-cover rounded"
                      />
                      <p className="text-xs text-green-600">✓ Uploaded</p>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRefs.current[key]?.click()}
                      className="cursor-pointer space-y-2"
                    >
                      <Camera className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm font-medium">{label}</p>
                      <Upload className="w-4 h-4 mx-auto text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your style in 3 words:
                </label>
                <div className="flex space-x-2">
                  {[0, 1, 2].map(index => (
                    <input
                      key={index}
                      type="text"
                      value={userProfile.descriptions.threeWords[index] || ''}
                      onChange={(e) => handleThreeWordsChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={`Word ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fashion rule you always follow:
                </label>
                <input
                  type="text"
                  value={userProfile.descriptions.alwaysFollow}
                  onChange={(e) => handleTextInputChange('descriptions', 'alwaysFollow', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Never wear white after Labor Day"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fashion rule you love to break:
                </label>
                <input
                  type="text"
                  value={userProfile.descriptions.loveToBreak}
                  onChange={(e) => handleTextInputChange('descriptions', 'loveToBreak', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Mixing patterns"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item you'd never throw away:
                </label>
                <input
                  type="text"
                  value={userProfile.descriptions.neverThrowAway}
                  onChange={(e) => handleTextInputChange('descriptions', 'neverThrowAway', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., My vintage leather jacket"
                />
              </div>
            </div>
          </div>
        );

      case 10: // Seasonal Preferences
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Seasonal Style Preferences</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Spring florals & pastels', 'Summer brights & linens', 'Autumn earth tones', 'Winter layers & textures',
                  'Year-round neutrals', 'Seasonal color switching', 'Weather-appropriate fabrics', 'Holiday dressing',
                  'Vacation wardrobe', 'Transitional pieces', 'Climate-conscious choices', 'Seasonal accessories',
                  'Mood-based dressing', 'Activity-specific wear', 'Cultural celebrations', 'Personal traditions'
                ].map(option => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.seasonal.includes(option)}
                      onChange={() => handleCheckboxChange('seasonal', null, option)}
                      className="rounded text-amber-600"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 11: // Your Sizes
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 mb-6">
              Help us find the perfect fit! Select your typical sizes for better product recommendations.
            </p>

            {/* Gender Selector */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-6">
              <label className="block text-sm font-bold text-gray-800 mb-3">
                Select Size Category
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setUserProfile(prev => ({
                    ...prev,
                    sizes: { ...prev.sizes, gender: 'women' }
                  }))}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    userProfile.sizes.gender === 'women'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  Women's
                </button>
                <button
                  type="button"
                  onClick={() => setUserProfile(prev => ({
                    ...prev,
                    sizes: { ...prev.sizes, gender: 'men' }
                  }))}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    userProfile.sizes.gender === 'men'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  Men's
                </button>
                <button
                  type="button"
                  onClick={() => setUserProfile(prev => ({
                    ...prev,
                    sizes: { ...prev.sizes, gender: 'unisex' }
                  }))}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    userProfile.sizes.gender === 'unisex'
                      ? 'bg-gradient-to-r from-purple-500 to-amber-500 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  Unisex
                </button>
              </div>
            </div>

            {/* Size Fields - Shown after gender selection */}
            {userProfile.sizes.gender && (
              <div className="space-y-4">
                {/* Tops */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tops
                  </label>
                  <select
                    value={userProfile.sizes.tops}
                    onChange={(e) => setUserProfile(prev => ({
                      ...prev,
                      sizes: { ...prev.sizes, tops: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Select size...</option>
                    <option value="XXS">XXS</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>

                {/* Bottoms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bottoms
                  </label>
                  <select
                    value={userProfile.sizes.bottoms}
                    onChange={(e) => setUserProfile(prev => ({
                      ...prev,
                      sizes: { ...prev.sizes, bottoms: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Select size...</option>
                    <option value="XXS">XXS</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>

                {/* Dresses - Women's and Unisex only */}
                {(userProfile.sizes.gender === 'women' || userProfile.sizes.gender === 'unisex') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dresses
                    </label>
                    <select
                      value={userProfile.sizes.dresses}
                      onChange={(e) => setUserProfile(prev => ({
                        ...prev,
                        sizes: { ...prev.sizes, dresses: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="">Select size...</option>
                      <option value="XXS">XXS</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>
                )}

                {/* Outerwear/Suits - Men's and Unisex only */}
                {(userProfile.sizes.gender === 'men' || userProfile.sizes.gender === 'unisex') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Outerwear / Suits
                    </label>
                    <select
                      value={userProfile.sizes.outerwear}
                      onChange={(e) => setUserProfile(prev => ({
                        ...prev,
                        sizes: { ...prev.sizes, outerwear: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="">Select size...</option>
                      <option value="XXS">XXS</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>
                )}

                {/* Shoes - Gender-specific ranges */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shoes (US {userProfile.sizes.gender === 'men' ? "Men's" : userProfile.sizes.gender === 'women' ? "Women's" : "Sizes"})
                  </label>
                  <select
                    value={userProfile.sizes.shoes}
                    onChange={(e) => setUserProfile(prev => ({
                      ...prev,
                      sizes: { ...prev.sizes, shoes: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Select size...</option>
                    {userProfile.sizes.gender === 'men' ? (
                      // Men's shoe sizes: 7-15
                      <>
                        <option value="7">7</option>
                        <option value="7.5">7.5</option>
                        <option value="8">8</option>
                        <option value="8.5">8.5</option>
                        <option value="9">9</option>
                        <option value="9.5">9.5</option>
                        <option value="10">10</option>
                        <option value="10.5">10.5</option>
                        <option value="11">11</option>
                        <option value="11.5">11.5</option>
                        <option value="12">12</option>
                        <option value="12.5">12.5</option>
                        <option value="13">13</option>
                        <option value="14">14</option>
                        <option value="15">15</option>
                      </>
                    ) : userProfile.sizes.gender === 'women' ? (
                      // Women's shoe sizes: 5-12
                      <>
                        <option value="5">5</option>
                        <option value="5.5">5.5</option>
                        <option value="6">6</option>
                        <option value="6.5">6.5</option>
                        <option value="7">7</option>
                        <option value="7.5">7.5</option>
                        <option value="8">8</option>
                        <option value="8.5">8.5</option>
                        <option value="9">9</option>
                        <option value="9.5">9.5</option>
                        <option value="10">10</option>
                        <option value="10.5">10.5</option>
                        <option value="11">11</option>
                        <option value="11.5">11.5</option>
                        <option value="12">12</option>
                      </>
                    ) : (
                      // Unisex: Show full range 5-15
                      <>
                        <option value="5">5</option>
                        <option value="5.5">5.5</option>
                        <option value="6">6</option>
                        <option value="6.5">6.5</option>
                        <option value="7">7</option>
                        <option value="7.5">7.5</option>
                        <option value="8">8</option>
                        <option value="8.5">8.5</option>
                        <option value="9">9</option>
                        <option value="9.5">9.5</option>
                        <option value="10">10</option>
                        <option value="10.5">10.5</option>
                        <option value="11">11</option>
                        <option value="11.5">11.5</option>
                        <option value="12">12</option>
                        <option value="12.5">12.5</option>
                        <option value="13">13</option>
                        <option value="13.5">13.5</option>
                        <option value="14">14</option>
                        <option value="14.5">14.5</option>
                        <option value="15">15</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            )}

            {/* Prompt to select gender if not yet selected */}
            {!userProfile.sizes.gender && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">👆 Please select a size category above to continue</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Section {currentSection + 1} coming soon...</p>
            <p className="text-sm text-gray-500 mt-2">This section is under development</p>
          </div>
        );
    }
  };

  if (showStyleAnalysis) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-6 py-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900 via-transparent to-slate-900"></div>
        </div>

        <div className="z-10 max-w-4xl mx-auto w-full">
          <div className="mb-8">
            {styleAnalysisResult?.success ? (
              <>
                <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h1 className="font-dancing-script text-5xl mb-4 bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600 bg-clip-text text-transparent">
                  Your AI-Powered Style Profile
                </h1>
                <p className="text-gray-600 text-lg">Comprehensive analysis powered by artificial intelligence</p>
              </>
            ) : (
              <>
                <CheckCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="font-dancing-script text-5xl mb-4 bg-gradient-to-r from-red-600 via-stone-500 to-red-600 bg-clip-text text-transparent">
                  Analysis Error
                </h1>
                <p className="text-gray-600 text-lg">Don't worry - you can still continue your journey</p>
              </>
            )}
          </div>

          {styleAnalysisResult?.success && styleAnalysisResult.analysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Style Personality */}
              <div className="glass-beige rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                  Style Personality
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {styleAnalysisResult.analysis.stylePersonality}
                </p>
                <div className="flex flex-wrap gap-2">
                  {styleAnalysisResult.analysis.dominantArchetypes.map((archetype, index) => (
                    <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {archetype}
                    </span>
                  ))}
                </div>
              </div>

              {/* Color Profile */}
              <div className="glass-beige rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Color Palette</h3>
                <p className="text-gray-700 leading-relaxed">
                  {styleAnalysisResult.analysis.colorProfile}
                </p>
              </div>

              {/* Wardrobe Essentials */}
              <div className="glass-beige rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Wardrobe Strategy</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-green-700 mb-1">Must-Have Items:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {styleAnalysisResult.analysis.wardrobe.essentials.slice(0, 3).map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-700 mb-1">Investment Pieces:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {styleAnalysisResult.analysis.wardrobe.invest.slice(0, 2).map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Shopping Recommendations */}
              <div className="glass-beige rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Shopping Guide</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  {styleAnalysisResult.analysis.shoppingRecommendations.slice(0, 3).map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
                {styleAnalysisResult.analysis.brands.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Recommended Brands:</h4>
                    <div className="flex flex-wrap gap-1">
                      {styleAnalysisResult.analysis.brands.slice(0, 4).map((brand, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-beige rounded-2xl p-8 mb-8">
              <p className="text-red-600 font-medium mb-2">
                {styleAnalysisResult?.error || 'Analysis could not be completed'}
              </p>
              <p className="text-gray-600">
                Don't worry! You can continue to your dashboard and return to complete your profile later.
              </p>
            </div>
          )}

          <div className="text-sm text-gray-600 mb-8">
            Profile Completion: {calculateProgress()}%
            {styleAnalysisResult?.success && (
              <span className="ml-4 text-purple-600 font-medium">• AI Analysis Complete</span>
            )}
          </div>
        </div>

        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10">
          <button
            onClick={() => setShowStyleAnalysis(false)}
            className="flex items-center space-x-2 glass-beige-light text-gray-700 px-6 py-3 rounded-2xl shadow-lg hover:glass-beige hover:scale-105 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Edit Profile</span>
          </button>

          {styleAnalysisResult?.success && (
            <button
              onClick={() => {
                // Save the enhanced analysis
                localStorage.setItem('styleAnalysisResult', JSON.stringify(styleAnalysisResult));
                generateStyleAnalysis();
              }}
              className="flex items-center space-x-2 glass-beige-light text-purple-700 px-6 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Brain className="w-5 h-5" />
              <span className="font-medium">Regenerate</span>
            </button>
          )}

          <button
            onClick={onNext}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-amber-600 text-white px-8 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300 hover:shadow-xl"
          >
            <span className="font-medium">Continue to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900 via-transparent to-blue-900"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-gold-300 rotate-45 opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border border-amber-300 rotate-12 opacity-20"></div>
      </div>

      {/* Form Content */}
      <div className="flex flex-col px-6 py-8">
        {/* Header */}
        <div className="z-10 text-center mb-8">
          <h1 className="font-dancing-script text-5xl md:text-6xl mb-4 text-black">
            Style Personalization
          </h1>
          <p className="text-lg text-gray-600">
            Help us understand your unique style preferences
          </p>

          {/* Auto-fill indicator */}
          {isAutoFilled && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Auto-filled from saved data - edit as needed</span>
            </div>
          )}

          {/* NEW FEATURE CALLOUT - Size Preferences */}
          <div className="mt-4 max-w-2xl mx-auto bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-center space-x-3">
              <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
              <div className="text-center">
                <p className="text-sm font-bold text-amber-900">
                  NEW: Size Preferences for Everyone!
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Section 12 "Your Sizes" now supports Women's, Men's & Unisex sizing for better recommendations
                </p>
              </div>
              <button
                onClick={() => setCurrentSection(11)}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md hover:scale-105 transition-all"
              >
                Go There →
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progress</span>
              <span>{calculateProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-amber-500 to-stone-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>

      {/* Section Navigation */}
      <div className="z-10 max-w-4xl mx-auto mb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {sections.map((section, index) => (
            <button
              key={section}
              onClick={() => setCurrentSection(index)}
              className={`relative px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                currentSection === index
                  ? 'bg-white/20 backdrop-blur-sm text-black shadow-md border border-white/30 scale-110'
                  : index === 11
                  ? 'glass-beige-light text-gray-700 hover:glass-beige ring-2 ring-amber-400 shadow-lg'
                  : 'glass-beige-light text-gray-700 hover:glass-beige'
              }`}
            >
              <span className="flex items-center gap-1">
                {index + 1}. {section}
                {index === 11 && (
                  <span className="ml-1">
                    <Sparkles className="w-3 h-3 text-amber-500 inline" />
                  </span>
                )}
              </span>
              {index === 11 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                  NEW
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current Section */}
      <div className="z-10 max-w-4xl mx-auto flex-1">
        <div className="glass-beige rounded-2xl p-8 min-h-[400px]">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {sections[currentSection]}
          </h2>

          {renderSection()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="z-10 flex justify-center items-center space-x-4 mt-8">
        <button
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>

        <button
          onClick={async () => {
            console.log('🔵 Save button clicked');
            console.log('🔵 Current isSaved state:', isSaved);

            try {
              // Save FULL profile including images to IndexedDB (50MB+ capacity!)
              const success = await stylePreferencesService.saveStyleProfile(userProfile);

              if (success) {
                console.log('✅ Style profile saved to IndexedDB with images!');
                setIsSaved(true);
                console.log('🔵 Set isSaved to true');

                // Reset saved indicator after 2 seconds
                setTimeout(() => {
                  setIsSaved(false);
                  console.log('🔵 Reset isSaved to false');
                }, 2000);
              } else {
                throw new Error('Failed to save to IndexedDB');
              }
            } catch (error) {
              console.error('❌ Failed to save style profile:', error);
              alert('Failed to save preferences. Please try again.');
            }
          }}
          className={`flex flex-col items-center space-y-1 px-6 py-3 rounded-lg hover:scale-105 transition-all duration-300 ${
            isSaved ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'text-black'
          }`}
        >
          {isSaved ? (
            <>
              <CheckCircle className="w-5 h-5 animate-bounce" />
              <span className="font-medium">✓ Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span className="font-medium">Save Progress</span>
            </>
          )}
        </button>

        {/* Debug indicator - remove this later */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500">
            Debug: isSaved = {isSaved ? 'true' : 'false'}
          </div>
        )}

        {currentSection === sections.length - 1 ? (
          <button
            onClick={canCompleteProfile() ? generateStyleAnalysis : undefined}
            disabled={!canCompleteProfile() || isGeneratingAnalysis}
            className="disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            {isGeneratingAnalysis ? (
              <div className="flex flex-col items-center space-y-1">
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                <span className="text-xs text-purple-600 font-medium">AI Analysis...</span>
              </div>
            ) : (
              <ArrowRight className={`w-6 h-6 ${canCompleteProfile() ? 'text-black' : 'text-gray-400'}`} />
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
          >
            <ArrowRight className="w-6 h-6 text-black" />
          </button>
        )}
        </div>

        {/* Back to Previous Page */}
        <button
          onClick={onBack}
          className="fixed top-8 left-8 z-20"
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
      </div>
    </div>
  );
};

export default Page4Component;