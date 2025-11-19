import React from 'react';
import { Camera, Check } from 'lucide-react';

interface PhotoTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain: () => void;
}

export const PhotoTipsModal: React.FC<PhotoTipsModalProps> = ({
  isOpen,
  onClose,
  onDontShowAgain
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            <Camera className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-3 text-gray-900">
          📸 Photography Tips
        </h2>

        {/* Message */}
        <p className="text-center text-gray-700 mb-4 leading-relaxed">
          For best results, please photograph clothing items{' '}
          <span className="font-semibold text-pink-600">
            laid flat or on a hanger
          </span>
          , not being worn.
        </p>

        {/* Tips */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Flat-lay on bed or floor</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Hanging on door or rack</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Clear, well-lit background</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-center text-gray-500 mb-6 italic">
          Don't worry - you can still crop photos of outfits you're wearing if needed!
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg"
          >
            Got it!
          </button>
          <button
            onClick={onDontShowAgain}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            Don't show this again
          </button>
        </div>
      </div>
    </div>
  );
};
