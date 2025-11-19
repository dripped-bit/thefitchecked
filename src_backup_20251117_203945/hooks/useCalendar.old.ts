import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { queryKeys } from '../lib/queryKeys';

interface CalendarEvent {
  id: string;
  user_id: string;
  date: string;
  outfit_id: string;
  notes?: string;
  created_at: string;
}

// Fetch calendar events for a month
export function useCalendarEvents(userId: string, month: string) {
  return useQuery({
    queryKey: queryKeys.calendar.events(userId, month),
    queryFn: async () => {
      const startOfMonth = `${month}-01`;
      const endOfMonth = `${month}-31`;

      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          outfit:saved_outfits(
            id,
            top_id,
            bottom_id,
            shoes_id,
            outerwear_id
          )
        `)
        .eq('user_id', userId)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userId && !!month,
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
    onSuccess: (data) => {
      const month = data.date.substring(0, 7); // YYYY-MM
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.calendar.events(data.user_id, month) 
      });
    },
  });
}

// Update calendar event
export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      updates 
    }: { 
      eventId: string; 
      updates: Partial<CalendarEvent> 
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
    onSuccess: (data) => {
      const month = data.date.substring(0, 7);
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.calendar.events(data.user_id, month) 
      });
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
