import React from 'react';

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
  const firstItem = scheduledOutfit?.outfit_items[0];
  const additionalItemsCount = (scheduledOutfit?.outfit_items?.length || 0) - 1;

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer transition-all hover:shadow-md"
      style={{
        aspectRatio: '1', // Square cells
        backgroundColor: isCurrentMonth ? '#FAFAF5' : '#F5F5F0',
        minHeight: '100px',
      }}
    >
      {/* Date Number - Top Left */}
      <div
        className="absolute top-1 left-1 z-10 w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold"
        style={{
          backgroundColor: isToday ? '#000' : 'transparent',
          color: isToday ? '#fff' : isCurrentMonth ? '#000' : '#999',
        }}
      >
        {dayNumber}
      </div>

      {/* Worn Indicator - Top Right (small green dot) */}
      {wasWorn && (
        <div
          className="absolute top-2 right-2 z-10 w-2 h-2 rounded-full"
          style={{
            backgroundColor: '#10B981', // Green
            boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.8)',
          }}
          title="Outfit worn"
        />
      )}

      {/* FULL-SIZE OUTFIT PHOTO (INDYX Style) */}
      {hasOutfit && firstItem ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={firstItem.image_url}
            alt={firstItem.name}
            className="w-full h-full object-cover"
            style={{
              objectPosition: 'center top', // Show item from top
            }}
            loading="lazy"
          />

          {/* Subtle gradient overlay for readability */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 100%)',
            }}
          />

          {/* Occasion label at bottom */}
          {scheduledOutfit.occasion && (
            <div
              className="absolute bottom-0 left-0 right-0 px-1 py-1 text-[9px] font-medium truncate text-center"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                color: '#fff',
              }}
            >
              {scheduledOutfit.occasion}
            </div>
          )}

          {/* Multiple items indicator - Bottom Right */}
          {additionalItemsCount > 0 && (
            <div
              className="absolute bottom-1 right-1 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: 'rgba(255, 105, 180, 0.95)', // Pink
                color: '#fff',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
              }}
            >
              +{additionalItemsCount}
            </div>
          )}
        </div>
      ) : (
        // Empty state - show large date number
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-3xl font-light"
            style={{
              color: isCurrentMonth ? '#E0E0E0' : '#F0F0F0',
            }}
          >
            {dayNumber}
          </span>
        </div>
      )}

      {/* Hover state - subtle scale */}
      <style jsx>{`
        div:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default CalendarDayCell;
