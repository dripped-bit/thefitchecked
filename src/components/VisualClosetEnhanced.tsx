import React, { useState, useMemo, useEffect } from 'react';
import {
  Heart,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  Share2,
  X,
  Camera,
  Upload
} from 'lucide-react';
import { Camera as CapacitorCamera } from '@capacitor/camera';
import { useCloset, ClothingCategory } from '../hooks/useCloset';
import backgroundRemovalService from '../services/backgroundRemovalService';
import { LoadingScreen } from './LoadingScreen';
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
    id: 'sweaters',
    title: 'Sweaters & Cardigans',
    icon: '🧥',
    color: 'rgba(255, 228, 196, 0.2)',
    description: 'Knits, hoodies, cardigans'
  },
  {
    id: 'outerwear',
    title: 'Outerwear',
    icon: '🧥',
    color: 'rgba(169, 169, 169, 0.2)',
    description: 'Jackets, coats, blazers'
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

const VisualClosetEnhanced: React.FC = () => {
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
  const [itemDetails, setItemDetails] = useState({
    name: '',
    brand: '',
    price: '',
    description: ''
  });
  const [selectedItemCategory, setSelectedItemCategory] = useState<ClothingCategory>('tops');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);

  // Processing/Loading states for background removal
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Processing...');
  const [processingAbortController, setProcessingAbortController] = useState<AbortController | null>(null);

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
    if (!searchText) return items;
    return searchItems(searchText);
  }, [searchText, items, searchItems]);

  // Category data with filtered items
  const categoryData = useMemo(() => {
    return CATEGORIES.map(category => ({
      ...category,
      items: filteredItems.filter(item => item.category === category.id)
    }));
  }, [filteredItems]);

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
    setSelectedCategory(category || 'tops');
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

  const handleGalleryUpload = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'base64', // Changed from 'uri' to 'base64' for API compatibility
        source: 'photos'
      });

      if (image.base64String && selectedCategory) {
        // Convert to data URL format for background removal API
        const base64Image = `data:image/jpeg;base64,${image.base64String}`;
        console.log('🖼️ [GALLERY] Selected image as base64, length:', base64Image.length);

        // Close upload modal and show processing modal
        setShowUploadModal(false);
        setShowProcessingModal(true);
        setProcessingMessage('Removing background...');

        // Create abort controller for cancellation support
        const abortController = new AbortController();
        setProcessingAbortController(abortController);

        try {
          // Process background removal BEFORE showing details form
          const bgRemovalResult = await backgroundRemovalService.removeBackground(base64Image, abortController.signal);

          // Check if operation was aborted
          if (abortController.signal.aborted) {
            console.log('⚠️ [GALLERY] Background removal aborted by user');
            setShowProcessingModal(false);
            return;
          }

          // Use processed image if successful, fallback to original if failed
          const processedImageUrl = bgRemovalResult.success && bgRemovalResult.imageUrl
            ? bgRemovalResult.imageUrl
            : base64Image;

          if (bgRemovalResult.fallback) {
            console.warn('⚠️ [GALLERY] Using original image (background removal failed)');
          } else {
            console.log('✅ [GALLERY] Background removed successfully');
          }

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
          console.error('❌ [GALLERY] Background removal error, using original image:', processingError);
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
  };

  const handleSaveItem = async () => {
    if (!capturedImage || !selectedCategory) return;

    try {
      console.log('💾 [CLOSET] Saving item to category:', selectedCategory);
      console.log('📸 [CLOSET] Image already processed (background removed earlier)');

      // Save item with already-processed image (background removed before modal opened)
      console.log('💾 [CLOSET] Calling addItem with category:', selectedCategory);
      const newItem = await addItem({
        name: itemDetails.name || `New ${selectedCategory} item`,
        category: selectedCategory,
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
        setItemDetails({ name: '', brand: '', price: '', description: '' });
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error('❌ [CLOSET] Error saving item:', error);
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
        description: item.description || ''
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
        brand: itemDetails.brand || undefined,
        price: itemDetails.price ? parseFloat(itemDetails.price) : undefined,
        notes: itemDetails.description || undefined
      });

      if (success) {
        // Reset and close
        setEditingItem(null);
        setItemDetails({ name: '', brand: '', price: '', description: '' });
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

  return (
    <div className="visual-closet-adapter">
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
                              src={item.thumbnail_url || item.image_url}
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
                <span>Choose from Gallery</span>
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
            <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>
              Add Item Details
            </h3>

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
                  <option value="outerwear">🧥 Outerwear</option>
                  <option value="shoes">👟 Shoes</option>
                  <option value="accessories">👜 Accessories</option>
                </select>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Select where this item should be categorized
                </p>
              </div>

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
                  setItemDetails({ name: '', brand: '', price: '', description: '' });
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
                Save Item
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
            setItemDetails({ name: '', brand: '', price: '', description: '' });
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
                src={editingItem.image_url}
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
                  <option value="outerwear">🧥 Outerwear</option>
                  <option value="shoes">👟 Shoes</option>
                  <option value="accessories">👜 Accessories</option>
                </select>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Select where this item should be categorized
                </p>
              </div>

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
                  setItemDetails({ name: '', brand: '', price: '', description: '' });
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
    </div>
  );
};

export default VisualClosetEnhanced;
