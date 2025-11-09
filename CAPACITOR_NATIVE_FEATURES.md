# Capacitor Native iOS Features - TheFitChecked

Complete setup guide for all Capacitor plugins installed in TheFitChecked.

## 📦 Installed Plugins

- ✅ `@capacitor/camera` - Camera & Photo Library access
- ✅ `@capacitor/haptics` - iOS haptic feedback
- ✅ `@capacitor/share` - Native share sheet
- ✅ `@capacitor/status-bar` - Status bar styling
- ✅ `@capacitor/app` - App lifecycle & deep linking
- ✅ `@capacitor/core` - Core Capacitor functionality
- ✅ `@capacitor/ios` - iOS platform support

---

## 🎥 1. Camera Plugin

### Features
- Take photos with native iOS camera
- Select photos from photo library
- Automatic permission handling
- iOS native photo editor
- Image optimization

### Component
```tsx
import NativeCameraCapture from './components/NativeCameraCapture';

<NativeCameraCapture
  onPhotoCapture={(photoUrl, photo) => {
    console.log('Photo captured:', photoUrl);
    setOutfitImage(photoUrl);
  }}
  buttonText="Take Outfit Photo"
/>
```

### Hook Usage
```tsx
import { useCameraUtils } from './components/NativeCameraCapture';

const { checkPermissions, quickPhoto } = useCameraUtils();

// Check permissions
const permissions = await checkPermissions();

// Quick photo capture
const photo = await quickPhoto(CameraSource.Camera);
```

### iOS Permissions (Info.plist) ✅ Configured
```xml
<key>NSCameraUsageDescription</key>
<string>TheFitChecked needs camera access to take photos of your outfits...</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>TheFitChecked needs access to your photo library...</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>TheFitChecked would like to save your outfit photos...</string>
```

---

## 📳 2. Haptics Plugin

### Features
- Impact feedback (light, medium, heavy)
- Notification feedback (success, warning, error)
- Selection feedback
- Custom vibration patterns

### Basic Usage
```tsx
import haptics from './utils/haptics';

// Button press
haptics.medium();

// Success action
haptics.success();

// Error
haptics.error();

// Favorite/like
haptics.doubleTap();

// Delete/destructive
haptics.heavy();
```

### Hook Usage
```tsx
import { useHaptics } from './utils/haptics';

const { medium, success, error } = useHaptics();

<Button onClick={() => {
  medium(); // Haptic feedback
  doSomething();
}}>
  Click Me
</Button>
```

### Use Cases in TheFitChecked
- **Light**: Toggle switches, checkboxes, small taps
- **Medium**: Regular buttons, menu items
- **Heavy**: Confirming outfit selection, deleting items
- **Success**: Outfit saved, generation complete
- **Error**: Upload failed, invalid input
- **Selection**: Scrolling through outfit options
- **DoubleTap**: Favoriting outfits

### iOS Permissions
❌ None required - haptics work out of the box

---

## 🔗 3. Share Plugin

### Features
- Native iOS share sheet
- Share images with text
- Share URLs
- Share to Messages, Mail, Instagram, etc.
- Automatic fallback to clipboard

### Component
```tsx
import NativeShareButton from './components/NativeShareButton';

<NativeShareButton
  title="My Summer Outfit"
  text="Check out this outfit I created on TheFitChecked!"
  imageUrl={outfitImageUrl}
  url={`thefitchecked://outfit/${outfitId}`}
  buttonText="Share Outfit"
  onShareSuccess={() => console.log('Shared!')}
/>
```

### Hook Usage
```tsx
import { useShare } from './components/NativeShareButton';

const { shareOutfit } = useShare();

await shareOutfit({
  imageUrl: 'https://...',
  title: 'My Outfit',
  description: 'Created on TheFitChecked'
});
```

### iOS Permissions
❌ None required - sharing works out of the box

---

## 📊 4. Status Bar Plugin

### Features
- Light/dark mode styling
- Background color customization
- Show/hide status bar
- Full-screen mode support

### Basic Usage
```tsx
import statusBar from './utils/statusBar';

// Set dark mode (white text)
await statusBar.setDark();

// Set light mode (black text)
await statusBar.setLight();

// Hide status bar (full screen)
await statusBar.hide();

// Show status bar
await statusBar.show();
```

### Hook Usage
```tsx
import { useStatusBarStyle } from './utils/statusBar';

function MyComponent() {
  // Automatically set status bar for this component
  useStatusBarStyle('dark'); // or 'light' or 'default'

  return <div className="bg-black">Dark background page</div>;
}
```

### Full-Screen Mode
```tsx
import { useFullScreen } from './utils/statusBar';

const { enterFullScreen, exitFullScreen } = useFullScreen();

<Button onClick={enterFullScreen}>View Full Screen</Button>
```

### iOS Permissions
❌ None required - status bar works out of the box

---

## 📱 5. App Plugin

### Features
- App lifecycle events (foreground/background)
- Deep linking support
- Back button handling
- App info (version, build)

### Lifecycle Events
```tsx
import { useAppStateChange } from './utils/appLifecycle';

