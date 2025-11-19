/**
 * Pull-to-Refresh Component
 * 
 * iOS-style pull-to-refresh gesture for refreshing content.
 * Wraps children and adds pull gesture detection.
 */

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import haptics from '../utils/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
  threshold?: number; // Distance in pixels to trigger refresh
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 80
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only start pull if at top of scroll
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    // Only pull down (positive distance)
    if (distance > 0) {
      // Apply resistance - slower pull as you go further
      const resistance = 0.5;
      const adjustedDistance = Math.pow(distance, 0.8) * resistance;
      setPullDistance(Math.min(adjustedDistance, threshold * 1.5));

      // Haptic feedback when reaching threshold
      if (adjustedDistance >= threshold && pullDistance < threshold) {
        haptics.light();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || disabled || isRefreshing) return;

    setIsPulling(false);

    // Trigger refresh if threshold met
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      haptics.medium();

      try {
        await onRefresh();
        haptics.success();
      } catch (error) {
        console.error('Refresh failed:', error);
        haptics.error();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Snap back if threshold not met
      setPullDistance(0);
    }
  };

  // Calculate progress percentage for visual feedback
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const isThresholdMet = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto"
      style={{ 
        height: '100%',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-Refresh Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 pointer-events-none"
        style={{
          height: `${Math.max(pullDistance, 0)}px`,
          opacity: pullDistance > 0 ? 1 : 0,
          transform: `translateY(-${Math.max(0, threshold - pullDistance)}px)`,
        }}
      >
        <div className="flex flex-col items-center gap-1 py-2">
          <RefreshCw
            className={`w-6 h-6 transition-all ${
              isRefreshing ? 'animate-spin' : ''
            } ${isThresholdMet ? 'text-amber-500' : 'text-gray-400'}`}
            style={{
              transform: `rotate(${progress * 3.6}deg)`,
            }}
          />
          <span className="text-xs font-medium text-gray-500">
            {isRefreshing
              ? 'Refreshing...'
              : isThresholdMet
              ? 'Release to refresh'
              : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content with padding to accommodate indicator */}
      <div
        style={{
          transform: isRefreshing
            ? `translateY(${threshold}px)`
            : `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
