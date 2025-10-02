/**
 * Enhanced Prompt Test Component
 * Test the new Claude API-powered prompt generation with negative prompts
 */

import React, { useState } from 'react';
import { Sparkles, Brain, AlertCircle, CheckCircle, X } from 'lucide-react';
import enhancedPromptGenerationService, { EnhancedPromptResult } from '../services/enhancedPromptGenerationService';

const EnhancedPromptTest: React.FC = () => {
  const [userPrompt, setUserPrompt] = useState('red dress');
  const [style, setStyle] = useState('casual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<EnhancedPromptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!userPrompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const enhancedResult = await enhancedPromptGenerationService.generateEnhancedPrompt({
        userRequest: userPrompt,
        style: style as any,
        gender: 'unisex',
        occasion: 'everyday',
        timeOfDay: 'day',
        season: 'current'
      });

      setResult(enhancedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearCache = () => {
    enhancedPromptGenerationService.clearCache();
    alert('Cache cleared!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Enhanced Prompt Generator</h1>
            <p className="text-gray-600">Test Claude API-powered prompt enhancement with negative prompts</p>
          </div>
        </div>

        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Prompt
            </label>
            <input
              type="text"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g., red dress, blue jeans, casual shirt"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
              <option value="trendy">Trendy</option>
              <option value="vintage">Vintage</option>
              <option value="minimalist">Minimalist</option>
              <option value="edgy">Edgy</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !userPrompt.trim()}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Enhanced Prompt</span>
              </>
            )}
          </button>

          <button
            onClick={handleClearCache}
            className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
          >
            <X className="w-4 h-4" />
            <span>Clear Cache</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-red-800 font-medium">Error</h3>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">Enhanced Prompt Result</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              result.confidence >= 80 ? 'bg-green-100 text-green-800' :
              result.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {result.confidence}% Confidence
            </span>
          </div>

          {/* Main Prompt */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">🎯 Enhanced Main Prompt</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-gray-800">{result.mainPrompt}</p>
            </div>
          </div>

          {/* Negative Prompt */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">🚫 Negative Prompt</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-gray-800">{result.negativePrompt}</p>
            </div>
          </div>

          {/* Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clothing Items */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">👔 Clothing Items</h4>
              <div className="space-y-1">
                {result.clothing_items.length > 0 ? (
                  result.clothing_items.map((item, index) => (
                    <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No specific items identified</p>
                )}
              </div>
            </div>

            {/* Colors */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🎨 Colors</h4>
              <div className="space-y-1">
                {result.colors.length > 0 ? (
                  result.colors.map((color, index) => (
                    <span key={index} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                      {color}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No specific colors identified</p>
                )}
              </div>
            </div>

            {/* Materials */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🧵 Materials</h4>
              <div className="space-y-1">
                {result.materials.length > 0 ? (
                  result.materials.map((material, index) => (
                    <span key={index} className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                      {material}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No specific materials identified</p>
                )}
              </div>
            </div>

            {/* Unwanted Items */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">⛔ Items to Avoid</h4>
              <div className="space-y-1">
                {result.unwanted_items.length > 0 ? (
                  result.unwanted_items.map((item, index) => (
                    <span key={index} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No specific items to avoid</p>
                )}
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🧠 AI Reasoning</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700">{result.reasoning}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPromptTest;