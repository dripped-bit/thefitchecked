import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Trash2,
  Search,
  Star,
  Clock,
  Grid,
  List,
  Filter,
  Shirt,
  Package,
  Glasses,
  Footprints,
  Zap,
  Sparkles,
  Trophy,
  Calendar,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';
import ClosetService, { ClothingItem, ClothingCategory, UserCloset } from '../services/closetService';
import AchievementsPage from './AchievementsPage';
import AchievementsService from '../services/achievementsService';
import WeeklyOutfitCalendar from './WeeklyOutfitCalendar';
import optionalProductSearchService, { OutfitSearchResults } from '../services/optionalProductSearchService';
import ProductSearchResults from './ProductSearchResults';
import { ProductSearchResult } from '../services/perplexityService';

interface ClosetPageProps {
  onBack: () => void;
  onTryOnItem?: (item: ClothingItem) => void;
}

type TabType = 'closet' | 'weekly-planner' | 'achievements';

const ClosetPage: React.FC<ClosetPageProps> = ({ onBack, onTryOnItem }) => {
  const [closet, setCloset] = useState<UserCloset>(ClosetService.getUserCloset());
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>('shirts');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('closet');

  // Search functionality state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<OutfitSearchResults | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Category configurations - Updated to merge shirts and tops
  const categories: Array<{
    key: ClothingCategory;
    label: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    { key: 'tops', label: 'Tops/Shirts', icon: <Shirt className="w-4 h-4" />, color: 'purple' },
    { key: 'pants', label: 'Pants', icon: <Package className="w-4 h-4" />, color: 'green' },
    { key: 'dresses', label: 'Dresses', icon: <Sparkles className="w-4 h-4" />, color: 'pink' },
    { key: 'skirts', label: 'Skirts', icon: <Zap className="w-4 h-4" />, color: 'yellow' },
    { key: 'outerwear', label: 'Outerwear', icon: <Package className="w-4 h-4" />, color: 'gray' },
    { key: 'shoes', label: 'Shoes', icon: <Footprints className="w-4 h-4" />, color: 'orange' },
    { key: 'accessories', label: 'Accessories', icon: <Glasses className="w-4 h-4" />, color: 'indigo' }
  ];

  useEffect(() => {
    const stats = ClosetService.getClosetStats();
    console.log('👗 Closet loaded:', stats);
  }, []);

  // Reload closet data whenever component becomes visible or storage changes
  useEffect(() => {
    const reloadCloset = () => {
      const freshCloset = ClosetService.getUserCloset();
      setCloset(freshCloset);
      console.log('🔄 [CLOSET] Reloaded closet data from storage');

      // Log category counts for debugging
      Object.keys(freshCloset).forEach(cat => {
        const count = freshCloset[cat as ClothingCategory]?.length || 0;
        if (count > 0) {
          console.log(`  📦 ${cat}: ${count} items`);
        }
      });
    };

    // Initial load
    reloadCloset();

    // Reload when window gains focus (user returns to tab)
    const handleFocus = () => {
      console.log('👀 [CLOSET] Window focused - reloading closet data');
      reloadCloset();
    };

    window.addEventListener('focus', handleFocus);

    // Listen for storage changes (items added from other components/tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userCloset') {
        console.log('💾 [CLOSET] Storage changed - reloading closet data');
        reloadCloset();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for custom closet update events (same-tab updates from ClosetExperience)
    const handleClosetUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('🔔 [CLOSET] Closet updated event received:', customEvent.detail);
      reloadCloset();
    };

    window.addEventListener('closetUpdated', handleClosetUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('closetUpdated', handleClosetUpdate);
    };
  }, []);

  const getCategoryItems = (category: ClothingCategory): ClothingItem[] => {
    // Merge 'shirts' and 'tops' into one display category for backward compatibility
    let items = closet[category] || [];
    if (category === 'tops') {
      // Combine both 'tops' and 'shirts' arrays
      items = [...(closet['tops'] || []), ...(closet['shirts'] || [])];
    }

    console.log(`🔍 [CLOSET] Getting items for category "${category}":`, {
      totalInCategory: items.length,
      showFavoritesOnly,
      searchQuery,
      categoryExists: !!closet[category],
      combinedCategories: category === 'tops' ? ['tops', 'shirts'] : [category]
    });

    if (showFavoritesOnly) {
      items = items.filter(item => item.favorite);
      console.log(`  ⭐ After favorites filter: ${items.length} items`);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
      console.log(`  🔎 After search filter: ${items.length} items`);
    }

    if (items.length > 0) {
      console.log(`  ✅ Returning ${items.length} items for display`);
    } else {
      console.log(`  ⚠️ No items to display for category "${category}"`);
    }

    return items;
  };

  const handleToggleFavorite = async (itemId: string) => {
    const success = ClosetService.toggleFavorite(itemId);
    if (success) {
      setCloset(ClosetService.getUserCloset());

      // 🏆 Trigger achievement progress for favoriting items
      const favoriteAchievement = AchievementsService.onItemFavorited();
      if (favoriteAchievement) {
        console.log('💎 Favorite achievement unlocked:', favoriteAchievement.title);
      }
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to remove this item from your closet?')) {
      const success = ClosetService.deleteClothingItem(itemId);
      if (success) {
        setCloset(ClosetService.getUserCloset());
        setSelectedItem(null);
      }
    }
  };

  const handleTryOn = async (item: ClothingItem) => {
    if (onTryOnItem) {
      setIsLoading(true);
      try {
        await onTryOnItem(item);
        console.log('👔 Trying on item:', item.name);
      } catch (error) {
        console.error('Failed to try on item:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Search functionality handlers
  const handleSearchSimilar = async (item: ClothingItem) => {
    setIsSearching(true);
    try {
      console.log('🔍 Searching for similar items to:', item.name);
      const results = await optionalProductSearchService.searchSingleItem({
        name: item.name,
        imageUrl: item.imageUrl,
        category: item.category,
        description: item.description
      });
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultsClose = () => {
    setShowSearchResults(false);
    setSearchResults(null);
  };

  const handleAddSearchResultToWishlist = (product: ProductSearchResult) => {
    console.log('Adding product to wishlist:', product.title);
    // This could be enhanced to actually add to a wishlist service
  };

  const getCategoryColor = (category: ClothingCategory): string => {
    const categoryConfig = categories.find(c => c.key === category);
    return categoryConfig?.color || 'gray';
  };

  const renderClothingGrid = () => {
    const items = getCategoryItems(activeCategory);

    console.log(`🎨 [RENDER-GRID] Rendering grid for "${activeCategory}":`, {
      itemCount: items.length,
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        hasImageUrl: !!i.imageUrl,
        imageUrlType: i.imageUrl?.startsWith('data:') ? 'data-url' : 'other',
        imageUrlLength: i.imageUrl?.length,
        imageUrlPrefix: i.imageUrl?.substring(0, 50) + '...'
      }))
    });

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Package className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">
            {searchQuery || showFavoritesOnly ? 'No items found' : `No ${activeCategory} yet`}
          </p>
          <p className="text-sm">
            {searchQuery || showFavoritesOnly
              ? 'Try adjusting your filters'
              : 'Upload some clothes to get started!'
            }
          </p>
        </div>
      );
    }

    return (
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
        {items.map(item => (
          <div
            key={item.id}
            className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            {/* Image */}
            <div className="aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  console.error(`❌ [IMAGE-LOAD-ERROR] Failed to load image for "${item.name}":`, {
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
                  console.log(`✅ [IMAGE-LOAD-SUCCESS] Image loaded for "${item.name}"`);
                }}
              />
            </div>

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleTryOn(item)}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Trying On...' : 'Try On'}
                  </button>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Details
                  </button>
                </div>
                <button
                  onClick={() => handleSearchSimilar(item)}
                  disabled={isSearching}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSearching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Search Similar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Heart Icon */}
            <button
              onClick={() => handleToggleFavorite(item.id)}
              className="absolute top-2 right-2 z-10"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  item.favorite
                    ? 'text-red-500 fill-red-500'
                    : 'text-white/80 hover:text-red-500'
                }`}
              />
            </button>

            {/* Item Info */}
            <div className="p-3">
              <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{item.category}</p>
              {item.description && (
                <p className="text-xs text-gray-400 mt-1 truncate">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Closet</h1>
                <p className="text-sm text-gray-500">
                  {ClosetService.getClosetStats().totalItems} items total
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  showFavoritesOnly
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                <span className="text-sm">Favorites</span>
              </button>

              <button
                onClick={() => {
                  const freshCloset = ClosetService.getUserCloset();
                  setCloset(freshCloset);
                  console.log('🔄 [REFRESH] Manually refreshed closet data');
                  Object.keys(freshCloset).forEach(cat => {
                    const count = freshCloset[cat as ClothingCategory]?.length || 0;
                    if (count > 0) {
                      console.log(`  📦 ${cat}: ${count} items`);
                    }
                  });
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors"
                title="Refresh closet data"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Refresh</span>
              </button>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('closet')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'closet'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>My Closet</span>
            </button>
            <button
              onClick={() => setActiveTab('weekly-planner')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'weekly-planner'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>📅 Weekly Planner</span>
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'achievements'
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span>Achievements</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Closet Content */}
        {activeTab === 'closet' && (
          <>
            {/* Category Tabs */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => {
                  // Calculate count - combine 'tops' and 'shirts' for display
                  let count = closet[category.key]?.length || 0;
                  if (category.key === 'tops') {
                    count = (closet['tops']?.length || 0) + (closet['shirts']?.length || 0);
                  }
                  const isActive = activeCategory === category.key;

                  return (
                    <button
                      key={category.key}
                      onClick={() => {
                        console.log(`📂 [CATEGORY-CLICK-PAGE] Selected category:`, {
                          key: category.key,
                          label: category.label,
                          count,
                          previousCategory: activeCategory,
                          itemsInCategory: closet[category.key]?.map(i => i.name) || []
                        });
                        setActiveCategory(category.key);
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        isActive
                          ? `bg-${category.color}-100 text-${category.color}-700 border-2 border-${category.color}-200 shadow-sm scale-105`
                          : 'bg-white/60 text-gray-600 border border-gray-200 hover:bg-white hover:shadow-sm hover:scale-105'
                      }`}
                    >
                      {category.icon}
                      <span>{category.label}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isActive ? `bg-${category.color}-200` : 'bg-gray-200'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Items Grid */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
              {renderClothingGrid()}
            </div>
          </>
        )}

        {/* Weekly Planner Content */}
        {activeTab === 'weekly-planner' && (
          <WeeklyOutfitCalendar />
        )}

        {/* Achievements Content */}
        {activeTab === 'achievements' && (
          <AchievementsPage />
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`❌ [IMAGE-LOAD-ERROR-MODAL] Failed to load image for "${selectedItem.name}"`);
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    parent.innerHTML = '<div class="fallback-icon flex flex-col items-center justify-center w-full h-full text-gray-400"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs mt-2">Image unavailable</span></div>';
                  }
                }}
              />
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedItem.name}</h3>
                  <p className="text-gray-500 capitalize">{selectedItem.category}</p>
                </div>
                <button
                  onClick={() => handleToggleFavorite(selectedItem.id)}
                  className="text-red-500 hover:scale-110 transition-transform"
                >
                  <Heart className={`w-6 h-6 ${selectedItem.favorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              {selectedItem.description && (
                <p className="text-gray-600 mb-4">{selectedItem.description}</p>
              )}

              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
                <Clock className="w-4 h-4" />
                <span>Added {new Date(selectedItem.uploadDate).toLocaleDateString()}</span>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleTryOn(selectedItem)}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Trying On...' : 'Try On'}
                </button>
                <button
                  onClick={() => handleDeleteItem(selectedItem.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-600 p-3 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Modal */}
      {showSearchResults && searchResults && (
        <ProductSearchResults
          searchResults={searchResults}
          onClose={handleSearchResultsClose}
          onAddToWishlist={handleAddSearchResultToWishlist}
        />
      )}
    </div>
  );
};

export default ClosetPage;