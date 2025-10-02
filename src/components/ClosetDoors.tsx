import React, { useState, useEffect } from 'react';
import { Sparkles, Star, Crown, Trophy } from 'lucide-react';

interface ClosetDoorsProps {
  isOpen: boolean;
  onAnimationComplete?: () => void;
  achievementLevel?: 'beginner' | 'stylish' | 'fashionista' | 'curator';
}

const ClosetDoors: React.FC<ClosetDoorsProps> = ({
  isOpen,
  onAnimationComplete,
  achievementLevel = 'beginner'
}) => {
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowSparkles(true);
      const timer = setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onAnimationComplete]);

  const getAchievementIcon = () => {
    switch (achievementLevel) {
      case 'beginner':
        return <Star className="w-6 h-6 text-yellow-400" />;
      case 'stylish':
        return <Sparkles className="w-6 h-6 text-purple-400" />;
      case 'fashionista':
        return <Crown className="w-6 h-6 text-pink-400" />;
      case 'curator':
        return <Trophy className="w-6 h-6 text-gold-400" />;
      default:
        return <Star className="w-6 h-6 text-yellow-400" />;
    }
  };

  const getAchievementTitle = () => {
    switch (achievementLevel) {
      case 'beginner':
        return 'Style Explorer';
      case 'stylish':
        return 'Fashion Forward';
      case 'fashionista':
        return 'Style Icon';
      case 'curator':
        return 'Closet Curator';
      default:
        return 'Style Explorer';
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center perspective-1000">
      {/* Sparkle Effects */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute animate-ping`}
              style={{
                left: `${20 + (i * 7)}%`,
                top: `${10 + ((i % 3) * 30)}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.8s'
              }}
            >
              <Sparkles className="w-4 h-4 text-purple-400 opacity-70" />
            </div>
          ))}
        </div>
      )}

      {/* Achievement Badge */}
      <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2 shadow-lg transition-all duration-500 ${
        isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        {getAchievementIcon()}
        <span className="font-medium text-gray-800 text-sm">{getAchievementTitle()}</span>
      </div>

      {/* Left Door */}
      <div
        className={`absolute left-0 w-1/2 h-full bg-gradient-to-br from-amber-900 via-amber-800 to-amber-700 shadow-2xl transition-transform duration-1000 ease-in-out origin-left ${
          isOpen ? '-rotate-y-90' : 'rotate-y-0'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          backgroundImage: `
            linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      >
        {/* Door Handle */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-3 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-lg"></div>

        {/* Door Panel Details */}
        <div className="absolute inset-4 border-2 border-amber-600/30 rounded-lg">
          <div className="absolute inset-4 border border-amber-500/20 rounded-md"></div>
        </div>
      </div>

      {/* Right Door */}
      <div
        className={`absolute right-0 w-1/2 h-full bg-gradient-to-bl from-amber-900 via-amber-800 to-amber-700 shadow-2xl transition-transform duration-1000 ease-in-out origin-right ${
          isOpen ? 'rotate-y-90' : 'rotate-y-0'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          backgroundImage: `
            linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      >
        {/* Door Handle */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-3 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full shadow-lg"></div>

        {/* Door Panel Details */}
        <div className="absolute inset-4 border-2 border-amber-600/30 rounded-lg">
          <div className="absolute inset-4 border border-amber-500/20 rounded-md"></div>
        </div>
      </div>

      {/* Center Lock/Hinge */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full shadow-lg z-10">
        <div className="absolute inset-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"></div>
      </div>
    </div>
  );
};

export default ClosetDoors;