import React, { useState } from 'react';

console.log('🚨 DIAGNOSTIC: App.minimal.tsx loading...');

function App() {
  console.log('🚨 DIAGNOSTIC: App.minimal component rendering...');

  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'test'>('welcome');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          TheFitChecked - MINIMAL TEST
        </h1>
        <p className="text-gray-600 mb-4">
          If you can see this, the basic App structure is working!
        </p>

        <div className="space-y-4">
          <button
            onClick={() => setCurrentScreen(currentScreen === 'welcome' ? 'test' : 'welcome')}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Current Screen: {currentScreen} (Click to toggle)
          </button>

          <div className="p-4 bg-green-100 border border-green-300 rounded">
            ✅ React state management working
          </div>

          <div className="p-4 bg-blue-100 border border-blue-300 rounded">
            ✅ Tailwind CSS classes working
          </div>

          <div className="p-4 bg-purple-100 border border-purple-300 rounded">
            ✅ Click events working
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;