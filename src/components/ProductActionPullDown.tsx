/**
 * Product Action Sheet
 * iOS-style action sheet that appears after user closes a product browser
 * Centered modal with 30% pink opacity background and black text
 * Options: Save to Calendar, Generate New, Cancel
 * Follows Apple HIG for action sheets
 */

import React, { useState } from 'react';
import { Check } from 'lucide-react';

export interface ClickedProduct {
  url: string;
  title: string;
  imageUrl?: string;
  store?: string;
  price?: string;
}

interface ProductActionPullDownProps {
  isOpen: boolean;
  onSaveToCalendar: (selectedProduct?: ClickedProduct) => void;
  onGenerateNew: () => void;
  productTitle?: string;
  clickedProducts?: ClickedProduct[];
}

const ProductActionPullDown: React.FC<ProductActionPullDownProps> = ({
  isOpen,
  onSaveToCalendar,
  onGenerateNew,
  productTitle,
  clickedProducts = []
}) => {
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(
    clickedProducts.length > 0 ? clickedProducts.length - 1 : 0
  );

  const handleSaveToCalendar = () => {
    const selectedProduct = clickedProducts.length > 0
      ? clickedProducts[selectedProductIndex]
      : undefined;
    onSaveToCalendar(selectedProduct);
  };

  const handleCancel = () => {
    onGenerateNew(); // Close modal by calling the same handler as Generate New
  };

  const showProductPicker = clickedProducts.length > 1;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)'
      }}
      onClick={handleCancel}
    >
      {/* Centered Modal Box - 30% Pink Opacity */}
      <div
        className="relative max-w-md w-full mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: 'rgba(255, 192, 203, 0.3)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <h3 className="text-lg font-semibold" style={{ color: '#000' }}>
            {clickedProducts.length > 1
              ? 'Select a product to save'
              : productTitle
              ? 'What would you like to do?'
              : 'Choose an action'}
          </h3>
        </div>

        {/* Product Image Picker - Only show if multiple products */}
        {showProductPicker && (
          <div className="px-6 pb-4">
            <div className="grid grid-cols-3 gap-3">
              {clickedProducts.map((product, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedProductIndex(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedProductIndex === index
                      ? 'border-pink-600 ring-2 ring-pink-300'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      👕
                    </div>
                  )}
                  {selectedProductIndex === index && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255, 105, 180, 0.2)' }}
                    >
                      <div
                        className="rounded-full p-1"
                        style={{ backgroundColor: '#FF69B4' }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-1 py-1"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)'
                    }}
                  >
                    <p className="text-white text-xs font-medium truncate">
                      {product.store}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {clickedProducts[selectedProductIndex] && (
              <div className="mt-3 text-center">
                <p className="text-sm font-medium line-clamp-2" style={{ color: '#000' }}>
                  {clickedProducts[selectedProductIndex].title}
                </p>
                {clickedProducts[selectedProductIndex].price && (
                  <p className="text-xs mt-1" style={{ color: '#333' }}>
                    {clickedProducts[selectedProductIndex].price}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          {/* Primary Action - Save to Calendar */}
          <button
            onClick={handleSaveToCalendar}
            className="w-full py-3 px-4 rounded-xl font-semibold text-base transition-all active:scale-95"
            style={{
              backgroundColor: '#000',
              color: '#FFF'
            }}
          >
            {showProductPicker ? 'Save Selected to Calendar' : 'Save to Calendar'}
          </button>

          {/* Secondary Action - Generate New */}
          <button
            onClick={onGenerateNew}
            className="w-full py-3 px-4 rounded-xl font-medium text-base transition-all active:scale-95"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              color: '#000',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}
          >
            Generate New
          </button>

          {/* Cancel */}
          <button
            onClick={handleCancel}
            className="w-full py-3 px-4 rounded-xl font-medium text-base transition-all active:scale-95"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              color: '#000',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductActionPullDown;
