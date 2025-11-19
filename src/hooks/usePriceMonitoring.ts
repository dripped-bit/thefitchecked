/**
 * Price Monitoring Hook
 * Manages price data, alerts, and history for wishlist items
 */

import { useState, useEffect, useCallback } from 'react';
import priceMonitoringService from '../services/priceMonitoringService';
import { PriceAlertData } from '../components/PriceAlertBanner';

interface PriceHistoryPoint {
  price: number;
  date: string;
  checked_at: string;
  original_price?: number;
  discount_percentage?: number;
}

interface UsePriceMonitoringResult {
  priceHistory: PriceHistoryPoint[];
  priceAlert: PriceAlertData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  checkPrice: () => Promise<void>;
}

export function usePriceMonitoring(
  itemId: string,
  itemUrl: string,
  currentPrice?: number
): UsePriceMonitoringResult {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [priceAlert, setPriceAlert] = useState<PriceAlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load price history from database
  const loadPriceHistory = useCallback(async () => {
    if (!itemId) return;

    try {
      setLoading(true);
      setError(null);

      const history = await priceMonitoringService.getPriceHistory(itemId, 30);
      
      if (history && history.length > 0) {
        setPriceHistory(history);

        // Detect price alert if we have at least 2 data points
        if (history.length >= 2) {
          const latest = history[0];
          const previous = history[1];

          const alert = priceMonitoringService.detectPriceDrop(
            previous.price,
            latest.price
          );

          if (alert) {
            setPriceAlert({
              type: 'price_drop',
              currentPrice: latest.price,
              originalPrice: previous.price,
              dropAmount: alert.dropAmount,
              percentage: alert.percentage,
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading price history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  // Manually check price (calls Claude API)
  const checkPrice = useCallback(async () => {
    if (!itemUrl) return;

    try {
      setLoading(true);
      setError(null);

      await priceMonitoringService.checkProductPrice(itemUrl);
      
      // Reload history after check
      await loadPriceHistory();
    } catch (err: any) {
      console.error('Error checking price:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [itemUrl, loadPriceHistory]);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadPriceHistory();
  }, [loadPriceHistory]);

  // Load on mount
  useEffect(() => {
    loadPriceHistory();
  }, [loadPriceHistory]);

  return {
    priceHistory,
    priceAlert,
    loading,
    error,
    refresh,
    checkPrice,
  };
}
