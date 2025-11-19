import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAddDayClothes } from '../../hooks/useTrips';
import { SequentialCategorySelector } from './SequentialCategorySelector';
import { useCloset, type ClothingItem } from '../../hooks/useCloset';

interface AddClothesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  date: string; // "2024-11-13"
  existingItemIds: string[]; // Already added items to exclude
}

export function AddClothesModal({
  isOpen,
  onClose,
  tripId,
  date,
  existingItemIds,
}: AddClothesModalProps) {
  const { items: closetItems, isLoading: closetLoading } = useCloset();
  const addDayClothes = useAddDayClothes();
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);

  // Filter out items that are already added
  const availableItems = closetItems.filter(
    item => !existingItemIds.includes(item.id)
  );

  // Loading state
  if (!isOpen) return null;

  if (closetLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your closet...</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    try {
      console.log('👕 [ADD-CLOTHES] Opening modal for date:', date);
      
      await addDayClothes.mutateAsync({
        trip_id: tripId,
        date,
        clothing_item_ids: selectedItems.map(item => item.id),
      });

      // Reset and close
      setSelectedItems([]);
      onClose();
    } catch (error) {
      console.error('Failed to add clothes:', error);
      alert('Failed to add clothes. Please try again.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Add Clothes for {formatDate(date)}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Select items to bring for this day
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {availableItems.length > 0 ? (
            <SequentialCategorySelector
              closetItems={availableItems}
              onItemsSelected={setSelectedItems}
              preselectedItems={selectedItems}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">All available items have been added</p>
              <p className="text-sm mt-2">
                Items from activities or already manually added are excluded
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t sticky bottom-0 bg-white">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={addDayClothes.isPending || selectedItems.length === 0}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addDayClothes.isPending
                ? 'Saving...'
                : `Save Clothes (${selectedItems.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
