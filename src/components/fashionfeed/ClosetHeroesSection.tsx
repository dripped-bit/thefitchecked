/**
 * Closet Heroes Section
 * Highlights most-worn and versatile items from the closet
 */

import React, { useEffect, useState } from 'react';
import { Star, TrendingUp, Award } from 'lucide-react';
import { ClothingItem } from '../../hooks/useCloset';
import aiStyleAnalysisService from '../../services/aiStyleAnalysisService';

interface ClosetHeroesSectionProps {
  items: ClothingItem[];
}

export default function ClosetHeroesSection({ items }: ClosetHeroesSectionProps) {
  const [heroes, setHeroes] = useState<{
    itemId: string;
    timesWorn: number;
    versatilityScore: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length > 0) {
      analyzeHeroes();
    } else {
      setLoading(false);
    }
  }, [items]);

  const analyzeHeroes = async () => {
    setLoading(true);
    
    try {
      const analysis = await aiStyleAnalysisService.analyzeStyle(items);
      setHeroes(analysis.mostWornItems);
    } catch (err) {
      console.error('Error analyzing closet heroes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get actual item from ID
  const getItem = (itemId: string): ClothingItem | undefined => {
    return items.find(i => i.id === itemId);
  };

  // Get badge for versatility score
  const getVersatilityBadge = (score: number) => {
    if (score >= 80) return { text: 'SUPERSTAR', color: 'bg-gradient-to-r from-yellow-400 to-orange-400' };
    if (score >= 60) return { text: 'MVP', color: 'bg-gradient-to-r from-blue-400 to-purple-400' };
    return { text: 'RELIABLE', color: 'bg-gradient-to-r from-green-400 to-teal-400' };
  };

  if (items.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="magazine-box magazine-box-pink">
        <div className="text-center py-8">
          <div className="animate-pulse text-4xl mb-4">⭐</div>
          <p className="handwritten text-xl text-gray-500">
            Finding your closet heroes...
          </p>
        </div>
      </div>
    );
  }

  const validHeroes = heroes
    .map(h => ({ ...h, item: getItem(h.itemId) }))
    .filter(h => h.item !== undefined);

  if (validHeroes.length === 0) {
    return (
      <div className="magazine-box magazine-box-pink">
        <h2 className="text-3xl font-black mb-4 flex items-center gap-3">
          <span>⭐</span>
          <span>CLOSET HEROES</span>
        </h2>
        <div className="speech-bubble">
          <p className="handwritten text-lg text-center">
            "Start wearing your items to discover your closet heroes! 💫"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="magazine-box magazine-box-pink animate-fadeInUp">
      {/* Header */}
      <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
        <span>⭐</span>
        <span>CLOSET HEROES</span>
      </h2>
      <p className="handwritten text-lg mb-4 text-gray-700">
        Your most-worn & versatile pieces
      </p>
      <div className="section-divider">
        <div className="line" />
      </div>

      {/* Heroes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {validHeroes.slice(0, 4).map((hero, index) => {
          const item = hero.item!;
          const badge = getVersatilityBadge(hero.versatilityScore);
          
          return (
            <div 
              key={hero.itemId}
              className="relative bg-white rounded-lg shadow-scrapbook p-4 transition-transform hover:scale-105"
              style={{
                animationDelay: `${index * 150}ms`
              }}
            >
              {/* Rank Badge */}
              <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">
                <span className="text-white font-black text-lg">#{index + 1}</span>
              </div>

              {/* Item Image */}
              <div className="relative mb-3">
                <img
                  src={item.thumbnail_url || item.image_url}
                  alt={item.name}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                
                {/* Versatility Badge */}
                <div className={`absolute top-2 right-2 ${badge.color} text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg`}>
                  {badge.text}
                </div>
              </div>

              {/* Item Info */}
              <h3 className="font-bold text-lg mb-2 truncate">{item.name}</h3>
              
              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-pink-500" />
                  <span className="text-gray-700">
                    Worn <span className="font-bold">{hero.timesWorn}</span> times
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-purple-500" />
                  <span className="text-gray-700">
                    Versatility: <span className="font-bold">{hero.versatilityScore}/100</span>
                  </span>
                </div>

                {item.color && (
                  <div className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-700 capitalize">{item.color}</span>
                  </div>
                )}
              </div>

              {/* Cost Per Wear (if price available) */}
              {item.price && hero.timesWorn > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Cost per wear: <span className="font-bold text-green-600">
                      ${(item.price / hero.timesWorn).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {validHeroes.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border-2 border-pink-200">
          <div className="flex items-start gap-3">
            <Star className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
            <div>
              <p className="handwritten text-lg mb-1">Your Style MVP:</p>
              <p className="text-sm text-gray-700">
                <span className="font-bold">{validHeroes[0].item!.name}</span> is your
                go-to piece! It's versatile, well-loved, and totally worth it.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
