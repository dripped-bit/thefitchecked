/**
 * AI Spotted Section
 * AI-detected trends and personalized styling recommendations
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { ClothingItem } from '../../hooks/useCloset';
import fashionImageCurationService, { CuratedImage } from '../../services/fashionImageCurationService';
import claudeStyleAnalyzer from '../../services/claudeStyleAnalyzer';
import openaiImageCurator from '../../services/openaiImageCurator';
import { supabase } from '../../services/supabaseClient';
import UnsplashAttribution from './UnsplashAttribution';

interface Trend {
  name: string;
  reason: string;
  stylingTip: string;
  image: CuratedImage | null;
  icon: string;
}

interface AISpottedSectionProps {
  items: ClothingItem[];
}

export default function AISpottedSection({ items }: AISpottedSectionProps) {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);

  useEffect(() => {
    if (items.length > 0) {
      analyzeTrends();
    } else {
      setLoading(false);
    }
  }, [items]);

  const analyzeTrends = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Use Claude to detect personalized trends (includes quiz results now)
      const analysis = await claudeStyleAnalyzer.analyzeForFashionFeed(items, user?.id || '');
      
      console.log('🤖 [CLAUDE] Detected Trends:', analysis.detectedTrends);
      
      // 2. Get personalization context (includes quiz data)
      const context = await fashionImageCurationService.buildPersonalizationContext(items, user?.id || '');
      
      // 3. For each trend, get gender-specific images
      const trendsWithImages = await Promise.all(
        analysis.detectedTrends.map(async (trend) => {
          try {
            // Get candidate images using Claude's gender-aware query
            const candidates = await fashionImageCurationService.searchUnsplash(
              trend.searchQuery,  // Already gender-specific from Claude
              4
            );
            
            // Use OpenAI to pick the best image (with quiz preferences)
            const curated = await openaiImageCurator.curateImages(
              candidates,
              analysis.userGender,
              analysis.stylePersona,
              'trend',
              context.quizStyleType, // NEW: Pass quiz style type
              context.quizPriorities // NEW: Pass quiz priorities
            );
            
            return {
              name: trend.name,
              reason: trend.reason,
              stylingTip: trend.stylingTip,
              image: curated.selectedImages[0] || null,
              icon: trend.icon
            };
          } catch (err) {
            console.error(`Error loading image for trend ${trend.name}:`, err);
            return {
              name: trend.name,
              reason: trend.reason,
              stylingTip: trend.stylingTip,
              image: null,
              icon: trend.icon
            };
          }
        })
      );
      
      console.log(`✨ [OPENAI] Loaded ${trendsWithImages.length} trends with images`);
      
      setTrends(trendsWithImages);
    } catch (err) {
      console.error('Error analyzing trends:', err);
      
      // Fallback to old heuristic method
      try {
        const detected = await inferTrendsFromCloset(items);
        setTrends(detected);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Keep old heuristic method as fallback
  const inferTrendsFromCloset = async (items: ClothingItem[]): Promise<Trend[]> => {
    const trends: Trend[] = [];

    // 1. Color Blocking - if user has 3+ bright colors
    const brightColors = items.filter(i => 
      i.color && !['black', 'white', 'gray', 'grey', 'beige'].includes(i.color.toLowerCase())
    );
    
    if (brightColors.length >= 3) {
      const image = await fashionImageCurationService.getTrendingStyleImages('color blocking', 1);
      trends.push({
        name: 'Color Blocking',
        reason: `You have ${brightColors.length} vibrant pieces - perfect for bold color combos!`,
        stylingTip: 'Pair contrasting colors together. Think pink + orange, or blue + yellow.',
        image: image[0] || null,
        icon: '🎨'
      });
    }

    // 2. Layering - if user has outerwear + basics
    const outerwear = items.filter(i => i.category === 'outerwear');
    const basics = items.filter(i => i.category === 'tops' || i.category === 'bottoms');
    
    if (outerwear.length >= 2 && basics.length >= 5) {
      const image = await fashionImageCurationService.getTrendingStyleImages('layering fashion', 1);
      trends.push({
        name: 'Layering Game',
        reason: 'Your outerwear collection is 🔥 - time to layer up!',
        stylingTip: 'Start with basics, add a jacket, then accessorize. Texture mixing is key!',
        image: image[0] || null,
        icon: '🧥'
      });
    }

    // 3. Minimalist - if user has neutral palette
    const neutrals = items.filter(i => 
      i.color && ['black', 'white', 'gray', 'grey', 'beige', 'navy', 'camel'].includes(i.color.toLowerCase())
    );
    
    if (neutrals.length > items.length * 0.6) {
      const image = await fashionImageCurationService.getTrendingStyleImages('minimalist fashion', 1);
      trends.push({
        name: 'Minimalist Moment',
        reason: 'Your neutral palette screams sophisticated simplicity!',
        stylingTip: 'Less is more. Focus on quality pieces and clean lines.',
        image: image[0] || null,
        icon: '✨'
      });
    }

    // 4. Statement Pieces - if user has dresses or accessories
    const dresses = items.filter(i => i.category === 'dresses');
    const accessories = items.filter(i => i.category === 'accessories');
    
    if (dresses.length >= 3 || accessories.length >= 4) {
      const image = await fashionImageCurationService.getTrendingStyleImages('statement fashion', 1);
      trends.push({
        name: 'Statement Pieces',
        reason: 'You collect show-stoppers - let them shine!',
        stylingTip: 'One statement piece per outfit. Keep everything else simple.',
        image: image[0] || null,
        icon: '💫'
      });
    }

    // If no trends detected, add a general one
    if (trends.length === 0) {
      const image = await fashionImageCurationService.getTrendingStyleImages('effortless style', 1);
      trends.push({
        name: 'Effortless Style',
        reason: 'Your wardrobe is versatile and ready for anything!',
        stylingTip: 'Mix and match freely. Your closet has endless possibilities.',
        image: image[0] || null,
        icon: '🌟'
      });
    }

    return trends.slice(0, 4);
  };

  if (items.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="magazine-box magazine-box-blue animate-fadeInUp">
        <div className="text-center py-12">
          <div className="animate-pulse text-4xl mb-4">🔍</div>
          <p className="handwritten text-xl text-gray-500">
            AI is spotting trends...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="magazine-box magazine-box-blue animate-fadeInUp">
      {/* Header */}
      <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
        <span>🔍</span>
        <span>AI SPOTTED</span>
      </h2>
      <p className="handwritten text-lg mb-4 text-gray-700">
        Trends that work for YOUR closet
      </p>
      <div className="section-divider">
        <div className="line" />
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trends.map((trend, index) => (
          <div
            key={index}
            className="relative h-80 perspective-1000 cursor-pointer"
            onClick={() => {
              setFlippedCard(flippedCard === index ? null : index);
              // Track Unsplash download on card flip (production compliance)
              if (trend.image && trend.image.source === 'unsplash') {
                fashionImageCurationService.triggerUnsplashDownload(trend.image.id, trend.image.downloadLocation);
              }
            }}
            style={{
              animationDelay: `${index * 150}ms`,
              perspective: '1000px'
            }}
          >
            <div
              className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
                flippedCard === index ? 'rotate-y-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: flippedCard === index ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front of Card */}
              <div
                className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden shadow-lg"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {trend.image ? (
                  <div className="relative w-full h-full">
                    <img
                      src={trend.image.url}
                      alt={trend.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    
                    {/* Trend Name */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl font-black text-white mb-2">
                        {trend.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-pink-400" />
                        <span className="text-sm text-pink-200 font-semibold uppercase tracking-wide">
                          Hot Now
                        </span>
                      </div>
                    </div>
                    
                    {/* Icon Badge */}
                    <div className="absolute top-4 right-4 text-4xl">
                      {trend.icon}
                    </div>
                    
                    {/* Tap Indicator */}
                    <div className="absolute top-4 left-4">
                      <div className="sticker sticker-purple text-xs">
                        <span>TAP ME</span>
                      </div>
                    </div>
                    
                    {/* Unsplash Attribution */}
                    {trend.image.source === 'unsplash' && trend.image.photographer && trend.image.photographerUrl && (
                      <div className="absolute bottom-20 left-6 right-6">
                        <UnsplashAttribution
                          photographer={trend.image.photographer}
                          photographerUrl={trend.image.photographerUrl}
                          variant="overlay"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <div className="text-center text-white p-6">
                      <div className="text-6xl mb-4">{trend.icon}</div>
                      <h3 className="text-2xl font-black">{trend.name}</h3>
                    </div>
                  </div>
                )}
              </div>

              {/* Back of Card */}
              <div
                className="absolute w-full h-full backface-hidden rounded-xl bg-white p-6 shadow-lg flex flex-col justify-between"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl">{trend.icon}</span>
                    <h3 className="text-xl font-black">{trend.name}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Why This Works */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-pink-500" />
                        <p className="text-sm font-bold text-gray-700">Why this works for you:</p>
                      </div>
                      <p className="text-gray-600 text-sm pl-6">
                        {trend.reason}
                      </p>
                    </div>
                    
                    {/* Styling Tip */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                        <p className="text-sm font-bold text-gray-700">Styling tip:</p>
                      </div>
                      <p className="text-gray-600 text-sm pl-6">
                        {trend.stylingTip}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tap to Flip Back */}
                <div className="text-center">
                  <p className="text-xs text-gray-400 italic">
                    Tap to flip back
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
        <p className="handwritten text-lg text-center">
          ✨ AI found {trends.length} trend{trends.length !== 1 ? 's' : ''} perfect for your style!
        </p>
      </div>
    </div>
  );
}
