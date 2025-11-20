/**
 * FashionFeed - Digital Style Scrapbook
 * Magazine-inspired personal style journal with AI-curated imagery
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Settings, Camera as CameraIcon, Share2 } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Camera, Photo } from '@capacitor/camera';
import { useCloset } from '../hooks/useCloset';
import ColorStorySection from '../components/fashionfeed/ColorStorySection';
import ClosetHeroesSection from '../components/fashionfeed/ClosetHeroesSection';
import WeeklyChallengeSection from '../components/fashionfeed/WeeklyChallengeSection';
import StyleStealSection from '../components/fashionfeed/StyleStealSection';
import AISpottedSection from '../components/fashionfeed/AISpottedSection';
import YourFitsWeekSection from '../components/fashionfeed/YourFitsWeekSection';
import ShoppingBoardSection from '../components/fashionfeed/ShoppingBoardSection';
import BeforeAfterSection from '../components/fashionfeed/BeforeAfterSection';
import VibePhotoGallery, { VibePhoto } from '../components/fashionfeed/VibePhotoGallery';
import { supabase } from '../services/supabaseClient';
import haptics from '../utils/haptics';
import '../styles/scrapbook.css';

interface FashionFeedProps {
  onBack: () => void;
}

const VIBE_STORAGE_KEY = 'fashionfeed_daily_vibes';

interface DailyVibe {
  date: string;
  text: string;
  timestamp: number;
}

export default function FashionFeed({ onBack }: FashionFeedProps) {
  const { items, loading } = useCloset();
  const [mounted, setMounted] = useState(false);
  const [vibe, setVibe] = useState('');
  const [vibePhotos, setVibePhotos] = useState<VibePhoto[]>([]);
  const [loadingVibe, setLoadingVibe] = useState(true);

  useEffect(() => {
    setMounted(true);
    loadTodaysVibe();
  }, []);

  const loadTodaysVibe = async () => {
    setLoadingVibe(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Try Supabase first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('daily_vibes')
          .select('vibe_text, photos')
          .eq('user_id', user.id)
          .eq('vibe_date', today)
          .single();
        
        if (data && !error) {
          setVibe(data.vibe_text || '');
          setVibePhotos(data.photos || []);
          setLoadingVibe(false);
          return;
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem(VIBE_STORAGE_KEY);
      if (stored) {
        const vibes: DailyVibe[] = JSON.parse(stored);
        const todaysVibe = vibes.find(v => v.date === today);
        if (todaysVibe) {
          setVibe(todaysVibe.text);
        }
      }
    } catch (error) {
      console.error('Failed to load vibe:', error);
    } finally {
      setLoadingVibe(false);
    }
  };

  const saveVibe = async (newVibe: string) => {
    setVibe(newVibe);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Try Supabase first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('daily_vibes').upsert({
          user_id: user.id,
          vibe_date: today,
          vibe_text: newVibe,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,vibe_date'
        });
      }
      
      // Also save to localStorage as backup
      const stored = localStorage.getItem(VIBE_STORAGE_KEY) || '[]';
      const vibes: DailyVibe[] = JSON.parse(stored);
      const existing = vibes.findIndex(v => v.date === today);
      
      if (existing >= 0) {
        vibes[existing] = { date: today, text: newVibe, timestamp: Date.now() };
      } else {
        vibes.push({ date: today, text: newVibe, timestamp: Date.now() });
      }
      
      // Keep only last 30 days
      const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recent = vibes.filter(v => v.timestamp > cutoff);
      localStorage.setItem(VIBE_STORAGE_KEY, JSON.stringify(recent));
      
    } catch (error) {
      console.error('Failed to save vibe:', error);
    }
  };

  const handlePlusClick = async () => {
    await haptics.impact();
    
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: Capacitor.isNativePlatform() ? 
          (await import('@capacitor/camera')).CameraResultType.Uri : 
          (await import('@capacitor/camera')).CameraResultType.DataUrl,
        source: (await import('@capacitor/camera')).CameraSource.Prompt
      });

      if (photo.webPath || photo.dataUrl) {
        await handlePhotoCapture(photo.webPath || photo.dataUrl || '');
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        console.error('Camera error:', error);
      }
    }
  };

  const handlePhotoCapture = async (photoUrl: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Random rotation for scrapbook effect (-5 to 5 degrees)
      const rotation = Math.random() * 10 - 5;
      
      // Random sticker style
      const styles: Array<'polaroid' | 'cutout' | 'torn' | 'tape'> = ['polaroid', 'cutout', 'torn', 'tape'];
      const stickerStyle = styles[Math.floor(Math.random() * styles.length)];
      
      const newPhoto: VibePhoto = {
        id: Date.now().toString(),
        url: photoUrl,
        rotation,
        stickerStyle
      };
      
      const updatedPhotos = [...vibePhotos, newPhoto];
      setVibePhotos(updatedPhotos);
      
      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('daily_vibes').upsert({
          user_id: user.id,
          vibe_date: today,
          photos: updatedPhotos,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,vibe_date'
        });
      }
      
      await haptics.notification({ type: 'success' });
    } catch (error) {
      console.error('Failed to add photo:', error);
      await haptics.notification({ type: 'error' });
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    await haptics.impact();
    
    try {
      const updatedPhotos = vibePhotos.filter(p => p.id !== photoId);
      setVibePhotos(updatedPhotos);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Update Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('daily_vibes').upsert({
          user_id: user.id,
          vibe_date: today,
          photos: updatedPhotos,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,vibe_date'
        });
      }
    } catch (error) {
      console.error('Failed to remove photo:', error);
    }
  };

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
            <button 
              onClick={handlePlusClick}
              className="p-2 hover:bg-pink-50 rounded-full transition-colors"
              aria-label="Add photo"
            >
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
            
            {/* Vibe Input */}
            <div className="relative">
              <input
                type="text"
                value={vibe}
                onChange={(e) => saveVibe(e.target.value)}
                placeholder="sunny & feeling cute! ☀️"
                className="w-full px-4 py-3 border-2 border-pink-300 rounded-lg text-lg focus:outline-none focus:border-pink-500 transition-colors"
                disabled={loadingVibe}
              />
            </div>

            {/* Photo Gallery */}
            <VibePhotoGallery 
              photos={vibePhotos}
              onRemovePhoto={handleRemovePhoto}
            />

            {/* Add Photo Button */}
            <button
              onClick={handlePlusClick}
              className="mt-4 w-full py-3 border-2 border-dashed border-pink-300 rounded-lg hover:bg-pink-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-pink-600"
            >
              <CameraIcon className="w-5 h-5" />
              <span className="font-medium">Add a photo to your vibe</span>
            </button>
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
