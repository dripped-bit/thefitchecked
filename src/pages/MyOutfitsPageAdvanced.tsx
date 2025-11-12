import React from 'react';
import OutfitGallery from '../components/OutfitGallery';
import { IOSNavigationBar, IOSBackButton } from '../components/ui/IOSNavigationBar';

interface MyOutfitsPageAdvancedProps {
  onBack?: () => void;
}

/**
 * Advanced My Outfits Page
 * Uses OutfitGallery component with all advanced features:
 * - Search by occasion/style/prompt
 * - Filter by color (10 popular colors)
 * - Filter tabs: All, Favorites, Top Rated, Recent
 * - Grid and list view modes
 * - Color palette display
 * - Share functionality
 * - Rating system
 * - Favoriting
 */
export default function MyOutfitsPageAdvanced({ onBack }: MyOutfitsPageAdvancedProps) {
  return (
    <div className="min-h-screen pb-safe relative bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
        style={{ backgroundImage: "url('/avatarhomepage.png')" }}
      />

      {/* Content */}
      <div className="relative z-10">
      {/* iOS Navigation Bar */}
      <IOSNavigationBar
        title="My Outfit Collection"
        subtitle="Browse, favorite, and organize your outfits"
        large={true}
        leftItems={onBack && <IOSBackButton label="Home" onClick={onBack} />}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OutfitGallery
          initialFilter="all"
          showFilters={true}
          compact={false}
        />
      </div>

      {/* Footer Help Text */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-3">💡 Tips</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Click the <span className="text-red-500">❤️</span> to favorite your best outfits</li>
            <li>• Rate outfits with <span className="text-yellow-400">⭐</span> to track your favorites</li>
            <li>• Use the color filter to find outfits by color palette</li>
            <li>• Share your favorite looks with friends via unique links</li>
            <li>• Click color chips to see the full color palette analysis</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
}
