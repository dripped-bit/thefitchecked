import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-purple-600 mb-4">TheFitChecked</h1>
        <p className="text-gray-600 mb-8">FAL API Integration Test</p>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-green-600 font-semibold">✅ App is loading correctly!</p>
          <p className="text-sm text-gray-500 mt-2">FAL API integration is ready</p>
        </div>
      </div>
    </div>
  );
}

export default App;