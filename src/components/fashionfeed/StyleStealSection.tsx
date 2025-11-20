/**
 * Style Steal Section
 * Curated outfit inspiration from fashion images
 */

import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { ClothingItem } from '../../hooks/useCloset';
import fashionImageCurationService, { CuratedImage } from '../../services/fashionImageCurationService';
import claudeStyleAnalyzer from '../../services/claudeStyleAnalyzer';
import openaiImageCurator from '../../services/openaiImageCurator';
import { supabase } from '../../services/supabaseClient';

interface StyleStealSectionProps {
  items: ClothingItem[];
}

export default function StyleStealSection({ items }: StyleStealSectionProps) {
  const [images, setImages] = useState<CuratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<CuratedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [styleTips, setStyleTips] = useState<string[]>([]);

  useEffect(() => {
    if (items.length > 0) {
      loadStyleStealImages();
    } else {
      setLoading(false);
    }
  }, [items]);

  const loadStyleStealImages = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Use Claude to analyze user's complete profile (includes quiz results now)
      const analysis = await claudeStyleAnalyzer.analyzeForFashionFeed(items, user?.id || '');
      
      console.log('🤖 [CLAUDE] Style Steal Queries:', analysis.styleStealQueries);
      
      // 2. Get personalization context (includes quiz data)
      const context = await fashionImageCurationService.buildPersonalizationContext(items, user?.id || '');
      
      // 3. Search Unsplash with SHUFFLED queries for variety
      const allImages: CuratedImage[] = [];
      
      // Shuffle queries to get different results each time
      const shuffledQueries = [...analysis.styleStealQueries]
        .sort(() => Math.random() - 0.5);
      
      for (const query of shuffledQueries) {
        // Use random page (1-3) for variety on each refresh
        const randomPage = Math.floor(Math.random() * 3) + 1;
        const imgs = await fashionImageCurationService.searchUnsplash(query, 3, randomPage);
        allImages.push(...imgs);
      }
      
      console.log(`📸 [UNSPLASH] Found ${allImages.length} candidate images`);
      
      // 4. Use OpenAI to curate and rank images (with quiz preferences)
      const curated = await openaiImageCurator.curateImages(
        allImages,
        analysis.userGender,
        analysis.stylePersona,
        'style-steal',
        context.quizStyleType,
        context.quizPriorities
      );
      
      console.log(`✨ [OPENAI] Selected ${curated.selectedImages.length} images`);
      
      setImages(curated.selectedImages);
      setStyleTips(analysis.styleStealTips);
      
    } catch (err) {
      console.error('Error loading style steal:', err);
      
      // Fallback to old method if AI fails
      try {
        const imgs = await fashionImageCurationService.getStyleStealImages(items, 6);
        setImages(imgs);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStyleStealImages();
    setRefreshing(false);
  };

  if (items.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="magazine-box animate-fadeInUp">
        <div className="text-center py-12">
          <div className="animate-pulse text-4xl mb-4">📸</div>
          <p className="handwritten text-xl text-gray-500">
            Curating outfit inspo for you...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="magazine-box animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
            <span>📸</span>
            <span>STYLE STEAL</span>
          </h2>
          <p className="handwritten text-lg text-gray-700">
            Outfit inspo just for you
          </p>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-semibold">Refresh</span>
        </button>
      </div>

      <div className="section-divider">
        <div className="line" />
      </div>

      {images.length === 0 ? (
        <div className="speech-bubble">
          <p className="handwritten text-lg text-center">
            "Upload more items to get personalized style inspiration! ✨"
          </p>
        </div>
      ) : (
        <>
          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {images.map((img, index) => (
              <div
                key={img.id}
                className="relative group cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
                onClick={() => {
                  setSelectedImage(img);
                  // Track Unsplash download on image click (production compliance)
                  if (img.source === 'unsplash') {
                    fashionImageCurationService.triggerUnsplashDownload(img.id, img.downloadLocation);
                  }
                }}
              >
                {/* Image with Polaroid Frame */}
                <div className="polaroid-frame hover:scale-105 transition-transform">
                  <img
                    src={img.thumbnail}
                    alt="Style inspiration"
                    className="w-full aspect-[3/4] object-cover rounded"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="sticker">
                        <span>STEAL THIS!</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photographer Credit */}
                <p className="text-xs text-center text-gray-500 mt-2">
                  by {img.photographer}
                </p>
              </div>
            ))}
          </div>

          {/* Styling Tip */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border-2 border-pink-200">
            <p className="handwritten text-lg">
              💡 Tap any image to see how to recreate the look with your closet!
            </p>
          </div>
        </>
      )}

      {/* Modal for Expanded View */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Style Breakdown</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Image */}
            <div className="p-6">
              <img
                src={selectedImage.url}
                alt="Style inspiration"
                className="w-full rounded-lg shadow-lg mb-4"
              />

              {/* Photo Attribution */}
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Photo by{' '}
                  <a
                    href={selectedImage.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:underline font-semibold"
                  >
                    {selectedImage.photographer}
                  </a>
                  {' '}on Unsplash
                </p>
              </div>

              {/* Styling Tips */}
              <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span>💡</span>
                  <span>How to Recreate This Look:</span>
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold">1.</span>
                    <p className="text-gray-700">
                      <strong>Match the color palette</strong> - Look for similar tones in your closet
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold">2.</span>
                    <p className="text-gray-700">
                      <strong>Pay attention to proportions</strong> - Oversized top? Fitted bottom, or vice versa
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold">3.</span>
                    <p className="text-gray-700">
                      <strong>Accessorize thoughtfully</strong> - Small details make the outfit
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-pink-500 font-bold">4.</span>
                    <p className="text-gray-700">
                      <strong>Adapt to your style</strong> - Make it yours with your favorite pieces
                    </p>
                  </li>
                </ul>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="w-full mt-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-shadow"
              >
                Got It! ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
