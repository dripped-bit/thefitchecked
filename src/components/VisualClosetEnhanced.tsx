import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getSmartImageUrl } from '../services/imageUtils';
import {
  Heart,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Trash2,
  Edit2,
  Share2,
  X,
  Camera,
  Upload,
  Grid
} from 'lucide-react';
import { Camera as CapacitorCamera } from '@capacitor/camera';
import { useCloset, ClothingCategory } from '../hooks/useCloset';
import backgroundRemovalService from '../services/backgroundRemovalService';
import smartClosetUploadService, { DetectedItem as SmartDetectedItem } from '../services/smartClosetUploadService';
import MultiItemConfirmationModal from './MultiItemConfirmationModal';
import { getSubcategoriesForCategory } from '../services/subcategoryMappingService';
import { InteractiveCropTool, CropBox } from './InteractiveCropTool';
import { PhotoTipsModal } from './PhotoTipsModal';
import { LoadingScreen } from './LoadingScreen';
import AllItemsView from './AllItemsView';
import CloudFavoritesButton from './CloudFavoritesButton';
import '../styles/VisualClosetAdapter.css';

interface CategoryConfig {
  id: ClothingCategory;
  title: string;
  icon: string;
  color: string;
  description: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'tops',
    title: 'Tops & Blouses',
    icon: '👕',
    color: 'rgba(255, 182, 193, 0.2)',
    description: 'T-shirts, shirts, blouses, tanks'
  },
  {
    id: 'bottoms',
    title: 'Bottoms',
    icon: '👖',
    color: 'rgba(173, 216, 230, 0.2)',
    description: 'Jeans, pants, shorts, skirts'
  },
  {
    id: 'dresses',
    title: 'Dresses',
    icon: '👗',
    color: 'rgba(221, 160, 221, 0.2)',
    description: 'Casual, formal, maxi, mini'
  },
  {
    id: 'activewear',
    title: 'Active Wear',
    icon: '🏃',
    color: 'rgba(135, 206, 250, 0.2)',
    description: 'Athletic wear, gym clothes, sportswear'
  },
  {
    id: 'outerwear',
    title: 'Outerwear',
    icon: '🧥',
    color: 'rgba(169, 169, 169, 0.2)',
    description: 'Jackets, Sweaters, Blazers'
  },
  {
    id: 'shoes',
    title: 'Shoes',
    icon: '👠',
    color: 'rgba(244, 164, 96, 0.2)',
    description: 'Sneakers, heels, boots, flats'
  },
  {
    id: 'accessories',
    title: 'Accessories',
    icon: '👜',
    color: 'rgba(216, 191, 216, 0.2)',
    description: 'Bags, jewelry, scarves, hats'
  }
];

interface VisualClosetEnhancedProps {
  onShowWoreThis?: () => void;
}

