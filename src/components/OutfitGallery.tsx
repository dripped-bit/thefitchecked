import React, { useState, useEffect } from 'react';
import {
  Filter,
  Star,
  Heart,
  Calendar,
  Palette,
  TrendingUp,
  Grid3x3,
  List,
  Search,
  X
} from 'lucide-react';
import OutfitCard from './OutfitCard';
import outfitStorageService, { OutfitData } from '../services/outfitStorageService';
import userDataService from '../services/userDataService';

interface OutfitGalleryProps {
  initialFilter?: 'all' | 'favorites' | 'rated' | 'recent';
  showFilters?: boolean;
  compact?: boolean;
}

const OutfitGallery: React.FC<OutfitGalleryProps> = ({
  initialFilter = 'all',
  showFilters = true,
  compact = false
}) => {
  const [outfits, setOutfits] = useState<OutfitData[]>([]);
  const [filteredOutfits, setFilteredOutfits] = useState<OutfitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'rated' | 'recent'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const userId = userDataService.getAllUserData()?.profile?.email || 'anonymous';

  // Popular colors for quick filtering
  const popularColors = [
    { name: 'Red', hex: '#FF0000' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Green', hex: '#00FF00' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Purple', hex: '#800080' },
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Orange', hex: '#FFA500' },
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Gray', hex: '#808080' }
  ];

  /**
   * Load outfits on mount
   */
  useEffect(() => {
    loadOutfits();
  }, [filter]);

  /**
   * Apply filters when search/color/occasion changes
   */
  useEffect(() => {
    applyFilters();
  }, [outfits, searchQuery, selectedOccasion, selectedColors]);

  /**
   * Load outfits from Supabase
   */
  const loadOutfits = async () => {
    setLoading(true);

    try {
      let loadedOutfits: OutfitData[] = [];

      switch (filter) {
        case 'favorites':
          loadedOutfits = await outfitStorageService.getFavoritedOutfits(userId);
          break;
        case 'rated':
          loadedOutfits = await outfitStorageService.getTopRatedOutfits(userId, 1);
          break;
        case 'recent':
          const allOutfits = await outfitStorageService.getUserOutfits(userId);
          loadedOutfits = allOutfits.slice(0, 20); // Last 20 outfits
          break;
        default:
          loadedOutfits = await outfitStorageService.getUserOutfits(userId);
      }

      setOutfits(loadedOutfits);
      console.log(`✅ [OUTFIT-GALLERY] Loaded ${loadedOutfits.length} outfits`);
    } catch (error) {
      console.error('❌ [OUTFIT-GALLERY] Failed to load outfits:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apply search and filters
   */
  const applyFilters = () => {
    let filtered = [...outfits];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (outfit) =>
          outfit.occasion.toLowerCase().includes(query) ||
          outfit.style.toLowerCase().includes(query) ||
          outfit.user_prompt?.toLowerCase().includes(query)
      );
    }

    // Occasion filter
    if (selectedOccasion && selectedOccasion !== 'all') {
      filtered = filtered.filter((outfit) =>
        outfit.occasion.toLowerCase().includes(selectedOccasion.toLowerCase())
      );
    }

    // Color filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter((outfit) =>
        outfit.primary_colors?.some((color) =>
          selectedColors.some((selected) =>
            color.toLowerCase() === selected.toLowerCase()
          )
        )
      );
    }

    setFilteredOutfits(filtered);
  };

  /**
   * Get unique occasions from outfits
   */
  const getOccasions = (): string[] => {
    const occasions = new Set(outfits.map((o) => o.occasion));
    return Array.from(occasions).sort();
  };

  /**
   * Toggle color filter
   */
  const toggleColorFilter = (hexColor: string) => {
    setSelectedColors((prev) =>
      prev.includes(hexColor)
        ? prev.filter((c) => c !== hexColor)
        : [...prev, hexColor]
    );
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedOccasion('all');
    setSelectedColors([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Outfits</h2>
          <p className="text-sm text-gray-600">
            {filteredOutfits.length} {filteredOutfits.length === 1 ? 'outfit' : 'outfits'}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Outfits
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === 'favorites'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className="w-4 h-4" />
              Favorites
            </button>
            <button
              onClick={() => setFilter('rated')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === 'rated'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star className="w-4 h-4" />
              Top Rated
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === 'recent'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Recent
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by occasion, style, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Occasion Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Occasion:</label>
            <select
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Occasions</option>
              {getOccasions().map((occasion) => (
                <option key={occasion} value={occasion}>
                  {occasion}
                </option>
              ))}
            </select>
          </div>

          {/* Color Filter */}
          <div>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-600"
            >
              <Palette className="w-4 h-4" />
              Filter by Color {selectedColors.length > 0 && `(${selectedColors.length})`}
            </button>

            {showColorPicker && (
              <div className="mt-3 flex flex-wrap gap-2">
                {popularColors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => toggleColorFilter(color.hex)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                      selectedColors.includes(color.hex)
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-sm">{color.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedOccasion !== 'all' || selectedColors.length > 0) && (
            <button
              onClick={clearFilters}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading outfits...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredOutfits.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No outfits found</p>
          {(searchQuery || selectedOccasion !== 'all' || selectedColors.length > 0) && (
            <button
              onClick={clearFilters}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Outfit Grid/List */}
      {!loading && filteredOutfits.length > 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }
        >
          {filteredOutfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              userId={userId}
              onUpdate={(updated) => {
                setOutfits((prev) =>
                  prev.map((o) => (o.id === updated.id ? updated : o))
                );
              }}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OutfitGallery;
