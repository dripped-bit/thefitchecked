import React, { useState } from 'react';
import { dualAIStylingService } from '../services/dualAIStylingService';

/**
 * Example Component: Using Dual AI Styling Service
 * 
 * This shows how to integrate Claude + ChatGPT for outfit recommendations
 */
export default function DualAIOutfitExample() {
  const [loading, setLoading] = useState(false);
  const [outfit, setOutfit] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Example request
      const recommendation = await dualAIStylingService.getOutfitRecommendation({
        occasion: 'work_office',
        weather: 'partly_cloudy',
        temperature: 65,
        timeOfDay: 'morning',
        lifestyle: 'professional'
      });

      setOutfit(recommendation);
      console.log('✅ Outfit recommendation:', recommendation);

    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dual AI Outfit Recommendations</h1>
      <p className="text-gray-600 mb-6">
        Claude handles strategic analysis, ChatGPT validates the recommendation
      </p>

      <button
        onClick={getRecommendation}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Get Outfit Recommendation'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {outfit && (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold">Recommended Outfit</h2>
            {outfit.approved ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                ✓ Approved
              </span>
            ) : (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                ⚠ Needs Review
              </span>
            )}
            <span className={`px-3 py-1 text-sm rounded-full ${
              outfit.confidence === 'high' 
                ? 'bg-blue-100 text-blue-700'
                : outfit.confidence === 'medium'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {outfit.confidence.toUpperCase()} Confidence
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="font-semibold">Top:</span> {outfit.top}
            </div>
            <div>
              <span className="font-semibold">Bottom:</span> {outfit.bottom}
            </div>
            <div>
              <span className="font-semibold">Shoes:</span> {outfit.shoes}
            </div>
            {outfit.outerwear && (
              <div>
                <span className="font-semibold">Outerwear:</span> {outfit.outerwear}
              </div>
            )}
            {outfit.accessories && outfit.accessories.length > 0 && (
              <div>
                <span className="font-semibold">Accessories:</span>{' '}
                {outfit.accessories.join(', ')}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Reasoning:</span> {outfit.reasoning}
            </p>
          </div>

          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Style Notes:</span> {outfit.styleNotes}
            </p>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-bold mb-3">How Dual AI Works:</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li>
            <span className="font-semibold">1. Claude Analysis:</span> Strategic thinking about
            categories, formality, colors, and layering
          </li>
          <li>
            <span className="font-semibold">2. ChatGPT Validation:</span> Checks weather
            appropriateness, occasion fit, and practical considerations
          </li>
          <li>
            <span className="font-semibold">3. Combined Result:</span> Best of both AI models
            with confidence scoring
          </li>
          <li>
            <span className="font-semibold">4. Fallback:</span> ChatGPT-only mode if Claude
            fails
          </li>
        </ol>
      </div>
    </div>
  );
}
