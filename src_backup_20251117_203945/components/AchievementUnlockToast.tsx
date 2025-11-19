import React, { useEffect, useState } from 'react';
import { Trophy, X, Gift } from 'lucide-react';
import { Achievement } from '../services/achievementsService';

interface AchievementUnlockToastProps {
  achievement: Achievement;
  onClose: () => void;
  duration?: number;
}

const AchievementUnlockToast: React.FC<AchievementUnlockToastProps> = ({
  achievement,
  onClose,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer1 = setTimeout(() => setIsVisible(true), 100);

    // Auto close after duration
    const timer2 = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`
        achievement-unlock-toast max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden
        transform transition-all duration-500 ease-out
        ${isVisible && !isExiting
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
        }
      `}>
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 p-4 relative">
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="unlock-icon w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-lg">Achievement Unlocked!</h4>
              <p className="text-white/90 text-sm">Congratulations! 🎉</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="unlock-content p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl">
              {achievement.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-lg mb-1">{achievement.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{achievement.description}</p>

              <div className="unlock-reward bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2">
                  <Gift className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">REWARD UNLOCKED:</span>
                </div>
                <p className="text-sm text-green-800 font-medium mt-1">{achievement.reward}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-300 ease-linear"
            style={{
              width: isVisible ? '0%' : '100%',
              animation: isVisible ? `toast-shrink ${duration}ms linear` : 'none'
            }}
          />
        </div>
      </div>

      {/* Add keyframe animation via inline style since Tailwind doesn't support dynamic keyframes */}
      <style>
        {`
          @keyframes toast-shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>
    </div>
  );
};

export default AchievementUnlockToast;