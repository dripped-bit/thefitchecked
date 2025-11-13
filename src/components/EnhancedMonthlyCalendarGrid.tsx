import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarDayCell from './CalendarDayCell';
import CalendarStatsPanel from './CalendarStatsPanel';
import ScheduleOutfitModal from './ScheduleOutfitModal';
import { supabase } from '../services/supabaseClient';
import authService from '../services/authService';

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

  useEffect(() => {
    fetchMonthData();
  }, [currentDate]);

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

      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      const { data: outfitsData, error: outfitsError } = await supabase
        .from('scheduled_outfits')
        .select(
          `
          id,
          scheduled_date,
          occasion,
          was_worn,
          outfit:outfits (
            id,
            name,
            outfit_items (
              clothing_item:clothing_items (
                id,
                name,
                image_url,
                category
              )
            )
          )
        `
        )
        .eq('user_id', user.id)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate);

      if (outfitsError) throw outfitsError;

      const outfitsMap: Record<string, ScheduledOutfit> = {};
      outfitsData?.forEach((item: any) => {
        if (item.outfit && item.outfit.outfit_items) {
          outfitsMap[item.scheduled_date] = {
            id: item.id,
            scheduled_date: item.scheduled_date,
            occasion: item.occasion,
            was_worn: item.was_worn,
            outfit_items: item.outfit.outfit_items.map((oi: any) => oi.clothing_item),
          };
        }
      });

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
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-2xl font-bold text-gray-900 min-w-[240px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading calendar...</div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 auto-rows-fr">
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
                />
              );
            })}
          </div>
        )}
      </div>

      <CalendarStatsPanel
        mostWornItem={monthStats.mostWornItem}
        currentStreak={monthStats.currentStreak}
        totalPlanned={monthStats.totalPlanned}
        totalWorn={monthStats.totalWorn}
        month={monthName}
      />

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