const VisualClosetEnhanced: React.FC<VisualClosetEnhancedProps> = ({ onShowWoreThis }) => {
  const {
    items,
    loading,
    error,
    deleteItem,
    toggleFavorite,
    searchItems,
    getCategoryStats,
    addItem,
    updateItem
  } = useCloset();

  const [searchText, setSearchText] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [itemDetails, setItemDetails] = useState({
    name: '',
    brand: '',
    price: '',
    description: '',
    subcategory: ''
  });
  const [selectedItemCategory, setSelectedItemCategory] = useState<ClothingCategory>('tops');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);

  // Processing/Loading states for background removal
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  const [processingAbortController, setProcessingAbortController] = useState<AbortController | null>(null);

  // Smart upload multi-item detection states
  const [detectedSmartItems, setDetectedSmartItems] = useState<SmartDetectedItem[]>([]);
  const [showSmartItemConfirmation, setShowSmartItemConfirmation] = useState(false);

  // Manual cropping states
  const [showCropTool, setShowCropTool] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // Photo tips modal state
  const [showPhotoTips, setShowPhotoTips] = useState(false);

  // All Items view state
  const [showAllItemsView, setShowAllItemsView] = useState(false);

  // Saving state to prevent duplicate saves
  const [isSaving, setIsSaving] = useState(false);

  // File input ref for bulk upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk upload queue management
  const [bulkUploadQueue, setBulkUploadQueue] = useState<{
    multiItemImages: Array<{ base64: string; index: number; scenario: any }>;
    singleItemImages: Array<{ base64: string; index: number; scenario: any }>;
    currentMultiItemIndex: number;
    allProcessedItems: SmartDetectedItem[];
  } | null>(null);

  // Listen for Add Item button click from header
  useEffect(() => {
    const handleOpenAddItem = () => {
      setShowUploadModal(true);
      setSelectedCategory('tops'); // Default to tops category
      setSelectedItemCategory('tops'); // Also set the item category state
    };

    window.addEventListener('openAddItemModal', handleOpenAddItem);
    return () => window.removeEventListener('openAddItemModal', handleOpenAddItem);
  }, []);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    let result = items;
    
    // Apply search filter
    if (searchText) {
      result = searchItems(searchText);
    }
    
    // Apply favorites filter
    if (showFavoritesOnly) {
      result = result.filter(item => item.favorite);
    }
    
    return result;
  }, [searchText, items, searchItems, showFavoritesOnly]);

  // Category data with filtered items
  const categoryData = useMemo(() => {
    return CATEGORIES.map(category => ({
      ...category,
      items: filteredItems.filter(item => item.category === category.id)
    }));
  }, [filteredItems]);
  
  // Get total favorites count
  const favoritesCount = useMemo(() => {
    return items.filter(item => item.favorite).length;
  }, [items]);

  const stats = useMemo(() => getCategoryStats(), [getCategoryStats]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleAddItem = (category?: ClothingCategory) => {
    const hasSeenPhotoTips = localStorage.getItem('hasSeenPhotoTips');
    
    setSelectedCategory(category || 'tops');
    
    if (!hasSeenPhotoTips) {
      // First time - show tips
      setShowPhotoTips(true);
    } else {
      // Normal flow
      setShowUploadModal(true);
    }
  };

  // Handle photo tips modal actions
  const handlePhotoTipsClose = () => {
    setShowPhotoTips(false);
    setShowUploadModal(true);
  };

  const handlePhotoTipsDontShowAgain = () => {
    localStorage.setItem('hasSeenPhotoTips', 'true');
    setShowPhotoTips(false);
    setShowUploadModal(true);
  };

  const handleCameraCapture = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'base64', // Changed from 'uri' to 'base64' for API compatibility
        source: 'camera'
      });

      if (image.base64String && selectedCategory) {
        // Convert to data URL format for background removal API
        const base64Image = `data:image/jpeg;base64,${image.base64String}`;
        console.log('📸 [CAMERA] Captured image as base64, length:', base64Image.length);

        // Close upload modal, show processing modal
        setShowUploadModal(false);
        setShowProcessingModal(true);
        setProcessingMessage('Removing background...');

        // Create abort controller for cancellation
        const abortController = new AbortController();
        setProcessingAbortController(abortController);

        try {
          // Process background removal
          console.log('🎨 [CAMERA] Starting background removal...');
          const bgRemovalResult = await backgroundRemovalService.removeBackground(base64Image, abortController.signal);

          // Check if aborted
          if (abortController.signal.aborted) {
            console.log('⚠️ [CAMERA] Processing was cancelled');
            setShowProcessingModal(false);
            return;
          }

          // Use processed image or fallback to original
          const processedImageUrl = bgRemovalResult.success && bgRemovalResult.imageUrl
            ? bgRemovalResult.imageUrl
            : base64Image;

          console.log('✅ [CAMERA] Background removal complete, success:', bgRemovalResult.success);

          // Store processed image and show details modal
          setCapturedImage(processedImageUrl);
          setShowProcessingModal(false);
          setShowDetailsModal(true);

          // Pre-fill name
          setItemDetails({
            name: `New ${selectedCategory} item`,
            brand: '',
            price: '',
            description: ''
          });

        } catch (processingError) {
          console.error('❌ [CAMERA] Background removal error:', processingError);

          // Check if aborted
          if (abortController.signal.aborted) {
            setShowProcessingModal(false);
            return;
          }

          // Auto-fallback: use original image
          console.log('⚠️ [CAMERA] Using original image as fallback');
          setCapturedImage(base64Image);
          setShowProcessingModal(false);
          setShowDetailsModal(true);

          // Pre-fill name
          setItemDetails({
            name: `New ${selectedCategory} item`,
            brand: '',
            price: '',
            description: ''
          });
        }
      }
    } catch (error) {
      console.error('❌ [CAMERA] Error:', error);
      setShowProcessingModal(false);
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle bulk file selection from HTML input
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5); // Limit to 5 images
    
    if (files.length === 0) return;

    console.log(`🖼️ [GALLERY] Selected ${files.length} image(s)`);

    // SPECIAL CASE: Single image - use standard flow with crop tool support
    if (files.length === 1) {
      const file = files[0];
      const base64Image = await fileToBase64(file);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Use single-image upload flow (has crop tool support)
      await handleSingleImageUpload(base64Image);
      return;
    }

    // BULK UPLOAD (2-5 images): Smart mixed-scenario processing
    setShowUploadModal(false);
    setShowProcessingModal(true);
    setProcessingMessage('Analyzing images...');

    try {
      // Phase 1: Convert all to base64 and analyze scenarios
      const imageAnalysis = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64Image = await fileToBase64(file);
        
        setProcessingMessage(`Analyzing image ${i + 1} of ${files.length}...`);
        
        // Detect scenario
        const scenario = await smartClosetUploadService.detectScenario(base64Image);
        
        imageAnalysis.push({
          base64: base64Image,
          index: i + 1,
          scenario
        });
      }

      // Categorize images
      const multiItemImages = imageAnalysis.filter(img => img.scenario.itemCount > 1);
      const singleItemImages = imageAnalysis.filter(img => img.scenario.itemCount === 1);

      console.log(`📊 [BULK] Analysis complete:`, {
        total: files.length,
        multiItem: multiItemImages.length,
        singleItem: singleItemImages.length
      });

      // Initialize bulk upload queue
      setBulkUploadQueue({
        multiItemImages,
        singleItemImages,
        currentMultiItemIndex: 0,
        allProcessedItems: []
      });

      // Phase 2: Start processing
      if (multiItemImages.length > 0) {
        // Show crop tool for first multi-item image
        console.log(`✂️ [BULK] Starting cropping for image 1 of ${multiItemImages.length}`);
        setProcessingMessage(`Image ${multiItemImages[0].index}: Multiple items detected - please crop`);
        setShowProcessingModal(false);
        setImageToCrop(multiItemImages[0].base64);
        setShowCropTool(true);
      } else {
        // No multi-item images, process all automatically
        await processSingleItemQueue(singleItemImages, []);
      }

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('❌ [BULK] Error during analysis:', error);
      setShowProcessingModal(false);
      alert('Failed to analyze images. Please try again.');
    }
  };

  // Process remaining single-item images after cropping is complete
  const processSingleItemQueue = async (
    singleItemImages: Array<{ base64: string; index: number; scenario: any }>,
    multiItemProcessedItems: SmartDetectedItem[]
  ) => {
    setShowProcessingModal(true);
    setProcessingMessage('Processing remaining images...');

    const allItems = [...multiItemProcessedItems];

    // Process single-item images
    for (let i = 0; i < singleItemImages.length; i++) {
      const img = singleItemImages[i];
      
      setProcessingMessage(`Processing image ${img.index} (${i + 1}/${singleItemImages.length})...`);

      try {
        const uploadResult = await smartClosetUploadService.processUpload(
          img.base64,
          (message) => {
            setProcessingMessage(`Image ${img.index}: ${message}`);
          }
        );

        if (uploadResult.success && uploadResult.items.length > 0) {
          console.log(`✅ [BULK] Image ${img.index}: Added ${uploadResult.items.length} item(s)`);
          allItems.push(...uploadResult.items);
        }
      } catch (error) {
        console.error(`❌ [BULK] Error processing image ${img.index}:`, error);
      }
    }

    // Show all results
    if (allItems.length > 0) {
      console.log(`✅ [BULK-COMPLETE] Total items: ${allItems.length}`);
      setDetectedSmartItems(allItems);
      setShowSmartItemConfirmation(true);
      setShowProcessingModal(false);
    } else {
      setShowProcessingModal(false);
      alert('No items detected. Please try again.');
    }

    // Clear queue
    setBulkUploadQueue(null);
  };

  // Handle single image upload with crop tool support
  const handleSingleImageUpload = async (base64Image: string) => {
    setShowUploadModal(false);
    setShowProcessingModal(true);
    setProcessingMessage('Analyzing photo...');

    try {
      // Detect scenario
      const scenario = await smartClosetUploadService.detectScenario(base64Image);
      console.log('🔍 [GALLERY] Scenario detected:', scenario);

      // Show cropping tool for multiple items
      if (scenario.itemCount > 1) {
        console.log('✂️ [GALLERY] Multiple items detected, showing crop tool');
        setShowProcessingModal(false);
        setImageToCrop(base64Image);
        setShowCropTool(true);
        return;
      }

      // Single item - process automatically
      console.log('🎨 [GALLERY] Single item detected, processing automatically');
      
      const result = await smartClosetUploadService.processUpload(
        base64Image,
        (message) => setProcessingMessage(message)
      );

      if (result.success) {
        if (result.itemsAdded > 1) {
          setDetectedSmartItems(result.items);
          setShowSmartItemConfirmation(true);
          setShowProcessingModal(false);
        } else {
          const item = result.items[0];
          setCapturedImage(item.imageUrl);
          setShowProcessingModal(false);
          setShowDetailsModal(true);
          setItemDetails({
            name: item.name || `New ${selectedCategory} item`,
            brand: '',
            price: '',
            description: ''
          });
        }
      } else {
        // Fallback to original
        setCapturedImage(base64Image);
        setShowProcessingModal(false);
        setShowDetailsModal(true);
        setItemDetails({
          name: `New ${selectedCategory} item`,
          brand: '',
          price: '',
          description: ''
        });
      }
    } catch (error) {
      console.error('❌ [GALLERY] Error:', error);
      setCapturedImage(base64Image);
      setShowProcessingModal(false);
      setShowDetailsModal(true);
      setItemDetails({
        name: `New ${selectedCategory} item`,
        brand: '',
        price: '',
        description: ''
      });
    }
  };

  const handleGalleryUpload = async () => {
    // Trigger hidden file input for bulk selection
    fileInputRef.current?.click();
    
    /* OLD SINGLE IMAGE CODE - Keeping for camera fallback if needed
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'base64',
        source: 'photos'
      });

      if (image.base64String && selectedCategory) {
        // Convert to data URL format for background removal API
        const base64Image = `data:image/jpeg;base64,${image.base64String}`;
        console.log('🖼️ [GALLERY] Selected image as base64, length:', base64Image.length);

        // Close upload modal and show processing modal
        setShowUploadModal(false);
        setShowProcessingModal(true);
        setProcessingMessage('Analyzing photo...');

        try {
          // Step 1: Detect scenario
          const scenario = await smartClosetUploadService.detectScenario(base64Image);
          console.log('🔍 [GALLERY] Scenario detected:', scenario);

          // Step 2: Show cropping tool ONLY for multiple items
          if (scenario.itemCount > 1) {
            console.log('✂️ [GALLERY] Multiple items detected, showing crop tool');
            setShowProcessingModal(false);
            setImageToCrop(base64Image);
            setShowCropTool(true);
            return;
          }

          // Step 3: Single item (flat-lay OR person-wearing) - process automatically
          console.log('🎨 [GALLERY] Single item detected, processing automatically');
          
          // Create abort controller for cancellation support
          const abortController = new AbortController();
          setProcessingAbortController(abortController);

          // Use smart upload pipeline
          const result = await smartClosetUploadService.processUpload(
            base64Image,
            (message) => {
              setProcessingMessage(message);
            }
          );

          // Check if operation was aborted
          if (abortController.signal.aborted) {
            console.log('⚠️ [GALLERY] Smart upload aborted by user');
            setShowProcessingModal(false);
            return;
          }

          if (result.success) {
            console.log(`✅ [SMART-UPLOAD] Success! ${result.itemsAdded} item(s) detected`);

            if (result.itemsAdded > 1) {
              // Multiple items detected - show confirmation modal
              console.log(`📦 [SMART-UPLOAD] Multiple items detected, showing confirmation`);
              setDetectedSmartItems(result.items);
              setShowSmartItemConfirmation(true);
              setShowProcessingModal(false);
              return;
            }

            // Single item - use processed image and show details modal
            const item = result.items[0];
            console.log('🖼️ [GALLERY] Setting captured image to:', item.imageUrl?.substring(0, 80));
            setCapturedImage(item.imageUrl);
            setShowProcessingModal(false);
            setShowDetailsModal(true);

            // Pre-fill name with AI-detected name
            setItemDetails({
              name: item.name || `New ${selectedCategory} item`,
              brand: '',
              price: '',
              description: ''
            });

          } else {
            // Smart upload failed - fallback to original image
            console.error('❌ [SMART-UPLOAD] Failed:', result.error);
            console.warn('⚠️ [GALLERY] Using original image (smart upload failed)');
            
            setCapturedImage(base64Image);
            setShowProcessingModal(false);
            setShowDetailsModal(true);

            // Pre-fill name
            setItemDetails({
              name: `New ${selectedCategory} item`,
              brand: '',
              price: '',
              description: ''
            });
          }

        } catch (processingError) {
          console.error('❌ [GALLERY] Smart upload error, using original image:', processingError);
          // Auto-fallback: use original image if processing fails
          setCapturedImage(base64Image);
          setShowProcessingModal(false);
          setShowDetailsModal(true);

          // Pre-fill name
          setItemDetails({
            name: `New ${selectedCategory} item`,
            brand: '',
            price: '',
            description: ''
          });
        }
      }
    } catch (error) {
      console.error('❌ [GALLERY] Error:', error);
      setShowProcessingModal(false);
    }
    */ // End of commented single image code
  };

  const handleSaveItem = async () => {
    // Prevent multiple concurrent saves
    if (isSaving || !capturedImage || !selectedCategory) return;

    try {
      setIsSaving(true);
      console.log('💾 [CLOSET] Saving item to category:', selectedCategory);
      console.log('📸 [CLOSET] Image already processed (background removed earlier)');

      // Save item with already-processed image (background removed before modal opened)
      console.log('💾 [CLOSET] Calling addItem with category:', selectedCategory);
      const newItem = await addItem({
        name: itemDetails.name || `New ${selectedCategory} item`,
        category: selectedCategory,
        subcategory: itemDetails.subcategory || undefined,
        image_url: capturedImage, // Already processed image
        brand: itemDetails.brand || undefined,
        price: itemDetails.price ? parseFloat(itemDetails.price) : undefined,
        notes: itemDetails.description || undefined,
        favorite: false
      });

      if (newItem) {
        console.log('✅ [CLOSET] Item saved with category:', newItem.category);
        console.log('✅ [CLOSET] Item added to closet:', newItem);
        // Reset and close
        setCapturedImage(null);
        setItemDetails({ name: '', brand: '', price: '', description: '', subcategory: '' });
        setShowDetailsModal(false);
      } else {
        console.error('❌ [CLOSET] Failed to save item');
        alert('Failed to save item. Please try again.');
      }
    } catch (error) {
      console.error('❌ [CLOSET] Error saving item:', error);
      alert('An error occurred while saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle manual cropping completion
  const handleCroppingComplete = async (crops: CropBox[]) => {
    if (!imageToCrop || crops.length === 0) return;

    console.log(`✂️ [CROP-COMPLETE] User defined ${crops.length} crop region(s)`);
    
    setShowCropTool(false);
    setShowProcessingModal(true);
    setProcessingMessage(`Processing ${crops.length} item(s)...`);

    try {
      // Process crops with manual cropping pipeline
      const result = await smartClosetUploadService.uploadWithManualCropping(
        imageToCrop,
        crops,
        (message, current, total) => {
          if (current && total) {
            setProcessingMessage(`${message} (${current}/${total})`);
          } else {
            setProcessingMessage(message);
          }
        }
      );

      if (!result.success || result.items.length === 0) {
        throw new Error('Failed to process cropped items');
      }

      console.log(`✅ [CROP-COMPLETE] Successfully processed ${result.items.length} items`);

      // CHECK: Are we in bulk upload queue mode?
      if (bulkUploadQueue) {
        console.log('🔄 [BULK-QUEUE] Continuing bulk upload queue');
        
        // Add processed items to queue
        const updatedItems = [...bulkUploadQueue.allProcessedItems, ...result.items];
        const nextIndex = bulkUploadQueue.currentMultiItemIndex + 1;

        // Check if there are more multi-item images to crop
        if (nextIndex < bulkUploadQueue.multiItemImages.length) {
          const nextImage = bulkUploadQueue.multiItemImages[nextIndex];
          
          console.log(`✂️ [BULK-QUEUE] Moving to image ${nextIndex + 1} of ${bulkUploadQueue.multiItemImages.length}`);
          
          // Update queue
          setBulkUploadQueue({
            ...bulkUploadQueue,
            currentMultiItemIndex: nextIndex,
            allProcessedItems: updatedItems
          });

          // Show crop tool for next image
          setProcessingMessage(`Image ${nextImage.index}: Multiple items detected - please crop`);
          setShowProcessingModal(false);
          setImageToCrop(nextImage.base64);
          setShowCropTool(true);
          return;
        } else {
          // All multi-item images cropped, process single-item images
          console.log('✅ [BULK-QUEUE] All multi-item images cropped');
          await processSingleItemQueue(bulkUploadQueue.singleItemImages, updatedItems);
          return;
        }
      }

      // NOT in bulk queue - standard single image cropping
      if (result.items.length > 1) {
        setDetectedSmartItems(result.items);
        setShowSmartItemConfirmation(true);
        setShowProcessingModal(false);
      } else {
        // Single item - show details modal
        const item = result.items[0];
        setCapturedImage(item.imageUrl);
        setShowProcessingModal(false);
        
        // Set category from AI detection or fallback to 'tops'
        const detectedCategory = item.category || 'tops';
        setSelectedItemCategory(detectedCategory);
        setSelectedCategory(detectedCategory);
        
        setShowDetailsModal(true);
        setItemDetails({
          name: item.name || 'New Item',
          brand: '',
          price: '',
          description: ''
        });
      }
    } catch (error) {
      console.error('❌ [CROP-COMPLETE] Error processing crops:', error);
      setShowProcessingModal(false);
      alert('Failed to process items. Please try again.');
    } finally {
      setImageToCrop(null);
    }
  };

  // Handle cropping cancellation
  const handleCroppingCancel = () => {
    console.log('❌ [CROP-CANCEL] User cancelled cropping');
    setShowCropTool(false);
    setImageToCrop(null);

    // CHECK: Are we in bulk upload queue mode?
    if (bulkUploadQueue) {
      // User cancelled during bulk upload - skip this image and continue
      const nextIndex = bulkUploadQueue.currentMultiItemIndex + 1;

      if (nextIndex < bulkUploadQueue.multiItemImages.length) {
        // Move to next multi-item image
        const nextImage = bulkUploadQueue.multiItemImages[nextIndex];
        
        console.log(`⏭️ [BULK-QUEUE] Skipped image, moving to next: ${nextIndex + 1}/${bulkUploadQueue.multiItemImages.length}`);
        
        setBulkUploadQueue({
          ...bulkUploadQueue,
          currentMultiItemIndex: nextIndex
        });

        setShowProcessingModal(true);
        setProcessingMessage(`Image ${nextImage.index}: Multiple items detected - please crop`);
        setTimeout(() => {
          setShowProcessingModal(false);
          setImageToCrop(nextImage.base64);
          setShowCropTool(true);
        }, 100);
      } else {
        // No more multi-item images, process single-item queue
        console.log('⏭️ [BULK-QUEUE] Skipped last multi-item, processing singles');
        processSingleItemQueue(bulkUploadQueue.singleItemImages, bulkUploadQueue.allProcessedItems);
      }
    } else {
      // Standard single-image cancel
      setShowUploadModal(false);
    }
  };

  const handleItemClick = (itemId: string) => {
    setSelectedItem(itemId);
    setShowActionSheet(true);
  };

  const handleToggleFavorite = async (itemId: string) => {
    await toggleFavorite(itemId);
  };

  const handleDeleteItem = async (itemId: string) => {
    const success = await deleteItem(itemId);
    if (success) {
      setShowDeleteToast(true);
      setShowActionSheet(false);
    }
  };

  const handleEditItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setEditingItem(item);
      setItemDetails({
        name: item.name,
        brand: item.brand || '',
        price: item.price || '',
        description: item.description || '',
        subcategory: item.subcategory || ''
      });
      setSelectedItemCategory(item.category);
      setSelectedCategory(item.category);
      setShowEditModal(true);
    }
    setShowActionSheet(false);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const success = await updateItem(editingItem.id, {
        name: itemDetails.name || editingItem.name,
        category: selectedCategory || editingItem.category,
        subcategory: itemDetails.subcategory || undefined,
        brand: itemDetails.brand || undefined,
        price: itemDetails.price ? parseFloat(itemDetails.price) : undefined,
        notes: itemDetails.description || undefined
      });

      if (success) {
        // Reset and close
        setEditingItem(null);
        setItemDetails({ name: '', brand: '', price: '', description: '', subcategory: '' });
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const selectedItemData = items.find(item => item.id === selectedItem);

  // Loading state
  if (loading) {
    return (
      <div className="visual-closet-adapter">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading your closet...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="visual-closet-adapter">
        <div className="error-container">
          <p className="error-text">Failed to load closet: {error.message}</p>
          <button className="btn-outline" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If All Items view is shown, render it instead
  if (showAllItemsView) {
    return (
      <AllItemsView 
        onBack={() => setShowAllItemsView(false)}
        onEdit={(itemId) => {
          const item = items.find(i => i.id === itemId);
          if (item) {
            setShowAllItemsView(false);
            setEditingItem(item);
            setItemDetails({
              name: item.name,
              brand: item.brand || '',
              price: item.price?.toString() || '',
              description: item.notes || '',
              subcategory: item.subcategory || ''
            });
            setSelectedItemCategory(item.category);
            setSelectedCategory(item.category);
            setShowEditModal(true);
          }
        }}
      />
    );
  }

  return (
    <div className="visual-closet-adapter">
      {/* Favorites Mode Banner */}
      {showFavoritesOnly && (
        <div style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #FF69B4 0%, #FFB6D9 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(255, 105, 180, 0.3)',
          margin: '0 16px 16px 16px',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={20} fill="white" />
            <span style={{ fontWeight: '600', fontSize: '16px' }}>
              Showing Favorites Only ({favoritesCount} items)
            </span>
          </div>
          <button
            onClick={() => setShowFavoritesOnly(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.3)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Show All
          </button>
        </div>
      )}
      
      {/* All Items Button */}
      <div style={{
        padding: '16px',
        paddingBottom: '8px'
      }}>
        <button
          onClick={() => setShowAllItemsView(true)}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #FFB6D9 0%, #FFC9E3 100%)',
            border: 'none',
            borderRadius: '16px',
            fontSize: '18px',
            fontWeight: '600',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(255, 105, 180, 0.2)',
            transition: 'all 0.2s ease'
          }}
        >
          <Grid size={24} />
          <span>All Items</span>
        </button>
      </div>

      {/* Closet Grid */}
      <div className="closet-grid">
        {categoryData.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const categoryStats = stats[category.id];

          return (
            <div key={category.id} className="closet-section">
              <div
                className="section-header glass-card"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="section-header-content">
                  <div className="section-info">
                    <h3 className="section-title">{category.title}</h3>
                    <p className="section-description">{category.description}</p>
                  </div>
                </div>
                <div className="section-actions">
                  <button
                    className="add-item-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddItem(category.id);
                    }}
                  >
                    <Plus size={20} />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {category.items.length}
                      {categoryStats.favoriteCount > 0 && (
                        <span className="text-xs ml-1">· {categoryStats.favoriteCount} ❤️</span>
                      )}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="expand-icon" size={20} />
                    ) : (
                      <ChevronDown className="expand-icon" size={20} />
                    )}
                  </div>
                </div>
              </div>

              {/* Items Grid */}
              <div
                className={`items-grid ${isExpanded ? 'expanded' : 'collapsed'}`}
              >
                {category.items.length === 0 ? (
                  <div className="empty-category">
                    <div className="empty-icon">📦</div>
                    <p className="empty-text">No {category.title.toLowerCase()} yet</p>
                    <p className="empty-subtext">Add your first item to get started</p>
                    <button
                      className="btn-outline"
                      onClick={() => handleAddItem(category.id)}
                    >
                      Add {category.title}
                    </button>
                  </div>
                ) : (
                  <>
                    {category.items
                      .slice(0, isExpanded ? undefined : 4)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="item-card glass-card"
                          onClick={() => handleItemClick(item.id)}
                        >
                          <div className="item-image-container">
                            <img
                              src={getSmartImageUrl('wardrobe', item.thumbnail_url || item.image_url, 'thumbnail')}
                              alt={item.name}
                              className="item-image"
                            />
                            {item.favorite && (
                              <div className="favorite-badge">
                                <Heart size={16} fill="currentColor" color="#ff4444" />
                              </div>
                            )}
                          </div>
                          <div className="item-info">
                            <p className="item-name">{item.name}</p>
                            {item.brand && (
                              <span className="item-brand">{item.brand}</span>
                            )}
                            {item.times_worn > 0 && (
                              <span className="item-stats">
                                Worn {item.times_worn}x
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                    {category.items.length > 4 && !isExpanded && (
                      <div
                        className="show-more-card glass-card"
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div className="show-more-content">
                          <Plus size={32} />
                          <span>+{category.items.length - 4} more</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

      </div>

      {/* Cloud-Shaped Favorites Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 0',
        margin: '1rem 0'
      }}>
        <CloudFavoritesButton
          isSelected={showFavoritesOnly}
          onClick={() => {
            setShowFavoritesOnly(!showFavoritesOnly);
            // Scroll to top when favorites is toggled
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          itemCount={favoritesCount}
        />
      </div>

      {/* Wore This Today Button */}
      {onShowWoreThis && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '1rem 0 2rem',
          margin: '0 1rem'
        }}>
          <button
            onClick={onShowWoreThis}
            style={{
              background: 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)',
              padding: '16px 32px',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(255, 105, 180, 0.3)',
              transition: 'all 0.2s ease',
              border: 'none',
              width: '100%',
              maxWidth: '300px'
            }}
          >
            <Camera size={24} />
            <span>Wore This</span>
          </button>
        </div>
      )}

      {/* Action Sheet Modal */}
      {showActionSheet && selectedItemData && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setShowActionSheet(false)}
          />
          <div className="item-actions-modal glass-card">
            <h3>{selectedItemData.name}</h3>
            <div className="action-buttons">
              <button
                className="action-btn"
                onClick={async () => {
                  await handleToggleFavorite(selectedItemData.id);
                  setShowActionSheet(false);
                }}
              >
                <Heart
                  size={20}
                  fill={selectedItemData.favorite ? 'currentColor' : 'none'}
                />
                {selectedItemData.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
              <button
                className="action-btn"
                onClick={() => {
                  handleEditItem(selectedItemData.id);
                  setShowActionSheet(false);
                }}
              >
                <Edit2 size={20} />
                Edit
              </button>
              <button
                className="action-btn"
                onClick={() => {
                  console.log('Share item');
                  setShowActionSheet(false);
                }}
              >
                <Share2 size={20} />
                Share
              </button>
              <button
                className="action-btn danger"
                onClick={() => handleDeleteItem(selectedItemData.id)}
              >
                <Trash2 size={20} />
                Delete
              </button>
              <button
                className="action-btn cancel"
                onClick={() => setShowActionSheet(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Toast */}
      {showDeleteToast && (
        <div className="toast-container">
          <div className="toast glass-card">
            <span>Item deleted successfully</span>
            <button
              className="toast-close"
              onClick={() => setShowDeleteToast(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={() => setShowUploadModal(false)}
        >
          {/* Glass Morphism Floating Back Button - Top Left */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowUploadModal(false);
            }}
            style={{
              position: 'fixed',
              top: '16px',
              left: '16px',
              zIndex: 10001,
              padding: '12px',
              borderRadius: '50%',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ChevronLeft 
              size={24} 
              color="white" 
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}
            />
          </button>

          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'white',
              borderRadius: '20px 20px 0 0',
              padding: '24px',
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom))'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
              Add to {selectedCategory}
            </h3>
            <p style={{ fontSize: '14px', color: '#86868b', marginBottom: '24px', textAlign: 'center' }}>
              Choose how you'd like to add your item
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleCameraCapture}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(255, 192, 203, 0.1)',
                  border: '1px solid rgba(255, 192, 203, 0.3)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Camera size={24} color="#FF69B4" />
                <span>Take Photo</span>
              </button>
              
              <button
                onClick={handleGalleryUpload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(255, 192, 203, 0.1)',
                  border: '1px solid rgba(255, 192, 203, 0.3)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Upload size={24} color="#FF69B4" />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span>Choose from Gallery</span>
                  <span style={{ fontSize: '12px', color: '#86868b', fontWeight: '400' }}>Select up to 5 images</span>
                </div>
              </button>
              
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  padding: '16px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#86868b',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {showDetailsModal && capturedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => {
            setShowDetailsModal(false);
            setCapturedImage(null);
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '24px',
              paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Back Button */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '20px',
              position: 'relative'
            }}>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setCapturedImage(null);
                  setItemDetails({ name: '', brand: '', price: '', description: '', subcategory: '' });
                }}
                style={{
                  position: 'absolute',
                  left: 0,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#666',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <ChevronLeft size={20} />
                <span>Back</span>
              </button>
              <h3 style={{ 
                fontSize: '22px', 
                fontWeight: '600', 
                textAlign: 'center',
                flex: 1
              }}>
                Add Item Details
              </h3>
            </div>

            {/* Image Preview */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <img 
                src={capturedImage} 
                alt="Preview" 
                style={{ 
                  maxWidth: '200px', 
                  maxHeight: '200px', 
                  borderRadius: '12px',
                  objectFit: 'cover'
                }} 
              />
            </div>
            
            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '8px' }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  value={itemDetails.name}
                  onChange={(e) => setItemDetails({ ...itemDetails, name: e.target.value })}
                  placeholder="e.g., Blue Denim Jacket"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              {/* Clothing Type Selector */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '8px' }}>
                  Clothing Type *
                </label>
                <select
                  value={selectedItemCategory}
                  onChange={(e) => {
                    setSelectedItemCategory(e.target.value as ClothingCategory);
                    setSelectedCategory(e.target.value as ClothingCategory);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="tops">👕 Tops & Blouses</option>
                  <option value="bottoms">👖 Bottoms</option>
                  <option value="dresses">👗 Dresses</option>
                  <option value="activewear">🏃 Active Wear</option>
                  <option value="outerwear">🧥 Outerwear</option>
                  <option value="shoes">👟 Shoes</option>
                  <option value="accessories">👜 Accessories</option>
                </select>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Select where this item should be categorized
                </p>
              </div>

              {/* Subcategory Selector */}
              {selectedItemCategory && (
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '8px' }}>
                    Subcategory (Optional)
                  </label>
                  <select
                    value={itemDetails.subcategory || ''}
                    onChange={(e) => setItemDetails({ ...itemDetails, subcategory: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Select subcategory (optional) --</option>
                    {getSubcategoriesForCategory(selectedItemCategory).map(subcat => (
                      <option key={subcat} value={subcat}>{subcat}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Optional: Choose a more specific category
                  </p>
                </div>
              )}

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '8px' }}>
                  Brand
                </label>
                <input
                  type="text"
                  value={itemDetails.brand}
                  onChange={(e) => setItemDetails({ ...itemDetails, brand: e.target.value })}
                  placeholder="e.g., Levi's, Zara, H&M"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '8px' }}>
                  Price
                </label>
                <input
                  type="number"
                  value={itemDetails.price}
                  onChange={(e) => setItemDetails({ ...itemDetails, price: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '8px' }}>
                  Description / Notes
                </label>
                <textarea
                  value={itemDetails.description}
                  onChange={(e) => setItemDetails({ ...itemDetails, description: e.target.value })}
                  placeholder="Add any notes about this item..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setCapturedImage(null);
                  setItemDetails({ name: '', brand: '', price: '', description: '', subcategory: '' });
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                disabled={!itemDetails.name.trim() || isSaving}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: itemDetails.name.trim() && !isSaving ? 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)' : '#ccc',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: itemDetails.name.trim() && !isSaving ? 'pointer' : 'not-allowed',
                  color: 'white',
                  opacity: isSaving ? 0.6 : 1
                }}
              >
                {isSaving ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing/Loading Modal */}
      {showProcessingModal && (
        <LoadingScreen
          isOpen={showProcessingModal}
          message={processingMessage}
          onCancel={() => {
            // Abort the background removal operation
            if (processingAbortController) {
              processingAbortController.abort();
              setProcessingAbortController(null);
            }
            // Close the processing modal
            setShowProcessingModal(false);
            console.log('⚠️ [CLOSET] Background removal cancelled by user');
          }}
        />
      )}

      {/* Edit Item Modal */}
      {showEditModal && editingItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={() => {
            setShowEditModal(false);
            setEditingItem(null);
            setItemDetails({ name: '', brand: '', price: '', description: '', subcategory: '' });
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '24px',
              paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>
              Edit Item Details
            </h3>

            {/* Image Preview */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <img
                src={getSmartImageUrl('wardrobe', editingItem.image_url, 'thumbnail')}
                alt="Preview"
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  borderRadius: '12px',
                  objectFit: 'cover'
                }}
              />
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '8px' }}>
                  Item Name *
                </label>
                <input
                  type="text"
                  value={itemDetails.name}
                  onChange={(e) => setItemDetails({ ...itemDetails, name: e.target.value })}
                  placeholder="e.g., Blue Denim Jacket"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              {/* Clothing Type Selector */}
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '8px' }}>
                  Clothing Type *
                </label>
                <select
                  value={selectedItemCategory}
                  onChange={(e) => {
                    setSelectedItemCategory(e.target.value as ClothingCategory);
                    setSelectedCategory(e.target.value as ClothingCategory);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="tops">👕 Tops & Blouses</option>
                  <option value="bottoms">👖 Bottoms</option>
                  <option value="dresses">👗 Dresses</option>
                  <option value="activewear">🏃 Active Wear</option>
                  <option value="outerwear">🧥 Outerwear</option>
                  <option value="shoes">👟 Shoes</option>
                  <option value="accessories">👜 Accessories</option>
                </select>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Select where this item should be categorized
                </p>
              </div>

              {/* Subcategory Selector */}
              {selectedItemCategory && (
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '8px' }}>
                    Subcategory (Optional)
                  </label>
                  <select
                    value={itemDetails.subcategory || ''}
                    onChange={(e) => setItemDetails({ ...itemDetails, subcategory: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '16px',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Select subcategory (optional) --</option>
                    {getSubcategoriesForCategory(selectedItemCategory).map(subcat => (
                      <option key={subcat} value={subcat}>{subcat}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Optional: Choose a more specific category
                  </p>
                </div>
              )}

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '8px' }}>
                  Brand
                </label>
                <input
                  type="text"
                  value={itemDetails.brand}
                  onChange={(e) => setItemDetails({ ...itemDetails, brand: e.target.value })}
                  placeholder="e.g., Levi's, Zara, H&M"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '8px' }}>
                  Price
                </label>
                <input
                  type="number"
                  value={itemDetails.price}
                  onChange={(e) => setItemDetails({ ...itemDetails, price: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '8px' }}>
                  Description / Notes
                </label>
                <textarea
                  value={itemDetails.description}
                  onChange={(e) => setItemDetails({ ...itemDetails, description: e.target.value })}
                  placeholder="Add any notes about this item..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  setItemDetails({ name: '', brand: '', price: '', description: '', subcategory: '' });
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateItem}
                disabled={!itemDetails.name.trim()}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: itemDetails.name.trim() ? 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)' : '#ccc',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: itemDetails.name.trim() ? 'pointer' : 'not-allowed',
                  color: 'white'
                }}
              >
                Update Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input for Bulk Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Photo Tips Modal */}
      <PhotoTipsModal
        isOpen={showPhotoTips}
        onClose={handlePhotoTipsClose}
        onDontShowAgain={handlePhotoTipsDontShowAgain}
      />

      {/* Interactive Crop Tool */}
      {showCropTool && imageToCrop && (
        <InteractiveCropTool
          imageUrl={imageToCrop}
          onComplete={handleCroppingComplete}
          onCancel={handleCroppingCancel}
          suggestedCrops={[]}
        />
      )}

      {/* Smart Upload Multi-Item Confirmation Modal */}
      {showSmartItemConfirmation && detectedSmartItems.length > 0 && (
        <MultiItemConfirmationModal
          isOpen={showSmartItemConfirmation}
          items={detectedSmartItems}
          onSaveAll={async (items) => {
            console.log('💾 [SMART-UPLOAD] Saving all items:', items.length);
            for (const item of items) {
              await addItem({
                name: item.name,
                category: selectedCategory || 'tops',
                image_url: item.imageUrl,
                notes: `AI-detected (${Math.round(item.confidence * 100)}% confidence)`,
                favorite: false
              });
            }
            setShowSmartItemConfirmation(false);
            setDetectedSmartItems([]);
            console.log('✅ [SMART-UPLOAD] All items saved successfully');
          }}
          onSaveSelected={async (items) => {
            console.log('💾 [SMART-UPLOAD] Saving selected items:', items.length);
            for (const item of items) {
              await addItem({
                name: item.name,
                category: selectedCategory || 'tops',
                image_url: item.imageUrl,
                notes: `AI-detected (${Math.round(item.confidence * 100)}% confidence)`,
                favorite: false
              });
            }
            setShowSmartItemConfirmation(false);
            setDetectedSmartItems([]);
            console.log('✅ [SMART-UPLOAD] Selected items saved successfully');
          }}
          onCancel={() => {
            console.log('❌ [SMART-UPLOAD] Multi-item confirmation cancelled');
            setShowSmartItemConfirmation(false);
            setDetectedSmartItems([]);
          }}
        />
      )}
    </div>
  );
};

export default VisualClosetEnhanced;
