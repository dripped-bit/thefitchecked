import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface OutfitItem {
  id: string;
  name: string;
  image_url: string;
  category: string;
}

interface ShoppingLink {
  url: string;
  store?: string;
  image?: string;
  imageUrl?: string;
  title?: string;
  price?: string;
}

interface ScheduledOutfit {
  id: string;
  scheduled_date: string;
  occasion?: string;
  was_worn: boolean;
  outfit_items: OutfitItem[];
  shopping_links?: ShoppingLink[];
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

  // Prefer shopping product image over outfit item image
  const shoppingLinks = scheduledOutfit?.shopping_links || [];
  const hasShoppingLinks = shoppingLinks.length > 0;
  const firstShoppingImage = shoppingLinks.find(link => link.image || link.imageUrl);
  const displayImage = firstShoppingImage?.image || firstShoppingImage?.imageUrl || firstItem?.image_url;
  const displayTitle = firstShoppingImage?.title || firstItem?.name;

  // Debug: Log outfit data for dates with outfits
  if (hasOutfit) {
    console.log(`📅 [CELL] Day ${dayNumber} has outfit:`, {
      occasion: scheduledOutfit.occasion,
      itemCount: scheduledOutfit.outfit_items.length,
      shoppingLinksCount: shoppingLinks.length,
      hasShoppingImage: !!firstShoppingImage,
      displayImage: displayImage?.substring(0, 50) + '...'
    });
  }

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer"
      style={{
        aspectRatio: '1',
        backgroundColor: isCurrentMonth ? '#FAFAF5' : '#F5F5F0',
        border: '1px solid #E5E5E5', // Clear visible border
        height: '180px', // Fixed height - taller for better outfit display
        minHeight: '180px',
        transform: 'none', // Prevents zoom glitches
        willChange: 'auto', // Prevents browser optimization issues
      }}
    >
      {/* Date Number - Top Left - BIGGER (18px) */}
      <div
        className="absolute top-2 left-2 z-10 w-9 h-9 flex items-center justify-center rounded-full font-bold"
        style={{
          fontSize: '18px', // Bigger, readable number
          backgroundColor: isToday ? '#000' : 'transparent',
          color: isToday ? '#fff' : isCurrentMonth ? '#000' : '#999',
        }}
      >
        {dayNumber}
      </div>

      {/* Worn Indicator - Top Right (small green dot) */}
      {wasWorn && (
        <div
          className="absolute top-2 right-2 z-10 w-2.5 h-2.5 rounded-full"
          style={{
            backgroundColor: '#10B981',
            boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.8)',
          }}
          title="Outfit worn"
        />
      )}

      {/* PRODUCT/OUTFIT PHOTO - 70% height for shopping products */}
      {hasOutfit && displayImage ? (
        <div className="absolute inset-0 flex flex-col">
          {/* Product Image - 70% of cell height */}
          <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{ height: '70%' }}
          >
            <img
              src={displayImage}
              alt={displayTitle}
              className="w-full h-full object-cover"
              style={{
                objectPosition: 'center center',
                transform: 'none', // Prevent image glitches
              }}
              loading="lazy"
            />

            {/* Subtle gradient overlay for readability */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 100%)',
              }}
            />

            {/* Shopping Bag Indicator - Top Right (if has shopping links) */}
            {hasShoppingLinks && (
              <div
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(255, 105, 180, 0.95)',
                  color: '#fff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                }}
                title={`${shoppingLinks.length} shopping link${shoppingLinks.length !== 1 ? 's' : ''}`}
              >
                <ShoppingBag className="w-4 h-4" />
              </div>
            )}

            {/* Multiple items indicator - Bottom Right */}
            {additionalItemsCount > 0 && !hasShoppingLinks && (
              <div
                className="absolute bottom-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{
                  backgroundColor: 'rgba(255, 105, 180, 0.95)',
                  color: '#fff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                }}
              >
                +{additionalItemsCount}
              </div>
            )}
          </div>

          {/* Occasion label - Bottom 30% */}
          {scheduledOutfit.occasion && (
            <div
              className="flex items-center justify-center px-2 text-center"
              style={{
                height: '30%',
                backgroundColor: isCurrentMonth ? '#FAFAF5' : '#F5F5F0',
              }}
            >
              <span
                className="text-xs font-semibold truncate"
                style={{ color: '#000' }}
              >
                {scheduledOutfit.occasion}
              </span>
            </div>
          )}
        </div>
      ) : (
        // Empty state - show large date number
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-4xl font-light"
            style={{
              color: isCurrentMonth ? '#D0D0D0' : '#E8E8E8',
            }}
          >
            {dayNumber}
          </span>
        </div>
      )}
    </div>
  );
};

export default CalendarDayCell;
