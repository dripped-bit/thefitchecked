import React, { useState, useMemo } from 'react';
import {
  Heart,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  Share2,
  X
} from 'lucide-react';
import { useCloset, ClothingCategory } from '../hooks/useCloset';
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
    getCategoryStats
  } = useCloset();

  const [searchText, setSearchText] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

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
    console.log('Add item:', category);
    // TODO: Navigate to add-item page with category parameter
    // router.push('/add-item' + (category ? `?category=${category}` : ''));
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
    console.log('Edit item:', itemId);
    // TODO: Navigate to edit-item page
    // router.push(`/edit-item/${itemId}`);
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
      {/* Header */}
      <div className="visual-closet-header glass-card">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search your closet..."
            className="search-input"
          />
        </div>

        {/* Quick Stats */}
        <div className="stats-container">
          <div className="stat-chip glass-card">
            <span className="stat-value">{items.length}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat-chip glass-card">
            <Heart className="stat-icon" size={16} fill="currentColor" />
            <span className="stat-value">{items.filter(i => i.favorite).length}</span>
            <span className="stat-label">Favorites</span>
          </div>
        </div>
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
                style={{ backgroundColor: category.color }}
              >
                <div className="section-header-content">
                  <span className="section-icon">{category.icon}</span>
                  <div className="section-info">
                    <h3 className="section-title">{category.title}</h3>
                    <span className="item-count">
                      {category.items.length} {category.items.length === 1 ? 'item' : 'items'}
                      {categoryStats.favoriteCount > 0 && (
                        <> · {categoryStats.favoriteCount} ❤️</>
                      )}
                    </span>
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
                  {isExpanded ? (
                    <ChevronUp className="expand-icon" size={20} />
                  ) : (
                    <ChevronDown className="expand-icon" size={20} />
                  )}
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

      {/* Floating Action Button */}
      <button className="fab-add glass-fab" onClick={() => handleAddItem()}>
        <Plus size={24} />
        <span>Add Item</span>
      </button>

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
    </div>
  );
};

export default VisualClosetEnhanced;
