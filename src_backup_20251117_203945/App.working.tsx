import React, { useState } from 'react';

// Import only the working components - adding them back gradually
import WelcomeScreen from './components/WelcomeScreen';
import PhotoCaptureFlow from './components/PhotoCaptureFlow';
import AvatarMeasurementsPage from './components/AvatarMeasurementsPage';
import AvatarGeneration from './components/AvatarGeneration';
import AppFacePage from './components/AppFacePage';
import Page4Component from './components/Page4Component';
import AvatarHomepageRestored from './components/AvatarHomepageRestored';
import ClosetExperience from './components/ClosetExperience';

console.log('🚨 DIAGNOSTIC: App.working.tsx loading - testing with real WelcomeScreen component...');

type Screen = 'welcome' | 'photoCapture' | 'measurements' | 'avatarGeneration' | 'appFace' | 'styleProfile' | 'avatarHomepage' | 'closet';

function App() {
  console.log('TheFitChecked App - Working Version');

  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [appData, setAppData] = useState({
    capturedPhotos: [],
    uploadedPhoto: undefined,
    measurements: {},
    generatedAvatar: undefined,
    styleProfile: undefined,
    updatedAvatar: undefined
  });

  const renderScreen = () => {
    console.log('🔍 RENDER DEBUG - Current screen:', currentScreen);

    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNext={() => setCurrentScreen('photoCapture')} />;

      case 'photoCapture':
        return (
          <PhotoCaptureFlow
            onNext={(photos) => {
              console.log('Photos captured:', photos);
              const uploadedPhoto = photos[0]?.dataUrl;
              setAppData(prev => ({ ...prev, capturedPhotos: photos, uploadedPhoto }));
              setCurrentScreen('measurements');
            }}
          />
        );

      case 'measurements':
        return (
          <AvatarMeasurementsPage
            onNext={() => setCurrentScreen('avatarGeneration')}
            onBack={() => setCurrentScreen('photoCapture')}
            onMeasurementsSubmit={(measurements) => {
              console.log('Measurements submitted:', measurements);
              setAppData(prev => ({ ...prev, measurements }));
              setCurrentScreen('avatarGeneration');
            }}
            autoFillData={null}
          />
        );

      case 'avatarGeneration':
        return (
          <AvatarGeneration
            onNext={(data) => {
              console.log('Avatar generated:', data);
              setAppData(prev => ({
                ...prev,
                generatedAvatar: data.avatarData,
                measurements: data.measurements
              }));
              // Move to virtual try-on screen
              setCurrentScreen('appFace');
            }}
            onBack={() => setCurrentScreen('measurements')}
            uploadedPhoto={appData.uploadedPhoto}
            measurements={appData.measurements}
          />
        );

      case 'appFace':
        return (
          <AppFacePage
            onNext={() => setCurrentScreen('styleProfile')}
            onBack={() => setCurrentScreen('avatarGeneration')}
            generatedAvatar={appData.generatedAvatar}
            onAvatarUpdate={(avatarData) => {
              setAppData(prev => ({ ...prev, updatedAvatar: avatarData }));
            }}
          />
        );

      case 'styleProfile':
        return (
          <Page4Component
            onNext={() => {
              // Page4Component doesn't pass data - we would need to get it differently
              // For now, just navigate to next screen
              setCurrentScreen('avatarHomepage');
            }}
            onBack={() => setCurrentScreen('appFace')}
            avatarData={appData.updatedAvatar || appData.generatedAvatar}
            measurements={appData.measurements}
            autoFillData={null}
          />
        );

      case 'avatarHomepage':
        return (
          <AvatarHomepageRestored
            onBack={() => setCurrentScreen('styleProfile')}
            onNavigateToCloset={() => setCurrentScreen('closet')}
            onNavigateToOutfitChange={() => setCurrentScreen('appFace')}
            onNavigateToMeasurements={() => setCurrentScreen('measurements')}
            onNavigateToStyleProfile={() => setCurrentScreen('styleProfile')}
            onResetAvatar={() => {
              setAppData({
                capturedPhotos: [],
                uploadedPhoto: undefined,
                measurements: {},
                generatedAvatar: undefined,
                styleProfile: undefined,
                updatedAvatar: undefined
              });
              setCurrentScreen('welcome');
            }}
            onAvatarUpdate={(avatarData) => {
              setAppData(prev => ({ ...prev, updatedAvatar: avatarData }));
            }}
            avatarData={appData.updatedAvatar || appData.generatedAvatar}
            userData={null}
            styleProfile={appData.styleProfile}
          />
        );

      case 'closet':
        return (
          <ClosetExperience
            onBack={() => setCurrentScreen('avatarHomepage')}
            avatarData={appData.updatedAvatar || appData.generatedAvatar}
            initialView="doors"
          />
        );

      default:
        return <WelcomeScreen onNext={() => setCurrentScreen('photoCapture')} />;
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10">
        {renderScreen()}
      </div>
    </div>
  );
}

export default App;