useAppStateChange((state) => {
  if (state.isActive) {
    // App came to foreground
    console.log('App is active - refresh data');
    refreshOutfits();
  } else {
    // App went to background
    console.log('App backgrounded - save state');
    saveState();
  }
});
```

### Deep Linking
```tsx
import { useDeepLink, DeepLinkRouter } from './utils/appLifecycle';

useDeepLink((url, params) => {
  console.log('Deep link opened:', url);

  // Parse outfit link
  const outfitId = DeepLinkRouter.parseOutfitLink(url);
  if (outfitId) {
    navigateToOutfit(outfitId);
  }

  // Parse closet link
  const closetView = DeepLinkRouter.parseClosetLink(url);
  if (closetView) {
    navigateToCloset(closetView);
  }
});
```

### Deep Link Examples
- `thefitchecked://outfit/123` - Open outfit
- `thefitchecked://closet?view=favorites` - Open closet favorites
- `thefitchecked://share/abc123` - Open shared outfit
- `https://thefitchecked.com/outfit/123` - Universal link (requires setup)

### Back Button Handling
```tsx
import { useBackButton } from './utils/appLifecycle';

useBackButton(() => {
  if (modalOpen) {
    closeModal();
    return true; // Prevent default
  }
  return false; // Allow default
});
```

### iOS Permissions (Info.plist) ✅ Configured
```xml
<!-- Deep Linking URL Schemes -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>thefitchecked</string>
    </array>
  </dict>
</array>
```

---

## 🚀 Initialization

### Initialize all plugins in App.tsx

```tsx
import { useEffect } from 'react';
import { initializeCapacitor } from './utils/capacitorSetup';

function App() {
  useEffect(() => {
    // Initialize all Capacitor plugins
    initializeCapacitor();
  }, []);

  return <YourApp />;
}
```

---

## 📱 Complete Example Component

See `src/components/OutfitCardWithNativeFeatures.tsx` for a complete example showing:
- Camera capture
- Haptic feedback on all interactions
- Native share sheet
- Proper iOS UX patterns

---

## 🔄 Sync Native Changes

After modifying Info.plist or Capacitor config:

```bash
# Sync changes to iOS
npx cap sync ios

# Open in Xcode to test
npx cap open ios
```

---

## 🧪 Testing on iOS

### Simulator
```bash
# Install iOS dependencies
cd ios/App
pod install

# Open in Xcode
cd ../..
npx cap open ios

# Run from Xcode (Cmd+R)
```

### Physical Device
1. Connect iPhone via USB
2. Select device in Xcode
3. Trust developer certificate in Settings
4. Run from Xcode

---

## 📝 iOS Info.plist Summary

All required permissions are configured in:
`ios/App/App/Info.plist`

### Configured Permissions:
- ✅ Camera access (`NSCameraUsageDescription`)
- ✅ Photo library read (`NSPhotoLibraryUsageDescription`)
- ✅ Photo library write (`NSPhotoLibraryAddUsageDescription`)
- ✅ Deep linking URL schemes (`CFBundleURLTypes`)

### No Permission Required:
- Haptics
- Share
- Status Bar

---

## 🎨 Integration with Konsta UI

All components work seamlessly with Konsta UI:

```tsx
import { App, Button } from 'konsta/react';
import NativeCameraCapture from './components/NativeCameraCapture';
import haptics from './utils/haptics';

<App theme="ios">
  <Button
    rounded
    onClick={() => {
      haptics.medium();
      doSomething();
    }}
  >
    iOS Native Button
  </Button>

  <NativeCameraCapture
    onPhotoCapture={(url) => setPhoto(url)}
  />
</App>
```

---

## 🐛 Common Issues

### Camera not working?
- Check Info.plist has camera permissions
- Run `npx cap sync ios`
- Clean build in Xcode

### Haptics not working?
- Only works on physical devices (not simulator)
- Ensure device haptics are enabled in Settings

### Deep links not opening app?
- Check URL scheme in Info.plist
- Verify app is installed on device
- Test with Safari: `thefitchecked://outfit/123`

---

## 📚 Resources

- [Capacitor Camera Docs](https://capacitorjs.com/docs/apis/camera)
- [Capacitor Haptics Docs](https://capacitorjs.com/docs/apis/haptics)
- [Capacitor Share Docs](https://capacitorjs.com/docs/apis/share)
- [Capacitor Status Bar Docs](https://capacitorjs.com/docs/apis/status-bar)
- [Capacitor App Docs](https://capacitorjs.com/docs/apis/app)

---

## ✅ Next Steps

1. **Test on Device**: Run on physical iPhone to test camera and haptics
2. **Integrate Components**: Replace existing components with native versions
3. **Add Haptics**: Add haptic feedback to all button interactions
4. **Share Features**: Add share buttons to outfit cards
5. **Status Bar**: Configure status bar for each page
6. **Deep Links**: Test deep linking from Safari and Messages

---

Generated for TheFitChecked - Native iOS Features Setup
