import React, { useState, useMemo } from 'react';
import { ChevronLeft, Search, Heart, Edit2, Share2, Trash2, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useCloset, ClothingCategory } from '../hooks/useCloset';
import { getSubcategoriesForCategory } from '../services/subcategoryMappingService';

interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  image_url: string;
  thumbnail_url?: string;
  brand?: string;
  price?: number;
  store?: string;
  favorite: boolean;
  times_worn: number;
  subcategory?: string;
}

interface AllItemsViewProps {
  onBack: () => void;
  onEdit?: (itemId: string) => void;
}

const CATEGORY_LABELS: Record<ClothingCategory, { title: string; icon: string }> = {
  tops: { title: 'Tops & Blouses', icon: '👕' },
  bottoms: { title: 'Bottoms', icon: '👖' },
  dresses: { title: 'Dresses', icon: '👗' },
  activewear: { title: 'Active Wear', icon: '🏃' },
  outerwear: { title: 'Outerwear', icon: '🧥' },
  shoes: { title: 'Shoes', icon: '👠' },
  accessories: { title: 'Accessories', icon: '👜' }
};

const AllItemsView: React.FC<AllItemsViewProps> = ({ onBack, onEdit }) => {
  const { items, loading, deleteItem, toggleFavorite, updateItem } = useCloset();
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubcategoryPicker, setShowSubcategoryPicker] = useState(false);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return items;
    const query = searchText.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [items, searchText]);

  // Group items by category (still needed for picker counts)
  const categorizedItems = useMemo(() => {
    const grouped: Record<ClothingCategory, ClothingItem[]> = {
      tops: [],
      bottoms: [],
      dresses: [],
      activewear: [],
      outerwear: [],
      shoes: [],
      accessories: []
    };

    filteredItems.forEach((item) => {
      const category = item.category as ClothingCategory;
      if (grouped[category]) {
        grouped[category].push(item as ClothingItem);
      }
    });

    return grouped;
  }, [filteredItems]);

  // Filter items by category and subcategory for display
  const displayedItems = useMemo(() => {
    let filtered = filteredItems;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by subcategory
    if (selectedSubcategory) {
      filtered = filtered.filter(item => item.subcategory === selectedSubcategory);
    }

    return filtered;
  }, [filteredItems, selectedCategory, selectedSubcategory]);

  const handleItemClick = (item: ClothingItem) => {
    setSelectedItem(item);
    setShowActionSheet(true);
  };

  const handleToggleFavorite = async () => {
    if (!selectedItem) return;
    await toggleFavorite(selectedItem.id);
    setSelectedItem({ ...selectedItem, favorite: !selectedItem.favorite });
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    await deleteItem(selectedItem.id);
    setShowActionSheet(false);
    setSelectedItem(null);
    setShowDeleteToast(true);
    setTimeout(() => setShowDeleteToast(false), 3000);
  };

  const handleEditItem = () => {
    if (!selectedItem || !onEdit) return;
    setShowActionSheet(false);
    onEdit(selectedItem.id);
  };

  const handleShareItem = () => {
    console.log('Share item:', selectedItem?.id);
    setShowActionSheet(false);
    // TODO: Implement share
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'rgba(255, 182, 217, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: 'white', fontSize: '18px', fontWeight: '500' }}>Loading your items...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgba(255, 182, 217, 0.3)',
      paddingBottom: 'calc(100px + env(safe-area-inset-bottom))'
    }}>
      {/* Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(255, 182, 217, 0.3)',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top))',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '12px'
        }}>
          {/* Back Button - Fixed Width Container */}
          <div style={{ width: '80px', flexShrink: 0 }}>
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '4px',
                background: 'rgba(255, 105, 180, 0.15)',
                border: '1px solid rgba(255, 105, 180, 0.3)',
                borderRadius: '8px',
                color: '#FF69B4',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '8px 12px'
              }}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
              <span>Back</span>
            </button>
          </div>

          {/* Centered Wardrobe Title */}
          <h1 style={{
            flex: 1,
            fontSize: '24px',
            fontWeight: '700',
            color: '#000000',
            textAlign: 'center',
            margin: '0'
          }}>
            Wardrobe
          </h1>

          {/* Add Button - Fixed Width Container */}
          <div style={{ width: '80px', flexShrink: 0 }}>
            <button
              onClick={() => {
                onBack();
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('openAddItemModal'));
                }, 100);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '4px',
                background: 'rgba(255, 105, 180, 0.15)',
                border: '1px solid rgba(255, 105, 180, 0.3)',
                borderRadius: '8px',
                color: '#FF69B4',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '8px 12px'
              }}
            >
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{
          position: 'relative',
          marginTop: '4px'
        }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#FF69B4'
            }}
          />
          <input
            type="text"
            placeholder="Search for item"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(255, 182, 217, 0.4)',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(255, 105, 180, 0.1)'
            }}
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        position: 'fixed',
        top: 'calc(130px + env(safe-area-inset-top))',
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 15,
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 182, 217, 0.2)'
      }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
          Filters:
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {/* Category Picker Button */}
          <button
            onClick={() => setShowCategoryPicker(true)}
            style={{
              flex: 1,
              padding: '12px',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            <span style={{ color: selectedCategory ? '#000' : '#999' }}>
              {selectedCategory 
                ? CATEGORY_LABELS[selectedCategory].title 
                : 'All Categories'}
            </span>
            <ChevronDown size={18} color="#666" />
          </button>

          {/* Subcategory Picker Button */}
          <button
            onClick={() => selectedCategory && setShowSubcategoryPicker(true)}
            disabled={!selectedCategory}
            style={{
              flex: 1,
              padding: '12px',
              background: selectedCategory ? 'white' : '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: selectedCategory ? 'pointer' : 'not-allowed',
              fontSize: '15px',
              opacity: selectedCategory ? 1 : 0.5
            }}
          >
            <span style={{ color: selectedSubcategory ? '#000' : '#999' }}>
              {selectedSubcategory || 'All Types'}
            </span>
            <ChevronDown size={18} color="#666" />
          </button>
        </div>

        {/* Clear Filters */}
        {(selectedCategory || selectedSubcategory) && (
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
            }}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              color: '#FF1493',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ 
        padding: '16px',
        paddingTop: 'calc(180px + env(safe-area-inset-top))'
      }}>
        {items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.6)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👗</div>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#FF1493', marginBottom: '8px' }}>
              No Items Yet
            </h2>
            <p style={{ color: '#666', fontSize: '16px' }}>
              Start adding items to your closet to see them here
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.6)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#FF1493', marginBottom: '8px' }}>
              No Results Found
            </h2>
            <p style={{ color: '#666', fontSize: '16px' }}>
              Try searching for something else
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div style={{ 
              padding: '0 0 12px',
              fontSize: '14px',
              color: '#666',
              fontWeight: '500'
            }}>
              {displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'}
            </div>

            {/* Single Grid - All Filtered Items */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              {displayedItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        style={{
                          position: 'relative',
                          aspectRatio: '1',
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.9)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(255, 105, 180, 0.15)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <img
                          src={item.thumbnail_url || item.image_url}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        {item.favorite && (
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '50%',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Heart size={12} fill="#ff4444" color="#ff4444" />
                          </div>
                        )}
                      </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <>
          <div
            onClick={() => setShowCategoryPicker(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 2000
            }}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: '20px 20px 0 0',
            paddingBottom: 'calc(env(safe-area-inset-bottom))',
            zIndex: 2001,
            maxHeight: '60vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={() => setShowCategoryPicker(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF1493',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                Select Category
              </h3>
              <button
                onClick={() => setShowCategoryPicker(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF1493',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>

            {/* Picker List */}
            <div style={{ 
              overflowY: 'auto',
              flex: 1
            }}>
              {/* All Categories Option */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                  setShowCategoryPicker(false);
                }}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: selectedCategory === null ? 'rgba(255, 105, 180, 0.1)' : 'white',
                  border: 'none',
                  borderBottom: '1px solid #f0f0f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '16px'
                }}
              >
                <span style={{ fontSize: '24px' }}>🌟</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: selectedCategory === null ? '600' : '400' }}>
                    All Categories
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    Show all {items.length} items
                  </div>
                </div>
                {selectedCategory === null && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#FF1493',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px'
                  }}>
                    ✓
                  </div>
                )}
              </button>

              {/* Category Options */}
              {Object.entries(CATEGORY_LABELS).map(([category, info]) => {
                const itemCount = categorizedItems[category as ClothingCategory].length;
                if (itemCount === 0) return null;

                return (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category as ClothingCategory);
                      setSelectedSubcategory(null);
                      setShowCategoryPicker(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: selectedCategory === category 
                        ? 'rgba(255, 105, 180, 0.1)' 
                        : 'white',
                      border: 'none',
                      borderBottom: '1px solid #f0f0f0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '16px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{info.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: selectedCategory === category ? '600' : '400' 
                      }}>
                        {info.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                    {selectedCategory === category && (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#FF1493',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px'
                      }}>
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Subcategory Picker Modal */}
      {showSubcategoryPicker && selectedCategory && (
        <>
          <div
            onClick={() => setShowSubcategoryPicker(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 2000
            }}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: '20px 20px 0 0',
            paddingBottom: 'calc(env(safe-area-inset-bottom))',
            zIndex: 2001,
            maxHeight: '60vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={() => setShowSubcategoryPicker(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF1493',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                Select Subcategory
              </h3>
              <button
                onClick={() => setShowSubcategoryPicker(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF1493',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>

            {/* Picker List */}
            <div style={{ 
              overflowY: 'auto',
              flex: 1
            }}>
              {/* All Types Option */}
              <button
                onClick={() => {
                  setSelectedSubcategory(null);
                  setShowSubcategoryPicker(false);
                }}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: selectedSubcategory === null ? 'rgba(255, 105, 180, 0.1)' : 'white',
                  border: 'none',
                  borderBottom: '1px solid #f0f0f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '16px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: selectedSubcategory === null ? '600' : '400' }}>
                    All Types
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    Show all {categorizedItems[selectedCategory].length} items
                  </div>
                </div>
                {selectedSubcategory === null && (
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#FF1493',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px'
                  }}>
                    ✓
                  </div>
                )}
              </button>

              {/* Subcategory Options */}
              {getSubcategoriesForCategory(selectedCategory).map(subcat => {
                const itemsInSubcat = categorizedItems[selectedCategory].filter(
                  item => item.subcategory === subcat
                ).length;

                return (
                  <button
                    key={subcat}
                    onClick={() => {
                      setSelectedSubcategory(subcat);
                      setShowSubcategoryPicker(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: selectedSubcategory === subcat 
                        ? 'rgba(255, 105, 180, 0.1)' 
                        : 'white',
                      border: 'none',
                      borderBottom: '1px solid #f0f0f0',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '16px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: selectedSubcategory === subcat ? '600' : '400' 
                      }}>
                        {subcat}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {itemsInSubcat} {itemsInSubcat === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                    {selectedSubcategory === subcat && (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#FF1493',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px'
                      }}>
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Action Sheet Modal */}
      {showActionSheet && selectedItem && (
        <>
          <div
            onClick={() => setShowActionSheet(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: '20px 20px 0 0',
            padding: '24px',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
            zIndex: 1001,
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Item Preview */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <img
                src={selectedItem.thumbnail_url || selectedItem.image_url}
                alt={selectedItem.name}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  objectFit: 'cover'
                }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                  {selectedItem.name}
                </h3>
                {selectedItem.brand && (
                  <p style={{ fontSize: '14px', color: '#666' }}>{selectedItem.brand}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleToggleFavorite}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#333',
                  transition: 'all 0.2s'
                }}
              >
                <Heart
                  size={20}
                  fill={selectedItem.favorite ? '#ff4444' : 'none'}
                  color={selectedItem.favorite ? '#ff4444' : '#666'}
                />
                <span>{selectedItem.favorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
              </button>

              <button
                onClick={handleEditItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#333',
                  transition: 'all 0.2s'
                }}
              >
                <Edit2 size={20} color="#666" />
                <span>Edit</span>
              </button>

              <button
                onClick={handleShareItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#333',
                  transition: 'all 0.2s'
                }}
              >
                <Share2 size={20} color="#666" />
                <span>Share</span>
              </button>

              <button
                onClick={handleDeleteItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: '#fff',
                  border: '1px solid #ffebee',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#f44336',
                  transition: 'all 0.2s'
                }}
              >
                <Trash2 size={20} />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setShowActionSheet(false)}
                style={{
                  padding: '16px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#666',
                  marginTop: '8px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Toast */}
      {showDeleteToast && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 1002,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>Item deleted successfully</span>
          <button
            onClick={() => setShowDeleteToast(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0',
              display: 'flex'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AllItemsView;
