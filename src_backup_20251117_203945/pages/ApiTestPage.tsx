/**
 * API Test Page
 * Dedicated page for testing API connections
 */

import React from 'react';
import ApiTestComponent from '../components/ApiTestComponent';
import SimpleApiTest from '../components/SimpleApiTest';

const ApiTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🔧 API Connection Tests
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Verify that your fal.ai and Claude API keys are working correctly before proceeding
            with shopping feature development.
          </p>
        </div>

        {/* Quick Test */}
        <div className="mb-8">
          <SimpleApiTest />
        </div>

        {/* Comprehensive Test */}
        <ApiTestComponent />

        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl mx-auto shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">What these tests check:</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="font-semibold text-blue-600 mb-2">🎨 fal.ai API Test</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Verifies API key is configured</li>
                  <li>• Tests image generation with nano-banana model</li>
                  <li>• Measures response time</li>
                  <li>• Confirms image output</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-purple-600 mb-2">🤖 Claude API Test</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Verifies API key is configured</li>
                  <li>• Tests message generation with Claude Haiku</li>
                  <li>• Measures response time</li>
                  <li>• Confirms text output</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;