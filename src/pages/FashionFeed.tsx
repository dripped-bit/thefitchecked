/**
 * FashionFeed - Digital Style Scrapbook
 * Magazine-inspired personal style journal with AI-curated imagery
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Settings, Camera, Share2 } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useCloset } from '../hooks/useCloset';
import ColorStorySection from '../components/fashionfeed/ColorStorySection';
import ClosetHeroesSection from '../components/fashionfeed/ClosetHeroesSection';
import WeeklyChallengeSection from '../components/fashionfeed/WeeklyChallengeSection';
import StyleStealSection from '../components/fashionfeed/StyleStealSection';
import AISpottedSection from '../components/fashionfeed/AISpottedSection';
import YourFitsWeekSection from '../components/fashionfeed/YourFitsWeekSection';
import ShoppingBoardSection from '../components/fashionfeed/ShoppingBoardSection';
import BeforeAfterSection from '../components/fashionfeed/BeforeAfterSection';
import haptics from '../utils/haptics';
import '../styles/scrapbook.css';

interface FashionFeedProps {
  onBack: () => void;
}

export default function FashionFeed({ onBack }: FashionFeedProps) {
  const { items, loading } = useCloset();
  const [mounted, setMounted] = useState(false);
  const [vibe, setVibe] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShare = async () => {
    await haptics.impact();
    
    try {
      if (Capacitor.isNativePlatform()) {
        // iOS native share sheet
        await Share.share({
          title: 'My FashionFeed Style Scrapbook',
          text: `Check out my personal style journey! 🎨✨\n\nI've been using FitChecked to track my outfits and discover my style.\n\n📸 ${items.length} items in my closet\n✨ AI-powered style insights\n💫 Personal style scrapbook`,
          dialogTitle: 'Share Your Style Scrapbook'
        });
      } else {
        // Web fallback
        if (navigator.share) {
          await navigator.share({
            title: 'My FashionFeed Style Scrapbook',
            text: `Check out my personal style journey on FitChecked! 🎨✨`
          });
        } else {
          // Copy to clipboard fallback
          await navigator.clipboard.writeText('Check out my FashionFeed style scrapbook on FitChecked! 🎨✨');
          alert('Link copied to clipboard!');
        }
      }
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.message !== 'Share canceled') {
        console.error('Share failed:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen scrapbook-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">📸</div>
          <p className="handwritten text-2xl">Loading your style scrapbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen scrapbook-bg pb-20">
      {/* Scrapbook Header */}
      <div className="sticky top-0 z-50 bg-white border-b-4 border-black shadow-heavy">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-black hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Title - Magazine Style */}
          <div className="flex-1 text-center">
            <h1 className="magazine-headline text-xl md:text-2xl">
              My Style Scrapbook
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-xl">📸</span>
              <span className="text-xl">✨</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-pink-50 rounded-full transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-6 h-6" />
            </button>
            <button className="p-2 hover:bg-pink-50 rounded-full transition-colors">
              <Plus className="w-6 h-6" />
            </button>
            <button className="p-2 hover:bg-pink-50 rounded-full transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Vibe Section */}
        <div 
          className={`torn-edge bg-white shadow-scrapbook transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="washi-tape" />
          <div className="p-6">
            <h2 className="handwritten text-2xl mb-4 text-center">
              YOUR VIBE TODAY
            </h2>
            <div className="relative">
              <input
                type="text"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="sunny & feeling cute! ☀️"
                className="w-full px-4 py-3 border-2 border-pink-300 rounded-lg text-lg focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Closet Preview Section */}
        <div 
          className={`magazine-box magazine-box-pink transition-all duration-700 delay-150 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="mb-6">
            <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
              <span>👗</span>
              <span>YOUR CLOSET</span>
            </h2>
            <div className="section-divider">
              <div className="line" />
            </div>
          </div>

          {/* Items Grid */}
          {items.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {items.slice(0, 8).map((item, index) => (
                <div 
                  key={item.id} 
                  className="polaroid-frame animate-scaleIn"
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    '--rotate': `${Math.random() * 6 - 3}deg` 
                  } as React.CSSProperties}
                >
                  <img
                    src={item.thumbnail_url || item.image_url}
                    alt={item.name}
                    className="w-full aspect-square object-cover rounded"
                  />
                  <p className="text-center text-xs mt-2 truncate">
                    {item.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="handwritten text-xl text-gray-500">
                Add items to your closet to get started!
              </p>
            </div>
          )}

          {items.length > 8 && (
            <div className="mt-6 text-center">
              <div className="sticker inline-flex">
                <span>✨</span>
                <span>{items.length - 8} MORE ITEMS!</span>
              </div>
            </div>
          )}
        </div>

        {/* Color Story Section */}
        <div 
          className={`transition-all duration-700 delay-300 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <ColorStorySection items={items} />
        </div>

        {/* Closet Heroes Section */}
        <div 
          className={`transition-all duration-700 delay-400 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <ClosetHeroesSection items={items} />
        </div>

        {/* Weekly Challenge Section */}
        <div 
          className={`transition-all duration-700 delay-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <WeeklyChallengeSection items={items} />
        </div>

        {/* Style Steal Section */}
        <div 
          className={`transition-all duration-700 delay-600 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <StyleStealSection items={items} />
        </div>

        {/* AI Spotted Section */}
        <div 
          className={`transition-all duration-700 delay-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <AISpottedSection items={items} />
        </div>

        {/* Your Fits This Week Section */}
        <div 
          className={`transition-all duration-700 delay-800 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <YourFitsWeekSection />
        </div>

        {/* Shopping Board Section */}
        <div 
          className={`transition-all duration-700 delay-900 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <ShoppingBoardSection />
        </div>

        {/* Before/After Style Evolution Section */}
        <div 
          className={`transition-all duration-700 delay-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <BeforeAfterSection items={items} />
        </div>

        {/* Coming Soon Sections */}
        <div className="dots-divider">• • •</div>

        <div 
          className={`speech-bubble transition-all duration-700 delay-900 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="handwritten text-xl text-center">
            "More magic coming soon! 🎨✨"
          </p>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>• Styling Lessons</p>
            <p>• Mood Board Creation</p>
            <p>• Style Quiz</p>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="inline-block">
            <div className="cutout-text">
              STAY TUNED!
            </div>
            <p className="handwritten text-lg mt-4 text-gray-600">
              More magic on the way ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
