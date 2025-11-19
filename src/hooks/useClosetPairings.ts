/**
 * Closet Pairings Hook
 * Manages AI-generated outfit pairing suggestions for wishlist items
 */

import { useState, useEffect, useCallback } from 'react';
import closetPairingService, { PairingResult } from '../services/closetPairingService';

interface WishlistItemForPairing {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  price: string;
  retailer?: string;
  notes?: string;
  image: string;
}

interface UseClosetPairingsResult {
  pairings: PairingResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  generatePairings: () => Promise<void>;
}

export function useClosetPairings(
  item: WishlistItemForPairing | null,
  autoLoad: boolean = true
): UseClosetPairingsResult {
  const [pairings, setPairings] = useState<PairingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate pairing suggestions
  const generatePairings = useCallback(async (forceRefresh: boolean = false) => {
    if (!item) return;

    try {
      setLoading(true);
      setError(null);

      const result = await closetPairingService.generatePairings(item, forceRefresh);
      setPairings(result);
    } catch (err: any) {
      console.error('Error generating pairings:', err);
      setError(err.message);
      
      // Set empty result on error
      setPairings({
        suggestions: [],
        reasoning: 'Unable to generate pairing suggestions at this time.',
        completenessNote: '',
        cached: false,
        generatedAt: new Date(),
      });
    } finally {
      setLoading(false);
    }
  }, [item]);

  // Refresh pairings (force regeneration)
  const refresh = useCallback(async () => {
    await generatePairings(true);
  }, [generatePairings]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && item && !pairings) {
      generatePairings(false);
    }
  }, [autoLoad, item, pairings, generatePairings]);

  return {
    pairings,
    loading,
    error,
    refresh,
    generatePairings: () => generatePairings(false),
  };
}
