# Routing Integration Guide

How to add the new MyOutfitsPage to your app's routing.

## 📂 Two Versions Available

### 1. **MyOutfitsPage.tsx** (Basic)
- Simple, lightweight implementation
- Basic features: favorites, rating, sharing, color filter
- Manual state management
- Good for: Quick integration, custom designs

### 2. **MyOutfitsPageAdvanced.tsx** (Full-Featured)
- Uses OutfitGallery component
- All advanced features: search, filters, view modes, etc.
- More polished UI
- Good for: Complete solution, less custom code

---

## 🚀 Quick Integration (3 Steps)

### Step 1: Choose Your Version

**Option A: Basic Version**
```bash
# Already created: src/pages/MyOutfitsPage.tsx
# Use this if you want simplicity and customization
```

**Option B: Advanced Version**
```bash
# Already created: src/pages/MyOutfitsPageAdvanced.tsx
# Use this if you want all features out-of-the-box
```

### Step 2: Find Your Router File

Your app likely uses React Router. Find where routes are defined:

```bash
# Common locations:
src/App.tsx
src/routes.tsx
src/router/index.tsx
```

### Step 3: Add the Route

#### If using React Router v6:

```typescript
// src/App.tsx or routes file
import MyOutfitsPage from './pages/MyOutfitsPage';
// OR
import MyOutfitsPageAdvanced from './pages/MyOutfitsPageAdvanced';

// Add to your routes:
<Routes>
  {/* Existing routes */}
  <Route path="/" element={<HomePage />} />
  <Route path="/dashboard" element={<Dashboard />} />

  {/* NEW: Add this */}
  <Route path="/my-outfits" element={<MyOutfitsPage />} />
  {/* OR */}
  <Route path="/my-outfits" element={<MyOutfitsPageAdvanced />} />

  {/* Other routes */}
</Routes>
```

---

## 🔗 Add Navigation Links

### Option 1: Header/Navbar

```typescript
// In your navigation component
import { Link } from 'react-router-dom';

<nav>
  <Link to="/" className="nav-link">Home</Link>
  <Link to="/dashboard" className="nav-link">Dashboard</Link>
  <Link to="/my-outfits" className="nav-link">My Outfits</Link>
  {/* ... */}
</nav>
```

### Option 2: Dashboard Quick Link

```typescript
// In Dashboard.tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

<button
  onClick={() => navigate('/my-outfits')}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
>
  View All My Outfits →
</button>
```

### Option 3: Sidebar

```typescript
// In sidebar component
<div className="space-y-2">
  <SidebarLink to="/" icon={Home}>Home</SidebarLink>
  <SidebarLink to="/dashboard" icon={Grid}>Dashboard</SidebarLink>
  <SidebarLink to="/my-outfits" icon={Shirt}>My Outfits</SidebarLink>
</div>
```

---

## 📱 Complete Example: App.tsx Integration

```typescript
// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import MyOutfitsPage from './pages/MyOutfitsPage';
// ... other imports

function App() {
  return (
    <Router>
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-6">
            <Link to="/" className="text-gray-700 hover:text-purple-600">
              Home
            </Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-purple-600">
              Dashboard
            </Link>
            <Link to="/my-outfits" className="text-gray-700 hover:text-purple-600">
              My Outfits
            </Link>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-outfits" element={<MyOutfitsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 🎨 Styling Integration

### If using Tailwind CSS (Already set up)

Both page versions use Tailwind classes - no additional setup needed!

### Custom Styling

To match your app's design:

```typescript
// MyOutfitsPage.tsx - Customize colors
className="bg-purple-500" // Change to your brand color
className="text-purple-600" // Change to your accent color
```

---

## 🔧 Advanced Routing Options

### Protected Routes (Require Login)

```typescript
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const user = getCurrentUser(); // Your auth function

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

// Use it:
<Route
  path="/my-outfits"
  element={
    <ProtectedRoute>
      <MyOutfitsPage />
    </ProtectedRoute>
  }
