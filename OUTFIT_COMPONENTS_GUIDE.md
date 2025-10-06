# Outfit Components Usage Guide

Complete guide for using the OutfitCard and OutfitGallery components with all advanced features.

## 📦 Components Created

### 1. **OutfitCard.tsx** - Individual Outfit Display
- ✅ Favoriting with heart icon
- ✅ 5-star rating system
- ✅ Share link generation
- ✅ Color palette display
- ✅ Weather info
- ✅ Action menu (add to collection, view details, shop similar)
- ✅ Responsive design
- ✅ Hover effects and animations

### 2. **OutfitGallery.tsx** - Outfit Collection View
- ✅ Grid and list view modes
- ✅ Filter by: All, Favorites, Top Rated, Recent
- ✅ Search by occasion, style, or prompt
- ✅ Filter by occasion dropdown
- ✅ Filter by color (10 popular colors)
- ✅ Clear filters option
- ✅ Loading states
- ✅ Empty states

---

## 🚀 Basic Usage

### Display Single Outfit

```typescript
import OutfitCard from '@/components/OutfitCard';
import { outfitStorageService } from '@/services/outfitStorageService';

function MyComponent() {
  const [outfit, setOutfit] = useState(null);
  const userId = 'user@example.com';

  useEffect(() => {
    loadOutfit();
  }, []);

  async function loadOutfit() {
    const outfits = await outfitStorageService.getUserOutfits(userId);
    setOutfit(outfits[0]);
  }

  return (
    <div className="max-w-sm">
      <OutfitCard
        outfit={outfit}
        userId={userId}
        onUpdate={(updated) => setOutfit(updated)}
      />
    </div>
  );
}
```

### Display Outfit Gallery

```typescript
import OutfitGallery from '@/components/OutfitGallery';

function MyOutfitsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OutfitGallery
        initialFilter="all"
        showFilters={true}
        compact={false}
      />
    </div>
  );
}
```

---

## 🎨 Component Features

### OutfitCard Features

#### 1. **Favoriting**
```typescript
// Automatically handled by OutfitCard
// User clicks heart icon → toggles favorite status
// Updates Supabase and local state
```

#### 2. **Rating**
```typescript
// User clicks star (1-5) → saves rating
// Visual feedback: filled yellow stars
// Saved to Supabase outfits.rating column
```

#### 3. **Sharing**
```typescript
// User clicks "Share" button
// Generates unique share link: https://yourapp.com/outfit/{token}
// Copies to clipboard automatically
// Shows modal with shareable link
```

#### 4. **Color Palette**
```typescript
// Shows up to 5 dominant colors at bottom-left of image
// Click color chips → opens color palette modal
// Shows color names: "vibrant red", "light blue", etc.
// Displays hex codes
```

#### 5. **Action Menu**
```typescript
// Click ⋮ button → opens menu with:
// - Add to Collection
// - View Details
// - Color Palette
// - Shop Similar
```

### OutfitGallery Features

#### 1. **Filters**
```typescript
// All Outfits - Show everything
// Favorites - Only favorited outfits
// Top Rated - Rated outfits (1+ stars)
// Recent - Last 20 outfits
```

#### 2. **Search**
```typescript
// Search by:
// - Occasion: "beach wedding"
// - Style: "elegant"
// - User prompt: "red dress"
```

#### 3. **Occasion Filter**
```typescript
// Dropdown with all unique occasions from user's outfits
// Filters to show only selected occasion
```

#### 4. **Color Filter**
```typescript
// 10 popular colors available
// Click multiple colors to filter
// Shows outfits containing ANY selected color
// Uses primary_colors array from Supabase
```

#### 5. **View Modes**
```typescript
// Grid - 1-4 columns (responsive)
// List - Stacked view with compact cards
```

---

## 📝 Integration Examples

### Example 1: Add to Existing Dashboard

```typescript
// src/pages/Dashboard.tsx
import OutfitGallery from '@/components/OutfitGallery';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Show Recent Outfits */}
        <OutfitGallery
          initialFilter="recent"
          showFilters={true}
        />
      </div>
    </div>
  );
}
```

### Example 2: Favorites Page

```typescript
// src/pages/Favorites.tsx
import OutfitGallery from '@/components/OutfitGallery';

export default function Favorites() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Favorite Outfits ❤️</h1>

        <OutfitGallery
          initialFilter="favorites"
          showFilters={false}  // Hide filters, only show favorites
        />
      </div>
    </div>
  );
}
```

### Example 3: After Outfit Generation

```typescript
// src/components/TripleOutfitGenerator.tsx
import OutfitCard from '@/components/OutfitCard';

// After generating outfits, show them with OutfitCard
const savedOutfits = await outfitStorageService.saveMultipleOutfits(...);

return (
  <div className="grid grid-cols-3 gap-4">
    {savedOutfits.map(outfit => (
      <OutfitCard
        key={outfit.id}
        outfit={outfit}
        userId={userId}
        showActions={true}
      />
    ))}
  </div>
);
```

### Example 4: Color-Based Search Page

```typescript
// src/pages/ColorSearch.tsx
import { useState } from 'react';
import OutfitCard from '@/components/OutfitCard';
import outfitStorageService from '@/services/outfitStorageService';

export default function ColorSearch() {
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [outfits, setOutfits] = useState([]);
  const userId = 'user@example.com';

  async function searchByColor(color: string) {
    const results = await outfitStorageService.getOutfitsByColor(
      userId,
      [color]
    );
    setOutfits(results);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-4">Search by Color</h1>

      {/* Color Picker */}
      <input
        type="color"
        value={selectedColor}
        onChange={(e) => {
          setSelectedColor(e.target.value);
          searchByColor(e.target.value);
        }}
        className="mb-8"
      />

      {/* Results */}
      <div className="grid grid-cols-4 gap-6">
        {outfits.map(outfit => (
          <OutfitCard
            key={outfit.id}
            outfit={outfit}
            userId={userId}
          />
        ))}
      </div>
    </div>
  );
}
```

