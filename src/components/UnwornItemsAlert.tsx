/**
 * Unworn Items Alert Component
 * Displays warning about items not worn in 3+ months
 * with actions to sell or get outfit ideas
 */

import React, { useState } from 'react';
import { AlertCircle, ShoppingBag, Lightbulb, X } from 'lucide-react';

interface UnwornItemsAlertProps {
  unwornCount: number;
  unwornValue: number;
  unwornByCategory?: { category: string; count: number; value: number }[];
  onSellItems?: () => void;
  onGetOutfitIdeas?: () => void;
}

export default function UnwornItemsAlert({
  unwornCount,
  unwornValue,
  unwornByCategory = [],
  onSellItems,
  onGetOutfitIdeas
}: UnwornItemsAlertProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (unwornCount === 0) return null;

  const handleSellOnPoshmark = () => {
    // Open Poshmark with guidance
    if (onSellItems) {
      onSellItems();
    } else {
      // Default: Open Poshmark website
      window.open('https://poshmark.com/sell', '_blank');
    }
  };

  const handleGetOutfitIdeas = () => {
    if (onGetOutfitIdeas) {
      onGetOutfitIdeas();
    } else {
      // Default: Could navigate to outfit generator
      alert('Coming soon: AI outfit ideas using your unworn items!');
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      {/* Main Alert */}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-amber-500 flex-shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {unwornCount} item{unwornCount !== 1 ? 's' : ''} not worn in 3+ months
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ${unwornValue.toLocaleString()} sitting unused
          </p>
        </div>
        {unwornByCategory.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        )}
      </div>

      {/* Category Breakdown (collapsible) */}
      {showDetails && unwornByCategory.length > 0 && (
        <div className="mb-3 p-3 bg-amber-50 rounded-lg space-y-2">
          <p className="text-xs font-medium text-amber-900 mb-2">
            Breakdown by Category:
          </p>
          {unwornByCategory
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map((cat) => (
              <div
                key={cat.category}
                className="flex justify-between items-center text-xs"
              >
                <span className="text-amber-800 capitalize">{cat.category}</span>
                <span className="text-amber-700 font-medium">
                  {cat.count} item{cat.count !== 1 ? 's' : ''} • $
                  {cat.value.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSellOnPoshmark}
          className="flex-1 bg-purple-100 text-purple-700 py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-purple-200 active:bg-purple-300 transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Sell on Poshmark
        </button>
        <button
          onClick={handleGetOutfitIdeas}
          className="flex-1 bg-pink-100 text-pink-700 py-2.5 px-3 rounded-lg text-sm font-medium hover:bg-pink-200 active:bg-pink-300 transition-colors flex items-center justify-center gap-2"
        >
          <Lightbulb className="w-4 h-4" />
          Get Outfit Ideas
        </button>
      </div>

      {/* Additional Tip */}
      <div className="mt-3 p-2 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 Tip: Items you haven't worn in 3+ months could be decluttered or
          restyled. Track wears to see which items give you the best value!
        </p>
      </div>
    </div>
  );
}
