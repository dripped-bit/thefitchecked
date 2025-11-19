/**
 * Red Shoe Test Component
 * UI for testing the red shoe generation with specific prompts
 */

import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { testRedShoeGeneration, testRedShoeGenerationWithRetry, testRedShoeVariations, RedShoeTestResult } from '../utils/redShoeTest';

const RedShoeTestComponent: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [singleResult, setSingleResult] = useState<RedShoeTestResult | null>(null);
  const [retryResult, setRetryResult] = useState<RedShoeTestResult | null>(null);
  const [variationResults, setVariationResults] = useState<RedShoeTestResult[]>([]);
  const [activeTest, setActiveTest] = useState<'single' | 'retry' | 'variations' | null>(null);

  const handleSingleTest = async () => {
    setIsTesting(true);
    setActiveTest('single');
    setSingleResult(null);

    try {
      const result = await testRedShoeGeneration();
      setSingleResult(result);
    } catch (error) {
      setSingleResult({
        success: false,
        prompt: 'person wearing ONLY red shoes, bare legs, clean background, focus on footwear',
        negativePrompt: 'borrowing shirt, t-shirt, extra clothing, unwanted garments',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTesting(false);
      setActiveTest(null);
    }
  };

  const handleRetryTest = async () => {
    setIsTesting(true);
    setActiveTest('retry');
    setRetryResult(null);

    try {
      const result = await testRedShoeGenerationWithRetry(3);
      setRetryResult(result);
    } catch (error) {
      setRetryResult({
        success: false,
        prompt: 'person wearing ONLY red shoes, bare legs, clean background, focus on footwear',
        negativePrompt: 'borrowing shirt, t-shirt, extra clothing, unwanted garments',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTesting(false);
      setActiveTest(null);
    }
  };

  const handleVariationsTest = async () => {
    setIsTesting(true);
    setActiveTest('variations');
    setVariationResults([]);

    try {
      const results = await testRedShoeVariations();
      setVariationResults(results);
    } catch (error) {
      console.error('Variations test failed:', error);
    } finally {
      setIsTesting(false);
      setActiveTest(null);
    }
  };

  const ResultCard = ({ result, title }: { result: RedShoeTestResult; title: string }) => (
    <div className={`border rounded-lg p-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center space-x-2 mb-3">
        {result.success ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600" />
        )}
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="text-sm text-gray-500">
          {new Date(result.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {result.success && result.imageUrl && (
        <div className="mb-4">
          <img
            src={result.imageUrl}
            alt="Generated red shoe"
            className="max-w-full h-auto rounded-lg border border-gray-200 max-h-96"
            onError={(e) => {
              console.error('Image failed to load:', result.imageUrl);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-700">Prompt:</span>
          <p className="text-gray-600 bg-white p-2 rounded border mt-1">{result.prompt}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Negative Prompt:</span>
          <p className="text-gray-600 bg-white p-2 rounded border mt-1">{result.negativePrompt}</p>
        </div>
        {result.error && (
          <div>
            <span className="font-medium text-red-700">Error:</span>
            <p className="text-red-600 bg-white p-2 rounded border mt-1">{result.error}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-red-800 mb-2">🔴 Red Shoe Test Lab</h1>
        <p className="text-red-700">
          Test specific prompts and negative prompts to fix unwanted clothing items in fal.ai Seedream generation.
        </p>
        <div className="mt-4 bg-white rounded-lg p-4 border">
          <h3 className="font-semibold text-gray-800 mb-2">Test Prompt:</h3>
          <code className="text-sm text-gray-700 bg-gray-100 p-2 rounded block">
            "person wearing ONLY red shoes, bare legs, clean background, focus on footwear"
          </code>
          <h3 className="font-semibold text-gray-800 mb-2 mt-3">Negative Prompt:</h3>
          <code className="text-sm text-gray-700 bg-gray-100 p-2 rounded block">
            "borrowing shirt, t-shirt, extra clothing, unwanted garments"
          </code>
        </div>
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleSingleTest}
          disabled={isTesting}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {activeTest === 'single' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Testing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Single Test</span>
            </>
          )}
        </button>

        <button
          onClick={handleRetryTest}
          disabled={isTesting}
          className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {activeTest === 'retry' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Retrying...</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>Retry Test (3x)</span>
            </>
          )}
        </button>

        <button
          onClick={handleVariationsTest}
          disabled={isTesting}
          className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {activeTest === 'variations' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Testing Variations...</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              <span>Test Variations</span>
            </>
          )}
        </button>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {/* Single Test Result */}
        {singleResult && (
          <ResultCard result={singleResult} title="Single Test Result" />
        )}

        {/* Retry Test Result */}
        {retryResult && (
          <ResultCard result={retryResult} title="Retry Test Result (3 attempts)" />
        )}

        {/* Variations Results */}
        {variationResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Prompt Variations Results</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {variationResults.map((result, index) => (
                <ResultCard
                  key={index}
                  result={result}
                  title={`Variation ${index + 1}`}
                />
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Summary</h3>
              <p className="text-blue-700">
                {variationResults.filter(r => r.success).length} out of {variationResults.length} variations succeeded
                ({Math.round((variationResults.filter(r => r.success).length / variationResults.length) * 100)}% success rate)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Instructions</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li><strong>Single Test:</strong> Test the exact prompt once</li>
          <li><strong>Retry Test:</strong> Test with retry logic (up to 3 attempts)</li>
          <li><strong>Test Variations:</strong> Test multiple prompt variations to find the best approach</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          These functions are also available in the browser console: <code>testRedShoe()</code>, <code>testRedShoeRetry()</code>, <code>testRedShoeVariations()</code>
        </p>
      </div>
    </div>
  );
};

export default RedShoeTestComponent;