import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Sparkles,
  Package
} from 'lucide-react';
import ClosetService, { WeeklyOutfitPlan, DayOfWeek, DailyOutfit, ClothingItem } from '../services/closetService';
import OutfitPlannerModal from './OutfitPlannerModal';

interface WeeklyOutfitCalendarProps {
  className?: string;
}

// Helper function to get week start date
const getWeekStartDate = (date: Date = new Date()): string => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  startOfWeek.setDate(diff);
  return startOfWeek.toISOString().split('T')[0];
};

const WeeklyOutfitCalendar: React.FC<WeeklyOutfitCalendarProps> = ({ className = '' }) => {

  const [currentWeekStart, setCurrentWeekStart] = useState<string>(
    getWeekStartDate()
  );

  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyOutfitPlan>(
    ClosetService.getWeeklyPlan(currentWeekStart)
  );

  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [showPlannerModal, setShowPlannerModal] = useState(false);

  const days: Array<{
    key: DayOfWeek;
    label: string;
    shortLabel: string;
  }> = [
    { key: 'monday', label: 'Monday', shortLabel: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
    { key: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
    { key: 'friday', label: 'Friday', shortLabel: 'Fri' },
    { key: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
    { key: 'sunday', label: 'Sunday', shortLabel: 'Sun' }
  ];

  // Load weekly plan when week changes
  useEffect(() => {
    const plan = ClosetService.getWeeklyPlan(currentWeekStart);
    setWeeklyPlan(plan);
  }, [currentWeekStart]);

  const formatDateRange = (weekStart: string): string => {
    const startDate = new Date(weekStart);
    const endDate = new Date(weekStart);
    endDate.setDate(startDate.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-US', options);
    const endStr = endDate.toLocaleDateString('en-US', options);

    return `${startStr} - ${endStr}`;
  };

  const goToPreviousWeek = () => {
    const prevWeek = ClosetService.getPreviousWeekStartDate(currentWeekStart);
    setCurrentWeekStart(prevWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = ClosetService.getNextWeekStartDate(currentWeekStart);
    setCurrentWeekStart(nextWeek);
  };

  const goToCurrentWeek = () => {
    const currentWeek = getWeekStartDate();
    setCurrentWeekStart(currentWeek);
  };

  const handleAddOutfit = (day: DayOfWeek) => {
    setSelectedDay(day);
    setShowPlannerModal(true);
  };

  const handleEditOutfit = (day: DayOfWeek) => {
    setSelectedDay(day);
    setShowPlannerModal(true);
  };

  const handleClearOutfit = (day: DayOfWeek) => {
    if (window.confirm(`Clear outfit for ${days.find(d => d.key === day)?.label}?`)) {
      ClosetService.clearDailyOutfit(day, currentWeekStart);
      const updatedPlan = ClosetService.getWeeklyPlan(currentWeekStart);
      setWeeklyPlan(updatedPlan);
    }
  };

  const handleCopyOutfit = (fromDay: DayOfWeek) => {
    const availableDays = days.filter(d => d.key !== fromDay);
    const targetDay = prompt(
      `Copy outfit from ${days.find(d => d.key === fromDay)?.label} to which day?\n\n` +
      availableDays.map((d, i) => `${i + 1}. ${d.label}`).join('\n')
    );

    const dayIndex = parseInt(targetDay || '') - 1;
    if (dayIndex >= 0 && dayIndex < availableDays.length) {
      const toDayKey = availableDays[dayIndex].key;
      ClosetService.copyOutfitToDay(fromDay, toDayKey, currentWeekStart);
      const updatedPlan = ClosetService.getWeeklyPlan(currentWeekStart);
      setWeeklyPlan(updatedPlan);
    }
  };

  const handleSaveOutfit = (items: ClothingItem[], notes?: string) => {
    if (selectedDay) {
      ClosetService.setDailyOutfit(selectedDay, items, notes, currentWeekStart);
      const updatedPlan = ClosetService.getWeeklyPlan(currentWeekStart);
      setWeeklyPlan(updatedPlan);
    }
    setShowPlannerModal(false);
    setSelectedDay(null);
  };

  const renderDayCard = (day: typeof days[0]) => {
    const outfit = weeklyPlan.outfits[day.key];
    const hasOutfit = outfit.items.length > 0;
    const date = new Date(outfit.date);
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <div
        key={day.key}
        className={`bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 ${
          isToday ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
        }`}
      >
        {/* Day Header */}
        <div className={`p-4 border-b border-gray-100 ${isToday ? 'bg-blue-100/50' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">{day.shortLabel}</h3>
              <p className="text-sm text-gray-500">
                {date.getDate()}
                {isToday && <span className="ml-1 text-blue-600 font-medium">Today</span>}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {hasOutfit ? (
                <>
                  <button
                    onClick={() => handleEditOutfit(day.key)}
                    className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit outfit"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleCopyOutfit(day.key)}
                    className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                    title="Copy to another day"
                  >
                    <Copy className="w-4 h-4 text-green-600" />
                  </button>
                  <button
                    onClick={() => handleClearOutfit(day.key)}
                    className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                    title="Clear outfit"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleAddOutfit(day.key)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Add outfit"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Outfit Content */}
        <div className="p-4">
          {hasOutfit ? (
            <div className="space-y-3">
              {/* Outfit Items */}
              <div className="grid grid-cols-2 gap-2">
                {outfit.items.slice(0, 4).map((item, index) => (
                  <div key={index} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
                {outfit.items.length > 4 && (
                  <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      +{outfit.items.length - 4}
                    </span>
                  </div>
                )}
              </div>

              {/* Item Count */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Package className="w-4 h-4" />
                <span>{outfit.items.length} item{outfit.items.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Notes */}
              {outfit.notes && (
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  {outfit.notes}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <Sparkles className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No outfit planned</p>
              <button
                onClick={() => handleAddOutfit(day.key)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Plan outfit
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Weekly Outfit Planner</h2>
            <p className="text-gray-600">Plan your outfits for the week</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Week Navigation */}
            <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 p-1">
              <button
                onClick={goToPreviousWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Previous week"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={goToCurrentWeek}
                className="px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="text-center">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{formatDateRange(currentWeekStart)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentWeekStart === getWeekStartDate() ? 'This Week' : 'Click for Current Week'}
                  </div>
                </div>
              </button>

              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Next week"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {days.map(renderDayCard)}
      </div>

      {/* Outfit Planner Modal */}
      {showPlannerModal && selectedDay && (
        <OutfitPlannerModal
          isOpen={showPlannerModal}
          day={selectedDay}
          currentOutfit={weeklyPlan.outfits[selectedDay]}
          onSave={handleSaveOutfit}
          onClose={() => {
            setShowPlannerModal(false);
            setSelectedDay(null);
          }}
        />
      )}
    </div>
  );
};

export default WeeklyOutfitCalendar;