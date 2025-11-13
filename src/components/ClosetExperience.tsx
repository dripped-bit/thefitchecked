import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Camera, Shirt, ArrowLeft, Target, Trophy, Star,
  Sparkles, ShoppingBag, Heart, Mic, Calendar, DollarSign,
  Leaf, TrendingUp, Award, Gift, CheckCircle, X, Play,
  Palette, Shuffle, Share2, Volume2, VolumeX, Crown,
  Tag, Package, Zap, Users, MapPin, Clock, ChevronLeft, ChevronRight, ExternalLink,
  Menu, Plus
} from 'lucide-react';
import { glassNavClasses } from '../styles/glassEffects';
import VisualClosetEnhanced from './VisualClosetEnhanced';
import '../styles/VisualClosetAdapter.css';
import ClosetDoors from './ClosetDoors';
import OutfitCreator from './OutfitCreator';
import ClosetPage from './ClosetPage';
import SmartCalendarDashboard from './SmartCalendarDashboard';
import PackingListGenerator from './PackingListGenerator';
import WoreThisTodayTracker from './WoreThisTodayTracker';
import CategorySelector from './CategorySelector';
import MultiItemSplitter from './MultiItemSplitter';
import ShareModal from './ShareModal';
import CameraCapture from './CameraCapture';
import ClosetService, { ClothingCategory } from '../services/closetService';
import seamlessTryOnService from '../services/seamlessTryOnService';
import backgroundRemovalService from '../services/backgroundRemovalService';
import multiItemDetectionService, { DetectedItem, MultiItemDetectionResult } from '../services/multiItemDetectionService';
import weatherService from '../services/weatherService';
import stylePreferencesService from '../services/stylePreferencesService';

interface ClothingItem {
  id: string;
  name: string;
  imageUrl: string;
  originalImageUrl?: string; // Original image with background (if background was removed)
  category: ClothingCategory;
  color?: string;
  brand?: string;
  price?: number;
  sustainability?: 'eco' | 'regular' | 'fast-fashion';
  timesWorn?: number;
  dateAdded: string;
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
  favorite?: boolean;
  description?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  category: 'organizing' | 'sustainability' | 'creativity' | 'social';
}

interface StyleChallenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  deadline: string;
  reward: string;
  difficulty: 'easy' | 'medium' | 'hard';
  participants: number;
}

interface OutfitCombination {
  id: string;
  name: string;
  items: ClothingItem[];
  occasion: string;
  season: string;
  rating?: number;
  saves: number;
  dateCreated: string;
}

interface ClosetExperienceProps {
  onBack: () => void;
  avatarData?: any;
  initialView?: 'doors' | 'interior';
}

/**
 * Check localStorage usage and quota
 * Returns usage statistics and warnings if approaching limits
 */
const checkLocalStorageQuota = (): {
  used: number;
  total: number;
  percentage: number;
  isNearLimit: boolean;
  formattedUsed: string;
  formattedTotal: string;
} => {
  try {
    // Estimate localStorage usage by measuring all stored data
    let totalSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }

    // Most browsers have 5-10MB limit, we'll use 5MB as conservative estimate
    const estimatedLimit = 5 * 1024 * 1024; // 5MB in bytes
    const percentage = (totalSize / estimatedLimit) * 100;
    const isNearLimit = percentage > 80; // Warn at 80% usage

    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const result = {
      used: totalSize,
      total: estimatedLimit,
      percentage: Math.round(percentage * 10) / 10,
      isNearLimit,
      formattedUsed: formatSize(totalSize),
      formattedTotal: formatSize(estimatedLimit)
    };

    console.log('💾 [LOCALSTORAGE-QUOTA]', {
      used: result.formattedUsed,
      total: result.formattedTotal,
      percentage: `${result.percentage}%`,
      isNearLimit: result.isNearLimit
    });

    return result;
  } catch (error) {
    console.error('❌ [LOCALSTORAGE-QUOTA] Failed to check quota:', error);
    return {
      used: 0,
      total: 0,
      percentage: 0,
      isNearLimit: false,
      formattedUsed: '0 B',
      formattedTotal: '0 B'
    };
  }
};

