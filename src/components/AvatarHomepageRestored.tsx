import React, { useState, useEffect, useRef } from 'react';
import {
  Sun, Cloud, CloudRain, Snowflake, ArrowLeft, ArrowRight, RefreshCw,
  Edit, Settings, Thermometer, Wind, Eye, Calendar,
  Shirt, Palette, User, AlertCircle, Loader, MapPin, Clock,
  TrendingUp, Camera, Share2, ShoppingCart, ShoppingBag, Heart,
  RotateCcw, Trash2, ArrowRightCircle, X, Check, DollarSign,
  Search, ExternalLink, Tag, Package, Users, MessageCircle
} from 'lucide-react';
import { weatherService, WeatherData } from '../services/weatherService';
import { outfitGenerationService, OutfitSuggestion, StyleProfile } from '../services/outfitGenerationService';
import { avatarAnimationService, AnimationType } from '../services/avatarAnimationService';
import TwoStepClothingWorkflow from './TwoStepClothingWorkflow';
import EnhancedOutfitGenerator from './EnhancedOutfitGenerator';
import { UserData } from '../types/user';
import UserService from '../services/userService';
import AchievementsService from '../services/achievementsService';
import ClosetService, { ClothingCategory } from '../services/closetService';
import webEnhancedPromptService, { PromptVariation } from '../services/webEnhancedPromptService';
import WebEnhancedPromptModal from './WebEnhancedPromptModal';
import ShareModal from './ShareModal';
import SaveToClosetModal, { SavedItemData } from './SaveToClosetModal';
import seamlessTryOnService, { SeamlessTryOnResult, TryOnProgress } from '../services/seamlessTryOnService';
import AvatarClothingAnalysisService, { AvatarClothingAnalysis } from '../services/avatarClothingAnalysisService';
import PerplexityService, { ProductSearchResult, ProductSearchOptions } from '../services/perplexityService';
import FashionFeedDashboard from './FashionFeedDashboard';
import affiliateLinkService from '../services/affiliateLinkService';

interface AvatarHomepageProps {
  onBack: () => void;
  onNavigateToOutfitChange?: () => void;
  onNavigateToMeasurements?: () => void;
  onNavigateToStyleProfile?: () => void;
  onNavigateToCloset?: () => void;
  onResetAvatar?: () => void;
  onAvatarUpdate?: (avatarData: any) => void;
  avatarData?: any;
  userData?: UserData | null;
  styleProfile?: StyleProfile;
}

interface WishlistItem {
  id: string;
  imageUrl: string;
  notes: string;
  dateAdded: string;
  fromPrompt: string;
  category?: string;
  name?: string;
}

interface ShoppingLink extends ProductSearchResult {
  // Extends ProductSearchResult from PerplexityService
}

