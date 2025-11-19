# Image Optimization Utilities

Comprehensive guide for using the new image optimization utilities in fit-checked-app.

## Overview

The `imageUtils.ts` service provides optimized image handling with automatic WebP conversion, resizing, and efficient storage operations. This complements existing image services without replacing them.

## Features

✅ **Automatic WebP Conversion** - 30-50% smaller file sizes
✅ **Smart Resizing** - Three size presets (thumbnail, medium, large)
✅ **Quality Optimization** - 80% quality for optimal balance
✅ **Batch Operations** - Upload/delete multiple images
✅ **Type-Safe** - Full TypeScript support
✅ **Error Handling** - Comprehensive logging
✅ **Flexible** - Works with both paths and full URLs

## Size Presets

| Size | Dimensions | Use Case |
|------|-----------|----------|
| `thumbnail` | 150×150px | List views, thumbnails, gallery grids |
| `medium` | 400×400px | Detail views, card displays |
| `large` | 800×800px | Full-screen views, lightbox |

## Core Functions

### 1. Get Optimized Image URL

```typescript
import { getOptimizedImageUrl } from '@/services/imageUtils';

// Get optimized URL from storage path
const url = getOptimizedImageUrl('wardrobe', 'user123/tops/shirt.jpg', 'medium');
// Returns: https://...supabase.co/.../shirt.jpg?width=400&height=400&format=webp
```

**Parameters:**
- `bucket` - Storage bucket name ('wardrobe', 'avatars', etc.)
- `path` - Image path in storage (not full URL)
- `size` - 'thumbnail' | 'medium' | 'large' (default: 'medium')

**Returns:** Optimized image URL with WebP format

### 2. Upload Single Image

```typescript
import { uploadImage } from '@/services/imageUtils';
import { supabase } from '@/services/supabaseClient';

async function handleUpload(file: File) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const { path, url } = await uploadImage(
      'wardrobe',      // bucket
      user.id,         // userId
      file,            // File object
      'tops'           // optional folder
    );

    console.log('Path:', path);  // user123/tops/abc123.jpg
    console.log('URL:', url);    // Optimized medium URL

    // Save to database
    await supabase.from('clothing_items').insert({
      user_id: user.id,
      image_path: path,  // Store path, not URL
      name: 'New Shirt',
      category: 'tops'
    });

  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### 3. Upload Multiple Images

```typescript
import { uploadMultipleImages } from '@/services/imageUtils';

async function handleBatchUpload(files: File[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const results = await uploadMultipleImages(
      'wardrobe',
      user.id,
      files,
      'outfits'
    );

    console.log(`Uploaded ${results.length} images`);

    // Save all to database
    const items = results.map(result => ({
      user_id: user.id,
      image_path: result.path,
      name: 'New Item',
      category: 'tops'
    }));

    await supabase.from('clothing_items').insert(items);

  } catch (error) {
    console.error('Batch upload failed:', error);
  }
}
```

### 4. Delete Images

```typescript
import { deleteImage, deleteMultipleImages } from '@/services/imageUtils';

// Delete single image
async function handleDelete(path: string) {
  try {
    await deleteImage('wardrobe', path);
    console.log('Deleted successfully');
  } catch (error) {
    console.error('Delete failed:', error);
  }
}

// Delete multiple images
async function handleBatchDelete(paths: string[]) {
  try {
    await deleteMultipleImages('wardrobe', paths);
    console.log('All deleted');
  } catch (error) {
    console.error('Batch delete failed:', error);
  }
}
```

### 5. Smart Image URL (Handles Both Paths and URLs)

```typescript
import { getSmartImageUrl } from '@/services/imageUtils';

// Works with storage paths
const url1 = getSmartImageUrl('wardrobe', 'user123/shirt.jpg', 'thumbnail');
// Returns optimized URL

// Works with full URLs (returns unchanged)
const url2 = getSmartImageUrl('wardrobe', 'https://example.com/image.jpg', 'thumbnail');
// Returns: https://example.com/image.jpg (no optimization)

// Use in components
<img src={getSmartImageUrl('wardrobe', item.image_source, 'medium')} />
```

### 6. Get Multiple Optimized URLs

```typescript
import { getOptimizedImageUrls } from '@/services/imageUtils';

