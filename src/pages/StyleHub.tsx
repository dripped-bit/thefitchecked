/**
 * StyleHub - Simple Apple-style plain list navigation
 * Redesigned with minimal PlainListStyle aesthetic
 */

import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Heart, 
  Luggage,
  ChevronRight
} from 'lucide-react';
import AIDesignShopModal from '../components/AIDesignShopModal';

interface StyleHubProps {
  onBack: () => void;
  onNavigateToMorningMode?: () => void;
  onNavigateToPackingList?: () => void;
  onNavigateToWishlist?: () => void;
}

export default function StyleHub({ 
  onBack, 
  onNavigateToMorningMode, 
  onNavigateToPackingList, 
  onNavigateToWishlist 
}: StyleHubProps) {
  const [mounted, setMounted] = useState(false);
  const [showAIDesign, setShowAIDesign] = useState(false);

  useEffect(() => {
    // Small delay to ensure animations trigger
    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-50 pb-40 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mt-12 mb-8 relative">
          {/* Back Button - Top Left */}
          <button
            onClick={onBack}
            className="absolute top-0 left-0 z-50 w-10 h-10 flex items-center justify-center text-gray-700 active:text-gray-900 active:scale-95 transition-all rounded-full cursor-pointer"
            aria-label="Go back"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {/* SF Symbol arrow.backward */}
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="w-6 h-6"
              aria-hidden="true"
            >
              <path 
                d="M20 12H4M4 12L10 6M4 12L10 18" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
          
          {/* StyleHub Image Header */}
          <div 
            className={`text-center pt-2 transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <img 
              src="/stylehub.png" 
              alt="Style Hub" 
              className="mx-auto h-[1440px] w-auto"
            />
          </div>
        </div>

        {/* Plain List - Centered */}
        <div 
          className={`max-w-md mx-auto transition-all duration-700 delay-150 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="ios-plain-list">
            {/* Morning Mode */}
            <button
              onClick={onNavigateToMorningMode}
              className="ios-plain-list-item"
            >
              <Sun className="w-6 h-6 text-orange-500" />
              <span>Morning Mode</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            {/* Packing List */}
            <button
              onClick={onNavigateToPackingList}
              className="ios-plain-list-item"
            >
              <Luggage className="w-6 h-6 text-blue-500" />
              <span>Packing List</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            {/* Wishlist */}
            <button
              onClick={onNavigateToWishlist}
              className="ios-plain-list-item"
            >
              <Heart className="w-6 h-6 text-pink-500" />
              <span>Wishlist</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
      </div>

      {/* Floating AI Design Button - Bottom Right */}
      <button
        onClick={() => setShowAIDesign(true)}
        className="ai-design-fab"
        aria-label="AI Design & Shop"
      >
        <svg className="sparkle-icon" viewBox="0 0 512 512" fill="currentColor">
          <path d="M208 512a24.84 24.84 0 0 1-23.34-16l-39.84-103.6a16.06 16.06 0 0 0-9.19-9.19L32 343.34a25 25 0 0 1 0-46.68l103.6-39.84a16.06 16.06 0 0 0 9.19-9.19L184.66 144a25 25 0 0 1 46.68 0l39.84 103.6a16.06 16.06 0 0 0 9.19 9.19l103.6 39.84a25 25 0 0 1 0 46.68l-103.6 39.84a16.06 16.06 0 0 0-9.19 9.19l-39.84 103.6A24.84 24.84 0 0 1 208 512zm66.85-254.84h.3zm-134 0h.3zM448 256a16 16 0 0 1-14.93-10.26l-22.84-59.37a8 8 0 0 0-4.6-4.6l-59.37-22.84a16 16 0 0 1 0-29.86l59.37-22.84a8 8 0 0 0 4.6-4.6l22.84-59.37a16 16 0 0 1 29.86 0l22.84 59.37a8 8 0 0 0 4.6 4.6l59.37 22.84a16 16 0 0 1 0 29.86l-59.37 22.84a8 8 0 0 0-4.6 4.6l-22.84 59.37A16 16 0 0 1 448 256z"/>
        </svg>
      </button>

      {/* AI Design Shop Modal */}
      <AIDesignShopModal
        isOpen={showAIDesign}
        onClose={() => setShowAIDesign(false)}
      />
    </div>
  );
}
