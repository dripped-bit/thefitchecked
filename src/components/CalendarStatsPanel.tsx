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
    <div 
      className="border-t p-4 space-y-4"
      style={{
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        background: 'rgba(255, 255, 255, 0.8)',
        borderTop: '0.5px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 -1px 3px 0 rgba(0, 0, 0, 0.02), 0 -1px 2px 0 rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Most Worn This Month */}
      {mostWornItem && (
        <div 
          className="flex items-center space-x-4 p-3 rounded-xl"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            background: 'rgba(249, 250, 251, 0.6)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
          }}
        >
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


    </div>
  );
};

export default CalendarStatsPanel;
