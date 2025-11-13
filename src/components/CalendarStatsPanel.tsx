import React from 'react';
import { Star, TrendingUp } from 'lucide-react';

interface MostWornItem {
  id: string;
  name: string;
  image_url: string;
  wear_count: number;
}

interface CalendarStatsPanelProps {
  mostWornItem?: MostWornItem;
  currentStreak: number;
  totalPlanned: number;
  totalWorn: number;
  month: string;
}

export const CalendarStatsPanel: React.FC<CalendarStatsPanelProps> = ({
  mostWornItem,
  currentStreak,
  totalPlanned,
  totalWorn,
  month,
}) => {
  return (
    <div className="bg-white border-t border-gray-200 p-4 space-y-4">
      {/* Most Worn This Month */}
      {mostWornItem && (
        <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
            <img
              src={mostWornItem.image_url}
              alt={mostWornItem.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-500">Most Worn This Month</div>
            <div className="font-semibold text-gray-900">{mostWornItem.name}</div>
            <div className="text-sm text-gray-600">
              {mostWornItem.wear_count} {mostWornItem.wear_count === 1 ? 'day' : 'days'}
            </div>
          </div>
          <Star className="w-5 h-5 text-yellow-500" />
        </div>
      )}

      {/* Streak Counter */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{currentStreak}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Continuous calendar recording</div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{totalPlanned}</div>
          <div className="text-sm text-gray-600">Outfits Planned</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{totalWorn}</div>
          <div className="text-sm text-gray-600">Outfits Worn</div>
        </div>
      </div>
    </div>
  );
};

export default CalendarStatsPanel;
