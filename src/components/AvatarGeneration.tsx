import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Zap, CheckCircle, User, Ruler, ArrowRight, Settings } from 'lucide-react';
import { directKlingAvatarService, DirectMeasurements } from '../services/directKlingAvatarService';
import { cgiAvatarGenerationService } from '../services/cgiAvatarGenerationService';
import { CGIAvatarRequest, CGIAvatarResult, MeasurementData as CGIMeasurementData } from '../types/cgiAvatar';
import CGIPromptGenerator from '../utils/cgiPromptGenerator';
import useDevMode from '../hooks/useDevMode';
import demoDataService from '../services/demoDataService';

interface MeasurementData {
  heightFeet: string;
  heightInches: string;
  chest: string;
  waist: string;
  hips: string;
  shoulderWidth: string;
  inseam: string;
  bodyType: string;
  gender: 'male' | 'female' | 'unisex';
}

interface GenerationProgress {
  progress: number;
  stage: string;
  message: string;
}

interface AvatarGenerationProps {
  uploadedPhoto?: string;
  measurements?: any;
  onNext: (data: { avatarData: any; measurements: any }) => void;
  onBack?: () => void;
}

const AvatarGeneration: React.FC<AvatarGenerationProps> = ({ uploadedPhoto, measurements: preMeasurements, onNext, onBack }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Add dev mode hook with measurements listener
  const { devModeEnabled } = useDevMode({
    onMeasurements: (data) => {
      console.log('🔧 DEV: Received measurements event:', data);
      prefillMeasurements();
    }
  });
  const [measurements, setMeasurements] = useState<MeasurementData>(() => {
    // Initialize with pre-measurements if available
    if (preMeasurements) {
      const heightCm = typeof preMeasurements.height === 'number' ? preMeasurements.height : 175;
      const totalInches = Math.round(heightCm / 2.54);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;

      return {
        heightFeet: feet.toString(),
        heightInches: inches.toString(),
        chest: Math.round((preMeasurements.chest || 95) / 2.54).toString(),
        waist: Math.round((preMeasurements.waist || 80) / 2.54).toString(),
        hips: Math.round((preMeasurements.hips || 98) / 2.54).toString(),
        shoulderWidth: Math.round((preMeasurements.shoulders || 45) / 2.54).toString(),
        inseam: Math.round((preMeasurements.inseam || 82) / 2.54).toString(),
        bodyType: preMeasurements.build || 'average',
        gender: preMeasurements.gender || 'unisex'
      };
    }

    return {
      heightFeet: '',
      heightInches: '',
      chest: '',
      waist: '',
      hips: '',
      shoulderWidth: '',
      inseam: '',
      bodyType: '',
      gender: 'unisex'
    };
  });

  const bodyTypes = [
    { value: 'athletic', label: 'Athletic', description: 'Muscular build, broad shoulders' },
    { value: 'slim', label: 'Slim', description: 'Lean build, narrow frame' },
    { value: 'average', label: 'Average', description: 'Balanced proportions' },
    { value: 'curvy', label: 'Curvy', description: 'Fuller hips and bust' }
  ];

  const feetOptions = Array.from({ length: 4 }, (_, i) => (4 + i).toString());
  const inchesOptions = Array.from({ length: 12 }, (_, i) => i.toString());

  // Simulate avatar processing for 3 seconds, then show measurements form
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowMeasurements(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Direct Kling Video approach - no intermediate animations needed

  const handleInputChange = (field: keyof MeasurementData, value: string) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };


  // Add function to prefill measurements with demo data
  const prefillMeasurements = () => {
    console.log('🔧 DEV: Prefilling measurements with demo data');
    const demoData = demoDataService.getMeasurements();

    // Convert demo data format to component format
    const demoMeasurements: MeasurementData = {
      heightFeet: demoData.heightFeet,
      heightInches: demoData.heightInches,
      chest: demoData.chest.replace('"', ''), // Remove quote marks
      waist: demoData.waist.replace('"', ''),
      hips: demoData.hips.replace('"', ''),
      shoulderWidth: demoData.shoulderWidth.replace('"', ''),
      inseam: demoData.inseam.replace('"', ''),
      bodyType: demoData.bodyType,
      gender: demoData.gender || 'female'
    };

    setMeasurements(demoMeasurements);
    console.log('✅ DEV: Measurements prefilled:', demoMeasurements);
  };


  const isFormComplete = () => {
    const isDemoMode = directKlingAvatarService.getDemoModeStatus().enabled;
    // In demo mode, we don't require all measurements to be filled
    if (isDemoMode) {
      return true;
    }
    return Object.values(measurements).every(value => value.trim() !== '');
  };

  // Convert local measurements format to CGI service format
  const convertToCGIMeasurements = (localMeasurements: MeasurementData): CGIMeasurementData => {
    return {
      heightFeet: localMeasurements.heightFeet,
      heightInches: localMeasurements.heightInches,
      chest: localMeasurements.chest,
      waist: localMeasurements.waist,
      hips: localMeasurements.hips,
      shoulderWidth: localMeasurements.shoulderWidth,
      inseam: localMeasurements.inseam,
      bodyType: localMeasurements.bodyType,
      gender: localMeasurements.gender
    };
  };

  const handleContinue = async () => {
    console.log('🚀 Continue button clicked!');
    console.log('📸 uploadedPhoto available:', !!uploadedPhoto);
    console.log('📝 Form complete:', isFormComplete());
    console.log('📏 Measurements:', measurements);

    // Check individual form validation
    const formValidation = {
      heightFeet: measurements.heightFeet.trim() !== '',
      heightInches: measurements.heightInches.trim() !== '',
      chest: measurements.chest.trim() !== '',
      waist: measurements.waist.trim() !== '',
      hips: measurements.hips.trim() !== '',
      inseam: measurements.inseam.trim() !== '',
      shoulderWidth: measurements.shoulderWidth.trim() !== ''
    };
    console.log('📋 Individual field validation:', formValidation);

    // Check if demo mode is enabled for photo validation
    const isDemoMode = directKlingAvatarService.getDemoModeStatus().enabled;

    if (!uploadedPhoto && !isDemoMode) {
      console.error('❌ No uploaded photo available!');
      return;
    }

    if (isDemoMode) {
      console.log('🎭 [DEMO-MODE] Photo requirement bypassed - using demo avatar');
    }

    if (!isFormComplete()) {
      console.error('❌ Form is not complete!');
      return;
    }

    console.log('🎬 Starting direct animated avatar generation with Kling Video...');
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress({ progress: 0, stage: 'Starting', message: 'Initializing direct avatar animation...' });

    try {
      // Store measurements in localStorage
      localStorage.setItem('avatarMeasurements', JSON.stringify(measurements));

      // Convert measurements to Direct Kling format
      const directMeasurements: DirectMeasurements = {
        heightFeet: measurements.heightFeet,
        heightInches: measurements.heightInches,
        height: measurements.heightFeet && measurements.heightInches ?
          (parseInt(measurements.heightFeet) * 12 + parseInt(measurements.heightInches)) * 2.54 : 175, // Convert to cm
        chest: measurements.chest,
        waist: measurements.waist,
        hips: measurements.hips,
        shoulderWidth: measurements.shoulderWidth,
        inseam: measurements.inseam,
        bodyType: measurements.bodyType,
        build: measurements.bodyType === 'athletic' ? 'athletic' :
              measurements.bodyType === 'slim' ? 'slim' :
              measurements.bodyType === 'curvy' ? 'curvy' : 'average',
        gender: measurements.gender
      };

      console.log('🎬 Generating animated avatar directly with Kling Video...');
      console.log('📸 Using photo:', uploadedPhoto);
      console.log('📏 Using measurements:', directMeasurements);

      // Step 1: Preparing your photo for animation
      setGenerationProgress({ progress: 20, stage: 'Analyzing your photo', message: 'Processing your photo for animation...' });
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 2: Creating measurement-based animation prompt
      setGenerationProgress({ progress: 40, stage: 'Creating animation prompt', message: 'Generating movement based on your measurements...' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Generating the 5-second animation
      setGenerationProgress({ progress: 60, stage: 'Animating your avatar', message: 'Creating 5-second animated avatar ready for virtual try-on...' });

      // Debug state before calling Kling service
      console.log('🔍 Debug state before Kling generation:', {
        uploadedPhoto,
        hasUploadedPhoto: !!uploadedPhoto,
        uploadedPhotoType: typeof uploadedPhoto,
        uploadedPhotoLength: uploadedPhoto?.length,
        directMeasurements,
        formComplete: isFormComplete()
      });

      // Check if demo mode is enabled
      const isDemoMode = directKlingAvatarService.getDemoModeStatus().enabled;

      // Validate we have a photo before calling Kling (skip validation in demo mode)
      if (!uploadedPhoto && !isDemoMode) {
        console.error('❌ No uploadedPhoto available for Kling generation');
        throw new Error('No photo available for avatar generation. Please upload a photo first.');
      }

      if (isDemoMode) {
        console.log('🎭 [DEMO-MODE] Photo validation skipped - using demo avatar');
      }

      // Check if animation is enabled
      const isAnimationEnabled = import.meta.env.VITE_ENABLE_AVATAR_ANIMATION === 'true';
      if (!isAnimationEnabled) {
        console.log('🎨 [AVATAR-GEN] Avatar animation is disabled - generating 2D avatar directly');
        console.log('🎨 [AVATAR-GEN] VITE_ENABLE_AVATAR_ANIMATION is set to false');

        // Generate 2D avatar directly using CGI service
        setGenerationProgress({ progress: 30, stage: 'Generating 2D Avatar', message: 'Creating your personalized 2D avatar...' });

        try {
          // Convert measurements to CGI format
          const cgiMeasurements = convertToCGIMeasurements(measurements);
          console.log('📏 [CGI-GEN] Using measurements:', cgiMeasurements);

          // Create CGI avatar request
          const cgiRequest: CGIAvatarRequest = {
            headPhotoUrl: uploadedPhoto,
            measurements: cgiMeasurements,
            options: {
              imageSize: { width: 1152, height: 2048 }, // 9:16 portrait for full-body display
              numImages: 1,
              enableSafetyChecker: false
            }
          };

          setGenerationProgress({ progress: 60, stage: 'Processing', message: 'Generating body from measurements...' });

          console.log('🚀 [CGI-GEN] Starting comprehensive 2-step avatar generation (headless body + face integration)...');
          const cgiResult: CGIAvatarResult = await cgiAvatarGenerationService.generateCGIAvatar(cgiRequest);

          if (cgiResult.success && cgiResult.cgiImageUrl) {
            setGenerationProgress({ progress: 100, stage: 'Complete', message: 'Your 2D avatar is ready!' });

            // Create avatar data structure compatible with existing flow
            const avatarData = {
              imageUrl: cgiResult.cgiImageUrl,
              bodyImageUrl: cgiResult.bodyImageUrl,
              animatedVideoUrl: null, // No video for 2D avatar
              isAnimated: false,
              duration: 0,
              originalPhoto: uploadedPhoto,
              metadata: {
                ...cgiResult.metadata,
                directGeneration: true,
                model: 'ByteDance Seedream v4 (2D Avatar)',
                style: 'realistic',
                quality: 'high',
                generationType: '2D'
              },
              qualityScore: cgiResult.metadata?.qualityScore || 85
            };

            console.log('✅ [CGI-GEN] 2D Avatar generation successful:', avatarData);
            onNext({ avatarData, measurements: directMeasurements });
            return;
          } else {
            throw new Error(cgiResult.error || 'Failed to generate 2D avatar');
          }
        } catch (error) {
          console.error('❌ [CGI-GEN] 2D Avatar generation failed:', error);
          setGenerationError(`2D Avatar generation failed: ${error.message}`);
          setGenerationProgress({ progress: 0, stage: 'Error', message: 'Generation failed. Please try again.' });
          return;
        }
      }

      // Call the direct Kling Video avatar generation service
      console.log('📞 Calling directKlingAvatarService with:', { uploadedPhoto, directMeasurements });
      const result = await directKlingAvatarService.generateDirectAnimatedAvatar(
        uploadedPhoto,
        directMeasurements
      );

      console.log('✅ Direct Kling animation result:', result);

      if (result.success && result.videoUrl) {
        // Update progress
        setGenerationProgress({ progress: 100, stage: 'Complete', message: 'Your animated avatar is ready!' });

        // Avatar generation successful - create data structure compatible with existing flow
        const avatarData = {
          imageUrl: result.staticImageUrl || uploadedPhoto || result.videoUrl, // Enhanced fallback for demo mode
          animatedVideoUrl: result.videoUrl,
          isAnimated: true,
          duration: 5, // 5-second video from Kling API
          originalPhoto: uploadedPhoto,
          metadata: {
            ...result.metadata,
            directGeneration: true,
            model: 'Direct Kling Video v2.5 Turbo Pro',
            style: 'realistic',
            quality: 'high'
          },
          qualityScore: 85 // Default quality score
        };

        console.log('🎯 Calling onNext with animated avatar data:', { avatarData, measurements: directMeasurements });
        onNext({ avatarData, measurements: directMeasurements });
        console.log('✅ onNext called successfully - should navigate to next page');
      } else {
        throw new Error(result.error || 'Direct avatar animation failed');
      }
    } catch (error) {
      console.error('❌ Avatar generation failed:', error);
      setGenerationError(error instanceof Error ? error.message : 'Avatar generation failed');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  // Debug logging on every render
  console.log('🔧 AvatarGeneration component render:', {
    uploadedPhoto: !!uploadedPhoto,
    isFormComplete: isFormComplete(),
    isGenerating,
    measurements
  });

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 relative overflow-hidden bg-gray-50">
      {/* Animation Keyframes - Direct Kling Video Animation */}
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900 via-transparent to-slate-900"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-amber-300 rounded-full animate-bounce opacity-60"></div>
      <div className="absolute bottom-32 right-8 w-3 h-3 bg-stone-300 rounded-full animate-pulse opacity-60"></div>

      {/* Photo Preview - Top Corner */}
      {uploadedPhoto && (
        <div className="absolute top-8 right-8 w-16 h-16 rounded-full overflow-hidden border-2 border-amber-300 shadow-lg z-20">
          <img
            src={uploadedPhoto}
            alt="Your photo"
            className="w-full h-full object-cover"
          />
        </div>
      )}


      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center z-10">
          <div className="relative mb-8">
            {/* Animated Avatar Preview */}
            <div
              ref={avatarRef}
              className="relative w-48 aspect-[9/16] rounded-2xl bg-gradient-to-b from-amber-100 to-stone-200 border-2 border-amber-300 overflow-hidden shadow-lg"
            >
              {uploadedPhoto ? (
                <img
                  src={uploadedPhoto}
                  alt="Your Photo Preview"
                  className="w-full h-full object-contain object-bottom opacity-80"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-amber-600" />
                </div>
              )}
              {/* Loading overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-amber-200/40 to-transparent">
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="w-full bg-white/60 rounded-full h-1">
                    <div className="bg-amber-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Creating Your Avatar...</h2>
          <p className="text-gray-600 text-center max-w-md">
            We're processing your photo and preparing your personalized avatar experience
          </p>
          <p className="text-amber-600 text-sm mt-2 animate-pulse">
            Watch your avatar come to life! ✨
          </p>
        </div>
      )}

      {/* Measurements Form */}
      {showMeasurements && (
        <div className="flex-1 z-10">
          <div className="max-w-2xl mx-auto glass-beige rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Ruler className="w-6 h-6 text-amber-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-800">Tell us your measurements</h2>
              </div>
              {devModeEnabled && (
                <button
                  onClick={prefillMeasurements}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm font-medium transition-colors"
                  title="Developer: Prefill with demo measurements"
                >
                  <Settings className="w-4 h-4" />
                  <span>Prefill</span>
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                <div className="flex space-x-4">
                  <select
                    value={measurements.heightFeet}
                    onChange={(e) => handleInputChange('heightFeet', e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Feet</option>
                    {feetOptions.map(feet => (
                      <option key={feet} value={feet}>{feet} ft</option>
                    ))}
                  </select>
                  <select
                    value={measurements.heightInches}
                    onChange={(e) => handleInputChange('heightInches', e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Waist (inches)</label>
                  <input
                    type="number"
                    value={measurements.waist}
                    onChange={(e) => handleInputChange('waist', e.target.value)}
                    placeholder="28"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hips (inches)</label>
                  <input
                    type="number"
                    value={measurements.hips}
                    onChange={(e) => handleInputChange('hips', e.target.value)}
                    placeholder="38"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shoulder Width (inches)</label>
                  <input
                    type="number"
                    value={measurements.shoulderWidth}
                    onChange={(e) => handleInputChange('shoulderWidth', e.target.value)}
                    placeholder="16"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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

              {/* Gender Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Gender</label>
                <div className="grid grid-cols-3 gap-4">
                  <div
                    onClick={() => handleInputChange('gender', 'male')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      measurements.gender === 'male'
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                        : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">👨</div>
                      <h3 className="font-semibold text-gray-800">Man</h3>
                    </div>
                  </div>
                  <div
                    onClick={() => handleInputChange('gender', 'female')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      measurements.gender === 'female'
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                        : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">👩</div>
                      <h3 className="font-semibold text-gray-800">Woman</h3>
                    </div>
                  </div>
                  <div
                    onClick={() => handleInputChange('gender', 'unisex')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      measurements.gender === 'unisex'
                        ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                        : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">⚧️</div>
                      <h3 className="font-semibold text-gray-800">Unisex</h3>
                    </div>
                  </div>
                </div>
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
                          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                          : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-800">{type.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Generation Progress */}
            {isGenerating && generationProgress && (
              <div className="mt-6 glass-beige-light rounded-lg p-4">
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-700 font-medium">{generationProgress.stage}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-stone-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress.progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">{generationProgress.message}</p>
              </div>
            )}

            {/* Error Display */}
            {generationError && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-red-800">Avatar Generation Failed</h4>
                    <p className="text-red-700 text-sm mt-1">{generationError}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setGenerationError(null);
                        handleContinue();
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => setGenerationError(null)}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Photo Missing Helper */}
            {!uploadedPhoto && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-red-800">Photo Required</h4>
                    <p className="text-xs text-red-600 mt-1">A photo is required to generate your avatar</p>
                  </div>
                  <button
                    onClick={() => {
                      if (onBack) {
                        console.log('📸 Going back to photo capture...');
                        onBack();
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Back to Photo
                  </button>
                </div>
              </div>
            )}

            {/* Auto-fill Helper */}
            {!isFormComplete() && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-blue-800">Need help with measurements?</h4>
                    <p className="text-xs text-blue-600 mt-1">Fill with demo measurements to continue</p>
                  </div>
                  <button
                    onClick={() => {
                      setMeasurements({
                        heightFeet: '5',
                        heightInches: '8',
                        chest: '36',
                        waist: '28',
                        hips: '38',
                        shoulderWidth: '18',
                        inseam: '32',
                        bodyType: 'average',
                        gender: 'unisex'
                      });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Fill Demo Data
                  </button>
                </div>
              </div>
            )}

            {/* Debug Info Panel - Development Only */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
                <h4 className="font-semibold text-sm text-yellow-800 mb-2">Debug Info:</h4>
                <div className="text-xs text-yellow-700 space-y-1">
                  <div>Photo Available: {uploadedPhoto ? '✅ Yes' : '❌ No'}</div>
                  <div>Form Complete: {isFormComplete() ? '✅ Yes' : '❌ No'}</div>
                  <div>Button Enabled: {(!isFormComplete() || isGenerating) ? '❌ Disabled' : '✅ Enabled'}</div>
                  {!isFormComplete() && (
                    <div className="mt-2">
                      <div className="font-semibold">Missing Fields:</div>
                      {Object.entries(measurements).map(([key, value]) => (
                        <div key={key} className={value.trim() === '' ? 'text-red-600' : 'text-green-600'}>
                          {key}: {value.trim() === '' ? '❌ Empty' : '✅ ' + value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Continue Button */}
            <div className="mt-8">
              <button
                onClick={handleContinue}
                disabled={!isFormComplete() || isGenerating}
                className={`relative w-full group transition-all duration-300 hover:scale-[1.02] focus:outline-none ${
                  (!isFormComplete() || isGenerating) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="bg-gradient-to-r from-stone-200/50 via-amber-100/50 to-stone-200/50 rounded-2xl px-8 py-4 flex items-center justify-center space-x-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-black">
                      {directKlingAvatarService.getDemoModeStatus().enabled ? '🎭 Demo Avatar' : 'Continue to Avatar'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {directKlingAvatarService.getDemoModeStatus().enabled ? 'Use demo 3D avatar' : 'Generate your 3D avatar'}
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-black" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      {onBack && showMeasurements && (
        <div className="absolute top-8 left-8 z-20">
          <button
            onClick={onBack}
          >
            <ArrowLeft className="w-6 h-6 text-black" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AvatarGeneration;