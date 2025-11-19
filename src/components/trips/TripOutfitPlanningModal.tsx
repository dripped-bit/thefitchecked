import { useState, useEffect } from 'react';
import { X, Plus, Check, ShoppingBag } from 'lucide-react';
import { useCloset, ClothingItem } from '../../hooks/useCloset';
import { useTripOutfit, useCreateTripOutfit, Trip, TripActivity } from '../../hooks/useTrips';

interface TripOutfitPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: TripActivity;
  trip: Trip;
}

export function TripOutfitPlanningModal({
  isOpen,
  onClose,
  activity,
  trip,
}: TripOutfitPlanningModalProps) {
  const { items: closetItems } = useCloset();
  const { data: existingOutfit } = useTripOutfit(activity.id);
  const createOutfit = useCreateTripOutfit();

  const [selectedTop, setSelectedTop] = useState<ClothingItem | null>(null);
  const [selectedBottom, setSelectedBottom] = useState<ClothingItem | null>(null);
  const [selectedShoes, setSelectedShoes] = useState<ClothingItem | null>(null);
  const [selectedOuterwear, setSelectedOuterwear] = useState<ClothingItem | null>(null);
  const [activeSlot, setActiveSlot] = useState<'top' | 'bottom' | 'shoes' | 'outerwear' | null>(null);

  // Load existing outfit items
  useEffect(() => {
    if (existingOutfit && closetItems.length > 0) {
      const itemIds = existingOutfit.clothing_item_ids || [];
      itemIds.forEach((id) => {
        const item = closetItems.find((i) => i.id === id);
        if (item) {
          if (item.category === 'tops' || item.category === 'one-pieces') {
            setSelectedTop(item);
          } else if (item.category === 'bottoms') {
            setSelectedBottom(item);
          } else if (item.category === 'shoes') {
            setSelectedShoes(item);
          } else if (item.category === 'outerwear') {
            setSelectedOuterwear(item);
          }
        }
      });
    }
  }, [existingOutfit, closetItems]);

  const handleSave = async () => {
    const selectedItemIds = [
      selectedTop?.id,
      selectedBottom?.id,
      selectedShoes?.id,
      selectedOuterwear?.id,
    ].filter(Boolean) as string[];

    if (selectedItemIds.length === 0) {
      alert('Please select at least one item');
      return;
    }

    try {
      await createOutfit.mutateAsync({
        activity_id: activity.id,
        clothing_item_ids: selectedItemIds,
        is_ai_generated: false,
        is_confirmed: true,
      });

      onClose();
    } catch (error) {
      console.error('Failed to save outfit:', error);
      alert('Failed to save outfit');
    }
  };

  const handleQuickShop = (category: string) => {
    const query = `${activity.time_slot} ${category} ${trip.trip_type} travel ${trip.destination}`;
    window.open(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`, '_blank');
  };

  const getFilteredItems = (category: string) => {
    return closetItems.filter((item) => {
      if (category === 'top') {
        return item.category === 'tops' || item.category === 'one-pieces';
      }
      if (category === 'bottom') {
        return item.category === 'bottoms';
      }
      if (category === 'shoes') {
        return item.category === 'shoes';
      }
      if (category === 'outerwear') {
        return item.category === 'outerwear';
      }
      return false;
    });
  };

  if (!isOpen) return null;

  const renderItemSlot = (
    label: string,
    emoji: string,
    selectedItem: ClothingItem | null,
    slotType: 'top' | 'bottom' | 'shoes' | 'outerwear',
    categoryName: string
  ) => (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          {label}
        </h4>
        {selectedItem && (
          <button
            onClick={() => {
              if (slotType === 'top') setSelectedTop(null);
              if (slotType === 'bottom') setSelectedBottom(null);
              if (slotType === 'shoes') setSelectedShoes(null);
              if (slotType === 'outerwear') setSelectedOuterwear(null);
            }}
            className="text-red-600 text-sm hover:underline"
          >
            Remove
          </button>
        )}
      </div>

      {selectedItem ? (
        <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-white">
            <img
              src={selectedItem.thumbnail_url || selectedItem.image_url}
              alt={selectedItem.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h5 className="font-medium text-gray-900">{selectedItem.name}</h5>
            {selectedItem.brand && (
              <p className="text-sm text-gray-600">{selectedItem.brand}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={() => setActiveSlot(slotType)}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add {label}
          </button>

          {/* Quick Shop Button */}
          <button
            onClick={() => handleQuickShop(categoryName)}
            className="w-full px-3 py-2 border-2 border-purple-600 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50 flex items-center justify-center gap-2 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Quick Shop
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">Plan Outfit</h2>
              <p className="text-gray-600">{activity.title} • {activity.time_slot}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeSlot === null ? (
            /* Main View - Outfit Builder */
            <div className="space-y-6">
              {/* Outfit Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderItemSlot('Top', '👕', selectedTop, 'top', 'top')}
                {renderItemSlot('Bottom', '👖', selectedBottom, 'bottom', 'pants')}
                {renderItemSlot('Shoes', '👟', selectedShoes, 'shoes', 'shoes')}
                {renderItemSlot('Outerwear', '🧥', selectedOuterwear, 'outerwear', 'jacket')}
              </div>

              {/* Context Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Trip Context</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>📍 <strong>Destination:</strong> {trip.destination}</div>
                  <div>🎒 <strong>Trip Type:</strong> {trip.trip_type}</div>
                  <div>🕐 <strong>Time:</strong> {activity.time_slot}</div>
                  {activity.formality_level && (
                    <div>⭐ <strong>Formality:</strong> Level {activity.formality_level}</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={createOutfit.isPending || (!selectedTop && !selectedBottom && !selectedShoes)}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {createOutfit.isPending ? 'Saving...' : 'Save Outfit'}
                </button>
              </div>
            </div>
          ) : (
            /* Item Selection View */
            <div className="space-y-4">
              <button
                onClick={() => setActiveSlot(null)}
                className="text-purple-600 hover:text-purple-700 font-medium mb-4"
              >
                ← Back to outfit
              </button>

              <h3 className="text-xl font-bold mb-4">
                Select {activeSlot === 'top' ? 'Top' : activeSlot === 'bottom' ? 'Bottom' : activeSlot === 'shoes' ? 'Shoes' : 'Outerwear'}
              </h3>

              {getFilteredItems(activeSlot).length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">👗</div>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">No Items Found</h4>
                  <p className="text-gray-600 mb-6">Add items to your closet or shop for new ones</p>
                  <button
                    onClick={() => handleQuickShop(activeSlot)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium inline-flex items-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Shop for {activeSlot}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {getFilteredItems(activeSlot).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (activeSlot === 'top') setSelectedTop(item);
                        if (activeSlot === 'bottom') setSelectedBottom(item);
                        if (activeSlot === 'shoes') setSelectedShoes(item);
                        if (activeSlot === 'outerwear') setSelectedOuterwear(item);
                        setActiveSlot(null);
                      }}
                      className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={item.thumbnail_url || item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div className="p-3">
                        <h5 className="font-medium text-sm text-gray-900 truncate">{item.name}</h5>
                        {item.brand && (
                          <p className="text-xs text-gray-600 truncate">{item.brand}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
