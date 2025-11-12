/**
 * iOS-Style Button Component
 * Follows Apple's Human Interface Guidelines with Liquid Glass effect support
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  hapticFeedback?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      hapticFeedback = true,
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
          'active:scale-[0.98] active:opacity-80',
          'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          // 44pt minimum touch target (Apple HIG requirement)
          'min-h-[44px]',

          // Variant styles
          {
            // Primary (iOS Blue)
            'bg-[var(--ios-blue)] text-white hover:opacity-90 focus-visible:ring-[var(--ios-blue)]':
              variant === 'primary',

            // Secondary (Filled gray)
            'bg-[var(--ios-fill)] text-[var(--ios-label)] hover:bg-[var(--ios-fill-secondary)] focus-visible:ring-[var(--ios-gray)]':
              variant === 'secondary',

            // Destructive (iOS Red)
            'bg-[var(--ios-red)] text-white hover:opacity-90 focus-visible:ring-[var(--ios-red)]':
              variant === 'destructive',

            // Ghost (Transparent with label color)
            'bg-transparent text-[var(--ios-blue)] hover:bg-[var(--ios-fill)] focus-visible:ring-[var(--ios-blue)]':
              variant === 'ghost',

            // Glass (Liquid Glass effect)
            'bg-white/60 backdrop-blur-md backdrop-saturate-180 border border-white/30 text-[var(--ios-label)] hover:bg-white/80 focus-visible:ring-[var(--ios-blue)]':
              variant === 'glass',
          },

          // Size styles
          {
            'px-4 py-2 text-sm min-w-[44px]': size === 'sm',
            'px-5 py-3 text-base min-w-[44px]': size === 'md',
            'px-6 py-4 text-lg min-w-[44px]': size === 'lg',
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
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
