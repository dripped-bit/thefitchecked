import { useTripShoppingSuggestions } from '../../hooks/useTripShopping';

interface MissingItemsBadgeProps {
  tripId: string;
  onClick?: () => void;
}

export function MissingItemsBadge({ tripId, onClick }: MissingItemsBadgeProps) {
  const { data: suggestions, isLoading } = useTripShoppingSuggestions(tripId);

  // Loading state
  if (isLoading) {
    return (
      <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium animate-pulse">
        Checking...
      </div>
    );
  }

  // Complete - no missing items
  if (!suggestions || suggestions.missingItems.length === 0) {
    return (
      <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
        <span>✓</span>
        <span>Complete</span>
      </div>
    );
  }

  // Missing items - show count and shop button
  const totalMissing = suggestions.missingItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium hover:bg-yellow-200 transition-colors flex items-center gap-2"
    >
      <span>⚠️</span>
      <span>{totalMissing} {totalMissing === 1 ? 'item' : 'items'} needed</span>
      <span className="text-xs opacity-75">→ Shop</span>
    </button>
  );
}
