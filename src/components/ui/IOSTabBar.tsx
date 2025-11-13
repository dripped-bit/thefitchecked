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
        // Safe area for iPhone home indicator
        'pb-safe',
        'px-safe',
        // Smooth transition
        'transition-all duration-300',
        className
      )}
      style={{
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        background: 'rgba(255, 255, 255, 0.72)',
        borderTop: '0.5px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 -0.5px 0 0 rgba(0, 0, 0, 0.04), 0 -1px 8px 0 rgba(0, 0, 0, 0.02)'
      }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-[49px] gap-3 px-2">
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
                  // Transition
                  'transition-all duration-200',
                  // Active state
                  'active:scale-95',
                  // Focus styles
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ios-blue)] focus-visible:ring-offset-2'
                )}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
              >
              {/* Icon Container */}
              <div
                className={cn(
                  'relative flex items-center justify-center',
                  'transition-all duration-200',
                  // Icon size
                  'w-6 h-6',
                  // Color based on active state
                  isActive
                    ? 'text-[#007AFF]'
                    : 'text-[#8E8E93]'
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
                  'mt-0.5 text-[10px] font-medium',
                  'transition-all duration-200',
                  // Color based on active state
                  isActive
                    ? 'text-[#007AFF]'
                    : 'text-[#8E8E93]'
                )}
              >
                {tab.label}
              </span>
              </button>
              
              {/* Glass divider between tabs (not after last tab) */}
              {index < displayTabs.length - 1 && (
                <div
                  className="h-8 w-px"
                  style={{
                    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.08) 50%, rgba(0, 0, 0, 0) 100%)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
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
