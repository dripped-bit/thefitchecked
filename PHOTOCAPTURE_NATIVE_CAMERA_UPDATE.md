# PhotoCaptureFlow.tsx - Native Camera Integration

## Current Implementation
- Uses HTML `<input type="file">` with `capture="environment"`
- Works on mobile web but not truly native
- No iOS-specific features (editing, better quality)

## Updated Implementation
- Uses Capacitor Camera plugin
- Native iOS camera and photo library
- Built-in iOS photo editor
- Automatic orientation correction
- Better quality and permissions handling

---

## Changes Made

### 1. Added Import
```tsx
import NativeCameraCapture from './NativeCameraCapture';
import { Photo } from '@capacitor/camera';
```

### 2. Removed HTML File Inputs
- Removed `cameraInputRef` and `photoLibraryInputRef`
- Removed hidden file input elements
- Removed `handleFileSelect` function

### 3. Added Native Camera Handler
```tsx
const handleNativePhotoCapture = async (photoUrl: string, photo: Photo) => {
  setUploadError(null);
  setUploadProgress('Processing photo...');

  try {
    // Convert photo URI to blob for upload
    const response = await fetch(photoUrl);
    const blob = await response.blob();
    const file = new File([blob], `avatar-photo-${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });

    // Convert to base64 for display and upload
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;

      // Upload to Supabase
      setUploadProgress('Uploading to cloud storage...');
      let uploadResult;
      try {
        uploadResult = await photoUploadService.uploadPhoto(
          imageData,
          `avatar-${photoStep.view}`,
          'camera'
        );

        if (!uploadResult.success) {
          console.warn('⚠️ Cloud upload failed:', uploadResult.error);
          setUploadError(`Cloud storage unavailable. Photo saved locally.`);
        }
      } catch (error) {
        console.error('❌ Upload error:', error);
        setUploadError('Cloud storage unavailable. Photo saved locally.');
      }

      setUploadProgress('Processing photo...');

      const newCapturedPhoto: CapturedPhoto = {
        id: `${photoStep.id}_${Date.now()}`,
        view: photoStep.view,
        type: photoStep.type,
        dataUrl: imageData,
        timestamp: Date.now(),
        file: file
      };

      setCapturedPhoto(newCapturedPhoto);
      haptics.success();
      console.log('📸 Native photo captured:', photo);

      // Validate photo
      await validatePhoto(imageData);
    };
    reader.readAsDataURL(blob);
  } catch (error) {
    console.error('❌ Failed to process native photo:', error);
    setUploadError('Failed to process photo. Please try again.');
    setUploadProgress(null);
  }
};
```

### 4. Replaced Button Implementation
```tsx
{!capturedPhoto ? (
  <NativeCameraCapture
    onPhotoCapture={handleNativePhotoCapture}
    buttonText="Take Photo or Choose from Library"
    showActionsSheet={true}
  />
) : (
  // Continue button
)}
```

---

## Full Updated File

See below for complete implementation.
