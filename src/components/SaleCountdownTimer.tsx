/**
 * Sale Countdown Timer Component
 * Real-time countdown display for items on sale
 * Shows days, hours, minutes with optional progress bar
 */

import React, { useState, useEffect, useMemo } from 'react';

interface SaleCountdownTimerProps {
  saleEnds: string; // ISO date string
  onExpired?: () => void;
  showProgress?: boolean;
  compact?: boolean;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  percentElapsed: number;
  isExpired: boolean;
}

const SaleCountdownTimer: React.FC<SaleCountdownTimerProps> = ({
  saleEnds,
  onExpired,
  showProgress = true,
  compact = false,
  className = '',
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  // Calculate time remaining
  const calculateTimeRemaining = useMemo(() => {
    return (): TimeRemaining => {
      const now = new Date().getTime();
      const endTime = new Date(saleEnds).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          percentElapsed: 100,
          isExpired: true,
        };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      const totalSeconds = Math.floor(difference / 1000);

      // Calculate percent elapsed (for progress bar)
      // Assume sale started 7 days ago for calculation
      const saleDuration = 7 * 24 * 60 * 60; // 7 days in seconds
      const elapsed = saleDuration - totalSeconds;
      const percentElapsed = Math.min(100, Math.max(0, (elapsed / saleDuration) * 100));

      return {
        days,
        hours,
        minutes,
        seconds,
        totalSeconds,
        percentElapsed,
        isExpired: false,
      };
    };
  }, [saleEnds]);

  // Update countdown every second
  useEffect(() => {
    // Initial calculation
    const updateTime = () => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining.isExpired && onExpired) {
        onExpired();
      }
    };

    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [saleEnds, calculateTimeRemaining, onExpired]);

  if (!timeRemaining) {
    return null;
  }

  if (timeRemaining.isExpired) {
    return (
      <div className={`text-xs text-gray-500 italic ${className}`}>
        Sale has ended
      </div>
    );
  }

  // Format countdown string
  const formatCountdown = (): string => {
    const { days, hours, minutes } = timeRemaining;

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Determine urgency level
  const getUrgencyLevel = (): 'high' | 'medium' | 'low' => {
    const { totalSeconds } = timeRemaining;
    const hours = totalSeconds / 3600;

    if (hours < 24) return 'high';
    if (hours < 72) return 'medium';
    return 'low';
  };

  const urgency = getUrgencyLevel();
  const urgencyColors = {
    high: 'text-red-700',
    medium: 'text-orange-700',
    low: 'text-yellow-700',
  };

  if (compact) {
    return (
      <span className={`text-xs font-semibold ${urgencyColors[urgency]} ${className}`}>
        ⏰ {formatCountdown()}
      </span>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-semibold ${urgencyColors[urgency]}`}>
            ⏰ Sale ends in {formatCountdown()}
          </p>
          
          {/* Progress bar */}
          {showProgress && (
            <div className="w-full bg-red-200 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-1000 ${
                  urgency === 'high' ? 'bg-red-600' : urgency === 'medium' ? 'bg-orange-600' : 'bg-yellow-600'
                }`}
                style={{ width: `${100 - timeRemaining.percentElapsed}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Detailed time breakdown (optional) */}
      {urgency === 'high' && timeRemaining.days === 0 && (
        <p className="text-xs text-red-600 mt-1">
          Hurry! Less than {timeRemaining.hours > 0 ? `${timeRemaining.hours} hour${timeRemaining.hours > 1 ? 's' : ''}` : 'an hour'} left
        </p>
      )}
    </div>
  );
};

export default SaleCountdownTimer;
