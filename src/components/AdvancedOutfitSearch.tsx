import React, { useState, useMemo } from 'react';
import { Search, Filter, Grid, List, Star, Clock, TrendingUp, Calendar } from 'lucide-react';

interface SearchFilters {
  categories: string[];
  colors: string[];
  styles: string[];
  seasons: string[];
  occasions: string[];
  brands: string[];
  priceRange: [number, number];
  dateRange: string | null;
  tags: string[];
  timesWorn: string | null;
}

interface OutfitItem {
  id: string;
  name: string;
  category: string;
  primaryColor: string;
  style: string;
  season: string[];
  occasion: string[];
  brand: string;
  price: number;
  timesWorn: number;
  dateAdded: Date;
  imageUrl: string;
  tags: string[];
  valueScore: number;
}

const categoryOptions = {
  tops: ['T-Shirts', 'Blouses', 'Sweaters', 'Tank Tops', 'Hoodies', 'Jackets'],
  bottoms: ['Jeans', 'Trousers', 'Shorts', 'Skirts', 'Leggings'],
  fullBody: ['Dresses', 'Jumpsuits', 'Rompers', 'Suits'],
  footwear: ['Sneakers', 'Heels', 'Boots', 'Sandals', 'Flats'],
  accessories: ['Bags', 'Belts', 'Hats', 'Jewelry', 'Scarves']
};

const colorFilters = {
  neutrals: ['Black', 'White', 'Gray', 'Beige', 'Brown'],
  basics: ['Navy', 'Olive', 'Burgundy'],
  brights: ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink'],
  patterns: ['Stripes', 'Floral', 'Plaid', 'Polka Dots', 'Abstract']
};

const styleCategories = {
  everyday: ['Casual', 'Smart Casual', 'Athleisure', 'Streetwear'],
  professional: ['Business Formal', 'Business Casual', 'Interview', 'Conference'],
  special: ['Date Night', 'Party', 'Wedding Guest', 'Vacation', 'Festival'],
  activity: ['Gym', 'Hiking', 'Beach', 'Lounge', 'Travel']
};

const occasionFilters = [
  'Work', 'Weekend', 'Date Night', 'Party', 'Casual', 'Formal', 'Travel', 'Gym', 'Beach'
];

const seasonFilters = ['Spring', 'Summer', 'Fall', 'Winter'];

