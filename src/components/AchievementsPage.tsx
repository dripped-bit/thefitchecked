import React, { useState, useEffect } from 'react';
import { Trophy, Target, Calendar, Filter } from 'lucide-react';
import AchievementsService, { AchievementCategory as AchievementCategoryType, UserProgress } from '../services/achievementsService';
import AchievementCategory from './AchievementCategory';

type FilterType = 'all' | 'in_progress' | 'completed' | 'locked';

const AchievementsPage: React.FC = () => {
  const [categories, setCategories] = useState<AchievementCategoryType[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = () => {
    const achievementCategories = AchievementsService.getAchievements();
    const progress = AchievementsService.getUserProgress();
    setCategories(achievementCategories);
    setUserProgress(progress);
  };

  const getFilteredCategories = (): AchievementCategoryType[] => {
    if (activeFilter === 'all') {
      return categories;
    }

    return categories.map(category => ({
      ...category,
      achievements: category.achievements.filter(achievement => {
        switch (activeFilter) {
          case 'completed':
            return achievement.completed;
          case 'in_progress':
            return !achievement.completed && !achievement.locked && achievement.current > 0;
          case 'locked':
            return achievement.locked;
          default:
            return true;
        }
      })
    })).filter(category => category.achievements.length > 0);
  };

  const filteredCategories = getFilteredCategories();

  const filters: { key: FilterType; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: 'blue' },
    { key: 'in_progress', label: 'In Progress', color: 'yellow' },
    { key: 'completed', label: 'Completed', color: 'green' },
    { key: 'locked', label: 'Locked', color: 'gray' }
  ];

  return (
    <div className="achievements-container max-w-4xl mx-auto px-6 py-8">
      {/* Top Stats Bar */}
      {userProgress && (
        <div className="achievement-stats-bar bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-item text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-6 h-6 mr-2" />
              </div>
              <div className="stat-number text-3xl font-bold mb-1">
                {userProgress.totalUnlocked}/{userProgress.totalAchievements}
              </div>
              <div className="stat-label text-sm opacity-90 uppercase tracking-wider">
                Unlocked
              </div>
            </div>

            <div className="stat-item text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-6 h-6 mr-2" />
              </div>
              <div className="stat-number text-3xl font-bold mb-1">
                {userProgress.completionPercentage}%
              </div>
              <div className="stat-label text-sm opacity-90 uppercase tracking-wider">
                Complete
              </div>
            </div>

            <div className="stat-item text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-6 h-6 mr-2" />
              </div>
              <div className="stat-number text-3xl font-bold mb-1">
                {userProgress.currentStreak}
              </div>
              <div className="stat-label text-sm opacity-90 uppercase tracking-wider">
                Day Streak
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm">{userProgress.totalUnlocked} of {userProgress.totalAchievements} achievements</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${userProgress.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <div className="achievement-filters mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Filter Achievements</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {filters.map(filter => {
            const isActive = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`
                  filter-pill px-4 py-2 rounded-full font-medium transition-all duration-200 border-2
                  ${isActive
                    ? filter.key === 'all'
                      ? 'bg-blue-500 text-white border-blue-500 shadow-lg scale-105'
                      : filter.key === 'in_progress'
                        ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg scale-105'
                        : filter.key === 'completed'
                          ? 'bg-green-500 text-white border-green-500 shadow-lg scale-105'
                          : 'bg-gray-500 text-white border-gray-500 shadow-lg scale-105'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:scale-105'
                  }
                `}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievement Categories */}
      <div className="achievement-categories space-y-6">
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => (
            <AchievementCategory key={category.id} category={category} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No achievements found</h3>
            <p className="text-gray-500">
              {activeFilter === 'all'
                ? 'Start using the app to unlock your first achievements!'
                : `No ${activeFilter.replace('_', ' ')} achievements available.`
              }
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AchievementsPage;