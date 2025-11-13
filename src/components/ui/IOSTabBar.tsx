/**
 * iOS Tab Bar Component
 * Persistent bottom navigation following Apple HIG
 * https://developer.apple.com/design/human-interface-guidelines/tab-bars
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { glassNavClasses } from '../../styles/glassEffects';

export interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  route?: string;
}

export interface IOSTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  hapticFeedback?: boolean;
  className?: string;
}

/**
 * IOSTabBar - Persistent bottom navigation with iOS styling
 *
 * Features:
 * - Glass morphism background
 * - Safe area insets for iPhone notch/home indicator
 * - Haptic feedback on tap
 * - Badge support
 * - Active state indication
 * - 44pt minimum touch targets
 *
 * Usage:
 * <IOSTabBar
 *   tabs={[
 *     { id: 'home', label: 'Home', icon: <Home />, badge: 3 },
 *     { id: 'closet', label: 'Closet', icon: <Shirt /> }
 *   ]}
 *   activeTab={currentTab}
 *   onTabChange={setCurrentTab}
 * />
 */
export const IOSTabBar: React.FC<IOSTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
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

  return (
    <nav
      className={cn(
        // Fixed positioning
        'fixed bottom-0 left-0 right-0 z-50',
        // Safe area for iPhone home indicator - proper iOS bottom padding
        'pb-[env(safe-area-inset-bottom)]',
        'px-safe',
        // Smooth transition
        'transition-all duration-300 ease-out',
        className
      )}
      style={{
        // iOS 18 Liquid Glass effect
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        background: 'rgba(255, 255, 255, 0.80)',
        // Subtle border and shadow for depth
        borderTop: '0.5px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 -1px 3px 0 rgba(0, 0, 0, 0.03), 0 -1px 10px 0 rgba(0, 0, 0, 0.02), 0 -4px 16px 0 rgba(0, 0, 0, 0.01)'
      }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-[49px] gap-4 px-3">
        {displayTabs.map((tab, index) => {
          const isActive = tab.id === activeTab;

          return (
            <React.Fragment key={tab.id}>
              <button
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  // Base styles
                  'relative flex flex-col items-center justify-center',
                  // 44pt minimum touch target (HIG requirement)
                  'min-w-[44px] min-h-[44px]',
                  // Flex to fill space evenly
                  'flex-1',
                  // Smooth transitions for all properties
                  'transition-all duration-200 ease-out',
                  // Active pill background
                  isActive && 'bg-gray-100/80',
                  // Rounded pill shape for active state
                  'rounded-full',
                  // Hover state for inactive tabs
                  !isActive && 'hover:bg-gray-50/50',
                  // Active state - subtle scale
                  'active:scale-95',
                  // Focus styles for accessibility
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2'
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
                  // Icon size - slightly larger for modern iOS
                  'w-[26px] h-[26px]',
                  // Color based on active state - iOS blue for active
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600'
                )}
                style={{
                  // Smooth transform on active
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
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
                  'mt-1 text-[10px] font-medium tracking-tight',
                  'transition-all duration-200 ease-out',
                  // Color based on active state
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600'
                )}
                style={{
                  // Slightly bolder when active
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {tab.label}
              </span>
              </button>
              
              {/* Subtle glass divider between tabs (not after last tab) */}
              {index < displayTabs.length - 1 && (
                <div
                  className="h-8 w-px transition-opacity duration-200"
                  style={{
                    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.06) 50%, rgba(0, 0, 0, 0) 100%)',
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                    opacity: 0.5,
                  }}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

export default IOSTabBar;
