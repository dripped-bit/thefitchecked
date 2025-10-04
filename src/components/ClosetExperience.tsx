import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Camera, Shirt, ArrowLeft, Target, Trophy, Star,
  Sparkles, ShoppingBag, Heart, Mic, Calendar, DollarSign,
  Leaf, TrendingUp, Award, Gift, CheckCircle, X, Play,
  Palette, Shuffle, Share2, Volume2, VolumeX, Crown,
  Tag, Package, Zap, Users, MapPin, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import ClosetDoors from './ClosetDoors';
import OutfitCreator from './OutfitCreator';
import ClosetPage from './ClosetPage';
import SmartCalendarDashboard from './SmartCalendarDashboard';
import PackingListGenerator from './PackingListGenerator';
import WoreThisTodayTracker from './WoreThisTodayTracker';
import CategorySelector from './CategorySelector';
import ShareModal from './ShareModal';
import ClosetService, { ClothingCategory } from '../services/closetService';
import seamlessTryOnService from '../services/seamlessTryOnService';
import backgroundRemovalService from '../services/backgroundRemovalService';

interface ClothingItem {
  id: string;
  name: string;
  imageUrl: string;
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
  const [currentView, setCurrentView] = useState<'doors' | 'interior' | 'outfit-creator' | 'try-on' | 'monthly-planner' | 'smart-calendar'>(initialView);
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

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [modalStep, setModalStep] = useState<'occasion' | 'notes' | 'outfit'>('occasion');
  const [outfitMode, setOutfitMode] = useState<'upload' | 'closet'>('closet');
  const [currentMonth, setCurrentMonth] = useState(9); // 0-based: 9 = October
  const [currentYear, setCurrentYear] = useState(2024);
  const [dateOccasions, setDateOccasions] = useState<{[key: number]: {
    occasion: 'travel' | 'formal' | 'social' | 'daily' | 'activities';
    notes: string;
    outfitPieces: Array<{
      id: string;
      name: string;
      imageUrl: string;
      category: string;
    }>;
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

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedItemToShare, setSelectedItemToShare] = useState<ClothingItem | null>(null);

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

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dateFileInputRef = useRef<HTMLInputElement>(null);

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
        id: 'first-upload',
        title: 'First Steps',
        description: 'Upload your first clothing item',
        icon: <Shirt className="w-5 h-5" />,
        unlocked: clothingItems.length > 0,
        progress: Math.min(clothingItems.length, 1),
        maxProgress: 1,
        category: 'organizing'
      },
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
    { id: 'shirts', name: 'Tops', icon: <Shirt className="w-5 h-5" />, count: clothingItems.filter(item => item.category === 'shirts').length },
    { id: 'pants', name: 'Bottoms', icon: <Tag className="w-5 h-5" />, count: clothingItems.filter(item => item.category === 'pants').length },
    { id: 'dresses', name: 'Dresses', icon: <Crown className="w-5 h-5" />, count: clothingItems.filter(item => item.category === 'dresses').length },
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
        // Show background removal stage if successful
        if (result.metadata?.backgroundRemoved) {
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

        // Prepare item data (without category yet)
        const itemData = {
          id: Date.now().toString(),
          name: result.metadata?.originalName || file.name.replace(/\.[^/.]+$/, ""),
          imageUrl: result.processedImageUrl || result.imageUrl!,
          color: result.metadata?.color,
          brand: result.metadata?.brand,
          sustainability: result.metadata?.sustainability || 'regular',
          dateAdded: new Date().toISOString(),
          timesWorn: 0,
          season: result.metadata?.season || 'all'
        };

        // Store pending item and show category selector
        setPendingItem({
          imageUrl: result.processedImageUrl || result.imageUrl!,
          itemData,
          metadata: {
            backgroundRemoved: result.metadata?.backgroundRemoved,
            confidence: result.metadata?.confidence,
            suggestedCategory: result.category
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

      // Reset state
      setShowCategorySelector(false);
      setPendingItem(null);

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

  const checkAchievements = () => {
    achievements.forEach(achievement => {
      if (!achievement.unlocked && achievement.progress >= achievement.maxProgress) {
        setNewAchievement(achievement);
        setShowAchievementModal(true);
        setExperience(prev => prev + 50);
      }
    });
  };

  const generateOutfitOfTheDay = () => {
    if (clothingItems.length < 3) return;

    const randomItems = clothingItems
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const ootd: OutfitCombination = {
      id: Date.now().toString(),
      name: 'Today\'s Look',
      items: randomItems,
      occasion: 'casual',
      season: currentSeason,
      saves: 0,
      dateCreated: new Date().toISOString()
    };

    setOutfitOfTheDay(ootd);
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
      case 'organizing': return 'text-blue-600 bg-blue-100';
      case 'sustainability': return 'text-green-600 bg-green-100';
      case 'creativity': return 'text-purple-600 bg-purple-100';
      case 'social': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (currentView === 'doors') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6">
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
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-gray-800">Level {currentLevel}</span>
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
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-2xl"
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
    <div className="min-h-screen closet-interior relative overflow-hidden">
      {/* Header with stats */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Close Closet */}
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Close Closet</span>
          </button>

          {/* Center: Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView('monthly-planner')}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 transition-colors"
            >
              <Calendar className="w-6 h-6" />
              <span className="text-lg font-semibold">Monthly Planner</span>
            </button>

            <button
              onClick={() => setCurrentView('smart-calendar')}
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Sparkles className="w-6 h-6" />
              <span className="text-lg font-semibold">Smart Calendar</span>
            </button>
          </div>

          {/* Right: Stats Bar */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-blue-100 rounded-full px-3 py-1">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{clothingItems.length} Items</span>
            </div>

            <div className="flex items-center space-x-2 bg-green-100 rounded-full px-3 py-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">${closetValue}</span>
            </div>

            <div className="flex items-center space-x-2 bg-purple-100 rounded-full px-3 py-1">
              <Leaf className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">{sustainabilityScore}% Eco</span>
            </div>

            <div className="flex items-center space-x-2 bg-yellow-100 rounded-full px-3 py-1">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Level {currentLevel}</span>
            </div>

            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`p-2 rounded-full transition-colors ${
                isVoiceEnabled ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200 p-6 overflow-y-auto">
          {/* Upload Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Add to Closet</h3>
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
                onClick={() => cameraInputRef.current?.click()}
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
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium text-blue-800">AI Processing</span>
                </div>
                <p className="text-xs text-blue-600 mb-2">{uploadProgress.message}</p>

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

            {/* AI Features Info */}
            {!uploadProgress.isUploading && !uploadProgress.message && (
              <div className="mt-3 p-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-800">AI-Powered Processing</span>
                </div>
                <p className="text-xs text-purple-600">
                  ✨ Automatic background removal • 🤖 Smart categorization • 🎨 Color detection
                </p>
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
            <h3 className="font-semibold text-gray-800 mb-3">Categories</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    console.log(`📂 [CATEGORY-CLICK] Selected category:`, {
                      id: category.id,
                      name: category.name,
                      count: category.count,
                      previousCategory: selectedCategory
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

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={generateOutfitOfTheDay}
                className="w-full flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-yellow-600 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-yellow-700 transition-all"
              >
                <Shuffle className="w-4 h-4" />
                <span>Outfit of the Day</span>
              </button>

              <button
                onClick={() => setCurrentView('smart-calendar')}
                className="w-full flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-indigo-600 hover:to-blue-700 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Smart Calendar</span>
              </button>
            </div>
          </div>

          {/* Achievements Preview */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Recent Achievements</h3>
            <div className="space-y-2">
              {achievements.slice(0, 3).map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-lg border ${
                    achievement.unlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {achievement.icon}
                    <span className="text-sm font-medium">{achievement.title}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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

          {currentView === 'monthly-planner' && (
            <div className="text-center py-12">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Monthly Outfit Planner</h2>

                {/* Monthly Calendar Component will go here */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => {
                          if (currentMonth === 0) {
                            setCurrentMonth(11);
                            setCurrentYear(currentYear - 1);
                          } else {
                            setCurrentMonth(currentMonth - 1);
                          }
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                      </button>
                      <h3 className="text-xl font-semibold text-gray-700">
                        {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={() => {
                          if (currentMonth === 11) {
                            setCurrentMonth(0);
                            setCurrentYear(currentYear + 1);
                          } else {
                            setCurrentMonth(currentMonth + 1);
                          }
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-600" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center font-medium text-gray-600 py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {/* Calculate days in current month and first day of week */}
                      {(() => {
                        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                        const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
                        const calendarCells = [];

                        // Add empty cells for days before the 1st
                        for (let i = 0; i < firstDayOfWeek; i++) {
                          calendarCells.push(
                            <div key={`empty-${i}`} className="aspect-square border border-transparent p-2"></div>
                          );
                        }

                        // Add cells for each day of the month
                        for (let date = 1; date <= daysInMonth; date++) {
                          const dayPlan = dateOccasions[date];
                          const hasNotes = dayPlan?.notes && dayPlan.notes.length > 0;
                          const hasOutfit = dayPlan?.outfitPieces && dayPlan.outfitPieces.length > 0;

                          calendarCells.push(
                            <div
                              key={date}
                              onClick={() => handleDateClick(date)}
                              className={`aspect-square border rounded-lg p-2 cursor-pointer transition-colors relative ${
                                dayPlan
                                  ? 'border-gray-300 hover:bg-gray-50'
                                  : 'border-gray-200 hover:bg-purple-50'
                              }`}
                            >
                              <div className="text-sm font-medium text-gray-700">{date}</div>

                            {/* Occasion indicator */}
                            {dayPlan ? (
                              <div className="flex items-center space-x-1 mt-1">
                                <div className={`w-3 h-3 ${getOccasionColor(dayPlan.occasion)} rounded-full`}></div>
                                {hasNotes && (
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Has notes"></div>
                                )}
                                {hasOutfit && (
                                  <div className="w-2 h-2 bg-pink-500 rounded-full" title="Has outfit pieces"></div>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 mt-1">Click to plan</div>
                            )}

                              {/* Plan summary */}
                              {dayPlan && (
                                <div className="text-xs text-gray-500 mt-1 leading-tight">
                                  <div className="capitalize truncate">{dayPlan.occasion}</div>
                                  {hasOutfit && (
                                    <div className="text-pink-600">{dayPlan.outfitPieces.length} pieces</div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return calendarCells;
                      })()}
                    </div>
                  </div>

                  {/* Occasions Color Coding */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Occasion Color Guide</h4>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm font-medium text-blue-700">Travel & Vacation</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm font-medium text-purple-700">Formal Events</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm font-medium text-green-700">Social Occasions</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm font-medium text-orange-700">Daily Life</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex-shrink-0"></div>
                        <span className="text-sm font-medium text-red-700">Activities</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Planning Indicators</h5>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-gray-600">Has notes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                          <span className="text-gray-600">Has outfit pieces</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Click on calendar dates to plan complete outfits with occasion, notes, and clothing pieces
                    </p>
                  </div>

                  {/* Notes Section */}
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Outfit Planning Notes</h4>
                    <textarea
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none"
                      placeholder="Add notes about upcoming events, outfit ideas, shopping lists..."
                    ></textarea>
                  </div>
                </div>

                {/* Enhanced Date Planning Modal */}
                {showDateModal && selectedDate && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            Plan Outfit for October {selectedDate}
                          </h3>
                          <div className="flex items-center space-x-4 mt-2">
                            <button
                              onClick={() => setModalStep('occasion')}
                              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                                modalStep === 'occasion' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              1. Occasion
                            </button>
                            <button
                              onClick={() => setModalStep('notes')}
                              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                                modalStep === 'notes' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              2. Notes
                            </button>
                            <button
                              onClick={() => setModalStep('outfit')}
                              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                                modalStep === 'outfit' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              3. Outfit
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowDateModal(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Step 1: Occasion Selection */}
                      {modalStep === 'occasion' && (
                        <div>
                          <p className="text-gray-600 mb-6">Choose an occasion type for this day:</p>
                          <div className="space-y-3">
                            <button
                              onClick={() => handleOccasionSelect('travel')}
                              className="w-full flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                              <span className="text-blue-700 font-medium">Travel & Vacation</span>
                            </button>
                            <button
                              onClick={() => handleOccasionSelect('formal')}
                              className="w-full flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
                            >
                              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                              <span className="text-purple-700 font-medium">Formal Events</span>
                            </button>
                            <button
                              onClick={() => handleOccasionSelect('social')}
                              className="w-full flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                            >
                              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                              <span className="text-green-700 font-medium">Social Occasions</span>
                            </button>
                            <button
                              onClick={() => handleOccasionSelect('daily')}
                              className="w-full flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
                            >
                              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                              <span className="text-orange-700 font-medium">Daily Life</span>
                            </button>
                            <button
                              onClick={() => handleOccasionSelect('activities')}
                              className="w-full flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                            >
                              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                              <span className="text-red-700 font-medium">Activities</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Notes */}
                      {modalStep === 'notes' && (
                        <div>
                          <p className="text-gray-600 mb-4">Add notes and details for this day:</p>
                          <textarea
                            value={dateOccasions[selectedDate]?.notes || ''}
                            onChange={(e) => handleNotesChange(e.target.value)}
                            placeholder="Add details about this day (event specifics, weather, dress code, location, etc.)"
                            className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <div className="flex justify-between items-center mt-4">
                            <span className="text-xs text-gray-500">
                              {dateOccasions[selectedDate]?.notes?.length || 0} characters
                            </span>
                            <button
                              onClick={() => setModalStep('outfit')}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Next: Add Outfit
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Outfit Selection */}
                      {modalStep === 'outfit' && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-gray-600">Add outfit pieces for this day:</p>
                            <div className="bg-gray-100 rounded-lg p-1 flex">
                              <button
                                onClick={() => setOutfitMode('closet')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  outfitMode === 'closet'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                From Closet
                              </button>
                              <button
                                onClick={() => setOutfitMode('upload')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  outfitMode === 'upload'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                Upload New
                              </button>
                            </div>
                          </div>

                          {/* From Closet Mode */}
                          {outfitMode === 'closet' && (
                            <div className="mb-4">
                              {clothingItems.length > 0 ? (
                                <div>
                                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                    <div className="grid grid-cols-4 gap-2">
                                      {clothingItems.map((item) => {
                                        const isSelected = dateOccasions[selectedDate]?.outfitPieces?.some(piece => piece.id === item.id);
                                        return (
                                          <div key={item.id} className="relative">
                                            <button
                                              onClick={() => addFromCloset(item)}
                                              disabled={isSelected}
                                              className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                                isSelected
                                                  ? 'border-green-500 bg-green-50 cursor-not-allowed'
                                                  : 'border-gray-200 hover:border-purple-400 hover:shadow-md'
                                              }`}
                                            >
                                              <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className={`w-full h-full object-cover ${isSelected ? 'opacity-75' : ''}`}
                                              />
                                              {isSelected && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                                </div>
                                              )}
                                            </button>
                                            <p className="text-xs text-gray-600 mt-1 truncate">{item.name}</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2">Click items to add them to this day's outfit</p>
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                  <p>No items in your closet yet</p>
                                  <p className="text-xs mt-1">Upload some items first or switch to "Upload New"</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Upload New Mode */}
                          {outfitMode === 'upload' && (
                            <div className="mb-4">
                              <button
                                onClick={() => dateFileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 hover:bg-purple-50 transition-colors"
                              >
                                <div className="text-center">
                                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-gray-600">Click to upload outfit pieces</p>
                                  <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB</p>
                                </div>
                              </button>

                              {/* Hidden File Input */}
                              <input
                                ref={dateFileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  files.forEach(file => handleDateFileUpload(file));
                                }}
                                className="hidden"
                              />
                            </div>
                          )}

                          {/* Selected Outfit Pieces */}
                          {dateOccasions[selectedDate]?.outfitPieces && dateOccasions[selectedDate].outfitPieces.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-700 mb-3">
                                Selected Outfit Pieces ({dateOccasions[selectedDate].outfitPieces.length})
                              </h4>
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                {dateOccasions[selectedDate].outfitPieces.map((piece) => (
                                  <div key={piece.id} className="relative group">
                                    <img
                                      src={piece.imageUrl}
                                      alt={piece.name}
                                      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                                    />
                                    <button
                                      onClick={() => removeOutfitPiece(piece.id)}
                                      className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                    <p className="text-xs text-gray-600 mt-1 truncate">{piece.name}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex justify-between mt-6">
                            <button
                              onClick={() => setModalStep('notes')}
                              className="text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              ← Back
                            </button>
                            <button
                              onClick={() => setShowDateModal(false)}
                              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Save Plan
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Current Plan Summary */}
                      {dateOccasions[selectedDate] && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 ${getOccasionColor(dateOccasions[selectedDate].occasion)} rounded-full`}></div>
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {dateOccasions[selectedDate].occasion}
                              </span>
                              {dateOccasions[selectedDate].notes && (
                                <span className="text-xs text-gray-500">• Has notes</span>
                              )}
                              {dateOccasions[selectedDate].outfitPieces?.length > 0 && (
                                <span className="text-xs text-gray-500">• {dateOccasions[selectedDate].outfitPieces.length} pieces</span>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setDateOccasions(prev => {
                                  const updated = { ...prev };
                                  delete updated[selectedDate];
                                  return updated;
                                });
                                setShowDateModal(false);
                              }}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Clear all
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setCurrentView('interior')}
                  className="mt-8 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back to Closet
                </button>
              </div>
            </div>
          )}

          {currentView === 'interior' && (
            <>
              {/* Header Actions */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedCategory === 'all' ? 'All Items' :
                   selectedCategory === 'favorites' ? 'Favorites' :
                   categories.find(c => c.id === selectedCategory)?.name}
                </h2>

                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Trophy className="w-4 h-4" />
                    <span>Challenges</span>
                  </button>

                  <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Award className="w-4 h-4" />
                    <span>Achievements</span>
                  </button>
                </div>
              </div>

              {/* Outfit of the Day */}
              {outfitOfTheDay && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-purple-800">Today's Outfit Suggestion</h3>
                    <button className="text-purple-600 hover:text-purple-800">
                      <Shuffle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-4">
                    {outfitOfTheDay.items.map((item, index) => (
                      <div key={item.id} className="flex-shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg border-2 border-white shadow-sm"
                        />
                      </div>
                    ))}
                    <div className="flex-1">
                      <p className="text-sm text-purple-700 mb-2">Perfect for a {outfitOfTheDay.occasion} {currentSeason} day!</p>
                      <div className="flex space-x-2">
                        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors">
                          Try On
                        </button>
                        <button className="bg-white text-purple-600 border border-purple-300 px-4 py-2 rounded-lg text-sm hover:bg-purple-50 transition-colors">
                          Save Outfit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Clothing Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {(() => {
                  const filteredItems = clothingItems.filter(item => {
                    if (selectedCategory === 'all') return true;
                    if (selectedCategory === 'favorites') return item.favorite === true;
                    return item.category === selectedCategory;
                  });

                  console.log(`🖼️ [CLOSET-GRID] Rendering grid for "${selectedCategory}":`, {
                    totalItems: clothingItems.length,
                    filteredItems: filteredItems.length,
                    selectedCategory,
                    itemCategories: clothingItems.map(i => i.category).filter((v, i, a) => a.indexOf(v) === i)
                  });

                  return filteredItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="category-item bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
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

      {/* Category Selector Modal */}
      {showCategorySelector && pendingItem && (
        <CategorySelector
          imageUrl={pendingItem.imageUrl}
          onConfirm={handleCategoryConfirm}
          onCancel={handleCategoryCancel}
        />
      )}
    </div>
  );
};

export default ClosetExperience;