# 🚀 Quick Start: Native iOS Features for TheFitChecked

## ✅ What's Been Installed

All Capacitor plugins have been installed and configured for TheFitChecked:

- **@capacitor/camera** v7.0.2 - Camera & photo library
- **@capacitor/haptics** v7.0.2 - Haptic feedback
- **@capacitor/share** v7.0.2 - Native share sheet
- **@capacitor/status-bar** v7.0.3 - Status bar styling
- **@capacitor/app** v7.1.0 - App lifecycle & deep linking

---

## 📁 New Files Created

### Components
- `src/components/NativeCameraCapture.tsx` - Camera component with iOS action sheet
- `src/components/NativeShareButton.tsx` - Share button with native share sheet
- `src/components/OutfitCardWithNativeFeatures.tsx` - Complete example integration
- `src/components/KonstaExample.tsx` - Konsta UI demo components

### Utilities
- `src/utils/haptics.ts` - Haptic feedback service + hooks
- `src/utils/statusBar.ts` - Status bar service + hooks
- `src/utils/appLifecycle.ts` - App lifecycle + deep linking + hooks
- `src/utils/capacitorSetup.ts` - One-line initialization

### Examples
- `src/examples/NativeFeaturesDemo.tsx` - Interactive demo page

### Documentation
- `CAPACITOR_NATIVE_FEATURES.md` - Complete feature documentation
- `QUICK_START_NATIVE_IOS.md` - This file

### iOS Configuration
- `ios/App/App/Info.plist` - Updated with camera permissions & deep linking

---

## 🏃 Quick Integration in 3 Steps

### Step 1: Initialize Capacitor in App.tsx

```tsx
import { useEffect } from 'react';
import { initializeCapacitor } from './utils/capacitorSetup';

function App() {
  useEffect(() => {
    // Initialize all Capacitor plugins
    initializeCapacitor();
  }, []);

  // ... rest of your app
}
```

### Step 2: Add Camera to Outfit Upload

```tsx
import NativeCameraCapture from './components/NativeCameraCapture';

<NativeCameraCapture
  onPhotoCapture={(photoUrl, photo) => {
    setOutfitImage(photoUrl);
  }}
  buttonText="Take Outfit Photo"
/>
```

### Step 3: Add Haptics to Buttons

```tsx
import { useHaptics } from './utils/haptics';

const { medium, success } = useHaptics();

<button onClick={() => {
  medium(); // Haptic feedback
  saveOutfit();
}}>
  Save Outfit
</button>
```

---

## 🎯 Common Use Cases

### 1. Take Outfit Photo
```tsx
import NativeCameraCapture from './components/NativeCameraCapture';

<NativeCameraCapture
  onPhotoCapture={(url) => uploadOutfitPhoto(url)}
/>
```

### 2. Share Outfit
```tsx
import NativeShareButton from './components/NativeShareButton';

<NativeShareButton
  title="My Summer Outfit"
  imageUrl={outfitImage}
  buttonText="Share"
/>
```

### 3. Add Haptic Feedback
```tsx
import haptics from './utils/haptics';

// Light tap
haptics.light();

// Button press
haptics.medium();

// Important action
haptics.heavy();

// Success
haptics.success();

// Error
haptics.error();

// Favorite/Like
haptics.doubleTap();
```

### 4. Set Status Bar Style
```tsx
import { useStatusBarStyle } from './utils/statusBar';

function MyPage() {
  useStatusBarStyle('dark'); // White text on dark background

  return <div className="bg-black">...</div>;
}
```

### 5. Handle Deep Links
```tsx
import { useDeepLink } from './utils/appLifecycle';

useDeepLink((url, params) => {
  if (url.includes('/outfit/')) {
    const id = url.split('/').pop();
    navigateToOutfit(id);
  }
});
```

---

## 📱 Testing on iOS

### Option 1: iOS Simulator
```bash
npx cap open ios
# Press Cmd+R in Xcode to run
```

**Note**: Haptics don't work in simulator, camera shows mock interface

### Option 2: Physical iPhone
1. Connect iPhone via USB
2. `npx cap open ios`
3. Select your device in Xcode
4. Press Cmd+R to run
5. Trust developer certificate on device (Settings > General > VPN & Device Management)

### Test Deep Links
Open Safari on device and visit:
- `thefitchecked://outfit/123`
- `thefitchecked://closet?view=favorites`

---

## 🎨 Complete Outfit Card Example

```tsx
import NativeCameraCapture from './components/NativeCameraCapture';
import NativeShareButton from './components/NativeShareButton';
import { useHaptics } from './utils/haptics';

function OutfitCard({ outfit }) {
  const { medium, doubleTap, heavy } = useHaptics();

  return (
    <div className="outfit-card">
      <img src={outfit.image} />

      <button onClick={() => {
        doubleTap(); // Haptic for like
        toggleFavorite();
      }}>
        ❤️ Favorite
      </button>

      <NativeCameraCapture
        onPhotoCapture={(url) => updateOutfitImage(url)}
      />

      <NativeShareButton
        title={outfit.title}
        imageUrl={outfit.image}
      />

      <button onClick={() => {
        heavy(); // Strong haptic for delete
        deleteOutfit();
      }}>
        Delete
      </button>
    </div>
  );
}
```

---

## 🧪 Interactive Demo

Run the demo page to test all features:

```tsx
import NativeFeaturesDemo from './examples/NativeFeaturesDemo';

// Add to your router
<Route path="/demo" component={NativeFeaturesDemo} />

// Navigate to /demo
```

---

## 📋 iOS Info.plist (Already Configured ✅)

Camera permissions and deep linking are already configured in:
`ios/App/App/Info.plist`

### Permissions Added:
- ✅ Camera access
- ✅ Photo library read
- ✅ Photo library write
- ✅ Deep linking URL scheme: `thefitchecked://`

---

## 🔄 After Making Changes

Whenever you modify Capacitor config or add new plugins:

```bash
# Sync changes to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

---

## 🐛 Troubleshooting

### Camera not working?
```bash
npx cap sync ios
# Clean build in Xcode: Product > Clean Build Folder
```

### Haptics not working?
- Only works on physical devices
- Check device settings: Settings > Sounds & Haptics

### TypeScript errors?
```bash
npm install @capacitor/camera @capacitor/haptics @capacitor/share @capacitor/status-bar @capacitor/app
```

### Deep links not working?
- Verify Info.plist has `CFBundleURLTypes`
- Test from Safari, not direct URL bar
- App must be installed on device

---

## 📚 Documentation

- **Full Feature Guide**: `CAPACITOR_NATIVE_FEATURES.md`
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Konsta UI Docs**: https://konstaui.com/react

---

## ✨ Next Steps

1. ✅ **Initialize**: Add `initializeCapacitor()` to App.tsx
2. ✅ **Camera**: Replace photo upload with `NativeCameraCapture`
3. ✅ **Haptics**: Add haptic feedback to all buttons
4. ✅ **Share**: Add `NativeShareButton` to outfit cards
5. ✅ **Status Bar**: Set status bar style for each page
6. ✅ **Test**: Run on iPhone to test all features

---

## 🎉 You're Ready!

All native iOS features are installed and ready to use. Start by:

1. Running the demo: `/demo` route
2. Adding camera to outfit upload
3. Adding haptics to your buttons
4. Testing on a real iPhone

**Happy coding!** 🚀
