# AvatarHomepage Component - Complete Analysis

## 📍 File Location
**Path:** `src/components/AvatarHomepageRestored.tsx`
**Total Lines:** 1,567 lines
**Component Name:** `AvatarHomepage` (exported as default)

---

## 📦 Imports (Lines 1-36)

### React & Hooks
```typescript
import React, { useState, useEffect, useRef } from 'react';
```

### Lucide Icons (30+ icons)
```typescript
Sun, Cloud, CloudRain, Snowflake, ArrowLeft, ArrowRight, RefreshCw,
Edit, Settings, Thermometer, Wind, Eye, Calendar,
Shirt, Palette, User, AlertCircle, Loader, MapPin, Clock,
TrendingUp, Camera, Share2, ShoppingCart, ShoppingBag, Heart,
RotateCcw, Trash2, ArrowRightCircle, X, Check, DollarSign,
Search, ExternalLink, Tag, Package, Users, MessageCircle, BookOpen,
DoorOpen, Pencil
```

### UI Components
```typescript
import GlassCard from './ui/GlassCard';
import IOSButton from './ui/IOSButton';
```

### Feature Components
```typescript
import TwoStepClothingWorkflow from './TwoStepClothingWorkflow';
import EnhancedOutfitGenerator from './EnhancedOutfitGenerator';
import WebEnhancedPromptModal from './WebEnhancedPromptModal';
import ShareModal from './ShareModal';
import SaveToClosetModal from './SaveToClosetModal';
import SavedPromptsModal from './SavedPromptsModal';
import SavedAvatarsTab from './SavedAvatarsTab';
import UserSettingsModal from './UserSettingsModal';
```

### Services
```typescript
import { weatherService } from '../services/weatherService';
import { outfitGenerationService } from '../services/outfitGenerationService';
import { avatarAnimationService } from '../services/avatarAnimationService';
import UserService from '../services/userService';
import AchievementsService from '../services/achievementsService';
import ClosetService from '../services/closetService';
import webEnhancedPromptService from '../services/webEnhancedPromptService';
import directFashnService from '../services/directFashnService';
import AvatarClothingAnalysisService from '../services/avatarClothingAnalysisService';
import serpApiService from '../services/serpApiService';
import affiliateLinkService from '../services/affiliateLinkService';
import stylePreferencesService from '../services/stylePreferencesService';
import avatarManagementService from '../services/avatarManagementService';
import outfitCoherenceValidator from '../services/outfitCoherenceValidator';
```

### Config
```typescript
import { CURRENT_PERFECT_PROMPT } from '../config/bestavatargenerated.js';
```

---

## 🎭 Props Interface (Lines 38-52)

```typescript
interface AvatarHomepageProps {
  onBack: () => void;
  onNavigateToOutfitChange?: () => void;
  onNavigateToMeasurements?: () => void;
  onNavigateToStyleProfile?: () => void;
  onNavigateToCloset?: () => void;
  onNavigateToMyOutfits?: () => void;
  onNavigateToMyCreations?: () => void;
  onResetAvatar?: () => void;
  onAvatarUpdate?: (avatarData: any) => void;
  avatarData?: any;
  userData?: UserData | null;
  styleProfile?: StyleProfile;
}
```

**Props Purpose:**
- **Navigation callbacks** - Parent controls routing
- **onAvatarUpdate** - Parent receives avatar changes
- **avatarData** - Current avatar image/state
- **userData** - User profile data
- **styleProfile** - User's fashion preferences

---

## 🔄 State Variables (Lines 82-189)

### Time & Weather (4 states)
```typescript
const [currentTime, setCurrentTime] = useState(new Date());
const [weather, setWeather] = useState<WeatherData | null>(null);
const [weatherLoading, setWeatherLoading] = useState(true);
const [weatherError, setWeatherError] = useState<string | null>(null);
```

### Style Profile (1 state)
```typescript
const [hasCompletedStyleProfile, setHasCompletedStyleProfile] = useState(false);
```

