/**
 * iOS-Style Input Component
 * Follows Apple's Human Interface Guidelines
 */

import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('flex flex-col gap-2', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label className="ios-subheadline text-[var(--ios-label-secondary)] font-medium">
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ios-label-tertiary)]">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            type={type}
            className={cn(
              // Base styles
              'w-full px-4 py-3 rounded-xl',
              'ios-body text-[var(--ios-label)]',
              'bg-[var(--ios-fill)] border border-[var(--ios-separator)]',
              'transition-all duration-150 outline-none',

              // Focus styles
              'focus:bg-[var(--ios-bg-primary)] focus:border-[var(--ios-blue)]',
              'focus:ring-2 focus:ring-[var(--ios-blue)] focus:ring-opacity-20',

              // Placeholder
              'placeholder:text-[var(--ios-label-tertiary)]',

              // Disabled state
              'disabled:opacity-50 disabled:cursor-not-allowed',

              // Error state
              error && 'border-[var(--ios-red)] focus:border-[var(--ios-red)] focus:ring-[var(--ios-red)]',

              // Icon padding
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',

              className
            )}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : undefined}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ios-label-tertiary)]">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${props.id}-error`}
            className="ios-caption-1 text-[var(--ios-red)] flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
