import { useState, useMemo } from 'react';
import { Edit2, X, Package } from 'lucide-react';
import { 
  useTripActivities, 
  useAllTripOutfits, 
  useManualDayClothes, 
  useDeleteDayClothes 
} from '../../hooks/useTrips';
import { useCloset, type ClothingItem } from '../../hooks/useCloset';

interface DayClothesBoxProps {
  tripId: string;
  date: string; // "2024-11-13"
}

interface ClothingItemWithSource {
  item: ClothingItem;
  source: 'activity' | 'manual';
  activityTitle?: string;
}

const CATEGORY_ORDER = ['tops', 'bottoms', 'dresses', 'shoes', 'outerwear', 'accessories', 'bags'];

const CATEGORY_EMOJI: Record<string, string> = {
  tops: '👕',
  bottoms: '👖',
  dresses: '👗',
  shoes: '👟',
  outerwear: '🧥',
  accessories: '👜',
  bags: '👜',
};

const CATEGORY_LABELS: Record<string, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  dresses: 'Dresses',
  shoes: 'Shoes',
  outerwear: 'Outerwear',
  accessories: 'Accessories',
  bags: 'Bags',
};

export function DayClothesBox({ tripId, date }: DayClothesBoxProps) {
  const [editMode, setEditMode] = useState(false);
  
  const { data: activities = [] } = useTripActivities(tripId);
  const { data: allOutfits = [] } = useAllTripOutfits(tripId);
  const { data: manualClothes = [] } = useManualDayClothes(tripId, date);
  const { items: closetItems } = useCloset();
  const deleteDayClothes = useDeleteDayClothes();

  // Aggregate all clothes for this day
  const clothesByCategory = useMemo(() => {
    console.log('📦 [CLOTHES-BOX] Aggregating clothes for', date);
    
    // 1. Get activities for this date
    const dayActivities = activities.filter(a => a.date === date);
    console.log('📦 [CLOTHES-BOX] Found', dayActivities.length, 'activities');

    // 2. Get clothing item IDs from activity outfits
    const activityItemsMap = new Map<string, { activityTitle: string }>();
    dayActivities.forEach(activity => {
      const outfit = allOutfits.find(o => o.activity_id === activity.id);
      if (outfit && outfit.clothing_item_ids) {
        outfit.clothing_item_ids.forEach(itemId => {
          if (!activityItemsMap.has(itemId)) {
            activityItemsMap.set(itemId, { activityTitle: activity.title });
          }
        });
      }
    });
    console.log('📦 [CLOTHES-BOX] Found', activityItemsMap.size, 'from activities');

    // 3. Get manually added items
    const manualItemIds = new Set(manualClothes.map(c => c.clothing_item_id));
    console.log('📦 [CLOTHES-BOX] Found', manualItemIds.size, 'manual items');

    // 4. Combine and deduplicate
    const uniqueItems = new Map<string, ClothingItemWithSource>();
    
    // Add activity items
    activityItemsMap.forEach((info, itemId) => {
      const item = closetItems.find(c => c.id === itemId);
      if (item) {
        uniqueItems.set(itemId, {
          item,
          source: 'activity',
          activityTitle: info.activityTitle,
        });
      }
    });

    // Add manual items (will override activity items if same)
    manualItemIds.forEach(itemId => {
      const item = closetItems.find(c => c.id === itemId);
      if (item) {
        // If already added from activity, keep activity source for display
        if (!uniqueItems.has(itemId)) {
          uniqueItems.set(itemId, {
            item,
            source: 'manual',
          });
        }
      }
    });

    console.log('📦 [CLOTHES-BOX] Total unique:', uniqueItems.size);

    // 5. Group by category
    const grouped: Record<string, ClothingItemWithSource[]> = {};
    uniqueItems.forEach((clothingInfo) => {
      const category = clothingInfo.item.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(clothingInfo);
    });

    return grouped;
  }, [activities, allOutfits, manualClothes, closetItems, date]);

  const totalItems = useMemo(() => {
    return Object.values(clothesByCategory).reduce((sum, items) => sum + items.length, 0);
  }, [clothesByCategory]);

  const handleRemoveManualItem = async (itemId: string) => {
    const confirmed = confirm('Remove this item from this day?');
    if (!confirmed) return;

    try {
      await deleteDayClothes.mutateAsync({
        trip_id: tripId,
        date,
        clothing_item_id: itemId,
      });
    } catch (error) {
      console.error('Failed to remove item:', error);
      alert('Failed to remove item');
    }
  };

  // Don't show if no clothes
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      <div className="bg-white rounded-lg border-2 border-purple-200 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Clothes for This Day ({totalItems} items)
          </h3>
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            {editMode ? (
              <>Done Editing</>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Clothes
              </>
            )}
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {CATEGORY_ORDER.map(category => {
            const items = clothesByCategory[category];
            if (!items || items.length === 0) return null;

            return (
              <div key={category}>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-lg">{CATEGORY_EMOJI[category] || '👔'}</span>
                  {CATEGORY_LABELS[category] || category} ({items.length})
                </h4>
                <div className="space-y-2 ml-7">
                  {items.map(({ item, source, activityTitle }) => {
                    // Check if this item is manually added
                    const isManuallyAdded = manualClothes.some(
                      c => c.clothing_item_id === item.id
                    );

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <img
                            src={item.thumbnail_url || item.image_url}
                            alt={item.name}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                            {source === 'activity' && activityTitle && (
                              <p className="text-xs text-gray-500">
                                From: {activityTitle}
                              </p>
                            )}
                            {isManuallyAdded && source === 'manual' && (
                              <p className="text-xs text-purple-600">
                                (Manual)
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {editMode && isManuallyAdded && (
                          <button
                            onClick={() => handleRemoveManualItem(item.id)}
                            disabled={deleteDayClothes.isPending}
                            className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors flex-shrink-0 disabled:opacity-50"
                            title="Remove item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {editMode && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 You can only remove manually added items. Items from activities cannot be removed here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