const ClosetExperience: React.FC<ClosetExperienceProps> = ({
  onBack,
  avatarData,
  initialView = 'doors'
}) => {
  // Main state
  const [currentView, setCurrentView] = useState<'doors' | 'interior' | 'outfit-creator' | 'try-on' | 'smart-calendar'>(initialView);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all' | 'favorites'>('all');
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<ClothingItem[]>([]);

  // Achievement and gamification state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [styleChallenges, setStyleChallenges] = useState<StyleChallenge[]>([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [closetValue, setClosetValue] = useState(0);
  const [sustainabilityScore, setSustainabilityScore] = useState(0);

  // UI state
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<'spring' | 'summer' | 'fall' | 'winter'>('fall');
  const [outfitOfTheDay, setOutfitOfTheDay] = useState<OutfitCombination | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [isDragMode, setIsDragMode] = useState(false);

  // Track which items are showing original version (item IDs)
  const [showingOriginalVersions, setShowingOriginalVersions] = useState<Set<string>>(new Set());

  // Outfit of the Day Modal state
  const [showOOTDModal, setShowOOTDModal] = useState(false);
  const [ootdWeather, setOotdWeather] = useState<{ temperature: number; description: string } | null>(null);
  const [ootdError, setOotdError] = useState<string | null>(null);

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [modalStep, setModalStep] = useState<'occasion' | 'notes' | 'outfit'>('occasion');
  const [outfitMode, setOutfitMode] = useState<'upload' | 'closet'>('closet');
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [dateOccasions, setDateOccasions] = useState<{[key: number]: {
    occasion: 'travel' | 'formal' | 'social' | 'daily' | 'activities';
    notes: string;
    outfitPieces: Array<{
      id: string;
      name: string;
      imageUrl: string;
      category: string;
    }>;
    shoppingLinks?: Array<{
      url: string;
      affiliateUrl?: string;
      store: string;
      title?: string;
      price?: string;
    }>;
    calendarEntryId?: number;
  }}>({});

  // Upload processing state
  const [uploadProgress, setUploadProgress] = useState<{
    isUploading: boolean;
    stage: 'uploading' | 'processing' | 'removing-background' | 'categorizing' | 'complete';
    message: string;
    fileName?: string;
  }>({ isUploading: false, stage: 'complete', message: '' });

  // Category selector state
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [pendingItem, setPendingItem] = useState<{
    imageUrl: string;
    itemData: Partial<ClothingItem>;
    metadata?: any;
  } | null>(null);

  // Multi-item detection state
  const [showMultiItemSplitter, setShowMultiItemSplitter] = useState(false);
  const [multiItemDetectionResult, setMultiItemDetectionResult] = useState<MultiItemDetectionResult | null>(null);
  const [pendingMultiItems, setPendingMultiItems] = useState<DetectedItem[]>([]);
  const [currentMultiItemIndex, setCurrentMultiItemIndex] = useState(0);

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedItemToShare, setSelectedItemToShare] = useState<ClothingItem | null>(null);

  // Camera capture state (for desktop webcam access)
  const [showCameraModal, setShowCameraModal] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null);

  // Try-on result state
  const [tryOnResults, setTryOnResults] = useState<{
    isProcessing: boolean;
    results: Array<{
      success: boolean;
      finalImageUrl?: string;
      clothingImageUrl?: string;
      itemName: string;
      error?: string;
    }>;
    displayMode: 'original' | 'tryon';
    currentIndex: number;
  }>({
    isProcessing: false,
    results: [],
    displayMode: 'original',
    currentIndex: 0
  });

  // Sidebar state (for mobile collapsible sidebar)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dateFileInputRef = useRef<HTMLInputElement>(null);

  // Check for stored view parameter from URL (e.g., from calendar OAuth redirect)
  useEffect(() => {
    const storedView = sessionStorage.getItem('closet_view');
    if (storedView) {
      console.log('📍 [CLOSET] Found stored view from URL:', storedView);
      if (storedView === 'smart-calendar') {
        setCurrentView('smart-calendar');
        console.log('📅 [CLOSET] Setting view to smart-calendar from URL parameter');
      }
      // Clear the stored view after using it
      sessionStorage.removeItem('closet_view');
    }
  }, []);

  // Debug currentView changes
  useEffect(() => {
    console.log(`🔄 [CLOSET-VIEW] Current view changed to: "${currentView}"`);
    if (currentView === 'interior') {
      console.log('✅ [CLOSET-VIEW] Interior view active - clothing grid should render');
    } else {
      console.log(`ℹ️ [CLOSET-VIEW] Not in interior view - grid will not render (current: ${currentView})`);
    }
  }, [currentView]);

  // Initialize achievements
  useEffect(() => {
    setAchievements([
      {
        id: 'organized-closet',
        title: 'Organization Master',
        description: 'Organize 25 items in your closet',
        icon: <Target className="w-5 h-5" />,
        unlocked: clothingItems.length >= 25,
        progress: clothingItems.length,
        maxProgress: 25,
        category: 'organizing'
      },
      {
        id: 'eco-warrior',
        title: 'Eco Warrior',
        description: 'Add 10 sustainable fashion items',
        icon: <Leaf className="w-5 h-5" />,
        unlocked: clothingItems.filter(item => item.sustainability === 'eco').length >= 10,
        progress: clothingItems.filter(item => item.sustainability === 'eco').length,
        maxProgress: 10,
        category: 'sustainability'
      },
      {
        id: 'style-creator',
        title: 'Style Creator',
        description: 'Create 5 unique outfit combinations',
        icon: <Palette className="w-5 h-5" />,
        unlocked: false,
        progress: 0,
        maxProgress: 5,
        category: 'creativity'
      },
      {
        id: 'fashion-influencer',
        title: 'Fashion Influencer',
        description: 'Share 3 outfits with the community',
        icon: <Users className="w-5 h-5" />,
        unlocked: false,
        progress: 0,
        maxProgress: 3,
        category: 'social'
      }
    ]);
  }, [clothingItems]);

  // Load calendar entries from localStorage when month changes
  useEffect(() => {
    const loadCalendarEntries = async () => {
      try {
        // Import smartCalendarService dynamically
        const { default: smartCalendarService } = await import('../services/smartCalendarService');
        const entries = smartCalendarService.getCalendarEntries();

        console.log('📅 [MONTHLY-PLANNER] Loading calendar entries:', entries.length);

        // Convert calendar entries to dateOccasions format
        const newDateOccasions: typeof dateOccasions = {};

        entries.forEach((entry: any) => {
          const entryDate = new Date(entry.date);
          const entryMonth = entryDate.getMonth();
          const entryYear = entryDate.getFullYear();

          // Only load entries for current displayed month
          if (entryMonth === currentMonth && entryYear === currentYear) {
            const dayOfMonth = entryDate.getDate();

            newDateOccasions[dayOfMonth] = {
              occasion: mapOccasionToCategory(entry.occasion || 'social'),
              notes: entry.outfit?.description || '',
              outfitPieces: [], // Outfit image handled separately
              shoppingLinks: entry.shoppingLinks || entry.processedLinks || [],
              calendarEntryId: entry.id
            };
          }
        });

        // Merge with existing dateOccasions (don't overwrite manually added ones)
        setDateOccasions(prev => ({
          ...prev,
          ...newDateOccasions
        }));

        console.log('✅ [MONTHLY-PLANNER] Loaded entries for month:', currentMonth, currentYear);
      } catch (error) {
        console.error('❌ [MONTHLY-PLANNER] Failed to load calendar entries:', error);
      }
    };

    loadCalendarEntries();
  }, [currentMonth, currentYear]);

  // Helper function to map occasion names to categories
  const mapOccasionToCategory = (occasion: string): 'travel' | 'formal' | 'social' | 'daily' | 'activities' => {
    const lowerOccasion = occasion.toLowerCase();
    if (lowerOccasion.includes('travel') || lowerOccasion.includes('trip') || lowerOccasion.includes('vacation')) return 'travel';
    if (lowerOccasion.includes('formal') || lowerOccasion.includes('wedding') || lowerOccasion.includes('gala')) return 'formal';
    if (lowerOccasion.includes('party') || lowerOccasion.includes('dinner') || lowerOccasion.includes('date')) return 'social';
    if (lowerOccasion.includes('sport') || lowerOccasion.includes('gym') || lowerOccasion.includes('yoga')) return 'activities';
    return 'daily';
  };

  // Initialize style challenges
  useEffect(() => {
    setStyleChallenges([
      {
        id: 'fall-vibes',
        title: 'Autumn Elegance',
        description: 'Create a cozy fall outfit using earth tones',
        theme: 'Fall Fashion',
        deadline: '2024-11-15',
        reward: '50 XP + Autumn Badge',
        difficulty: 'easy',
        participants: 1247
      },
      {
        id: 'sustainable-chic',
        title: 'Sustainable Style',
        description: 'Design an outfit using only eco-friendly pieces',
        theme: 'Eco Fashion',
        deadline: '2024-10-30',
        reward: '100 XP + Eco Warrior Badge',
        difficulty: 'medium',
        participants: 892
      },
      {
        id: 'color-theory',
        title: 'Color Master',
        description: 'Create 3 outfits showcasing complementary colors',
        theme: 'Color Theory',
        deadline: '2024-11-08',
        reward: '150 XP + Color Specialist Badge',
        difficulty: 'hard',
        participants: 445
      }
    ]);
  }, []);

  // Load clothing items from closet service on mount and when storage changes
  useEffect(() => {
    const loadClothingItems = () => {
      const items = ClosetService.getAllClothingItems();
      setClothingItems(items);
      console.log('👗 [CLOSET-EXP] Loaded items from storage:', items.length);

      // Log items by category for debugging
      const closet = ClosetService.getUserCloset();
      Object.keys(closet).forEach(cat => {
        const count = closet[cat as ClothingCategory]?.length || 0;
        if (count > 0) {
          console.log(`  📦 ${cat}: ${count} items`);
        }
      });
    };

    // Initial load
    loadClothingItems();

    // Reload when window gains focus
    const handleFocus = () => {
      console.log('👀 [CLOSET-EXP] Window focused - reloading items');
      loadClothingItems();
    };

    window.addEventListener('focus', handleFocus);

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userCloset') {
        console.log('💾 [CLOSET-EXP] Storage changed - reloading items');
        loadClothingItems();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Calculate closet statistics
  useEffect(() => {
    const totalValue = clothingItems.reduce((sum, item) => sum + (item.price || 0), 0);
    setClosetValue(totalValue);

    const ecoItems = clothingItems.filter(item => item.sustainability === 'eco').length;
    const sustainabilityPercentage = clothingItems.length > 0 ? (ecoItems / clothingItems.length) * 100 : 0;
    setSustainabilityScore(Math.round(sustainabilityPercentage));
  }, [clothingItems]);

  const categories: Array<{ id: ClothingCategory | 'all' | 'favorites', name: string, icon: React.ReactNode, count: number }> = [
    { id: 'all', name: 'All Items', icon: <Package className="w-5 h-5" />, count: clothingItems.length },
    { id: 'tops', name: 'Tops', icon: <Shirt className="w-5 h-5" />, count: clothingItems.filter(item => item.category === 'tops' || item.category === 'shirts').length },
    { id: 'pants', name: 'Bottoms', icon: <Tag className="w-5 h-5" />, count: clothingItems.filter(item => item.category === 'pants' || item.category === 'skirts').length },
    { id: 'dresses', name: 'Dresses', icon: <Crown className="w-5 h-5" />, count: clothingItems.filter(item => item.category === 'dresses').length },
    { id: 'sweaters', name: 'Sweaters', icon: <Shirt className="w-5 h-5" />, count: clothingItems.filter(item => item.category === 'sweaters').length },
    { id: 'shoes', name: 'Shoes', icon: <Target className="w-5 h-5" />, count: clothingItems.filter(item => item.category === 'shoes').length },
    { id: 'accessories', name: 'Accessories', icon: <Sparkles className="w-5 h-5" />, count: clothingItems.filter(item => item.category === 'accessories').length },
    { id: 'favorites', name: 'Favorites', icon: <Heart className="w-5 h-5" />, count: ClosetService.getFavoriteItems().length }
  ];

  const handleDoorsOpen = () => {
    setTimeout(() => {
      setCurrentView('interior');
    }, 1000);
  };

  const handleFileUpload = async (file: File) => {
    try {
      console.log('📁 [CLOSET] Starting file upload and processing...');

      // Initialize progress tracking
      setUploadProgress({
        isUploading: true,
        stage: 'uploading',
        message: 'Uploading your clothing item...',
        fileName: file.name
      });

      // Small delay to show initial stage
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update to processing stage
      setUploadProgress(prev => ({
        ...prev,
        stage: 'processing',
        message: 'Preparing image for AI processing...'
      }));

      // Process the clothing upload with background removal and categorization
      const result = await backgroundRemovalService.processClothingUpload(file);

      if (result.success) {
        // Show background removal stage if successful and enabled
        const backgroundRemoved = autoRemoveBackground && result.metadata?.backgroundRemoved;
        if (backgroundRemoved) {
          setUploadProgress(prev => ({
            ...prev,
            stage: 'removing-background',
            message: '🎨 AI is removing the background...'
          }));
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Show categorization stage
        setUploadProgress(prev => ({
          ...prev,
          stage: 'categorizing',
          message: '🤖 Processing complete! Select a category...'
        }));
        await new Promise(resolve => setTimeout(resolve, 500));

        // Determine which image to use based on settings
        const finalImageUrl = autoRemoveBackground && result.processedImageUrl
          ? result.processedImageUrl
          : result.imageUrl!;

        const originalImageUrl = (autoRemoveBackground && keepOriginal && backgroundRemoved && result.imageUrl)
          ? result.imageUrl
          : undefined;

        // NEW: Check for multiple items in the image
        setUploadProgress(prev => ({
          ...prev,
          stage: 'processing',
          message: '🔍 Detecting multiple items...'
        }));

        const detectionResult = await multiItemDetectionService.detectMultipleItems(finalImageUrl);

        if (detectionResult.hasMultipleItems && detectionResult.items.length > 1) {
          console.log(`🎯 [MULTI-ITEM] Detected ${detectionResult.items.length} items!`);

          // Store detection result and show splitter
          setMultiItemDetectionResult(detectionResult);
          setUploadProgress({ isUploading: false, stage: 'complete', message: '' });
          setShowMultiItemSplitter(true);
          return; // Exit - will continue after user confirms split
        }

        console.log('✅ [MULTI-ITEM] Single item detected, proceeding normally');

        // Prepare item data (without category yet)
        const itemData = {
          id: Date.now().toString(),
          name: result.metadata?.originalName || file.name.replace(/\.[^/.]+$/, ""),
          imageUrl: finalImageUrl,
          originalImageUrl: originalImageUrl, // Store original if keeping both versions
          color: result.metadata?.color,
          brand: result.metadata?.brand,
          sustainability: result.metadata?.sustainability || 'regular',
          dateAdded: new Date().toISOString(),
          timesWorn: 0,
          season: result.metadata?.season || 'all'
        };

        // Store pending item and show category selector
        setPendingItem({
          imageUrl: finalImageUrl,
          itemData,
          metadata: {
            backgroundRemoved: backgroundRemoved,
            confidence: result.metadata?.confidence,
            suggestedCategory: result.category,
            subcategory: result.metadata?.type, // AI-detected subcategory
            color: result.metadata?.color // AI-detected color
          }
        });

        // Clear upload progress and show category selector
        setUploadProgress({ isUploading: false, stage: 'complete', message: '' });
        setShowCategorySelector(true);

      } else {
        console.error('❌ [CLOSET] Upload failed:', result.error);

        // Show error, then fallback to basic upload
        setUploadProgress(prev => ({
          ...prev,
          stage: 'processing',
          message: '⚠️ AI processing failed, select a category...'
        }));

        await new Promise(resolve => setTimeout(resolve, 800));

        // Convert file to base64 for persistent storage
        const fallbackImageUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Fallback item data (without category)
        const fallbackItemData = {
          id: Date.now().toString(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          imageUrl: fallbackImageUrl,
          dateAdded: new Date().toISOString(),
          timesWorn: 0,
          season: 'all' as const
        };

        // Store pending item and show category selector
        setPendingItem({
          imageUrl: fallbackImageUrl,
          itemData: fallbackItemData,
          metadata: { backgroundRemoved: false }
        });

        // Clear upload progress and show category selector
        setUploadProgress({ isUploading: false, stage: 'complete', message: '' });
        setShowCategorySelector(true);
      }

    } catch (error) {
      console.error('Error uploading file:', error);

      // Show error state
      setUploadProgress({
        isUploading: false,
        stage: 'complete',
        message: '❌ Upload failed. Please try again.'
      });

      // Clear error message
      setTimeout(() => {
        setUploadProgress({ isUploading: false, stage: 'complete', message: '' });
      }, 2000);
    }
  };

  const handleCategoryConfirm = async (category: ClothingCategory, imageUrl: string) => {
    if (!pendingItem) {
      console.error('❌ [CLOSET] No pending item to save');
      return;
    }

    try {
      console.log('💾 [CLOSET] Starting item save process...', {
        category,
        hasImageUrl: !!imageUrl,
        imageUrlLength: imageUrl?.length,
        itemData: pendingItem.itemData
      });

      // Check localStorage quota BEFORE saving
      const quotaBefore = checkLocalStorageQuota();
      if (quotaBefore.isNearLimit) {
        console.warn(`⚠️ [CLOSET] localStorage is at ${quotaBefore.percentage}% capacity (${quotaBefore.formattedUsed} / ${quotaBefore.formattedTotal})`);
        console.warn('⚠️ [CLOSET] Consider deleting old items or reducing image sizes');
      }

      // Defensive: Ensure we have a valid imageUrl
      const finalImageUrl = imageUrl || pendingItem.imageUrl;
      if (!finalImageUrl) {
        console.error('❌ [CLOSET] No imageUrl available for item');
        alert('Error: Image URL is missing. Please try uploading again.');
        return;
      }

      // Log image size
      const imageSizeKB = Math.round(finalImageUrl.length / 1024);
      console.log(`📏 [CLOSET] Image size: ${imageSizeKB} KB (${finalImageUrl.length} bytes)`);

      if (imageSizeKB > 1024) {
        console.warn(`⚠️ [CLOSET] Large image detected (${imageSizeKB} KB). Consider compressing for better performance.`);
      }

      // Create the complete item with user-selected category
      const newItem: ClothingItem = {
        ...(pendingItem.itemData as ClothingItem),
        category: category,
        imageUrl: finalImageUrl // Ensure imageUrl is set
      };

      console.log('📋 [CLOSET] Item to save:', {
        id: newItem.id,
        name: newItem.name,
        category: newItem.category,
        hasImageUrl: !!newItem.imageUrl,
        imageUrlPrefix: newItem.imageUrl.substring(0, 50)
      });

      // Save to localStorage via ClosetService
      await ClosetService.addClothingItem(newItem.category, newItem);
      console.log('✅ [CLOSET] Item saved to localStorage:', newItem.category);

      // Verify it was saved
      const savedItems = ClosetService.getUserCloset();
      const categoryItems = savedItems[newItem.category];
      const savedItem = categoryItems?.find(item => item.id === newItem.id);

      if (savedItem) {
        console.log('✅ [CLOSET] Verified item in storage:', {
          id: savedItem.id,
          name: savedItem.name,
          hasImageUrl: !!savedItem.imageUrl,
          imageUrlLength: savedItem.imageUrl?.length
        });
      } else {
        console.error('❌ [CLOSET] Item not found in storage after save!');
      }

      // Check localStorage quota AFTER saving
      const quotaAfter = checkLocalStorageQuota();
      if (quotaAfter.isNearLimit) {
        console.warn(`⚠️ [CLOSET] localStorage usage increased to ${quotaAfter.percentage}% (${quotaAfter.formattedUsed} / ${quotaAfter.formattedTotal})`);
        if (quotaAfter.percentage > 90) {
          alert('Warning: Your closet storage is almost full! Consider deleting some items or using smaller images.');
        }
      }

      // Dispatch custom event to notify ClosetPage of update (same-tab communication)
      window.dispatchEvent(new CustomEvent('closetUpdated', {
        detail: { category: newItem.category, action: 'add', itemName: newItem.name }
      }));
      console.log('🔔 [CLOSET] Dispatched closetUpdated event for:', newItem.category);

      // Reload all items from storage to ensure fresh data
      const allItems = ClosetService.getAllClothingItems();
      setClothingItems(allItems);
      console.log('🔄 [CLOSET] Reloaded all items after save:', allItems.length);

      // Award experience
      const baseXP = 10;
      const bonusXP = pendingItem.metadata?.backgroundRemoved ? 5 : 0;
      const confidenceBonus = pendingItem.metadata?.confidence > 0.9 ? 5 : 0;
      const totalXP = baseXP + bonusXP + confidenceBonus;
      setExperience(prev => prev + totalXP);

      // Show success notification
      console.log(`✅ [CLOSET] Item added: ${newItem.name} (${newItem.category}) +${totalXP} XP`);
      if (pendingItem.metadata?.backgroundRemoved) {
        console.log('🎨 Background automatically removed!');
      }

      // Check for achievements
      checkAchievements();

      // Check if this is part of a multi-item upload
      const isMultiItem = pendingItem.metadata?.isMultiItem;
      const totalItems = pendingItem.metadata?.totalItems || 0;
      const currentIndex = pendingItem.metadata?.currentIndex || 0;

      if (isMultiItem && currentIndex < totalItems - 1) {
        // More items to categorize
        const nextIndex = currentIndex + 1;
        const nextItem = pendingMultiItems[nextIndex];

        console.log(`📦 [MULTI-ITEM] Moving to next item (${nextIndex + 1}/${totalItems})`);

        setCurrentMultiItemIndex(nextIndex);
        setPendingItem({
          imageUrl: nextItem.croppedImageUrl || '',
          itemData: {
            id: Date.now().toString() + nextIndex,
            name: nextItem.name,
            imageUrl: nextItem.croppedImageUrl || '',
            color: 'unknown',
            dateAdded: new Date().toISOString(),
            timesWorn: 0,
            season: 'all'
          },
          metadata: {
            suggestedCategory: nextItem.category,
            isMultiItem: true,
            totalItems: totalItems,
            currentIndex: nextIndex
          }
        });
        // Category selector stays open for next item
      } else {
        // All items categorized or single item
        if (isMultiItem) {
          console.log(`✅ [MULTI-ITEM] All ${totalItems} items categorized successfully!`);
          setPendingMultiItems([]);
          setCurrentMultiItemIndex(0);
        }

        // Reset state
        setShowCategorySelector(false);
        setPendingItem(null);
      }

    } catch (error) {
      console.error('❌ [CLOSET] Failed to save item:', error);
      alert('Failed to save item to closet. Please try again.');
      // Don't reset state on error so user can retry
    }
  };

  const handleCategoryCancel = () => {
    console.log('❌ [CLOSET] Item upload cancelled');
    setShowCategorySelector(false);
    setPendingItem(null);
  };

  const handleToggleFavorite = (item: ClothingItem) => {
    console.log(`❤️ [FAVORITE] Toggling favorite for item: ${item.name}`);
    const success = ClosetService.toggleFavorite(item.id);
    if (success) {
      // Reload items to reflect the change
      const allItems = ClosetService.getAllClothingItems();
      setClothingItems(allItems);
      console.log(`✅ [FAVORITE] Item ${item.favorite ? 'unfavorited' : 'favorited'}: ${item.name}`);
    }
  };

  const handleDeleteClick = (item: ClothingItem) => {
    console.log(`🗑️ [DELETE] Delete clicked for item: ${item.name}`);
    setItemToDelete(item);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    console.log(`🗑️ [DELETE] Permanently deleting item: ${itemToDelete.name}`);
    const success = ClosetService.deleteClothingItem(itemToDelete.id);

    if (success) {
      // Reload items to reflect the deletion
      const allItems = ClosetService.getAllClothingItems();
      setClothingItems(allItems);
      console.log(`✅ [DELETE] Item deleted: ${itemToDelete.name}`);
    }

    // Reset state
    setShowDeleteConfirmation(false);
    setItemToDelete(null);
  };

  const handleDeleteCancel = () => {
    console.log('❌ [DELETE] Delete cancelled');
    setShowDeleteConfirmation(false);
    setItemToDelete(null);
  };

  const handleToggleImageVersion = (itemId: string) => {
    setShowingOriginalVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        console.log(`🖼️ [IMAGE-TOGGLE] Showing transparent version for item: ${itemId}`);
      } else {
        newSet.add(itemId);
        console.log(`🖼️ [IMAGE-TOGGLE] Showing original version for item: ${itemId}`);
      }
      return newSet;
    });
  };

  // Multi-item splitter handlers
  const handleMultiItemConfirmSplit = (items: DetectedItem[]) => {
    console.log('✂️ [MULTI-ITEM] User confirmed split, processing', items.length, 'items');

    // Store the items to be categorized one by one
    setPendingMultiItems(items);
    setCurrentMultiItemIndex(0);
    setShowMultiItemSplitter(false);

    // Show category selector for the first item
    if (items.length > 0) {
      const firstItem = items[0];
      setPendingItem({
        imageUrl: firstItem.croppedImageUrl || '',
        itemData: {
          id: Date.now().toString(),
          name: firstItem.name,
          imageUrl: firstItem.croppedImageUrl || '',
          color: 'unknown',
          dateAdded: new Date().toISOString(),
          timesWorn: 0,
          season: 'all'
        },
        metadata: {
          suggestedCategory: firstItem.category,
          isMultiItem: true,
          totalItems: items.length,
          currentIndex: 0
        }
      });
      setShowCategorySelector(true);
    }
  };

  const handleMultiItemTreatAsSingle = () => {
    console.log('🔗 [MULTI-ITEM] User chose to treat as single item');
    setShowMultiItemSplitter(false);

    // Continue with normal flow using the original image
    if (multiItemDetectionResult) {
      setPendingItem({
        imageUrl: multiItemDetectionResult.originalImageUrl,
        itemData: {
          id: Date.now().toString(),
          name: 'Mixed Outfit',
          imageUrl: multiItemDetectionResult.originalImageUrl,
          color: 'mixed',
          dateAdded: new Date().toISOString(),
          timesWorn: 0,
          season: 'all'
        },
        metadata: {
          suggestedCategory: 'other'
        }
      });
      setShowCategorySelector(true);
    }
  };

  const handleMultiItemCancel = () => {
    console.log('❌ [MULTI-ITEM] User cancelled multi-item split');
    setShowMultiItemSplitter(false);
    setMultiItemDetectionResult(null);
    setPendingMultiItems([]);
    setCurrentMultiItemIndex(0);
  };

  const checkAchievements = () => {
    achievements.forEach(achievement => {
      if (!achievement.unlocked && achievement.progress >= achievement.maxProgress) {
        setNewAchievement(achievement);
        setShowAchievementModal(true);
        setExperience(prev => prev + 50);
      }
    });
  };

  const generateOutfitOfTheDay = async () => {
    // Handle insufficient items case
    if (clothingItems.length < 3) {
      console.log('⚠️ Not enough items in closet to generate outfit');
      setOotdError('You need at least 3 items in your closet to generate an outfit');
      setOutfitOfTheDay(null);
      setShowOOTDModal(true);
      return;
    }

    try {
      console.log('🎯 [OOTD] Generating intelligent outfit of the day...');

      // Get current weather
      const weather = await weatherService.getCurrentWeather();
      const temperature = weather?.temperature || 70; // Default to 70°F if no weather data

      // Get user style preferences
      const styleProfile = await stylePreferencesService.loadStyleProfile();
      const preferredColors = styleProfile?.fashionPersonality?.colorPalette || [];
      const avoidColors = styleProfile?.fashionPersonality?.avoidColors || [];
      const preferredMaterials = styleProfile?.preferences?.materials || [];
      const preferredFits = styleProfile?.preferences?.fits || [];

      // Get current day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = new Date().getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      console.log('🌡️ [OOTD] Weather temperature:', temperature);
      console.log('📅 [OOTD] Day:', isWeekend ? 'Weekend' : 'Weekday');

      // Filter items based on weather and style preferences
      const weatherAppropriateItems = clothingItems.filter(item => {
        // Temperature-based filtering
        if (temperature < 50) {
          // Cold weather - prefer sweaters, jackets, outerwear, long pants
          return ['sweaters', 'jackets', 'outerwear', 'pants'].includes(item.category);
        } else if (temperature < 70) {
          // Mild weather - versatile pieces
          return ['shirts', 'tops', 'sweaters', 'pants', 'dresses'].includes(item.category);
        } else {
          // Warm weather - light, breathable pieces
          return ['shirts', 'tops', 'dresses', 'skirts'].includes(item.category);
        }
      });

      // Further filter by style preferences if available
      let styledItems = weatherAppropriateItems;
      if (preferredColors.length > 0 || avoidColors.length > 0) {
        styledItems = weatherAppropriateItems.filter(item => {
          const itemColor = item.color?.toLowerCase() || '';

          // Avoid colors user doesn't like
          if (avoidColors.length > 0 && avoidColors.some(c => itemColor.includes(c.toLowerCase()))) {
            return false;
          }

          // Prefer user's favorite colors (but don't exclude if no color match)
          return true;
        });
      }

      // If filtering was too strict, fall back to weather-appropriate items
      const itemPool = styledItems.length >= 3 ? styledItems : weatherAppropriateItems;

      // Categorize items
      const tops = itemPool.filter(i => ['shirts', 'tops', 'sweaters'].includes(i.category));
      const bottoms = itemPool.filter(i => ['pants', 'skirts'].includes(i.category));
      const dresses = itemPool.filter(i => i.category === 'dresses');
      const outerwear = itemPool.filter(i => ['jackets', 'outerwear'].includes(i.category));
      const shoes = itemPool.filter(i => i.category === 'shoes');

      // Build outfit based on available items
      const outfitItems: ClothingItem[] = [];

      // Option 1: Dress (if available and warm enough)
      if (dresses.length > 0 && temperature > 60) {
        outfitItems.push(dresses[Math.floor(Math.random() * dresses.length)]);

        // Add outerwear if cold
        if (temperature < 65 && outerwear.length > 0) {
          outfitItems.push(outerwear[Math.floor(Math.random() * outerwear.length)]);
        }
      } else {
        // Option 2: Top + Bottom combo
        if (tops.length > 0) {
          outfitItems.push(tops[Math.floor(Math.random() * tops.length)]);
        }

        if (bottoms.length > 0) {
          outfitItems.push(bottoms[Math.floor(Math.random() * bottoms.length)]);
        }

        // Add layer if cold
        if (temperature < 60 && outerwear.length > 0) {
          outfitItems.push(outerwear[Math.floor(Math.random() * outerwear.length)]);
        }
      }

      // Add shoes if available
      if (shoes.length > 0) {
        outfitItems.push(shoes[Math.floor(Math.random() * shoes.length)]);
      }

      // Fallback: if we don't have enough items, just pick random ones
      if (outfitItems.length < 2) {
        console.log('⚠️ [OOTD] Not enough categorized items, using random selection');
        const randomItems = itemPool
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        outfitItems.push(...randomItems);
      }

      const ootd: OutfitCombination = {
        id: Date.now().toString(),
        name: `Today's ${isWeekend ? 'Weekend' : 'Weekday'} Look`,
        items: outfitItems,
        occasion: isWeekend ? 'casual' : 'smart-casual',
        season: currentSeason,
        saves: 0,
        dateCreated: new Date().toISOString()
      };

      console.log('✅ [OOTD] Generated outfit:', {
        itemCount: outfitItems.length,
        categories: outfitItems.map(i => i.category),
        temperature,
        isWeekend
      });

      // Store weather data for modal display
      setOotdWeather({
        temperature,
        description: weather?.weatherDescription || getWeatherDescription(temperature)
      });

      // Clear any previous errors
      setOotdError(null);

      // Set outfit and open modal
      setOutfitOfTheDay(ootd);
      setShowOOTDModal(true);
    } catch (error) {
      console.error('❌ [OOTD] Failed to generate outfit:', error);

      // Fallback to simple random selection
      const randomItems = clothingItems
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const fallbackOotd: OutfitCombination = {
        id: Date.now().toString(),
        name: 'Today\'s Look',
        items: randomItems,
        occasion: 'casual',
        season: currentSeason,
        saves: 0,
        dateCreated: new Date().toISOString()
      };

      setOutfitOfTheDay(fallbackOotd);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Calendar helper functions
  const handleDateClick = (date: number) => {
    setSelectedDate(date);
    setModalStep('occasion');
    setShowDateModal(true);
  };

  const getOccasionColor = (occasion: string) => {
    switch (occasion) {
      case 'travel': return 'bg-blue-500';
      case 'formal': return 'bg-purple-500';
      case 'social': return 'bg-green-500';
      case 'daily': return 'bg-orange-500';
      case 'activities': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const handleOccasionSelect = (occasion: 'travel' | 'formal' | 'social' | 'daily' | 'activities') => {
    if (selectedDate) {
      setDateOccasions(prev => ({
        ...prev,
        [selectedDate]: {
          occasion,
          notes: prev[selectedDate]?.notes || '',
          outfitPieces: prev[selectedDate]?.outfitPieces || []
        }
      }));
      setModalStep('notes');
    }
  };

  const handleNotesChange = (notes: string) => {
    if (selectedDate) {
      setDateOccasions(prev => ({
        ...prev,
        [selectedDate]: {
          ...prev[selectedDate],
          notes
        }
      }));
    }
  };

  const handleDateFileUpload = async (file: File) => {
    if (!selectedDate) return;

    try {
      // Convert file to base64 for persistent storage
      const imageUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const newPiece = {
        id: Date.now().toString(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        imageUrl: imageUrl,
        category: 'clothing'
      };

      setDateOccasions(prev => ({
        ...prev,
        [selectedDate]: {
          ...prev[selectedDate],
          outfitPieces: [...(prev[selectedDate]?.outfitPieces || []), newPiece]
        }
      }));
    } catch (error) {
      console.error('Error uploading outfit piece:', error);
    }
  };

  const removeOutfitPiece = (pieceId: string) => {
    if (!selectedDate) return;

    setDateOccasions(prev => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        outfitPieces: prev[selectedDate]?.outfitPieces?.filter(piece => piece.id !== pieceId) || []
      }
    }));
  };

  const addFromCloset = (item: ClothingItem) => {
    if (!selectedDate) return;

    // Check if item is already added
    const currentPieces = dateOccasions[selectedDate]?.outfitPieces || [];
    if (currentPieces.some(piece => piece.id === item.id)) return;

    const outfitPiece = {
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      category: item.category
    };

    setDateOccasions(prev => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        outfitPieces: [...(prev[selectedDate]?.outfitPieces || []), outfitPiece]
      }
    }));
  };

  const getAchievementColor = (category: string) => {
    switch (category) {
      case 'organizing': return 'bg-ios-blue text-white';
      case 'sustainability': return 'bg-ios-green text-white';
      case 'creativity': return 'bg-ios-purple text-white';
      case 'social': return 'bg-ios-pink text-white';
      default: return 'bg-ios-fill text-ios-label';
    }
  };

  if (currentView === 'doors') {
    return (
      <div className="min-h-screen pb-[calc(49px+env(safe-area-inset-bottom))] pt-safe bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Header with Liquid Glass Effect */}
        <div
          className={`relative z-10 flex items-center justify-between p-6 ${glassNavClasses.light}`}
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)'
          }}
        >
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-amber-800 hover:text-amber-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-amber-900 mb-2">Your Personal Closet</h1>
            <p className="text-amber-700">Organize, create, and express your unique style</p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="ios-blur bg-white/80 rounded-ios-full px-4 py-2 flex items-center space-x-2 shadow-ios-sm">
              <Star className="w-4 h-4 text-ios-yellow" />
              <span className="ios-callout font-semibold">Level {currentLevel}</span>
            </div>
          </div>
        </div>

        {/* Closet Doors */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-4xl aspect-[16/10]">
            <ClosetDoors
              isOpen={doorsOpen}
              onAnimationComplete={handleDoorsOpen}
              achievementLevel="stylish"
            />
          </div>
        </div>

        {/* Open Closet Button */}
        <div className="relative z-10 text-center pb-12">
          <button
            onClick={() => setDoorsOpen(true)}
            className="ios-button-primary bg-gradient-to-r from-ios-purple to-ios-indigo hover:opacity-90 transform hover:scale-105 transition-all shadow-ios-lg px-8 py-4"
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6" />
              <span>Open Your Closet</span>
              <Sparkles className="w-6 h-6" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-[calc(49px+env(safe-area-inset-bottom))] pt-safe closet-interior relative overflow-hidden">
      {/* Baby Pink Liquid Glass Header with WARDROBE Text */}
      <div
        className="border-b sticky top-0 z-30 pt-safe"
        style={{
          background: 'rgba(255, 192, 203, 0.4)',
          backdropFilter: 'blur(30px) saturate(200%)',
          WebkitBackdropFilter: 'blur(30px) saturate(200%)',
          boxShadow: '0 8px 32px 0 rgba(255, 182, 193, 0.37)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          padding: '0.5rem 1rem'
        }}
      >
        <div className="flex items-start justify-start py-1 px-2">
          <h1
            className="font-semibold tracking-wider"
            style={{
              fontSize: '2.18rem',
              fontFamily: "'Dancing Script', cursive",
              fontWeight: 700,
              letterSpacing: '0.15em',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(180deg, #4A4A4A 0%, #2C2C2C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            WARDROBE
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)] relative">
        {/* Sidebar - Collapsible on mobile */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-40
          w-80 bg-white/95 md:bg-white/80 backdrop-blur-sm border-r border-gray-200 p-6 overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:block
        `}>
          {/* Close sidebar button - Mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute top-4 right-4 w-8 h-8 rounded-full bg-ios-fill hover:bg-ios-fill-secondary flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-ios-label-secondary" />
          </button>

          {/* Smart Calendar Section */}
          <div className="mb-6 pt-8 md:pt-0">
            <h3 className="ios-headline mb-3">Calendar</h3>
            <button
              onClick={() => {
                setCurrentView('smart-calendar');
                setSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              className="w-full flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-indigo-600 hover:to-blue-700 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Smart Calendar</span>
            </button>
          </div>

          {/* Upload Section */}
          <div className="mb-6">
            <h3 className="ios-headline mb-3">Add to Closet</h3>
            <div className="space-y-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress.isUploading}
                className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                  uploadProgress.isUploading
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {uploadProgress.isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  // Detect if mobile device
                  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                  if (isMobile) {
                    // Mobile: Use native camera input
                    console.log('📱 [CAMERA] Mobile detected - using native camera');
                    cameraInputRef.current?.click();
                  } else {
                    // Desktop: Open webcam modal
                    console.log('💻 [CAMERA] Desktop detected - opening webcam modal');
                    setShowCameraModal(true);
                  }
                }}
                disabled={uploadProgress.isUploading}
                className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                  uploadProgress.isUploading
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {uploadProgress.isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </>
                )}
              </button>
            </div>

            {/* Upload Progress Indicator */}
            {uploadProgress.isUploading && (
              <div className="mt-3 p-4 bg-ios-blue/10 border border-ios-blue/20 rounded-ios-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ios-blue"></div>
                  <span className="ios-subheadline font-semibold text-ios-blue">AI Processing</span>
                </div>
                <p className="ios-caption-1 text-ios-blue mb-2">{uploadProgress.message}</p>

                {/* Progress Steps */}
                <div className="flex space-x-1">
                  {['uploading', 'processing', 'removing-background', 'categorizing'].map((step, index) => (
                    <div
                      key={step}
                      className={`h-1 flex-1 rounded ${
                        ['uploading', 'processing', 'removing-background', 'categorizing'].indexOf(uploadProgress.stage) >= index
                          ? 'bg-blue-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Success/Error Message */}
            {!uploadProgress.isUploading && uploadProgress.message && (
              <div className={`mt-3 p-3 rounded-lg ${
                uploadProgress.message.includes('✅')
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : uploadProgress.message.includes('❌')
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
              }`}>
                <p className="text-sm font-medium">{uploadProgress.message}</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
              disabled={uploadProgress.isUploading}
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
              disabled={uploadProgress.isUploading}
            />
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="ios-headline mb-3">Categories</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    console.log(`📂 [CATEGORY-CLICK-V3] Selected category:`, {
                      id: category.id,
                      name: category.name,
                      count: category.count,
                      previousCategory: selectedCategory,
                      willMatchBoth: category.id === 'tops' ? 'tops OR shirts' : category.id
                    });
                    setSelectedCategory(category.id);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {category.icon}
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <span className="text-sm bg-white/50 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Mobile Overlay - Click to close sidebar */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentView === 'outfit-creator' && (
            <OutfitCreator
              clothingItems={clothingItems}
              onBack={() => setCurrentView('interior')}
              avatarData={avatarData}
              onTryOn={(outfit) => {
                setSelectedOutfit(outfit);
                setCurrentView('try-on');
              }}
            />
          )}

          {currentView === 'try-on' && (
            <div className="text-center py-12">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Virtual Try-On</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Avatar Display */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {tryOnResults.displayMode === 'tryon' ? 'Try-On Result' : 'Your Avatar'}
                      </h3>
                      {tryOnResults.results.length > 0 && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setTryOnResults(prev => ({ ...prev, displayMode: 'original' }))}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              tryOnResults.displayMode === 'original'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Original
                          </button>
                          <button
                            onClick={() => setTryOnResults(prev => ({ ...prev, displayMode: 'tryon' }))}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              tryOnResults.displayMode === 'tryon'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Try-On
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="aspect-[9/16] max-w-xs mx-auto bg-gray-100 rounded-xl flex items-center justify-center relative">
                      {tryOnResults.isProcessing ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-2"></div>
                          <p className="text-gray-500 text-sm">Processing try-on...</p>
                        </div>
                      ) : avatarData ? (
                        <>
                          {/* Display avatar or try-on result based on mode */}
                          {tryOnResults.displayMode === 'tryon' &&
                           tryOnResults.results.length > 0 &&
                           tryOnResults.results[tryOnResults.currentIndex]?.success &&
                           tryOnResults.results[tryOnResults.currentIndex]?.finalImageUrl ? (
                            <img
                              src={tryOnResults.results[tryOnResults.currentIndex].finalImageUrl}
                              alt="Avatar with outfit"
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <img
                              src={avatarData.imageUrl || avatarData}
                              alt="Avatar"
                              className="w-full h-full object-cover rounded-xl"
                            />
                          )}

                          {/* Result navigation for multiple items */}
                          {tryOnResults.results.length > 1 && (
                            <div className="absolute bottom-2 left-2 right-2 flex justify-center space-x-1">
                              {tryOnResults.results.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setTryOnResults(prev => ({ ...prev, currentIndex: index }))}
                                  className={`w-2 h-2 rounded-full transition-colors ${
                                    index === tryOnResults.currentIndex
                                      ? 'bg-white'
                                      : 'bg-white/50 hover:bg-white/75'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center">
                          <Crown className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Upload an avatar to see try-on</p>
                        </div>
                      )}
                    </div>

                    {/* Try-on status and error display */}
                    {tryOnResults.results.length > 0 && (
                      <div className="mt-4 text-center">
                        {tryOnResults.results[tryOnResults.currentIndex]?.success ? (
                          <p className="text-sm text-green-600">
                            ✅ {tryOnResults.results[tryOnResults.currentIndex].itemName} applied successfully
                          </p>
                        ) : (
                          <p className="text-sm text-red-600">
                            ❌ {tryOnResults.results[tryOnResults.currentIndex]?.error || 'Try-on failed'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* View toggle buttons */}
                    {avatarData && tryOnResults.results.length > 0 && tryOnResults.results[tryOnResults.currentIndex]?.success && (
                      <div className="mt-4 flex justify-center">
                        <div className="bg-gray-100 rounded-lg p-1 flex">
                          <button
                            onClick={() => setTryOnResults(prev => ({ ...prev, displayMode: 'original' }))}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              tryOnResults.displayMode === 'original'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Original Avatar
                          </button>
                          <button
                            onClick={() => setTryOnResults(prev => ({ ...prev, displayMode: 'tryon' }))}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              tryOnResults.displayMode === 'tryon'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Try-On Result
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Outfit Items */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Selected Outfit</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {selectedOutfit.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="aspect-square">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={async () => {
                          if (avatarData && selectedOutfit.length > 0) {
                            // Start processing state
                            setTryOnResults(prev => ({
                              ...prev,
                              isProcessing: true,
                              results: []
                            }));

                            try {
                              // Virtual try-on with multiple items
                              const tryOnPromises = selectedOutfit.map(item =>
                                seamlessTryOnService.generateAndTryOn({
                                  clothingDescription: item.name,
                                  avatarImage: avatarData.imageUrl || avatarData,
                                  style: 'balanced',
                                  quality: 'balanced',
                                  enhancePrompts: true
                                })
                              );

                              const results = await Promise.all(tryOnPromises);
                              console.log('Try-on results:', results);

                              // Store results in state
                              const processedResults = results.map((result, index) => ({
                                success: result.success,
                                finalImageUrl: result.finalImageUrl,
                                clothingImageUrl: result.clothingImageUrl,
                                itemName: selectedOutfit[index].name,
                                error: result.success ? undefined : result.error
                              }));

                              setTryOnResults(prev => ({
                                ...prev,
                                isProcessing: false,
                                results: processedResults,
                                displayMode: processedResults.some(r => r.success) ? 'tryon' : 'original',
                                currentIndex: 0
                              }));

                            } catch (error) {
                              console.error('Try-on error:', error);
                              setTryOnResults(prev => ({
                                ...prev,
                                isProcessing: false,
                                results: [{
                                  success: false,
                                  itemName: 'Try-on',
                                  error: error instanceof Error ? error.message : 'Unknown error occurred'
                                }]
                              }));
                            }
                          }
                        }}
                        disabled={!avatarData || selectedOutfit.length === 0 || tryOnResults.isProcessing}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {tryOnResults.isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5" />
                              <span>Apply to Avatar</span>
                            </>
                          )}
                        </div>
                      </button>

                      <button
                        onClick={() => setCurrentView('outfit-creator')}
                        className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Back to Outfit Creator
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'smart-calendar' && (
            <SmartCalendarDashboard
              onBack={() => setCurrentView('interior')}
              clothingItems={clothingItems}
            />
          )}


          {currentView === 'interior' && (
            <VisualClosetEnhanced />
          )}

          {/* Old interior view code - keeping as fallback/reference */}
          {false && currentView === 'interior-old' && (
            <>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedCategory === 'all' ? 'All Items' :
                   selectedCategory === 'favorites' ? 'Favorites' :
                   categories.find(c => c.id === selectedCategory)?.name}
                </h2>
              </div>

              {/* Clothing Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {(() => {
                  const filteredItems = clothingItems.filter(item => {
                    if (selectedCategory === 'all') return true;
                    if (selectedCategory === 'favorites') return item.favorite === true;
                    // Handle both 'tops' and legacy 'shirts' category
                    if (selectedCategory === 'tops') return item.category === 'tops' || item.category === 'shirts';
                    // Handle both 'pants' and 'skirts' in Bottoms category
                    if (selectedCategory === 'pants') return item.category === 'pants' || item.category === 'skirts';
                    return item.category === selectedCategory;
                  });

                  console.log(`🖼️ [CLOSET-GRID-V3] Rendering grid for "${selectedCategory}":`, {
                    totalItems: clothingItems.length,
                    filteredItems: filteredItems.length,
                    selectedCategory,
                    itemCategories: clothingItems.map(i => i.category).filter((v, i, a) => a.indexOf(v) === i),
                    topsAndShirts: selectedCategory === 'tops' ? clothingItems.filter(i => i.category === 'tops' || i.category === 'shirts').map(i => ({name: i.name, category: i.category})) : undefined,
                    pantsAndSkirts: selectedCategory === 'pants' ? clothingItems.filter(i => i.category === 'pants' || i.category === 'skirts').map(i => ({name: i.name, category: i.category})) : undefined
                  });

                  return filteredItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="category-item bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div
                        className="aspect-square relative flex items-center justify-center"
                        style={{
                          background: item.originalImageUrl && !showingOriginalVersions.has(item.id)
                            ? 'repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 50% / 20px 20px'
                            : '#f3f4f6'
                        }}
                        title={item.originalImageUrl ? 'Has transparent background' : undefined}
                      >
                        <img
                          src={
                            item.originalImageUrl && showingOriginalVersions.has(item.id)
                              ? item.originalImageUrl
                              : item.imageUrl
                          }
                          alt={item.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            console.error(`❌ [IMAGE-LOAD-ERROR-GRID] Failed to load image for "${item.name}":`, {
                              itemId: item.id,
                              hasImageUrl: !!item.imageUrl,
                              imageUrlType: item.imageUrl?.startsWith('data:') ? 'data-url' : item.imageUrl?.startsWith('http') ? 'http' : 'other',
                              imageUrlLength: item.imageUrl?.length,
                              imageUrlPrefix: item.imageUrl?.substring(0, 100)
                            });
                            // Set fallback placeholder
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent && !parent.querySelector('.fallback-icon')) {
                              parent.innerHTML = '<div class="fallback-icon flex flex-col items-center justify-center w-full h-full text-gray-400"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs mt-2">Image unavailable</span></div>';
                            }
                          }}
                          onLoad={() => {
                            console.log(`✅ [IMAGE-LOAD-SUCCESS-GRID] Image loaded for "${item.name}"`);
                          }}
                        />

                        {/* Sustainability badge */}
                        {item.sustainability === 'eco' && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <Leaf className="w-3 h-3 mr-1" />
                            Eco
                          </div>
                        )}

                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(item);
                              }}
                              className={`p-2 rounded-full hover:scale-110 transition-all ${
                                item.favorite
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white/90 text-gray-700 hover:bg-white'
                              }`}
                              title={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Heart className={`w-4 h-4 ${item.favorite ? 'fill-current' : ''}`} />
                            </button>

                            {/* Toggle between original and transparent versions */}
                            {item.originalImageUrl && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleImageVersion(item.id);
                                }}
                                className="bg-white/90 p-2 rounded-full hover:bg-purple-500 hover:text-white transition-colors"
                                title={showingOriginalVersions.has(item.id) ? 'Show transparent version' : 'Show original version'}
                              >
                                <Palette className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(item);
                              }}
                              className="bg-white/90 p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                              title="Delete item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-3">
                        <h4 className="font-medium text-gray-800 text-sm truncate">{item.name}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500 capitalize">{item.category}</span>
                          {item.timesWorn !== undefined && (
                            <span className="text-xs text-gray-400">Worn {item.timesWorn}x</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}

                {/* Add new item placeholder */}
                <div
                  onClick={() => !uploadProgress.isUploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center aspect-square transition-colors ${
                    uploadProgress.isUploading
                      ? 'bg-blue-50 border-blue-300 cursor-wait'
                      : 'bg-gray-50 border-gray-300 hover:border-purple-400 hover:bg-purple-50 cursor-pointer group'
                  }`}
                >
                  {uploadProgress.isUploading ? (
                    <div className="text-center">
                      <div className="bg-blue-200 p-4 rounded-full mx-auto mb-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                      <p className="text-sm text-blue-600 font-medium mb-1">Processing...</p>
                      <p className="text-xs text-blue-500 px-2 text-center">{uploadProgress.message}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="bg-gray-200 group-hover:bg-purple-200 p-4 rounded-full mx-auto mb-2 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-purple-600" />
                      </div>
                      <p className="text-sm text-gray-500 group-hover:text-purple-600 font-medium">Add Item</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Achievement Modal */}
      {showAchievementModal && newAchievement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center relative achievement-glow">
            <button
              onClick={() => setShowAchievementModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Achievement Unlocked!</h3>
              <h4 className="text-lg font-semibold text-purple-600 mb-2">{newAchievement.title}</h4>
              <p className="text-gray-600">{newAchievement.description}</p>
            </div>

            <div className="space-y-3">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-700">You earned 50 XP!</p>
              </div>

              <button
                onClick={() => setShowAchievementModal(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Delete Item?
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to permanently delete <span className="font-semibold">{itemToDelete.name}</span> from your closet?
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                No, Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outfit of the Day Modal */}
      {showOOTDModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Error State */}
            {ootdError && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Build Your Wardrobe</h3>
                  <p className="text-gray-600">{ootdError}</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowOOTDModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowOOTDModal(false);
                      setCurrentView('wardrobe');
                    }}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors"
                  >
                    Add Items to Closet
                  </button>
                </div>
              </>
            )}

            {/* Success State */}
            {!ootdError && outfitOfTheDay && ootdWeather && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Perfect Outfit for Today
                  </h3>
                  <p className="text-gray-600">
                    This would be perfect for today, {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}, considering the {ootdWeather.description} weather at {ootdWeather.temperature}°F
                  </p>
                </div>

                {/* Outfit Items Grid */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Your Outfit
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {outfitOfTheDay.items.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-white">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowOOTDModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      generateOutfitOfTheDay();
                    }}
                    className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => {
                      setShowOOTDModal(false);
                      // Could add logic here to save outfit or mark as "worn today"
                    }}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors"
                  >
                    Wear This
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Multi-Item Splitter Modal */}
      {showMultiItemSplitter && multiItemDetectionResult && (
        <MultiItemSplitter
          originalImageUrl={multiItemDetectionResult.originalImageUrl}
          detectedItems={multiItemDetectionResult.items}
          onConfirmSplit={handleMultiItemConfirmSplit}
          onCancel={handleMultiItemCancel}
          onTreatAsSingle={handleMultiItemTreatAsSingle}
        />
      )}

      {/* Category Selector Modal */}
      {showCategorySelector && pendingItem && (
        <CategorySelector
          imageUrl={pendingItem.imageUrl}
          onConfirm={handleCategoryConfirm}
          onCancel={handleCategoryCancel}
          suggestedCategory={pendingItem.metadata?.suggestedCategory as ClothingCategory}
          aiMetadata={{
            subcategory: pendingItem.metadata?.subcategory,
            color: pendingItem.metadata?.color,
            confidence: pendingItem.metadata?.confidence
          }}
        />
      )}

      {/* Camera Capture Modal (Desktop Webcam) */}
      {showCameraModal && (
        <CameraCapture
          onCapture={(file) => {
            console.log('📸 [CAMERA] Photo captured from webcam:', file.name);
            handleFileUpload(file);
            setShowCameraModal(false);
          }}
          onClose={() => {
            console.log('❌ [CAMERA] Camera modal closed');
            setShowCameraModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ClosetExperience;