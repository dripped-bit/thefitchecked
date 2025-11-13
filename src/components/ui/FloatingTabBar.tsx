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
        // Fixed positioning
        'fixed bottom-0 left-0 right-0 z-50',
        // iOS 18 Liquid Glass floating effect
        'bg-white/70 backdrop-blur-xl',
        // Subtle border and shadow for floating depth
        'border-t border-white/20',
        'shadow-[0_-4px_16px_rgba(0,0,0,0.1)]',
        // Safe area for iPhone home indicator
        'pb-[env(safe-area-inset-bottom)]',
        'px-safe',
        // Smooth transition
        'transition-all duration-300 ease-out',
        className
      )}
      style={{
        // iOS Safari requires WebKit prefix for backdrop-filter
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        backdropFilter: 'blur(24px) saturate(180%)',
      }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around py-2 px-2">
        {groupedTabs.map((group, groupIndex) => (
          <React.Fragment key={`group-${groupIndex}`}>
            {/* Tab Group */}
            <div className="flex items-center justify-center gap-2">
              {group.map((tab) => {
                const isActive = tab.id === activeTab;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      // Base styles - minimal, floating on glass
                      'flex flex-col items-center justify-center',
                      // 44pt minimum touch target (HIG requirement)
                      'min-w-[60px] py-1',
                      // Smooth transitions
                      'transition-all duration-200 ease-out',
                      // Active state - subtle scale up
                      isActive && 'scale-110',
                      // Press feedback
                      'active:scale-95',
                      // Focus styles for accessibility
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50 focus-visible:ring-offset-2'
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
                        // Icon size
                        'w-6 h-6',
                        // Color based on active state - pink for active
                        isActive
                          ? 'text-pink-500'
                          : 'text-gray-600'
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

            {/* Divider between groups */}
            {groupingStyle !== 'none' && groupIndex < groupedTabs.length - 1 && (
              <div className="h-8 w-px bg-gray-300/30" aria-hidden="true" />
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default FloatingTabBar;
