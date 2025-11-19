import React from 'react';
import { ChevronRight } from 'lucide-react';

interface OutfitItem {
  id: string;
  name: string;
  image_url: string;
  category: string;
}

interface ScheduledOutfit {
  id: string;
  scheduled_date: string;
  occasion?: string;
  was_worn: boolean;
  outfit_items: OutfitItem[];
}

interface CalendarDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  scheduledOutfit?: ScheduledOutfit;
  onClick: () => void;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  date,
  isCurrentMonth,
  isToday,
  scheduledOutfit,
  onClick,
}) => {
  const dayNumber = date.getDate();
  const hasOutfit = scheduledOutfit && scheduledOutfit.outfit_items?.length > 0;
  const wasWorn = scheduledOutfit?.was_worn;

  return (
    <div
      onClick={onClick}
      className={`
        relative min-h-[100px] p-2 border border-gray-200 
        transition-all cursor-pointer hover:bg-gray-50
        ${!isCurrentMonth ? 'bg-gray-50 opacity-50' : 'bg-white'}
        ${isToday ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      {/* Day Number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            text-sm font-semibold
            ${isToday ? 'text-blue-600' : 'text-gray-700'}
            ${!isCurrentMonth ? 'text-gray-400' : ''}
          `}
        >
          {dayNumber}
        </span>
        
        {/* Worn Indicator */}
        {wasWorn && (
          <div className="w-2 h-2 rounded-full bg-green-500" title="Outfit worn" />
        )}
      </div>

      {/* Outfit Thumbnails */}
      {hasOutfit && (
        <div className="space-y-1">
          {/* Show up to 4 items in a 2x2 grid */}
          <div className="grid grid-cols-2 gap-1">
            {scheduledOutfit.outfit_items.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="aspect-square rounded overflow-hidden bg-gray-100 border border-gray-200"
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          {/* More items indicator */}
          {scheduledOutfit.outfit_items.length > 4 && (
            <div className="text-xs text-gray-500 text-center">
              +{scheduledOutfit.outfit_items.length - 4} more
            </div>
          )}

          {/* Occasion label */}
          {scheduledOutfit.occasion && (
            <div className="text-xs text-gray-600 truncate">
              {scheduledOutfit.occasion}
            </div>
          )}
        </div>
      )}

      {/* Empty state - show plus icon on hover */}
      {!hasOutfit && isCurrentMonth && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-white/80">
          <div className="text-gray-400 text-2xl">+</div>
        </div>
      )}
    </div>
  );
};

export default CalendarDayCell;