const paths = ['user/shirt.jpg', 'user/pants.jpg', 'user/shoes.jpg'];
const urls = getOptimizedImageUrls('wardrobe', paths, 'thumbnail');

// Returns array of optimized URLs
urls.forEach(url => console.log(url));
```

## Component Integration Examples

### Example 1: Wardrobe Item Card

```typescript
import { getOptimizedImageUrl } from '@/services/imageUtils';

interface WardrobeItemCardProps {
  item: {
    id: string;
    name: string;
    image_path: string;
    category: string;
  };
}

function WardrobeItemCard({ item }: WardrobeItemCardProps) {
  return (
    <div className="card">
      <img
        src={getOptimizedImageUrl('wardrobe', item.image_path, 'thumbnail')}
        alt={item.name}
        className="w-full h-40 object-cover rounded"
        loading="lazy"
      />
      <h3>{item.name}</h3>
      <span>{item.category}</span>
    </div>
  );
}
```

### Example 2: Image Upload Component

```typescript
import { useState } from 'react';
import { uploadImage } from '@/services/imageUtils';
import { supabase } from '@/services/supabaseClient';

function ImageUploader() {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please login first');
      return;
    }

    setUploading(true);

    try {
      const { path, url } = await uploadImage('wardrobe', user.id, file, 'tops');

      // Save to database
      await supabase.from('clothing_items').insert({
        user_id: user.id,
        image_path: path,
        name: file.name,
        category: 'tops'
      });

      alert('Upload successful!');
      console.log('Preview URL:', url);

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

### Example 3: Calendar Event with Outfit Image

```typescript
import { getOptimizedImageUrl } from '@/services/imageUtils';
import { CalendarEvent } from '@/hooks/useCalendar';

function CalendarEventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="event-card">
      {event.outfit_image_url && (
        <img
          src={getOptimizedImageUrl('wardrobe', event.outfit_image_url, 'medium')}
          alt="Outfit"
          className="w-20 h-20 object-cover rounded"
        />
      )}
      <div>
        <h3>{event.title}</h3>
        <p>{new Date(event.start_time).toLocaleString()}</p>
        {event.location && <p>📍 {event.location}</p>}
      </div>
    </div>
  );
}
```

### Example 4: Image Gallery with Multiple Sizes

```typescript
import { getOptimizedImageUrl } from '@/services/imageUtils';
import { useState } from 'react';

interface GalleryProps {
  images: Array<{ id: string; path: string; name: string }>;
}

function ImageGallery({ images }: GalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-4 gap-2">
        {images.map(image => (
          <img
            key={image.id}
            src={getOptimizedImageUrl('wardrobe', image.path, 'thumbnail')}
            alt={image.name}
            className="w-full h-24 object-cover cursor-pointer rounded"
            onClick={() => setSelectedImage(image.path)}
          />
        ))}
      </div>

      {/* Lightbox with Large Image */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center">
          <img
            src={getOptimizedImageUrl('wardrobe', selectedImage, 'large')}
            alt="Full size"
            className="max-w-screen-lg max-h-screen object-contain"
            onClick={() => setSelectedImage(null)}
          />
        </div>
      )}
    </>
  );
}
```

## Database Pattern Recommendations

### Option 1: Store Paths (Recommended)

**Database Schema:**
```typescript
interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  image_path: string;  // Store path only
  thumbnail_path?: string;  // Optional separate thumbnail
}
```

**Usage:**
```typescript
// Retrieve from database
const item = await supabase.from('clothing_items').select('*').single();

// Generate optimized URL on-demand
<img src={getOptimizedImageUrl('wardrobe', item.image_path, 'medium')} />
```

**Benefits:**
- ✅ Flexible - Change optimization settings anytime
- ✅ Dynamic - URLs regenerated with latest settings
- ✅ Portable - Easy bucket migrations
- ✅ Cacheable - Better CDN control

### Option 2: Store Full URLs (Current Pattern)

**Database Schema:**
```typescript
interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  image_url: string;  // Full URL
  thumbnail_url?: string;
}
```

**Usage:**
```typescript
// Use URL directly
<img src={item.image_url} />
```

**Benefits:**
- ✅ Simple - Direct usage
- ✅ Backward compatible

**Note:** Both patterns work! You can use `getSmartImageUrl()` to handle either.

## Migration Guide

### Gradual Migration Strategy

No immediate changes required. Migrate components gradually:

#### Step 1: Start Using for New Uploads

```typescript
// New uploads use imageUtils
const { path } = await uploadImage('wardrobe', userId, file);
// Save 'path' to database
```

#### Step 2: Update Display Components

```typescript
// Before
<img src={item.image_url} />

// After (handles both URL and path)
import { getSmartImageUrl } from '@/services/imageUtils';
<img src={getSmartImageUrl('wardrobe', item.image_url || item.image_path, 'medium')} />
```

#### Step 3: Optional Database Migration

Only if you want to fully adopt path-based storage:

```sql
-- Add new columns
ALTER TABLE clothing_items ADD COLUMN image_path TEXT;
ALTER TABLE clothing_items ADD COLUMN thumbnail_path TEXT;

-- Extract paths from URLs (if needed)
UPDATE clothing_items 
SET image_path = REGEXP_REPLACE(image_url, '^https://[^/]+/storage/v1/object/public/[^/]+/', '')
WHERE image_url IS NOT NULL;
```

## Performance Benefits

### WebP Conversion
- **JPEG/PNG:** ~500KB typical file
- **WebP:** ~200KB (60% reduction)
- **Savings:** Faster load times, lower bandwidth costs

### Smart Caching
```typescript
// Images cached for 1 hour by default
transform: {
  width: 400,
  height: 400,
  format: 'webp',
  quality: 80,
}
```

### Lazy Loading Example
```typescript
<img
  src={getOptimizedImageUrl('wardrobe', item.image_path, 'thumbnail')}
  alt={item.name}
  loading="lazy"  // Browser-native lazy loading
  className="w-32 h-32"
/>
```

## Existing Services Comparison

| Service | Purpose | When to Use |
|---------|---------|-------------|
| **imageUtils.ts** ✨ NEW | Optimized display & storage | Display images, uploads, downloads |
| **imageUploadService.ts** | FASHN API processing | Virtual try-on, AI features |
| **photoUploadService.ts** | Full photo management | User photos with metadata tracking |

## Storage Buckets

Your project uses these buckets:
- `wardrobe` - Clothing item images
- `avatars` - User avatar images
- `user-photos` - General user photos

## Troubleshooting

### Issue: Images not loading

**Check:**
1. Bucket name is correct
2. Path doesn't include bucket name
3. RLS policies allow public access

```typescript
// ❌ Wrong
getOptimizedImageUrl('wardrobe', 'wardrobe/user/shirt.jpg', 'medium')

// ✅ Correct
getOptimizedImageUrl('wardrobe', 'user/shirt.jpg', 'medium')
```

### Issue: Upload fails

**Check:**
1. User is authenticated
2. Bucket exists and is accessible
3. File size within limits
4. File type is supported

```typescript
try {
  const { path, url } = await uploadImage('wardrobe', userId, file);
} catch (error) {
  console.error('Upload error:', error);
  // Check error message for specific issue
}
```

### Issue: WebP not supported (rare)

Modern browsers support WebP (95%+ coverage). For old browsers, Supabase fallbacks to original format.

## Best Practices

1. **Always store paths, not URLs** (when possible)
2. **Use thumbnail size for lists** (faster loading)
3. **Use medium for detail views** (good balance)
4. **Use large for full-screen** (max quality)
5. **Enable lazy loading** for images below fold
6. **Batch operations** when handling multiple images
7. **Error handling** on all upload/delete operations

## TypeScript Support

All functions are fully typed:

```typescript
import { 
  getOptimizedImageUrl,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getPublicImageUrl,
  getSmartImageUrl,
  isStoragePath
} from '@/services/imageUtils';

// TypeScript will validate parameters
const url: string = getOptimizedImageUrl('wardrobe', 'path/to/image.jpg', 'medium');
```

## Additional Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Image Transformation Guide](https://supabase.com/docs/guides/storage/serving/image-transformations)
- [WebP Format Guide](https://developers.google.com/speed/webp)

## Support

For issues or questions:
1. Check this documentation
2. Review existing services (photoUploadService.ts)
3. Check Supabase dashboard for storage settings
4. Verify RLS policies on storage buckets

---

**Created:** November 18, 2025  
**Status:** ✅ Ready to Use
