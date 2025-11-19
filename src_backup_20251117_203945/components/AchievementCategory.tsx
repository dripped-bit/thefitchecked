import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AchievementCategory as AchievementCategoryType } from '../services/achievementsService';
import AchievementCard from './AchievementCard';

interface AchievementCategoryProps {
  category: AchievementCategoryType;
}

const AchievementCategory: React.FC<AchievementCategoryProps> = ({ category }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = category.achievements.filter(a => a.completed).length;
  const totalCount = category.achievements.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="achievement-category mb-6 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Category Header */}
      <div
        className="category-header p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="expand-toggle flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
            <h3 className="text-xl font-bold text-gray-800">{category.title}</h3>
          </div>

          <div className="flex items-center space-x-4">
            {/* Progress Indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {completionPercentage}%
              </span>
            </div>

            {/* Count Badge */}
            <div className="category-count flex items-center space-x-1">
              <span className="text-sm font-bold text-green-600">{completedCount}</span>
              <span className="text-sm text-gray-500">/</span>
              <span className="text-sm font-bold text-gray-700">{totalCount}</span>
            </div>
          </div>
        </div>

        {/* Category Stats Bar */}
        {isExpanded && (
          <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
            <span>{completedCount} completed • {totalCount - completedCount} remaining</span>
            <span>
              {category.achievements.filter(a => !a.locked && !a.completed).length} in progress
            </span>
          </div>
        )}
      </div>

      {/* Category Achievements */}
      {isExpanded && (
        <div className="category-achievements p-4 space-y-0">
          {category.achievements.map((achievement, index) => (
            <div
              key={achievement.id}
              className={`
                transform transition-all duration-300 ease-out
                ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
              `}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <AchievementCard achievement={achievement} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AchievementCategory;