### Avatar Animation (2 states)
```typescript
const [avatarAnimation, setAvatarAnimation] = useState<AnimationType>('breathing');
const [applyingOutfit, setApplyingOutfit] = useState(false);
```

### Upload & Clothing (5 states)
```typescript
const [uploadingClothing, setUploadingClothing] = useState(false);
const [uploadPreview, setUploadPreview] = useState<string | null>(null);
const [showUploadModal, setShowUploadModal] = useState(false);
const [selectedCategory, setSelectedCategory] = useState<ClothingCategory>('tops');
const [clothingName, setClothingName] = useState('');
const [clothingDescription, setClothingDescription] = useState('');
```

### Refresh & Preferences (2 states)
```typescript
const [showRefreshModal, setShowRefreshModal] = useState(false);
const [refreshMode, setRefreshMode] = useState<'smart' | 'seasonal' | 'color' | 'occasion'>('smart');
const [userPreferences, setUserPreferences] = useState({
  likedOutfits: [] as number[],
  skippedOutfits: [] as number[],
});
```

### Custom Outfit Generation (5 states)
```typescript
const [outfitPrompt, setOutfitPrompt] = useState('');
const [selectedStyle, setSelectedStyle] = useState<'casual' | 'formal' | 'trendy' | 'vintage' | 'minimalist' | 'edgy'>('casual');
const [isGeneratingCustomOutfit, setIsGeneratingCustomOutfit] = useState(false);
const [generatedOutfit, setGeneratedOutfit] = useState<any>(null);
const [outfitPreviewImage, setOutfitPreviewImage] = useState<string | null>(null);
```

### Web-Enhanced Prompt Modal (3 states)
```typescript
const [showWebEnhancedModal, setShowWebEnhancedModal] = useState(false);
const [webEnhancedVariations, setWebEnhancedVariations] = useState<PromptVariation[]>([]);
const [isGeneratingWebVariations, setIsGeneratingWebVariations] = useState(false);
```

### Save to Closet Modal (3 states)
```typescript
const [showSaveToClosetModal, setShowSaveToClosetModal] = useState(false);
const [pendingSaveImage, setPendingSaveImage] = useState<string | null>(null);
const [pendingSavePrompt, setPendingSavePrompt] = useState<string>('');
```

### Multiple Outfit Generation (3 states)
```typescript
const [multipleOutfitImages, setMultipleOutfitImages] = useState<Array<{ url: string; prompt: string; variation: string }> | null>(null);
const [showImageSelection, setShowImageSelection] = useState(false);
const [isGeneratingMultiple, setIsGeneratingMultiple] = useState(false);
```

### Wishlist (2 states)
```typescript
const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
const [activeView, setActiveView] = useState<'closet' | 'wishlist'>('closet');
```

### Seamless Try-On (3 states)
```typescript
const [isSeamlessTryOn, setIsSeamlessTryOn] = useState(false);
const [tryOnProgress, setTryOnProgress] = useState<TryOnProgress | null>(null);
const [seamlessTryOnResult, setSeamlessTryOnResult] = useState<SeamlessTryOnResult | null>(null);
```

### Outfit Preview (2 states)
```typescript
const [showOutfitPreview, setShowOutfitPreview] = useState(false);
const [isApplyingOutfitToAvatar, setIsApplyingOutfitToAvatar] = useState(false);
```

### Avatar Pose & Animation (2 states)
```typescript
const [avatarPose, setAvatarPose] = useState<number>(0);
const [showPoseTransition, setShowPoseTransition] = useState(false);
```

### Post-Generation Workflow (7 states)
```typescript
const [showWishlistPrompt, setShowWishlistPrompt] = useState(false);
const [showShoppingPrompt, setShowShoppingPrompt] = useState(false);
const [showShoppingForm, setShowShoppingForm] = useState(false);
const [shoppingResults, setShoppingResults] = useState<ShoppingLink[]>([]);
const [isSearching, setIsSearching] = useState(false);
const [currentGeneratedItem, setCurrentGeneratedItem] = useState<{
  imageUrl: string;
  description: string;
  category?: string;
} | null>(null);
```

### Shopping Form (3 states)
```typescript
const [budgetRange, setBudgetRange] = useState({ min: '', max: '' });
const [clothingSize, setClothingSize] = useState('M');
const [preferredStores, setPreferredStores] = useState<string[]>([]);
```

### Avatar Analysis (2 states)
```typescript
const [avatarAnalysis, setAvatarAnalysis] = useState<AvatarClothingAnalysis | null>(null);
const [isAnalyzingAvatar, setIsAnalyzingAvatar] = useState(false);
```

### Settings Modal (4 states)
```typescript
const [showSettingsModal, setShowSettingsModal] = useState(false);
const [settingsCity, setSettingsCity] = useState(userData?.city || '');
const [settingsState, setSettingsState] = useState(userData?.state || '');
const [settingsTimezone, setSettingsTimezone] = useState(userData?.timezone || 'America/Los_Angeles');
const [isSavingSettings, setIsSavingSettings] = useState(false);
```

### Share Modal (1 state)
```typescript
const [showShareModal, setShowShareModal] = useState(false);
```

### Saved Avatars Tab (1 state)
```typescript
const [showSavedAvatarsTab, setShowSavedAvatarsTab] = useState(false);
```

### Fashion Rule (1 state)
```typescript
const [fashionRule, setFashionRule] = useState<string>('Today TheFitChecked');
```

### Saved Prompts Modal (1 state)
```typescript
const [showPromptsModal, setShowPromptsModal] = useState(false);
```

### Refs (2 refs)
```typescript
const avatarRef = useRef<HTMLDivElement>(null);
const outfitPreviewRef = useRef<HTMLDivElement>(null);
```

**TOTAL: ~60+ state variables managing complex workflows**

---

## 🎨 Current UI Structure & Layout

### Overall Layout
```
<div className="min-h-screen pb-[calc(49px+env(safe-area-inset-bottom))] pt-safe">
  <div className="relative z-10">
    {/* Header */}
    {/* Main Content */}
  </div>
</div>
```

### Header (Lines 760-793)
```jsx
<div className="flex items-center justify-between p-6 bg-white/70 backdrop-blur-sm border-b">
  {/* Left: Greeting + Time */}
  <div className="flex flex-col">
    <h1>Good Morning GENEVIE!</h1>
    <div>12:34 PM</div>
  </div>

  {/* Center: Weather + Date */}
  <div className="flex items-center space-x-3 bg-white/50 rounded-2xl px-4 py-2">
    <Icon /> {/* Sun/Cloud/Rain/Snow */}
    <div>
      <div>72°F</div>
      <div>Partly Cloudy</div>
      <div>Monday, Nov 13</div>
    </div>
  </div>

  {/* Right: Settings Button */}
  <button onClick={() => setShowSettingsModal(true)}>
    <Settings />
  </button>
</div>
```

### Main Content Grid (Lines 796-1194)
```jsx
<main className="max-w-7xl mx-auto px-6 py-8">
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
    
    {/* Left Column (lg:col-span-1) - Workflow Panel */}
    <div>
      {/* Shopping Prompt (GlassCard) */}
      {/* Shopping Form (GlassCard) */}
      {/* Shopping Results (GlassCard) */}
    </div>

    {/* Center Column (lg:col-span-2) - Avatar Display */}
    <div>
      {/* Avatar with animations */}
      {/* Smart Upload Button */}
      {/* Saved Avatars Button */}
    </div>

    {/* Right Column (lg:col-span-1) - Generator & Actions */}
    <div>
      {/* Fashion Rule Display */}
      {/* Style Profile Link */}
      {/* Reset Avatar Link */}
      {/* Share Button */}
      {/* EnhancedOutfitGenerator Component */}
    </div>

  </div>
</main>
```

