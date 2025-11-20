/**
 * Vibe Photo Gallery
 * Early 2000s scrapbook-style photo display for daily vibes
 */

import React from 'react';
import { X } from 'lucide-react';

export interface VibePhoto {
  id: string;
  url: string;
  rotation: number; // -5 to 5 degrees for scrapbook effect
  stickerStyle: 'polaroid' | 'torn' | 'cutout' | 'tape';
}

interface VibePhotoGalleryProps {
  photos: VibePhoto[];
  onRemovePhoto: (photoId: string) => void;
}

export default function VibePhotoGallery({ photos, onRemovePhoto }: VibePhotoGalleryProps) {
  if (photos.length === 0) {
    return null;
  }

  // Random sticker emojis for cutout style
  const stickerEmojis = ['💕', '✨', '🌸', '💫', '🦋', '🌈', '⭐', '💖'];

  return (
    <div className="vibe-photos-grid mt-4">
      {photos.map((photo, idx) => {
        const randomSticker = stickerEmojis[Math.floor(Math.random() * stickerEmojis.length)];
        
        return (
          <div
            key={photo.id}
            className="vibe-photo-item"
            style={{
              transform: `rotate(${photo.rotation}deg)`,
              animationDelay: `${idx * 100}ms`
            }}
          >
            {/* Polaroid Style */}
            {photo.stickerStyle === 'polaroid' && (
              <div className="polaroid-frame relative">
                <img 
                  src={photo.url} 
                  alt="Vibe photo" 
                  className="w-full aspect-square object-cover"
                />
                <button 
                  onClick={() => onRemovePhoto(photo.id)}
                  className="delete-photo-btn"
                  aria-label="Delete photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Cutout Style with Random Sticker */}
            {photo.stickerStyle === 'cutout' && (
              <div className="cutout-photo relative">
                <img 
                  src={photo.url} 
                  alt="Vibe photo"
                  className="w-full aspect-square object-cover"
                />
                {/* Random sticker overlay */}
                <div className="sticker sticker-pink absolute -top-2 -right-2 text-2xl">
                  {randomSticker}
                </div>
                <button 
                  onClick={() => onRemovePhoto(photo.id)}
                  className="delete-photo-btn"
                  aria-label="Delete photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Torn Edge Style */}
            {photo.stickerStyle === 'torn' && (
              <div className="torn-edge-photo relative">
                <img 
                  src={photo.url} 
                  alt="Vibe photo"
                  className="w-full aspect-square object-cover"
                />
                {/* Washi tape effect */}
                <div className="washi-tape absolute top-0 left-0 right-0" />
                <button 
                  onClick={() => onRemovePhoto(photo.id)}
                  className="delete-photo-btn"
                  aria-label="Delete photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Tape Style */}
            {photo.stickerStyle === 'tape' && (
              <div className="photo-with-tape relative">
                <img 
                  src={photo.url} 
                  alt="Vibe photo"
                  className="w-full aspect-square object-cover rounded-lg shadow-lg"
                />
                <button 
                  onClick={() => onRemovePhoto(photo.id)}
                  className="delete-photo-btn"
                  aria-label="Delete photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