### Example 5: Similar Outfits Recommendation

```typescript
// src/components/OutfitDetails.tsx
import { useState, useEffect } from 'react';
import OutfitCard from '@/components/OutfitCard';
import outfitStorageService from '@/services/outfitStorageService';

export default function OutfitDetails({ outfitId, userId }) {
  const [similarOutfits, setSimilarOutfits] = useState([]);

  useEffect(() => {
    loadSimilarOutfits();
  }, [outfitId]);

  async function loadSimilarOutfits() {
    // Get similar outfits (same occasion, different style)
    const similar = await outfitStorageService.getSimilarOutfits(outfitId, 3);
    setSimilarOutfits(similar);
  }

  return (
    <div>
      {/* Current outfit details */}

      {/* You might also like */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
        <div className="grid grid-cols-3 gap-6">
          {similarOutfits.map(outfit => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              userId={userId}
              compact={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Props Reference

### OutfitCard Props

```typescript
interface OutfitCardProps {
  outfit: OutfitData;           // Required: Outfit data from Supabase
  userId: string;               // Required: Current user ID
  onUpdate?: (outfit: OutfitData) => void;  // Optional: Callback when outfit updated
  showActions?: boolean;        // Optional: Show action buttons (default: true)
  compact?: boolean;            // Optional: Compact view mode (default: false)
}
```

### OutfitGallery Props

```typescript
interface OutfitGalleryProps {
  initialFilter?: 'all' | 'favorites' | 'rated' | 'recent';  // Default: 'all'
  showFilters?: boolean;        // Default: true
  compact?: boolean;            // Default: false
}
```

---

## 🔧 Customization

### Styling

Both components use Tailwind CSS. You can customize:

```typescript
// Change primary color
className="bg-purple-600" → className="bg-blue-600"

// Change card size
className="aspect-[3/4]" → className="aspect-square"

// Change grid columns
className="grid-cols-4" → className="grid-cols-3"
```

### Add Custom Actions

```typescript
// In OutfitCard.tsx, add to action menu:
<button
  onClick={(e) => {
    e.stopPropagation();
    myCustomAction(outfit.id);
    setShowMenu(false);
  }}
  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
>
  <MyIcon className="w-4 h-4" />
  Custom Action
</button>
```

### Custom Filters

```typescript
// In OutfitGallery.tsx, add custom filter:
const [customFilter, setCustomFilter] = useState('');

// In applyFilters():
if (customFilter) {
  filtered = filtered.filter(outfit =>
    // Your custom filter logic
  );
}
```

---

## 🚦 Complete Workflow Example

```typescript
// pages/MyOutfits.tsx
import React from 'react';
import OutfitGallery from '@/components/OutfitGallery';

export default function MyOutfits() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">My Outfit Collection</h1>
          <p className="text-gray-600 mt-2">
            Browse, favorite, and organize your AI-generated outfits
          </p>
        </div>
      </div>

      {/* Gallery */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <OutfitGallery
          initialFilter="all"
          showFilters={true}
          compact={false}
        />
      </div>
    </div>
  );
}
```

---

## ✨ Advanced Features

### 1. **Automatic Color Extraction**

Already integrated! When outfits are generated:
- Colors are automatically extracted
- Saved to `primary_colors` column
- Available for filtering and display
- No manual action needed

### 2. **Real-time Updates**

```typescript
// OutfitCard automatically updates parent component
<OutfitCard
  onUpdate={(updated) => {
    // Parent receives updated outfit
    // Can update local state, refresh list, etc.
    setOutfits(prev => prev.map(o =>
      o.id === updated.id ? updated : o
    ));
  }}
/>
```

### 3. **Share URLs**

Generated share URLs work like:
```
https://yourapp.com/outfit/abc-123-xyz-token

Public access (no login required)
Viewable by anyone with the link
```

### 4. **Analytics Integration**

```typescript
// Track when outfits are viewed, clicked, shared
await outfitStorageService.trackInteraction(
  userId,
  'outfit_viewed',
  outfit.style,
  { outfit_id: outfit.id }
);
```

---

## 🎨 UI/UX Features

- ✅ Hover effects on cards
- ✅ Smooth transitions and animations
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Loading states with spinners
- ✅ Empty states with helpful messages
- ✅ Modal overlays for share and color palette
- ✅ Dropdown menus with click-outside-to-close
- ✅ Visual feedback for all interactions
- ✅ Accessible with ARIA labels
- ✅ Keyboard navigation support

---

## 📱 Mobile Responsive

Both components are fully responsive:

- **Mobile**: 1 column grid
- **Tablet**: 2 columns
- **Desktop**: 3-4 columns
- **List view**: Always single column, optimized for mobile

---

## 🔗 Related Services Used

- `outfitStorageService` - All CRUD operations
- `collectionsService` - Collection management
- `colorAnalysisService` - Color names and analysis
- `userDataService` - Get current user ID

---

## 📚 Next Steps

1. **Add to your routing**:
   ```typescript
   // In App.tsx or routing file
   import MyOutfits from './pages/MyOutfits';

   <Route path="/my-outfits" element={<MyOutfits />} />
   ```

2. **Add navigation link**:
   ```typescript
   <Link to="/my-outfits">My Outfits</Link>
   ```

3. **Use in existing pages**:
   - Add OutfitCard to outfit generation results
   - Add OutfitGallery to dashboard
   - Create dedicated pages for favorites, collections, etc.

**Everything is ready to use! 🎉**
