import { useState } from 'react';
import { useTripRecommendations } from '../../hooks/useTripShopping';
import { useTrip } from '../../hooks/useTrips';

interface TripShoppingPanelProps {
  tripId: string;
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

export function TripShoppingPanel({ tripId }: TripShoppingPanelProps) {
  const { data: trip } = useTrip(tripId);
  const { data: recommendations, isLoading } = useTripRecommendations(tripId);
  const [selectedRec, setSelectedRec] = useState<any | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">✨</span>
          <div>
            <h3 className="font-bold text-purple-900 text-lg">Generating Recommendations...</h3>
            <p className="text-purple-700">AI is analyzing your style and trip details.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <span>✨</span>
          {getTripTypeLabel(trip.trip_type)}
        </h2>
        <p className="text-sm opacity-90">
          AI-curated recommendations for {trip.destination}
        </p>
      </div>

      {/* Recommendations Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recommendations.map((rec: any) => (
            <div
              key={rec.id}
              onClick={() => setSelectedRec(rec)}
              className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer"
            >
              {rec.imageUrl && (
                <img src={rec.imageUrl} alt={rec.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-3">
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">{rec.name}</h3>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{rec.reasoning}</p>
                <div className="flex flex-wrap gap-1">
                  {rec.priority === 'essential' && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Essential</span>
                  )}
                  {rec.matchesUserStyle && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Your Style</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRec && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRec(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-4">
              {selectedRec.imageUrl && (
                <img src={selectedRec.imageUrl} alt={selectedRec.name} className="w-48 h-48 object-cover rounded-lg" />
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">{selectedRec.name}</h3>
                <p className="text-gray-700 mb-4">{selectedRec.reasoning}</p>
                <div className="flex gap-2 mb-4">
                  {selectedRec.priority === 'essential' && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Essential</span>
                  )}
                  {selectedRec.matchesUserStyle && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Matches Your Style</span>
                  )}
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium capitalize">{selectedRec.category}</span>
                </div>
                <button
                  onClick={() => setSelectedRec(null)}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
