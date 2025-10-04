/**
 * Multi-Item Splitter Component
 * Shows detected items from a multi-item upload and allows user to confirm/adjust the split
 */

import React, { useState } from 'react';
import { X, Check, Split, Merge, AlertCircle } from 'lucide-react';
import { DetectedItem } from '../services/multiItemDetectionService';

interface MultiItemSplitterProps {
  originalImageUrl: string;
  detectedItems: DetectedItem[];
  onConfirmSplit: (items: DetectedItem[]) => void;
  onCancel: () => void;
  onTreatAsSingle: () => void;
}

export const MultiItemSplitter: React.FC<MultiItemSplitterProps> = ({
  originalImageUrl,
  detectedItems,
  onConfirmSplit,
  onCancel,
  onTreatAsSingle
}) => {
  const [selectedItems, setSelectedItems] = useState<DetectedItem[]>(detectedItems);

  const handleConfirm = () => {
    console.log('✅ [MULTI-ITEM-SPLITTER] User confirmed split:', selectedItems.length, 'items');
    onConfirmSplit(selectedItems);
  };

  const handleToggleItem = (index: number) => {
    setSelectedItems(prev => {
      const newItems = [...prev];
      // Mark item as deselected by setting confidence to 0
      newItems[index] = {
        ...newItems[index],
        confidence: newItems[index].confidence > 0 ? 0 : 0.9
      };
      return newItems;
    });
  };

  const activeItems = selectedItems.filter(item => item.confidence > 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Split className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Multiple Items Detected!</h2>
                <p className="text-sm text-gray-600">
                  We found {detectedItems.length} items in your image
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Review the detected items below</p>
              <p>Confirm to add each item separately to your closet, or treat as a single item.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Original Image Preview */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Original Image
            </h3>
            <div className="relative bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-300">
              <img
                src={originalImageUrl}
                alt="Original upload"
                className="w-full h-auto max-h-64 object-contain"
              />
            </div>
          </div>

          {/* Detected Items Grid */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Detected Items ({activeItems.length} selected)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {detectedItems.map((item, index) => {
                const isSelected = selectedItems[index].confidence > 0;
                return (
                  <div
                    key={index}
                    className={`relative rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-300 bg-gray-50 opacity-50'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => handleToggleItem(index)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border-2 border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Item Preview */}
                    <div className="p-4">
                      <div className="aspect-square bg-white rounded-lg overflow-hidden mb-3 border border-gray-200">
                        {item.croppedImageUrl ? (
                          <img
                            src={item.croppedImageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Split className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      {/* Item Info */}
                      <div>
                        <p className="font-semibold text-gray-800 text-sm mb-1 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 capitalize">{item.category}</span>
                          <span className="text-gray-500">
                            {Math.round(item.confidence * 100)}% confident
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white text-gray-700 py-3 px-4 rounded-xl font-semibold border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onTreatAsSingle}
            className="flex-1 bg-white text-gray-700 py-3 px-4 rounded-xl font-semibold border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center space-x-2"
          >
            <Merge className="w-5 h-5" />
            <span>Treat as Single Item</span>
          </button>
          <button
            onClick={handleConfirm}
            disabled={activeItems.length === 0}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-5 h-5" />
            <span>Split into {activeItems.length} Items</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiItemSplitter;
