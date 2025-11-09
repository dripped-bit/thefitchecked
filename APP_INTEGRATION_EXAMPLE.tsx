/**
 * Example: How to Integrate Capacitor Native Features into Your Existing App.tsx
 *
 * This file shows the minimal changes needed to add native iOS features
 * to your TheFitChecked app.
 */

import React, { useState, useEffect } from 'react';
import { App as KonstaApp } from 'konsta/react'; // Rename to avoid conflict

// Import your existing components
import WelcomeScreen from './components/WelcomeScreen';
import PhotoCaptureFlow from './components/PhotoCaptureFlow';
// ... other imports

// NEW: Import Capacitor setup
import { initializeCapacitor } from './utils/capacitorSetup';
import statusBar from './utils/statusBar';

function App() {
  // Your existing state
  const [currentScreen, setCurrentScreen] = useState<Screen>('loading');
  // ... other state

  // NEW: Initialize Capacitor on app mount
  useEffect(() => {
    const initNativeFeatures = async () => {
      console.log('🚀 Initializing native iOS features...');

      // Initialize all Capacitor plugins
      await initializeCapacitor();

      // Set initial status bar style
      await statusBar.setDark(); // White text for dark nav bars

      console.log('✅ Native features ready!');
    };

    initNativeFeatures();
  }, []);

  // OPTION 1: Wrap entire app with Konsta UI App component
  // This gives you access to Konsta UI components throughout your app
  return (
    <KonstaApp theme="ios" safeAreas>
      {/* Your existing app content */}
      <div className="app">
        {currentScreen === 'welcome' && <WelcomeScreen />}
        {currentScreen === 'photoCapture' && <PhotoCaptureFlow />}
        {/* ... other screens */}
      </div>
    </KonstaApp>
  );

  // OPTION 2: Keep existing structure (if not using Konsta UI everywhere)
  // Just add Capacitor initialization - that's it!
  /*
  return (
    <div className="app">
      {currentScreen === 'welcome' && <WelcomeScreen />}
      {currentScreen === 'photoCapture' && <PhotoCaptureFlow />}
    </div>
  );
  */
}

export default App;

/**
 * That's it! Now you can use native features in any component:
 *
 * 1. Camera in PhotoCaptureFlow:
 *    import NativeCameraCapture from './components/NativeCameraCapture';
 *
 * 2. Haptics on any button:
 *    import { useHaptics } from './utils/haptics';
 *    const { medium } = useHaptics();
 *    <button onClick={() => { medium(); doSomething(); }}>
 *
 * 3. Share on outfit cards:
 *    import NativeShareButton from './components/NativeShareButton';
 *    <NativeShareButton imageUrl={outfit.image} />
 *
 * 4. Status bar on each page:
 *    import { useStatusBarStyle } from './utils/statusBar';
 *    useStatusBarStyle('dark'); // or 'light'
 */
