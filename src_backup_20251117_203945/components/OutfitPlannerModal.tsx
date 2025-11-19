import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Search,
  Check,
  Shirt,
  Package,
  Glasses,
  Footprints,
  Zap,
  Sparkles
} from 'lucide-react';
import ClosetService, { ClothingItem, ClothingCategory, DailyOutfit, DayOfWeek } from '../services/closetService';
import { glassModalClasses } from '../styles/glassEffects';

interface OutfitPlannerModalProps {
  isOpen: boolean;
  day: DayOfWeek;
  currentOutfit: DailyOutfit;
  onSave: (items: ClothingItem[], notes?: string) => void;
  onClose: () => void;
}

const OutfitPlannerModal: React.FC<OutfitPlannerModalProps> = ({
  isOpen,
  day,
  currentOutfit,
  onSave,
  onClose
}) => {
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>(currentOutfit.items || []);
  const [notes, setNotes] = useState(currentOutfit.notes || '');
  const [activeCategory, setActiveCategory] = useState<ClothingCategory>('shirts');
  const [searchQuery, setSearchQuery] = useState('');
  const [closet, setCloset] = useState(ClosetService.getUserCloset());

  const dayLabels: Record<DayOfWeek, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  const categories: Array<{
    key: ClothingCategory;
    label: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    { key: 'shirts', label: 'Shirts', icon: <Shirt className="w-4 h-4" />, color: 'blue' },
    { key: 'tops', label: 'Tops', icon: <Package className="w-4 h-4" />, color: 'purple' },
    { key: 'pants', label: 'Pants', icon: <Package className="w-4 h-4" />, color: 'green' },
    { key: 'dresses', label: 'Dresses', icon: <Sparkles className="w-4 h-4" />, color: 'pink' },
    { key: 'skirts', label: 'Skirts', icon: <Zap className="w-4 h-4" />, color: 'yellow' },
    { key: 'outerwear', label: 'Outerwear', icon: <Package className="w-4 h-4" />, color: 'gray' },
    { key: 'shoes', label: 'Shoes', icon: <Footprints className="w-4 h-4" />, color: 'orange' },
    { key: 'accessories', label: 'Accessories', icon: <Glasses className="w-4 h-4" />, color: 'indigo' }
  ];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItems(currentOutfit.items || []);
      setNotes(currentOutfit.notes || '');
      setSearchQuery('');
      setCloset(ClosetService.getUserCloset());
    }
  }, [isOpen, currentOutfit]);

  const getCategoryItems = (): ClothingItem[] => {
    let items = closet[activeCategory] || [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    return items;
  };

  const isItemSelected = (item: ClothingItem): boolean => {
    return selectedItems.some(selected => selected.id === item.id);
  };

  const toggleItemSelection = (item: ClothingItem) => {
    if (isItemSelected(item)) {
      setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems(prev => [...prev, item]);
    }
  };

  const removeSelectedItem = (itemId: string | number) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSave = () => {
    onSave(selectedItems, notes);
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 ios-blur bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="ios-card ios-slide-up max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-ios-separator">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="ios-large-title">
                Plan Outfit for {dayLabels[day]}
              </h2>
              <p className="ios-body text-ios-label-secondary">Select items from your closet</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-ios-fill rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-200px)]">
          {/* Left Side - Closet Items */}
          <div className="flex-1 p-6 border-r border-ios-separator">
            {/* Category Tabs */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(category => {
                  const count = closet[category.key]?.length || 0;
                  const isActive = activeCategory === category.key;

                  return (
                    <button
                      key={category.key}
                      onClick={() => setActiveCategory(category.key)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? `bg-${category.color}-100 text-${category.color}-700 border border-${category.color}-200`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category.icon}
                      <span>{category.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive ? `bg-${category.color}-200` : 'bg-gray-200'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ios-label-tertiary" />
                <input
                  type="text"
                  placeholder={`Search ${categories.find(c => c.key === activeCategory)?.label.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ios-input w-full pl-10"
                />
              </div>
            </div>

            {/* Items Grid */}
            <div className="h-full overflow-y-auto">
              {getCategoryItems().length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Package className="w-8 h-8 mb-2 opacity-50" />
                  <p>No {activeCategory} found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {getCategoryItems().map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleItemSelection(item)}
                      className={`relative group cursor-pointer bg-gray-50 rounded-xl overflow-hidden border-2 transition-all ${
                        isItemSelected(item)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>

                      {/* Selection Indicator */}
                      {isItemSelected(item) && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      )}

                      <div className="p-2">
                        <h4 className="font-medium text-sm text-gray-800 truncate">{item.name}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Selected Outfit */}
          <div className="w-full lg:w-80 p-6 bg-ios-fill">
            <div className="h-full flex flex-col">
              <h3 className="ios-title-2 mb-4">
                Selected Items ({selectedItems.length})
              </h3>

              {/* Selected Items */}
              <div className="flex-1 overflow-y-auto mb-4">
                {selectedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-center">No items selected<br />Choose items from your closet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate">{item.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                        </div>
                        <button
                          onClick={() => removeSelectedItem(item.id)}
                          className="text-red-600 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block ios-subheadline font-semibold mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this outfit..."
                  className="ios-input w-full resize-none"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  className="ios-button-primary flex-1 flex items-center justify-center space-x-2"
                >
                  <Check className="w-5 h-5" />
                  <span>Save Outfit</span>
                </button>
                <button
                  onClick={handleClose}
                  className="ios-button-secondary px-4"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutfitPlannerModal;