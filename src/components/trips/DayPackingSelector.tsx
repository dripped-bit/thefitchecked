import { Plus, X } from 'lucide-react';
import { ClothingItem } from '../../hooks/useCloset';

interface DayPackingSelectorProps {
  date: Date;
  dayNumber: number;
  selectedItems: ClothingItem[];
  onAddItems: () => void;
  onRemoveItem: (itemId: string) => void;
}

export function DayPackingSelector({
  date,
  dayNumber,
  selectedItems,
  onAddItems,
  onRemoveItem,
}: DayPackingSelectorProps) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      {/* Day Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">Day {dayNumber}</div>
            <h3 className="text-xl font-bold">{dayName}</h3>
            <p className="text-sm opacity-90">{dateDisplay}</p>
          </div>
          {selectedItems.length > 0 && (
            <div className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Add Button */}
        <button
          onClick={onAddItems}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600 font-medium mb-4"
        >
          <Plus className="w-5 h-5" />
          Add clothes from your closet
        </button>

        {/* Selected Items */}
        {selectedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No items selected for this day yet</p>
            <p className="text-xs mt-1">Click the button above to add clothes</p>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 text-sm mb-3">Selected Items:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-purple-300 transition-colors group"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  {/* Image */}
                  <div className="aspect-square overflow-hidden bg-gray-200">
                    <img
                      src={item.thumbnail_url || item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                    {item.brand && <p className="text-xs text-gray-600 truncate">{item.brand}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
