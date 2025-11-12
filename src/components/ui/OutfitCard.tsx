/**
 * Outfit Card Component
 * iOS-style card for displaying outfit items
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface OutfitCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  title: string;
  description?: string;
  weather?: string;
  date?: string;
  liked?: boolean;
  onLike?: () => void;
  hapticFeedback?: boolean;
}

export const OutfitCard = React.forwardRef<HTMLDivElement, OutfitCardProps>(
  (
    {
      className,
      imageUrl,
      title,
      description,
      weather,
      date,
      liked = false,
      onLike,
      hapticFeedback = true,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
      if (hapticFeedback) {
        try {
          await Haptics.impact({ style: ImpactStyle.Light });
        } catch (error) {
          // Haptics not available
        }
      }
      onClick?.(e);
    };

    const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (hapticFeedback) {
        try {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (error) {
          // Haptics not available
        }
      }
      onLike?.();
    };

    return (
      <div
        ref={ref}
        className={cn(
          'group relative overflow-hidden rounded-2xl',
          'bg-[var(--ios-bg-grouped-secondary)] shadow-md',
          'transition-all duration-300',
          'hover:shadow-xl hover:-translate-y-1',
          'cursor-pointer',
          'active:scale-[0.98]',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[var(--ios-gray-6)]">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />

          {/* Like Button */}
          {onLike && (
            <button
              onClick={handleLike}
              className={cn(
                'absolute top-3 right-3',
                'w-9 h-9 rounded-full',
                'backdrop-blur-md bg-white/20 border border-white/30',
                'flex items-center justify-center',
                'transition-all duration-200',
                'hover:bg-white/30 active:scale-90',
                liked && 'bg-[var(--ios-red)]/80 border-[var(--ios-red)]'
              )}
              aria-label={liked ? 'Unlike outfit' : 'Like outfit'}
            >
              <svg
                className={cn(
                  'w-5 h-5 transition-colors',
                  liked ? 'text-white fill-current' : 'text-white'
                )}
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}

          {/* Weather Badge */}
          {weather && (
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full backdrop-blur-md bg-white/20 border border-white/30">
              <span className="text-white text-sm font-medium">{weather}</span>
            </div>
          )}

          {/* Date Badge */}
          {date && (
            <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full backdrop-blur-md bg-black/20 border border-white/20">
              <span className="text-white text-xs font-medium">{date}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="ios-headline text-[var(--ios-label)] mb-1 line-clamp-1">
            {title}
          </h3>
          {description && (
            <p className="ios-subheadline text-[var(--ios-label-secondary)] line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

OutfitCard.displayName = 'OutfitCard';

export default OutfitCard;
