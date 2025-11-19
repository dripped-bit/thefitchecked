import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { queryKeys } from '../lib/queryKeys';

export interface CalendarEvent {
  id: string;
  user_id: string;
  start_time: string; // timestamp
  end_time: string; // timestamp
  title?: string;
  description?: string;
  outfit_id?: string;
  outfit_image_url?: string;
  google_calendar_id?: string;
  location?: string;
  event_type?: string;
  is_all_day: boolean;
  weather_required: boolean;
  shopping_links?: any; // jsonb
  created_at: string;
  updated_at: string;
}

// Fetch calendar events for a date range
export function useCalendarEvents(
  userId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
) {
  return useQuery({
    queryKey: queryKeys.calendar.events(userId, `${startDate}_${endDate}`),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          outfit:saved_outfits(
            id,
            name,
            top_id,
            bottom_id,
            shoes_id,
            outerwear_id,
            image_url
          )
        `)
        .eq('user_id', userId)
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('end_time', `${endDate}T23:59:59`)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId && !!startDate && !!endDate,
  });
}

// Get events for specific month
export function useMonthCalendarEvents(userId: string, year: number, month: number) {
  // Calculate first and last day of month
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  return useCalendarEvents(userId, startDate, endDate);
}

// Get events for specific day
export function useDayCalendarEvents(userId: string, date: string) {
  return useQuery({
    queryKey: [...queryKeys.calendar.events(userId, date), 'day'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          outfit:saved_outfits(*)
        `)
        .eq('user_id', userId)
        .gte('start_time', `${date}T00:00:00`)
        .lte('start_time', `${date}T23:59:59`)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId && !!date,
  });
}

// Add calendar event
export function useAddCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Partial<CalendarEvent>) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(event)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all calendar queries
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

// Update calendar event
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      updates,
    }: {
      eventId: string;
      updates: Partial<CalendarEvent>;
    }) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}

// Delete calendar event
export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      return eventId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}
