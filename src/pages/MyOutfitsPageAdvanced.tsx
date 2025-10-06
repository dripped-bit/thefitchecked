import React from 'react';
import OutfitGallery from '../components/OutfitGallery';

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
    <div className="min-h-screen relative bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
        style={{ backgroundImage: "url('/avatarhomepage.png')" }}
      />

      {/* Content */}
      <div className="relative z-10">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Outfit Collection</h1>
              <p className="text-gray-600 mt-2">
                Browse, favorite, and organize your AI-generated outfits
              </p>
            </div>

            {/* Optional: Add navigation buttons */}
            {onBack && (
              <div className="flex gap-3">
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ← Back to Homepage
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
