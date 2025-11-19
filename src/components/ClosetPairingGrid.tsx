/**
 * Closet Pairing Grid Component
 * Displays AI-generated outfit pairing suggestions for wishlist items
 * Shows 3 items from user's closet that would pair well with the wishlist item
 */

import React, { useState } from 'react';
import { PairingSuggestion } from '../services/closetPairingService';

interface ClosetPairingGridProps {
  suggestions: PairingSuggestion[];
  reasoning?: string;
  completenessNote?: string;
  isLoading?: boolean;
  onItemClick?: (itemId: string) => void;
  onRefresh?: () => void;
  className?: string;
}

const ClosetPairingGrid: React.FC<ClosetPairingGridProps> = ({
  suggestions,
  reasoning,
  completenessNote,
  isLoading = false,
  onItemClick,
  onRefresh,
  className = ''
}) => {
  const [showReasoning, setShowReasoning] = useState(false);

  if (isLoading) {
    return (
      <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">👗</span>
          <h4 className="text-sm font-semibold text-gray-900">
            Pairs well with:
          </h4>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-xs text-gray-500">
            Finding perfect matches in your closet...
          </p>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">👗</span>
          <h4 className="text-sm font-semibold text-gray-900">
            Pairs well with:
          </h4>
        </div>
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            {reasoning || "Add items to your closet to see pairing suggestions!"}
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">👗</span>
          <h4 className="text-sm font-semibold text-gray-900">
            Pairs well with:
          </h4>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {/* 3-Item Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <button
            key={suggestion.itemId || index}
            onClick={() => onItemClick?.(suggestion.itemId)}
            className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-purple-400 transition-all relative group"
            title={suggestion.itemName}
          >
            {/* Image */}
            <img
              src={suggestion.imageUrl}
              alt={suggestion.itemName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback for broken images
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="12"%3E👔%3C/text%3E%3C/svg%3E';
              }}
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />

            {/* Item Name Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
              <p className="text-xs text-white font-medium truncate">
                {suggestion.itemName}
              </p>
            </div>

            {/* Style Score Badge */}
            {suggestion.styleScore >= 0.9 && (
              <div className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                {(suggestion.styleScore * 100).toFixed(0)}%
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Completeness Note */}
      {completenessNote && (
        <p className="text-xs text-gray-600 mb-2 px-1">
          {completenessNote}
        </p>
      )}

      {/* AI Reasoning (Collapsible) */}
      {reasoning && (
        <details 
          className="mt-2"
          open={showReasoning}
          onToggle={(e) => setShowReasoning((e.target as HTMLDetailsElement).open)}
        >
          <summary className="text-xs text-purple-600 cursor-pointer hover:text-purple-800 font-medium flex items-center gap-1">
            <svg 
              className={`w-3 h-3 transition-transform ${showReasoning ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Why these items?
          </summary>
          <div className="mt-2 text-xs text-gray-600 italic bg-gray-50 p-2 rounded-lg">
            {reasoning}
          </div>
        </details>
      )}

      {/* Individual Item Reasons (Expandable) */}
      {suggestions.length > 0 && suggestions.some(s => s.reason) && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 font-medium">
            See individual pairing details
          </summary>
          <div className="mt-2 space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={suggestion.itemId || index} className="bg-gray-50 p-2 rounded-lg">
                <div className="flex items-start gap-2">
                  {/* Thumbnail */}
                  <img
                    src={suggestion.imageUrl}
                    alt={suggestion.itemName}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    {/* Item Name */}
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {suggestion.itemName}
                    </p>
                    
                    {/* Color Match & Occasions */}
                    <div className="flex items-center gap-2 mt-0.5">
                      {suggestion.colorMatch && (
                        <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded">
                          {suggestion.colorMatch}
                        </span>
                      )}
                      {suggestion.occasions && suggestion.occasions.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {suggestion.occasions.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                    
                    {/* Reason */}
                    <p className="text-xs text-gray-600 mt-1">
                      {suggestion.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Quick Actions (Optional) */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => {
            // TODO: Navigate to closet view with these items highlighted
            console.log('View all suggestions in closet');
          }}
          className="flex-1 text-xs text-purple-600 hover:text-purple-800 font-medium py-2 px-3 border border-purple-200 hover:border-purple-300 rounded-lg transition-colors"
        >
          View in Closet
        </button>
        <button
          onClick={() => {
            // TODO: Create outfit with wishlist item + suggested items
            console.log('Create outfit with suggestions');
          }}
          className="flex-1 text-xs text-white bg-purple-600 hover:bg-purple-700 font-medium py-2 px-3 rounded-lg transition-colors"
        >
          Create Outfit
        </button>
      </div>
    </div>
  );
};

export default ClosetPairingGrid;