const ColorFilter: React.FC<{
  selectedColors: string[];
  onColorToggle: (color: string) => void;
}> = ({ selectedColors, onColorToggle }) => (
  <div className="space-y-3">
    {Object.entries(colorFilters).map(([category, colors]) => (
      <div key={category} className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 capitalize">{category}</h4>
        <div className="flex flex-wrap gap-2">
          {colors.map(color => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full border-2 ${
                selectedColors.includes(color) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
              }`}
              style={{
                backgroundColor: color === 'White' ? '#FFFFFF' :
                               color === 'Black' ? '#000000' :
                               color === 'Gray' ? '#808080' :
                               color === 'Beige' ? '#F5F5DC' :
                               color === 'Brown' ? '#8B4513' :
                               color === 'Navy' ? '#000080' :
                               color === 'Olive' ? '#808000' :
                               color === 'Burgundy' ? '#800020' :
                               color.toLowerCase()
              }}
              onClick={() => onColorToggle(color)}
              title={color}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const CategoryFilters: React.FC<{
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
}> = ({ selectedCategories, onCategoryToggle }) => (
  <div className="space-y-3">
    {Object.entries(categoryOptions).map(([section, items]) => (
      <div key={section} className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 capitalize">{section}</h4>
        <div className="grid grid-cols-2 gap-2">
          {items.map(item => (
            <label key={item} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedCategories.includes(item)}
                onChange={() => onCategoryToggle(item)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{item}</span>
            </label>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const StyleFilters: React.FC<{
  selectedStyles: string[];
  onStyleToggle: (style: string) => void;
}> = ({ selectedStyles, onStyleToggle }) => (
  <div className="space-y-3">
    {Object.entries(styleCategories).map(([category, styles]) => (
      <div key={category} className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 capitalize">{category}</h4>
        <div className="grid grid-cols-2 gap-2">
          {styles.map(style => (
            <label key={style} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedStyles.includes(style)}
                onChange={() => onStyleToggle(style)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{style}</span>
            </label>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const PriceRangeSlider: React.FC<{
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
}> = ({ priceRange, onPriceRangeChange }) => (
  <div className="space-y-3">
    <h4 className="text-sm font-medium text-gray-700">Price Range</h4>
    <div className="px-3">
      <input
        type="range"
        min="0"
        max="1000"
        value={priceRange[1]}
        onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value)])}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-sm text-gray-600 mt-1">
        <span>${priceRange[0]}</span>
        <span>${priceRange[1]}+</span>
      </div>
    </div>
  </div>
);

const OutfitCard: React.FC<{
  item: OutfitItem;
  viewMode: 'grid' | 'list';
  onTryOn?: (item: OutfitItem) => void;
}> = ({ item, viewMode, onTryOn }) => {
  if (viewMode === 'list') {
    return (
      <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{item.name}</h3>
          <p className="text-sm text-gray-600">{item.brand} • {item.category}</p>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-sm text-gray-500">Worn {item.timesWorn}x</span>
            <span className="text-sm font-medium text-green-600">${item.price}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-yellow-400" />
          <span className="text-sm text-gray-600">{item.valueScore}/10</span>
          {onTryOn && (
            <button
              onClick={() => onTryOn(item)}
              className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              Try On
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
      <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{item.brand}</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">Worn {item.timesWorn}x</span>
          <span className="text-sm font-medium text-green-600">${item.price}</span>
        </div>
        {onTryOn && (
          <button
            onClick={() => onTryOn(item)}
            className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Try On
          </button>
        )}
      </div>
    </div>
  );
};

const SearchResults: React.FC<{
  results: OutfitItem[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onTryOn?: (item: OutfitItem) => void;
}> = ({ results, viewMode, onViewModeChange, onTryOn }) => {
  const [sortBy, setSortBy] = useState('relevance');

  const sortedResults = useMemo(() => {
    switch(sortBy) {
      case 'newest': return [...results].sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
      case 'mostWorn': return [...results].sort((a, b) => b.timesWorn - a.timesWorn);
      case 'leastWorn': return [...results].sort((a, b) => a.timesWorn - b.timesWorn);
      case 'valueScore': return [...results].sort((a, b) => b.valueScore - a.valueScore);
      case 'priceHigh': return [...results].sort((a, b) => b.price - a.price);
      case 'priceLow': return [...results].sort((a, b) => a.price - b.price);
      default: return results;
    }
  }, [results, sortBy]);

  return (
    <div className="space-y-4">
      {/* Results header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <span className="text-gray-600">{results.length} items found</span>
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="relevance">Most Relevant</option>
            <option value="newest">Newest First</option>
            <option value="mostWorn">Most Worn</option>
            <option value="leastWorn">Least Worn</option>
            <option value="valueScore">Best Value</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="priceLow">Price: Low to High</option>
          </select>
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
        {sortedResults.map(item => (
          <OutfitCard key={item.id} item={item} viewMode={viewMode} onTryOn={onTryOn} />
        ))}
      </div>
    </div>
  );
};

const SavedSearches: React.FC<{
  onApplySavedSearch: (filters: Partial<SearchFilters>) => void;
}> = ({ onApplySavedSearch }) => {
  const savedSearches = [
    { name: 'Work Week Outfits', filters: { occasions: ['Work'], styles: ['Business Casual', 'Business Formal'] }},
    { name: 'Summer Vacation', filters: { seasons: ['Summer'], occasions: ['Vacation', 'Beach'] }},
    { name: 'Unused Items', filters: { timesWorn: 'never' }},
    { name: 'High Value Pieces', filters: { priceRange: [100, 500] as [number, number] }},
    { name: 'Recently Added', filters: { dateRange: 'last-30-days' }},
    { name: 'Weekend Casual', filters: { occasions: ['Weekend'], styles: ['Casual'] }}
  ];

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="font-medium text-gray-900 mb-3">Saved Searches</h3>
      <div className="grid grid-cols-2 gap-2">
        {savedSearches.map(search => (
          <button
            key={search.name}
            onClick={() => onApplySavedSearch(search.filters)}
            className="text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
          >
            {search.name}
          </button>
        ))}
      </div>
    </div>
  );
};

const AdvancedOutfitSearch: React.FC<{
  onTryOn?: (item: OutfitItem) => void;
}> = ({ onTryOn }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    colors: [],
    styles: [],
    seasons: [],
    occasions: [],
    brands: [],
    priceRange: [0, 1000],
    dateRange: null,
    tags: [],
    timesWorn: null
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('categories');

  // Mock data - replace with actual data
  const mockResults: OutfitItem[] = [
    {
      id: '1',
      name: 'Classic White Button-Down',
      category: 'Blouses',
      primaryColor: 'White',
      style: 'Business Casual',
      season: ['Spring', 'Summer', 'Fall'],
      occasion: ['Work', 'Casual'],
      brand: 'Everlane',
      price: 85,
      timesWorn: 12,
      dateAdded: new Date('2024-01-15'),
      imageUrl: 'https://via.placeholder.com/200x300',
      tags: ['versatile', 'classic'],
      valueScore: 9.2
    },
    {
      id: '2',
      name: 'High-Waisted Jeans',
      category: 'Jeans',
      primaryColor: 'Blue',
      style: 'Casual',
      season: ['Fall', 'Winter', 'Spring'],
      occasion: ['Casual', 'Weekend'],
      brand: 'Levi\'s',
      price: 120,
      timesWorn: 8,
      dateAdded: new Date('2024-02-20'),
      imageUrl: 'https://via.placeholder.com/200x300',
      tags: ['comfortable', 'flattering'],
      valueScore: 8.5
    }
  ];

  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const toggleArrayFilter = (filterType: keyof SearchFilters, value: string) => {
    const currentArray = filters[filterType] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    handleFilterChange(filterType, newArray);
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      colors: [],
      styles: [],
      seasons: [],
      occasions: [],
      brands: [],
      priceRange: [0, 1000],
      dateRange: null,
      tags: [],
      timesWorn: null
    });
    setSearchQuery('');
  };

  const applySavedSearch = (savedFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...savedFilters }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Outfit Search</h1>
        <p className="text-gray-600">Find the perfect pieces from your closet</p>
      </div>

      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search outfits, items, or styles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <Filter className="h-5 w-5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Quick Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Recently Worn', filter: { timesWorn: 'recent' }, icon: Clock },
          { label: 'Never Worn', filter: { timesWorn: 'never' }, icon: Star },
          { label: 'Favorites', filter: { tags: ['favorite'] }, icon: Star },
          { label: 'Work Outfits', filter: { occasions: ['Work'] }, icon: TrendingUp },
          { label: 'Weekend Casual', filter: { occasions: ['Weekend'] }, icon: Calendar }
        ].map(({ label, filter, icon: Icon }) => (
          <button
            key={label}
            onClick={() => applySavedSearch(filter)}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-full text-sm hover:border-gray-400 transition-colors"
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
        <button
          onClick={clearAllFilters}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1 space-y-6">
            {/* Saved Searches */}
            <SavedSearches onApplySavedSearch={applySavedSearch} />

            {/* Filter Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'categories', label: 'Categories' },
                  { id: 'colors', label: 'Colors' },
                  { id: 'styles', label: 'Styles' },
                  { id: 'more', label: 'More' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-2 text-sm font-medium ${
                      activeTab === tab.id ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4 max-h-96 overflow-y-auto">
                {activeTab === 'categories' && (
                  <CategoryFilters
                    selectedCategories={filters.categories}
                    onCategoryToggle={(category) => toggleArrayFilter('categories', category)}
                  />
                )}
                {activeTab === 'colors' && (
                  <ColorFilter
                    selectedColors={filters.colors}
                    onColorToggle={(color) => toggleArrayFilter('colors', color)}
                  />
                )}
                {activeTab === 'styles' && (
                  <StyleFilters
                    selectedStyles={filters.styles}
                    onStyleToggle={(style) => toggleArrayFilter('styles', style)}
                  />
                )}
                {activeTab === 'more' && (
                  <div className="space-y-4">
                    <PriceRangeSlider
                      priceRange={filters.priceRange}
                      onPriceRangeChange={(range) => handleFilterChange('priceRange', range)}
                    />

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Occasions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {occasionFilters.map(occasion => (
                          <label key={occasion} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.occasions.includes(occasion)}
                              onChange={() => toggleArrayFilter('occasions', occasion)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{occasion}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Seasons</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {seasonFilters.map(season => (
                          <label key={season} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={filters.seasons.includes(season)}
                              onChange={() => toggleArrayFilter('seasons', season)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{season}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <SearchResults
            results={mockResults}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onTryOn={onTryOn}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvancedOutfitSearch;