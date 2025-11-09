import React, { useState } from 'react';
import { App, Page, Navbar, Block, BlockTitle, List, ListItem, Card, Button } from 'konsta/react';
import { Camera, Zap, Share2, Smartphone, Info } from 'lucide-react';
import NativeCameraCapture from '../components/NativeCameraCapture';
import NativeShareButton from '../components/NativeShareButton';
import { useHaptics } from '../utils/haptics';
import { useStatusBarStyle } from '../utils/statusBar';
import { useAppStateChange, useDeepLink, useAppInfo } from '../utils/appLifecycle';
import { Photo } from '@capacitor/camera';

/**
 * Native Features Demo Page for TheFitChecked
 *
 * Interactive demo showing all Capacitor plugins in action.
 * Use this as a reference for implementing native features in your app.
 */

const NativeFeaturesDemo: React.FC = () => {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Haptics hook
  const haptics = useHaptics();

  // Status bar - set to dark mode for this page
  useStatusBarStyle('dark');

  // App info
  const appInfo = useAppInfo();

  // Add log entry
  const addLog = (message: string) => {
    setLogs(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)]);
  };

  // Listen for app state changes
  useAppStateChange((state) => {
    addLog(`App ${state.isActive ? 'became active' : 'went to background'}`);
  });

  // Listen for deep links
  useDeepLink((url, params) => {
    addLog(`Deep link opened: ${url}`);
  });

  /**
   * Haptics Demo
   */
  const testHaptics = async () => {
    addLog('Testing haptic patterns...');

    await haptics.light();
    setTimeout(async () => {
      await haptics.medium();
      setTimeout(async () => {
        await haptics.heavy();
        setTimeout(async () => {
          await haptics.success();
          addLog('Haptic test complete!');
        }, 300);
      }, 300);
    }, 300);
  };

  /**
   * Camera Demo
   */
  const handlePhotoCapture = (photoUrl: string, photo: Photo) => {
    setCapturedPhoto(photoUrl);
    addLog(`Photo captured: ${photo.format}`);
    haptics.success();
  };

  /**
   * Share Demo
   */
  const handleShareSuccess = () => {
    addLog('Photo shared successfully!');
  };

  return (
    <App theme="ios" safeAreas>
      <Page>
        <Navbar title="Native Features Demo" subtitle="TheFitChecked" />

        {/* Camera Demo */}
        <BlockTitle>📸 Camera Plugin</BlockTitle>
        <Block>
          <Card>
            {capturedPhoto ? (
              <div className="mb-4">
                <img src={capturedPhoto} alt="Captured" className="w-full h-64 object-cover rounded-lg" />
              </div>
            ) : (
              <div className="mb-4 h-64 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Camera size={48} className="text-white opacity-50" />
              </div>
            )}

            <NativeCameraCapture
              onPhotoCapture={handlePhotoCapture}
              buttonText={capturedPhoto ? 'Take Another Photo' : 'Take Photo'}
            />

            {capturedPhoto && (
              <div className="mt-2">
                <NativeShareButton
                  title="Check out this photo!"
                  text="Captured with TheFitChecked camera"
                  imageUrl={capturedPhoto}
                  buttonText="Share Photo"
                  buttonVariant="outline"
                  onShareSuccess={handleShareSuccess}
                />
              </div>
            )}
          </Card>
        </Block>

        {/* Haptics Demo */}
        <BlockTitle>📳 Haptics Plugin</BlockTitle>
        <Block>
          <List strongIos insetIos>
            <ListItem
              link
              chevronIos={false}
              title="Light Impact"
              after={
                <Button
                  inline
                  small
                  onClick={() => {
                    haptics.light();
                    addLog('Light haptic triggered');
                  }}
                >
                  <Zap size={16} className="mr-1" />
                  Try
                </Button>
              }
            />
            <ListItem
              link
              chevronIos={false}
              title="Medium Impact"
              after={
                <Button
                  inline
                  small
                  onClick={() => {
                    haptics.medium();
                    addLog('Medium haptic triggered');
                  }}
                >
                  <Zap size={16} className="mr-1" />
                  Try
                </Button>
              }
            />
            <ListItem
              link
              chevronIos={false}
              title="Heavy Impact"
              after={
                <Button
                  inline
                  small
                  onClick={() => {
                    haptics.heavy();
                    addLog('Heavy haptic triggered');
                  }}
                >
                  <Zap size={16} className="mr-1" />
                  Try
                </Button>
              }
            />
            <ListItem
              link
              chevronIos={false}
              title="Success Notification"
              after={
                <Button
                  inline
                  small
                  onClick={() => {
                    haptics.success();
                    addLog('Success haptic triggered');
                  }}
                >
                  <Zap size={16} className="mr-1" />
                  Try
                </Button>
              }
            />
            <ListItem
              link
              chevronIos={false}
              title="Error Notification"
              after={
                <Button
                  inline
                  small
                  onClick={() => {
                    haptics.error();
                    addLog('Error haptic triggered');
                  }}
                >
                  <Zap size={16} className="mr-1" />
                  Try
                </Button>
              }
            />
            <ListItem
              link
              chevronIos={false}
              title="Double Tap (Like)"
              after={
                <Button
                  inline
                  small
                  onClick={() => {
                    haptics.doubleTap();
                    addLog('Double tap haptic triggered');
                  }}
                >
                  <Zap size={16} className="mr-1" />
                  Try
                </Button>
              }
            />
          </List>

          <div className="mt-2">
            <Button rounded onClick={testHaptics}>
              Test All Haptics
            </Button>
          </div>
        </Block>

        {/* Deep Linking Demo */}
        <BlockTitle>🔗 Deep Linking</BlockTitle>
        <Block>
          <Card className="p-4">
            <p className="text-sm text-gray-600 mb-3">
              Test deep links by opening these URLs in Safari on your device:
            </p>
            <div className="space-y-2 text-xs font-mono bg-gray-100 p-3 rounded-lg">
              <div>thefitchecked://outfit/123</div>
              <div>thefitchecked://closet?view=favorites</div>
              <div>thefitchecked://share/abc123</div>
            </div>
          </Card>
        </Block>

        {/* App Info */}
        <BlockTitle>ℹ️ App Information</BlockTitle>
        <Block>
          <List strongIos insetIos>
            <ListItem title="App Name" after={appInfo?.name || 'TheFitChecked'} />
            <ListItem title="Bundle ID" after={appInfo?.id || 'com.thefitchecked.app'} />
            <ListItem title="Version" after={appInfo?.version || '1.0.0'} />
            <ListItem title="Build" after={appInfo?.build || '1'} />
          </List>
        </Block>

        {/* Event Logs */}
        <BlockTitle>📋 Event Logs</BlockTitle>
        <Block>
          <Card className="p-4">
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No events logged yet. Interact with features above to see logs.
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="text-xs font-mono bg-gray-100 p-2 rounded"
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}

            {logs.length > 0 && (
              <Button
                clear
                small
                onClick={() => {
                  setLogs([]);
                  haptics.light();
                }}
                className="mt-2"
              >
                Clear Logs
              </Button>
            )}
          </Card>
        </Block>

        {/* Instructions */}
        <Block className="pb-8">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-900 font-semibold mb-1">
                  Testing on Device
                </p>
                <p className="text-xs text-blue-800">
                  Haptics only work on physical iOS devices. Camera works in
                  simulator but won't show iOS native camera. Deep links must be
                  tested from Safari or Messages.
                </p>
              </div>
            </div>
          </Card>
        </Block>
      </Page>
    </App>
  );
};

/**
 * To use this demo page in your app:
 *
 * 1. Import and add to your routing:
 *    import NativeFeaturesDemo from './examples/NativeFeaturesDemo';
 *
 * 2. Add route:
 *    <Route path="/demo" component={NativeFeaturesDemo} />
 *
 * 3. Navigate to /demo to see all features in action
 */

export default NativeFeaturesDemo;
