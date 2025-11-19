import { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import type { ClothingItem } from '../../services/closetService';

interface SequentialCategorySelectorProps {
  closetItems: ClothingItem[];
  onItemsSelected: (items: ClothingItem[]) => void;
  preselectedItems?: ClothingItem[];
}

export function SequentialCategorySelector({
  closetItems,
  onItemsSelected,
  preselectedItems = [],
}: SequentialCategorySelectorProps) {
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>(preselectedItems);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = [
    { key: 'tops', label: 'Top', emoji: '👕' },
    { key: 'bottoms', label: 'Bottoms', emoji: '👖' },
    { key: 'dresses', label: 'Dresses', emoji: '👗' },
    { key: 'shoes', label: 'Shoes', emoji: '👟' },
    { key: 'outerwear', label: 'Outerwear', emoji: '🧥' },
    { key: 'accessories', label: 'Accessories', emoji: '👜' },
  ];

  const handleSelectItem = (item: ClothingItem) => {
    // Check if item is already selected
    if (selectedItems.some(i => i.id === item.id)) {
      console.log('⚠️ [CATEGORY-SELECTOR] Item already selected:', item.name);
      return;
    }

    const newItems = [...selectedItems, item];
    setSelectedItems(newItems);
    setExpandedCategory(null); // Collapse after selection
    onItemsSelected(newItems);
    console.log('✅ [CATEGORY-SELECTOR] Item selected:', item.name, 'Total:', newItems.length);
  };

  const handleRemoveItem = (itemId: string) => {
    const newItems = selectedItems.filter(i => i.id !== itemId);
    setSelectedItems(newItems);
    onItemsSelected(newItems);
    console.log('❌ [CATEGORY-SELECTOR] Item removed, Total:', newItems.length);
  };

  const getCategoryItems = (categoryKey: string) => {
    return closetItems.filter(item => {
      if (categoryKey === 'tops') {
        return item.category === 'tops';
      }
      if (categoryKey === 'dresses') {
        return item.category === 'dresses';
      }
      if (categoryKey === 'bottoms') {
        return item.category === 'bottoms';
      }
      if (categoryKey === 'shoes') {
        return item.category === 'shoes';
      }
      if (categoryKey === 'outerwear') {
        return item.category === 'outerwear';
      }
      if (categoryKey === 'accessories') {
        return item.category === 'accessories' || item.category === 'bags';
      }
      return false;
    });
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900">Select outfit items:</h4>
      
      {/* Category Buttons */}
      {categories.map(category => {
        const categoryItems = getCategoryItems(category.key);
        const isExpanded = expandedCategory === category.key;
        const hasSelection = selectedItems.some(item => {
          if (category.key === 'tops') return item.category === 'tops';
          if (category.key === 'dresses') return item.category === 'dresses';
          if (category.key === 'bottoms') return item.category === 'bottoms';
          if (category.key === 'shoes') return item.category === 'shoes';
          if (category.key === 'outerwear') return item.category === 'outerwear';
          if (category.key === 'accessories') return item.category === 'accessories' || item.category === 'bags';
          return false;
        });

        if (categoryItems.length === 0) return null; // Skip empty categories

        return (
          <div key={category.key}>
            <button
              type="button"
              onClick={() => setExpandedCategory(isExpanded ? null : category.key)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                hasSelection
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-2xl">{category.emoji}</span>
                <span className="font-medium">{category.label}</span>
                <span className="text-xs text-gray-500">({categoryItems.length})</span>
                {hasSelection && (
                  <span className="text-xs text-green-600 font-semibold">✓</span>
                )}
              </span>
              {isExpanded ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>

            {/* Expanded Items Grid */}
            {isExpanded && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                {categoryItems.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {categoryItems.map(item => {
                      const isSelected = selectedItems.some(i => i.id === item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectItem(item)}
                          disabled={isSelected}
                          className={`group cursor-pointer relative ${isSelected ? 'opacity-50' : ''}`}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden bg-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all border-2 border-transparent group-hover:border-purple-300">
                            <img
                              src={item.thumbnail_url || item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                <span className="text-2xl">✓</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {item.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No items in this category
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Selected Items Display */}
      {selectedItems.length > 0 && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
          <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>Selected Items ({selectedItems.length})</span>
          </h5>
          <div className="space-y-2">
            {selectedItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm">
                <img
                  src={item.thumbnail_url || item.image_url}
                  alt={item.name}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
                <span className="flex-1 text-sm text-gray-900 truncate">{item.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  title="Remove item"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
