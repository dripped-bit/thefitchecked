/**
 * Color Story Section
 * Analyzes and displays user's color palette with AI-curated inspiration
 */

import React, { useEffect, useState } from 'react';
import { ClothingItem } from '../../hooks/useCloset';
import aiStyleAnalysisService from '../../services/aiStyleAnalysisService';
import fashionImageCurationService, { CuratedImage } from '../../services/fashionImageCurationService';
import UnsplashAttribution from './UnsplashAttribution';
import { supabase } from '../../services/supabaseClient';
import WeeklyChallengeCard from './WeeklyChallengeCard';

interface ColorStorySectionProps {
  items: ClothingItem[];
}

export default function ColorStorySection({ items }: ColorStorySectionProps) {
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [suggestedColors, setSuggestedColors] = useState<string[]>([]);
  const [colorSuggestions, setColorSuggestions] = useState<string[]>([]);
  const [inspirationImages, setInspirationImages] = useState<CuratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length > 0) {
      analyzeColors();
    } else {
      setLoading(false);
    }
  }, [items]);

  const analyzeColors = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Analyze user's color palette
      const analysis = await aiStyleAnalysisService.analyzeStyle(items);
      setDominantColors(analysis.colorPalette.primary);
      setSuggestedColors(analysis.colorPalette.missing);
      setColorSuggestions(analysis.colorPalette.suggestions);

      // Get PERSONALIZED inspiration images based on user's complete profile
      if (analysis.colorPalette.missing.length > 0) {
        const images = await fashionImageCurationService.getPersonalizedColorInspiration(
          items,
          user?.id || '',
          analysis.colorPalette.missing[0],
          4
        );
        setInspirationImages(images);
        
        // Track Unsplash downloads when images load (production compliance)
        images.forEach(img => {
          if (img.source === 'unsplash') {
            fashionImageCurationService.triggerUnsplashDownload(img.id, img.downloadLocation);
          }
        });
      }
    } catch (err) {
      console.error('Error analyzing colors:', err);
      setError('Could not load color analysis');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="torn-edge bg-white shadow-scrapbook">
        <div className="washi-tape" />
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-pulse text-4xl mb-4">🎨</div>
            <p className="handwritten text-xl text-gray-500">
              Analyzing your color palette...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="torn-edge bg-white shadow-scrapbook">
        <div className="washi-tape" />
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Helper to get color display value
  const getColorValue = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#808080',
      'grey': '#808080',
      'navy': '#001F3F',
      'blue': '#0074D9',
      'red': '#FF4136',
      'pink': '#FFB6C1',
      'green': '#2ECC40',
      'olive': '#3D9970',
      'yellow': '#FFDC00',
      'orange': '#FF851B',
      'purple': '#B10DC9',
      'brown': '#8B4513',
      'beige': '#F5F5DC',
      'tan': '#D2B48C',
      'camel': '#C19A6B',
      'cream': '#FFFDD0',
      'denim': '#1560BD',
    };

    const normalized = colorName.toLowerCase().trim();
    return colorMap[normalized] || '#CCCCCC';
  };

  return (
    <div className="torn-edge bg-white shadow-scrapbook rounded-lg overflow-hidden animate-fadeInUp">
      {/* Washi Tape Decoration */}
      <div className="washi-tape" />

      <div className="p-6">
        {/* Magazine Header */}
        <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
          <span>🎨</span>
          <span>YOUR COLOR STORY</span>
        </h2>
        <div className="section-divider">
          <div className="line" />
        </div>

        {/* Weekly Challenge Card */}
        <WeeklyChallengeCard />

        {/* Your Colors */}
        {dominantColors.length > 0 && (
          <div className="mb-6">
            <p className="handwritten text-xl mb-3">You LOVE:</p>
            <div className="flex flex-wrap gap-3 mb-2">
              {dominantColors.slice(0, 6).map((color, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-16 h-16 rounded-lg shadow-md border-2 border-black transition-transform hover:scale-110"
                    style={{ backgroundColor: getColorValue(color) }}
                    title={color}
                  />
                  <p className="text-xs mt-1 capitalize font-medium">{color}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your Items Mood Board */}
        {items.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {items.slice(0, 6).map((item, index) => (
              <div 
                key={item.id} 
                className="polaroid-frame" 
                style={{ 
                  '--rotate': `${(Math.random() * 6 - 3)}deg`,
                  animationDelay: `${index * 100}ms`
                } as React.CSSProperties}
              >
                <img
                  src={item.thumbnail_url || item.image_url}
                  alt={item.name}
                  className="w-full aspect-square object-cover rounded"
                />
                <p className="text-center text-xs mt-2 truncate px-1">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Suggested Colors */}
        {suggestedColors.length > 0 && (
          <div className="mb-4">
            <div className="sticker inline-flex mb-3">
              <span>⭐</span>
              <span>TRY THIS: {suggestedColors.join(' & ').toUpperCase()}!</span>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-4">
              {suggestedColors.map((color, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-16 h-16 rounded-lg shadow-md border-2 border-pink-400 transition-transform hover:scale-110"
                    style={{ backgroundColor: getColorValue(color) }}
                    title={color}
                  />
                  <p className="text-xs mt-1 capitalize font-medium">{color}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inspiration Images */}
        {inspirationImages.length > 0 && (
          <div className="mb-4">
            <p className="handwritten text-lg mb-3">Inspo for you:</p>
            <div className="grid grid-cols-2 gap-4">
              {inspirationImages.map((img) => (
                <div key={img.id} className="space-y-2">
                  <img
                    src={img.url}
                    alt="Style inspiration"
                    className="w-full aspect-[3/4] object-cover rounded-lg shadow-lg transition-transform hover:scale-105"
                  />
                  {/* Always visible attribution (Unsplash compliance) */}
                  {img.source === 'unsplash' && img.photographer && img.photographerUrl && (
                    <UnsplashAttribution
                      photographer={img.photographer}
                      photographerUrl={img.photographerUrl}
                      variant="compact"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Commentary */}
        {colorSuggestions.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <p className="handwritten text-lg">
              "{colorSuggestions[0]} ✨"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
