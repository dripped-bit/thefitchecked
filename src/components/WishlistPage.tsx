/**
 * Wishlist Page Component
 * Displays user's wishlist items with search functionality
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  Trash2,
  Search,
  ShoppingBag,
  ExternalLink,
  Grid,
  List
} from 'lucide-react';
import optionalProductSearchService, { OutfitSearchResults } from '../services/optionalProductSearchService';
import ProductSearchResults from './ProductSearchResults';
import { ProductSearchResult } from '../services/perplexityService';

interface WishlistItem {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  description?: string;
  dateAdded: string;
  source: 'generated' | 'search' | 'manual';
  originalPrompt?: string;
}

interface WishlistPageProps {
  onBack: () => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ onBack }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search functionality state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<OutfitSearchResults | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    loadWishlistItems();
  }, []);

  const loadWishlistItems = () => {
    // Load from localStorage - this would typically be a service call
    try {
      const stored = localStorage.getItem('fitChecked_wishlist');
      if (stored) {
        setWishlistItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load wishlist items:', error);
    }
  };

  const saveWishlistItems = (items: WishlistItem[]) => {
    try {
      localStorage.setItem('fitChecked_wishlist', JSON.stringify(items));
      setWishlistItems(items);
    } catch (error) {
      console.error('Failed to save wishlist items:', error);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = wishlistItems.filter(item => item.id !== itemId);
    saveWishlistItems(updatedItems);
  };

  // Search functionality handlers
  const handleSearchSimilar = async (item: WishlistItem) => {
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
    const newItem: WishlistItem = {
      id: `search_${Date.now()}`,
      name: product.title,
      imageUrl: product.imageUrl || '',
      category: 'other',
      description: product.store,
      dateAdded: new Date().toISOString(),
      source: 'search'
    };

    const updatedItems = [...wishlistItems, newItem];
    saveWishlistItems(updatedItems);
    console.log('Added search result to wishlist:', product.title);
  };

  const filteredItems = wishlistItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderWishlistGrid = () => {
    if (filteredItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Heart className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No wishlist items found</h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            {searchQuery ? 'No items match your search. Try different keywords.' : 'Start adding items to your wishlist to see them here.'}
          </p>
        </div>
      );
    }

    return (
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            {/* Image */}
            <div className="aspect-square overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex flex-col space-y-2">
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
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              </div>
            </div>

            {/* Source Badge */}
            <div className="absolute top-2 left-2 z-10">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                item.source === 'generated' ? 'bg-blue-100 text-blue-700' :
                item.source === 'search' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {item.source}
              </span>
            </div>

            {/* Item Info */}
            <div className="p-3">
              <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{item.category}</p>
              {item.description && (
                <p className="text-xs text-gray-400 mt-1 truncate">{item.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Added {new Date(item.dateAdded).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
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
                <h1 className="text-2xl font-bold text-gray-800">My Wishlist</h1>
                <p className="text-sm text-gray-500">
                  {wishlistItems.length} items saved
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search wishlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent w-64"
                />
              </div>

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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderWishlistGrid()}
      </div>

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

export default WishlistPage;