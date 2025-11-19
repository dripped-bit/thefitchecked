import React, { useState } from 'react';

const ApiTestPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testFalApi = async () => {
    console.log('🧪 [API-TEST-PAGE] Starting FAL API test...');
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const testRequest = {
        prompt: 'simple test image of a person standing',
        image_size: { width: 512, height: 512 },
        num_images: 1,
        enable_safety_checker: false
      };

      console.log('📤 [API-TEST-PAGE] Sending request to:', '/api/fal/fal-ai/bytedance/seedream/v4/text-to-image');
      console.log('📋 [API-TEST-PAGE] Request data:', testRequest);

      const response = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequest)
      });

      console.log('📊 [API-TEST-PAGE] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [API-TEST-PAGE] API Error:', errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [API-TEST-PAGE] Success! Response:', data);

      setResult(data);

    } catch (err) {
      console.error('❌ [API-TEST-PAGE] Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const testCgiService = async () => {
    console.log('🧪 [API-TEST-PAGE] Testing CGI Service...');
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { cgiAvatarGenerationService } = await import('../services/cgiAvatarGenerationService');
      const testResult = await cgiAvatarGenerationService.testConnection();

      console.log('📊 [API-TEST-PAGE] CGI Service result:', testResult);
      setResult(testResult);

    } catch (err) {
      console.error('❌ [API-TEST-PAGE] CGI Service test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-600">
          🧪 API Test Page
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">FAL API Tests</h2>

          <div className="space-y-4">
            <button
              onClick={testFalApi}
              disabled={isLoading}
              className="w-full py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? '🔄 Testing...' : '🧪 Test FAL API Direct'}
            </button>

            <button
              onClick={testCgiService}
              disabled={isLoading}
              className="w-full py-3 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? '🔄 Testing...' : '🎨 Test CGI Service'}
            </button>
          </div>
        </div>

        {/* Results Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-red-800 mb-2">❌ Test Failed</h3>
            <p className="text-red-700 font-mono text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-green-800 mb-4">✅ Test Results</h3>

            {result.success === false ? (
              <div className="text-red-700">
                <p className="font-semibold">Failed:</p>
                <p className="font-mono text-sm">{result.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {result.images && result.images.length > 0 && (
                  <div>
                    <p className="font-semibold text-green-700 mb-2">
                      🎉 SUCCESS! Generated {result.images.length} image(s)
                    </p>
                    {result.images.map((img: any, index: number) => (
                      <div key={index} className="border rounded p-2 mb-2">
                        <p className="text-sm text-gray-600">Image {index + 1}:</p>
                        <p className="font-mono text-xs break-all">{img.url}</p>
                        {img.url && (
                          <img
                            src={img.url}
                            alt={`Generated image ${index + 1}`}
                            className="mt-2 max-w-full h-auto rounded"
                            style={{ maxHeight: '300px' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-gray-100 rounded p-4">
                  <p className="font-semibold mb-2">Full Response:</p>
                  <pre className="text-xs overflow-auto bg-white p-2 rounded border">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">📋 Instructions</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• Click "Test FAL API Direct" to test the proxy connection</li>
            <li>• Click "Test CGI Service" to test the CGI avatar service</li>
            <li>• Check browser console (F12) for detailed logs</li>
            <li>• Look for proxy requests in the terminal</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← Back to App
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPage;