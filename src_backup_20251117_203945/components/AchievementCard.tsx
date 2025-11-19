import React from 'react';
import { Lock, CheckCircle } from 'lucide-react';
import { Achievement } from '../services/achievementsService';

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const progressPercentage = Math.min((achievement.current / achievement.target) * 100, 100);
  const isCompleted = achievement.current >= achievement.target;

  return (
    <div className={`
      achievement-card relative flex bg-white border-2 rounded-2xl p-4 mb-3 transition-all duration-300 hover:transform hover:translate-x-1 hover:shadow-lg
      ${isCompleted
        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-md'
        : achievement.locked
          ? 'opacity-60 grayscale border-gray-200'
          : 'border-gray-200 hover:border-gray-300'
      }
    `}>
      {/* Icon Section */}
      <div className="achievement-icon-wrapper relative mr-4 flex-shrink-0">
        <div className={`
          achievement-icon w-16 h-16 flex items-center justify-center text-3xl rounded-xl
          ${isCompleted
            ? 'bg-gradient-to-br from-blue-100 to-purple-100'
            : achievement.locked
              ? 'bg-gray-100'
              : 'bg-gray-50'
          }
        `}>
          {achievement.locked ? (
            <Lock className="w-6 h-6 text-gray-400" />
          ) : (
            <span>{achievement.icon}</span>
          )}
        </div>

        {isCompleted && (
          <div className="completion-badge absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="achievement-content flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className={`
              achievement-title text-lg font-bold
              ${isCompleted ? 'text-blue-800' : achievement.locked ? 'text-gray-500' : 'text-gray-800'}
            `}>
              {achievement.locked ? '???' : achievement.title}
            </h4>
            <p className={`
              achievement-description text-sm mt-1
              ${achievement.locked ? 'text-gray-400' : 'text-gray-600'}
            `}>
              {achievement.locked ? 'Complete other achievements to unlock' : achievement.description}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {!achievement.locked && !isCompleted && (
          <div className="achievement-progress mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="progress-text text-xs text-gray-600 font-medium">
                {achievement.current}/{achievement.target}
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="progress-bar-bg w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="progress-bar-fill h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Reward Preview */}
        {isCompleted && (
          <div className="achievement-reward mt-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <span className="reward-label text-xs font-semibold text-green-700 mr-2">REWARD:</span>
              <span className="reward-item text-sm text-green-800 font-medium">{achievement.reward}</span>
            </div>
          </div>
        )}

        {/* Locked Reward Hint */}
        {!achievement.locked && !isCompleted && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-600 mr-2">UNLOCK REWARD:</span>
              <span className="text-xs text-gray-700">{achievement.reward}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementCard;