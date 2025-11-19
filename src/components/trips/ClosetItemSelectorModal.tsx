import { useState, useEffect } from 'react';
import { X, Check, Search } from 'lucide-react';
import { useCloset, ClothingItem, ClothingCategory } from '../../hooks/useCloset';

interface ClosetItemSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: ClothingItem[]) => void;
  alreadySelected: string[];
}

const CATEGORIES: { key: ClothingCategory; label: string; icon: string }[] = [
  { key: 'tops', label: 'Tops', icon: '👕' },
  { key: 'bottoms', label: 'Bottoms', icon: '👖' },
  { key: 'dresses', label: 'Dresses', icon: '👗' },
  { key: 'activewear', label: 'Activewear', icon: '🏃' },
  { key: 'outerwear', label: 'Outerwear', icon: '🧥' },
  { key: 'shoes', label: 'Shoes', icon: '👟' },
  { key: 'accessories', label: 'Accessories', icon: '👜' },
];

export function ClosetItemSelectorModal({
  isOpen,
  onClose,
  onSelect,
  alreadySelected,
}: ClosetItemSelectorModalProps) {
  const { items: closetItems, loading } = useCloset();
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>('tops');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set(alreadySelected));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedItemIds(new Set(alreadySelected));
      setSearchQuery('');
    }
  }, [isOpen, alreadySelected]);

  const filteredItems = closetItems.filter((item) => {
    const matchesCategory = item.category === activeCategory;
    const matchesSearch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (itemId: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedItemIds(newSet);
  };

  const handleSelect = () => {
    const selectedItems = closetItems.filter((item) => selectedItemIds.has(item.id));
    onSelect(selectedItems);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Select Items from Closet</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => {
              const count = closetItems.filter((item) => item.category === category.key).length;
              return (
                <button
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    activeCategory === category.key
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                  <span className="text-sm opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No items found in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const isSelected = selectedItemIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`relative bg-white border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 shadow-lg'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-2 right-2 z-10">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-purple-600' : 'bg-white border-2 border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={item.thumbnail_url || item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
                      {item.brand && <p className="text-xs text-gray-600 truncate">{item.brand}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-gray-600">
              <span className="font-semibold text-purple-600">{selectedItemIds.size}</span> items selected
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSelect}
                disabled={selectedItemIds.size === 0}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add {selectedItemIds.size > 0 ? `${selectedItemIds.size} ` : ''}Items
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
