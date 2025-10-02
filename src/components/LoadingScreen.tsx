import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Loading your wardrobe..." }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-8 text-center relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900 via-transparent to-slate-900"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-amber-300 rotate-45 opacity-20"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border border-amber-300 rotate-12 opacity-20"></div>
      </div>

      {/* Logo Container */}
      <div className="mb-8 z-10 animate-fade-in">
        <div className="relative">
          {/* Main Logo with Pulse Animation */}
          <img
            src="/Untitled design.PNG"
            alt="TheFitChecked Logo"
            className="w-80 md:w-96 h-auto mx-auto drop-shadow-2xl bg-transparent animate-gentle-pulse"
            style={{
              filter: 'contrast(1.2) brightness(1.1)',
              mixBlendMode: 'multiply'
            }}
          />

          {/* Luminous Green Checkmark - Animated */}
          <div className="absolute top-8 right-8 md:right-12">
            <img
              src="/Untitled design 2.png.PNG"
              alt="Idea Checkmark"
              className="w-12 h-12 md:w-16 md:h-16 animate-lightbulb-flicker"
              style={{
                filter: 'contrast(1.3) brightness(1.2)',
                mixBlendMode: 'screen'
              }}
            />
          </div>
        </div>
      </div>

      {/* Loading Message */}
      <div className="z-10 mt-8 animate-fade-in-delayed">
        <p className="text-xl md:text-2xl font-medium text-gray-700 mb-4">
          {message}
        </p>

        {/* Loading Dots Animation */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes gentle-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.02);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-delayed {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          40% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-gentle-pulse {
          animation: gentle-pulse 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-fade-in-delayed {
          animation: fade-in-delayed 1.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
