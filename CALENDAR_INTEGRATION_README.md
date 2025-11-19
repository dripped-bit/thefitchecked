# Enhanced Calendar Hooks Integration

This document describes the enhanced calendar hooks integration completed on 2025-11-18.

## Overview

The calendar system has been upgraded to support time-based events with full timestamp support, replacing the previous date-only implementation.

## Changes Made

### 1. Query Keys (`src/lib/queryKeys.ts`)
- Updated `calendar.events` to accept `dateRange` parameter instead of `month`
- Supports flexible date range queries

### 2. Calendar Hook (`src/hooks/useCalendar.ts`)
**Backup created:** `src/hooks/useCalendar.old.ts`

#### New Features:
- **Time-based events**: Full timestamp support with `start_time` and `end_time`
- **Multiple query helpers**:
  - `useCalendarEvents(userId, startDate, endDate)` - Date range queries
  - `useMonthCalendarEvents(userId, year, month)` - Month view
  - `useDayCalendarEvents(userId, date)` - Day view
- **Enhanced event fields**:
  - `title`, `description`, `location`
  - `event_type`, `is_all_day`, `weather_required`
  - `shopping_links` (jsonb)
  - `google_calendar_id`, `outfit_image_url`

#### Breaking Changes:
- **CalendarEvent interface**: Changed from `date` to `start_time`/`end_time`
- **Query signatures**: `useCalendarEvents` now requires `startDate` and `endDate` instead of `month`
- **Query keys**: Now use date ranges (e.g., `2025-01-01_2025-01-31`) instead of month strings

### 3. Calendar Components (`src/components/calendar/CalendarView.tsx`)
New example components created:
- **CalendarView**: Monthly calendar with event cards
- **DayCalendarView**: Single day event list

Features:
- Outfit image display
- Event time formatting (all-day vs. timed events)
- Location and event type badges
- Responsive layout with Tailwind CSS

### 4. Database Schema

#### Existing Schema
The `calendar_events` table already has:
- `start_time`, `end_time` (timestamp)
- `title`, `description`, `location`
- `event_type`, `is_all_day`, `weather_required`
- `shopping_links` (jsonb)

#### New Fields (Optional Migration)
Run `calendar-events-enhancements-migration.sql` to add:
- `google_calendar_id` - For Google Calendar sync
- `outfit_image_url` - Cached outfit image for performance

## Migration Guide

### For Existing Code

If you have code using the old `useCalendarEvents` hook:

**Before:**
```typescript
const { data: events } = useCalendarEvents(userId, '2025-01');
```

**After:**
```typescript
// Option 1: Use the month helper
const { data: events } = useMonthCalendarEvents(userId, 2025, 1);

// Option 2: Specify date range
const { data: events } = useCalendarEvents(userId, '2025-01-01', '2025-01-31');
```

### Event Data Structure

**Before:**
```typescript
interface CalendarEvent {
  id: string;
  user_id: string;
  date: string;           // YYYY-MM-DD
  outfit_id: string;
  notes?: string;
  created_at: string;
}
```

**After:**
```typescript
interface CalendarEvent {
  id: string;
  user_id: string;
  start_time: string;      // ISO timestamp
  end_time: string;        // ISO timestamp
  title?: string;
  description?: string;
  outfit_id?: string;
  outfit_image_url?: string;
  google_calendar_id?: string;
  location?: string;
  event_type?: string;
  is_all_day: boolean;
  weather_required: boolean;
  shopping_links?: any;    // jsonb
  created_at: string;
  updated_at: string;
}
```

## Usage Examples

### 1. Monthly Calendar View

```typescript
import { useMonthCalendarEvents } from '@/hooks/useCalendar';

function MyCalendar({ userId }: { userId: string }) {
  const { data: events, isLoading } = useMonthCalendarEvents(
    userId,
    2025,
    11  // November
  );

  return (
    <div>
      {events?.map(event => (
        <div key={event.id}>
          <h3>{event.title}</h3>
          <p>{new Date(event.start_time).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Day View

```typescript
import { useDayCalendarEvents } from '@/hooks/useCalendar';

function DayView({ userId, date }: { userId: string; date: string }) {
  const { data: events } = useDayCalendarEvents(userId, date);

  return (
    <div>
      {events?.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

### 3. Custom Date Range

```typescript
import { useCalendarEvents } from '@/hooks/useCalendar';

function WeekView({ userId }: { userId: string }) {
  const today = new Date();
  const weekLater = new Date(today);
  weekLater.setDate(today.getDate() + 7);
  
  const startDate = today.toISOString().split('T')[0];
  const endDate = weekLater.toISOString().split('T')[0];
  
  const { data: events } = useCalendarEvents(userId, startDate, endDate);

  return <WeekCalendar events={events} />;
}
```

### 4. Adding Events

```typescript
import { useAddCalendarEvent } from '@/hooks/useCalendar';

function AddEventForm({ userId }: { userId: string }) {
  const addEvent = useAddCalendarEvent();

  const handleSubmit = () => {
    addEvent.mutate({
      user_id: userId,
      title: 'Team Meeting',
      start_time: '2025-11-18T14:00:00',
      end_time: '2025-11-18T15:00:00',
      location: 'Conference Room A',
      event_type: 'work',
      is_all_day: false,
      weather_required: false,
    });
  };

  return <button onClick={handleSubmit}>Add Event</button>;
}
```

### 5. Updating Events

```typescript
import { useUpdateCalendarEvent } from '@/hooks/useCalendar';

function EditEvent({ eventId }: { eventId: string }) {
  const updateEvent = useUpdateCalendarEvent();

  const handleUpdate = () => {
    updateEvent.mutate({
      eventId,
      updates: {
        title: 'Updated Meeting Title',
        location: 'Room B',
      },
    });
  };

  return <button onClick={handleUpdate}>Update</button>;
}
```

## Database Migrations

### Required Migration
Your existing table already has the core fields. No migration is strictly required.

### Optional Migration
To add `google_calendar_id` and `outfit_image_url`:

```bash
# Run in Supabase SQL Editor
psql < calendar-events-enhancements-migration.sql
```

Or manually run the SQL from `calendar-events-enhancements-migration.sql`.

## Testing

Test the integration by:

1. **Query calendar events:**
   ```typescript
   const { data } = useMonthCalendarEvents(userId, 2025, 11);
   ```

2. **Add a test event:**
   ```typescript
   const addEvent = useAddCalendarEvent();
   addEvent.mutate({ /* event data */ });
   ```

3. **Verify query invalidation:**
   - Add an event
   - Confirm the calendar re-fetches automatically

## Troubleshooting

### Events not showing up
- Check `start_time` and `end_time` are within the query range
- Verify RLS policies allow access
- Check browser console for errors

### TypeScript errors
- Ensure you're using the new `CalendarEvent` interface
- Update imports to use new hook signatures

### Performance issues
- Use `useMonthCalendarEvents` instead of querying entire years
- Consider implementing pagination for large event lists
- Use `outfit_image_url` cache field instead of joining every query

## Related Files

- `src/hooks/useCalendar.ts` - Main hook implementation
- `src/hooks/useCalendar.old.ts` - Backup of previous version
- `src/lib/queryKeys.ts` - Query key definitions
- `src/components/calendar/CalendarView.tsx` - Example components
- `calendar-events-migration.sql` - Base table schema
- `calendar-events-shopping-links-migration.sql` - Shopping links field
- `calendar-events-enhancements-migration.sql` - Optional enhancements

## Support

For questions or issues, refer to:
- React Query docs: https://tanstack.com/query/latest
- Supabase docs: https://supabase.com/docs
- Project README: `/README.md`
