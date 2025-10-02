import React, { useState, useRef } from 'react';
import { Upload, Zap, Settings, CheckCircle, AlertCircle, Info, Sparkles } from 'lucide-react';
import { cgiAvatarGenerationService } from '../services/cgiAvatarGenerationService';
import { photoPreprocessingService, PhotoPreprocessingResult } from '../services/photoPreprocessingService';
import { CGIAvatarRequest, CGIAvatarResult, MeasurementData } from '../types/cgiAvatar';

interface CGIAvatarCreatorProps {
  measurements?: MeasurementData;
  onNext: (data: { avatarData: any; measurements: any }) => void;
  onBack?: () => void;
}

interface PhotoUploadState {
  file: File | null;
  url: string | null;
  preprocessing: PhotoPreprocessingResult | null;
  isProcessing: boolean;
  error: string | null;
}

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  stage: string;
  result: CGIAvatarResult | null;
  error: string | null;
}

const CGIAvatarCreator: React.FC<CGIAvatarCreatorProps> = ({ measurements, onNext, onBack }) => {
  const [photoState, setPhotoState] = useState<PhotoUploadState>({
    file: null,
    url: null,
    preprocessing: null,
    isProcessing: false,
    error: null
  });

  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    stage: '',
    result: null,
    error: null
  });

  const [cgiMode, setCgiMode] = useState<'standard' | 'hyperrealistic'>('hyperrealistic');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoState({
      file,
      url: URL.createObjectURL(file),
      preprocessing: null,
      isProcessing: true,
      error: null
    });

    try {
      console.log('📸 [CGI-CREATOR] Starting photo preprocessing for CGI avatar generation');

      const preprocessingResult = await photoPreprocessingService.preprocessPhoto(file, {
        targetResolution: { width: 1024, height: 1024 },
        enableLightingEnhancement: true,
        enableContrastAdjustment: true,
        outputFormat: 'png',
        compressionQuality: 0.95
      });

      console.log('✅ [CGI-CREATOR] Photo preprocessing completed:', preprocessingResult);

      setPhotoState(prev => ({
        ...prev,
        preprocessing: preprocessingResult,
        isProcessing: false
      }));

      // Show validation feedback
      if (preprocessingResult.validationResult.warnings.length > 0) {
        console.warn('⚠️ [CGI-CREATOR] Photo validation warnings:', preprocessingResult.validationResult.warnings);
      }

    } catch (error) {
      console.error('❌ [CGI-CREATOR] Photo preprocessing failed:', error);
      setPhotoState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Photo preprocessing failed'
      }));
    }
  };

  const generateCGIAvatar = async () => {
    if (!photoState.preprocessing || !measurements) {
      console.error('❌ [CGI-CREATOR] Missing photo or measurements');
      return;
    }

    setGenerationState({
      isGenerating: true,
      progress: 0,
      stage: 'Initializing CGI generation...',
      result: null,
      error: null
    });

    try {
      console.log('🎬 [CGI-CREATOR] Starting CGI avatar generation:', {
        mode: cgiMode,
        hasMeasurements: !!measurements,
        hasPreprocessedPhoto: !!photoState.preprocessing
      });

      // Update progress
      setGenerationState(prev => ({ ...prev, progress: 20, stage: 'Preparing CGI transformation...' }));

      const request: CGIAvatarRequest = {
        headPhotoUrl: photoState.preprocessing.processedImageUrl,
        measurements,
        options: {
          imageSize: { width: 1536, height: 2048 }, // High resolution for CGI quality
          numImages: 1,
          enableSafetyChecker: false,
          seed: Math.floor(Math.random() * 1000000)
        }
      };

      // Update progress
      setGenerationState(prev => ({ ...prev, progress: 40, stage: 'Generating hyperrealistic CGI avatar...' }));

      let result: CGIAvatarResult;
      if (cgiMode === 'hyperrealistic') {
        result = await cgiAvatarGenerationService.generateHyperrealisticCGIAvatar(request);
      } else {
        result = await cgiAvatarGenerationService.generatePhotoBasedAvatar(request);
      }

      console.log('✅ [CGI-CREATOR] CGI avatar generation completed:', result);

      if (!result.success) {
        throw new Error(result.error || 'CGI avatar generation failed');
      }

      // Update progress to completion
      setGenerationState({
        isGenerating: false,
        progress: 100,
        stage: 'CGI avatar ready!',
        result,
        error: null
      });

    } catch (error) {
      console.error('❌ [CGI-CREATOR] CGI avatar generation failed:', error);
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'CGI generation failed'
      }));
    }
  };

  const handleNext = () => {
    if (generationState.result) {
      onNext({
        avatarData: generationState.result,
        measurements
      });
    }
  };

  const resetCreator = () => {
    setPhotoState({
      file: null,
      url: null,
      preprocessing: null,
      isProcessing: false,
      error: null
    });
    setGenerationState({
      isGenerating: false,
      progress: 0,
      stage: '',
      result: null,
      error: null
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">CGI Avatar Creator</h1>
        </div>
        <p className="text-gray-600">Create a hyperrealistic CGI avatar using your photo and measurements</p>
      </div>

      {/* CGI Mode Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">CGI Quality Mode</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setCgiMode('standard')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              cgiMode === 'standard'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-left">
              <h3 className="font-medium">Standard CGI</h3>
              <p className="text-sm text-gray-600 mt-1">High-quality avatar with enhanced realism</p>
            </div>
          </button>
          <button
            onClick={() => setCgiMode('hyperrealistic')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              cgiMode === 'hyperrealistic'
                ? 'border-purple-500 bg-purple-50 text-purple-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-left">
              <h3 className="font-medium">Hyperrealistic CGI</h3>
              <p className="text-sm text-gray-600 mt-1">Ultra-detailed digital human rendering</p>
            </div>
          </button>
        </div>
      </div>

      {/* Photo Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Your Photo</h2>

        {!photoState.url ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload a clear front-facing photo</h3>
            <p className="text-gray-600 mb-4">Best results with good lighting and direct camera angle</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Choose Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Photo */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Original Photo</h3>
                <img
                  src={photoState.url}
                  alt="Original photo"
                  className="w-full h-64 object-cover rounded-lg border border-gray-200"
                />
              </div>

              {/* Processed Photo */}
              {photoState.preprocessing && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Optimized for CGI</h3>
                  <img
                    src={photoState.preprocessing.processedImageUrl}
                    alt="Processed photo"
                    className="w-full h-64 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            {/* Processing Status */}
            {photoState.isProcessing && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Optimizing photo for CGI generation...</span>
              </div>
            )}

            {/* Validation Results */}
            {photoState.preprocessing && (
              <div className="space-y-2">
                {photoState.preprocessing.validationResult.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Photo Optimization Notes</h4>
                        <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                          {photoState.preprocessing.validationResult.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {photoState.preprocessing.validationResult.suggestions.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800">Suggestions for Better Results</h4>
                        <ul className="text-sm text-blue-700 mt-1 space-y-1">
                          {photoState.preprocessing.validationResult.suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={resetCreator}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Upload different photo
            </button>
          </div>
        )}

        {photoState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{photoState.error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Options */}
      {photoState.preprocessing && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>Advanced CGI Options</span>
          </button>

          {showAdvancedOptions && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Quality
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="high">High (1536x2048) - Recommended</option>
                    <option value="ultra">Ultra (2048x2730) - Slower</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CGI Detail Level
                  </label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="maximum">Maximum Detail</option>
                    <option value="balanced">Balanced Quality/Speed</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generation Section */}
      {photoState.preprocessing && !generationState.result && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate CGI Avatar</h2>

          {!generationState.isGenerating ? (
            <button
              onClick={generateCGIAvatar}
              disabled={!measurements}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Zap className="h-5 w-5" />
              <span>Generate {cgiMode === 'hyperrealistic' ? 'Hyperrealistic' : 'Standard'} CGI Avatar</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${generationState.progress}%` }}
                ></div>
              </div>
              <p className="text-center text-gray-600">{generationState.stage}</p>
            </div>
          )}

          {!measurements && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Measurements required for CGI generation
            </p>
          )}
        </div>
      )}

      {/* Generation Error */}
      {generationState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{generationState.error}</span>
          </div>
          <button
            onClick={() => setGenerationState(prev => ({ ...prev, error: null }))}
            className="mt-2 text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Result Display */}
      {generationState.result && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your CGI Avatar is Ready!</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <img
                src={generationState.result.cgiImageUrl}
                alt="Generated CGI Avatar"
                className="w-full rounded-lg border border-gray-200"
              />
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">CGI Avatar Generated Successfully</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Style: {cgiMode === 'hyperrealistic' ? 'Hyperrealistic 2D CGI' : 'Enhanced CGI'}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Generation Details</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Processing time: {generationState.result.metadata?.totalProcessingTime}ms</p>
                  <p>Quality score: {generationState.result.metadata?.qualityScore}/100</p>
                  <p>Resolution: 1536x2048 (High Definition)</p>
                  <p>Outfit: White fitted t-shirt & boxer briefs</p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleNext}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue with CGI Avatar
                </button>
                <button
                  onClick={resetCreator}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Generate New Avatar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {onBack && (
        <div className="flex justify-start">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to measurements
          </button>
        </div>
      )}
    </div>
  );
};

export default CGIAvatarCreator;