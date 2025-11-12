/**
 * Product Search Results Component
 * Displays search results for similar clothing products
 */

import React, { useState } from 'react';
import { ExternalLink, Heart, Star, ShoppingCart, X, User } from 'lucide-react';
import { OutfitSearchResults, SearchResults } from '../services/optionalProductSearchService';
import { ProductSearchResult } from '../services/perplexityService';
import { affiliateLinkService } from '../services/affiliateLinkService';
import productLinkHandler from '../services/productLinkHandler';

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
    console.log('🛍️ [PRODUCT-SEARCH-RESULTS] Buy button clicked');
    console.log('📦 [PRODUCT-SEARCH-RESULTS] Product data:', {
      title: product.title,
      store: product.store,
      originalUrl: product.url,
      price: product.price
    });

    if (product.url) {
      const affiliateUrl = affiliateLinkService.convertToAffiliateLink(
        product.url,
        product.store || 'unknown'
      );

      console.log('🎯 [PRODUCT-SEARCH-RESULTS] Final URL to open:', affiliateUrl);
      console.log('✅ [PRODUCT-SEARCH-RESULTS] Opening product link...');

      affiliateLinkService.trackClick(affiliateUrl, undefined, product);
      productLinkHandler.openProductLink(affiliateUrl, product.store || 'unknown');
    } else {
      console.warn('⚠️ [PRODUCT-SEARCH-RESULTS] No URL found for product:', product.title);
    }
    onBuyProduct?.(product);
  };

  const handleTryOn = (product: ProductSearchResult) => {
    onTryOn?.(product);
  };

  return (
    <div className="fixed inset-0 ios-blur bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="ios-card rounded-ios-xl max-w-6xl w-full max-h-[90vh] overflow-hidden ios-slide-up shadow-ios-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ios-separator bg-ios-bg-secondary/50">
          <div>
            <h2 className="ios-large-title">Similar Products Found</h2>
            <p className="ios-body text-ios-label-secondary mt-1">
              Found {searchResults.totalResults} products across {searchResults.pieces.length} clothing pieces
            </p>
            {searchResults.selectedStores && searchResults.selectedStores.length > 0 && (
              <p className="ios-caption-1 text-ios-blue mt-1">
                Targeted search across {searchResults.selectedStores.length} premium stores
                {searchResults.gender && ` for ${searchResults.gender}'s fashion`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 hover:bg-ios-fill rounded-full transition-colors flex items-center justify-center"
          >
            <X className="w-6 h-6 text-ios-label-secondary" />
          </button>
        </div>

        {/* Search Results */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {searchResults.pieces.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-ios-xl bg-ios-fill flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-10 h-10 text-ios-label-tertiary" />
              </div>
              <h3 className="ios-title-2 mb-2">No Products Found</h3>
              <p className="ios-body text-ios-label-secondary max-w-md mx-auto">
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
        <div className="flex items-center justify-between p-6 border-t border-ios-separator bg-ios-bg-secondary/50">
          <p className="ios-caption-1 text-ios-label-secondary">
            Search completed at {new Date(searchResults.searchTimestamp).toLocaleTimeString()}
          </p>
          <button
            onClick={onClose}
            className="ios-button-secondary px-6"
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
    <div className="ios-card rounded-ios-xl overflow-hidden">
      {/* Piece Header */}
      <div
        className="flex items-center justify-between p-4 bg-ios-fill cursor-pointer hover:bg-ios-fill-secondary transition-colors"
        onClick={onToggleExpand}
      >
        <div>
          <h3 className="ios-headline capitalize">
            {piece.description} ({products.length} found)
          </h3>
          <p className="ios-caption-1 text-ios-label-secondary">Search: "{piece.searchQuery}"</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="ios-callout text-ios-label-secondary">
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
              <p className="ios-body text-ios-label-secondary">No products found for this item</p>
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
    <div className="ios-card overflow-hidden ios-scale-in hover:shadow-ios-lg transition-all">
      {/* Product Image */}
      <div className="aspect-square bg-ios-fill relative">
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
          className="absolute top-2 right-2 w-8 h-8 ios-blur bg-white/90 rounded-full shadow-ios-md hover:bg-white flex items-center justify-center transition-all"
        >
          <Heart className="w-4 h-4 text-ios-red" />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h4 className="ios-subheadline font-semibold line-clamp-2 mb-2">
          {product.title}
        </h4>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="ios-title-3 font-bold">{product.price}</span>
            {product.originalPrice && product.originalPrice !== product.price && (
              <span className="ios-caption-1 text-ios-label-tertiary line-through">{product.originalPrice}</span>
            )}
          </div>
          {product.rating && (
            <div className="flex items-center">
              <Star className="w-4 h-4 text-ios-yellow fill-current" />
              <span className="ios-caption-1 text-ios-label-secondary ml-1">{product.rating}</span>
            </div>
          )}
        </div>

        <p className="ios-caption-1 text-ios-label-secondary mb-3">{product.store}</p>

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
              className="ios-button-secondary flex-1 text-sm flex items-center justify-center"
              title="Try on this item"
            >
              <User className="w-4 h-4 mr-1" />
              Try-On
            </button>
          )}

          {/* View Button - Adjusted width based on try-on availability */}
          <button
            onClick={onBuyProduct}
            className={`ios-button-primary ${avatarData?.imageUrl ? 'flex-1' : 'flex-1'} text-sm flex items-center justify-center`}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View
          </button>

          {/* Wishlist Button */}
          <button
            onClick={onAddToWishlist}
            className="px-3 py-2 border border-ios-separator rounded-ios-md hover:bg-ios-fill transition-colors"
            title="Add to wishlist"
          >
            <Heart className="w-4 h-4 text-ios-red" />
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