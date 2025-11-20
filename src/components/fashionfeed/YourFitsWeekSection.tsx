/**
 * Your Fits This Week Section
 * Timeline of recently worn outfits
 */

import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import outfitHistoryService, { OutfitHistoryRecord } from '../../services/outfitHistoryService';

interface DayOutfit {
  date: Date;
  dayName: string;
  outfit: OutfitHistoryRecord | null;
  image: string | null;
}

export default function YourFitsWeekSection() {
  const [weekOutfits, setWeekOutfits] = useState<DayOutfit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeekOutfits();
  }, []);

  const loadWeekOutfits = async () => {
    setLoading(true);
    
    try {
      // Get outfit history from last 7 days
      const history = await outfitHistoryService.getRecentHistory(7);
      
      // Create array for last 7 days
      const days: DayOutfit[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Find outfit for this day
        const outfit = history.find(h => {
          const historyDate = new Date(h.worn_date);
          const historyDateStr = historyDate.toISOString().split('T')[0];
          return historyDateStr === dateStr;
        }) || null;
        
        // Get outfit image from calendar if available
        let image: string | null = null;
        if (outfit) {
          image = await outfitHistoryService.getOutfitImage(dateStr);
        }
        
        days.push({
          date,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          outfit,
          image
        });
      }
      
      setWeekOutfits(days);
    } catch (err) {
      console.error('Error loading week outfits:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="torn-edge bg-white shadow-scrapbook animate-fadeInUp">
        <div className="washi-tape" />
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-pulse text-4xl mb-4">📅</div>
            <p className="handwritten text-xl text-gray-500">
              Loading your fits...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const outfitCount = weekOutfits.filter(d => d.outfit).length;

  return (
    <div className="torn-edge bg-white shadow-scrapbook animate-fadeInUp">
      <div className="washi-tape" />
      
      <div className="p-6">
        {/* Header */}
        <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
          <span>📅</span>
          <span>YOUR FITS THIS WEEK</span>
        </h2>
        <p className="handwritten text-lg mb-4 text-gray-700">
          What you wore, all in one place
        </p>
        <div className="section-divider">
          <div className="line" />
        </div>

        {/* Timeline - Horizontal Scroll */}
        <div className="overflow-x-auto pb-4 mb-6 -mx-6 px-6">
          <div className="flex gap-4 min-w-max">
            {weekOutfits.map((day, index) => (
              <div
                key={index}
                className="flex flex-col items-center min-w-[140px]"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Day Label */}
                <div className="mb-3 text-center">
                  <p className="text-sm font-bold text-gray-800">
                    {day.dayName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>

                {/* Outfit Card */}
                {day.image ? (
                  <div className="polaroid-frame">
                    <img
                      src={day.image}
                      alt={`Outfit for ${day.dayName}`}
                      className="w-full aspect-[3/4] object-cover rounded"
                    />
                    {day.outfit && (
                      <div className="text-center mt-2">
                        <p className="text-xs font-medium text-gray-600 truncate px-1">
                          {day.outfit.event_type || 'Casual'}
                        </p>
                        {day.outfit.user_rating && (
                          <div className="flex justify-center gap-0.5 mt-1">
                            {Array.from({ length: day.outfit.user_rating }).map((_, i) => (
                              <span key={i} className="text-yellow-400 text-xs">⭐</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 bg-gray-50">
                    <Calendar className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-xs text-gray-400 text-center">
                      No fit<br />logged
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Week Summary */}
        <div className="space-y-4">
          {outfitCount > 0 ? (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-800">
                    Week Recap
                  </h3>
                </div>
                <p className="handwritten text-xl text-gray-700">
                  You logged {outfitCount} fit{outfitCount !== 1 ? 's' : ''} this week! 
                  {outfitCount >= 5 ? ' 🔥 On fire!' : outfitCount >= 3 ? ' 💪 Keep it up!' : ' ✨ Great start!'}
                </p>
              </div>

              {/* Cost Per Wear (if available) */}
              {weekOutfits.some(d => d.outfit?.outfit_items?.length) && (
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <p className="text-sm text-gray-700">
                    <strong>Smart spending:</strong> Every wear brings down your cost-per-wear!
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="speech-bubble">
              <p className="handwritten text-lg text-center">
                "Start logging your outfits to see your week at a glance! 📸"
              </p>
              <p className="text-center text-sm text-gray-500 mt-2">
                Use Weather Picks or Wore This Today to track your fits
              </p>
            </div>
          )}
        </div>

        {/* Motivation */}
        {outfitCount > 0 && outfitCount < 7 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 italic">
              Log {7 - outfitCount} more to complete the week! 🎯
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
