/**
 * API Test Component
 * Simple UI to test both fal.ai and Claude API connections
 */

import React, { useState } from 'react';
import { runApiTestSuite, printTestResults, ApiTestSuite } from '../utils/apiTest';

const ApiTestComponent: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ApiTestSuite | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      console.log('🚀 Starting API tests from UI...');
      const testResults = await runApiTestSuite();
      setResults(testResults);
      printTestResults(testResults);
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🔧 API Connection Test</h2>
      <p className="text-gray-600 mb-6">
        Test your fal.ai and Claude API connections before building shopping features.
      </p>

      <button
        onClick={runTests}
        disabled={isRunning}
        className={`
          w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300
          ${isRunning
            ? 'bg-gray-400 cursor-not-allowed text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
          }
        `}
      >
        {isRunning ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Testing APIs...</span>
          </div>
        ) : (
          'Run API Tests'
        )}
      </button>

      {/* Results Display */}
      {results && (
        <div className="mt-6 space-y-4">
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Results</h3>

            {/* fal.ai Results */}
            <div className={`p-4 rounded-lg border ${results.fal.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">fal.ai API</h4>
                <span className={`px-2 py-1 rounded text-sm font-semibold ${results.fal.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {results.fal.success ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="text-gray-700 mt-1">{results.fal.message}</p>
              <p className="text-sm text-gray-500 mt-1">Response time: {results.fal.responseTime}ms</p>
              {results.fal.error && (
                <p className="text-sm text-red-600 mt-1">Error: {results.fal.error}</p>
              )}
            </div>

            {/* Claude Results */}
            <div className={`p-4 rounded-lg border ${results.claude.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">Claude API</h4>
                <span className={`px-2 py-1 rounded text-sm font-semibold ${results.claude.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {results.claude.success ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <p className="text-gray-700 mt-1">{results.claude.message}</p>
              <p className="text-sm text-gray-500 mt-1">Response time: {results.claude.responseTime}ms</p>
              {results.claude.error && (
                <p className="text-sm text-red-600 mt-1">Error: {results.claude.error}</p>
              )}
            </div>

            {/* Overall Summary */}
            <div className={`p-4 rounded-lg border ${results.overall.success ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <h4 className="font-semibold text-gray-800">Overall Status</h4>
              <p className="text-gray-700 mt-1">{results.overall.summary}</p>
              {results.overall.success && (
                <p className="text-sm text-green-600 mt-2 font-semibold">
                  ✅ Ready to proceed with shopping feature development!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>💡 This test verifies that both API keys are correctly configured and working.</p>
        <p>Check the browser console for detailed logs.</p>
      </div>
    </div>
  );
};

export default ApiTestComponent;