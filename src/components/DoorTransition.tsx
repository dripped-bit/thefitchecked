import React, { useEffect, useState } from 'react';

interface DoorTransitionProps {
  isVisible: boolean;
  direction?: 'opening' | 'closing';
  onComplete: () => void;
}

const DoorTransition: React.FC<DoorTransitionProps> = ({ isVisible, direction = 'opening', onComplete }) => {
  const [animationPhase, setAnimationPhase] = useState<'closed' | 'opening' | 'opened' | 'closing'>('closed');

  useEffect(() => {
    if (isVisible) {
      if (direction === 'opening') {
        setAnimationPhase('opening');
        const timer = setTimeout(() => {
          setAnimationPhase('opened');
          onComplete();
        }, 2000); // 2 second door opening animation

        return () => clearTimeout(timer);
      } else if (direction === 'closing') {
        setAnimationPhase('closing');
        const timer = setTimeout(() => {
          setAnimationPhase('closed');
          onComplete();
        }, 2000); // 2 second door closing animation

        return () => clearTimeout(timer);
      }
    } else {
      setAnimationPhase('closed');
    }
  }, [isVisible, direction, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Door Frame */}
      <div className="relative w-96 h-96" style={{ perspective: '1000px' }}>
        {/* Left Door */}
        <div
          className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-amber-800 to-amber-900 border-r-4 border-amber-700 transition-transform duration-2000 ease-in-out"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'left center',
            transform: animationPhase === 'opening' || animationPhase === 'opened'
              ? 'rotateY(-120deg)'
              : 'rotateY(0deg)'
          }}
        >
          {/* Door Panel Details */}
          <div className="absolute inset-4 border-2 border-amber-600 rounded-lg">
            <div className="absolute top-1/2 right-4 w-3 h-3 bg-amber-600 rounded-full"></div>
          </div>
          {/* Door Handle */}
          <div className="absolute top-1/2 right-2 w-2 h-6 bg-amber-400 rounded-full shadow-lg"></div>
        </div>

        {/* Right Door */}
        <div
          className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-amber-800 to-amber-900 border-l-4 border-amber-700 transition-transform duration-2000 ease-in-out"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'right center',
            transform: animationPhase === 'opening' || animationPhase === 'opened'
              ? 'rotateY(120deg)'
              : 'rotateY(0deg)'
          }}
        >
          {/* Door Panel Details */}
          <div className="absolute inset-4 border-2 border-amber-600 rounded-lg">
            <div className="absolute top-1/2 left-4 w-3 h-3 bg-amber-600 rounded-full"></div>
          </div>
          {/* Door Handle */}
          <div className="absolute top-1/2 left-2 w-2 h-6 bg-amber-400 rounded-full shadow-lg"></div>
        </div>

        {/* Door Frame */}
        <div className="absolute inset-0 border-8 border-amber-900 rounded-t-lg pointer-events-none">
          {/* Top Frame Arch */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-32 h-16 border-8 border-amber-900 border-b-0 rounded-t-full"></div>
        </div>

        {/* Revealed Closet Behind Door */}
        {animationPhase === 'opened' && (
          <div className="absolute inset-0 bg-gradient-to-b from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">👗</div>
              <p className="text-purple-800 font-bold text-xl">Welcome to Your Closet!</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading Text */}
      <div className="absolute bottom-20 text-center">
        <div className="flex items-center space-x-2 text-white text-lg font-medium">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span>{direction === 'closing' ? 'Closing your closet...' : 'Opening your closet...'}</span>
        </div>
      </div>
    </div>
  );
};

export default DoorTransition;