import React, { useState } from 'react';
import {
  Heart,
  Share2,
  Star,
  Folder,
  ShoppingBag,
  Eye,
  MoreVertical,
  Palette,
  X
} from 'lucide-react';
import outfitStorageService, { OutfitData } from '../services/outfitStorageService';
import collectionsService from '../services/collectionsService';
import colorAnalysisService from '../services/colorAnalysisService';

interface OutfitCardProps {
  outfit: OutfitData;
  userId: string;
  onUpdate?: (outfit: OutfitData) => void;
  showActions?: boolean;
  compact?: boolean;
}

const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  userId,
  onUpdate,
  showActions = true,
  compact = false
}) => {
  const [favorited, setFavorited] = useState(outfit.favorited || false);
  const [rating, setRating] = useState(outfit.rating || 0);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);

  /**
   * Toggle favorite status
   */
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const success = await outfitStorageService.toggleFavorite(outfit.id!, !favorited);
    if (success) {
      setFavorited(!favorited);

      if (onUpdate) {
        onUpdate({ ...outfit, favorited: !favorited });
      }
    }
  };

  /**
   * Rate outfit (1-5 stars)
   */
  const handleRate = async (stars: number, e: React.MouseEvent) => {
    e.stopPropagation();

    const success = await outfitStorageService.rateOutfit(outfit.id!, stars, userId);
    if (success) {
      setRating(stars);

      if (onUpdate) {
        onUpdate({ ...outfit, rating: stars });
      }
    }
  };

  /**
   * Generate share link
   */
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSharing(true);

    const url = await outfitStorageService.shareOutfit(outfit.id!);
    if (url) {
      setShareUrl(url);

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        console.log('✅ Share URL copied to clipboard:', url);
      } catch (error) {
        console.error('❌ Failed to copy to clipboard:', error);
      }
    }
  };

  /**
   * Close share modal
   */
  const handleCloseShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSharing(false);
    setShareUrl(null);
  };

  /**
   * Get color name for display
   */
  const getColorName = (hexColor: string): string => {
    return colorAnalysisService.getColorName(hexColor);
  };

  /**
   * Format date
   */
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-gray-100">
        <img
          src={outfit.image_url}
          alt={`${outfit.style} outfit for ${outfit.occasion}`}
          className="w-full h-full object-cover"
        />

        {/* Favorite Button - Top Right */}
        {showActions && (
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors shadow-md"
            aria-label={favorited ? 'Unfavorite' : 'Favorite'}
          >
            <Heart
              className={`w-5 h-5 ${favorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        )}

        {/* Color Palette - Bottom Left */}
        {outfit.primary_colors && outfit.primary_colors.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {outfit.primary_colors.slice(0, 5).map((color, index) => (
              <div
                key={index}
                className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={getColorName(color)}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPalette(!showColorPalette);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-4 ${compact ? 'space-y-2' : 'space-y-3'}`}>
        {/* Title & Metadata */}
        <div>
          <h3 className="font-semibold text-gray-900 capitalize">
            {outfit.style}
          </h3>
          <p className="text-sm text-gray-600">{outfit.occasion}</p>
          {!compact && (
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(outfit.created_at)}
            </p>
          )}
        </div>

        {/* Rating */}
        {showActions && (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={(e) => handleRate(star, e)}
                className="transition-transform hover:scale-110"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`w-4 h-4 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Weather Info */}
        {!compact && outfit.weather_condition && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>🌡️ {outfit.weather_temp}°F</span>
            <span>•</span>
            <span>{outfit.weather_condition}</span>
          </div>
        )}

        {/* User Prompt */}
        {!compact && outfit.user_prompt && (
          <p className="text-xs text-gray-500 italic line-clamp-2">
            "{outfit.user_prompt}"
          </p>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {isSharing && shareUrl && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-10"
          onClick={handleCloseShare}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share Outfit</h3>
              <button
                onClick={handleCloseShare}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Anyone with this link can view your outfit
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-800 break-all">{shareUrl}</p>
            </div>

            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  alert('Link copied to clipboard!');
                } catch (error) {
                  console.error('Failed to copy:', error);
                }
              }}
              className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}

      {/* Color Palette Modal */}
      {showColorPalette && outfit.primary_colors && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPalette(false);
          }}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Color Palette</h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPalette(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {outfit.primary_colors.map((color, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-md"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm capitalize">
                      {getColorName(color)}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{color}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Dropdown */}
      {showMenu && (
        <div
          className="absolute bottom-16 right-4 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10 min-w-[180px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Add to collection:', outfit.id);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <Folder className="w-4 h-4" />
            Add to Collection
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('View details:', outfit.id);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPalette(true);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <Palette className="w-4 h-4" />
            Color Palette
          </button>

          <div className="border-t border-gray-200 my-1" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Shop similar:', outfit.id);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-purple-600"
          >
            <ShoppingBag className="w-4 h-4" />
            Shop Similar
          </button>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default OutfitCard;
