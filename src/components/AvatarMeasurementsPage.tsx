import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, User, Ruler, Sparkles, BookOpen } from 'lucide-react';
import { cgiAvatarGenerationService } from '../services/cgiAvatarGenerationService';
import { CGIAvatarRequest, CGIAvatarResult } from '../types/cgiAvatar';
import SavedPromptsModal from './SavedPromptsModal';
import { CURRENT_PERFECT_PROMPT } from '../config/bestavatargenerated.js';

interface MeasurementData {
  heightFeet: string;
  heightInches: string;
  chest: string;
  waist: string;
  hips: string;
  shoulderWidth: string;
  inseam: string;
  bodyType: string;
  gender?: 'male' | 'female' | 'other';
}

interface AvatarMeasurementsPageProps {
  uploadedPhoto?: string;
  avatarData?: any; // Contains headPhotoData from page 2
  onNext: (avatarData: any) => void;
  onBack?: () => void;
}

const AvatarMeasurementsPage: React.FC<AvatarMeasurementsPageProps> = ({ uploadedPhoto, avatarData, onNext, onBack }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingCGI, setIsGeneratingCGI] = useState(false);
  const [cgiProgress, setCgiProgress] = useState('');
  const [cgiError, setCgiError] = useState('');
  const [showPromptsModal, setShowPromptsModal] = useState(false);
  const [measurements, setMeasurements] = useState<MeasurementData>({
    heightFeet: '',
    heightInches: '',
    chest: '',
    waist: '',
    hips: '',
    shoulderWidth: '',
    inseam: '',
    bodyType: ''
  });

  const bodyTypes = [
    { value: 'athletic', label: 'Athletic', description: 'Muscular build, broad shoulders' },
    { value: 'slim', label: 'Slim', description: 'Lean build, narrow frame' },
    { value: 'average', label: 'Average', description: 'Balanced proportions' },
    { value: 'curvy', label: 'Curvy', description: 'Fuller hips and bust' }
  ];

  const feetOptions = Array.from({ length: 4 }, (_, i) => (4 + i).toString());
  const inchesOptions = Array.from({ length: 12 }, (_, i) => i.toString());

  // Simulate loading for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field: keyof MeasurementData, value: string) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const isFormComplete = () => {
    return Object.values(measurements).every(value => value.trim() !== '');
  };

  const handleContinue = async () => {
    // Store measurements in localStorage
    localStorage.setItem('avatarMeasurements', JSON.stringify(measurements));

    // Check if we have head photo data for CGI generation
    const headPhotoData = avatarData?.headPhotoData || uploadedPhoto;

    console.log('🔍 [MEASUREMENTS-DEBUG] CGI trigger check:', {
      hasHeadPhotoData: !!headPhotoData,
      headPhotoSource: headPhotoData === avatarData?.headPhotoData ? 'avatarData.headPhotoData' : 'uploadedPhoto',
      headPhotoPreview: headPhotoData?.substring(0, 50) + '...',
      readyForCGI: avatarData?.readyForCGI,
      avatarDataKeys: avatarData ? Object.keys(avatarData) : 'no avatarData',
      willTriggerCGI: !!(headPhotoData),
      measurementsComplete: isFormComplete(),
      currentMeasurements: measurements
    });

    // Try CGI generation if we have a head photo (more permissive condition)
    if (headPhotoData) {
      console.log('🎨 [MEASUREMENTS-PAGE] Starting CGI avatar generation...');
      console.log('📊 [CGI-DEBUG] Session start:', {
        timestamp: new Date().toISOString(),
        headPhotoSize: headPhotoData.length,
        measurementsProvided: Object.entries(measurements).map(([key, value]) => `${key}: ${value}`),
        formComplete: isFormComplete()
      });

      setIsGeneratingCGI(true);
      setCgiError('');

      try {
        // Validate measurements before proceeding
        if (!isFormComplete()) {
          const missingFields = Object.entries(measurements)
            .filter(([key, value]) => !value || value.trim() === '')
            .map(([key]) => key);

          console.warn('⚠️ [CGI-VALIDATION] Incomplete measurements:', {
            missingFields,
            currentMeasurements: measurements
          });

          throw new Error(`Please complete all measurements. Missing: ${missingFields.join(', ')}`);
        }

        // Additional validation for reasonable measurement values
        const heightInInches = parseInt(measurements.heightFeet) * 12 + parseInt(measurements.heightInches);
        if (heightInInches < 48 || heightInInches > 84) {
          throw new Error('Height must be between 4\'0" and 7\'0" for CGI generation');
        }

        const numericMeasurements = {
          chest: parseFloat(measurements.chest),
          waist: parseFloat(measurements.waist),
          hips: parseFloat(measurements.hips),
          shoulders: parseFloat(measurements.shoulderWidth),
          inseam: parseFloat(measurements.inseam)
        };

        // Check for reasonable measurement ranges
        if (numericMeasurements.chest < 20 || numericMeasurements.chest > 60) {
          throw new Error('Chest measurement must be between 20-60 inches');
        }
        if (numericMeasurements.waist < 20 || numericMeasurements.waist > 60) {
          throw new Error('Waist measurement must be between 20-60 inches');
        }
        if (numericMeasurements.hips < 20 || numericMeasurements.hips > 60) {
          throw new Error('Hip measurement must be between 20-60 inches');
        }

        console.log('✅ [CGI-VALIDATION] All measurements validated successfully:', {
          heightInInches,
          numericMeasurements,
          bodyType: measurements.bodyType
        });

        // Step 1: Generate CGI body from measurements
        setCgiProgress('Step 1: Generating photorealistic body from your measurements...');
        console.log('🏗️ [CGI-STEP-1] Starting body generation from measurements...');

        const cgiRequest: CGIAvatarRequest = {
          headPhotoUrl: headPhotoData,
          measurements: {
            heightFeet: measurements.heightFeet,
            heightInches: measurements.heightInches,
            chest: measurements.chest,
            waist: measurements.waist,
            hips: measurements.hips,
            shoulderWidth: measurements.shoulderWidth,
            inseam: measurements.inseam,
            bodyType: measurements.bodyType as 'athletic' | 'slim' | 'average' | 'curvy'
          },
          options: {
            imageSize: { width: 1152, height: 2048 }, // 9:16 portrait for full-body display
            numImages: 1,
            enableSafetyChecker: false,
            safetyTolerance: 5
          }
        };

        console.log('📤 [CGI-REQUEST] Full CGI request details:', {
          headPhotoLength: headPhotoData.length,
          headPhotoType: headPhotoData.startsWith('data:') ? 'base64' : 'url',
          measurements: cgiRequest.measurements,
          options: cgiRequest.options,
          endpoints: {
            textToImage: '/api/fal/fal-ai/bytedance/seedream/v4/text-to-image',
            imageEdit: '/api/fal/fal-ai/bytedance/seedream/v4/edit'
          }
        });

        // Step 2: Composite head onto CGI body
        setCgiProgress('Step 2: Compositing your head onto the generated CGI body...');
        console.log('🎭 [CGI-STEP-2] Starting head composition...');

        const cgiResult = await cgiAvatarGenerationService.generateCGIAvatar(cgiRequest);

        if (cgiResult.success && cgiResult.cgiImageUrl) {
          console.log('✅ [CGI-SUCCESS] CGI avatar generation completed successfully!');
          console.log('📊 [CGI-RESULT] Detailed success metrics:', {
            cgiImageUrl: cgiResult.cgiImageUrl,
            bodyImageUrl: cgiResult.bodyImageUrl,
            processingTime: cgiResult.metadata?.totalProcessingTime,
            qualityScore: cgiResult.metadata?.qualityScore,
            model: cgiResult.metadata?.model,
            aspectRatio: cgiResult.metadata?.aspectRatio,
            stepsCompleted: cgiResult.metadata?.generationSteps?.length,
            bodyPrompt: cgiResult.metadata?.bodyPrompt,
            compositionPrompt: cgiResult.metadata?.compositionPrompt
          });

          setCgiProgress('✅ CGI avatar generation complete! Your personalized avatar is ready.');

          // Pass CGI avatar data to page 4
          const finalAvatarData = {
            ...avatarData,
            cgiImageUrl: cgiResult.cgiImageUrl,
            bodyImageUrl: cgiResult.bodyImageUrl,
            imageUrl: cgiResult.cgiImageUrl, // Main avatar image for display
            staticImageUrl: cgiResult.cgiImageUrl, // Static image for FASHN
            measurements: measurements,
            cgiMetadata: cgiResult.metadata,
            isCGI: true,
            success: true,
            generationType: 'CGI_MEASUREMENTS_BASED',
            // Debug info for development
            debugInfo: {
              bodyGeneratedFrom: 'measurements',
              headCompositeFrom: 'uploadedPhoto',
              apiEndpoints: ['text-to-image', 'edit'],
              processingSteps: 2
            }
          };

          console.log('🎯 [CGI-HANDOFF] Passing CGI avatar data to next page:', {
            hasImageUrl: !!finalAvatarData.imageUrl,
            hasCgiUrl: !!finalAvatarData.cgiImageUrl,
            hasBodyUrl: !!finalAvatarData.bodyImageUrl,
            measurementsUsed: Object.keys(finalAvatarData.measurements),
            generationType: finalAvatarData.generationType
          });

          // Small delay to show success message
          setTimeout(() => {
            onNext(finalAvatarData);
          }, 1500);

        } else {
          throw new Error(cgiResult.error || 'CGI generation failed');
        }

      } catch (error) {
        console.error('❌ [CGI-FAILURE] CGI generation failed with error:', error);
        console.error('🔍 [CGI-DEBUG] Failure details:', {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          measurementsUsed: measurements,
          headPhotoAvailable: !!headPhotoData,
          timestamp: new Date().toISOString()
        });

        setCgiError(error instanceof Error ? error.message : 'CGI generation failed');
        setIsGeneratingCGI(false);

        // For now, throw the error instead of falling back to prevent bypassing the CGI system
        throw error;

        // TODO: Later we can add a proper fallback mechanism if needed
        // setTimeout(() => {
        //   const fallbackAvatarData = {
        //     ...avatarData,
        //     measurements: measurements,
        //     cgiGeneration: false,
        //     error: 'CGI generation failed, using fallback mode'
        //   };
        //   onNext(fallbackAvatarData);
        // }, 2000);
      }
    } else {
      // No CGI generation - proceed normally
      console.log('📋 [MEASUREMENTS-PAGE] No CGI data, proceeding with measurements only');
      onNext({ measurements, headPhotoData });
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 relative overflow-hidden bg-gray-50">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900 via-transparent to-blue-900"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-purple-300 rounded-full animate-bounce opacity-60"></div>
      <div className="absolute bottom-32 right-8 w-3 h-3 bg-pink-300 rounded-full animate-pulse opacity-60"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 z-10">
        {onBack && (
          <button
            onClick={onBack}
            className="glass-beige-light p-2 hover:glass-beige rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-5xl md:text-6xl font-dancing-script text-center bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
            Body Measurements
          </h1>
        </div>
        <button
          onClick={() => setShowPromptsModal(true)}
          className="glass-beige-light p-2 hover:glass-beige rounded-full transition-colors"
          title="View/Save Avatar Prompts"
        >
          <BookOpen className="w-6 h-6 text-purple-600" />
        </button>
        {/* Debug Tools - Development Only */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4">
            <button
              onClick={async () => {
                console.log('🧪 [CGI-TEST] Testing CGI service connection...');
                try {
                  const testResult = await cgiAvatarGenerationService.testConnection();
                  console.log('🧪 [CGI-TEST] Service test result:', testResult);
                  alert(testResult.success ? 'CGI Service: ✅ Connected' : `CGI Service: ❌ ${testResult.error}`);
                } catch (error) {
                  console.error('🧪 [CGI-TEST] Service test failed:', error);
                  alert(`CGI Service: ❌ ${error instanceof Error ? error.message : 'Test failed'}`);
                }
              }}
              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded text-sm font-medium transition-colors"
            >
              🧪 Test CGI Service
            </button>
          </div>
        )}

        {/* Photo Preview */}
        {uploadedPhoto && (
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-300 shadow-lg">
            <img
              src={uploadedPhoto}
              alt="Your photo"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Debug Test Button (always visible) */}
      <div className="mb-6 z-10">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={async () => {
              console.log('🧪 [DEBUG-TEST] Testing API connection...');
              try {
                const { testFalApiConnection } = await import('../utils/testApiConnection');
                await testFalApiConnection();
              } catch (error) {
                console.error('🧪 [DEBUG-TEST] Test failed:', error);
              }
            }}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors"
          >
            🧪 Test API Connection (Debug)
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center z-10">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-spin">
              <div className="w-full h-full border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-8 h-8 text-purple-600 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Creating Your Avatar...</h2>
          <p className="text-gray-600 text-center max-w-md">
            We're processing your photo and preparing your personalized avatar experience
          </p>
        </div>
      ) : (
        /* Measurements Form */
        <div className="flex-1 z-10">
          <div className="max-w-2xl mx-auto glass-beige rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-6">
              <Ruler className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-800">Tell us your measurements</h2>
            </div>

            <div className="space-y-6">
              {/* Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                <div className="flex space-x-4">
                  <select
                    value={measurements.heightFeet}
                    onChange={(e) => handleInputChange('heightFeet', e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Feet</option>
                    {feetOptions.map(feet => (
                      <option key={feet} value={feet}>{feet} ft</option>
                    ))}
                  </select>
                  <select
                    value={measurements.heightInches}
                    onChange={(e) => handleInputChange('heightInches', e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Inches</option>
                    {inchesOptions.map(inches => (
                      <option key={inches} value={inches}>{inches} in</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Body Measurements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chest/Bust (inches)</label>
                  <input
                    type="number"
                    value={measurements.chest}
                    onChange={(e) => handleInputChange('chest', e.target.value)}
                    placeholder="36"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Waist (inches)</label>
                  <input
                    type="number"
                    value={measurements.waist}
                    onChange={(e) => handleInputChange('waist', e.target.value)}
                    placeholder="28"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hips (inches)</label>
                  <input
                    type="number"
                    value={measurements.hips}
                    onChange={(e) => handleInputChange('hips', e.target.value)}
                    placeholder="38"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shoulder Width (inches)</label>
                  <input
                    type="number"
                    value={measurements.shoulderWidth}
                    onChange={(e) => handleInputChange('shoulderWidth', e.target.value)}
                    placeholder="16"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Inseam (inches)</label>
                <input
                  type="number"
                  value={measurements.inseam}
                  onChange={(e) => handleInputChange('inseam', e.target.value)}
                  placeholder="32"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Body Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Body Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bodyTypes.map((type) => (
                    <div
                      key={type.value}
                      onClick={() => handleInputChange('bodyType', type.value)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        measurements.bodyType === type.value
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-800">{type.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CGI Generation Progress */}
            {isGeneratingCGI && (
              <div className="mt-8 glass-beige rounded-2xl p-6 shadow-xl">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <Sparkles className="w-6 h-6 text-purple-600 animate-spin" />
                    <h3 className="text-xl font-semibold text-gray-800">Creating Your CGI Avatar</h3>
                    <Sparkles className="w-6 h-6 text-pink-600 animate-pulse" />
                  </div>
                  <p className="text-gray-600">{cgiProgress}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full animate-pulse"
                         style={{ width: cgiProgress.includes('Compositing') ? '75%' : '45%' }}>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CGI Generation Error */}
            {cgiError && (
              <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-red-800">CGI Generation Error</h3>
                  <p className="text-red-600 text-sm">{cgiError}</p>
                  <p className="text-gray-500 text-xs">Proceeding with fallback mode...</p>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <div className="mt-8">
              <button
                onClick={handleContinue}
                disabled={!isFormComplete() || isGeneratingCGI}
                className={`relative w-full group transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-purple-200/50 ${
                  !isFormComplete() || isGeneratingCGI ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 p-1 shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/25 transition-all duration-300">
                  <div className="relative glass-beige rounded-xl px-8 py-4 group-hover:glass-beige-dark transition-all duration-300">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                        {isGeneratingCGI ? (
                          <Sparkles className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <ArrowRight className="w-5 h-5 text-white group-hover:text-white" />
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent group-hover:text-white transition-all duration-300">
                          {isGeneratingCGI ? 'Generating CGI Avatar...' : 'Continue to Avatar'}
                        </div>
                        <div className="text-sm text-gray-500 group-hover:text-purple-100 transition-all duration-300">
                          {isGeneratingCGI ? 'Please wait while we create your avatar' : 'Generate your CGI avatar'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Prompts Modal */}
      <SavedPromptsModal
        isOpen={showPromptsModal}
        onClose={() => setShowPromptsModal(false)}
        currentPromptData={{
          prompt: CURRENT_PERFECT_PROMPT.prompt,
          negativePrompt: CURRENT_PERFECT_PROMPT.negativePrompt,
          parameters: CURRENT_PERFECT_PROMPT.parameters,
          quality: CURRENT_PERFECT_PROMPT.quality
        }}
      />
    </div>
  );
};

export default AvatarMeasurementsPage;