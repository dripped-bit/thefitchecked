/**
 * External Try-On Modal
 * Modal for handling virtual try-on of external products from search results
 */

import React, { useState } from 'react';
import { X, User, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import externalTryOnService, { ExternalTryOnResult } from '../services/externalTryOnService';
import { ProductSearchResult } from '../services/perplexityService';
import { affiliateLinkService } from '../services/affiliateLinkService';

interface ExternalTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductSearchResult;
  avatarData: any;
  onTryOnComplete?: (result: ExternalTryOnResult) => void;
  onSaveToCalendar?: (productUrl: string) => void;
}

const ExternalTryOnModal: React.FC<ExternalTryOnModalProps> = ({
  isOpen,
  onClose,
  product,
  avatarData,
  onTryOnComplete,
  onSaveToCalendar
}) => {
  const [tryOnState, setTryOnState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [tryOnResult, setTryOnResult] = useState<ExternalTryOnResult | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [showCalendarPrompt, setShowCalendarPrompt] = useState(false);

  if (!isOpen) return null;

  const handleStartTryOn = async () => {
    if (!avatarData?.imageUrl) {
      setTryOnState('error');
      setTryOnResult({
        success: false,
        error: 'Avatar not available. Please create an avatar first.',
        originalProduct: product
      });
      return;
    }

    setTryOnState('processing');
    setProcessingStep('Validating product image...');

    try {
      // Start the external try-on process
      const result = await externalTryOnService.tryOnExternalProduct(
        avatarData.imageUrl,
        product
      );

      setTryOnResult(result);

      if (result.success) {
        setTryOnState('success');
        setProcessingStep('Try-on completed successfully!');

        // Notify parent component
        if (onTryOnComplete) {
          onTryOnComplete(result);
        }
      } else {
        setTryOnState('error');
        setProcessingStep('Try-on failed');
      }

    } catch (error) {
      console.error('❌ [EXTERNAL-TRYON-MODAL] Try-on failed:', error);
      setTryOnState('error');
      setTryOnResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        originalProduct: product
      });
      setProcessingStep('Try-on failed');
    }
  };

  const handleClose = () => {
    setTryOnState('idle');
    setTryOnResult(null);
    setProcessingStep('');
    onClose();
  };

  const renderContent = () => {
    switch (tryOnState) {
      case 'idle':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Try On This Item</h3>
            <p className="text-gray-600 mb-6">
              See how "{product.title}" from {product.store} looks on your avatar
            </p>

            {/* Product Preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-4">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="text-left flex-1">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                    {product.title}
                  </h4>
                  <p className="text-sm text-gray-600">{product.store}</p>
                  <p className="text-sm font-semibold text-gray-900">{product.price}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTryOn}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                <User className="w-4 h-4 mr-2" />
                Start Try-On
              </button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Try-On</h3>
            <p className="text-gray-600 mb-4">
              {processingStep || 'Please wait while we process your virtual try-on...'}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
            <p className="text-sm text-gray-500">This usually takes 5-10 seconds</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Try-On Complete!</h3>
            <p className="text-gray-600 mb-6">Here's how the item looks on your avatar</p>

            {/* Show the result image */}
            {tryOnResult?.finalImageUrl && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <img
                  src={tryOnResult.finalImageUrl}
                  alt="Try-on result"
                  className="w-full max-w-sm mx-auto rounded-lg shadow-md"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Calendar prompt inline */}
            {showCalendarPrompt && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-900 mb-3">
                  Add this product link to your calendar?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (onSaveToCalendar && product.url) {
                        const affiliateUrl = affiliateLinkService.convertToAffiliateLink(
                          product.url,
                          product.store || 'unknown'
                        );
                        onSaveToCalendar(affiliateUrl);
                      }
                      setShowCalendarPrompt(false);
                      handleClose();
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Yes, Add to Calendar
                  </button>
                  <button
                    onClick={() => setShowCalendarPrompt(false)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    No Thanks
                  </button>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
              <button
                onClick={() => {
                  if (product.url) {
                    const affiliateUrl = affiliateLinkService.convertToAffiliateLink(
                      product.url,
                      product.store || 'unknown'
                    );
                    affiliateLinkService.trackClick(affiliateUrl, undefined, product);
                    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');

                    // Show calendar prompt after opening shop link
                    setShowCalendarPrompt(true);
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Shop This Product
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Try-On Failed</h3>
            <p className="text-gray-600 mb-6">
              {tryOnResult?.error || 'Something went wrong during the try-on process.'}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">What you can try:</h4>
              <ul className="text-sm text-gray-600 text-left space-y-1">
                <li>• Ensure you have a clear avatar image</li>
                <li>• Try with a different product image</li>
                <li>• Check your internet connection</li>
                <li>• Contact support if the issue persists</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setTryOnState('idle');
                  setTryOnResult(null);
                  setProcessingStep('');
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={tryOnState === 'processing'}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="pt-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ExternalTryOnModal;