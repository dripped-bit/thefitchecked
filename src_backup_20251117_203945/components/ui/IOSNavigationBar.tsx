/**
 * iOS Navigation Bar Component
 * Standard top navigation with large titles following Apple HIG
 * https://developer.apple.com/design/human-interface-guidelines/navigation-bars
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { glassNavClasses } from '../../styles/glassEffects';

export interface IOSNavigationBarProps {
  title: string;
  subtitle?: string;
  large?: boolean;
  transparent?: boolean;
  leftItems?: React.ReactNode;
  rightItems?: React.ReactNode;
  onScroll?: (scrollY: number) => void;
  scrollThreshold?: number;
  className?: string;
}

/**
 * IOSNavigationBar - Standard top navigation with iOS styling
 *
 * Features:
 * - Large title support (34px bold)
 * - Title collapse on scroll
 * - Glass morphism background
 * - Safe area top padding
 * - Left/right action items
 * - Smooth transitions
 *
 * Usage:
 * <IOSNavigationBar
 *   title="My Outfits"
 *   subtitle="342 items"
 *   large={true}
 *   leftItems={<BackButton />}
 *   rightItems={<SettingsButton />}
 *   onScroll={handleScroll}
 * />
 */
export const IOSNavigationBar: React.FC<IOSNavigationBarProps> = ({
  title,
  subtitle,
  large = true,
  transparent = false,
  leftItems,
  rightItems,
  onScroll,
  scrollThreshold = 60,
  className
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!large || !onScroll) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const shouldCollapse = scrollY > scrollThreshold;

      if (shouldCollapse !== isScrolled) {
        setIsScrolled(shouldCollapse);
      }

      onScroll?.(scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [large, onScroll, scrollThreshold, isScrolled]);

  const showLargeTitle = large && !isScrolled;

  return (
    <nav
      ref={navRef}
      className={cn(
        // Fixed positioning
        'sticky top-0 z-40',
        // Glass effect (unless transparent)
        !transparent && glassNavClasses.light,
        !transparent && 'border-b',
        // Safe area for iPhone notch
        'pt-safe',
        'px-safe',
        // Smooth transitions
        'transition-all duration-300',
        className
      )}
      style={
        !transparent
          ? {
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)'
            }
          : undefined
      }
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Standard Navigation Bar (always visible) */}
      <div className="flex items-center justify-between h-[44px] px-4">
        {/* Left Items */}
        <div className="flex items-center gap-2 min-w-[44px]">
          {leftItems}
        </div>

        {/* Center Title (visible when large title is collapsed or not in large mode) */}
        <div
          className={cn(
            'flex-1 text-center transition-opacity duration-300',
            showLargeTitle ? 'opacity-0' : 'opacity-100'
          )}
        >
          <h1 className="ios-headline font-semibold truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="ios-caption-1 text-[var(--ios-label-secondary)] truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right Items */}
        <div className="flex items-center gap-2 min-w-[44px] justify-end">
          {rightItems}
        </div>
      </div>

      {/* Large Title (collapses on scroll) */}
      {large && (
        <div
          className={cn(
            'px-4 overflow-hidden transition-all duration-300',
            showLargeTitle ? 'max-h-[52px] pb-2' : 'max-h-0'
          )}
        >
          <h1 className="ios-large-title font-bold truncate">
            {title}
          </h1>
          {subtitle && showLargeTitle && (
            <p className="ios-subheadline text-[var(--ios-label-secondary)] truncate mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </nav>
  );
};

/**
 * IOSBackButton - Standard iOS back button with chevron
 */
export interface IOSBackButtonProps {
  label?: string;
  onClick: () => void;
  className?: string;
}

export const IOSBackButton: React.FC<IOSBackButtonProps> = ({
  label = 'Back',
  onClick,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styles
        'flex items-center gap-1',
        // 44pt touch target
        'min-h-[44px] min-w-[44px]',
        // iOS blue color
        'text-[var(--ios-blue)]',
        // Hover state
        'hover:opacity-70',
        // Active state
        'active:opacity-50',
        // Transition
        'transition-opacity duration-150',
        // Focus
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ios-blue)] focus-visible:ring-offset-2 rounded-lg',
        className
      )}
      aria-label={label}
    >
      {/* iOS Chevron */}
      <svg
        width="13"
        height="21"
        viewBox="0 0 13 21"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <path
          d="M11 2L2 10.5L11 19"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="ios-body">{label}</span>
    </button>
  );
};

/**
 * IOSNavButton - Standard navigation bar button (for right side actions)
 */
export interface IOSNavButtonProps {
  icon?: React.ReactNode;
  label?: string;
  onClick: () => void;
  primary?: boolean;
  className?: string;
}

export const IOSNavButton: React.FC<IOSNavButtonProps> = ({
  icon,
  label,
  onClick,
  primary = false,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styles
        'flex items-center justify-center gap-1',
        // 44pt touch target
        'min-h-[44px] min-w-[44px]',
        // Padding
        label && 'px-3',
        // Color
        primary
          ? 'text-[var(--ios-blue)] font-semibold'
          : 'text-[var(--ios-blue)]',
        // Hover state
        'hover:opacity-70',
        // Active state
        'active:opacity-50',
        // Transition
        'transition-opacity duration-150',
        // Focus
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ios-blue)] focus-visible:ring-offset-2 rounded-lg',
        className
      )}
      aria-label={label || 'Action'}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {label && <span className="ios-body">{label}</span>}
    </button>
  );
};

export default IOSNavigationBar;
