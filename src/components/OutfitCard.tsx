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
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import outfitStorageService, { OutfitData } from '../services/outfitStorageService';
import collectionsService from '../services/collectionsService';
import { useHaptics } from '../utils/haptics';
// Color analysis temporarily disabled for deployment
// import colorAnalysisService from '../services/colorAnalysisService';

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
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  // Haptic feedback hook
  const haptics = useHaptics();

  /**
   * Toggle favorite status
   */
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Haptic feedback BEFORE action
    if (favorited) {
      haptics.light(); // Unfavorite = light tap
    } else {
      haptics.doubleTap(); // Favorite = double tap (like "heart" animation)
    }

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

    // Add haptic feedback
    haptics.selection(); // Selection haptic for picker-style interaction

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

    haptics.medium(); // Medium impact for button press

    setIsSharing(true);

    const url = await outfitStorageService.shareOutfit(outfit.id!);
    if (url) {
      setShareUrl(url);

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        console.log('✅ Share URL copied to clipboard:', url);

        haptics.success(); // Success notification when copied
      } catch (error) {
        console.error('❌ Failed to copy to clipboard:', error);
        haptics.error(); // Error notification if failed
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
    // Temporarily return hex code until color analysis is re-enabled
    return hexColor;
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
    <div className="relative ios-card rounded-ios-xl overflow-hidden hover:shadow-ios-xl transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-ios-fill">
        <img
          src={outfit.image_url}
          alt={`${outfit.style} outfit for ${outfit.occasion}`}
          className="w-full h-full object-cover"
        />

        {/* Favorite Button - Top Right */}
        {showActions && (
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 w-10 h-10 ios-blur bg-white/90 rounded-full hover:bg-white transition-all shadow-ios-md flex items-center justify-center"
            aria-label={favorited ? 'Unfavorite' : 'Favorite'}
          >
            <Heart
              className={`w-5 h-5 ${favorited ? 'fill-ios-red text-ios-red' : 'text-ios-label-secondary'}`}
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
                  haptics.light();
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
          <h3 className="ios-headline capitalize">
            {outfit.style}
          </h3>
          <p className="ios-callout text-ios-label-secondary">{outfit.occasion}</p>
          {!compact && (
            <p className="ios-caption-1 text-ios-label-tertiary mt-1">
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
                className="transition-transform hover:scale-110 active:scale-95"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`w-4 h-4 ${
                    star <= rating
                      ? 'fill-ios-yellow text-ios-yellow'
                      : 'text-ios-label-quaternary'
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Weather Info */}
        {!compact && outfit.weather_condition && (
          <div className="flex items-center gap-2 ios-caption-1 text-ios-label-secondary">
            <span>🌡️ {outfit.weather_temp}°F</span>
            <span>•</span>
            <span>{outfit.weather_condition}</span>
          </div>
        )}

        {/* User Prompt Box */}
        {outfit.user_prompt && (
          <div className="bg-ios-purple/10 border border-ios-purple/20 rounded-ios-lg p-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-ios-purple mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="ios-caption-2 font-semibold text-ios-purple mb-1">Your Prompt:</p>
                <p
                  className={`ios-caption-1 ${
                    !isPromptExpanded && !compact ? 'line-clamp-2' : ''
                  } ${
                    compact && !isPromptExpanded ? 'line-clamp-1' : ''
                  }`}
                >
                  "{outfit.user_prompt}"
                </p>
                {outfit.user_prompt.length > 80 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPromptExpanded(!isPromptExpanded);
                    }}
                    className="mt-1 ios-caption-2 text-ios-purple hover:text-ios-purple/80 font-semibold flex items-center gap-1 transition-colors"
                  >
                    {isPromptExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Show more
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2 border-t border-ios-separator">
            <button
              onClick={handleShare}
              className="ios-button-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                haptics.light();
                setShowMenu(!showMenu);
              }}
              className="ios-button-secondary px-3"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {isSharing && shareUrl && (
        <div
          className="absolute inset-0 ios-blur bg-black/50 flex items-center justify-center p-4 z-10"
          onClick={handleCloseShare}
        >
          <div
            className="ios-card rounded-ios-xl p-6 max-w-sm w-full shadow-ios-xl ios-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="ios-title-2">Share Outfit</h3>
              <button
                onClick={handleCloseShare}
                className="text-ios-label-tertiary hover:text-ios-label-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="ios-callout text-ios-label-secondary mb-4">
              Anyone with this link can view your outfit
            </p>

            <div className="bg-ios-fill rounded-ios-lg p-3 mb-4">
              <p className="ios-caption-1 break-all">{shareUrl}</p>
            </div>

            <button
              onClick={async (e) => {
                e.stopPropagation();
                haptics.medium();
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  haptics.success();
                  alert('Link copied to clipboard!');
                } catch (error) {
                  console.error('Failed to copy:', error);
                  haptics.error();
                }
              }}
              className="ios-button-primary w-full"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}

      {/* Color Palette Modal */}
      {showColorPalette && outfit.primary_colors && (
        <div
          className="absolute inset-0 ios-blur bg-black/50 flex items-center justify-center p-4 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPalette(false);
          }}
        >
          <div
            className="ios-card rounded-ios-xl p-6 max-w-sm w-full shadow-ios-xl ios-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-ios-purple" />
                <h3 className="ios-title-2">Color Palette</h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPalette(false);
                }}
                className="text-ios-label-tertiary hover:text-ios-label-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {outfit.primary_colors.map((color, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-ios-lg border-2 border-ios-separator shadow-ios-sm"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1">
                    <p className="ios-subheadline font-semibold capitalize">
                      {getColorName(color)}
                    </p>
                    <p className="ios-caption-1 text-ios-label-tertiary font-mono">{color}</p>
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
          className="absolute bottom-16 right-4 ios-card rounded-ios-lg shadow-ios-xl py-2 z-10 min-w-[180px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Add to collection:', outfit.id);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left ios-callout hover:bg-ios-fill flex items-center gap-2 transition-colors"
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
            className="w-full px-4 py-2 text-left ios-callout hover:bg-ios-fill flex items-center gap-2 transition-colors"
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
            className="w-full px-4 py-2 text-left ios-callout hover:bg-ios-fill flex items-center gap-2 transition-colors"
          >
            <Palette className="w-4 h-4" />
            Color Palette
          </button>

          <div className="border-t border-ios-separator my-1" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Shop similar:', outfit.id);
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left ios-callout hover:bg-ios-fill flex items-center gap-2 text-ios-purple transition-colors"
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
