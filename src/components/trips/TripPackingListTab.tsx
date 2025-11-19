import { useState } from 'react';
import { CheckCircle2, Circle, Calendar, Trash2, Lightbulb, Package } from 'lucide-react';
import { useTripPackingList, useTogglePackingItem, useDeletePackingItem } from '../../hooks/useTrips';
import { getPackingSuggestions } from '../../services/tripPackingService';
import { ManualPackingPlanModal } from './ManualPackingPlanModal';
import { PACKING_CATEGORIES } from '../../constants/tripTypes';
import type { Trip, TripStats, PackingListItem } from '../../hooks/useTrips';

interface TripPackingListTabProps {
  trip: Trip;
  stats?: TripStats;
}

export function TripPackingListTab({ trip, stats }: TripPackingListTabProps) {
  const { data: packingItems = [], refetch } = useTripPackingList(trip.id);
  const toggleItem = useTogglePackingItem();
  const deleteItem = useDeletePackingItem();

  const [showManualPlan, setShowManualPlan] = useState(false);

  const suggestions = getPackingSuggestions(trip);

  // Group items by category
  const itemsByCategory = packingItems.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, PackingListItem[]>);

  const handleToggleItem = async (itemId: string, currentlyPacked: boolean) => {
    try {
      await toggleItem.mutateAsync({ itemId, isPacked: !currentlyPacked });
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Delete this item?')) {
      try {
        await deleteItem.mutateAsync(itemId);
      } catch (error) {
        console.error('Failed to delete item:', error);
        alert('Failed to delete item');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Packing List</h3>
            <p className="text-sm text-gray-600 mt-1">
              {stats?.packedItems || 0} of {stats?.totalPackingItems || 0} items packed
            </p>
          </div>
          {stats && stats.totalPackingItems > 0 && (
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{Math.round(stats.packingProgress)}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          )}
        </div>

        {stats && stats.totalPackingItems > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${stats.packingProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div>
        <button
          onClick={() => setShowManualPlan(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
        >
          <Calendar className="w-5 h-5" />
          Plan Your Packing List
        </button>
      </div>

      {/* Packing List */}
      {packingItems.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Items Yet</h3>
          <p className="text-gray-600 mb-6">
            Plan your packing list with day-by-day outfits from your closet, plus essentials, toiletries, documents, and electronics.
          </p>
          <button
            onClick={() => setShowManualPlan(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Plan Your Packing List
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(PACKING_CATEGORIES).map(([categoryKey, categoryLabel]) => {
            const items = itemsByCategory[categoryKey] || [];
            if (items.length === 0) return null;

            const packedCount = items.filter(item => item.is_packed).length;

            return (
              <div key={categoryKey} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">{categoryLabel}</h4>
                    <span className="text-sm text-gray-600">
                      {packedCount}/{items.length} packed
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                        item.is_packed ? 'bg-green-50/50' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleToggleItem(item.id, item.is_packed)}
                        className="flex-shrink-0"
                      >
                        {item.is_packed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${item.is_packed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {item.item_name}
                          {item.quantity > 1 && <span className="text-gray-500 ml-2">× {item.quantity}</span>}
                        </div>
                        {item.is_essential && (
                          <span className="text-xs text-orange-600 font-medium">Essential</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Packing Tips */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Packing Tips</h4>
          </div>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Manual Planning Modal */}
      <ManualPackingPlanModal
        isOpen={showManualPlan}
        onClose={() => setShowManualPlan(false)}
        trip={trip}
        onSuccess={refetch}
      />
    </div>
  );
}
