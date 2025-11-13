import React, { useState, useMemo, useEffect } from 'react';
import { Heart, Plus, Search, ChevronDown, ChevronUp, Trash2, Edit2, Share2, Loader2, CheckCircle, X } from 'lucide-react';
import { useCloset, ClothingCategory } from '../hooks/useCloset';
import '../styles/VisualClosetAdapter.css';

interface CategoryConfig {
  id: ClothingCategory;
  title: string;
  icon: string;
  color: string;
  description: string;
}

const CATEGORY_MAPPING: CategoryConfig[] = [
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

interface VisualClosetAdapterProps {
  onAddItem?: () => void;
}

export const VisualClosetAdapter: React.FC<VisualClosetAdapterProps> = ({
  onAddItem
}) => {
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
  const [selectedItem, setSelectedItem] = useState<typeof items[0] | null>(null);
  const [showItemActions, setShowItemActions] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchText) return items;
    return searchItems(searchText);
  }, [searchText, items, searchItems]);

  const stats = useMemo(() => getCategoryStats(), [getCategoryStats]);

  const categoryData = useMemo(() => {
    return CATEGORY_MAPPING.map(categoryConfig => {
      const categoryItems = filteredItems.filter(item => 
        item.category === categoryConfig.id
      );

      return {
        ...categoryConfig,
        items: categoryItems,
        count: categoryItems.length,
        favoriteCount: categoryItems.filter(i => i.favorite).length
      };
    });
  }, [filteredItems]);

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

  const handleItemClick = (item: typeof items[0]) => {
    setSelectedItem(item);
    setShowItemActions(true);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const success = await toggleFavorite(itemId);
    if (success) {
      setToastMessage('Favorite updated');
      setShowToast(true);
    }
  };

  const handleDelete = async (itemId: string) => {
    setShowItemActions(false);
    const success = await deleteItem(itemId);
    if (success) {
      setToastMessage('Item deleted successfully');
      setShowToast(true);
    } else {
      setToastMessage('Failed to delete item');
      setShowToast(true);
    }
  };

  const totalItems = items.length;
  const totalFavorites = items.filter(i => i.favorite).length;

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Show loading state
  if (loading) {
    return (
      <div className="visual-closet-adapter">
        <div className="loading-container">
          <Loader2 className="loading-spinner" size={48} />
          <p>Loading your closet...</p>
        </div>
      </div>
    );
  }

  // Show error state
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
      <div className="visual-closet-header glass-card">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search your closet..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="stats-container">
          <div className="stat-chip glass-card">
            <span className="stat-value">{totalItems}</span>
            <span className="stat-label">Items</span>
          </div>
          <div className="stat-chip glass-card">
            <Heart className="stat-icon" size={16} fill="currentColor" />
            <span className="stat-value">{totalFavorites}</span>
            <span className="stat-label">Favorites</span>
          </div>
        </div>
      </div>

      <div className="closet-grid">
        {categoryData.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const hasItems = category.items.length > 0;

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
                      {category.count} {category.count === 1 ? 'item' : 'items'}
                      {category.favoriteCount > 0 && (
                        <> · {category.favoriteCount} ❤️</>
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
                      onAddItem();
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

              <div
                className={`items-grid ${isExpanded || !hasItems ? 'expanded' : 'collapsed'}`}
              >
                {!hasItems ? (
                  <div className="empty-category">
                    <div className="empty-icon">📦</div>
                    <p className="empty-text">No {category.title.toLowerCase()} yet</p>
                    <p className="empty-subtext">Add your first item to get started</p>
                    <button
                      className="btn-outline"
                      onClick={() => onAddItem()}
                    >
                      Add {category.title}
                    </button>
                  </div>
                ) : (
                  <>
                    {category.items
                      .slice(0, isExpanded ? undefined : 6)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="item-card glass-card"
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="item-image-container">
                            <img
                              src={item.thumbnail_url || item.image_url}
                              alt={item.name}
                              className="item-image"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.png';
                              }}
                            />
                            {item.favorite && (
                              <div className="favorite-badge">
                                <Heart size={16} fill="currentColor" color="#ff4444" />
                              </div>
                            )}
                            <button
                              className="favorite-toggle"
                              onClick={(e) => handleToggleFavorite(e, item.id)}
                            >
                              <Heart
                                size={20}
                                fill={item.favorite ? 'currentColor' : 'none'}
                                color={item.favorite ? '#ff4444' : '#ffffff'}
                              />
                            </button>
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

                    {category.items.length > 6 && !isExpanded && (
                      <div
                        className="show-more-card glass-card"
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div className="show-more-content">
                          <Plus size={32} />
                          <span>+{category.items.length - 6} more</span>
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

      <button className="fab-add glass-fab" onClick={onAddItem}>
        <Plus size={24} />
        <span>Add Item</span>
      </button>

      {showItemActions && selectedItem && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setShowItemActions(false)}
          />
          <div className="item-actions-modal glass-card">
            <h3>{selectedItem.name || 'Item Actions'}</h3>
            <div className="action-buttons">
              <button
                className="action-btn"
                onClick={async () => {
                  await toggleFavorite(selectedItem.id);
                  setShowItemActions(false);
                  setToastMessage('Favorite updated');
                  setShowToast(true);
                }}
              >
                <Heart
                  size={20}
                  fill={selectedItem.favorite ? 'currentColor' : 'none'}
                />
                {selectedItem.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
              <button
                className="action-btn"
                onClick={() => setShowItemActions(false)}
              >
                <Edit2 size={20} />
                Edit Item
              </button>
              <button
                className="action-btn"
                onClick={() => {
                  // TODO: Implement share functionality
                  setShowItemActions(false);
                }}
              >
                <Share2 size={20} />
                Share Item
              </button>
              <button
                className="action-btn danger"
                onClick={() => handleDelete(selectedItem.id)}
              >
                <Trash2 size={20} />
                Delete Item
              </button>
              <button
                className="action-btn cancel"
                onClick={() => setShowItemActions(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="toast-container">
          <div className="toast glass-card">
            <CheckCircle size={20} color="#34C759" />
            <span>{toastMessage}</span>
            <button
              className="toast-close"
              onClick={() => setShowToast(false)}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualClosetAdapter;
