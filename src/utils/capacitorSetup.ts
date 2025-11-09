/**
 * Capacitor Setup & Initialization for TheFitChecked
 *
 * Initialize all Capacitor plugins when the app starts.
 * Call initializeCapacitor() in App.tsx on mount.
 */

import statusBar from './statusBar';
import appLifecycle from './appLifecycle';

/**
 * Initialize all Capacitor plugins
 * Call this once in App.tsx useEffect
 */
export const initializeCapacitor = async () => {
  console.log('🚀 Initializing Capacitor plugins...');

  try {
    // Initialize Status Bar
    await statusBar.initialize();

    // Initialize App Lifecycle & Deep Linking
    await appLifecycle.initialize();

    console.log('✅ Capacitor initialization complete');
  } catch (err) {
    console.error('❌ Capacitor initialization failed:', err);
  }
};

/**
 * Example App.tsx Integration:
 *
 * import { initializeCapacitor } from './utils/capacitorSetup';
 *
 * function App() {
 *   useEffect(() => {
 *     initializeCapacitor();
 *   }, []);
 *
 *   return <YourApp />;
 * }
 */