/>
```

### Nested Routes

```typescript
<Route path="/outfits">
  <Route index element={<MyOutfitsPage />} />
  <Route path="favorites" element={<MyOutfitsPage initialFilter="favorites" />} />
  <Route path="rated" element={<MyOutfitsPage initialFilter="rated" />} />
</Route>

// URLs:
// /outfits - All outfits
// /outfits/favorites - Favorites only
// /outfits/rated - Top rated only
```

### With URL Parameters

```typescript
// Route with color filter from URL
<Route path="/my-outfits/:color?" element={<MyOutfitsPageWithParams />} />

// Component:
import { useParams } from 'react-router-dom';

function MyOutfitsPageWithParams() {
  const { color } = useParams();

  return <MyOutfitsPage initialColorFilter={color} />;
}

// URL: /my-outfits/red
// Shows only red outfits
```

---

## 🚦 Testing Your Integration

### 1. Start Dev Server

```bash
npm run dev
```

### 2. Navigate to New Page

```
http://localhost:5173/my-outfits
```

### 3. Verify Features Work

- ✅ Page loads
- ✅ Outfits display (if you have generated any)
- ✅ Favoriting works
- ✅ Rating works
- ✅ Sharing works
- ✅ Color filter works (if using basic version)
- ✅ All filters work (if using advanced version)

---

## 🎯 Next Steps After Integration

### 1. Add More Pages

```typescript
// src/pages/FavoritesPage.tsx
import OutfitGallery from '../components/OutfitGallery';

export default function FavoritesPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">❤️ My Favorites</h1>
      <OutfitGallery initialFilter="favorites" showFilters={false} />
    </div>
  );
}

// Add route:
<Route path="/favorites" element={<FavoritesPage />} />
```

### 2. Add Collections Page

```typescript
// src/pages/CollectionsPage.tsx
import collectionsService from '../services/collectionsService';

export default function CollectionsPage() {
  // List user's collections
  // Click collection → show outfits in that collection
}
```

### 3. Add Color Search Page

```typescript
// src/pages/ColorSearchPage.tsx
import OutfitCard from '../components/OutfitCard';
import outfitStorageService from '../services/outfitStorageService';

export default function ColorSearchPage() {
  // Color picker → search by color
  // Show results in grid
}
```

---

## 📚 Example: Full App Structure

```
src/
├── pages/
│   ├── MyOutfitsPage.tsx          ← Basic version
│   ├── MyOutfitsPageAdvanced.tsx  ← Advanced version
│   ├── FavoritesPage.tsx          ← Create this
│   ├── CollectionsPage.tsx        ← Create this
│   └── ColorSearchPage.tsx        ← Create this
│
├── components/
│   ├── OutfitCard.tsx             ✅ Already created
│   ├── OutfitGallery.tsx          ✅ Already created
│   └── Dashboard.tsx              ← Add links to new pages
│
└── App.tsx                        ← Add routes here
```

---

## ✅ Checklist

- [ ] Choose between Basic or Advanced version
- [ ] Add import to App.tsx
- [ ] Add route to Routes
- [ ] Add navigation link in navbar/sidebar
- [ ] Test page loads at /my-outfits
- [ ] Test all features work
- [ ] (Optional) Add more pages (favorites, collections, etc.)
- [ ] (Optional) Protect route with authentication
- [ ] Deploy and enjoy!

---

## 🆘 Troubleshooting

### "Page not found" error

Make sure route is added:
```typescript
<Route path="/my-outfits" element={<MyOutfitsPage />} />
```

### "Cannot find module" error

Check import path:
```typescript
import MyOutfitsPage from './pages/MyOutfitsPage';
// Adjust path based on your file structure
```

### Outfits not loading

1. Check Supabase SQL schema is run
2. Check console for errors
3. Verify userId is correct
4. Check network tab for API calls

### Styling looks broken

1. Ensure Tailwind CSS is configured
2. Check className attributes are preserved
3. Verify no CSS conflicts

---

## 🎉 You're Done!

Your app now has a complete outfit management system with:
- ✅ My Outfits page
- ✅ Favoriting
- ✅ Rating
- ✅ Sharing
- ✅ Color filtering
- ✅ Search & filters (if using advanced version)

Enjoy your new features! 🚀
