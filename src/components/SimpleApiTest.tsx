/**
 * Simple API Test Component
 * Quick and easy way to test both API keys
 */

import React, { useState } from 'react';
import { testBothApis, quickApiCheck, logApiStatus, SimpleTestResult } from '../utils/simpleApiTest';

const SimpleApiTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimpleTestResult | null>(null);

  // Quick check on component mount
  React.useEffect(() => {
    logApiStatus();
  }, []);

  const runTest = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const testResults = await testBothApis();
      setResults(testResults);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const quickCheck = quickApiCheck();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">🔧 Quick API Test</h2>

      {/* Quick Status Check */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Configuration Status:</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>fal.ai:</span>
            <span className={quickCheck.fal ? 'text-green-600' : 'text-red-600'}>
              {quickCheck.fal ? '✅ Ready' : '❌ Missing'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Claude:</span>
            <span className={quickCheck.claude ? 'text-green-600' : 'text-red-600'}>
              {quickCheck.claude ? '✅ Ready' : '❌ Missing'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={runTest}
        disabled={isRunning || !quickCheck.both}
        className={`
          w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200
          ${isRunning || !quickCheck.both
            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
            : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
          }
        `}
      >
        {isRunning ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Testing APIs...</span>
          </div>
        ) : !quickCheck.both ? (
          'Configure API Keys First'
        ) : (
          'Test Both APIs'
        )}
      </button>

      {/* Results */}
      {results && (
        <div className="mt-4 space-y-3">
          <div className="border-t pt-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Test Results:</h3>

            {/* fal.ai Result */}
            <div className={`p-2 rounded text-sm ${
              results.falApi.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="font-medium">fal.ai API</div>
              <div className="text-xs">{results.falApi.message}</div>
              {results.falApi.error && (
                <div className="text-xs opacity-75 mt-1">Error: {results.falApi.error}</div>
              )}
            </div>

            {/* Claude Result */}
            <div className={`p-2 rounded text-sm ${
              results.claudeApi.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="font-medium">Claude API</div>
              <div className="text-xs">{results.claudeApi.message}</div>
              {results.claudeApi.response && (
                <div className="text-xs mt-1 font-mono bg-white/50 p-1 rounded">
                  "{results.claudeApi.response}"
                </div>
              )}
              {results.claudeApi.error && (
                <div className="text-xs opacity-75 mt-1">Error: {results.claudeApi.error}</div>
              )}
            </div>

            {/* Overall Status */}
            <div className={`p-2 rounded text-sm font-medium ${
              results.overall.success
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              {results.overall.summary}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        💡 Check browser console for detailed logs
      </div>
    </div>
  );
};

export default SimpleApiTest;