import { Sparkles, ArrowRight } from 'lucide-react';
import type { OutfitRecommendation } from '../../services/tripInsightsService';

interface OutfitRecommendationsSectionProps {
  recommendations: OutfitRecommendation[];
  onViewBetterOutfit: (rec: OutfitRecommendation) => void;
}

export function OutfitRecommendationsSection({
  recommendations,
  onViewBetterOutfit,
}: OutfitRecommendationsSectionProps) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Perfect Outfits!</h3>
        </div>
        <p className="text-gray-600">All your outfit choices look great for your activities.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Outfit Recommendations</h3>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">
                Day {rec.day} - {rec.activityTitle}
              </h4>
              <button
                onClick={() => onViewBetterOutfit(rec)}
                className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 text-sm"
                aria-label="View better outfit suggestion"
              >
                View Better Outfit
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-700 mb-2">{rec.suggestion}</p>

            <div className="flex items-start gap-2 text-sm text-gray-600 bg-white p-3 rounded border border-purple-100">
              <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <p>
                <span className="font-medium">Fashion tip:</span> {rec.fashionTip}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
