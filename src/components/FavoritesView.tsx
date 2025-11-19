import React, { useState, useMemo } from 'react';
import { getSmartImageUrl } from '../services/imageUtils';
import { ChevronLeft, Search, Heart, Edit2, Trash2, X, HeartOff } from 'lucide-react';
import { useCloset, ClothingCategory } from '../hooks/useCloset';

interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  image_url: string;
  thumbnail_url?: string;
  brand?: string;
  price?: number;
  favorite: boolean;
  times_worn: number;
  subcategory?: string;
}

interface FavoritesViewProps {
  onBack: () => void;
  onEdit?: (itemId: string) => void;
}

const CATEGORY_LABELS: Record<ClothingCategory, { title: string; icon: string }> = {
  tops: { title: 'Tops', icon: '👕' },
  bottoms: { title: 'Bottoms', icon: '👖' },
  dresses: { title: 'Dresses', icon: '👗' },
  activewear: { title: 'Active Wear', icon: '🏃' },
  outerwear: { title: 'Outerwear', icon: '🧥' },
  shoes: { title: 'Shoes', icon: '👠' },
  accessories: { title: 'Accessories', icon: '👜' }
};

const FavoritesView: React.FC<FavoritesViewProps> = ({ onBack, onEdit }) => {
  const { items, loading, deleteItem, toggleFavorite } = useCloset();
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Filter to show only favorites
  const favoriteItems = useMemo(() => {
    const favorites = items.filter(item => item.favorite);
    
    if (!searchText.trim()) return favorites;
    
    const query = searchText.toLowerCase();
    return favorites.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [items, searchText]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFE4E9 0%, #FFB6D9 100%)',
      paddingBottom: 'calc(100px + env(safe-area-inset-bottom))'
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 105, 180, 0.2)',
        padding: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 105, 180, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#FF69B4'
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#FF69B4' }}>
              ❤️ My Favorites
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#86868b' }}>
              {favoriteItems.length} item{favoriteItems.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search 
            size={20} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#86868b'
            }} 
          />
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'white',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {favoriteItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#86868b'
          }}>
            <HeartOff size={80} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px', color: '#666' }}>
              No Favorites Yet
            </h2>
            <p style={{ fontSize: '16px', margin: 0 }}>
              Tap the heart icon on items to add them to your favorites
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px'
          }}>
            {favoriteItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItem(item as ClothingItem);
                  setShowActionSheet(true);
                }}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{
                  aspectRatio: '1',
                  background: '#f5f5f5',
                  position: 'relative'
                }}>
                  <img
                    src={getSmartImageUrl('wardrobe', item.image_url, 'thumbnail')}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <Heart
                    size={20}
                    fill="#FF69B4"
                    color="#FF69B4"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                    }}
                  />
                </div>
                <div style={{ padding: '8px' }}>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1c1c1e',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.name}
                  </p>
                  <p style={{
                    margin: '4px 0 0',
                    fontSize: '12px',
                    color: '#86868b'
                  }}>
                    {CATEGORY_LABELS[item.category]?.icon} {CATEGORY_LABELS[item.category]?.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Sheet */}
      {showActionSheet && selectedItem && (
        <>
          <div
            onClick={() => setShowActionSheet(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 999
            }}
          />
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: '20px 20px 0 0',
            padding: '20px',
            paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
            zIndex: 1000
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>
                {selectedItem.name}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#86868b' }}>
                {CATEGORY_LABELS[selectedItem.category]?.title}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  toggleFavorite(selectedItem.id);
                  setShowActionSheet(false);
                }}
                style={{
                  padding: '16px',
                  background: 'rgba(255, 69, 180, 0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#FF69B4',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <HeartOff size={20} />
                Remove from Favorites
              </button>
              {onEdit && (
                <button
                  onClick={() => {
                    setShowActionSheet(false);
                    onEdit(selectedItem.id);
                  }}
                  style={{
                    padding: '16px',
                    background: 'rgba(0, 0, 0, 0.05)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1c1c1e',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Edit2 size={20} />
                  Edit Item
                </button>
              )}
              <button
                onClick={() => setShowActionSheet(false)}
                style={{
                  padding: '16px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '16px',
                  color: '#86868b',
                  cursor: 'pointer'
                }}
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

export default FavoritesView;
