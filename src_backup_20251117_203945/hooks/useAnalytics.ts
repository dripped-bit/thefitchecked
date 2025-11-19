import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';
import { queryKeys } from '../lib/queryKeys';

// Closet analytics (value, counts, etc.)
export function useClosetAnalytics(userId: string) {
  return useQuery({
    queryKey: queryKeys.analytics.closet(userId),
    queryFn: async () => {
      // Fetch all wardrobe items
      const { data: items, error } = await supabase
        .from('wardrobe_items')
        .select('category, price, created_at')
        .eq('user_id', userId);

      if (error) throw error;

      // Calculate totals
      const totalValue = items.reduce((sum, item) => sum + (item.price || 0), 0);
      const totalItems = items.length;

      // Group by category
      const categoryBreakdown = items.reduce((acc, item) => {
        const cat = item.category || 'uncategorized';
        if (!acc[cat]) {
          acc[cat] = { count: 0, value: 0 };
        }
        acc[cat].count += 1;
        acc[cat].value += item.price || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      // Items this month
      const thisMonth = new Date().toISOString().substring(0, 7);
      const itemsThisMonth = items.filter(
        item => item.created_at.startsWith(thisMonth)
      ).length;

      return {
        totalValue,
        totalItems,
        averageCost: totalValue / totalItems || 0,
        itemsThisMonth,
        categoryBreakdown: Object.entries(categoryBreakdown).map(
          ([category, data]) => ({
            category,
            count: data.count,
            value: data.value,
            percentage: (data.value / totalValue) * 100,
          })
        ).sort((a, b) => b.value - a.value),
      };
    },
    staleTime: 60 * 60 * 1000, // Cache for 1 hour (analytics don't need real-time)
    enabled: !!userId,
  });
}

// Color distribution
export function useColorAnalytics(userId: string) {
  return useQuery({
    queryKey: queryKeys.analytics.colors(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('color')
        .eq('user_id', userId);

      if (error) throw error;

      // Count colors
      const colorCounts = data.reduce((acc, item) => {
        const color = (item.color || 'unknown').toLowerCase();
        acc[color] = (acc[color] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(colorCounts).reduce((sum, count) => sum + count, 0);

      // Map to hex codes (basic fallback - you can use Claude for this)
      const COLOR_MAP: Record<string, string> = {
        black: '#000000',
        white: '#FFFFFF',
        gray: '#808080',
        grey: '#808080',
        blue: '#4A90E2',
        navy: '#000080',
        red: '#E74C3C',
        green: '#2ECC71',
        yellow: '#F1C40F',
        pink: '#FFC0CB',
        purple: '#9B59B6',
        brown: '#8B4513',
        orange: '#FF8C00',
        beige: '#F5F5DC',
        tan: '#D2B48C',
        gold: '#FFD700',
        silver: '#C0C0C0',
        cream: '#FFFDD0',
      };

      return Object.entries(colorCounts)
        .map(([color, count]) => ({
          color,
          count,
          hexCode: COLOR_MAP[color] || '#CCCCCC',
          percentage: (count / total) * 100,
        }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!userId,
  });
}
