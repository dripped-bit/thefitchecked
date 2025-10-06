/**
 * Photo Upload Service
 * Handles uploading photos to Supabase Storage and tracking in database
 */

import { supabase } from './supabaseClient';
import authService from './authService';

export interface UploadedPhoto {
  url: string;
  uploadId?: string;
  filename: string;
  size: number;
}

export interface PhotoUploadResult {
  success: boolean;
  data?: UploadedPhoto;
  error?: string;
}

export interface PhotoMetadata {
  width: number;
  height: number;
  fileSize: number;
}

class PhotoUploadService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly STORAGE_BUCKET = 'user-photos';

  /**
   * Detect if user is on mobile device
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Get device type string
   */
  private getDeviceType(): 'mobile' | 'desktop' {
    return this.isMobile() ? 'mobile' : 'desktop';
  }

  /**
   * Get image dimensions from file
   */
  private getImageDimensions(dataUrl: string): Promise<PhotoMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          fileSize: 0 // Will be set from file object
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = dataUrl;
    });
  }

  /**
   * Upload a single photo and get HTTP URL
   */
  async uploadPhoto(
    dataUrl: string,
    filename: string = 'avatar-photo',
    uploadMethod: 'camera' | 'photo_library' | 'file' = 'file'
  ): Promise<PhotoUploadResult> {
    try {
      console.log('📤 [PHOTO-UPLOAD] Uploading photo to Supabase Storage...', filename);

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${filename}.jpg`, { type: 'image/jpeg' });

      // Check file size
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: 'Image must be under 5MB. Please choose a smaller file.'
        };
      }

      // Get authenticated user
      const user = await authService.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'You must be logged in to upload photos.'
        };
      }

      // Get image dimensions
      const metadata = await this.getImageDimensions(dataUrl);
      metadata.fileSize = file.size;

      // Generate unique filename
      const fileExt = filename.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log(`📤 [PHOTO-UPLOAD] Uploading to Storage: ${fileName}`);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [PHOTO-UPLOAD] Storage upload error:', uploadError);
        return {
          success: false,
          error: 'Upload failed. Please try again.'
        };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(fileName);

      console.log(`✅ [PHOTO-UPLOAD] Uploaded to Storage: ${publicUrl}`);

      // Save metadata to database
      const { data: dbData, error: dbError } = await supabase
        .from('user_uploads')
        .insert({
          user_id: user.id,
          avatar_url: publicUrl,
          upload_method: uploadMethod,
          device_type: this.getDeviceType(),
          user_agent: navigator.userAgent,
          image_width: metadata.width,
          image_height: metadata.height,
          file_size: metadata.fileSize
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ [PHOTO-UPLOAD] Database insert error:', dbError);
        // Storage upload succeeded but DB insert failed - still return success with URL
      }

      console.log(`✅ [PHOTO-UPLOAD] Upload complete:`, dbData?.id);

      return {
        success: true,
        data: {
          url: publicUrl,
          uploadId: dbData?.id,
          filename: fileName,
          size: file.size
        }
      };

    } catch (error) {
      console.error('❌ [PHOTO-UPLOAD] Upload failed:', error);
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
          uploadId: result.data.uploadId, // Add database record ID
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
   * Delete uploaded photo from storage and database
   */
  async deleteUpload(uploadId: string): Promise<boolean> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        console.error('❌ [PHOTO-UPLOAD] User not authenticated');
        return false;
      }

      // Get upload record
      const { data: upload, error: fetchError } = await supabase
        .from('user_uploads')
        .select('avatar_url')
        .eq('id', uploadId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !upload) {
        console.error('❌ [PHOTO-UPLOAD] Upload not found:', fetchError);
        return false;
      }

      // Extract file path from URL
      const urlParts = upload.avatar_url.split(`/${this.STORAGE_BUCKET}/`);
      if (urlParts.length !== 2) {
        console.error('❌ [PHOTO-UPLOAD] Invalid URL format');
        return false;
      }
      const filePath = urlParts[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([filePath]);

      if (storageError) {
        console.error('❌ [PHOTO-UPLOAD] Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_uploads')
        .delete()
        .eq('id', uploadId)
        .eq('user_id', user.id);

      if (dbError) {
        console.error('❌ [PHOTO-UPLOAD] Database delete error:', dbError);
        return false;
      }

      console.log(`🗑️ [PHOTO-UPLOAD] Deleted upload: ${uploadId}`);
      return true;

    } catch (error) {
      console.error('❌ [PHOTO-UPLOAD] Delete failed:', error);
      return false;
    }
  }

  /**
   * Cleanup uploaded photos (for privacy)
   */
  async cleanupPhotos(photos: any[]): Promise<void> {
    const deletePromises = photos
      .filter(photo => photo.uploadId)
      .map(async (photo) => {
        try {
          await this.deleteUpload(photo.uploadId);
          console.log('🗑️ Deleted uploaded photo:', photo.uploadId);
        } catch (error) {
          console.warn('⚠️ Failed to delete photo:', error);
        }
      });

    await Promise.all(deletePromises);
  }

  /**
   * Get user's upload history
   */
  async getUserUploads(limit: number = 10): Promise<any[]> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [PHOTO-UPLOAD] Failed to fetch uploads:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ [PHOTO-UPLOAD] Failed to fetch uploads:', error);
      return [];
    }
  }
}

export const photoUploadService = new PhotoUploadService();
export default photoUploadService;
