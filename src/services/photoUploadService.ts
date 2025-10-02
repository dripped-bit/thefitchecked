/**
 * Photo Upload Service
 * Uploads photos to cloud storage and returns HTTP URLs for API usage
 */

export interface UploadedPhoto {
  url: string;
  deleteUrl?: string;
  filename: string;
  size: number;
}

export interface PhotoUploadResult {
  success: boolean;
  data?: UploadedPhoto;
  error?: string;
}

class PhotoUploadService {
  private readonly IMGBB_API_KEY = 'bdd8a78d5d3d5b5c7e2f1d8a9b4c6e3f'; // Free tier key
  private readonly IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

  /**
   * Upload a single photo and get HTTP URL
   */
  async uploadPhoto(dataUrl: string, filename: string = 'avatar-photo'): Promise<PhotoUploadResult> {
    try {
      console.log('📤 Uploading photo to cloud storage...', filename);

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('key', this.IMGBB_API_KEY);
      formData.append('image', blob, `${filename}.jpg`);
      formData.append('name', filename);

      // Upload to ImgBB
      const uploadResponse = await fetch(this.IMGBB_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      const result = await uploadResponse.json();

      if (!result.success) {
        throw new Error(`ImgBB API error: ${result.error?.message || 'Unknown error'}`);
      }

      const uploadedPhoto: UploadedPhoto = {
        url: result.data.url,
        deleteUrl: result.data.delete_url,
        filename: result.data.image.filename,
        size: result.data.size
      };

      console.log('✅ Photo uploaded successfully:', {
        url: uploadedPhoto.url,
        filename: uploadedPhoto.filename,
        size: `${Math.round(uploadedPhoto.size / 1024)}KB`
      });

      return {
        success: true,
        data: uploadedPhoto
      };

    } catch (error) {
      console.error('❌ Photo upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Upload multiple photos and get HTTP URLs
   */
  async uploadPhotos(photos: Array<{ dataUrl: string; filename: string }>): Promise<PhotoUploadResult[]> {
    console.log(`📤 Uploading ${photos.length} photos to cloud storage...`);

    const uploadPromises = photos.map((photo, index) =>
      this.uploadPhoto(photo.dataUrl, photo.filename || `photo-${index + 1}`)
    );

    const results = await Promise.all(uploadPromises);

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Photo upload complete: ${successCount}/${photos.length} successful`);

    return results;
  }

  /**
   * Upload captured photos from photo capture flow
   */
  async uploadCapturedPhotos(capturedPhotos: any[]): Promise<{ success: boolean; photos: any[]; errors: string[] }> {
    if (!capturedPhotos || capturedPhotos.length === 0) {
      return { success: false, photos: [], errors: ['No photos to upload'] };
    }

    console.log(`📤 Uploading ${capturedPhotos.length} captured photos...`);

    const uploadData = capturedPhotos.map((photo, index) => ({
      dataUrl: photo.dataUrl,
      filename: `avatar-${photo.view || photo.type || index + 1}`
    }));

    const results = await this.uploadPhotos(uploadData);
    const errors: string[] = [];
    const uploadedPhotos: any[] = [];

    results.forEach((result, index) => {
      if (result.success && result.data) {
        // Create updated photo object with HTTP URL
        const originalPhoto = capturedPhotos[index];
        const updatedPhoto = {
          ...originalPhoto,
          url: result.data.url,          // Add HTTP URL
          originalDataUrl: originalPhoto.dataUrl, // Keep original for backup
          uploadData: result.data        // Store upload metadata
        };
        uploadedPhotos.push(updatedPhoto);
      } else {
        errors.push(`Photo ${index + 1}: ${result.error || 'Upload failed'}`);
      }
    });

    return {
      success: uploadedPhotos.length > 0,
      photos: uploadedPhotos,
      errors
    };
  }

  /**
   * Get the best photo URL (HTTP URL preferred, fallback to data URL)
   */
  getPhotoUrl(photo: any): string | null {
    if (!photo) return null;

    // Prefer HTTP URL from upload
    if (photo.url && photo.url.startsWith('http')) {
      return photo.url;
    }

    // Fallback to data URL
    if (photo.dataUrl) {
      return photo.dataUrl;
    }

    // Last resort: original data URL
    if (photo.originalDataUrl) {
      return photo.originalDataUrl;
    }

    return null;
  }

  /**
   * Check if photo has HTTP URL (vs data URL)
   */
  hasHttpUrl(photo: any): boolean {
    return photo?.url && photo.url.startsWith('http');
  }

  /**
   * Cleanup uploaded photos (optional - for privacy)
   */
  async cleanupPhotos(photos: any[]): Promise<void> {
    const deletePromises = photos
      .filter(photo => photo.uploadData?.deleteUrl)
      .map(async (photo) => {
        try {
          await fetch(photo.uploadData.deleteUrl, { method: 'DELETE' });
          console.log('🗑️ Deleted uploaded photo:', photo.uploadData.filename);
        } catch (error) {
          console.warn('⚠️ Failed to delete photo:', error);
        }
      });

    await Promise.all(deletePromises);
  }
}

export const photoUploadService = new PhotoUploadService();
export default photoUploadService;