/**
 * Weekly Outfit Queue Component
 * Monday-Sunday grid showing planned outfits for the week
 * Displays month at top with date numbers in boxes
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Shirt,
  Calendar,
  Sparkles,
  X,
  Check,
  Edit,
  Trash2
} from 'lucide-react';
import smartCalendarService, { CalendarEvent, OutfitItem } from '../services/smartCalendarService';
import { OutfitSuggestion } from '../services/claudeOutfitService';

interface WeeklyOutfitQueueProps {
  onBack?: () => void;
  clothingItems?: OutfitItem[];
  events: CalendarEvent[];
  onPlanOutfit: (date: Date, event?: CalendarEvent) => void;
}

interface DayOutfit {
  date: Date;
  dayName: string;
  dateNumber: number;
  isToday: boolean;
  events: CalendarEvent[];
  plannedOutfit?: OutfitSuggestion;
  outfitItems?: OutfitItem[];
}

const WeeklyOutfitQueue: React.FC<WeeklyOutfitQueueProps> = ({
  onBack,
  clothingItems = [],
  events,
  onPlanOutfit
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));
  const [weekDays, setWeekDays] = useState<DayOutfit[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayOutfit | null>(null);

  useEffect(() => {
    generateWeekDays();
  }, [currentWeekStart, events]);

  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  }

  function generateWeekDays() {
    const days: DayOutfit[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const dateStr = date.toDateString();
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === dateStr;
      });

      // Load planned outfit from localStorage (temporary - will move to Supabase)
      const plannedOutfits = JSON.parse(localStorage.getItem('weeklyOutfitQueue') || '{}');
      const outfitKey = date.toISOString().split('T')[0];

      days.push({
        date,
        dayName: dayNames[i],
        dateNumber: date.getDate(),
        isToday: dateStr === today.toDateString(),
        events: dayEvents,
        outfitItems: plannedOutfits[outfitKey]?.items || undefined
      });
    }

    setWeekDays(days);
  }

  function previousWeek() {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  }

  function nextWeek() {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  }

  function goToThisWeek() {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  }

  function getMonthYearDisplay(): string {
    const start = currentWeekStart;
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);

    const startMonth = start.toLocaleString('default', { month: 'long' });
    const endMonth = end.toLocaleString('default', { month: 'long' });
    const year = start.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${year}`;
    } else {
      return `${startMonth} - ${endMonth} ${year}`;
    }
  }

  function clearOutfit(day: DayOutfit) {
    const plannedOutfits = JSON.parse(localStorage.getItem('weeklyOutfitQueue') || '{}');
    const outfitKey = day.date.toISOString().split('T')[0];
    delete plannedOutfits[outfitKey];
    localStorage.setItem('weeklyOutfitQueue', JSON.stringify(plannedOutfits));
    generateWeekDays();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Weekly Outfit Queue</h2>
          <p className="text-gray-600">Plan your outfits for the week ahead</p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900">{getMonthYearDisplay()}</h3>
            <p className="text-sm text-gray-600">
              {currentWeekStart.toLocaleDateString()} - {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={nextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={goToThisWeek}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Go to This Week
          </button>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day) => (
            <div
              key={day.date.toISOString()}
              className={`
                border-2 rounded-xl p-4 transition-all cursor-pointer min-h-[200px] flex flex-col
                ${day.isToday
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                }
              `}
              onClick={() => setSelectedDay(day)}
            >
              {/* Day Header */}
              <div className="mb-3">
                <div className="text-sm font-semibold text-gray-600 uppercase">
                  {day.dayName}
                </div>
                <div className={`text-2xl font-bold ${day.isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day.dateNumber}
                </div>
              </div>

              {/* Events */}
              {day.events.length > 0 && (
                <div className="mb-3 space-y-1">
                  {day.events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs bg-gray-100 rounded px-2 py-1 truncate"
                    >
                      {event.title}
                    </div>
                  ))}
                  {day.events.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{day.events.length - 2} more
                    </div>
                  )}
                </div>
              )}

              {/* Planned Outfit */}
              {day.outfitItems && day.outfitItems.length > 0 ? (
                <div className="mt-auto">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1 text-purple-700">
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-medium">Outfit Planned</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearOutfit(day);
                        }}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {day.outfitItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center space-x-1 text-xs text-purple-700">
                          <Shirt className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                      ))}
                      {day.outfitItems.length > 3 && (
                        <div className="text-xs text-purple-600">
                          +{day.outfitItems.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlanOutfit(day.date, day.events[0]);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Plan Outfit</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedDay.dayName}, {selectedDay.date.toLocaleDateString('default', { month: 'long', day: 'numeric' })}
                </h3>
                {selectedDay.isToday && (
                  <span className="text-sm text-blue-600 font-medium">Today</span>
                )}
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Events */}
            {selectedDay.events.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Events</h4>
                <div className="space-y-2">
                  {selectedDay.events.map((event) => (
                    <div key={event.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-600">
                        {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Planned Outfit */}
            {selectedDay.outfitItems && selectedDay.outfitItems.length > 0 ? (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Planned Outfit</h4>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="space-y-2">
                    {selectedDay.outfitItems.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Shirt className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-gray-800">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 text-center py-8 bg-gray-50 rounded-lg">
                <Shirt className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No outfit planned yet</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  onPlanOutfit(selectedDay.date, selectedDay.events[0]);
                  setSelectedDay(null);
                }}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                {selectedDay.outfitItems ? 'Change Outfit' : 'Plan Outfit'}
              </button>
              {selectedDay.outfitItems && (
                <button
                  onClick={() => {
                    clearOutfit(selectedDay);
                    setSelectedDay(null);
                  }}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyOutfitQueue;
