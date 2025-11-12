/**
 * Glass Morphism Card Component
 * iOS-style frosted glass effect
 */

import React from 'react';
import { cn } from '../../utils/cn';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dark' | 'ultra-light';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  children: React.ReactNode;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'light',
      blur = 'lg',
      shadow = 'md',
      radius = 'xl',
      padding = 'md',
      border = true,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base glass effect
          'backdrop-blur-sm backdrop-saturate-150',
          '-webkit-backdrop-filter',
          'transition-all duration-300',

          // Variant (background opacity)
          {
            'bg-white/20': variant === 'ultra-light',
            'bg-white/30': variant === 'light',
            'bg-black/30': variant === 'dark',
          },

          // Blur intensity
          {
            'backdrop-blur-sm': blur === 'sm',
            'backdrop-blur-md': blur === 'md',
            'backdrop-blur-lg': blur === 'lg',
            'backdrop-blur-xl': blur === 'xl',
          },

          // Shadow
          {
            'shadow-none': shadow === 'none',
            'shadow-sm': shadow === 'sm',
            'shadow-md': shadow === 'md',
            'shadow-lg shadow-black/10': shadow === 'lg',
          },

          // Border radius
          {
            'rounded-lg': radius === 'sm',
            'rounded-xl': radius === 'md',
            'rounded-2xl': radius === 'lg',
            'rounded-3xl': radius === 'xl',
            'rounded-[2rem]': radius === '2xl',
          },

          // Padding
          {
            'p-0': padding === 'none',
            'p-3': padding === 'sm',
            'p-4': padding === 'md',
            'p-6': padding === 'lg',
            'p-8': padding === 'xl',
          },

          // Border
          border && 'border border-white/20',

          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
