import { useTripRecommendations } from '../../hooks/useTripShopping';

interface TripRecommendationsBadgeProps {
  tripId: string;
  tripType: string;
  onClick?: () => void;
}

export function TripRecommendationsBadge({ tripId, tripType, onClick }: TripRecommendationsBadgeProps) {
  const { data: recommendations, isLoading } = useTripRecommendations(tripId);

  // Loading state
  if (isLoading) {
    return (
      <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium animate-pulse">
        Analyzing...
      </div>
    );
  }

  // No recommendations
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // Context-aware label
  const label = getTripTypeLabel(tripType);
  
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium hover:from-purple-200 hover:to-pink-200 transition-all flex items-center gap-2 shadow-sm"
    >
      <span>✨</span>
      <span>{label}</span>
      <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full">{recommendations.length}</span>
    </button>
  );
}

function getTripTypeLabel(tripType: string): string {
  const labels: Record<string, string> = {
    'vacation': 'Vacation Recommendations',
    'business': 'Business Trip Essentials',
    'weekend': 'Weekend Getaway Ideas',
    'event': 'Event Outfit Options',
    'adventure': 'Adventure Gear Picks',
    'multi-destination': 'Travel Recommendations',
  };
  return labels[tripType] || 'Trip Recommendations';
}
