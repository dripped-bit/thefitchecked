/**
 * Unsplash Attribution Component
 * Required for Unsplash API compliance
 * Must display: "Photo by [Photographer Name] on Unsplash" with proper links
 */

import React from 'react';

interface UnsplashAttributionProps {
  photographer: string;
  photographerUrl: string;
  variant?: 'default' | 'overlay' | 'compact';
  className?: string;
}

export default function UnsplashAttribution({
  photographer,
  photographerUrl,
  variant = 'default',
  className = ''
}: UnsplashAttributionProps) {
  const baseClasses = 'text-xs';
  
  const variantClasses = {
    default: 'text-gray-600',
    overlay: 'text-white bg-black/50 px-2 py-1 rounded',
    compact: 'text-gray-500'
  };

  const linkClasses = variant === 'overlay' 
    ? 'text-white hover:text-pink-200 underline font-semibold'
    : 'text-pink-600 hover:underline font-semibold';

  return (
    <p className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      Photo by{' '}
      <a
        href={photographerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClasses}
      >
        {photographer}
      </a>
      {' '}on{' '}
      <a
        href="https://unsplash.com?utm_source=fitchecked&utm_medium=referral"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClasses}
      >
        Unsplash
      </a>
    </p>
  );
}
