import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Camera as CameraIcon, Image as ImageIcon, X } from 'lucide-react';
import { Button, Actions, ActionsGroup, ActionsButton, ActionsLabel } from 'konsta/react';

/**
 * Native Camera Capture Component for TheFitChecked
 *
 * Uses Capacitor Camera plugin to access iOS native camera and photo library.
 * Handles permissions automatically and provides iOS-native UI.
 *
 * iOS Permissions Required in Info.plist:
 * - NSCameraUsageDescription
 * - NSPhotoLibraryUsageDescription
 * - NSPhotoLibraryAddUsageDescription (if saving photos)
 */

interface NativeCameraCaptureProps {
  onPhotoCapture: (photoUrl: string, photo: Photo) => void;
  onCancel?: () => void;
  buttonText?: string;
  showActionsSheet?: boolean;
}

export interface CapturedPhotoData {
  webPath?: string;
  base64?: string;
  format: string;
  saved: boolean;
}

const NativeCameraCapture: React.FC<NativeCameraCaptureProps> = ({
  onPhotoCapture,
  onCancel,
  buttonText = 'Take Photo',
  showActionsSheet = true
}) => {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  /**
   * Take photo using device camera
   */
  const takePhoto = async () => {
    try {
      setIsCapturing(true);
      setError(null);

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true, // iOS native photo editor
        resultType: CameraResultType.Uri, // Get file URI (faster, less memory)
        source: CameraSource.Camera,
        width: 1920, // Max width for outfit photos
        height: 1920,
        correctOrientation: true, // Auto-rotate based on device orientation
        saveToGallery: false, // Don't save to gallery automatically
      });

      if (photo.webPath) {
        onPhotoCapture(photo.webPath, photo);
      }
    } catch (err: any) {
      console.error('Camera error:', err);

      // Handle specific error cases
      if (err.message?.includes('cancelled') || err.message?.includes('cancel')) {
        // User cancelled - not really an error
        setError(null);
      } else if (err.message?.includes('permission')) {
        setError('Camera permission denied. Please enable camera access in Settings.');
      } else {
        setError('Failed to take photo. Please try again.');
      }
    } finally {
      setIsCapturing(false);
      setActionsOpen(false);
    }
  };

  /**
   * Pick photo from device photo library
   */
  const pickPhoto = async () => {
    try {
      setIsCapturing(true);
      setError(null);

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos, // Photo library
        width: 1920,
        height: 1920,
        correctOrientation: true,
      });

      if (photo.webPath) {
        onPhotoCapture(photo.webPath, photo);
      }
    } catch (err: any) {
      console.error('Photo picker error:', err);

      if (err.message?.includes('cancelled') || err.message?.includes('cancel')) {
        setError(null);
      } else if (err.message?.includes('permission')) {
        setError('Photo library access denied. Please enable in Settings.');
      } else {
        setError('Failed to select photo. Please try again.');
      }
    } finally {
      setIsCapturing(false);
      setActionsOpen(false);
    }
  };

  /**
   * Request camera permissions (useful for checking before opening camera)
   */
  const checkPermissions = async () => {
    try {
      const permissions = await Camera.checkPermissions();
      console.log('Camera permissions:', permissions);

      if (permissions.camera === 'denied' || permissions.photos === 'denied') {
        // Request permissions
        const requested = await Camera.requestPermissions();
        return requested.camera === 'granted' && requested.photos === 'granted';
      }

      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (err) {
      console.error('Permission check error:', err);
      return false;
    }
  };

  const handleOpenCamera = async () => {
    if (isNative && showActionsSheet) {
      // Show iOS action sheet on native
      setActionsOpen(true);
    } else {
      // Directly open camera on web
      await takePhoto();
    }
  };

  return (
    <div className="w-full">
      {/* Main Button */}
      <Button
        rounded
        large
        onClick={handleOpenCamera}
        disabled={isCapturing}
        className="w-full"
      >
        {isCapturing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
            Capturing...
          </>
        ) : (
          <span>Open Camera</span>
        )}
      </Button>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <X className="text-red-500 mt-0.5 mr-2 flex-shrink-0" size={18} />
          <div className="flex-1">
            <p className="text-red-800 text-sm">{error}</p>
            {error.includes('Settings') && (
              <button
                onClick={() => {
                  // On iOS, this would open Settings app
                  if (Capacitor.getPlatform() === 'ios') {
                    // Capacitor doesn't have direct settings link, but you can guide users
                    alert('Please go to Settings > TheFitChecked > Camera/Photos to enable access.');
                  }
                }}
                className="text-red-600 underline text-sm mt-1"
              >
                Open Settings
              </button>
            )}
          </div>
        </div>
      )}

      {/* iOS Action Sheet */}
      {isNative && (
        <Actions
          opened={actionsOpen}
          onBackdropClick={() => setActionsOpen(false)}
          className="pb-8"
        >
          <ActionsGroup>
            <ActionsButton
              onClick={takePhoto}
              bold
            >
              <div className="flex items-center justify-center gap-2 w-full">
                <CameraIcon size={20} />
                <span>Take Photo</span>
              </div>
            </ActionsButton>
            <ActionsButton onClick={pickPhoto}>
              <div className="flex items-center justify-center gap-2 w-full">
                <ImageIcon size={20} />
                <span>Choose from Library</span>
              </div>
            </ActionsButton>
          </ActionsGroup>
          <ActionsGroup>
            <ActionsButton
              onClick={() => {
                setActionsOpen(false);
                onCancel?.();
              }}
              colors={{ text: 'text-red-500' }}
            >
              <div className="flex items-center justify-center w-full">
                <span>Cancel</span>
              </div>
            </ActionsButton>
          </ActionsGroup>
        </Actions>
      )}
    </div>
  );
};

/**
 * Camera Utilities Hook
 *
 * Provides camera utility functions for use throughout the app
 */
export const useCameraUtils = () => {
  const checkPermissions = async () => {
    try {
      const permissions = await Camera.checkPermissions();
      return {
        camera: permissions.camera,
        photos: permissions.photos,
        granted: permissions.camera === 'granted' && permissions.photos === 'granted'
      };
    } catch (err) {
      console.error('Permission check error:', err);
      return { camera: 'denied', photos: 'denied', granted: false };
    }
  };

  const requestPermissions = async () => {
    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (err) {
      console.error('Permission request error:', err);
      return false;
    }
  };

  const quickPhoto = async (source: CameraSource = CameraSource.Camera): Promise<Photo | null> => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source,
        width: 1920,
        height: 1920,
        correctOrientation: true,
      });
      return photo;
    } catch (err) {
      console.error('Quick photo error:', err);
      return null;
    }
  };

  return {
    checkPermissions,
    requestPermissions,
    quickPhoto,
  };
};

export default NativeCameraCapture;
