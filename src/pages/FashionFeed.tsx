/**
 * FashionFeed - Digital Style Scrapbook
 * Magazine-inspired personal style journal with AI-curated imagery
 */

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Camera as CameraIcon, Share2 } from 'lucide-react';
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
import AutoScrollSlider from '../components/fashionfeed/AutoScrollSlider';
import BeforeAfterSection from '../components/fashionfeed/BeforeAfterSection';
import VibePhotoGallery, { VibePhoto } from '../components/fashionfeed/VibePhotoGallery';
import StyleQuiz from '../components/fashionfeed/StyleQuiz';
import StyleQuizResults from '../components/fashionfeed/StyleQuizResults';
import { supabase } from '../services/supabaseClient';
import styleQuizService, { StyleQuizResult } from '../services/styleQuizService';
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
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState<StyleQuizResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  
  // Auto-scroll state
  const [scrollSpeed, setScrollSpeed] = useState(0); // -100 to +100
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    loadTodaysVibe();
    checkQuizStatus();
  }, []);

  const checkQuizStatus = async () => {
    try {
      const completed = await styleQuizService.hasCompletedQuiz();
      setHasCompletedQuiz(completed);
      
      if (completed) {
        const results = await styleQuizService.getQuizResults();
        setQuizResults(results);
      }
    } catch (error) {
      console.error('Error checking quiz status:', error);
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    if (scrollSpeed !== 0) {
      // Clear existing interval
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }

      // Create new scroll interval
      scrollIntervalRef.current = setInterval(() => {
        // Calculate scroll amount based on speed
        // Positive speed = scroll down, Negative = scroll up
        const scrollAmount = (scrollSpeed / 100) * 5; // Max 5px per tick
        
        window.scrollBy({
          top: scrollAmount,
          behavior: 'auto' // Smooth scrolling done by interval timing
        });
      }, 16); // ~60fps

    } else {
      // Stop scrolling
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }

    // Cleanup
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [scrollSpeed]);

  const handleScrollSpeedChange = (speed: number) => {
    setScrollSpeed(speed);
  };

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

  const handleAddFromLibrary = async () => {
    await haptics.impact();
    
    try {
      console.log('📸 Opening photo library...');
      
      // Import Camera module dynamically
      const { Camera: CameraModule, CameraResultType, CameraSource } = 
        await import('@capacitor/camera');
      
      const photo = await CameraModule.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: Capacitor.isNativePlatform() ? 
          CameraResultType.Uri : 
          CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      console.log('📸 Photo selected:', photo);

      if (photo.webPath || photo.dataUrl) {
        await handlePhotoCapture(photo.webPath || photo.dataUrl || '');
      }
    } catch (error: any) {
      console.error('❌ Photo library error:', error);
      if (error.message && !error.message.includes('cancel')) {
        alert(`Photo error: ${error.message}`);
      }
    }
  };

  const handleTakePicture = async () => {
    await haptics.impact();
    
    try {
      console.log('📷 Opening camera...');
      
      // Import Camera module dynamically
      const { Camera: CameraModule, CameraResultType, CameraSource } = 
        await import('@capacitor/camera');
      
      const photo = await CameraModule.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: Capacitor.isNativePlatform() ? 
          CameraResultType.Uri : 
          CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      console.log('📷 Photo taken:', photo);

      if (photo.webPath || photo.dataUrl) {
        await handlePhotoCapture(photo.webPath || photo.dataUrl || '');
      }
    } catch (error: any) {
      console.error('❌ Camera error:', error);
      if (error.message && !error.message.includes('cancel')) {
        alert(`Camera error: ${error.message}`);
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

  const handleQuizComplete = (results: StyleQuizResult) => {
    setQuizResults(results);
    setShowQuiz(false);
    setShowResults(true);
    setHasCompletedQuiz(true);
    haptics.notification({ type: 'success' });
  };

  const handleRetakeQuiz = async () => {
    try {
      await styleQuizService.deleteQuizResults();
      setShowResults(false);
      setHasCompletedQuiz(false);
      setQuizResults(null);
      setShowQuiz(true);
    } catch (error) {
      console.error('Error retaking quiz:', error);
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

            {/* Add Photo Buttons */}
            <div className="mt-4 flex items-center justify-center gap-4">
              {/* Add from Library Button */}
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('➕ Plus button clicked');
                  await handleAddFromLibrary();
                }}
                className="w-14 h-14 rounded-full bg-pink-500 hover:bg-pink-600 active:bg-pink-700 transition-all flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                aria-label="Add photo from library"
              >
                <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
              </button>
              
              {/* Take Picture Button */}
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('📷 Camera button clicked');
                  await handleTakePicture();
                }}
                className="w-14 h-14 rounded-full bg-pink-500 hover:bg-pink-600 active:bg-pink-700 transition-all flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                aria-label="Take a picture"
              >
                <CameraIcon className="w-7 h-7 text-white" strokeWidth={2} />
              </button>
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

        {/* Before/After Style Evolution Section */}
        <div 
          className={`transition-all duration-700 delay-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <BeforeAfterSection items={items} />
        </div>

        {/* Style Quiz CTA */}
        <div className="dots-divider">• • •</div>

        <div 
          className={`transition-all duration-700 delay-1100 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {!hasCompletedQuiz ? (
            <div className="quiz-cta-container">
              <h2 className="quiz-cta-title">
                DISCOVER YOUR STYLE
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Take our 2-min quiz and get personalized fashion inspo!
              </p>
              <button
                onClick={() => {
                  setShowQuiz(true);
                  haptics.impact();
                }}
                className="quiz-cta-button"
              >
                Start Style Quiz →
              </button>
            </div>
          ) : (
            <div className="quiz-cta-container">
              <h2 className="quiz-cta-title">
                YOU'RE A {quizResults?.styleType || 'FASHIONISTA'}!
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                Your personalized style profile is helping curate your feed ✨
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={() => {
                    setShowResults(true);
                    haptics.impact();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  View My Profile
                </button>
                <button
                  onClick={async () => {
                    await styleQuizService.deleteQuizResults();
                    setHasCompletedQuiz(false);
                    setQuizResults(null);
                    setShowQuiz(true);
                    haptics.impact();
                  }}
                  className="px-6 py-3 bg-white border-2 border-pink-400 text-pink-600 font-bold rounded-full hover:bg-pink-50 transition-all"
                >
                  Retake Quiz
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Coming Soon Sections */}
        <div 
          className={`speech-bubble transition-all duration-700 delay-1200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="handwritten text-xl text-center">
            "More magic coming soon! 🎨✨"
          </p>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>• Styling Lessons</p>
            <p>• Mood Board Creation</p>
          </div>
        </div>
      </div>

      {/* Quiz Modals */}
      {showQuiz && (
        <StyleQuiz
          isOpen={showQuiz}
          onClose={() => setShowQuiz(false)}
          onComplete={handleQuizComplete}
        />
      )}

      {showResults && quizResults && (
        <StyleQuizResults
          results={quizResults}
          onClose={() => setShowResults(false)}
          onRetake={handleRetakeQuiz}
        />
      )}

      {/* Auto-Scroll Slider Overlay */}
      <AutoScrollSlider onScrollSpeedChange={handleScrollSpeedChange} />
    </div>
  );
}
