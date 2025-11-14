import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, RefreshCw, Plus, SlidersHorizontal } from 'lucide-react';
import CalendarDayCell from './CalendarDayCell';
import CalendarStatsPanel from './CalendarStatsPanel';
import ScheduleOutfitModal from './ScheduleOutfitModal';
import { supabase } from '../services/supabaseClient';
import authService from '../services/authService';

interface ShoppingLink {
  url: string;
  store?: string;
  image?: string;
  imageUrl?: string;
  title?: string;
  price?: string;
  affiliateUrl?: string;
}

interface ScheduledOutfit {
  id: string;
  scheduled_date: string;
  occasion?: string;
  was_worn: boolean;
  outfit_items: Array<{
    id: string;
    name: string;
    image_url: string;
    category: string;
  }>;
  shopping_links?: ShoppingLink[];
}

interface MonthStats {
  mostWornItem?: {
    id: string;
    name: string;
    image_url: string;
    wear_count: number;
  };
  currentStreak: number;
  totalPlanned: number;
  totalWorn: number;
}

export const EnhancedMonthlyCalendarGrid: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledOutfits, setScheduledOutfits] = useState<Record<string, ScheduledOutfit>>({});
  const [monthStats, setMonthStats] = useState<MonthStats>({
    currentStreak: 0,
    totalPlanned: 0,
    totalWorn: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cellHeight, setCellHeight] = useState(120); // Dynamic cell height

  useEffect(() => {
    fetchMonthData();
  }, [currentDate]);

  // Calculate optimal cell height to fit everything on one page
  useEffect(() => {
    const calculateCellHeight = () => {
      const viewportHeight = window.innerHeight;
      const toolbarHeight = 120; // 2x2 grid toolbar
      const monthNavHeight = 60; // Month/year navigation
      const weekdayHeaderHeight = 40; // Weekday header (Sun-Sat)
      const statsPanelHeight = 80; // Bottom stats panel
      const safeAreaPadding = 20; // Safe area padding

      const availableHeight = viewportHeight - toolbarHeight - monthNavHeight - weekdayHeaderHeight - statsPanelHeight - safeAreaPadding;

      // Calculate height for 5 rows (approximately 5 weeks visible)
      const calculatedHeight = Math.floor(availableHeight / 5);

      // Ensure minimum tap target size (44px per Apple HIG)
      const finalHeight = Math.max(calculatedHeight, 80);

      setCellHeight(finalHeight);
    };

    calculateCellHeight();
    window.addEventListener('resize', calculateCellHeight);
    return () => window.removeEventListener('resize', calculateCellHeight);
  }, []);

  const fetchMonthData = async () => {
    setLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const startDate = startOfMonth.toISOString();
      const endDate = endOfMonth.toISOString();

      // Fetch from calendar_events table instead of scheduled_outfits
      const { data: eventsData, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('start_time', { ascending: true });

      if (eventsError) throw eventsError;

      // Debug: Log fetched data
      console.log('📅 [CALENDAR] Fetched calendar events:', eventsData);

      const outfitsMap: Record<string, ScheduledOutfit> = {};
      eventsData?.forEach((event: any) => {
        // Extract date from start_time
        const eventDate = new Date(event.start_time);
        const dateKey = eventDate.toISOString().split('T')[0];

        // Create outfit items from shopping links if available
        const outfitItems = event.shopping_links && event.shopping_links.length > 0
          ? event.shopping_links.map((link: any, index: number) => ({
              id: `${event.id}-item-${index}`,
              name: link.title || link.store || 'Shopping Item',
              image_url: link.image || link.imageUrl || '',
              category: 'shopping-item'
            }))
          : [{
              id: `${event.id}-default`,
              name: event.title || 'Outfit',
              image_url: '',
              category: 'outfit'
            }];

        outfitsMap[dateKey] = {
          id: event.id,
          scheduled_date: dateKey,
          occasion: event.title || event.description,
          was_worn: false, // TODO: Add was_worn tracking to calendar_events
          outfit_items: outfitItems,
          shopping_links: event.shopping_links || []
        };
      });

      // Debug: Log final mapped outfits
      console.log('📅 [CALENDAR] Mapped outfits for calendar:', outfitsMap);

      setScheduledOutfits(outfitsMap);
      await calculateMonthStats(user.id, startDate, endDate, outfitsMap);
    } catch (error) {
      console.error('Error fetching month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthStats = async (
    userId: string,
    startDate: string,
    endDate: string,
    outfitsMap: Record<string, ScheduledOutfit>
  ) => {
    try {
      const itemWearCount: Record<string, { item: any; count: number }> = {};

      Object.values(outfitsMap).forEach((outfit) => {
        if (outfit.was_worn) {
          outfit.outfit_items.forEach((item) => {
            if (!itemWearCount[item.id]) {
              itemWearCount[item.id] = { item, count: 0 };
            }
            itemWearCount[item.id].count++;
          });
        }
      });

      const mostWorn = Object.values(itemWearCount).sort((a, b) => b.count - a.count)[0];

      const { data: streakData } = await supabase.rpc('calculate_wear_streak', {
        p_user_id: userId,
      });

      const totalPlanned = Object.keys(outfitsMap).length;
      const totalWorn = Object.values(outfitsMap).filter((o) => o.was_worn).length;

      setMonthStats({
        mostWornItem: mostWorn
          ? {
              id: mostWorn.item.id,
              name: mostWorn.item.name,
              image_url: mostWorn.item.image_url,
              wear_count: mostWorn.count,
            }
          : undefined,
        currentStreak: streakData || 0,
        totalPlanned,
        totalWorn,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleOutfitScheduled = () => {
    fetchMonthData();
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full" style={{ width: '100%' }}>
      {/* Month/Year Navigation */}
      <div
        className="sticky top-0 z-40 border-b"
        style={{
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          background: 'rgba(255, 255, 255, 0.8)',
          borderBottom: '0.5px solid rgba(0, 0, 0, 0.04)',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="flex items-center justify-center py-1" style={{ minHeight: '44px', paddingTop: '8px', paddingBottom: '4px' }}>
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100/80 rounded-full transition-all active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <span className="text-2xl font-bold text-gray-900 min-w-[250px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100/80 rounded-full transition-all active:scale-95"
              aria-label="Next month"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Area - No scrolling, fits on one page */}
      <div
        className="flex-1 overflow-hidden"
      >
        {/* Liquid Glass Calendar Header */}
        <div
          className="border-b sticky top-0"
          style={{
            zIndex: 30,
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            background: 'rgba(255, 255, 255, 0.75)',
            borderBottom: '0.5px solid rgba(0, 0, 0, 0.04)',
            paddingTop: '4px',
            paddingBottom: '8px',
          }}
        >
          <div className="grid grid-cols-7">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-1">
                {day}
              </div>
            ))}
          </div>
        </div>

        <div>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading calendar...</div>
          </div>
        ) : (
          <div
            className="grid grid-cols-7"
            style={{
              gridAutoRows: `${cellHeight}px`,
              transform: 'none',
              willChange: 'auto',
              width: '100%',
              padding: 0,
              margin: 0,
            }}
          >
            {calendarDays.map((day, index) => {
              const dateKey = day.date.toISOString().split('T')[0];
              const isToday =
                day.date.toDateString() === today.toDateString();

              return (
                <CalendarDayCell
                  key={index}
                  date={day.date}
                  isCurrentMonth={day.isCurrentMonth}
                  isToday={isToday}
                  scheduledOutfit={scheduledOutfits[dateKey]}
                  onClick={() => handleDayClick(day.date)}
                  cellHeight={cellHeight}
                />
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Fixed Stats Panel at Bottom */}
      <div className="flex-shrink-0 pb-safe">
        <CalendarStatsPanel
        mostWornItem={monthStats.mostWornItem}
        currentStreak={monthStats.currentStreak}
          totalPlanned={monthStats.totalPlanned}
          totalWorn={monthStats.totalWorn}
          month={monthName}
        />
      </div>

      {selectedDate && (
        <ScheduleOutfitModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedDate={selectedDate}
          onOutfitScheduled={handleOutfitScheduled}
        />
      )}
    </div>
  );
};

export default EnhancedMonthlyCalendarGrid;
