/**
 * Category Selector Component
 * Simple modal for selecting clothing category before adding to closet
 */

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { ClothingCategory } from '../services/closetService';

interface CategorySelectorProps {
  onConfirm: (category: ClothingCategory, imageUrl: string) => void;
  imageUrl: string;
  onCancel?: () => void;
  suggestedCategory?: ClothingCategory;
}

const CLOTHING_CATEGORIES: Array<{ value: ClothingCategory; label: string }> = [
  { value: 'tops', label: 'Tops/Shirts' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'pants', label: 'Pants' },
  { value: 'skirts', label: 'Skirts' },
  { value: 'outerwear', label: 'Jackets/Outerwear' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  onConfirm,
  imageUrl,
  onCancel,
  suggestedCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory>(suggestedCategory || 'tops');

  const handleConfirm = () => {
    console.log('🏷️ Category selected:', selectedCategory);
    onConfirm(selectedCategory, imageUrl);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Categorize Your Item</h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preview Image */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md bg-gray-50">
              <img
                src={imageUrl}
                alt="Item preview"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ClothingCategory)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg bg-white hover:border-gray-400 transition-colors"
            >
              {CLOTHING_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 bg-white text-gray-700 py-3 px-4 rounded-xl font-semibold border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Add to Closet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategorySelector;
