import { useState } from 'react';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { useTripInsights } from '../../hooks/useTrips';
import { AnalyzingLoadingBar } from './AnalyzingLoadingBar';
import { PackingInsightsSection } from './PackingInsightsSection';
import { MissingItemsSection } from './MissingItemsSection';
import { OutfitRecommendationsSection } from './OutfitRecommendationsSection';
import type { Trip } from '../../hooks/useTrips';
import type { OutfitRecommendation } from '../../services/tripInsightsService';

interface TripInsightsTabProps {
  trip: Trip;
}

export function TripInsightsTab({ trip }: TripInsightsTabProps) {
  const { data: insights, isLoading, error } = useTripInsights(trip.id);
  const [showShopping, setShowShopping] = useState(false);

  const handleShopCategory = (category: string) => {
    console.log('🛍️ [INSIGHTS] Shopping for category:', category);
    // TODO: Open shopping panel with category filter
    setShowShopping(true);
  };

  const handleViewBetterOutfit = (rec: OutfitRecommendation) => {
    console.log('👗 [INSIGHTS] View better outfit for:', rec);
    // TODO: Navigate to PLAN page and show outfit suggestions
    alert(`Coming soon: Better outfit suggestions for Day ${rec.day}`);
  };

  const handleShopForTrip = () => {
    console.log('🛍️ [INSIGHTS] Opening Shop for Trip');
    setShowShopping(!showShopping);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <AnalyzingLoadingBar />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 text-red-600 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Failed to Load Insights</h3>
        </div>
        <p className="text-gray-600">
          We couldn't analyze your trip. Please try again later.
        </p>
      </div>
    );
  }

  // No insights
  if (!insights) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-gray-600">No insights available for this trip yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Packing Insights */}
      <PackingInsightsSection insights={insights.packingInsights} />

      {/* Missing Items */}
      <MissingItemsSection
        items={insights.missingItems}
        onShopCategory={handleShopCategory}
      />

      {/* Outfit Recommendations */}
      <OutfitRecommendationsSection
        recommendations={insights.outfitRecommendations}
        onViewBetterOutfit={handleViewBetterOutfit}
      />

      {/* Shop for Trip Button */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <button
          onClick={handleShopForTrip}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg font-medium flex items-center justify-center gap-2 transition-all"
        >
          <ShoppingBag className="w-5 h-5" />
          Shop for Trip
        </button>
      </div>

      {/* Shopping Panel Placeholder */}
      {showShopping && (
        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-purple-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Shopping Coming Soon</h3>
          <p className="text-gray-600">
            Shopping integration will be added in a future update.
          </p>
        </div>
      )}
    </div>
  );
}
