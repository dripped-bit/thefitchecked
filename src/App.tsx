import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Trash2, RefreshCw } from 'lucide-react';
import useDevMode from './hooks/useDevMode';
import WelcomeScreen from './components/WelcomeScreen';
import LoadingScreen from './components/LoadingScreen';
import PhotoCaptureFlow from './components/PhotoCaptureFlow';
import AvatarGeneration from './components/AvatarGeneration';
import AvatarMeasurementsPage from './components/AvatarMeasurementsPage';
import AppFacePage from './components/AppFacePage';
import Page4Component from './components/Page4Component';
import AvatarHomepage from './components/AvatarHomepageRestored';
// import SeedreamTest from './components/SeedreamTest'; // DISABLED - test component not needed (fal.ai still active)
import UserOnboardingPopup from './components/UserOnboardingPopup';
import SaveAvatarModal from './components/SaveAvatarModal';
import ClosetExperience from './components/ClosetExperience';
import DoorTransition from './components/DoorTransition';
import ApiTestPage from './pages/ApiTestPage';
import MyOutfitsPage from './pages/MyOutfitsPageAdvanced';
import GlobalDemoModeToggle from './components/GlobalDemoModeToggle';
import SharedOutfit from './components/SharedOutfit';
import { CapturedPhoto, AvatarData } from './types/photo';
import { UserData, OnboardingFormData } from './types/user';
import UserService from './services/userService';
import avatarManagementService from './services/avatarManagementService';
import weatherService from './services/weatherService';
import outfitGenerationService from './services/outfitGenerationService';
import localStorageMigrationService from './services/localStorageMigrationService';
import reminderMonitorService from './services/reminderMonitorService';

// Import debug utilities for console access
import './utils/testApiConnection';
import './utils/testCgiPrompts';
import './utils/testFashnCredits';
import './utils/testSupabaseStorage';
import clearCacheUtil from './utils/clearCache';
// import './utils/debugApis';
// import './utils/directApiTest';
// import './utils/keyChecker';

type Screen = 'loading' | 'welcome' | 'photoCapture' | 'avatarGeneration' | 'measurements' | 'appFace' | 'styleProfile' | 'avatarHomepage' | 'closet' | 'apiTest' | 'myOutfits';

interface AppData {
  capturedPhotos: CapturedPhoto[];
  uploadedPhoto?: string;
  generatedAvatar?: any;
  measurements: any;
  avatarData: AvatarData;
}

function App() {
  console.log('TheFitChecked App - Full Avatar Generation Workflow');

  // Check for share URL parameter
  const [shareId, setShareId] = useState<string | null>(null);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');

    if (shareParam) {
      console.log('🔗 [SHARE] Share link detected:', shareParam);
      setShareId(shareParam);
    }
  }, []);

  // Run localStorage → IndexedDB migration on app startup
  React.useEffect(() => {
    const runMigration = async () => {
      console.log('🔄 [APP] Checking for localStorage migration...');
      const result = await localStorageMigrationService.migrate({ clearLocalStorage: false });

      if (result.success && result.migratedKeys.length > 0) {
        console.log(`✅ [APP] Migrated ${result.migratedKeys.length} items to IndexedDB`);
      }
    };

    runMigration();
  }, []);

  // Initialize avatar storage and sync with Supabase
  React.useEffect(() => {
    const initializeAvatarStorage = async () => {
      console.log('🎭 [APP] Initializing avatar storage with Supabase sync...');
      await avatarManagementService.initializeAvatarStorage();
      console.log('✅ [APP] Avatar storage initialized and synced');
    };

    initializeAvatarStorage();
  }, []);

  // Add error handling
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Global JavaScript Error:', event.error);
      console.error('🚨 Error details:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);


  // Setup global cache clearing functions for console access
  React.useEffect(() => {
    // Add global functions to window for easy console access
    (window as any).clearAppCache = clearCacheUtil.clearAppCacheWithConfirmation;
    (window as any).clearAppCacheForce = clearCacheUtil.clearAppCache;
    (window as any).getCacheStats = clearCacheUtil.getCacheStats;
    (window as any).logCacheStats = clearCacheUtil.logCacheStats;

    console.log('🧹 [CACHE-UTIL] Global cache functions available:');
    console.log('  • clearAppCache() - Clear all cache with confirmation');
    console.log('  • clearAppCacheForce() - Clear all cache without confirmation');
    console.log('  • getCacheStats() - Get cache statistics');
    console.log('  • logCacheStats() - Log detailed cache statistics');

    return () => {
      // Cleanup on unmount (though App rarely unmounts)
      delete (window as any).clearAppCache;
      delete (window as any).clearAppCacheForce;
      delete (window as any).getCacheStats;
      delete (window as any).logCacheStats;
    };
  }, []);

  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome'); // DEBUG: Back to normal flow with debug logging enabled
  const [isDevelopment] = useState(true);
  const [showDevPanel, setShowDevPanel] = useState(true);
  const [isDevPanelCollapsed, setIsDevPanelCollapsed] = useState(false);
  const [useDefaultMeasurements, setUseDefaultMeasurements] = useState(false);
  const [useAutoFillStyleProfile, setUseAutoFillStyleProfile] = useState(false);
  const [useAutoFillUserData, setUseAutoFillUserData] = useState(false);
  const [useAutoFillClothingPrompts, setUseAutoFillClothingPrompts] = useState(false);
  const [useAutoFillOutfitNames, setUseAutoFillOutfitNames] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showOnboardingPopup, setShowOnboardingPopup] = useState(false);
  const [showDoorTransition, setShowDoorTransition] = useState(false);
  const [showExitDoorTransition, setShowExitDoorTransition] = useState(false);
  const [pendingScreen, setPendingScreen] = useState<Screen | null>(null);
  const [showSaveAvatarModal, setShowSaveAvatarModal] = useState(false);
  const [pendingAvatarData, setPendingAvatarData] = useState<any>(null);
  const [appData, setAppData] = useState<AppData>({
    capturedPhotos: [],
    uploadedPhoto: undefined,
    generatedAvatar: undefined,
    measurements: {},
    avatarData: {
      // No default imageUrl - will show empty state until generation
      qualityScore: 0, // Default to 0 until actual generation
      metadata: {
        // Empty metadata structure - will be populated after generation
        style: 'realistic',
        quality: 'pending'
      }
    }
  });

  // Initialize dev mode functionality
  const {
    emitMeasurements,
    emitUserOnboarding,
    emitStyleProfile,
    emitClothingPrompt,
    emitOutfitName,
    emitClearAll
  } = useDevMode();

  // Debug log to see current state
  console.log('App rendering, currentScreen:', currentScreen);
  console.log('App data status:', {
    photosCount: appData.capturedPhotos.length,
    hasMeasurements: !!appData.measurements,
    avatarDataReady: !!appData.avatarData
  });

  // Hotkey to toggle dev panel (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Shift+D (or Cmd+Shift+D on Mac)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setShowDevPanel(prev => {
          // If hiding panel, reset collapsed state
          if (prev) {
            setIsDevPanelCollapsed(false);
            return false;
          } else {
            // If showing panel, show it expanded
            setIsDevPanelCollapsed(false);
            return true;
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load user data on app initialization
  useEffect(() => {
    const loadedUserData = UserService.getUserData();
    setUserData(loadedUserData);
  }, []);

  // Load saved avatar and determine initial screen on app initialization
  useEffect(() => {
    const checkAndLoadSavedAvatar = () => {
      console.log('🔍 [APP] Checking for saved avatars on initialization...');

      // Check if we already have an avatar in current session
      if (appData.generatedAvatar) {
        console.log('✅ [APP] Avatar already loaded in current session');
        return;
      }

      // Try to load the default avatar
      const defaultAvatar = avatarManagementService.getDefaultAvatar();
      const hasOnboarding = UserService.hasShownOnboarding();
      const hasCompletedStyleProfile = localStorage.getItem('styleProfile') !== null;

      if (defaultAvatar && hasOnboarding && hasCompletedStyleProfile) {
        console.log('🎭 [APP] Found default avatar, completed onboarding, and style profile - showing loading screen');
        console.log('🎭 [APP] Loading avatar:', defaultAvatar.name);

        // Set to loading screen
        setCurrentScreen('loading');

        // Convert saved avatar to app data format
        const restoredAvatarData = {
          imageUrl: defaultAvatar.imageUrl,
          animatedVideoUrl: defaultAvatar.animatedVideoUrl,
          metadata: {
            demoMode: defaultAvatar.metadata.source === 'demo',
            quality: defaultAvatar.metadata.quality,
            source: defaultAvatar.metadata.source
          }
        };

        // Update app state with restored avatar
        setAppData(prev => ({
          ...prev,
          generatedAvatar: restoredAvatarData,
          avatarData: {
            imageUrl: defaultAvatar.imageUrl,
            qualityScore: defaultAvatar.metadata.quality === 'high' ? 90 :
                         defaultAvatar.metadata.quality === 'medium' ? 70 : 50,
            metadata: {
              style: 'realistic',
              quality: defaultAvatar.metadata.quality
            }
          }
        }));

        // Load avatar into management service
        avatarManagementService.loadAvatarFromLibrary(defaultAvatar.id);

        // Transition to avatar homepage after loading delay
        setTimeout(() => {
          console.log('✅ [APP] Loading complete, navigating to Avatar Homepage');
          setCurrentScreen('avatarHomepage');
        }, 1800); // 1.8 second loading screen

        console.log('✅ [APP] Default avatar restored successfully');
      } else if (defaultAvatar && !hasOnboarding) {
        // Has avatar but hasn't completed onboarding yet
        console.log('🎭 [APP] Found default avatar but onboarding not complete - loading avatar only');

        const restoredAvatarData = {
          imageUrl: defaultAvatar.imageUrl,
          animatedVideoUrl: defaultAvatar.animatedVideoUrl,
          metadata: {
            demoMode: defaultAvatar.metadata.source === 'demo',
            quality: defaultAvatar.metadata.quality,
            source: defaultAvatar.metadata.source
          }
        };

        setAppData(prev => ({
          ...prev,
          generatedAvatar: restoredAvatarData,
          avatarData: {
            imageUrl: defaultAvatar.imageUrl,
            qualityScore: defaultAvatar.metadata.quality === 'high' ? 90 :
                         defaultAvatar.metadata.quality === 'medium' ? 70 : 50,
            metadata: {
              style: 'realistic',
              quality: defaultAvatar.metadata.quality
            }
          }
        }));

        avatarManagementService.loadAvatarFromLibrary(defaultAvatar.id);
      } else {
        // No avatar or no onboarding - start at welcome screen
        console.log('📭 [APP] No saved avatar or incomplete setup - starting at welcome screen');
        const savedAvatars = avatarManagementService.getSavedAvatars();
        if (savedAvatars.length > 0) {
          console.log(`📚 [APP] Found ${savedAvatars.length} saved avatar(s), but none set as default`);
        }
      }
    };

    checkAndLoadSavedAvatar();
  }, []); // Run only once on mount

  // Helper functions for style profile auto-fill
  const getSavedStyleProfile = () => {
    try {
      const saved = localStorage.getItem('styleProfile');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading saved style profile:', error);
      return null;
    }
  };

  const getStyleProfileInfo = () => {
    const saved = getSavedStyleProfile();
    if (!saved) return null;

    // Calculate completion percentage
    let totalFields = 0;
    let filledFields = 0;

    // Count arrays
    Object.entries(saved).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        totalFields++;
        if (value.length > 0) filledFields++;
      } else if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(subValue => {
          totalFields++;
          if (Array.isArray(subValue) ? subValue.length > 0 : subValue !== null && subValue !== '') {
            filledFields++;
          }
        });
      }
    });

    const completionPercentage = Math.round((filledFields / totalFields) * 100);
    const imageCount = Object.values(saved.uploads || {}).filter(img => img !== null).length;

    return {
      completionPercentage,
      imageCount,
      hasData: filledFields > 0
    };
  };

  // Handle navigation to avatarHomepage with onboarding check
  const navigateToAvatarHomepage = () => {
    // Check if we should show onboarding popup
    if (!UserService.hasShownOnboarding()) {
      setShowOnboardingPopup(true);
    }
    setCurrentScreen('avatarHomepage');
  };

  // Handle onboarding completion
  const handleOnboardingComplete = (formData: OnboardingFormData) => {
    try {
      const newUserData = UserService.saveUserData(formData);
      setUserData(newUserData);
      setShowOnboardingPopup(false);
      console.log('Onboarding completed for:', newUserData.firstName);
    } catch (error) {
      console.error('Failed to save user data:', error);
      // Could show an error message to user here
    }
  };

  // Handle onboarding skip
  const handleOnboardingSkip = () => {
    UserService.markOnboardingShown();
    setShowOnboardingPopup(false);
    console.log('Onboarding skipped');
  };

  const screens: Screen[] = ['loading', 'welcome', 'photoCapture', 'avatarGeneration', 'appFace', 'styleProfile', 'avatarHomepage', 'closet', 'apiTest'];
  const screenLabels = {
    loading: 'L',
    welcome: '1',
    photoCapture: '2',
    avatarGeneration: '3', // This is the measurements page
    measurements: 'M', // Legacy/alternative measurements page
    appFace: '4',
    styleProfile: '5',
    avatarHomepage: '6',
    closet: 'C',
    apiTest: 'T'
  };

  const navigateToScreen = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const navigatePrevious = () => {
    const currentIndex = screens.indexOf(currentScreen);
    if (currentIndex > 0) {
      setCurrentScreen(screens[currentIndex - 1]);
    }
  };

  const navigateNext = () => {
    const currentIndex = screens.indexOf(currentScreen);
    if (currentIndex < screens.length - 1) {
      setCurrentScreen(screens[currentIndex + 1]);
    }
  };

  // Handle photo capture completion
  const handlePhotosCapture = (photos: CapturedPhoto[]) => {
    console.log('Photos received in App:', photos);
    const uploadedPhoto = photos[0]?.dataUrl; // Get first photo as uploaded photo
    setAppData(prev => ({ ...prev, capturedPhotos: photos, uploadedPhoto }));
    // Go to avatar generation page (which is the measurements page)
    setCurrentScreen('avatarGeneration');
  };

  // Handle avatar generation completion
  const handleAvatarGeneration = (data: { avatarData: any; measurements: any }) => {
    console.log('Avatar and measurements received in App:', data);

    // Update app state
    setAppData(prev => ({
      ...prev,
      generatedAvatar: data.avatarData,
      measurements: data.measurements,
      // Also update avatarData so it shows on the homepage
      avatarData: data.avatarData ? {
        imageUrl: data.avatarData.imageUrl || data.avatarData,
        qualityScore: data.avatarData.qualityScore || 85,
        metadata: {
          style: 'realistic',
          quality: 'high',
          ...(data.avatarData.metadata || {})
        }
      } : null
    }));

    // Navigate to try-on page (page 4)
    setCurrentScreen('appFace');
  };

  // Handle navigation from AppFace (page 4) - show save modal before style profile
  const handleAppFaceNext = () => {
    // Prepare avatar data for save modal
    setPendingAvatarData({
      avatarData: appData.generatedAvatar,
      measurements: appData.measurements
    });
    setShowSaveAvatarModal(true);
  };

  // Handle save avatar decision
  const handleSaveAvatarDecision = (shouldSave: boolean, avatarName?: string) => {
    if (pendingAvatarData && shouldSave && pendingAvatarData.avatarData?.imageUrl) {
      try {
        const isFirstAvatar = !avatarManagementService.hasStoredAvatars();
        const finalName = avatarName || (isFirstAvatar ? 'My Avatar' : `Avatar ${new Date().toLocaleDateString()}`);

        // Save to avatar library (set as default if it's the first one)
        const savedAvatar = avatarManagementService.saveAvatarToLibrary(
          pendingAvatarData.avatarData.imageUrl,
          finalName,
          isFirstAvatar // Set as default if first avatar
        );

        if (savedAvatar) {
          console.log(`💾 [APP] Avatar saved to library: ${savedAvatar.name}${isFirstAvatar ? ' (set as default)' : ''}`);
        }

        // Initialize avatar management session
        avatarManagementService.initializeAvatar(pendingAvatarData.avatarData.imageUrl, false);
      } catch (error) {
        console.error('❌ [APP] Failed to save avatar:', error);
      }
    }

    // Navigate to style profile page (page 5)
    setShowSaveAvatarModal(false);
    setPendingAvatarData(null);
    setCurrentScreen('styleProfile');
  };

  // Handle avatar update when outfit is applied
  const handleAvatarUpdate = (updatedAvatarData: any) => {
    console.log('Avatar updated with outfit:', updatedAvatarData);
    setAppData(prev => ({
      ...prev,
      // Update both generatedAvatar and avatarData to ensure consistency
      generatedAvatar: updatedAvatarData,
      avatarData: {
        imageUrl: updatedAvatarData.imageUrl,
        qualityScore: prev.avatarData?.qualityScore || 85,
        withOutfit: updatedAvatarData.withOutfit || false,
        outfitDetails: updatedAvatarData.outfitDetails,
        metadata: {
          ...(prev.avatarData?.metadata || {}),
          lastUpdate: new Date().toISOString()
        }
      }
    }));
  };

  // Handle avatar reset - navigate back to photo capture and clear avatar data
  const handleResetAvatar = () => {
    console.log('Resetting avatar - returning to photo capture flow');

    // Store the fact that we're coming from reset
    const existingPhoto = appData.uploadedPhoto;

    // Option 1: If user has existing photo, ask if they want to keep it
    if (existingPhoto && window.confirm('Do you want to keep your existing photo and just update measurements?')) {
      console.log('📸 Keeping existing photo, going directly to avatar generation');

      // Clear only avatar data but keep photo
      setAppData(prev => ({
        ...prev,
        generatedAvatar: undefined,
        measurements: null,
        avatarData: {
          qualityScore: 0,
          metadata: {
            style: 'realistic',
            quality: 'pending'
          }
        }
      }));

      // Go directly to measurements with existing photo
      setCurrentScreen('appFace');
      return;
    }

    // Option 2: Full reset - clear everything
    setAppData(prev => ({
      ...prev,
      capturedPhotos: [], // Clear photos to force new capture
      uploadedPhoto: undefined,
      generatedAvatar: undefined,
      measurements: null,
      avatarData: {
        qualityScore: 0,
        metadata: {
          style: 'realistic',
          quality: 'pending'
        }
      }
    }));

    // Navigate back to photo capture (page 2)
    setCurrentScreen('photoCapture');
  };

  // Handle navigation to closet with door transition
  const handleNavigateToCloset = () => {
    setShowDoorTransition(true);
    setPendingScreen('closet');
  };

  // Handle navigation from closet with door closing transition
  const handleNavigateFromCloset = () => {
    setShowExitDoorTransition(true);
  };

  // Handle door transition completion
  const handleDoorTransitionComplete = () => {
    setShowDoorTransition(false);
    if (pendingScreen) {
      setCurrentScreen(pendingScreen);
      setPendingScreen(null);
    }
  };

  // Handle exit door transition completion
  const handleExitDoorTransitionComplete = () => {
    setShowExitDoorTransition(false);
    setCurrentScreen('avatarHomepage'); // Direct to page 6
  };

  const renderScreen = () => {
    console.log('🔍 RENDER DEBUG - Current screen:', currentScreen);
    console.log('🔍 RENDER DEBUG - App data:', {
      hasGeneratedAvatar: !!appData.generatedAvatar,
      hasMeasurements: !!appData.measurements,
      hasAvatarData: !!appData.avatarData?.imageUrl,
      hasUploadedPhoto: !!appData.uploadedPhoto
    });

    switch (currentScreen) {
      case 'loading':
        return <LoadingScreen message="Loading your wardrobe..." />;

      case 'welcome':
        return (
          <WelcomeScreen
            onNext={() => setCurrentScreen('photoCapture')}
            onLoadSavedAvatar={(avatarId: string) => {
              // Load saved avatar and skip to try-on page
              const avatarState = avatarManagementService.loadAvatarFromLibrary(avatarId);
              if (avatarState) {
                console.log('🎭 [APP] Loaded saved avatar from welcome screen');
                setCurrentScreen('appFace'); // Skip directly to try-on
              }
            }}
          />
        );

      case 'photoCapture':
        return <PhotoCaptureFlow onNext={handlePhotosCapture} />;


      case 'measurements':
        return (
          <AvatarMeasurementsPage
            uploadedPhoto={appData.uploadedPhoto}
            avatarData={appData.avatarData}
            onNext={handleAvatarGeneration}
            onBack={() => setCurrentScreen('photoCapture')}
          />
        );
      case 'avatarGeneration':
        return (
          <AvatarGeneration
            onNext={handleAvatarGeneration}
            onBack={() => setCurrentScreen('photoCapture')}
            uploadedPhoto={appData.uploadedPhoto}
            measurements={appData.measurements}
          />
        );

      case 'appFace':
        console.log('🔍 RENDER DEBUG - Attempting to render AppFacePage');
        console.log('🔍 RENDER DEBUG - generatedAvatar:', appData.generatedAvatar);
        try {
          return (
            <AppFacePage
              onNext={handleAppFaceNext}
              onBack={() => setCurrentScreen('avatarGeneration')}
              generatedAvatar={appData.generatedAvatar}
              onAvatarUpdate={handleAvatarUpdate}
            />
          );
        } catch (error) {
          console.error('❌ RENDER ERROR - AppFacePage failed:', error);
          return <div>AppFacePage Error: {error.message}</div>;
        }

      case 'styleProfile':
        console.log('🔍 RENDER DEBUG - Attempting to render Page4Component');
        console.log('🔍 RENDER DEBUG - avatarData:', appData.avatarData);
        console.log('🔍 RENDER DEBUG - measurements:', appData.measurements);
        try {
          return (
            <Page4Component
              onNext={navigateToAvatarHomepage}
              onBack={() => setCurrentScreen('appFace')}
              avatarData={appData.avatarData}
              measurements={appData.measurements}
              autoFillData={useAutoFillStyleProfile ? getSavedStyleProfile() : null}
            />
          );
        } catch (error) {
          console.error('❌ RENDER ERROR - Page4Component failed:', error);
          return <div>Page4Component Error: {error.message}</div>;
        }

      case 'avatarHomepage':
        console.log('🔍 RENDER DEBUG - Attempting to render AvatarHomepage');
        console.log('🔍 RENDER DEBUG - avatarData:', appData.avatarData);
        console.log('🔍 RENDER DEBUG - userData:', userData);
        try {
          return (
            <AvatarHomepage
              onBack={() => setCurrentScreen('styleProfile')}
              onNavigateToOutfitChange={() => setCurrentScreen('appFace')}
              onNavigateToMeasurements={() => setCurrentScreen('appFace')}
              onNavigateToStyleProfile={() => setCurrentScreen('styleProfile')}
              onNavigateToCloset={handleNavigateToCloset}
              onNavigateToMyOutfits={() => setCurrentScreen('myOutfits')}
              onResetAvatar={handleResetAvatar}
              onAvatarUpdate={handleAvatarUpdate}
              avatarData={appData.avatarData}
              userData={userData}
              styleProfile={(() => {
                try {
                  return JSON.parse(localStorage.getItem('styleProfile') || '{}');
                } catch {
                  return {};
                }
              })()}
            />
          );
        } catch (error) {
          console.error('❌ RENDER ERROR - AvatarHomepage failed:', error);
          return <div>AvatarHomepage Error: {error.message}</div>;
        }

      // Seedream test case removed - component disabled

      case 'closet':
        return (
          <ClosetExperience
            onBack={handleNavigateFromCloset}
            avatarData={appData.avatarData}
            initialView="interior"
          />
        );

      case 'myOutfits':
        return (
          <MyOutfitsPage
            onBack={() => setCurrentScreen('avatarHomepage')}
          />
        );

      case 'apiTest':
        return <ApiTestPage />;

      default:
        return <WelcomeScreen onNext={() => setCurrentScreen('photoCapture')} />;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* If share link detected, show SharedOutfit */}
      {shareId ? (
        <SharedOutfit
          shareId={shareId}
          onCreateOwn={() => {
            setShareId(null);
            setCurrentScreen('welcome');
            // Clear URL param
            window.history.replaceState({}, '', window.location.pathname);
          }}
        />
      ) : (
        <>
          {/* Content */}
          <div className="relative z-10">
            {renderScreen()}

        {/* Development Navigation Panel */}
        {isDevelopment && showDevPanel && !isDevPanelCollapsed && (
          <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-md text-white rounded-xl p-3 shadow-2xl z-50 border border-white/20 transition-all duration-300">
            <div className="text-xs text-gray-300 mb-2 text-center flex items-center justify-between">
              <span>DEV PANEL</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-[10px]">Ctrl+Shift+D</span>
                <button
                  onClick={() => setIsDevPanelCollapsed(true)}
                  className="text-gray-400 hover:text-white transition-colors duration-200 hover:scale-110"
                  title="Collapse panel"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex space-x-1 mb-3">
              {screens.map((screen) => (
                <button
                  key={screen}
                  onClick={() => navigateToScreen(screen)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 ${
                    currentScreen === screen
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/50'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:scale-110'
                  }`}
                >
                  {screenLabels[screen]}
                </button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={navigatePrevious}
                disabled={currentScreen === screens[0]}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Prev</span>
              </button>

              <button
                onClick={navigateNext}
                disabled={currentScreen === screens[screens.length - 1]}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              >
                <span>Next</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Current Screen Label */}
            <div className="text-xs text-gray-400 mt-2 text-center capitalize">
              {currentScreen === 'loading' ? 'Loading...' :
               currentScreen === 'avatarGeneration' ? 'Measurements & Avatar Generation' :
               currentScreen === 'measurements' ? 'Alternative Measurements Page' :
               currentScreen === 'styleProfile' ? 'Style Personalization' :
               currentScreen === 'appFace' ? 'Try On Outfits' :
               currentScreen === 'avatarHomepage' ? 'Avatar Dashboard' :
               currentScreen === 'closet' ? 'My Closet' :
               currentScreen === 'apiTest' ? 'API Connection Test' :
               currentScreen.replace(/([A-Z])/g, ' $1').trim()}
            </div>

            {/* Debug Data Status */}
            <div className="mt-3 pt-3 border-t border-gray-600 text-xs">
              <div className="text-gray-400 mb-1">Data Status:</div>
              <div className={`${appData.capturedPhotos.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                Photos: {appData.capturedPhotos.length}/3
              </div>
              <div className={`${appData.measurements ? 'text-green-400' : 'text-red-400'}`}>
                Measurements: {appData.measurements ? 'Ready' : 'Missing'}
              </div>
              {appData.capturedPhotos.length > 0 && (
                <div className="text-gray-300 mt-1">
                  Views: {appData.capturedPhotos.map(p => p.view).join(', ')}
                </div>
              )}
            </div>

            {/* Auto-Fill Controls */}
            <div className="mt-3 pt-3 border-t border-gray-600 space-y-3">
              {/* Measurements Auto-Fill */}
              <div>
                <label className="flex items-center space-x-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useDefaultMeasurements}
                    onChange={(e) => {
                      setUseDefaultMeasurements(e.target.checked);
                      if (e.target.checked) {
                        emitMeasurements();
                      }
                    }}
                    className="w-3 h-3 text-amber-600 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-1"
                  />
                  <span className="text-gray-300">Auto-fill measurements</span>
                  {useDefaultMeasurements && (
                    <span className="text-green-400 text-[10px]">✓</span>
                  )}
                </label>
                <div className="text-gray-500 text-[10px] mt-1">
                  4'11", 35", 23", 24", 24", 25"
                </div>
              </div>

              {/* User Onboarding Auto-Fill */}
              <div>
                <label className="flex items-center space-x-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAutoFillUserData}
                    onChange={(e) => {
                      setUseAutoFillUserData(e.target.checked);
                      if (e.target.checked) {
                        emitUserOnboarding();
                      }
                    }}
                    className="w-3 h-3 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 focus:ring-1"
                  />
                  <span className="text-gray-300">Auto-fill user data</span>
                  {useAutoFillUserData && (
                    <span className="text-blue-400 text-[10px]">✓</span>
                  )}
                </label>
                <div className="text-gray-500 text-[10px] mt-1">
                  Name: Alex, DOB: 1995-06-15
                </div>
              </div>

              {/* Clothing Prompts Auto-Fill */}
              <div>
                <label className="flex items-center space-x-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAutoFillClothingPrompts}
                    onChange={(e) => {
                      setUseAutoFillClothingPrompts(e.target.checked);
                      if (e.target.checked) {
                        emitClothingPrompt();
                      }
                    }}
                    className="w-3 h-3 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-600 focus:ring-1"
                  />
                  <span className="text-gray-300">Auto-fill clothing prompts</span>
                  {useAutoFillClothingPrompts && (
                    <span className="text-purple-400 text-[10px]">✓</span>
                  )}
                </label>
                <div className="text-gray-500 text-[10px] mt-1">
                  Random style-based prompts
                </div>
              </div>

              {/* Outfit Names Auto-Fill */}
              <div>
                <label className="flex items-center space-x-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAutoFillOutfitNames}
                    onChange={(e) => {
                      setUseAutoFillOutfitNames(e.target.checked);
                      if (e.target.checked) {
                        emitOutfitName();
                      }
                    }}
                    className="w-3 h-3 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-600 focus:ring-1"
                  />
                  <span className="text-gray-300">Auto-fill outfit names</span>
                  {useAutoFillOutfitNames && (
                    <span className="text-pink-400 text-[10px]">✓</span>
                  )}
                </label>
                <div className="text-gray-500 text-[10px] mt-1">
                  Creative outfit names
                </div>
              </div>
            </div>

            {/* Utility Controls */}
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    emitClearAll();
                    setUseDefaultMeasurements(false);
                    setUseAutoFillUserData(false);
                    setUseAutoFillClothingPrompts(false);
                    setUseAutoFillOutfitNames(false);
                    setUseAutoFillStyleProfile(false);
                  }}
                  className="flex items-center space-x-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-all duration-200 hover:scale-105"
                  title="Clear all demo data"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>

                <button
                  onClick={() => {
                    emitMeasurements();
                    emitUserOnboarding();
                    emitClothingPrompt();
                    emitOutfitName();
                    if (getSavedStyleProfile()) {
                      emitStyleProfile();
                    }
                  }}
                  className="flex items-center space-x-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-all duration-200 hover:scale-105"
                  title="Fill all forms with demo data"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Fill All</span>
                </button>
              </div>
            </div>

            {/* Auto-Fill Style Profile Control */}
            {(() => {
              const styleInfo = getStyleProfileInfo();
              return styleInfo && styleInfo.hasData ? (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAutoFillStyleProfile}
                      onChange={(e) => setUseAutoFillStyleProfile(e.target.checked)}
                      className="w-3 h-3 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-600 focus:ring-1"
                    />
                    <span className="text-gray-300">Auto-fill style profile</span>
                    {useAutoFillStyleProfile && (
                      <span className="text-green-400 text-[10px]">✓</span>
                    )}
                  </label>
                  <div className="text-gray-500 text-[10px] mt-1">
                    {styleInfo.completionPercentage}% complete, {styleInfo.imageCount} images
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Collapsed Dev Panel */}
        {isDevelopment && showDevPanel && isDevPanelCollapsed && (
          <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-md text-white rounded-xl p-3 shadow-2xl z-50 border border-white/20 transition-all duration-300">
            <div className="text-xs text-gray-300 text-center flex items-center justify-between">
              <span>DEV PANEL</span>
              <button
                onClick={() => setIsDevPanelCollapsed(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200 hover:scale-110"
                title="Expand panel"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Hidden Dev Panel Indicator */}
        {isDevelopment && !showDevPanel && (
          <div
            className="fixed bottom-4 right-4 bg-black/60 backdrop-blur-md text-white rounded-lg px-3 py-2 shadow-lg z-40 border border-white/20 cursor-pointer hover:bg-black/80 transition-all duration-200 hover:scale-105"
            onClick={() => {
              setShowDevPanel(true);
              setIsDevPanelCollapsed(false);
            }}
            title="Click to open dev panel"
          >
            <div className="text-xs text-gray-300 text-center">
              Press <span className="text-white font-mono">Ctrl+Shift+D</span> for dev panel
            </div>
          </div>
        )}

        {/* User Onboarding Popup */}
        <UserOnboardingPopup
          isOpen={showOnboardingPopup}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />

        {/* Save Avatar Modal */}
        <SaveAvatarModal
          isOpen={showSaveAvatarModal}
          onSave={(name) => handleSaveAvatarDecision(true, name)}
          onSkip={() => handleSaveAvatarDecision(false)}
        />

        {/* Door Transition Animation */}
        <DoorTransition
          isVisible={showDoorTransition}
          direction="opening"
          onComplete={handleDoorTransitionComplete}
        />

        {/* Exit Door Transition Animation */}
        <DoorTransition
          isVisible={showExitDoorTransition}
          direction="closing"
          onComplete={handleExitDoorTransitionComplete}
        />

      </div>
      </>
    )}
    </div>
  );
}

export default App;