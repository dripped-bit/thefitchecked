/**
 * StyleHub - Simple Apple-style plain list navigation
 * Redesigned with minimal PlainListStyle aesthetic
 */

import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Heart, 
  Luggage,
  DollarSign,
  ChevronRight,
  UtensilsCrossed
} from 'lucide-react';
import AIDesignShopModal from '../components/AIDesignShopModal';

interface StyleHubProps {
  onBack: () => void;
  onNavigateToMorningMode?: () => void;
  onNavigateToPackingList?: () => void;
  onNavigateToTripsList?: () => void;
  onNavigateToWishlist?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToFashionFeed?: () => void;
}

export default function StyleHub({ 
  onBack, 
  onNavigateToMorningMode, 
  onNavigateToPackingList, 
  onNavigateToTripsList,
  onNavigateToWishlist,
  onNavigateToAnalytics,
  onNavigateToFashionFeed
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
        <div className="mt-6 mb-3 relative">
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
            className={`text-center transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <img 
              src="/stylehub.png" 
              alt="Style Hub" 
              className="mx-auto h-[320px] w-auto"
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
            {/* Weather Picks */}
            <button
              onClick={onNavigateToMorningMode}
              className="ios-plain-list-item"
            >
              <Sun className="w-6 h-6 text-orange-500" />
              <span>Weather Picks</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            {/* Trip Planner (NEW - replaces old Packing List) */}
            <button
              onClick={onNavigateToTripsList || onNavigateToPackingList}
              className="ios-plain-list-item"
            >
              <Luggage className="w-6 h-6 text-blue-500" />
              <span>Trip Planner</span>
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
            
            {/* Closet Analytics */}
            <button
              onClick={onNavigateToAnalytics}
              className="ios-plain-list-item"
            >
              <DollarSign className="w-6 h-6 text-green-500" />
              <span>Closet Analytics</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* FashionFeed Tab - Translucent Circle */}
        <div 
          className={`flex flex-col items-center justify-center px-4 py-6 transition-all duration-700 delay-250 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <button
            onClick={onNavigateToFashionFeed}
            className="relative group"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {/* Translucent Circle Button */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-active:scale-95 shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.35)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 8px 32px rgba(255, 105, 180, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <UtensilsCrossed 
                className="w-10 h-10 text-purple-600" 
                strokeWidth={2}
              />
            </div>
            
            {/* Label - Centered Below */}
            <p 
              className="text-center mt-3 text-sm font-semibold tracking-wide"
              style={{ color: '#444' }}
            >
              FashionFeed
            </p>
          </button>
        </div>

        {/* Design and Shop - Compact Oval Button */}
        <div 
          className={`flex justify-center px-4 py-6 transition-all duration-700 delay-300 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <button
            onClick={() => setShowAIDesign(true)}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-base font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Design and Shop
          </button>
        </div>
        
      </div>

      {/* AI Design Shop Modal */}
      <AIDesignShopModal
        isOpen={showAIDesign}
        onClose={() => setShowAIDesign(false)}
      />
    </div>
  );
}
