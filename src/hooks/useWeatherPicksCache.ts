/**
 * Weather Picks Cache Hook
 * 
 * Manages caching of weather-based outfit suggestions for instant loading
 * and offline access.
 */

import { useState, useEffect, useCallback } from 'react';
import { OutfitSuggestion } from '../services/claudeOutfitService';
import { WeatherData } from '../services/weatherService';

const CACHE_KEY = 'weatherPicksCache';
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 5;

interface CachedSuggestion {
  timestamp: string;
  weather: WeatherData;
  suggestions: OutfitSuggestion[];
  occasionContext?: any;
}

interface WeatherPicksCache {
  entries: CachedSuggestion[];
}

export const useWeatherPicksCache = () => {
  const [cache, setCache] = useState<WeatherPicksCache | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: WeatherPicksCache = JSON.parse(cached);
        
        // Filter out expired entries
        const now = Date.now();
        const validEntries = parsed.entries.filter(entry => {
          const entryAge = now - new Date(entry.timestamp).getTime();
          return entryAge < MAX_CACHE_AGE_MS;
        });

        if (validEntries.length > 0) {
          setCache({ entries: validEntries });
          console.log(`📦 [CACHE] Loaded ${validEntries.length} cached weather picks`);
        } else {
          // All entries expired, clear cache
          localStorage.removeItem(CACHE_KEY);
          console.log('🗑️ [CACHE] All entries expired, cache cleared');
        }
      }
    } catch (error) {
      console.error('❌ [CACHE] Failed to load cache:', error);
      localStorage.removeItem(CACHE_KEY);
    } finally {
      setIsLoadingCache(false);
    }
  }, []);

  // Get the most recent cached entry
  const getLatestCache = useCallback((): CachedSuggestion | null => {
    if (!cache || cache.entries.length === 0) return null;
    
    // Return most recent entry (entries are already sorted by timestamp)
    return cache.entries[0];
  }, [cache]);

  // Save new suggestions to cache
  const saveToCache = useCallback((
    weather: WeatherData,
    suggestions: OutfitSuggestion[],
    occasionContext?: any
  ) => {
    try {
      const newEntry: CachedSuggestion = {
        timestamp: new Date().toISOString(),
        weather,
        suggestions,
        occasionContext
      };

      const currentEntries = cache?.entries || [];
      
      // Add new entry at the beginning, limit to MAX_CACHE_ENTRIES
      const updatedEntries = [newEntry, ...currentEntries].slice(0, MAX_CACHE_ENTRIES);

      const updatedCache: WeatherPicksCache = {
        entries: updatedEntries
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedCache));
      setCache(updatedCache);

      console.log(`💾 [CACHE] Saved new weather picks (${updatedEntries.length} total cached)`);
    } catch (error) {
      console.error('❌ [CACHE] Failed to save to cache:', error);
      // If storage is full, try clearing old entries
      if (error instanceof Error && error.message.includes('quota')) {
        clearCache();
      }
    }
  }, [cache]);

  // Clear entire cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setCache(null);
      console.log('🗑️ [CACHE] Cache cleared');
    } catch (error) {
      console.error('❌ [CACHE] Failed to clear cache:', error);
    }
  }, []);

  // Check if cache exists and is recent (within 1 hour)
  const hasRecentCache = useCallback((): boolean => {
    const latest = getLatestCache();
    if (!latest) return false;

    const age = Date.now() - new Date(latest.timestamp).getTime();
    const oneHour = 60 * 60 * 1000;
    
    return age < oneHour;
  }, [getLatestCache]);

  // Get cache age in minutes
  const getCacheAge = useCallback((): number | null => {
    const latest = getLatestCache();
    if (!latest) return null;

    const ageMs = Date.now() - new Date(latest.timestamp).getTime();
    return Math.floor(ageMs / (60 * 1000)); // Convert to minutes
  }, [getLatestCache]);

  return {
    cache: getLatestCache(),
    isLoadingCache,
    hasCache: !!cache && cache.entries.length > 0,
    hasRecentCache: hasRecentCache(),
    cacheAge: getCacheAge(),
    saveToCache,
    clearCache
  };
};
