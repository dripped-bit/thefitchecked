/**
 * Style Quiz Results Component
 * Displays personalized style profile with scrapbook aesthetic
 */

import React from 'react';
import { X, Share2 } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Haptics } from '@capacitor/haptics';
import { StyleQuizResult } from '../../services/styleQuizService';

interface StyleQuizResultsProps {
  results: StyleQuizResult;
  onClose: () => void;
  onRetake?: () => void;
}

export default function StyleQuizResults({ results, onClose, onRetake }: StyleQuizResultsProps) {
  const handleShare = async () => {
    try {
      await Share.share({
        title: `I'm a ${results.styleType}!`,
        text: `Just discovered my style personality: ${results.styleType}! ${results.styleDescription}`,
        url: 'https://thefitchecked.com',
        dialogTitle: 'Share Your Style Profile',
      });
      Haptics.impact({ style: 'light' });
    } catch (error) {
      console.log('Share cancelled or unavailable');
    }
  };

  return (
    <div className="quiz-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="quiz-content">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          <div className="font-bold text-gray-700">Your Style Profile</div>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Share2 size={24} />
          </button>
        </div>

        {/* Results Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Style Type Header */}
          <div className="results-header">
            <div className="magazine-headline text-2xl mb-2">
              ✨ YOU'RE A...
            </div>
            <h1 className="results-style-type">
              {results.styleType}
            </h1>
          </div>

          {/* Style Description */}
          <div className="results-vibe-box">
            <p className="handwritten text-xl mb-3 text-gray-700">
              Your Vibe:
            </p>
            <p className="text-gray-700 leading-relaxed">
              "{results.styleDescription}"
            </p>
          </div>

          {/* Personality */}
          <div>
            <h3 className="font-bold text-lg mb-2">YOUR FASHION PERSONALITY:</h3>
            <p className="text-gray-700 bg-white p-4 rounded-lg border-l-4 border-pink-500">
              {results.personality}
            </p>
          </div>

          {/* Color Palette */}
          <div>
            <h3 className="font-bold text-lg mb-3">YOUR PALETTE:</h3>
            <div className="palette-grid">
              {results.recommendedPalette.map((colorItem, idx) => (
                <div key={idx} className="palette-item">
                  <div
                    className="palette-swatch"
                    style={{ background: colorItem.color }}
                  />
                  <p className="text-sm font-medium">{colorItem.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Priorities */}
          {results.priorities && results.priorities.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3">WHAT YOU VALUE:</h3>
              <div className="flex flex-wrap gap-2">
                {results.priorities.map((priority, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-pink-300 rounded-full font-semibold text-sm"
                  >
                    ✨ {priority}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shopping Behavior */}
          <div className="border-t-2 border-dashed border-gray-300 pt-6">
            <h3 className="font-bold text-lg mb-2">YOUR SHOPPING STYLE:</h3>
            <p className="text-gray-700 bg-white p-4 rounded-lg">
              {results.shoppingBehavior}
            </p>
          </div>

          {/* Recommended Brands */}
          {results.recommendedBrands && results.recommendedBrands.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3">BRANDS FOR YOU:</h3>
              <div className="flex flex-wrap gap-2">
                {results.recommendedBrands.map((brand, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium hover:border-pink-400 transition-colors"
                  >
                    {brand}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Styling Tips */}
          {results.stylingTips && results.stylingTips.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3">STYLING TIPS JUST FOR YOU:</h3>
              <div className="tips-grid">
                {results.stylingTips.map((tip, idx) => (
                  <div key={idx} className="tip-card">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="border-t-2 border-dashed border-pink-300 pt-6">
            <h3 className="font-bold text-lg mb-3">✨ WHAT THIS MEANS:</h3>
            <p className="text-gray-700 leading-relaxed bg-gradient-to-br from-pink-50 to-purple-50 p-5 rounded-lg">
              {results.aiInsights}
            </p>
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-4">
            <button
              onClick={onClose}
              className="w-full p-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              🎯 SEE MY PERSONALIZED FEED
            </button>

            {onRetake && (
              <button
                onClick={onRetake}
                className="w-full p-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-pink-400 hover:bg-pink-50 transition-all"
              >
                🔄 Retake Quiz
              </button>
            )}

            <button
              onClick={handleShare}
              className="w-full p-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={18} />
              Share My Style Profile
            </button>
          </div>

          {/* Footer Note */}
          <div className="text-center text-sm text-gray-500 pt-4">
            <p>Your style profile helps personalize your FashionFeed experience! 💕</p>
          </div>
        </div>
      </div>
    </div>
  );
}
