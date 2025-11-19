'use client';

import { useMonthCalendarEvents } from '../../hooks/useCalendar';
import { supabase } from '../../services/supabaseClient';
import { useState, useEffect } from 'react';

export function CalendarView({ userId }: { userId: string }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const { data: events, isLoading } = useMonthCalendarEvents(
    userId,
    currentYear,
    currentMonth
  );

  if (isLoading) return <div className="loading-container">Loading calendar...</div>;

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">
        {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })}
      </h2>

      {events?.map((event) => (
        <div key={event.id} className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-start gap-4">
            {event.outfit?.image_url && (
              <img
                src={event.outfit.image_url}
                alt="Outfit"
                className="w-20 h-20 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{event.title || 'Event'}</h3>
              <p className="text-sm text-gray-600">
                {new Date(event.start_time).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {!event.is_all_day && (
                  <> - {new Date(event.end_time).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</>
                )}
                {event.is_all_day && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">All Day</span>}
              </p>
              {event.description && (
                <p className="text-sm text-gray-500 mt-1">{event.description}</p>
              )}
              {event.location && (
                <p className="text-xs text-gray-400 mt-1">📍 {event.location}</p>
              )}
              {event.event_type && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded mt-2 inline-block">
                  {event.event_type}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {events?.length === 0 && (
        <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
          No events scheduled this month
        </div>
      )}
    </div>
  );
}

// Example: Day View Component
export function DayCalendarView({ userId, date }: { userId: string; date: string }) {
  const { data: events, isLoading } = useMonthCalendarEvents(
    userId,
    new Date(date).getFullYear(),
    new Date(date).getMonth() + 1
  );

  // Filter events for specific date
  const dayEvents = events?.filter(event => {
    const eventDate = new Date(event.start_time).toISOString().split('T')[0];
    return eventDate === date;
  });

  if (isLoading) return <div className="loading-container">Loading day...</div>;

  return (
    <div className="space-y-3 p-4">
      <h2 className="text-xl font-bold">
        {new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </h2>

      <div className="space-y-2">
        {dayEvents?.map((event) => (
          <div key={event.id} className="bg-white border-l-4 border-blue-500 p-3 rounded shadow-sm">
            <div className="flex items-center gap-3">
              {event.outfit?.image_url && (
                <img
                  src={event.outfit.image_url}
                  alt="Outfit"
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{event.title || 'Event'}</h4>
                  {event.is_all_day ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">All Day</span>
                  ) : (
                    <span className="text-sm text-gray-600">
                      {new Date(event.start_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                {event.location && (
                  <p className="text-xs text-gray-500 mt-1">📍 {event.location}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {dayEvents?.length === 0 && (
          <div className="text-center text-gray-400 py-6 bg-gray-50 rounded-lg">
            No events scheduled for this day
          </div>
        )}
      </div>
    </div>
  );
}