---

## 🧩 Child Components Rendered

### 1. **GlassCard** (UI Component)
- Used for: Shopping prompts, shopping form, shopping results
- Provides glass morphism styling

### 2. **IOSButton** (UI Component)
- Used for: Action buttons throughout the app
- Variants: 'filled', 'tinted', 'plain'

### 3. **EnhancedOutfitGenerator**
- Lines: 1127-1175
- Purpose: Main outfit generation interface
- Props: avatarData, onAvatarUpdate, onOutfitGenerated
- Handles: Outfit creation, try-on workflow

### 4. **TwoStepClothingWorkflow**
- Purpose: Advanced clothing upload workflow
- Not currently visible in return statement (may be conditional)

### 5. **WebEnhancedPromptModal**
- Lines: 1197-1209
- Conditional: `{showWebEnhancedModal && ...}`
- Purpose: Show AI-enhanced prompt variations

### 6. **SaveToClosetModal**
- Lines: 1211-1256
- Conditional: `{showSaveToClosetModal && ...}`
- Purpose: Save generated outfits to closet

### 7. **Upload Modal (Custom)**
- Lines: 1258-1342
- Conditional: `{showUploadModal && ...}`
- Purpose: Upload custom clothing items

### 8. **Settings Modal (Custom)**
- Lines: 1344-1481
- Conditional: `{showSettingsModal && ...}`
- Purpose: Update location & timezone settings

### 9. **UserSettingsModal**
- Lines: 1484-1502
- Currently: `isOpen={false}` (not shown)
- Purpose: Comprehensive user settings

### 10. **ShareModal**
- Lines: 1504-1548
- Conditional: `{showShareModal && avatarData && ...}`
- Purpose: Share outfit on social media

### 11. **SavedAvatarsTab**
- Lines: 1530-1548
- Conditional: `{showSavedAvatarsTab && ...}`
- Purpose: Browse and load saved avatars

### 12. **SavedPromptsModal**
- Lines: 1550-1562
- Controlled by: `showPromptsModal`
- Purpose: Manage saved outfit prompts

---

## 🎯 Key Features Currently Implemented

### ⏰ Time & Weather Display
- **Real-time clock** updates every minute
- **Weather data** from weatherService
- **Time-based greeting** (Good Morning/Afternoon/Evening)
- **Weather icon** changes based on conditions
- **Date display** with day of week

### 👤 User Personalization
- **Personalized greeting** with user's first name (GENEVIE!)
- **Location-based weather**
- **Style profile tracking**
- **Fashion rule display**

### 👔 Outfit Generation
- **Custom outfit generation** via EnhancedOutfitGenerator
- **AI-enhanced prompts** with web research
- **Multiple outfit variations**
- **Style selection** (casual, formal, trendy, etc.)
- **Avatar pose randomization**

### 🛍️ Shopping Integration
- **Post-generation shopping workflow**
- **Product search** via SerpApi
- **Budget range filtering**
- **Size selection**
- **Preferred stores**
- **Affiliate link tracking**
- **Direct product links**

### 📸 Upload & Save
- **Smart clothing upload**
- **Category selection**
- **Save to closet** functionality
- **Wishlist management**
- **Avatar library** (saved avatars)

### ⚙️ Settings
- **Location settings** (city, state)
- **Timezone settings**
- **Weather preferences**

### 🎨 Avatar Management
- **Avatar display** with animations
- **Pose transitions**
- **Avatar animations** (breathing, posing, celebrating)
- **Reset avatar** functionality
- **Save/load avatars**

### 📱 Sharing
- **Social media sharing**
- **Download outfits**
- **Share with friends**

### 🏆 Achievements
- **Achievement tracking** when avatar is set
- **Style profile completion**

---

## 🔀 Navigation & Routing

