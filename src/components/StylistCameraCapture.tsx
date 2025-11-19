/**
 * Stylist Camera Capture
 * Photo upload for fashion advice - camera, gallery, or closet items
 */

import React, { useState } from 'react';
import { Camera as CameraIcon, Image as ImageIcon, X } from 'lucide-react';
import { Camera } from '@capacitor/camera';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import haptics from '../utils/haptics';

interface StylistCameraCaptureProps {
  onImageSelected: (imageUrl: string) => void;
  onClose: () => void;
}

const StylistCameraCapture: React.FC<StylistCameraCaptureProps> = ({ onImageSelected, onClose }) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleTakePhoto = async () => {
    try {
      setIsCapturing(true);
      haptics.light();

      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 80,
        allowEditing: false,
        correctOrientation: true
      });

      if (image.webPath) {
        onImageSelected(image.webPath);
        onClose();
      }
    } catch (error) {
      console.error('❌ [CAMERA] Error taking photo:', error);
      haptics.error();
    } finally {
      setIsCapturing(false);
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      setIsCapturing(true);
      haptics.light();

      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 80,
        allowEditing: false,
        correctOrientation: true
      });

      if (image.webPath) {
        onImageSelected(image.webPath);
        onClose();
      }
    } catch (error) {
      console.error('❌ [GALLERY] Error selecting photo:', error);
      haptics.error();
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClose = () => {
    haptics.light();
    onClose();
  };

  return (
    <div className="camera-capture-overlay" onClick={handleClose}>
      <div className="camera-capture-modal" onClick={(e) => e.stopPropagation()}>
        <div className="camera-capture-header">
          <h3>Add Photo</h3>
          <button onClick={handleClose} className="close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="camera-capture-options">
          <button
            onClick={handleTakePhoto}
            disabled={isCapturing}
            className="capture-option"
          >
            <CameraIcon size={32} />
            <span>Take Photo</span>
          </button>

          <button
            onClick={handleChooseFromGallery}
            disabled={isCapturing}
            className="capture-option"
          >
            <ImageIcon size={32} />
            <span>Photo Library</span>
          </button>

          <button
            onClick={handleClose}
            className="capture-option secondary"
          >
            <X size={32} />
            <span>Cancel</span>
          </button>
        </div>

        {isCapturing && (
          <div className="capturing-indicator">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StylistCameraCapture;
