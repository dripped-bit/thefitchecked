import { supabase } from './supabaseClient';

/**
 * Get optimized image URL with automatic resizing and WebP conversion
 * @param bucket - Storage bucket name ('wardrobe', 'avatars', etc.)
 * @param path - Image path in storage
 * @param size - Size preset: 'thumbnail' (150x150), 'medium' (400x400), 'large' (800x800)
 * @returns Optimized image URL with WebP format and specified dimensions
 */
export function getOptimizedImageUrl(
  bucket: string,
  path: string,
  size: 'thumbnail' | 'medium' | 'large' = 'medium'
): string {
  if (!path) return '';

  const sizes = {
    thumbnail: { width: 150, height: 150 },
    medium: { width: 400, height: 400 },
    large: { width: 800, height: 800 },
  };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: {
      ...sizes[size],
      resize: 'cover',
      quality: 80,
      format: 'webp' as any, // Supabase supports webp but TS types may be outdated
    },
  });

  return data.publicUrl;
}

/**
 * Upload image to Supabase Storage
 * @param bucket - Storage bucket name ('wardrobe', 'avatars', etc.)
 * @param userId - User ID for folder organization
 * @param file - File to upload
 * @param folder - Optional subfolder name (e.g., 'tops', 'outfits')
 * @returns Object with image path and optimized URL
 */
export async function uploadImage(
  bucket: string,
  userId: string,
  file: File,
  folder = ''
): Promise<{ path: string; url: string }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  const filePath = folder 
    ? `${userId}/${folder}/${fileName}` 
    : `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  return {
    path: data.path,
    url: getOptimizedImageUrl(bucket, data.path, 'medium'),
  };
}

/**
 * Upload multiple images at once
 * @param bucket - Storage bucket name
 * @param userId - User ID
 * @param files - Array of files to upload
 * @param folder - Optional subfolder
 * @returns Array of uploaded image data
 */
export async function uploadMultipleImages(
  bucket: string,
  userId: string,
  files: File[],
  folder = ''
): Promise<Array<{ path: string; url: string }>> {
  const uploadPromises = files.map((file) =>
    uploadImage(bucket, userId, file, folder)
  );

  return Promise.all(uploadPromises);
}

/**
 * Delete image from storage
 * @param bucket - Storage bucket name
 * @param path - Image path to delete
 */
export async function deleteImage(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

/**
 * Delete multiple images at once
 * @param bucket - Storage bucket name
 * @param paths - Array of image paths to delete
 */
export async function deleteMultipleImages(
  bucket: string,
  paths: string[]
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    console.error('Delete multiple error:', error);
    throw error;
  }
}

/**
 * Get public URL without optimization (for downloads)
 * @param bucket - Storage bucket name
 * @param path - Image path
 * @returns Public URL
 */
export function getPublicImageUrl(bucket: string, path: string): string {
  if (!path) return '';

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Get multiple optimized URLs at once
 * @param bucket - Storage bucket name
 * @param paths - Array of image paths
 * @param size - Size preset
 * @returns Array of optimized URLs
 */
export function getOptimizedImageUrls(
  bucket: string,
  paths: string[],
  size: 'thumbnail' | 'medium' | 'large' = 'medium'
): string[] {
  return paths.map(path => getOptimizedImageUrl(bucket, path, size));
}

/**
 * Check if a path needs optimization or is already a full URL
 * @param imageSource - Image path or URL
 * @returns true if it's a storage path that needs optimization
 */
export function isStoragePath(imageSource: string): boolean {
  return !imageSource.startsWith('http://') && !imageSource.startsWith('https://');
}

/**
 * Smart image URL getter - handles both paths and full URLs
 * @param bucket - Storage bucket name
 * @param imageSource - Image path or full URL
 * @param size - Size preset
 * @returns Optimized URL or original URL if already a full URL
 */
export function getSmartImageUrl(
  bucket: string,
  imageSource: string,
  size: 'thumbnail' | 'medium' | 'large' = 'medium'
): string {
  if (!imageSource) return '';
  
  if (isStoragePath(imageSource)) {
    return getOptimizedImageUrl(bucket, imageSource, size);
  }
  
  return imageSource;
}
