/**
 * Save to Closet Modal
 * Modal for saving generated outfits to closet or wishlist with optional product search
 */

import React, { useState } from 'react';
import { X, Shirt, Heart, Trash2, Package, Search, ShoppingBag } from 'lucide-react';
import optionalProductSearchService, { OutfitSearchResults } from '../services/optionalProductSearchService';
import ProductSearchResults from './ProductSearchResults';
import ExternalTryOnModal from './ExternalTryOnModal';
import { ProductSearchResult } from '../services/perplexityService';

interface SaveToClosetModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedImageUrl: string;
  originalPrompt: string;
  onSaveToCloset: (itemData: SavedItemData) => void;
  onAddToWishlist: (itemData: SavedItemData) => void;
  avatarData?: any;
}

export interface SavedItemData {
  id: number;
  imageUrl: string;
  name: string;
  category: string;
  dateAdded: string;
  source: 'generated';
  originalPrompt?: string;
}

const CLOSET_CATEGORIES = [
  'shirts',
  'pants',
  'dresses',
  'skirts',
  'jackets',
  'shoes',
  'accessories',
  'other'
];

const SaveToClosetModal: React.FC<SaveToClosetModalProps> = ({
  isOpen,
  onClose,
  generatedImageUrl,
  originalPrompt,
  onSaveToCloset,
  onAddToWishlist,
  avatarData
}) => {
  const [itemName, setItemName] = useState(originalPrompt);
  const [selectedCategory, setSelectedCategory] = useState('shirts');

  // Search states
  const [showSearchPrompt, setShowSearchPrompt] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<OutfitSearchResults | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Try-on states
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [showTryOnModal, setShowTryOnModal] = useState(false);

  if (!isOpen) return null;

  const handleSaveToCloset = () => {
    const itemData: SavedItemData = {
      id: Date.now(),
      imageUrl: generatedImageUrl,
      name: itemName.trim() || originalPrompt,
      category: selectedCategory,
      dateAdded: new Date().toISOString(),
      source: 'generated',
      originalPrompt
    };

    onSaveToCloset(itemData);

    // Show search prompt after successful closet addition
    setShowSearchPrompt(true);
  };

  const handleAddToWishlist = () => {
    const itemData: SavedItemData = {
      id: Date.now(),
      imageUrl: generatedImageUrl,
      name: itemName.trim() || originalPrompt,
      category: selectedCategory,
      dateAdded: new Date().toISOString(),
      source: 'generated',
      originalPrompt
    };

    onAddToWishlist(itemData);

    // Show search prompt after successful wishlist addition
    setShowSearchPrompt(true);
  };

  const handleDiscard = () => {
    onClose();
  };

  // Search functionality handlers
  const handleSearchForSimilar = async () => {
    setIsSearching(true);
    try {
      const results = await optionalProductSearchService.searchOutfitProducts(
        generatedImageUrl,
        originalPrompt
      );
      setSearchResults(results);
      setShowSearchPrompt(false);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      // Show error message or fallback
      setShowSearchPrompt(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSkipSearch = () => {
    setShowSearchPrompt(false);
    onClose();
  };

  const handleSearchResultsClose = () => {
    setShowSearchResults(false);
    setSearchResults(null);
    onClose();
  };

  const handleAddSearchResultToWishlist = (product: ProductSearchResult) => {
    // Convert ProductSearchResult to SavedItemData format
    const itemData: SavedItemData = {
      id: Date.now(),
      imageUrl: product.imageUrl || '',
      name: product.title,
      category: 'other', // Could be improved with product categorization
      dateAdded: new Date().toISOString(),
      source: 'generated'
    };
    onAddToWishlist(itemData);
  };

  const handleTryOnProduct = (product: ProductSearchResult) => {
    setSelectedProduct(product);
    setShowTryOnModal(true);
  };

  const handleTryOnComplete = () => {
    setShowTryOnModal(false);
    setSelectedProduct(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Show Search Prompt instead of Save Form when showSearchPrompt is true */}
        {showSearchPrompt ? (
          <div className="p-6 text-center">
            <div className="mb-4">
              <ShoppingBag className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Find Similar Products?
              </h3>
              <p className="text-gray-600">
                We can search for similar clothing items online using Perplexity search.
                This will help you find where to buy pieces like your generated outfit.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSkipSearch}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSearchForSimilar}
                disabled={isSearching}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Save to Closet?</h2>
                    <p className="text-sm text-gray-600">Add this generated item to your collection</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/80 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Generated Image Preview */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
              <img
                src={generatedImageUrl}
                alt="Generated outfit"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Item Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a name for this item"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CLOSET_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Original Prompt Reference */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Original Prompt:</p>
            <p className="text-sm text-gray-800 italic">"{originalPrompt}"</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t bg-gray-50 flex space-x-3">
          <button
            onClick={handleDiscard}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Discard</span>
          </button>

          <button
            onClick={handleAddToWishlist}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-pink-600 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors"
          >
            <Heart className="w-4 h-4" />
            <span>Wishlist</span>
          </button>

          <button
            onClick={handleSaveToCloset}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Shirt className="w-4 h-4" />
            <span>Save to Closet</span>
          </button>
        </div>
          </>
        )}
      </div>

      {/* Search Results Modal */}
      {showSearchResults && searchResults && (
        <ProductSearchResults
          searchResults={searchResults}
          onClose={handleSearchResultsClose}
          onAddToWishlist={handleAddSearchResultToWishlist}
          onTryOn={handleTryOnProduct}
          avatarData={avatarData}
        />
      )}

      {/* External Try-On Modal */}
      {showTryOnModal && selectedProduct && (
        <ExternalTryOnModal
          isOpen={showTryOnModal}
          onClose={() => setShowTryOnModal(false)}
          product={selectedProduct}
          avatarData={avatarData}
          onTryOnComplete={handleTryOnComplete}
        />
      )}
    </div>
  );
};

export default SaveToClosetModal;