/**
 * Advanced iOS Button Component
 * More variants and color options
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface IOSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tinted' | 'bordered' | 'plain';
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  hapticFeedback?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
}

const colorMap = {
  blue: {
    filled: 'bg-[var(--ios-blue)] text-white hover:opacity-90',
    tinted: 'bg-[var(--ios-blue)]/10 text-[var(--ios-blue)] hover:bg-[var(--ios-blue)]/20',
    bordered: 'border-2 border-[var(--ios-blue)] text-[var(--ios-blue)] hover:bg-[var(--ios-blue)]/10',
    plain: 'text-[var(--ios-blue)] hover:bg-[var(--ios-blue)]/10',
  },
  green: {
    filled: 'bg-[var(--ios-green)] text-white hover:opacity-90',
    tinted: 'bg-[var(--ios-green)]/10 text-[var(--ios-green)] hover:bg-[var(--ios-green)]/20',
    bordered: 'border-2 border-[var(--ios-green)] text-[var(--ios-green)] hover:bg-[var(--ios-green)]/10',
    plain: 'text-[var(--ios-green)] hover:bg-[var(--ios-green)]/10',
  },
  red: {
    filled: 'bg-[var(--ios-red)] text-white hover:opacity-90',
    tinted: 'bg-[var(--ios-red)]/10 text-[var(--ios-red)] hover:bg-[var(--ios-red)]/20',
    bordered: 'border-2 border-[var(--ios-red)] text-[var(--ios-red)] hover:bg-[var(--ios-red)]/10',
    plain: 'text-[var(--ios-red)] hover:bg-[var(--ios-red)]/10',
  },
  orange: {
    filled: 'bg-[var(--ios-orange)] text-white hover:opacity-90',
    tinted: 'bg-[var(--ios-orange)]/10 text-[var(--ios-orange)] hover:bg-[var(--ios-orange)]/20',
    bordered: 'border-2 border-[var(--ios-orange)] text-[var(--ios-orange)] hover:bg-[var(--ios-orange)]/10',
    plain: 'text-[var(--ios-orange)] hover:bg-[var(--ios-orange)]/10',
  },
  purple: {
    filled: 'bg-[var(--ios-purple)] text-white hover:opacity-90',
    tinted: 'bg-[var(--ios-purple)]/10 text-[var(--ios-purple)] hover:bg-[var(--ios-purple)]/20',
    bordered: 'border-2 border-[var(--ios-purple)] text-[var(--ios-purple)] hover:bg-[var(--ios-purple)]/10',
    plain: 'text-[var(--ios-purple)] hover:bg-[var(--ios-purple)]/10',
  },
  gray: {
    filled: 'bg-[var(--ios-gray)] text-white hover:opacity-90',
    tinted: 'bg-[var(--ios-fill)] text-[var(--ios-label)] hover:bg-[var(--ios-fill-secondary)]',
    bordered: 'border-2 border-[var(--ios-separator)] text-[var(--ios-label)] hover:bg-[var(--ios-fill)]',
    plain: 'text-[var(--ios-label)] hover:bg-[var(--ios-fill)]',
  },
};

export const IOSButton = React.forwardRef<HTMLButtonElement, IOSButtonProps>(
  (
    {
      className,
      variant = 'filled',
      color = 'blue',
      size = 'md',
      fullWidth = false,
      loading = false,
      hapticFeedback = true,
      startIcon,
      endIcon,
      disabled,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;

      // Haptic feedback on iOS
      if (hapticFeedback) {
        try {
          await Haptics.impact({ style: ImpactStyle.Light });
        } catch (error) {
          // Haptics not available on web
        }
      }

      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2',
          'rounded-xl font-semibold transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          'outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ios-blue)]',

          // Get color/variant combination
          colorMap[color][variant],

          // Size styles
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-5 py-3 text-base': size === 'md',
            'px-6 py-4 text-lg': size === 'lg',
          },

          // Full width
          {
            'w-full': fullWidth,
          },

          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {startIcon && <span className="flex-shrink-0">{startIcon}</span>}
            <span>{children}</span>
            {endIcon && <span className="flex-shrink-0">{endIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

IOSButton.displayName = 'IOSButton';

export default IOSButton;
