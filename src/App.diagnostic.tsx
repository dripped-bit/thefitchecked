import React, { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';

console.log('🚨 DIAGNOSTIC: App.diagnostic.tsx loading...');

function App() {
  console.log('🚨 DIAGNOSTIC: App.diagnostic function called');

  const [showTest, setShowTest] = useState(false);

  if (showTest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/90 p-8 rounded-xl shadow-lg max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            ✅ WelcomeScreen Works!
          </h1>
          <button
            onClick={() => setShowTest(false)}
            className="px-4 py-2 bg-purple-500 text-white rounded"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  try {
    console.log('🚨 DIAGNOSTIC: Trying to render WelcomeScreen...');
    return (
      <div className="min-h-screen relative">
        <div className="relative z-10">
          <WelcomeScreen onNext={() => setShowTest(true)} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('🚨 DIAGNOSTIC: Error in App render:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 p-8 rounded-xl text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">
            Render Error
          </h1>
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
}

export default App;