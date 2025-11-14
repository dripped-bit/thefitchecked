/**
 * Multi-Item Confirmation Modal
 * Shows detected items from smart upload and allows user to review/edit before saving
 */

import React, { useState } from 'react';
import { X, Check, Edit2, Sparkles } from 'lucide-react';
import { DetectedItem } from '../services/smartClosetUploadService';

interface MultiItemConfirmationModalProps {
  isOpen: boolean;
  items: DetectedItem[];
  onSaveAll: (items: DetectedItem[]) => void;
  onSaveSelected: (items: DetectedItem[]) => void;
  onCancel: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'tops', label: 'Tops' },
  { value: 'shirts', label: 'Shirts' },
  { value: 'pants', label: 'Pants' },
  { value: 'skirts', label: 'Skirts' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'sweaters', label: 'Sweaters' },
  { value: 'jackets', label: 'Jackets' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' }
];

export const MultiItemConfirmationModal: React.FC<MultiItemConfirmationModalProps> = ({
  isOpen,
  items,
  onSaveAll,
  onSaveSelected,
  onCancel
}) => {
  const [editedItems, setEditedItems] = useState<DetectedItem[]>(items);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(items.map((_, index) => index))
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (index: number, newName: string) => {
    const updated = [...editedItems];
    updated[index] = { ...updated[index], name: newName };
    setEditedItems(updated);
  };

  const handleCategoryChange = (index: number, newCategory: string) => {
    const updated = [...editedItems];
    updated[index] = { ...updated[index], category: newCategory };
    setEditedItems(updated);
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIds(newSelected);
  };

  const handleSaveAll = () => {
    onSaveAll(editedItems);
  };

  const handleSaveSelected = () => {
    const selectedItems = editedItems.filter((_, index) => selectedIds.has(index));
    if (selectedItems.length === 0) {
      alert('Please select at least one item to save');
      return;
    }
    onSaveSelected(selectedItems);
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {items.length} Item{items.length > 1 ? 's' : ''} Detected!
              </h2>
              <p className="text-white/80 text-sm">
                Review and edit before adding to closet
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Items Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {editedItems.map((item, index) => {
              const isSelected = selectedIds.has(index);
              const isEditing = editingIndex === index;

              return (
                <div
                  key={index}
                  className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                    isSelected
                      ? 'border-purple-500 shadow-lg'
                      : 'border-gray-200 opacity-60'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <button
                    onClick={() => toggleSelection(index)}
                    className={`absolute top-3 left-3 z-10 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border-2 border-gray-300'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => setEditingIndex(isEditing ? null : index)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-700" />
                  </button>

                  {/* Image */}
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Badges */}
                    <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap">
                      {item.wasExtractedFromPerson && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium">
                          From Person
                        </span>
                      )}
                      {item.wasSeparated && (
                        <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">
                          Separated
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-medium">
                        {Math.round(item.confidence * 100)}% Match
                      </span>
                    </div>
                  </div>

                  {/* Info/Edit Section */}
                  <div className="p-3 bg-white">
                    {isEditing ? (
                      <>
                        {/* Edit Name */}
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleNameChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                          placeholder="Item name"
                        />
                        
                        {/* Edit Category */}
                        <select
                          value={item.category}
                          onChange={(e) => handleCategoryChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          {CATEGORY_OPTIONS.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-gray-800 text-sm truncate mb-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500 capitalize">
                          {item.category}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-purple-600">{selectedCount}</span> of{' '}
            <span className="font-semibold">{items.length}</span> item
            {items.length > 1 ? 's' : ''} selected
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            {selectedCount < items.length && (
              <button
                onClick={handleSaveSelected}
                disabled={selectedCount === 0}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Selected ({selectedCount})
              </button>
            )}

            <button
              onClick={handleSaveAll}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg"
            >
              Save All {items.length > 1 && `(${items.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiItemConfirmationModal;
