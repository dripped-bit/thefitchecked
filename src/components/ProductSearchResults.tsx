/**
 * Product Search Results Component
 * Displays search results for similar clothing products
 */

import React, { useState } from 'react';
import { ExternalLink, Heart, Star, ShoppingCart, X, User } from 'lucide-react';
import { OutfitSearchResults, SearchResults } from '../services/optionalProductSearchService';
import { ProductSearchResult } from '../services/perplexityService';
import { affiliateLinkService } from '../services/affiliateLinkService';

interface ProductSearchResultsProps {
  searchResults: OutfitSearchResults;
  onClose: () => void;
  onAddToWishlist?: (product: ProductSearchResult) => void;
  onBuyProduct?: (product: ProductSearchResult) => void;
  onTryOn?: (product: ProductSearchResult) => void;
  avatarData?: any;
}

const ProductSearchResults: React.FC<ProductSearchResultsProps> = ({
  searchResults,
  onClose,
  onAddToWishlist,
  onBuyProduct,
  onTryOn,
  avatarData
}) => {
  const [expandedPieces, setExpandedPieces] = useState<Set<string>>(new Set());

  const togglePieceExpansion = (pieceId: string) => {
    const newExpanded = new Set(expandedPieces);
    if (newExpanded.has(pieceId)) {
      newExpanded.delete(pieceId);
    } else {
      newExpanded.add(pieceId);
    }
    setExpandedPieces(newExpanded);
  };

  const handleAddToWishlist = (product: ProductSearchResult) => {
    onAddToWishlist?.(product);
  };

  const handleBuyProduct = (product: ProductSearchResult) => {
    console.log('🖱️ [CLICK] ProductSearchResults buy clicked:', { url: product.url, store: product.store, title: product.title });
    if (product.url) {
      const affiliateUrl = affiliateLinkService.convertToAffiliateLink(
        product.url,
        product.store || 'unknown'
      );
      console.log('🔗 [RESULT] Affiliate URL generated:', affiliateUrl);
      affiliateLinkService.trackClick(affiliateUrl, undefined, product);
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.warn('⚠️ [CLICK] No URL found for product:', product.title);
    }
    onBuyProduct?.(product);
  };

  const handleTryOn = (product: ProductSearchResult) => {
    onTryOn?.(product);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Similar Products Found</h2>
            <p className="text-gray-600 mt-1">
              Found {searchResults.totalResults} products across {searchResults.pieces.length} clothing pieces
            </p>
            {searchResults.selectedStores && searchResults.selectedStores.length > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                Targeted search across {searchResults.selectedStores.length} premium stores
                {searchResults.gender && ` for ${searchResults.gender}'s fashion`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Search Results */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {searchResults.pieces.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600">
                We couldn't find similar products for this outfit. Try with different clothing items.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {searchResults.pieces.map((pieceResult) => (
                <PieceResultSection
                  key={pieceResult.piece.id}
                  pieceResult={pieceResult}
                  isExpanded={expandedPieces.has(pieceResult.piece.id)}
                  onToggleExpand={() => togglePieceExpansion(pieceResult.piece.id)}
                  onAddToWishlist={handleAddToWishlist}
                  onBuyProduct={handleBuyProduct}
                  onTryOn={handleTryOn}
                  avatarData={avatarData}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Search completed at {new Date(searchResults.searchTimestamp).toLocaleTimeString()}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface PieceResultSectionProps {
  pieceResult: SearchResults;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddToWishlist: (product: ProductSearchResult) => void;
  onBuyProduct: (product: ProductSearchResult) => void;
  onTryOn: (product: ProductSearchResult) => void;
  avatarData?: any;
}

const PieceResultSection: React.FC<PieceResultSectionProps> = ({
  pieceResult,
  isExpanded,
  onToggleExpand,
  onAddToWishlist,
  onBuyProduct,
  onTryOn,
  avatarData
}) => {
  const { piece, products } = pieceResult;

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Piece Header */}
      <div
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggleExpand}
      >
        <div>
          <h3 className="font-semibold text-gray-900 capitalize">
            {piece.description} ({products.length} found)
          </h3>
          <p className="text-sm text-gray-600">Search: "{piece.searchQuery}"</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {isExpanded ? 'Hide' : 'Show'} Products
          </span>
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ↓
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {isExpanded && (
        <div className="p-4">
          {products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No products found for this item</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToWishlist={() => onAddToWishlist(product)}
                  onBuyProduct={() => onBuyProduct(product)}
                  onTryOn={() => onTryOn(product)}
                  avatarData={avatarData}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ProductCardProps {
  product: ProductSearchResult;
  onAddToWishlist: () => void;
  onBuyProduct: () => void;
  onTryOn: () => void;
  avatarData?: any;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToWishlist,
  onBuyProduct,
  onTryOn,
  avatarData
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 relative">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={onAddToWishlist}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
        >
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
          {product.title}
        </h4>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-gray-900">{product.price}</span>
            {product.originalPrice && product.originalPrice !== product.price && (
              <span className="text-sm text-gray-500 line-through">{product.originalPrice}</span>
            )}
          </div>
          {product.rating && (
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-3">{product.store}</p>

        {product.discount && (
          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-3">
            {product.discount} off
          </div>
        )}

        <div className="flex space-x-2">
          {/* Try-On Button - Show only if avatar is available */}
          {avatarData?.imageUrl && (
            <button
              onClick={onTryOn}
              className="flex-1 bg-purple-600 text-white text-sm py-2 px-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
              title="Try on this item"
            >
              <User className="w-4 h-4 mr-1" />
              Try-On
            </button>
          )}

          {/* View Button - Adjusted width based on try-on availability */}
          <button
            onClick={onBuyProduct}
            className={`${avatarData?.imageUrl ? 'flex-1' : 'flex-1'} bg-gray-900 text-white text-sm py-2 px-3 rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center`}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View
          </button>

          {/* Wishlist Button */}
          <button
            onClick={onAddToWishlist}
            className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            title="Add to wishlist"
          >
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {!product.inStock && (
          <p className="text-red-600 text-xs mt-2">Out of stock</p>
        )}
      </div>
    </div>
  );
};

export default ProductSearchResults;