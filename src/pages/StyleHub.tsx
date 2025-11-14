/**
 * StyleHub - Style exploration and discovery page with glassmorphism design
 */

import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  DollarSign, 
  Heart, 
  Luggage, 
  Search,
  Shirt,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface StyleHubProps {
  onBack: () => void;
  onNavigateToMorningMode?: () => void;
  onNavigateToPackingList?: () => void;
  onNavigateToWishlist?: () => void;
}

// Mock data (replace with real data later)
const mockData = {
  userData: { firstName: 'User' },
  closetData: {
    wishlistCount: 12,
    newWishlistItems: 2,
    packedItems: 5,
    totalItems: 143
  },
  analyticsData: {
    avgCostPerWear: '$2.40',
    mostWornCount: 23
  }
};

export default function StyleHub({ onBack, onNavigateToMorningMode, onNavigateToPackingList, onNavigateToWishlist }: StyleHubProps) {
  const [mounted, setMounted] = useState(false);

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
        {/* Header - No Box, Centered */}
        <div className="mt-12 mb-8 relative">
          {/* Back Button - Top Left with SF Symbol */}
          <button
            onClick={onBack}
            className="absolute top-0 left-0 w-10 h-10 flex items-center justify-center text-gray-700 active:text-gray-900 active:scale-95 transition-all rounded-full"
            aria-label="Go back"
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
          
          {/* Custom StyleHub Image Header */}
          <div 
            className={`text-center pt-2 transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <img 
              src="/stylehub.png" 
              alt="Style Hub" 
              className="mx-auto h-[480px] w-auto"
            />
          </div>
        </div>

        {/* Hero card removed - redundant with Morning Mode card below */}

        {/* Bento Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Morning Mode - Large */}
          <GlassCard
            delay={150}
            mounted={mounted}
            className="col-span-2 lg:col-span-2 row-span-2"
            icon={<Sun className="w-8 h-8" />}
            title="Morning Mode"
            subtitle="3 outfits ready"
            accentColor="from-orange-400 to-amber-400"
            badge="NEW"
            onClick={onNavigateToMorningMode}
          >
            <div className="mt-6 flex gap-2">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className="w-16 h-20 bg-white/40 rounded-xl flex items-center justify-center border border-white/50 shadow-sm"
                  style={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                  }}
                >
                  <span className="text-xl font-bold text-gray-700">{num}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Cost Per Wear */}
          <GlassCard
            delay={200}
            mounted={mounted}
            icon={<DollarSign className="w-8 h-8" />}
            title="Cost Per Wear"
            subtitle={`${mockData.analyticsData.avgCostPerWear} avg`}
            accentColor="from-teal-400 to-cyan-400"
            stat={mockData.analyticsData.avgCostPerWear}
          />

          {/* Wishlist */}
          <GlassCard
            delay={250}
            mounted={mounted}
            icon={<Heart className="w-8 h-8" />}
            title="Wishlist"
            subtitle={`${mockData.closetData.wishlistCount} items`}
            accentColor="from-pink-400 to-rose-400"
            badge={mockData.closetData.newWishlistItems > 0 ? String(mockData.closetData.newWishlistItems) : undefined}
            onClick={onNavigateToWishlist}
          />

          {/* Packing List */}
          <GlassCard
            delay={300}
            mounted={mounted}
            className="col-span-2"
            icon={<Luggage className="w-8 h-8" />}
            title="Packing List"
            subtitle="Plan your trips"
            accentColor="from-blue-400 to-indigo-400"
            stat={`${mockData.closetData.packedItems}/12`}
            onClick={onNavigateToPackingList}
          />

          {/* Quick Search */}
          <div
            className={`col-span-2 transition-all duration-700 delay-[350ms] ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div 
              className="bg-gradient-to-br from-pink-300/20 to-purple-300/20 rounded-3xl p-6 border border-white/40 shadow-lg active:scale-[0.98] transition-transform duration-300 cursor-pointer group h-full"
              style={{
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <Search className="w-8 h-8 text-gray-700" />
                <span className="text-2xl transition-transform">→</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Quick Search</h3>
              <p className="text-sm text-gray-600 mb-4">Generate & shop instantly</p>
              <div className="flex flex-wrap gap-2">
                {['Summer dresses', 'White sneakers', 'Denim'].map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/50 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 border border-white/60"
                    style={{
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div
          className={`bg-white/30 rounded-3xl p-5 border border-white/40 shadow-lg transition-all duration-700 delay-[400ms] ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)'
          }}
        >
          <div className="flex justify-around items-center gap-4">
            <StatPill icon="👗" value={mockData.closetData.totalItems} label="items" />
            <StatPill icon="💵" value={mockData.analyticsData.avgCostPerWear} label="avg" />
            <StatPill icon="⭐" value={mockData.analyticsData.mostWornCount} label="worn" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Glass Card Component
interface GlassCardProps {
  delay: number;
  mounted: boolean;
  className?: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentColor: string;
  badge?: string;
  stat?: string | number;
  children?: React.ReactNode;
  onClick?: () => void;
}

function GlassCard({
  delay,
  mounted,
  className = '',
  icon,
  title,
  subtitle,
  accentColor,
  badge,
  stat,
  children,
  onClick
}: GlassCardProps) {
  return (
    <div
      className={`transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div 
        className="bg-white/30 rounded-3xl p-6 border border-white/40 shadow-lg active:scale-[0.98] active:shadow-xl transition-all duration-300 cursor-pointer group h-full relative overflow-hidden"
        onClick={onClick}
        style={{
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)'
        }}
      >
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${accentColor} opacity-5 group-active:opacity-10 transition-opacity duration-300`} />
        
        {/* Content */}
        <div className="relative">
          {badge && (
            <span 
              className="absolute top-0 right-0 bg-white/60 px-3 py-1 rounded-full text-xs font-bold border border-white/60 shadow-sm"
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              {badge}
            </span>
          )}
          
          <div className={`text-transparent bg-clip-text bg-gradient-to-br ${accentColor} mb-3`}>
            {icon}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 font-medium">{subtitle}</p>
          
          {stat && (
            <div className={`text-3xl font-bold mt-3 text-transparent bg-clip-text bg-gradient-to-br ${accentColor}`}>
              {stat}
            </div>
          )}
          
          {children}
          
          <div className="absolute bottom-4 right-4 text-2xl opacity-40 group-active:opacity-70 transition-all">
            →
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Pill Component
interface StatPillProps {
  icon: string;
  value: string | number;
  label: string;
}

function StatPill({ icon, value, label }: StatPillProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-600 font-semibold uppercase tracking-wide">
          {label}
        </div>
      </div>
    </div>
  );
}
