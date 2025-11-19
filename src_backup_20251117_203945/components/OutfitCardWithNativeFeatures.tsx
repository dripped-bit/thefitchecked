import React, { useState } from 'react';
import { Heart, Trash2, Camera, Share2 } from 'lucide-react';
import { Card, Button } from 'konsta/react';
import NativeCameraCapture from './NativeCameraCapture';
import NativeShareButton from './NativeShareButton';
import { useHaptics } from '../utils/haptics';
import { Photo } from '@capacitor/camera';

/**
 * Outfit Card Component with Native iOS Features
 *
 * Demonstrates all Capacitor plugins working together:
 * - Camera: Take/select outfit photos
 * - Haptics: Tactile feedback for interactions
 * - Share: Share outfit with native iOS share sheet
 * - Status Bar: Managed by page-level components
 * - App: Deep linking handled at app level
 */

interface OutfitCardProps {
  outfitId: string;
  imageUrl?: string;
  title: string;
  description: string;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  onDelete?: () => void;
  onPhotoUpdate?: (photoUrl: string) => void;
}

const OutfitCardWithNativeFeatures: React.FC<OutfitCardProps> = ({
  outfitId,
  imageUrl,
  title,
  description,
  isFavorite = false,
  onFavoriteToggle,
  onDelete,
  onPhotoUpdate,
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState(imageUrl);

  // Haptic feedback hook
  const haptics = useHaptics();

  /**
   * Handle favorite toggle with haptic feedback
   */
  const handleFavoriteToggle = () => {
    if (isFavorite) {
      // Unfavorite - light haptic
      haptics.light();
    } else {
      // Favorite - double tap haptic for "like" feeling
      haptics.doubleTap();
    }

    onFavoriteToggle?.();
  };

  /**
   * Handle delete with confirmation haptic
   */
  const handleDelete = () => {
    // Heavy haptic for destructive action
    haptics.heavy();

    // Show confirmation dialog
    if (confirm('Delete this outfit?')) {
      haptics.success();
      onDelete?.();
    }
  };

  /**
   * Handle photo capture
   */
  const handlePhotoCapture = (photoUrl: string, photo: Photo) => {
    console.log('📸 Photo captured:', photoUrl);

    // Success haptic
    haptics.success();

    // Update local state
    setLocalImageUrl(photoUrl);

    // Hide camera
    setShowCamera(false);

    // Notify parent
    onPhotoUpdate?.(photoUrl);
  };

  /**
   * Handle share success
   */
  const handleShareSuccess = () => {
    console.log('✅ Outfit shared successfully');
    // Success haptic already triggered by share button
  };

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Outfit Image */}
      <div className="relative">
        {localImageUrl ? (
          <img
            src={localImageUrl}
            alt={title}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Camera size={48} className="text-white opacity-50" />
          </div>
        )}

        {/* Favorite Button - Top Right */}
        <button
          onClick={handleFavoriteToggle}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg active:scale-95 transition-transform"
        >
          <Heart
            size={24}
            className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}
          />
        </button>
      </div>

      {/* Outfit Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Camera Button */}
          <Button
            rounded
            outline
            onClick={() => {
              haptics.medium();
              setShowCamera(!showCamera);
            }}
          >
            <Camera className="mr-2" size={18} />
            {localImageUrl ? 'Update Photo' : 'Add Photo'}
          </Button>

          {/* Share Button */}
          {localImageUrl && (
            <NativeShareButton
              title={title}
              text={description}
              imageUrl={localImageUrl}
              url={`thefitchecked://outfit/${outfitId}`}
              buttonText="Share"
              buttonVariant="outline"
              onShareSuccess={handleShareSuccess}
            />
          )}

          {/* Delete Button */}
          <Button
            rounded
            clear
            onClick={handleDelete}
            colors={{ text: 'text-red-500' }}
          >
            <Trash2 className="mr-2" size={18} />
            Delete
          </Button>
        </div>

        {/* Camera Capture UI */}
        {showCamera && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <NativeCameraCapture
              onPhotoCapture={handlePhotoCapture}
              onCancel={() => {
                haptics.light();
                setShowCamera(false);
              }}
              buttonText="Take Outfit Photo"
            />
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * Example Usage:
 *
 * <OutfitCardWithNativeFeatures
 *   outfitId="outfit-123"
 *   imageUrl="https://example.com/outfit.jpg"
 *   title="Summer Casual Look"
 *   description="Perfect for 75°F sunny days"
 *   isFavorite={false}
 *   onFavoriteToggle={() => toggleFavorite('outfit-123')}
 *   onDelete={() => deleteOutfit('outfit-123')}
 *   onPhotoUpdate={(url) => updateOutfitPhoto('outfit-123', url)}
 * />
 */

export default OutfitCardWithNativeFeatures;
