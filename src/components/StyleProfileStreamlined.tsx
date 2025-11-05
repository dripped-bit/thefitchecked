import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Upload, Save, CheckCircle, Camera, Loader2, X, Check } from 'lucide-react';
import stylePreferencesService from '../services/stylePreferencesService';
import userPreferencesService from '../services/userPreferencesService';
import authService from '../services/authService';
import UserService from '../services/userService';

interface StyleProfileStreamlinedProps {
  onNext: () => void;
  onBack: () => void;
  avatarData?: any;
  measurements?: any;
  autoFillData?: UserProfile | null;
}

interface UserProfile {
  // Section 1: Quick Style Quiz
  styleVibes: string[];

  // Section 2: Upload Style Inspiration
  uploads: {
    inspiration1: string | null;
    inspiration2: string | null;
  };

  // Section 3: Colors
  favoriteColors: string[];
  avoidColors: string[];

  // Section 4: Shopping
  favoriteStores: string[];
  customStores: string[];

  // Section 5: Occasions
  occasionPriorities: string[];

  // Section 6: Fit Philosophy
  fitPreference: string;

  // Section 7: Three Words
  threeWords: string[];

  // Section 8: Additional Details (consolidated from old sections)
  lifestyle: string[];
  boundaries: string[];
}

const StyleProfileStreamlined: React.FC<StyleProfileStreamlinedProps> = ({
  onNext,
  onBack,
  avatarData,
  measurements,
  autoFillData
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    styleVibes: [],
    uploads: { inspiration1: null, inspiration2: null },
    favoriteColors: [],
    avoidColors: [],
    favoriteStores: [],
    customStores: [],
    occasionPriorities: [],
    fitPreference: '',
    threeWords: ['', '', ''],
    lifestyle: [],
    boundaries: []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Load saved preferences on mount
  useEffect(() => {
    const loadSavedPreferences = async () => {
      const savedProfile = await stylePreferencesService.loadStyleProfile();
      if (savedProfile) {
        console.log('✅ Loaded saved style preferences');
        setUserProfile(savedProfile as UserProfile);
      }
    };
    loadSavedPreferences();
  }, []);

  // Auto-save on profile changes
  useEffect(() => {
    const saveProfile = async () => {
      if (currentSection > 0) {
        await stylePreferencesService.saveStyleProfile(userProfile);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    };
    saveProfile();
  }, [userProfile, currentSection]);

  const sections = [
    "What's Your Vibe?",
    'Show Us Your Style',
    'Your Color Palette',
    'Where You Shop',
    'What You Dress For',
    'How You Like Your Fit',
    'Describe Your Style',
    'Style Extras'
  ];

  const calculateProgress = () => {
    // Guard against undefined userProfile
    if (!userProfile) return 0;

    let totalFields = 0;
    let filledFields = 0;

    // Count filled sections with null-safe checks
    if (userProfile.styleVibes?.length >= 2) filledFields++;
    totalFields++;

    if (userProfile.uploads?.inspiration1 && userProfile.uploads?.inspiration2) filledFields++;
    totalFields++;

    if (userProfile.favoriteColors?.length >= 3) filledFields++;
    totalFields++;

    if (userProfile.favoriteStores?.length >= 3) filledFields++;
    totalFields++;

    if (userProfile.occasionPriorities?.length === 3) filledFields++;
    totalFields++;

    if (userProfile.fitPreference) filledFields++;
    totalFields++;

    const threeWordsCount = userProfile.threeWords?.filter(word => word.trim() !== '').length || 0;
    if (threeWordsCount >= 3) filledFields++;
    totalFields++;

    return Math.round((filledFields / totalFields) * 100);
  };

  const canCompleteProfile = () => {
    if (!userProfile) return false;

    const progress = calculateProgress();
    const hasImage = userProfile.uploads?.inspiration1 || userProfile.uploads?.inspiration2;
    const hasThreeWords = (userProfile.threeWords?.filter(word => word.trim() !== '').length || 0) >= 3;
    return progress >= 50 && hasImage && hasThreeWords;
  };

  const saveStyleProfileToSupabase = async () => {
    setIsSaving(true);

    try {
      console.log('💾 Saving style profile...');

      // Save to IndexedDB for local access (always works)
      await stylePreferencesService.saveStyleProfile({
        fashionPersonality: {
          archetypes: userProfile.styleVibes,
          colorPalette: userProfile.favoriteColors,
          avoidColors: userProfile.avoidColors
        },
        shopping: {
          favoriteStores: userProfile.favoriteStores,
          customStores: userProfile.customStores
        },
        preferences: {
          fits: userProfile.fitPreference ? [userProfile.fitPreference] : []
        },
        lifestyle: {
          workEnvironment: userProfile.lifestyle
        },
        occasions: {
          weekend: userProfile.occasionPriorities
        },
        boundaries: userProfile.boundaries,
        descriptions: {
          threeWords: userProfile.threeWords
        }
      } as any);

      console.log('✅ Style profile saved to IndexedDB');

      // Try to save to Supabase (optional - won't fail if table doesn't exist)
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          await userPreferencesService.saveStyleProfile(user.id, {
            style_vibes: userProfile.styleVibes,
            favorite_colors: userProfile.favoriteColors,
            avoid_colors: userProfile.avoidColors,
            lifestyle: userProfile.lifestyle,
            favorite_stores: userProfile.favoriteStores,
            custom_stores: userProfile.customStores,
            fit_preference: userProfile.fitPreference,
            occasion_priorities: userProfile.occasionPriorities,
            boundaries: userProfile.boundaries,
            three_words: userProfile.threeWords,
            inspiration_images: userProfile.uploads
          });
          console.log('✅ Style profile also saved to Supabase');
        }
      } catch (supabaseError) {
        // Supabase save failed, but that's okay - we have IndexedDB
        console.log('ℹ️ Supabase save skipped (table may not exist yet)');
      }

      setIsSaved(true);

      // Mark flow as completed
      UserService.markFlowCompleted();

      // Navigate to next screen after brief delay
      setTimeout(() => {
        onNext();
      }, 1000);

    } catch (error) {
      console.error('❌ Failed to save style profile:', error);
      alert('Failed to save your style preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArrayChange = (field: keyof UserProfile, value: string, isMultiple: boolean = true) => {
    setUserProfile(prev => {
      const currentArray = prev[field] as string[];
      const index = currentArray.indexOf(value);

      if (index > -1) {
        // Remove if already selected
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      } else {
        // Add if not selected
        return { ...prev, [field]: isMultiple ? [...currentArray, value] : [value] };
      }
    });
  };

  const handleImageUpload = (file: File, uploadKey: 'inspiration1' | 'inspiration2') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserProfile(prev => ({
        ...prev,
        uploads: { ...prev.uploads, [uploadKey]: reader.result as string }
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (uploadKey: 'inspiration1' | 'inspiration2') => {
    setUserProfile(prev => ({
      ...prev,
      uploads: { ...prev.uploads, [uploadKey]: null }
    }));
  };

  // Style Vibe options
  const styleVibes = [
    { id: 'elegant', label: 'Elegant', emoji: '✨' },
    { id: 'romantic', label: 'Romantic', emoji: '💕' },
    { id: 'bold', label: 'Bold', emoji: '🔥' },
    { id: 'minimalist', label: 'Minimalist', emoji: '⚪' },
    { id: 'bohemian', label: 'Bohemian', emoji: '🌸' },
    { id: 'classic', label: 'Classic', emoji: '👔' },
    { id: 'edgy', label: 'Edgy', emoji: '⚡' },
    { id: 'casual', label: 'Casual', emoji: '👟' }
  ];

  // Color options with actual colors
  const colorOptions = {
    neutrals: [
      { name: 'Beige', hex: '#F5F5DC' },
      { name: 'Cream', hex: '#FFFDD0' },
      { name: 'Gray', hex: '#808080' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' }
    ],
    earthTones: [
      { name: 'Olive', hex: '#808000' },
      { name: 'Terracotta', hex: '#E2725B' },
      { name: 'Brown', hex: '#964B00' },
      { name: 'Rust', hex: '#B7410E' }
    ],
    pastels: [
      { name: 'Blush', hex: '#FFB6C1' },
      { name: 'Lavender', hex: '#E6E6FA' },
      { name: 'Mint', hex: '#98FF98' },
      { name: 'Baby Blue', hex: '#89CFF0' }
    ],
    jewelTones: [
      { name: 'Emerald', hex: '#50C878' },
      { name: 'Sapphire', hex: '#0F52BA' },
      { name: 'Ruby', hex: '#E0115F' },
      { name: 'Amethyst', hex: '#9966CC' }
    ],
    brights: [
      { name: 'Red', hex: '#FF0000' },
      { name: 'Cobalt', hex: '#0047AB' },
      { name: 'Fuchsia', hex: '#FF00FF' },
      { name: 'Yellow', hex: '#FFFF00' }
    ]
  };

  // Store suggestions
  const storeSuggestions = [
    'Zara', 'H&M', 'Nordstrom', 'ASOS', 'Madewell', 'Target',
    'Urban Outfitters', 'Free People', 'Anthropologie', 'Reformation',
    'Everlane', 'COS', 'Uniqlo', 'J.Crew', 'Banana Republic'
  ];

  // Occasion options
  const occasions = [
    { id: 'work', label: 'Work/Office', emoji: '💼' },
    { id: 'casual', label: 'Casual Daily', emoji: '👕' },
    { id: 'date', label: 'Date Night', emoji: '🌹' },
    { id: 'events', label: 'Special Events', emoji: '🎉' },
    { id: 'active', label: 'Workouts/Active', emoji: '🏃' },
    { id: 'brunch', label: 'Weekend Brunch', emoji: '🥐' }
  ];

  // Fit preferences
  const fitOptions = [
    { id: 'relaxed', label: 'Relaxed & Flowy', description: 'Loose, comfortable silhouettes' },
    { id: 'fitted', label: 'Fitted & Tailored', description: 'Structured, form-fitting pieces' },
    { id: 'oversized', label: 'Oversized & Comfy', description: 'Roomy, cozy fits' },
    { id: 'mix', label: 'Mix of All', description: 'Variety depending on mood' }
  ];

  // Word suggestions for Section 7
  const wordSuggestions = [
    'confident', 'playful', 'sophisticated', 'cozy', 'bold', 'elegant',
    'edgy', 'minimalist', 'romantic', 'casual', 'chic', 'modern',
    'vintage', 'bohemian', 'professional', 'creative', 'comfortable',
    'polished', 'effortless', 'timeless'
  ];

  const renderSection = () => {
    switch (currentSection) {
      // SECTION 1: QUICK STYLE QUIZ
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                What's Your Vibe?
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Choose 2-3 styles that speak to you
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {styleVibes.map(vibe => (
                <button
                  key={vibe.id}
                  onClick={() => {
                    if (userProfile.styleVibes.includes(vibe.id)) {
                      handleArrayChange('styleVibes', vibe.id);
                    } else if (userProfile.styleVibes.length < 3) {
                      handleArrayChange('styleVibes', vibe.id);
                    }
                  }}
                  disabled={!userProfile.styleVibes.includes(vibe.id) && userProfile.styleVibes.length >= 3}
                  className={`
                    min-h-[120px] sm:min-h-[140px] p-4 rounded-xl border-2
                    transition-all duration-200 active:scale-95 touch-manipulation
                    flex flex-col items-center justify-center gap-2
                    ${userProfile.styleVibes.includes(vibe.id)
                      ? 'border-amber-500 bg-amber-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-amber-300'
                    }
                    ${!userProfile.styleVibes.includes(vibe.id) && userProfile.styleVibes.length >= 3
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                    }
                  `}
                >
                  <span className="text-4xl">{vibe.emoji}</span>
                  <span className="text-base sm:text-lg font-medium text-gray-900">
                    {vibe.label}
                  </span>
                  {userProfile.styleVibes.includes(vibe.id) && (
                    <Check className="w-5 h-5 text-amber-600 absolute top-2 right-2" />
                  )}
                </button>
              ))}
            </div>

            {userProfile.styleVibes.length > 0 && (
              <p className="text-sm text-center text-gray-500">
                {userProfile.styleVibes.length} of 3 selected
              </p>
            )}
          </div>
        );

      // SECTION 2: UPLOAD STYLE INSPIRATION
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Show Us Your Style
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Upload 2 outfit photos you love
              </p>
              <p className="text-sm text-gray-500 mt-1">
                (from Pinterest, Instagram, or your camera roll)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['inspiration1', 'inspiration2'] as const).map((uploadKey, index) => (
                <div key={uploadKey} className="relative">
                  {!userProfile.uploads[uploadKey] ? (
                    <label
                      className="
                        flex flex-col items-center justify-center
                        h-[200px] sm:h-[250px] border-2 border-dashed border-gray-300
                        rounded-xl cursor-pointer hover:border-amber-500
                        transition-all duration-200 bg-gray-50 hover:bg-amber-50
                        touch-manipulation active:scale-[0.98]
                      "
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-base text-gray-600 font-medium">
                        Tap to upload
                      </span>
                      <span className="text-sm text-gray-400 mt-1">
                        Photo {index + 1}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, uploadKey);
                        }}
                      />
                    </label>
                  ) : (
                    <div className="relative h-[200px] sm:h-[250px] rounded-xl overflow-hidden">
                      <img
                        src={userProfile.uploads[uploadKey]!}
                        alt={`Inspiration ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(uploadKey)}
                        className="
                          absolute top-2 right-2 w-8 h-8
                          bg-red-500 text-white rounded-full
                          flex items-center justify-center
                          hover:bg-red-600 transition-colors
                          touch-manipulation
                        "
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-center text-sm">
                        Photo {index + 1} ✓
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      // SECTION 3: COLORS
      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Your Color Palette
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Pick your favorites (up to 5)
              </p>
            </div>

            {/* Favorite Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Colors I Love</h3>
              {Object.entries(colorOptions).map(([category, colors]) => (
                <div key={category} className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
                    {colors.map(color => (
                      <button
                        key={color.name}
                        onClick={() => {
                          if (userProfile.favoriteColors.includes(color.name)) {
                            handleArrayChange('favoriteColors', color.name);
                          } else if (userProfile.favoriteColors.length < 5) {
                            handleArrayChange('favoriteColors', color.name);
                          }
                        }}
                        disabled={!userProfile.favoriteColors.includes(color.name) && userProfile.favoriteColors.length >= 5}
                        className="relative touch-manipulation active:scale-95 transition-transform"
                        title={color.name}
                      >
                        <div
                          className={`
                            w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-full
                            ${userProfile.favoriteColors.includes(color.name)
                              ? 'ring-4 ring-amber-500'
                              : 'ring-2 ring-gray-200'
                            }
                            ${!userProfile.favoriteColors.includes(color.name) && userProfile.favoriteColors.length >= 5
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer hover:ring-amber-300'
                            }
                          `}
                          style={{
                            backgroundColor: color.hex,
                            border: color.hex === '#FFFFFF' ? '1px solid #e5e7eb' : 'none'
                          }}
                        />
                        {userProfile.favoriteColors.includes(color.name) && (
                          <Check className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" />
                        )}
                        <p className="text-xs mt-1 text-gray-600">{color.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {userProfile.favoriteColors.length > 0 && (
                <p className="text-sm text-gray-500">
                  {userProfile.favoriteColors.length} of 5 selected
                </p>
              )}
            </div>

            {/* Avoid Colors */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Colors I Avoid</h3>
              <p className="text-sm text-gray-600">Pick up to 3 colors you don't wear</p>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {Object.values(colorOptions).flat().map(color => (
                  <button
                    key={`avoid-${color.name}`}
                    onClick={() => {
                      if (userProfile.avoidColors.includes(color.name)) {
                        handleArrayChange('avoidColors', color.name);
                      } else if (userProfile.avoidColors.length < 3) {
                        handleArrayChange('avoidColors', color.name);
                      }
                    }}
                    disabled={!userProfile.avoidColors.includes(color.name) && userProfile.avoidColors.length >= 3}
                    className="relative touch-manipulation active:scale-95 transition-transform"
                    title={color.name}
                  >
                    <div
                      className={`
                        w-10 h-10 sm:w-12 sm:h-12 rounded-full
                        ${userProfile.avoidColors.includes(color.name)
                          ? 'ring-2 ring-red-500'
                          : 'ring-1 ring-gray-200'
                        }
                        ${!userProfile.avoidColors.includes(color.name) && userProfile.avoidColors.length >= 3
                          ? 'opacity-30 cursor-not-allowed'
                          : 'cursor-pointer'
                        }
                      `}
                      style={{
                        backgroundColor: color.hex,
                        border: color.hex === '#FFFFFF' ? '1px solid #e5e7eb' : 'none'
                      }}
                    />
                    {userProfile.avoidColors.includes(color.name) && (
                      <X className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      // SECTION 4: SHOPPING
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Where Do You Love to Shop?
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Type or select 3-5 of your favorite stores
              </p>
            </div>

            {/* Selected stores as chips */}
            {userProfile.favoriteStores.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {userProfile.favoriteStores.map(store => (
                  <div
                    key={store}
                    className="
                      flex items-center gap-2 px-4 py-2
                      bg-amber-100 text-amber-900 rounded-full
                      text-sm font-medium
                    "
                  >
                    {store}
                    <button
                      onClick={() => handleArrayChange('favoriteStores', store)}
                      className="hover:bg-amber-200 rounded-full p-0.5 touch-manipulation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Store suggestions */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Quick picks:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {storeSuggestions.map(store => (
                  <button
                    key={store}
                    onClick={() => {
                      if (!userProfile.favoriteStores.includes(store) && userProfile.favoriteStores.length < 5) {
                        handleArrayChange('favoriteStores', store);
                      }
                    }}
                    disabled={userProfile.favoriteStores.includes(store) || userProfile.favoriteStores.length >= 5}
                    className={`
                      min-h-[48px] px-4 py-3 rounded-lg border-2
                      text-base font-medium transition-all
                      touch-manipulation active:scale-95
                      ${userProfile.favoriteStores.includes(store)
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300'
                      }
                      ${userProfile.favoriteStores.length >= 5 && !userProfile.favoriteStores.includes(store)
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                      }
                    `}
                  >
                    {store}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm text-center text-gray-500">
              {userProfile.favoriteStores.length} of 5 selected (minimum 3 required)
            </p>
          </div>
        );

      // SECTION 5: OCCASIONS
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                What Do You Dress For Most?
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Tap to rank your top 3
              </p>
            </div>

            <div className="space-y-3">
              {occasions.map(occasion => {
                const rank = userProfile.occasionPriorities.indexOf(occasion.id);
                const isSelected = rank !== -1;

                return (
                  <button
                    key={occasion.id}
                    onClick={() => {
                      if (isSelected) {
                        // Remove from priorities
                        setUserProfile(prev => ({
                          ...prev,
                          occasionPriorities: prev.occasionPriorities.filter(id => id !== occasion.id)
                        }));
                      } else if (userProfile.occasionPriorities.length < 3) {
                        // Add to priorities
                        setUserProfile(prev => ({
                          ...prev,
                          occasionPriorities: [...prev.occasionPriorities, occasion.id]
                        }));
                      }
                    }}
                    disabled={!isSelected && userProfile.occasionPriorities.length >= 3}
                    className={`
                      w-full min-h-[64px] px-6 py-4 rounded-xl border-2
                      flex items-center justify-between gap-4
                      transition-all duration-200 touch-manipulation active:scale-[0.98]
                      ${isSelected
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 bg-white hover:border-amber-300'
                      }
                      ${!isSelected && userProfile.occasionPriorities.length >= 3
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{occasion.emoji}</span>
                      <span className="text-lg font-medium text-gray-900">
                        {occasion.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
                        {rank + 1}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {userProfile.occasionPriorities.length > 0 && (
              <p className="text-sm text-center text-gray-500">
                {userProfile.occasionPriorities.length} of 3 selected
              </p>
            )}
          </div>
        );

      // SECTION 6: FIT PHILOSOPHY
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                How Do You Like Your Clothes to Fit?
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Choose one that feels most like you
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fitOptions.map(fit => (
                <button
                  key={fit.id}
                  onClick={() => setUserProfile(prev => ({ ...prev, fitPreference: fit.id }))}
                  className={`
                    min-h-[80px] p-6 rounded-xl border-2
                    transition-all duration-200 touch-manipulation active:scale-[0.98]
                    ${userProfile.fitPreference === fit.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 bg-white hover:border-amber-300'
                    }
                  `}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {fit.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {fit.description}
                  </p>
                  {userProfile.fitPreference === fit.id && (
                    <Check className="w-5 h-5 text-amber-600 mt-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      // SECTION 7: THREE WORDS
      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Describe Your Style in 3 Words
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                How do you want to feel when you're dressed?
              </p>
            </div>

            <div className="space-y-4">
              {[0, 1, 2].map(index => (
                <div key={index} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Word {index + 1}
                  </label>
                  <input
                    type="text"
                    value={userProfile.threeWords[index]}
                    onChange={(e) => {
                      const newWords = [...userProfile.threeWords];
                      newWords[index] = e.target.value;
                      setUserProfile(prev => ({ ...prev, threeWords: newWords }));
                    }}
                    placeholder={`e.g., ${wordSuggestions[index * 3]}`}
                    className="
                      w-full text-lg min-h-[56px] px-4 py-3 rounded-lg
                      border-2 border-gray-200 focus:border-amber-500 focus:outline-none
                      touch-manipulation
                    "
                    list={`words-${index}`}
                  />
                  <datalist id={`words-${index}`}>
                    {wordSuggestions.map(word => (
                      <option key={word} value={word} />
                    ))}
                  </datalist>
                </div>
              ))}
            </div>

            {/* Quick suggestions */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Quick picks:</p>
              <div className="flex flex-wrap gap-2">
                {wordSuggestions.slice(0, 12).map(word => (
                  <button
                    key={word}
                    onClick={() => {
                      const emptyIndex = userProfile.threeWords.findIndex(w => !w.trim());
                      if (emptyIndex !== -1) {
                        const newWords = [...userProfile.threeWords];
                        newWords[emptyIndex] = word;
                        setUserProfile(prev => ({ ...prev, threeWords: newWords }));
                      }
                    }}
                    className="
                      px-3 py-2 text-sm rounded-full
                      border border-gray-200 bg-white
                      hover:border-amber-500 hover:bg-amber-50
                      transition-all touch-manipulation active:scale-95
                    "
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      // SECTION 8: EXTRAS
      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                A Few More Things
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Optional but helpful for better recommendations
              </p>
            </div>

            <div className="space-y-6">
              {/* Lifestyle */}
              <div className="space-y-3">
                <label className="text-lg font-semibold text-gray-900">
                  Your Lifestyle
                </label>
                <p className="text-sm text-gray-600">Select all that apply</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Active/Athletic', 'Professional/Corporate', 'Creative/Artistic', 'Parent/Caregiver',
                    'Student', 'Remote Worker', 'Frequent Traveler', 'Social Butterfly'].map(lifestyle => (
                    <button
                      key={lifestyle}
                      onClick={() => handleArrayChange('lifestyle', lifestyle)}
                      className={`
                        min-h-[48px] px-4 py-3 rounded-lg border-2 text-base
                        transition-all touch-manipulation active:scale-95
                        ${userProfile.lifestyle.includes(lifestyle)
                          ? 'border-amber-500 bg-amber-50 font-medium'
                          : 'border-gray-200 bg-white hover:border-amber-300'
                        }
                      `}
                    >
                      {lifestyle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Boundaries */}
              <div className="space-y-3">
                <label className="text-lg font-semibold text-gray-900">
                  Style Boundaries
                </label>
                <p className="text-sm text-gray-600">Things you won't wear (optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['No skirts/dresses', 'No heels', 'No bright colors', 'No patterns',
                    'No tight fits', 'No logos', 'No sleeveless', 'No short lengths'].map(boundary => (
                    <button
                      key={boundary}
                      onClick={() => handleArrayChange('boundaries', boundary)}
                      className={`
                        min-h-[48px] px-4 py-3 rounded-lg border-2 text-base
                        transition-all touch-manipulation active:scale-95
                        ${userProfile.boundaries.includes(boundary)
                          ? 'border-red-500 bg-red-50 font-medium'
                          : 'border-gray-200 bg-white hover:border-red-300'
                        }
                      `}
                    >
                      {boundary}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };


  const progress = calculateProgress();
  const canProceed = currentSection === sections.length - 1 ? canCompleteProfile() : true;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50">
      {/* Progress Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentSection + 1} of {sections.length}
            </span>
            <span className="text-sm font-medium text-amber-600">
              {progress}% Complete
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-beige rounded-3xl shadow-xl p-6 sm:p-8 space-y-8">
          {/* Save indicator */}
          {isSaved && (
            <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-out z-50">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Saved ✓</span>
            </div>
          )}

          {/* Current Section */}
          <div className="animate-fade-in">
            {renderSection()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            {currentSection !== 6 && (
              <button
                onClick={() => setCurrentSection(prev => Math.max(0, prev - 1))}
                disabled={currentSection === 0}
                className="
                  flex items-center justify-center gap-2
                  px-6 py-3 rounded-xl border-2 border-gray-300
                  text-gray-700 font-medium min-h-[48px]
                  hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all touch-manipulation active:scale-95
                  sm:w-auto w-full
                "
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            )}

            {currentSection < sections.length - 1 ? (
              <button
                onClick={() => setCurrentSection(prev => prev + 1)}
                disabled={!canProceed}
                className="
                  flex items-center justify-center gap-2
                  px-8 py-3 rounded-xl min-h-[48px]
                  bg-gradient-to-r from-purple-600 to-amber-600 text-white
                  font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all touch-manipulation active:scale-95
                  sm:w-auto w-full sm:ml-auto
                "
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={canCompleteProfile() ? saveStyleProfileToSupabase : undefined}
                disabled={!canCompleteProfile() || isSaving}
                className="
                  flex items-center justify-center gap-2
                  px-8 py-3 rounded-xl min-h-[48px]
                  bg-gradient-to-r from-purple-600 to-amber-600 text-white
                  font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all touch-manipulation active:scale-95
                  sm:w-auto w-full sm:ml-auto
                "
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : isSaved ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Complete Profile
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleProfileStreamlined;
