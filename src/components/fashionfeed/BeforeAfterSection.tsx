/**
 * Before/After Style Evolution Section
 * Shows style growth and changes over time
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, Calendar, Sparkles, Award } from 'lucide-react';
import { ClothingItem } from '../../hooks/useCloset';
import outfitHistoryService from '../../services/outfitHistoryService';

interface BeforeAfterSectionProps {
  items: ClothingItem[];
}

interface StylePeriod {
  outfits: any[];
  items: ClothingItem[];
  startDate: Date;
  endDate: Date;
  totalWears: number;
  uniqueItems: number;
  dominantColors: string[];
  categories: string[];
}

interface EvolutionStats {
  itemsAdded: number;
  newCategories: string[];
  newColors: string[];
  wearFrequencyChange: number;
  confidenceGrowth: string;
}

export default function BeforeAfterSection({ items }: BeforeAfterSectionProps) {
  const [loading, setLoading] = useState(true);
  const [beforePeriod, setBeforePeriod] = useState<StylePeriod | null>(null);
  const [afterPeriod, setAfterPeriod] = useState<StylePeriod | null>(null);
  const [evolutionStats, setEvolutionStats] = useState<EvolutionStats | null>(null);
  const [timeframe, setTimeframe] = useState<'3months' | '6months' | '1year'>('3months');

  useEffect(() => {
    analyzeStyleEvolution();
  }, [items, timeframe]);

  const analyzeStyleEvolution = async () => {
    setLoading(true);

    try {
      // Get outfit history
      const days = timeframe === '3months' ? 90 : timeframe === '6months' ? 180 : 365;
      const history = await outfitHistoryService.getRecentHistory(days);

      if (!history || history.length < 2) {
        setLoading(false);
        return;
      }

      // Split into before and after periods
      const midpoint = Math.floor(history.length / 2);
      const beforeOutfits = history.slice(midpoint);
      const afterOutfits = history.slice(0, midpoint);

      // Analyze before period
      const before = analyzePeriod(beforeOutfits, items, days);
      const after = analyzePeriod(afterOutfits, items, 0);

      setBeforePeriod(before);
      setAfterPeriod(after);

      // Calculate evolution stats
      const stats = calculateEvolution(before, after);
      setEvolutionStats(stats);

    } catch (error) {
      console.error('Error analyzing style evolution:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzePeriod = (outfits: any[], allItems: ClothingItem[], daysAgo: number): StylePeriod => {
    const now = new Date();
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const endDate = daysAgo === 0 ? now : new Date(now.getTime() - (daysAgo / 2) * 24 * 60 * 60 * 1000);

    // Extract items from outfits
    const itemIds = new Set<string>();
    const colors = new Map<string, number>();
    const categories = new Set<string>();

    outfits.forEach(outfit => {
      if (outfit.outfit_items) {
        outfit.outfit_items.forEach((item: any) => {
          itemIds.add(item.id);
          
          // Track colors
          if (item.color) {
            colors.set(item.color, (colors.get(item.color) || 0) + 1);
          }
          
          // Track categories
          if (item.category) {
            categories.add(item.category);
          }
        });
      }
    });

    // Get top 3 colors
    const sortedColors = Array.from(colors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([color]) => color);

    // Get items from this period
    const periodItems = allItems.filter(item => itemIds.has(item.id));

    return {
      outfits,
      items: periodItems,
      startDate,
      endDate,
      totalWears: outfits.length,
      uniqueItems: itemIds.size,
      dominantColors: sortedColors,
      categories: Array.from(categories)
    };
  };

  const calculateEvolution = (before: StylePeriod, after: StylePeriod): EvolutionStats => {
    // Items added
    const beforeItemIds = new Set(before.items.map(i => i.id));
    const afterItemIds = new Set(after.items.map(i => i.id));
    const newItems = Array.from(afterItemIds).filter(id => !beforeItemIds.has(id));

    // New categories
    const newCategories = after.categories.filter(cat => !before.categories.includes(cat));

    // New colors
    const newColors = after.dominantColors.filter(color => !before.dominantColors.includes(color));

    // Wear frequency change
    const beforeAvgWears = before.totalWears / Math.max(before.uniqueItems, 1);
    const afterAvgWears = after.totalWears / Math.max(after.uniqueItems, 1);
    const wearFrequencyChange = afterAvgWears - beforeAvgWears;

    // Confidence growth (heuristic based on variety and frequency)
    let confidenceGrowth = 'Steady Style';
    if (newCategories.length >= 2 || newColors.length >= 2) {
      confidenceGrowth = 'Exploring New Horizons!';
    } else if (wearFrequencyChange > 0.5) {
      confidenceGrowth = 'More Outfit Variety!';
    } else if (after.uniqueItems > before.uniqueItems) {
      confidenceGrowth = 'Building Your Wardrobe!';
    }

    return {
      itemsAdded: newItems.length,
      newCategories,
      newColors,
      wearFrequencyChange,
      confidenceGrowth
    };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case '3months': return '3 Months';
      case '6months': return '6 Months';
      case '1year': return '1 Year';
    }
  };

  if (loading) {
    return (
      <div className="torn-edge bg-white shadow-scrapbook animate-fadeInUp">
        <div className="washi-tape" />
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-pulse text-4xl mb-4">✨</div>
            <p className="handwritten text-xl text-gray-500">
              Analyzing your style evolution...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!beforePeriod || !afterPeriod || !evolutionStats) {
    return (
      <div className="torn-edge bg-white shadow-scrapbook animate-fadeInUp">
        <div className="washi-tape" />
        <div className="p-6">
          <h2 className="text-3xl font-black mb-4 flex items-center gap-3">
            <span>✨</span>
            <span>YOUR STYLE EVOLUTION</span>
          </h2>
          
          <div className="speech-bubble">
            <p className="handwritten text-lg text-center">
              "Keep tracking your outfits to see your style evolution! 💫"
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              We need at least a few weeks of outfit history
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="torn-edge bg-white shadow-scrapbook animate-fadeInUp">
      <div className="washi-tape" />
      
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <span>✨</span>
            <span className="cutout-text">BEFORE & AFTER</span>
          </h2>
          <p className="handwritten text-lg text-gray-700">
            Your style journey over time
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {(['3months', '6months', '1year'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                timeframe === tf
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tf === '3months' ? '3 Months' : tf === '6months' ? '6 Months' : '1 Year'}
            </button>
          ))}
        </div>

        <div className="section-divider">
          <div className="line" />
        </div>

        {/* Before & After Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* BEFORE */}
          <div className="relative">
            <div className="absolute -top-3 -left-3 z-10">
              <div className="sticker sticker-blue text-sm">
                <span>THEN</span>
              </div>
            </div>

            <div className="magazine-box-blue">
              <div className="mb-4">
                <Calendar className="w-5 h-5 inline mr-2" />
                <span className="font-bold">
                  {formatDate(beforePeriod.startDate)} - {formatDate(beforePeriod.endDate)}
                </span>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Total Outfits</p>
                  <p className="text-2xl font-black">{beforePeriod.totalWears}</p>
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Items Worn</p>
                  <p className="text-2xl font-black">{beforePeriod.uniqueItems}</p>
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-2">Top Colors</p>
                  <div className="flex gap-2">
                    {beforePeriod.dominantColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-md capitalize"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-lg font-bold">{beforePeriod.categories.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AFTER */}
          <div className="relative">
            <div className="absolute -top-3 -right-3 z-10">
              <div className="sticker sticker-pink text-sm">
                <span>NOW</span>
              </div>
            </div>

            <div className="magazine-box-pink">
              <div className="mb-4">
                <Calendar className="w-5 h-5 inline mr-2" />
                <span className="font-bold">
                  {formatDate(afterPeriod.startDate)} - {formatDate(afterPeriod.endDate)}
                </span>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Total Outfits</p>
                  <p className="text-2xl font-black">{afterPeriod.totalWears}</p>
                  {afterPeriod.totalWears > beforePeriod.totalWears && (
                    <p className="text-xs text-green-600 font-bold">
                      +{afterPeriod.totalWears - beforePeriod.totalWears} more!
                    </p>
                  )}
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Items Worn</p>
                  <p className="text-2xl font-black">{afterPeriod.uniqueItems}</p>
                  {afterPeriod.uniqueItems > beforePeriod.uniqueItems && (
                    <p className="text-xs text-green-600 font-bold">
                      +{afterPeriod.uniqueItems - beforePeriod.uniqueItems} more variety!
                    </p>
                  )}
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-2">Top Colors</p>
                  <div className="flex gap-2">
                    {afterPeriod.dominantColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-md capitalize"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-lg font-bold">{afterPeriod.categories.length}</p>
                  {afterPeriod.categories.length > beforePeriod.categories.length && (
                    <p className="text-xs text-green-600 font-bold">
                      +{afterPeriod.categories.length - beforePeriod.categories.length} new!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evolution Insights */}
        <div className="speech-bubble mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-bold text-lg mb-2">{evolutionStats.confidenceGrowth}</p>
              <div className="space-y-1 text-sm">
                {evolutionStats.itemsAdded > 0 && (
                  <p>✨ Added {evolutionStats.itemsAdded} new items to your wardrobe</p>
                )}
                {evolutionStats.newCategories.length > 0 && (
                  <p>🎨 Explored {evolutionStats.newCategories.length} new categories: {evolutionStats.newCategories.join(', ')}</p>
                )}
                {evolutionStats.newColors.length > 0 && (
                  <p>🌈 Discovered {evolutionStats.newColors.length} new colors: {evolutionStats.newColors.join(', ')}</p>
                )}
                {evolutionStats.wearFrequencyChange > 0.5 && (
                  <p>👗 Wearing more variety in your outfits!</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        {(evolutionStats.itemsAdded >= 10 || evolutionStats.newCategories.length >= 3) && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-200">
            <div className="flex items-center justify-center gap-3">
              <Award className="w-6 h-6 text-yellow-600" />
              <p className="font-bold text-lg">
                {evolutionStats.itemsAdded >= 10 && '🏆 Wardrobe Builder!'}
                {evolutionStats.newCategories.length >= 3 && ' 🎨 Style Explorer!'}
              </p>
            </div>
          </div>
        )}

        {/* Growth Summary */}
        <div className="mt-6 text-center">
          <p className="handwritten text-xl text-gray-700">
            "Your style is always evolving! Keep experimenting! 💫"
          </p>
        </div>
      </div>
    </div>
  );
}
