import React, { useState, useMemo } from 'react';
import { Heart, Plus, Search, ChevronDown, ChevronUp, Trash2, Edit2 } from 'lucide-react';
import { closetService, ClothingItem } from '../services/closetService';
import '../styles/VisualClosetAdapter.css';

interface CategoryConfig {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  categories: string[];
}

const CATEGORY_MAPPING: CategoryConfig[] = [
  {
    id: 'tops',
    title: 'Tops & Blouses',
    icon: '👕',
    color: 'rgba(255, 182, 193, 0.2)',
    description: 'T-shirts, shirts, blouses, tanks',
    categories: ['tops', 'shirts', 'blouses']
  },
  {
    id: 'bottoms',
    title: 'Bottoms',
    icon: '👖',
    color: 'rgba(173, 216, 230, 0.2)',
    description: 'Jeans, pants, shorts, skirts',
    categories: ['bottoms', 'pants', 'jeans', 'shorts', 'skirts']
  },
  {
    id: 'dresses',
    title: 'Dresses',
    icon: '👗',
    color: 'rgba(221, 160, 221, 0.2)',
    description: 'Casual, formal, maxi, mini',
    categories: ['dresses']
  },
  {
    id: 'sweaters',
    title: 'Sweaters & Cardigans',
    icon: '🧥',
    color: 'rgba(255, 228, 196, 0.2)',
    description: 'Knits, hoodies, cardigans',
    categories: ['sweaters', 'hoodies', 'cardigans']
  },
  {
    id: 'outerwear',
    title: 'Outerwear',
    icon: '🧥',
    color: 'rgba(169, 169, 169, 0.2)',
    description: 'Jackets, coats, blazers',
    categories: ['outerwear', 'jackets', 'coats', 'blazers']
  },
  {
    id: 'shoes',
    title: 'Shoes',
    icon: '👠',
    color: 'rgba(244, 164, 96, 0.2)',
    description: 'Sneakers, heels, boots, flats',
    categories: ['shoes', 'sneakers', 'boots', 'heels']
  },
  {
    id: 'accessories',
    title: 'Accessories',
    icon: '👜',
    color: 'rgba(216, 191, 216, 0.2)',
    description: 'Bags, jewelry, scarves, hats',
    categories: ['accessories', 'bags', 'jewelry', 'scarves', 'hats']
  }
];

interface VisualClosetAdapterProps {
  clothingItems: ClothingItem[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onItemClick: (item: ClothingItem) => void;
  onAddItem: () => void;
  onDeleteItem: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void;
}

export const VisualClosetAdapter: React.FC<VisualClosetAdapterProps> = ({
  clothingItems,
  selectedCategory,
  onCategoryChange,
  onItemClick,
  onAddItem,
  onDeleteItem,
  onToggleFavorite
}) => {
  const [searchText, setSearchText] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [showItemActions, setShowItemActions] = useState(false);

  const filteredItems = useMemo(() => {
    if (!searchText) return clothingItems;
    const lowerSearch = searchText.toLowerCase();
    return clothingItems.filter(item =>
      item.name?.toLowerCase().includes(lowerSearch) ||
      item.category?.toLowerCase().includes(lowerSearch) ||
      item.brand?.toLowerCase().includes(lowerSearch)
    );
  }, [searchText, clothingItems]);

  const categoryData = useMemo(() => {
    return CATEGORY_MAPPING.map(categoryConfig => {
      const items = filteredItems.filter(item => {
        const itemCategory = item.category?.toLowerCase() || '';
        return categoryConfig.categories.some(cat => 
          itemCategory.includes(cat.toLowerCase())
        );
      });

      return {
        ...categoryConfig,
        items,
        count: items.length,
        favoriteCount: items.filter(i => i.isFavorite).length
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

  const handleItemClick = (item: ClothingItem) => {
    setSelectedItem(item);
    setShowItemActions(true);
    onItemClick(item);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, item: ClothingItem) => {
    e.stopPropagation();
    onToggleFavorite(item.id);
  };

  const handleDelete = async (itemId: string) => {
    setShowItemActions(false);
    onDeleteItem(itemId);
  };

  const totalItems = clothingItems.length;
  const totalFavorites = clothingItems.filter(i => i.isFavorite).length;

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
                              src={item.image || item.originalImage || '/placeholder.png'}
                              alt={item.name || 'Clothing item'}
                              className="item-image"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.png';
                              }}
                            />
                            {item.isFavorite && (
                              <div className="favorite-badge">
                                <Heart size={16} fill="currentColor" color="#ff4444" />
                              </div>
                            )}
                            <button
                              className="favorite-toggle"
                              onClick={(e) => handleToggleFavorite(e, item)}
                            >
                              <Heart
                                size={20}
                                fill={item.isFavorite ? 'currentColor' : 'none'}
                                color={item.isFavorite ? '#ff4444' : '#ffffff'}
                              />
                            </button>
                          </div>
                          <div className="item-info">
                            <p className="item-name">
                              {item.name || 'Unnamed Item'}
                            </p>
                            {item.brand && (
                              <span className="item-brand">{item.brand}</span>
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
                onClick={() => {
                  onToggleFavorite(selectedItem.id);
                  setShowItemActions(false);
                }}
              >
                <Heart
                  size={20}
                  fill={selectedItem.isFavorite ? 'currentColor' : 'none'}
                />
                {selectedItem.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
              <button
                className="action-btn"
                onClick={() => setShowItemActions(false)}
              >
                <Edit2 size={20} />
                Edit Item
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
    </div>
  );
};

export default VisualClosetAdapter;