### Props-Based Navigation
All navigation handled via callback props:
```typescript
onBack() // Go back to previous screen
onNavigateToOutfitChange() // Change outfit page
onNavigateToMeasurements() // Measurements page
onNavigateToStyleProfile() // Style profile page
onNavigateToCloset() // Closet page
onNavigateToMyOutfits() // My outfits page
onNavigateToMyCreations() // My creations page
onResetAvatar() // Reset avatar flow
```

### Internal Modal Navigation
- **Upload Modal** → TwoStepClothingWorkflow
- **Share Modal** → Social media/download
- **Saved Avatars** → Avatar selection
- **Settings Modal** → Location/timezone editing

---

## 🎨 Styling Approach

### Tailwind CSS Classes
- **Layout**: `flex`, `grid`, `grid-cols-1`, `lg:grid-cols-4`
- **Spacing**: `p-6`, `px-4`, `py-2`, `space-x-3`, `gap-8`
- **Colors**: `bg-white/70`, `text-slate-800`, `bg-sky-300/30`
- **Effects**: `backdrop-blur-sm`, `rounded-2xl`, `shadow-2xl`
- **Responsive**: `lg:col-span-2`, `max-w-7xl`
- **Safe Areas**: `pb-[calc(49px+env(safe-area-inset-bottom))]`, `pt-safe`

### iOS Design Variables
```typescript
style={{ color: 'var(--ios-label)' }}
style={{ color: 'var(--ios-blue)' }}
style={{ color: 'var(--ios-green)' }}
style={{ color: 'var(--ios-purple)' }}
```

### Glass Morphism
- `bg-white/70 backdrop-blur-sm` (header)
- `bg-white/50` (weather card)
- GlassCard component for panels

---

## 🔄 User Interactions

### Header Actions
- ⚙️ **Settings button** → Open settings modal

### Avatar Display
- 📸 **Smart Upload** → Open upload modal
- 💾 **Saved Avatars** → Browse saved avatars library

### Outfit Generator
- 🎨 **Generate outfit** → EnhancedOutfitGenerator
- 🌐 **Web-enhance prompt** → AI research variations
- 📝 **Save to closet** → SaveToClosetModal

### Shopping Workflow
- 🛒 **Search products** → SerpApi integration
- 💰 **Set budget** → Filter by price range
- 📏 **Select size** → Filter by size
- 🏪 **Choose stores** → Preferred retailers
- 🔗 **Click product** → Affiliate link tracking

### Side Actions
- 👤 **View style profile**
- 🔄 **Reset avatar**
- 📤 **Share outfit**

---

## 📊 Data Flow

### Fetched Data
1. **Weather**: `weatherService.getUserSavedLocation()`
2. **Style Profile**: `stylePreferencesService.getUserPreferences()`
3. **Wishlist**: `localStorage.getItem('fitChecked_wishlist')`
4. **Fashion Rule**: `stylePreferencesService.getFashionRule()`
5. **Avatars**: `avatarManagementService.loadAvatarFromLibrary()`

### Data Updates
1. **Avatar**: `onAvatarUpdate(avatarData)` → Parent
2. **Settings**: `UserService.updateUser()` → Backend
3. **Wishlist**: `localStorage.setItem()` → Local storage
4. **Shopping**: `affiliateLinkService.trackClick()` → Analytics

---

## 🎯 Component Architecture Summary

**Type:** Complex, multi-feature homepage dashboard
**Pattern:** Monolithic component with modal-based sub-features
**State Management:** Local state (60+ useState)
**Data Flow:** Props down, callbacks up
**Modularity:** High - uses many child components
**Styling:** Tailwind utility classes + CSS variables
**Responsive:** Mobile-first, desktop grid layout

**Complexity:** ⭐⭐⭐⭐⭐ (Very High)
- 1,567 lines
- 60+ state variables
- 12+ child components
- 14+ services integrated
- Complex workflows (shopping, try-on, upload)
