/**
 * Web-Enhanced Prompt Modal
 * Enhanced UI for displaying web-researched prompt variations
 */

import React, { useState } from 'react';
import { X, Globe, TrendingUp, Settings, Sparkles, CheckCircle } from 'lucide-react';
import { PromptVariation } from '../services/webEnhancedPromptService';
import { glassModalClasses } from '../styles/glassEffects';

interface WebEnhancedPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  variations: PromptVariation[];
  onSelectVariation: (variation: PromptVariation) => void;
  isLoading: boolean;
  originalPrompt: string;
}

const WebEnhancedPromptModal: React.FC<WebEnhancedPromptModalProps> = ({
  isOpen,
  onClose,
  variations,
  onSelectVariation,
  isLoading,
  originalPrompt
}) => {
  const [selectedVariation, setSelectedVariation] = useState<PromptVariation | null>(null);

  if (!isOpen) return null;

  const handleSelectAndGenerate = () => {
    if (selectedVariation) {
      onSelectVariation(selectedVariation);
      onClose();
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'very high': return 'text-green-600 bg-green-100';
      case 'high': return 'text-blue-600 bg-blue-100';
      case 'medium-high': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      case 'detailed': return <Settings className="w-4 h-4" />;
      case 'designer': return <Sparkles className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`${glassModalClasses.light} max-w-4xl w-full max-h-[90vh] overflow-hidden`}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">AI + Web Enhanced Prompts</h2>
                <p className="text-sm text-gray-600">Choose your preferred style based on real fashion trends</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/80 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Original Prompt */}
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Your Original Prompt:</h3>
          <p className="text-gray-800 bg-white p-3 rounded-lg border italic">"{originalPrompt}"</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-600 text-center">
                🌐 Searching the web for current fashion trends...<br />
                <span className="text-sm text-gray-500">Powered by Perplexity - This may take a few seconds</span>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {variations.map((variation, index) => (
                <div
                  key={index}
                  className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    selectedVariation?.title === variation.title
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  onClick={() => setSelectedVariation(variation)}
                >
                  {/* Selection indicator */}
                  {selectedVariation?.title === variation.title && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{variation.icon}</span>
                        {getTypeIcon(variation.type)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">{variation.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(variation.confidence)}`}>
                        {variation.confidence}
                      </span>
                    </div>
                  </div>

                  {/* Source */}
                  <p className="text-sm text-gray-600 mb-3 flex items-center">
                    <Globe className="w-3 h-3 mr-1" />
                    {variation.source}
                  </p>

                  {/* Enhanced Prompt */}
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-gray-800 text-sm leading-relaxed">{variation.prompt}</p>
                  </div>

                  {/* Enhancement tags */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {variation.type === 'trending' && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        Current Trends
                      </span>
                    )}
                    {variation.type === 'detailed' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Technical Details
                      </span>
                    )}
                    {variation.type === 'designer' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        Designer Inspired
                      </span>
                    )}
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Web Enhanced
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              💡 Each variation uses real-time web search results powered by Perplexity to enhance your prompt
            </div>
            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSelectAndGenerate}
                disabled={!selectedVariation}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  selectedVariation
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Generate with Selected Prompt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebEnhancedPromptModal;