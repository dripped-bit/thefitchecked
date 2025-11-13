/**
 * Monthly Calendar Grid Component
 * Apple-style calendar with mobile-first responsive design
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Circle,
  Shirt,
  Sun,
  Cloud,
  CloudRain
} from 'lucide-react';
import { CalendarEvent } from '../services/smartCalendarService';

interface MonthlyCalendarGridProps {
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onAddEvent: () => void;
  selectedDate?: Date;
}

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  hasOutfit: boolean;
}

const MonthlyCalendarGrid: React.FC<MonthlyCalendarGridProps> = ({
  events,
  onDateClick,
  onAddEvent,
  selectedDate
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<DayCell[]>([]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth, events]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week (0 = Sunday)
    const firstDayOfWeek = firstDay.getDay();
    const lastDate = lastDay.getDate();

    // Generate days including previous and next month
    const days: DayCell[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthLastDate = prevMonth.getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDate - i);
      days.push(createDayCell(date, false, today));
    }

    // Current month days
    for (let i = 1; i <= lastDate; i++) {
      const date = new Date(year, month, i);
      days.push(createDayCell(date, true, today));
    }

    // Next month days to fill grid (ensure 6 weeks)
    const remainingDays = 42 - days.length; // 6 weeks × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push(createDayCell(date, false, today));
    }

    setCalendarDays(days);
  };

  const createDayCell = (date: Date, isCurrentMonth: boolean, today: Date): DayCell => {
    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const selectedStr = selectedDate?.toDateString();

    // Find events for this day
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === dateStr;
    });

    return {
      date,
      isCurrentMonth,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedStr,
      events: dayEvents,
      hasOutfit: false // TODO: Check if outfit planned for this day
    };
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getEventTypeColor = (eventType: string): string => {
    const colors: { [key: string]: string } = {
      work: 'bg-ios-blue',
      personal: 'bg-ios-green',
      travel: 'bg-ios-purple',
      formal: 'bg-ios-label-primary',
      casual: 'bg-ios-orange',
      other: 'bg-ios-pink'
    };
    return colors[eventType] || 'bg-ios-label-tertiary';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="ios-card rounded-ios-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-ios-fill to-ios-fill/50 border-b border-ios-separator p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="ios-title-1 md:ios-large-title">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              onClick={goToToday}
              className="hidden md:block ios-callout font-semibold text-ios-blue hover:text-ios-blue/80 transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-ios-fill rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-ios-label-secondary" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-ios-fill rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-ios-label-secondary" />
            </button>
            <button
              onClick={onAddEvent}
              className="ios-button-primary ml-2 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Add Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b border-ios-separator bg-ios-fill">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-2 md:p-3 text-center ios-caption-1 md:ios-callout font-semibold text-ios-label-secondary"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              onDateClick(day.date);
            }}
            className={`
              relative min-h-[80px] md:min-h-[120px] p-2 md:p-3 border-b border-r border-gray-100
              hover:bg-blue-50 transition-colors text-left
              ${!day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'}
              ${day.isSelected ? 'bg-blue-100 ring-2 ring-blue-500 ring-inset' : ''}
              ${index % 7 === 6 ? 'border-r-0' : ''}
              ${index >= 35 ? 'border-b-0' : ''}
            `}
          >
            {/* Date Number */}
            <div className="flex items-start justify-between mb-1">
              <span
                className={`
                  inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full text-sm md:text-base font-medium
                  ${day.isToday
                    ? 'bg-blue-600 text-white'
                    : day.isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }
                `}
              >
                {day.date.getDate()}
              </span>

              {/* Outfit Indicator */}
              {day.hasOutfit && (
                <Shirt className="w-4 h-4 text-purple-500" />
              )}
            </div>

            {/* Event Dots */}
            <div className="space-y-1">
              {day.events.slice(0, 3).map((event, idx) => (
                <div
                  key={event.id}
                  className="flex items-center space-x-1 text-xs truncate"
                >
                  <Circle
                    className={`w-2 h-2 flex-shrink-0 fill-current ${getEventTypeColor(event.eventType)}`}
                  />
                  <span className={`truncate ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}`}>
                    {event.title}
                  </span>
                </div>
              ))}
              {day.events.length > 3 && (
                <div className="text-xs text-gray-500 font-medium pl-3">
                  +{day.events.length - 3} more
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Mobile Today Button */}
      <div className="md:hidden border-t border-ios-separator p-3">
        <button
          onClick={goToToday}
          className="ios-button-secondary w-full"
        >
          Go to Today
        </button>
      </div>
    </div>
  );
};

export default MonthlyCalendarGrid;
