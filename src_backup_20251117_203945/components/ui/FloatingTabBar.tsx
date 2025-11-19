/**
 * Floating Tab Bar Component - iOS 18 Style
 * Advanced grouped tab bar with paired/trio/quad grouping support
 * https://developer.apple.com/design/human-interface-guidelines/tab-bars
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  route?: string;
  group?: number; // Optional: which group this tab belongs to (0, 1, etc.)
}

export type GroupingStyle = 'none' | 'paired' | 'trio' | 'quad';

export interface FloatingTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  groupingStyle?: GroupingStyle;
  hapticFeedback?: boolean;
  className?: string;
}

/**
 * FloatingTabBar - Advanced iOS 18 tab bar with visual grouping
 *
 * Features:
 * - Visual grouping (paired, trio, quad)
 * - Liquid glass morphism background
 * - Subtle dividers between groups
 * - Haptic feedback on tap
 * - Badge support
 * - Safe area insets
 * - Pink active state
 *
 * Usage:
 * <FloatingTabBar
 *   tabs={[
 *     { id: 'home', label: 'Home', icon: <Home />, group: 0 },
 *     { id: 'closet', label: 'Closet', icon: <Shirt />, group: 0 },
 *     { id: 'outfits', label: 'Outfits', icon: <Sparkles />, group: 1 },
 *     { id: 'profile', label: 'Profile', icon: <User />, group: 1 }
 *   ]}
 *   activeTab={currentTab}
 *   onTabChange={setCurrentTab}
 *   groupingStyle="paired"
 * />
 */
export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  groupingStyle = 'none',
  hapticFeedback = true,
  className
}) => {
  const handleTabClick = async (tabId: string) => {
    // Haptic feedback
    if (hapticFeedback) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        // Haptics not available on web
      }
    }

    onTabChange(tabId);
  };

  // Limit to 5 tabs per HIG recommendation
  const displayTabs = tabs.slice(0, 5);

  // Auto-assign groups if not specified based on grouping style
  const tabsWithGroups = displayTabs.map((tab, index) => {
    if (tab.group !== undefined) return tab;

    let group = 0;
    switch (groupingStyle) {
      case 'paired':
        group = Math.floor(index / 2);
        break;
      case 'trio':
        group = Math.floor(index / 3);
        break;
      case 'quad':
        group = Math.floor(index / 4);
        break;
      default:
        group = 0;
    }

    return { ...tab, group };
  });

  // Group tabs for rendering
  const groupedTabs: Tab[][] = [];
  tabsWithGroups.forEach((tab) => {
    const groupIndex = tab.group || 0;
    if (!groupedTabs[groupIndex]) {
      groupedTabs[groupIndex] = [];
    }
    groupedTabs[groupIndex].push(tab);
  });

  return (
    <nav
      className={cn(
        // Fixed positioning at bottom
        'fixed bottom-0 left-0 right-0 z-[100]',
        // Transparent background - pills float above content
        'bg-transparent',
        // Pointer events pass through container
        'pointer-events-none',
        // Safe area for iPhone home indicator
        'pb-[env(safe-area-inset-bottom)]',
        'px-safe',
        className
      )}
      role="tablist"
      aria-label="Main navigation"
    >
      {/* Edge-aligned container for floating pills */}
      <div className="flex items-center justify-between gap-2 py-1.5 px-3 pointer-events-none">
        {groupedTabs.map((group, groupIndex) => (
          <React.Fragment key={`group-${groupIndex}`}>
            {/* Floating Glass Pill for each group */}
            <div
              className={cn(
                // Floating pill styles
                'flex items-center justify-center gap-1 px-2.5 py-1.5',
                // ENHANCED GLASS MORPHISM (Apple ultra-thin material style)
                'bg-white/30 backdrop-blur-2xl',
                // Rounded pill shape
                'rounded-full',
                // Enhanced shadow for floating effect
                'shadow-[0_8px_32px_rgba(0,0,0,0.15)]',
                // Frosted glass border
                'border border-white/20',
                // Re-enable pointer events on pill
                'pointer-events-auto',
                // Smooth transitions
                'transition-all duration-300 ease-out'
              )}
              style={{
                // iOS Safari ultra-thin material effect
                WebkitBackdropFilter: 'blur(40px) saturate(180%) brightness(120%)',
                backdropFilter: 'blur(40px) saturate(180%) brightness(120%)',
                backgroundColor: 'rgba(255, 255, 255, 0.25)', // Ultra-thin clear glass
              }}
            >
              {group.map((tab) => {
                const isActive = tab.id === activeTab;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      // Base styles - compact for pill layout
                      'flex flex-col items-center justify-center',
                      // Compact sizing for pills (20% smaller)
                      'min-w-[45px] px-1.5 py-0.5',
                      // Smooth transitions
                      'transition-all duration-200 ease-out',
                      // Active state - subtle scale
                      isActive && 'scale-105',
                      // Press feedback
                      'active:scale-95',
                      // Rounded for pill aesthetic
                      'rounded-full',
                      // Focus styles for accessibility
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50'
                    )}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={tab.label}
                  >
                    {/* Icon Container */}
                    <div
                      className={cn(
                        'relative flex items-center justify-center',
                        'transition-all duration-200 ease-out',
                        // Icon size (20% smaller)
                        'w-4 h-4',
                        // Color based on active state - pink for active
                        isActive
                          ? 'text-pink-500 opacity-100'
                          : 'text-gray-600 opacity-60'
                      )}
                    >
                      {tab.icon}

                      {/* Badge */}
                      {tab.badge && (
                        <span
                          className={cn(
                            'absolute -top-1 -right-1',
                            'flex items-center justify-center',
                            'min-w-[16px] h-4 px-1',
                            'text-[10px] font-semibold text-white',
                            'bg-[var(--ios-red)] rounded-full',
                            // Badge border for better visibility
                            'border border-white'
                          )}
                        >
                          {typeof tab.badge === 'number' && tab.badge > 99
                            ? '99+'
                            : tab.badge}
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        'mt-1 text-xs font-medium',
                        'transition-all duration-200 ease-out',
                        // Color based on active state
                        isActive
                          ? 'text-pink-500'
                          : 'text-gray-500'
                      )}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default FloatingTabBar;
