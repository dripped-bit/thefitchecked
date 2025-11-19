import React, { useState } from 'react';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from 'konsta/react';
import haptics from '../utils/haptics';

/**
 * Native Share Button Component for TheFitChecked
 *
 * Uses Capacitor Share plugin to open iOS native share sheet.
 * Automatically falls back to web share API or clipboard copy on non-native platforms.
 *
 * iOS Capabilities:
 * - Share to Messages, Mail, Instagram, etc.
 * - Share images with text
 * - Share URLs
 * - No Info.plist permissions needed for basic sharing
 */

interface NativeShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  imageUrl?: string;
  dialogTitle?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'clear';
  onShareSuccess?: () => void;
  onShareError?: (error: Error) => void;
  className?: string;
}

const NativeShareButton: React.FC<NativeShareButtonProps> = ({
  title = 'Check out this outfit!',
  text = 'I created this outfit on TheFitChecked',
  url,
  imageUrl,
  dialogTitle = 'Share this outfit',
  buttonText = 'Share',
  buttonVariant = 'default',
  onShareSuccess,
  onShareError,
  className = '',
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const isNative = Capacitor.isNativePlatform();
  const canShare = typeof navigator !== 'undefined' &&
    (navigator.share || isNative);

  /**
   * Share using Capacitor native share or Web Share API
   */
  const handleShare = async () => {
    try {
      setIsSharing(true);
      haptics.light();

      // Prepare share data
      const shareData: any = {
        title,
        text,
        url,
        dialogTitle, // iOS specific - title of share sheet
      };

      // If we have an image URL, we need to fetch it as a blob for native sharing
      if (imageUrl) {
        if (isNative) {
          // On native, we can share the URL directly
          shareData.url = imageUrl;
          shareData.files = [imageUrl];
        } else {
          // On web, we might need to handle differently
          shareData.url = imageUrl;
        }
      }

      // Use Capacitor Share on native platforms
      if (isNative) {
        const result = await Share.share(shareData);

        if (result.activityType) {
          console.log('Shared via:', result.activityType);
          haptics.success();
          onShareSuccess?.();
        }
      }
      // Use Web Share API on web
      else if (navigator.share) {
        // Web Share API
        const webShareData: ShareData = {
          title,
          text,
          url: url || imageUrl,
        };

        await navigator.share(webShareData);
        haptics.success();
        onShareSuccess?.();
      }
    } catch (err: any) {
      console.error('Share error:', err);

      // User cancelled is not really an error
      if (err.message?.includes('cancelled') || err.message?.includes('cancel')) {
        console.log('Share cancelled by user');
      } else {
        haptics.error();
        onShareError?.(err);
      }
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Fallback: Copy to clipboard
   */
  const handleCopyToClipboard = async () => {
    try {
      const textToCopy = url || imageUrl || text;

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        haptics.success();

        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Clipboard error:', err);
      haptics.error();
    }
  };

  /**
   * Check if share is available
   */
  const canShareContent = async (): Promise<boolean> => {
    try {
      if (isNative) {
        const result = await Share.canShare();
        return result.value;
      }
      return !!navigator.share;
    } catch (err) {
      return false;
    }
  };

  // If sharing is not available, show copy button instead
  if (!canShare) {
    return (
      <Button
        rounded
        outline={buttonVariant === 'outline'}
        clear={buttonVariant === 'clear'}
        onClick={handleCopyToClipboard}
        className={className}
      >
        {copied ? (
          <>
            <Check className="mr-2" size={18} />
            Copied!
          </>
        ) : (
          <>
            <Copy className="mr-2" size={18} />
            Copy Link
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      rounded
      outline={buttonVariant === 'outline'}
      clear={buttonVariant === 'clear'}
      onClick={handleShare}
      disabled={isSharing}
      className={className}
    >
      {isSharing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
          Sharing...
        </>
      ) : (
        <>
          <Share2 className="mr-2" size={18} />
          {buttonText}
        </>
      )}
    </Button>
  );
};

/**
 * Share Utilities Hook
 *
 * Provides share utility functions for use throughout the app
 */
export const useShare = () => {
  const isNative = Capacitor.isNativePlatform();

  const shareOutfit = async (outfitData: {
    imageUrl: string;
    title?: string;
    description?: string;
  }) => {
    try {
      haptics.light();

      const shareData = {
        title: outfitData.title || 'Check out this outfit!',
        text: outfitData.description || 'I created this outfit on TheFitChecked',
        url: outfitData.imageUrl,
        dialogTitle: 'Share Outfit',
      };

      if (isNative) {
        await Share.share(shareData);
        haptics.success();
        return true;
      } else if (navigator.share) {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        });
        haptics.success();
        return true;
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(outfitData.imageUrl);
        haptics.success();
        return true;
      }
    } catch (err: any) {
      if (!err.message?.includes('cancel')) {
        console.error('Share outfit error:', err);
        haptics.error();
      }
      return false;
    }
  };

  const canShare = async (): Promise<boolean> => {
    try {
      if (isNative) {
        const result = await Share.canShare();
        return result.value;
      }
      return !!navigator.share;
    } catch (err) {
      return false;
    }
  };

  return {
    shareOutfit,
    canShare,
  };
};

/**
 * Example Usage in Outfit Card:
 *
 * import NativeShareButton from './NativeShareButton';
 *
 * <NativeShareButton
 *   title="My Summer Outfit"
 *   text="Check out this outfit I created on TheFitChecked!"
 *   imageUrl={outfitImageUrl}
 *   url={`https://thefitchecked.com/outfits/${outfitId}`}
 *   buttonText="Share Outfit"
 *   onShareSuccess={() => console.log('Shared!')}
 * />
 */

export default NativeShareButton;
