import React, { useState } from 'react';

// Start with just the WelcomeScreen to isolate the issue
function SimpleWelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-8 text-center relative overflow-hidden">
      {/* Logo */}
      <div className="mb-8 z-10">
        <div className="relative">
          <img
            src="/Untitled design.PNG"
            alt="TheFitChecked Logo"
            className="w-80 md:w-96 h-auto mx-auto drop-shadow-2xl bg-transparent animate-keyboard-bounce hover:scale-105 transition-transform duration-300"
            style={{
              filter: 'contrast(1.2) brightness(1.1)',
              mixBlendMode: 'multiply'
            }}
          />
        </div>
      </div>

      {/* Tagline */}
      <p className="font-dancing-script text-4xl md:text-5xl mb-12 leading-relaxed max-w-md text-center text-stone-800">
        Shop Smarter, Return Never
      </p>

      {/* CTA Button */}
      <button
        onClick={onNext}
        className="relative w-full max-w-sm mx-auto group transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-slate-200/50"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-lg group-hover:shadow-xl group-hover:shadow-slate-500/15 transition-all duration-300">
          <div className="relative bg-white/2 backdrop-blur-md rounded-xl px-8 py-4 group-hover:bg-white/5 transition-all duration-300">
            <div className="flex items-center justify-center space-x-3">
              <div className="text-center">
                <div className="text-lg font-bold text-black transition-all duration-300">
                  Create Your Avatar
                </div>
                <div className="text-sm text-gray-500 group-hover:text-slate-600 transition-all duration-300">
                  Start your journey
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

function App() {
  console.log('🚨 DIAGNOSTIC: App.fixed.tsx loading - testing step by step...');

  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'next'>('welcome');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <SimpleWelcomeScreen onNext={() => setCurrentScreen('next')} />;
      case 'next':
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="bg-white/90 p-8 rounded-xl shadow-lg max-w-md mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                ✅ Welcome Screen Working!
              </h1>
              <p className="text-gray-600 mb-6">
                The basic app navigation is functioning properly.
              </p>
              <button
                onClick={() => setCurrentScreen('welcome')}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Back to Welcome
              </button>
            </div>
          </div>
        );
      default:
        return <SimpleWelcomeScreen onNext={() => setCurrentScreen('next')} />;
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