const AvatarHomepage: React.FC<AvatarHomepageProps> = ({
  onBack,
  onNavigateToOutfitChange,
  onNavigateToMeasurements,
  onNavigateToStyleProfile,
  onNavigateToCloset,
  onResetAvatar,
  onAvatarUpdate,
  avatarData,
  userData,
  styleProfile
}) => {
  // Time and weather state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Outfit generation state
  const [avatarAnimation, setAvatarAnimation] = useState<AnimationType>('breathing');
  const [applyingOutfit, setApplyingOutfit] = useState(false);

  // Upload and clothing management state
  const [uploadingClothing, setUploadingClothing] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory>('tops');
  const [clothingName, setClothingName] = useState('');
  const [clothingDescription, setClothingDescription] = useState('');

  // Refresh and preferences state
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshMode, setRefreshMode] = useState<'smart' | 'seasonal' | 'color' | 'occasion'>('smart');
  const [userPreferences, setUserPreferences] = useState({
    likedOutfits: [] as number[],
    skippedOutfits: [] as number[],
    preferredStyles: [] as string[],
    preferredColors: [] as string[]
  });

  // Custom outfit generation state
  const [outfitPrompt, setOutfitPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'casual' | 'formal' | 'trendy' | 'vintage' | 'minimalist' | 'edgy'>('casual');
  const [isGeneratingCustomOutfit, setIsGeneratingCustomOutfit] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<any>(null);
  const [outfitPreviewImage, setOutfitPreviewImage] = useState<string | null>(null);

  // Web-enhanced prompt modal state
  const [showWebEnhancedModal, setShowWebEnhancedModal] = useState(false);
  const [webEnhancedVariations, setWebEnhancedVariations] = useState<PromptVariation[]>([]);
  const [isGeneratingWebVariations, setIsGeneratingWebVariations] = useState(false);

  // Save to closet modal state
  const [showSaveToClosetModal, setShowSaveToClosetModal] = useState(false);
  const [pendingSaveImage, setPendingSaveImage] = useState<string | null>(null);
  const [pendingSavePrompt, setPendingSavePrompt] = useState<string>('');

  // Multiple outfit generation state
  const [multipleOutfitImages, setMultipleOutfitImages] = useState<Array<{ url: string; prompt: string; variation: string }> | null>(null);
  const [showImageSelection, setShowImageSelection] = useState(false);
  const [isGeneratingMultiple, setIsGeneratingMultiple] = useState(false);

  // Wishlist state
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [activeView, setActiveView] = useState<'closet' | 'wishlist' | 'fashion-feed'>('closet');

  // Seamless try-on state
  const [isSeamlessTryOn, setIsSeamlessTryOn] = useState(false);
  const [tryOnProgress, setTryOnProgress] = useState<TryOnProgress | null>(null);
  const [seamlessTryOnResult, setSeamlessTryOnResult] = useState<SeamlessTryOnResult | null>(null);

  // Outfit preview state
  const [showOutfitPreview, setShowOutfitPreview] = useState(false);
  const [isApplyingOutfitToAvatar, setIsApplyingOutfitToAvatar] = useState(false);

  // Avatar pose and animation state
  const [avatarPose, setAvatarPose] = useState<number>(0); // Random pose index
  const [showPoseTransition, setShowPoseTransition] = useState(false);

  // Post-generation workflow state
  const [showWishlistPrompt, setShowWishlistPrompt] = useState(false);
  const [showShoppingPrompt, setShowShoppingPrompt] = useState(false);
  const [showShoppingForm, setShowShoppingForm] = useState(false);
  const [shoppingResults, setShoppingResults] = useState<ShoppingLink[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentGeneratedItem, setCurrentGeneratedItem] = useState<{
    imageUrl: string;
    description: string;
    category: string;
  } | null>(null);

  // Shopping form state
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' });
  const [clothingSize, setClothingSize] = useState('M');
  const [preferredStores, setPreferredStores] = useState<string[]>([]);

  // Avatar analysis state
  const [avatarAnalysis, setAvatarAnalysis] = useState<AvatarClothingAnalysis | null>(null);
  const [isAnalyzingAvatar, setIsAnalyzingAvatar] = useState(false);

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsCity, setSettingsCity] = useState(userData?.city || '');
  const [settingsState, setSettingsState] = useState(userData?.state || '');
  const [settingsTimezone, setSettingsTimezone] = useState(userData?.timezone || 'America/Los_Angeles');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  // Refs
  const avatarRef = useRef<HTMLDivElement>(null);
  const outfitPreviewRef = useRef<HTMLDivElement>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load weather data
  useEffect(() => {
    const loadWeather = async () => {
      try {
        setWeatherLoading(true);
        const weatherData = await weatherService.getCurrentWeather();
        setWeather(weatherData);
        setWeatherError(null);
      } catch (error) {
        console.error('Failed to load weather:', error);
        setWeatherError('Weather unavailable');
      } finally {
        setWeatherLoading(false);
      }
    };

    loadWeather();
  }, []);

  // Load wishlist from localStorage
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('fitChecked_wishlist');
      if (savedWishlist) {
        setWishlistItems(JSON.parse(savedWishlist));
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  }, []);

  // Generate random pose when avatar changes
  useEffect(() => {
    if (avatarData) {
      setShowPoseTransition(true);
      setTimeout(() => {
        setAvatarPose(Math.floor(Math.random() * 6)); // 6 different poses
        setShowPoseTransition(false);
      }, 200);

      // 🏆 Trigger avatar customizer achievement when avatar is set
      const avatarAchievement = AchievementsService.onAvatarSet();
      if (avatarAchievement) {
        console.log('🧑‍🎨 Avatar achievement unlocked:', avatarAchievement.title);
      }
    }
  }, [avatarData]);

  // Weather icon helper
  const getWeatherIcon = () => {
    if (weatherLoading) return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
    if (weatherError) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (!weather) return <Sun className="w-4 h-4 text-yellow-500" />;

    switch (weather.condition) {
      case 'sunny': return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'cloudy': return <Cloud className="w-4 h-4 text-gray-500" />;
      case 'rainy': return <CloudRain className="w-4 h-4 text-blue-500" />;
      case 'snowy': return <Snowflake className="w-4 h-4 text-blue-300" />;
      default: return <Sun className="w-4 h-4 text-yellow-500" />;
    }
  };

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get user's first name
  const getUserFirstName = () => {
    if (userData?.firstName) return userData.firstName.toUpperCase();
    // Fallback to the default name you mentioned
    return 'GENEVIE!';
  };

  // Get avatar pose styles
  const getAvatarPoseStyles = () => {
    const poses = [
      'rotate-0 scale-100', // Normal pose
      'rotate-1 scale-105', // Slight right tilt, slightly bigger
      '-rotate-1 scale-105', // Slight left tilt, slightly bigger
      'rotate-2 scale-100', // More right tilt
      '-rotate-2 scale-100', // More left tilt
      'rotate-0 scale-110', // Straight but bigger (confident pose)
    ];

    return poses[avatarPose] || poses[0];
  };

  // Custom outfit generation handler
  const handleGenerateCustomOutfit = async () => {
    console.log('🚀 [SEAMLESS-TRYON] Starting seamless virtual try-on workflow...');

    if (!outfitPrompt.trim()) {
      alert('Please enter a clothing description');
      return;
    }

    if (!avatarData) {
      alert('Please upload an avatar first');
      return;
    }

    try {
      setIsSeamlessTryOn(true);
      setAvatarAnimation('changing');
      setTryOnProgress({ step: 'generating-clothing', message: 'Generating outfit...', progress: 10 });

      const result = await seamlessTryOnService.generateAndTryOn({
        clothingDescription: outfitPrompt,
        avatarImage: avatarData.imageUrl || avatarData,
        style: selectedStyle,
        quality: 'balanced',
        enhancePrompts: true
      }, (progress) => {
        setTryOnProgress(progress);
      });

      setSeamlessTryOnResult(result);

      if (result.success && result.finalImageUrl) {
        if (onAvatarUpdate) {
          onAvatarUpdate({
            imageUrl: result.finalImageUrl,
            withOutfit: true,
            outfitDetails: {
              description: outfitPrompt,
              generationTime: new Date().toISOString()
            }
          });
        }

        setGeneratedOutfit({
          imageUrl: result.finalImageUrl,
          name: outfitPrompt,
          description: outfitPrompt
        });
        setOutfitPreviewImage(result.finalImageUrl);
        setShowOutfitPreview(true);

        alert(
          result.fallbackMode
            ? `Successfully applied: "${outfitPrompt}"!\n\n💡 Development Mode: Outfit image used as avatar. In production, this would blend with your avatar.`
            : `Successfully applied: "${outfitPrompt}"!`
        );

        // Trigger post-generation workflow
        handleItemGenerated(result.finalImageUrl, outfitPrompt);
      } else {
        alert(
          result.fallbackMode
            ? 'Error applying outfit to avatar. Please try again.\n\n💡 Development Mode: Check console for detailed logs.'
            : result.error || 'Failed to generate and apply outfit'
        );
      }
    } catch (error) {
      console.error('❌ [SEAMLESS-TRYON] Error:', error);
      alert('Error generating outfit. Please try again.');
    } finally {
      setIsSeamlessTryOn(false);
      setTryOnProgress(null);
    }
  };

  // Smart upload handler
  const handleSmartUpload = () => {
    setShowUploadModal(true);
  };


  // Apply outfit to avatar using actual virtual try-on
  const handleApplyOutfit = async (outfit: OutfitSuggestion) => {
    if (!avatarData || !onAvatarUpdate) return;

    const avatarImageUrl = avatarData.imageUrl || avatarData;
    if (!avatarImageUrl) {
      alert('Avatar image not available for try-on');
      return;
    }

    try {
      setApplyingOutfit(true);
      setAvatarAnimation('changing');
      console.log('🎯 Starting outfit application for:', outfit.name);

      // Use Hybrid Try-On Service (fal.ai generation + FASHN try-on)
      const garmentPrompt = `${outfit.pieces.join(', ')} in ${outfit.colors.join(' and ')} colors, ${outfit.style} style`;
      console.log('🎨 Starting hybrid try-on with prompt:', garmentPrompt);

      // Step 1: Generate clothing
      setTryOnProgress({
        step: 'generating-clothing',
        message: 'Generating clothing with fal.ai...',
        progress: 30
      });

      // Import and use the virtual try-on service
      const virtualTryOnService = await import('../services/virtualTryOnService');

      // Step 2: Apply to avatar (progress updates happen inside the service)
      setTryOnProgress({
        step: 'applying-to-avatar',
        message: 'Applying clothing with FASHN...',
        progress: 70
      });

      // Note: Using direct clothing image URL since we don't generate from text anymore
      // The garmentPrompt is used for logging purposes
      console.log('🎨 Garment prompt for reference:', garmentPrompt);

      // For now, we'll need a clothing image URL. This might need to be refactored
      // to use a default clothing image or generate one first
      const clothingImageUrl = 'https://via.placeholder.com/512x512?text=Default+Clothing';

      const result = await virtualTryOnService.default.tryOnClothing(avatarImageUrl, clothingImageUrl);

      if (result.success && result.imageUrl) {
        console.log('✅ Outfit successfully applied with Hybrid service!');

        // Final progress update
        setTryOnProgress({
          step: 'completed',
          message: 'Outfit applied successfully!',
          progress: 100
        });

        // Update avatar with new outfit image
        onAvatarUpdate({
          imageUrl: result.imageUrl,
          qualityScore: avatarData.qualityScore || 85,
          withOutfit: true,
          currentOutfit: outfit,
          outfitDetails: {
            name: outfit.name,
            description: outfit.description,
            pieces: outfit.pieces,
            colors: outfit.colors,
            style: outfit.style,
            api: result.api || 'Hybrid Service',
            clothingUrl: result.clothingUrl // Generated clothing image
          },
          metadata: {
            ...avatarData.metadata,
            lastUpdate: new Date().toISOString(),
            outfitApplied: outfit.name
          }
        });

        setAvatarAnimation('posing');

        // 🏆 Trigger achievement progress
        const unlockedAchievement = AchievementsService.onOutfitGenerated();
        if (unlockedAchievement) {
          console.log('🏆 Achievement unlocked:', unlockedAchievement.title);
          // TODO: Show unlock toast notification
        }

        // Trigger try-on achievement
        const tryOnAchievement = AchievementsService.onTryOnUsed();
        if (tryOnAchievement) {
          console.log('🎭 Try-on achievement unlocked:', tryOnAchievement.title);
        }

        // Return to breathing after pose
        setTimeout(() => setAvatarAnimation('breathing'), 3000);
      } else {
        throw new Error(result.error || 'Try-on failed');
      }
    } catch (error) {
      console.error('❌ Failed to apply outfit:', error);
      alert(`Failed to apply outfit: ${error.message}`);
      setAvatarAnimation('breathing'); // Reset animation on error
    } finally {
      setApplyingOutfit(false);
      setTryOnProgress(null);
    }
  };

  // Post-generation workflow handlers
  const handleItemGenerated = (imageUrl: string, description: string) => {
    // Auto-categorize the generated item
    const category = detectGarmentCategory(description);

    setCurrentGeneratedItem({
      imageUrl,
      description,
      category
    });

    // Show wishlist prompt
    setShowWishlistPrompt(true);
  };

  const handleWishlistDecision = async (saveToWishlist: boolean) => {
    if (saveToWishlist && currentGeneratedItem) {
      try {
        // Auto-categorize and save to wishlist
        const wishlistItem: WishlistItem = {
          id: Date.now().toString(),
          imageUrl: currentGeneratedItem.imageUrl,
          notes: currentGeneratedItem.description,
          dateAdded: new Date().toISOString(),
          fromPrompt: currentGeneratedItem.description,
          category: currentGeneratedItem.category,
          name: currentGeneratedItem.description
        };

        // Add to wishlist state
        const updatedWishlist = [...wishlistItems, wishlistItem];
        setWishlistItems(updatedWishlist);
        localStorage.setItem('fitChecked_wishlist', JSON.stringify(updatedWishlist));

        // Auto-save to closet with category
        await ClosetService.addClothingItem(
          currentGeneratedItem.category as ClothingCategory,
          {
            imageUrl: currentGeneratedItem.imageUrl,
            name: currentGeneratedItem.description,
            description: currentGeneratedItem.description,
            isUserGenerated: true,
            source: 'generated'
          }
        );

        console.log(`✅ Saved to ${currentGeneratedItem.category} category in closet and wishlist`);

        // Show shopping prompt
        setShowWishlistPrompt(false);
        setShowShoppingPrompt(true);

        // Animation for wishlist confirmation
        setAvatarAnimation('nod');
        setTimeout(() => setAvatarAnimation('breathing'), 1000);
      } catch (error) {
        console.error('Error saving to wishlist:', error);
        handleWorkflowReset();
      }
    } else {
      // User declined, reset workflow
      // Animation for declining wishlist
      setAvatarAnimation('idle');
      setTimeout(() => setAvatarAnimation('breathing'), 2000);
      handleWorkflowReset();
    }
  };

  const handleShoppingDecision = (findSimilar: boolean) => {
    if (findSimilar) {
      setShowShoppingPrompt(false);
      setShowShoppingForm(true);

      // Animation for showing interest in shopping
      setAvatarAnimation('wave');
      setTimeout(() => setAvatarAnimation('breathing'), 2000);
    } else {
      // Animation for declining shopping
      setAvatarAnimation('idle');
      setTimeout(() => setAvatarAnimation('breathing'), 2000);
      handleWorkflowReset();
    }
  };

  const handleShoppingSearch = async () => {
    if (!currentGeneratedItem) return;

    try {
      setIsSearching(true);
      console.log('🔍 Starting real product search for:', currentGeneratedItem);

      // Step 1: Analyze avatar image for detailed clothing information
      let analysis = avatarAnalysis;
      if (!analysis && currentGeneratedItem.imageUrl) {
        setIsAnalyzingAvatar(true);
        try {
          analysis = await AvatarClothingAnalysisService.analyzeAvatarClothing(currentGeneratedItem.imageUrl);
          setAvatarAnalysis(analysis);
          console.log('👔 Avatar analysis completed:', analysis);
        } catch (error) {
          console.error('Avatar analysis failed, using basic description:', error);
        } finally {
          setIsAnalyzingAvatar(false);
        }
      }

      // Step 2: Generate search queries prioritizing exact generated clothing description
      let searchQueries: string[];

      // Primary strategy: Use the exact generated clothing description first (most accurate)
      searchQueries = [
        `${currentGeneratedItem.description} buy online shopping`,
        `${currentGeneratedItem.description} ${currentGeneratedItem.category} online store`
      ];

      // Add budget-specific query if specified
      if (budgetRange.max) {
        searchQueries.push(`${currentGeneratedItem.category} under $${budgetRange.max} fashion`);
      } else {
        // Add category-specific query for broader coverage
        searchQueries.push(`${currentGeneratedItem.category} similar fashion clothing`);
      }

      // If we have avatar analysis, only use it to enhance the existing queries, not replace them
      if (analysis && analysis.items.length > 0) {
        const primaryItem = analysis.items[0];
        // Enhance with color/style information if available and different from description
        if (primaryItem.color && !currentGeneratedItem.description.toLowerCase().includes(primaryItem.color)) {
          searchQueries[1] = `${primaryItem.color} ${currentGeneratedItem.description} buy online`;
        }
      }

      console.log('🎯 [SEARCH] Using clothing-focused queries:', searchQueries);

      // Step 3: Search for similar products using Perplexity
      const searchOptions: ProductSearchOptions = {
        budgetMin: budgetRange.min ? parseInt(budgetRange.min) : undefined,
        budgetMax: budgetRange.max ? parseInt(budgetRange.max) : undefined,
        stores: preferredStores.length > 0 ? preferredStores : undefined,
        sizes: clothingSize ? [clothingSize] : undefined,
        maxResults: 3 // Limit to top 3 most relevant results
      };

      console.log('🛍️ Searching with options:', searchOptions);
      const productResults = await PerplexityService.searchProductsMultiQuery(searchQueries, searchOptions);

      if (productResults.length === 0) {
        // Fallback search with broader terms
        console.log('🔄 No results found, trying broader search...');
        const fallbackResults = await PerplexityService.searchSimilarProducts(
          `${currentGeneratedItem.category} fashion shopping`,
          { maxResults: 3 }
        );
        setShoppingResults(fallbackResults);
      } else {
        setShoppingResults(productResults);
      }

      setShowShoppingForm(false);
      console.log('✅ Product search completed:', productResults.length, 'results');

    } catch (error) {
      console.error('❌ Error searching for similar items:', error);

      // Show fallback results if search fails completely
      const fallbackResults: ShoppingLink[] = [
        {
          id: 'fallback_1',
          title: `Similar ${currentGeneratedItem.category} - Browse Online`,
          price: '$25-$100',
          url: `https://www.google.com/search?q=${encodeURIComponent(currentGeneratedItem.description + ' buy online')}`,
          store: 'Search Results',
          inStock: true,
          rating: undefined
        }
      ];

      setShoppingResults(fallbackResults);
      setShowShoppingForm(false);

      alert('Unable to search for similar items at the moment. Showing general search link instead.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleWorkflowReset = () => {
    setShowWishlistPrompt(false);
    setShowShoppingPrompt(false);
    setShowShoppingForm(false);
    setShoppingResults([]);
    setCurrentGeneratedItem(null);
    setBudgetRange({ min: '', max: '' });
    setClothingSize('M');
    setPreferredStores([]);

    // Return to calm breathing animation
    setAvatarAnimation('breathing');
  };

  // Enhanced detectGarmentCategory function with better accuracy
  const detectGarmentCategory = (description: string): string => {
    const lowerDesc = description.toLowerCase();

    // More specific patterns for better accuracy
    if (lowerDesc.includes('dress') || lowerDesc.includes('gown') || lowerDesc.includes('jumpsuit')) {
      return 'dress';
    } else if (lowerDesc.includes('pants') || lowerDesc.includes('jeans') || lowerDesc.includes('trousers') ||
               lowerDesc.includes('slacks') || lowerDesc.includes('chinos')) {
      return 'pants';
    } else if (lowerDesc.includes('shorts')) {
      return 'shorts';
    } else if (lowerDesc.includes('skirt')) {
      return 'skirt';
    } else if (lowerDesc.includes('shirt') || lowerDesc.includes('blouse') || lowerDesc.includes('top') ||
               lowerDesc.includes('sweater') || lowerDesc.includes('hoodie') || lowerDesc.includes('tee') ||
               lowerDesc.includes('polo') || lowerDesc.includes('tank')) {
      return 'shirt';
    } else if (lowerDesc.includes('jacket') || lowerDesc.includes('coat') || lowerDesc.includes('blazer') ||
               lowerDesc.includes('cardigan') || lowerDesc.includes('vest')) {
      return 'outerwear';
    } else if (lowerDesc.includes('shoe') || lowerDesc.includes('boot') || lowerDesc.includes('sneaker') ||
               lowerDesc.includes('sandal') || lowerDesc.includes('heel') || lowerDesc.includes('loafer')) {
      return 'shoes';
    } else {
      // Try to extract the main clothing type from the description
      const words = lowerDesc.split(/\s+/);
      for (const word of words) {
        if (['shirt', 'pants', 'dress', 'skirt', 'jacket', 'shoes', 'top', 'bottom'].includes(word)) {
          return word;
        }
      }
      return 'clothing'; // Generic fallback instead of 'accessories'
    }
  };

  // Show Fashion Feed if active
  if (activeView === 'fashion-feed') {
    return (
      <FashionFeedDashboard
        onBack={() => setActiveView('closet')}
        userData={userData}
      />
    );
  }

  return (
    <>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        {/* Personalized Greeting */}
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-800">
            {getTimeBasedGreeting()} {getUserFirstName()}
          </h1>
          <p className="text-sm text-slate-600 tracking-wide">
            Today TheFitChecked
          </p>
        </div>

        {/* Time and Weather */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm text-slate-600">
              {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-white/60 rounded-2xl px-4 py-2">
            {getWeatherIcon()}
            <div className="text-sm">
              <div className="font-semibold text-slate-800">
                {weather ? `${weather.temperature}°` : '--°'}
              </div>
              <div className="text-slate-600 capitalize">
                {weather ? weather.condition : 'Loading...'}
              </div>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center space-x-1 text-slate-600 hover:text-slate-800 transition-colors bg-white/60 rounded-xl px-3 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        {/* Settings */}
        <button
          onClick={() => setShowSettingsModal(true)}
          className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
          title="Location & Time Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Workflow Panel - Left Column */}
          <div className="lg:col-span-1">

            {/* Shopping Prompt */}
            {showShoppingPrompt && currentGeneratedItem && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2 text-indigo-500" />
                  Find Similar Items?
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  Would you like to search for similar {currentGeneratedItem.category} to purchase online?
                </p>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleShoppingDecision(true)}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
                  >
                    <Search className="w-4 h-4 mr-1" />
                    Yes, Search
                  </button>
                  <button
                    onClick={() => handleShoppingDecision(false)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    No Thanks
                  </button>
                </div>
              </div>
            )}

            {/* Shopping Form */}
            {showShoppingForm && currentGeneratedItem && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                  Shopping Preferences
                </h3>

                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Range
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min $"
                        value={budgetRange.min}
                        onChange={(e) => setBudgetRange(prev => ({ ...prev, min: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max $"
                        value={budgetRange.max}
                        onChange={(e) => setBudgetRange(prev => ({ ...prev, max: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size
                    </label>
                    <select
                      value={clothingSize}
                      onChange={(e) => setClothingSize(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    >
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleShoppingSearch}
                    disabled={isSearching || isAnalyzingAvatar}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    {isAnalyzingAvatar ? (
                      <>
                        <Loader className="w-4 h-4 mr-1 animate-spin" />
                        Analyzing Avatar...
                      </>
                    ) : isSearching ? (
                      <>
                        <Loader className="w-4 h-4 mr-1 animate-spin" />
                        Finding Products...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-1" />
                        Search Similar Items
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleWorkflowReset}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Shopping Results */}
            {shoppingResults.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-purple-500" />
                  Similar Items Found
                </h3>

                <div className="space-y-3">
                  {shoppingResults.slice(0, 3).map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 mr-3">
                          <h4 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{item.title}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">{item.store}</span>
                            {!item.inStock && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Out of Stock</span>
                            )}
                            {item.discount && (
                              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">{item.discount}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-1">
                          <div className="flex items-center space-x-1">
                            {item.originalPrice && (
                              <span className="text-xs text-gray-400 line-through">{item.originalPrice}</span>
                            )}
                            <span className="text-sm font-bold text-green-600">{item.price}</span>
                          </div>
                          {item.rating && (
                            <div className="flex items-center">
                              <span className="text-xs text-yellow-500">★</span>
                              <span className="text-xs text-gray-600 ml-1">{item.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => {
                            // Add to wishlist with monitoring
                            const wishlistItem: WishlistItem = {
                              id: `product_${Date.now()}`,
                              imageUrl: item.imageUrl || currentGeneratedItem?.imageUrl || '',
                              notes: item.title,
                              dateAdded: new Date().toISOString(),
                              fromPrompt: currentGeneratedItem?.description || '',
                              category: currentGeneratedItem?.category || '',
                              name: item.title
                            };

                            const updatedWishlist = [...wishlistItems, wishlistItem];
                            setWishlistItems(updatedWishlist);
                            localStorage.setItem('fitChecked_wishlist', JSON.stringify(updatedWishlist));

                            console.log('💝 Added to wishlist for monitoring:', item.title);
                          }}
                          className="flex items-center text-xs text-pink-600 hover:text-pink-800 transition-colors"
                        >
                          <Heart className="w-3 h-3 mr-1" />
                          Add to Wishlist
                        </button>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            const affiliateUrl = affiliateLinkService.convertToAffiliateLink(
                              item.url,
                              item.store || 'unknown'
                            );
                            affiliateLinkService.trackClick(affiliateUrl, undefined, item);
                            window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Item
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleWorkflowReset}
                  className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Done Shopping
                </button>
              </div>
            )}
          </div>

          {/* Avatar Display - Center Column */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <div
              ref={avatarRef}
              className="relative w-[312px] aspect-[9/16] rounded-3xl bg-white shadow-2xl overflow-hidden"
            >
              {avatarData ? (
                <img
                  src={avatarData.imageUrl || avatarData}
                  alt="Your Digital Avatar"
                  className={`w-full h-full object-contain transition-all duration-500 ease-in-out transform-gpu ${getAvatarPoseStyles()} ${
                    showPoseTransition ? 'scale-95 opacity-75' : ''
                  } ${avatarAnimationService.getAnimationClass(avatarAnimation, 'subtle')}`}
                  onLoad={() => {
                    console.log('🖼️ [AVATAR-DEBUG] Avatar image loaded successfully:', {
                      src: avatarData.imageUrl || avatarData,
                      urlPreview: (avatarData.imageUrl || avatarData)?.substring(0, 100) + '...',
                      timestamp: new Date().toISOString()
                    });
                  }}
                  onError={(e) => {
                    console.error('❌ [AVATAR-DEBUG] Avatar image failed to load:', {
                      src: avatarData.imageUrl || avatarData,
                      error: e,
                      timestamp: new Date().toISOString()
                    });
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mb-6">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Your Digital Avatar</h3>
                  <p className="text-slate-500 text-center px-8">
                    Upload a photo to see yourself in different outfits
                  </p>
                </div>
              )}

              {/* Loading overlay */}
              {(applyingOutfit || isSeamlessTryOn) && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-white/90 rounded-2xl px-6 py-4 flex flex-col items-center space-y-3 shadow-lg">
                    <Loader className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="font-medium text-slate-800 text-center">
                      {tryOnProgress?.message || 'Generating and applying outfit...'}
                    </span>
                    {tryOnProgress && (
                      <>
                        <div className="w-40 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${tryOnProgress.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {Math.round(tryOnProgress.progress)}% Complete
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Weather indicator */}
              <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm text-slate-700 px-3 py-2 rounded-full text-sm font-medium flex items-center space-x-2 shadow-sm">
                {getWeatherIcon()}
                <span>{weather ? `${weather.temperature}°` : 'Loading...'}</span>
              </div>
            </div>

            {/* Upload Button - Centered Under Avatar */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleSmartUpload}
                disabled={uploadingClothing}
                className="flex items-center justify-center space-x-2 glass-beige text-black px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 shadow-lg"
              >
                {uploadingClothing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Upload Outfit</span>
                  </>
                )}
              </button>
            </div>

            {/* Enhanced Outfit Generator */}
            <div className="mt-8 w-full max-w-md">
              <EnhancedOutfitGenerator
                avatarData={avatarData}
                onAvatarUpdate={(newAvatarData) => {
                  console.log('🔄 [AVATAR-DEBUG] AvatarHomepage received avatar update:', {
                    imageUrl: newAvatarData?.imageUrl,
                    withOutfit: newAvatarData?.withOutfit,
                    hasParentCallback: !!onAvatarUpdate,
                    avatarUrlPreview: newAvatarData?.imageUrl?.substring(0, 100) + '...'
                  });

                  if (onAvatarUpdate) {
                    console.log('🆙 [AVATAR-DEBUG] Calling parent onAvatarUpdate callback');
                    onAvatarUpdate(newAvatarData);
                    console.log('✅ [AVATAR-DEBUG] Parent callback completed');
                  } else {
                    console.warn('⚠️ [AVATAR-DEBUG] No parent onAvatarUpdate callback available!');
                  }
                }}
                onItemGenerated={(imageUrl, prompt) => {
                  handleItemGenerated(imageUrl, prompt);
                }}
                onOutfitGenerate={(outfitData) => {
                  console.log('🎨 Enhanced outfit generated:', outfitData);
                  // Enhanced generator uses its own Seedream V4 + FASHN workflow
                  // so we just log the callback for debugging/analytics
                }}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Fashion Feed Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setActiveView('fashion-feed')}
                className="relative group w-20 h-20 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-700 rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-110 animate-pulse overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                <div className="relative flex items-center justify-center w-full h-full p-2">
                  <img
                    src="/Untitled design.PNG"
                    alt="FitChecked"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Notification Badge */}
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">3</span>
                </div>

                {/* Hover Tooltip */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/80 text-white text-xs py-1 px-3 rounded-lg whitespace-nowrap">
                  Join the Community
                </div>
              </button>
            </div>

            {/* Today's Picks Section */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span>Today's Picks</span>
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">Create and customize your style</p>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (onNavigateToCloset) {
                      onNavigateToCloset();
                    } else {
                      console.log('Navigate to closet - door transition not available');
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <span>👗</span>
                  <span>My Closet</span>
                </button>

                <button
                  onClick={() => setActiveView('wishlist')}
                  className="w-full flex items-center justify-center space-x-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg relative"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Wishlist</span>
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                      {wishlistItems.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Outfit</span>
                </button>

              </div>

            </div>

            {/* Navigation Quick Actions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={onNavigateToMeasurements}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-slate-800">Update Measurements</span>
                </button>
                <button
                  onClick={onNavigateToStyleProfile}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Palette className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-slate-800">Style Preferences</span>
                </button>
                <button
                  onClick={onResetAvatar}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-slate-800">Reset Avatar</span>
                </button>
              </div>
            </div>

            {/* Shopping Links */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Shopping Links</h3>
              <div className="space-y-3">
                <a
                  href="https://tapto.shop/dripped"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    const affiliateUrl = affiliateLinkService.convertToAffiliateLink(
                      'https://tapto.shop/dripped',
                      'dripped'
                    );
                    affiliateLinkService.trackClick(affiliateUrl);
                    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-slate-800">Dripped Shop</span>
                  <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                </a>
                <a
                  href="https://www.rakuten.com/r/DRIPPE62?eeid=28187"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Tag className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-slate-800">Coupons</span>
                  <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Modals */}
      {showWebEnhancedModal && (
        <WebEnhancedPromptModal
          isOpen={showWebEnhancedModal}
          onClose={() => setShowWebEnhancedModal(false)}
          originalPrompt={outfitPrompt}
          variations={webEnhancedVariations}
          isGenerating={isGeneratingWebVariations}
          onSelectVariation={(variation) => {
            setOutfitPrompt(variation.enhancedPrompt);
            setShowWebEnhancedModal(false);
          }}
        />
      )}

      {showSaveToClosetModal && (
        <SaveToClosetModal
          isOpen={showSaveToClosetModal}
          onClose={() => setShowSaveToClosetModal(false)}
          generatedImageUrl={pendingSaveImage || ''}
          originalPrompt={pendingSavePrompt}
          onSaveToCloset={(data: SavedItemData) => {
            console.log('Saving to closet:', data);

            // 🏆 Trigger achievement progress for adding item
            const itemAddedAchievement = AchievementsService.onItemAdded();
            if (itemAddedAchievement) {
              console.log('🏆 Item achievement unlocked:', itemAddedAchievement.title);
            }

            // Don't close modal here - let the search prompt appear first
          }}
          onAddToWishlist={(data: SavedItemData) => {
            console.log('Adding to wishlist:', data);

            // Load existing wishlist items
            const existingWishlist = localStorage.getItem('fitChecked_wishlist');
            const wishlistItems = existingWishlist ? JSON.parse(existingWishlist) : [];

            // Convert SavedItemData to WishlistItem format
            const wishlistItem = {
              id: `generated_${Date.now()}`,
              name: data.name,
              imageUrl: data.imageUrl,
              category: data.category,
              description: data.originalPrompt,
              dateAdded: data.dateAdded,
              source: 'generated',
              originalPrompt: data.originalPrompt
            };

            // Add to wishlist and save
            const updatedWishlist = [...wishlistItems, wishlistItem];
            localStorage.setItem('fitChecked_wishlist', JSON.stringify(updatedWishlist));

            console.log('Added to wishlist:', wishlistItem);
            // Don't close modal here - let the search prompt appear first
          }}
          avatarData={avatarData}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Settings className="w-6 h-6 mr-2 text-blue-600" />
              Location & Time Settings
            </h2>

            <div className="space-y-4">
              {/* City Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  City
                </label>
                <input
                  type="text"
                  value={settingsCity}
                  onChange={(e) => setSettingsCity(e.target.value)}
                  placeholder="e.g., San Francisco"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* State Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  State
                </label>
                <input
                  type="text"
                  value={settingsState}
                  onChange={(e) => setSettingsState(e.target.value)}
                  placeholder="e.g., CA or California"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Timezone Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Timezone
                </label>
                <select
                  value={settingsTimezone}
                  onChange={(e) => setSettingsTimezone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="America/Phoenix">Arizona (MST)</option>
                  <option value="America/Anchorage">Alaska (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii (HST)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsSavingSettings(true);
                  try {
                    // Save to userData
                    const updatedUserData = {
                      ...userData,
                      city: settingsCity,
                      state: settingsState,
                      timezone: settingsTimezone
                    };

                    // Save to localStorage
                    localStorage.setItem('fitChecked_userData', JSON.stringify(updatedUserData));

                    // Reload weather if city/state changed
                    if (settingsCity) {
                      setWeatherLoading(true);
                      try {
                        const newWeather = await weatherService.getWeatherByCity(
                          settingsCity,
                          settingsState || undefined
                        );
                        setWeather(newWeather);
                        setWeatherError(null);
                        console.log('✅ [SETTINGS] Weather updated for new location');
                      } catch (error) {
                        console.error('❌ [SETTINGS] Failed to load weather for new location:', error);
                        setWeatherError('Failed to load weather');
                      } finally {
                        setWeatherLoading(false);
                      }
                    }

                    setShowSettingsModal(false);
                    console.log('✅ [SETTINGS] Settings saved successfully');
                  } catch (error) {
                    console.error('❌ [SETTINGS] Failed to save settings:', error);
                  } finally {
                    setIsSavingSettings(false);
                  }
                }}
                disabled={isSavingSettings || !settingsCity}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSavingSettings ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && avatarData && (
        <ShareModal
          outfitData={{
            avatarImageUrl: avatarData.imageUrl || avatarData,
            outfitImageUrl: currentGeneratedItem?.imageUrl,
            outfitDetails: {
              description: currentGeneratedItem?.description || 'My FitChecked Outfit',
              occasion: 'casual',
              category: currentGeneratedItem?.category,
              formality: 'casual',
              weather: weather ? `${weather.temperature}°F, ${weather.weatherDescription}` : undefined
            },
            generatedBy: 'ai'
          }}
          onClose={() => setShowShareModal(false)}
          onDownload={async (shareId) => {
            console.log('Download outfit:', shareId);
            // TODO: Implement download functionality
          }}
        />
      )}
      </div>
    </>
  );
};

export default AvatarHomepage;