import React, { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, CheckCircle, ArrowRight, User, ArrowLeft, Sparkles, AlertCircle, Info, Image as ImageIcon, Upload } from 'lucide-react';
import { CapturedPhoto } from '../types/photo';
import { faceAnalysisService, PhotoValidation } from '../services/faceAnalysisService';
import photoUploadService from '../services/photoUploadService';

interface PhotoCaptureFlowProps {
  onNext: (photos: CapturedPhoto[]) => void;
}

const PhotoCaptureFlow: React.FC<PhotoCaptureFlowProps> = ({ onNext }) => {
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoValidation, setPhotoValidation] = useState<PhotoValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photoLibraryInputRef = useRef<HTMLInputElement>(null);
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'Create Avatar';
  const isMobile = photoUploadService.isMobile();

  const photoStep = {
    id: 'front',
    title: 'Front View',
    view: 'front',
    type: 'upper_body',
    instruction: 'Stand straight facing the camera',
    icon: Camera,
    tip: 'Keep your arms at your sides'
  };

  // Typewriter animation effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (displayedText.length < fullText.length) {
      timeoutId = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 150); // Adjust speed here (150ms per character)
    }

    return () => clearTimeout(timeoutId);
  }, [displayedText, fullText]);

  const handleTakePhoto = () => {
    setUploadError(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleChooseFromPhotos = () => {
    setUploadError(null);
    if (photoLibraryInputRef.current) {
      photoLibraryInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, uploadMethod: 'camera' | 'photo_library') => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadError(null);
      setUploadProgress('Reading file...');

      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;

        // Upload to Supabase (optional - continue even if fails)
        setUploadProgress('Uploading to cloud storage...');
        let uploadResult;
        try {
          uploadResult = await photoUploadService.uploadPhoto(
            imageData,
            `avatar-${photoStep.view}`,
            uploadMethod
          );

          if (!uploadResult.success) {
            console.warn('⚠️ [PHOTO-CAPTURE] Cloud upload failed, continuing with local photo:', uploadResult.error);
            setUploadError(`Cloud storage unavailable: ${uploadResult.error}. Photo saved locally.`);
            // Continue anyway - photo is still usable
          }
        } catch (error) {
          console.error('❌ [PHOTO-CAPTURE] Upload error:', error);
          setUploadError('Cloud storage unavailable. Photo saved locally.');
          // Continue anyway
        }

        setUploadProgress('Processing photo...');

        const newCapturedPhoto: CapturedPhoto = {
          id: `${photoStep.id}_${Date.now()}`,
          view: photoStep.view,
          type: photoStep.type,
          dataUrl: imageData,
          timestamp: Date.now(),
          file: file
        };

        setCapturedPhoto(newCapturedPhoto);
        console.log('📸 Photo captured and uploaded:', uploadResult.data);

        // Validate the photo
        setIsValidating(true);
        setPhotoValidation(null);
        setUploadProgress(null);

        try {
          console.log('🔍 Validating photo quality and face detection...');
          const validation = await faceAnalysisService.validatePhoto(imageData, {
            required: false,  // Don't block avatar creation if face detection fails
            resize: true      // Automatically resize large images
          });
          setPhotoValidation(validation);
          console.log('✅ Photo validation completed:', validation);
        } catch (error) {
          console.error('❌ Photo validation failed:', error);
          // Set a fallback validation result
          setPhotoValidation({
            isValid: true,
            issues: ['Face detection unavailable - continuing with avatar creation'],
            recommendations: ['Your avatar will still be created successfully'],
            quality: {
              resolution: 'medium',
              lighting: 'fair',
              clarity: 'fair',
              overall: 50
            }
          });
        } finally {
          setIsValidating(false);
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    event.target.value = '';
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setPhotoValidation(null);
    setIsValidating(false);
    setUploadError(null);
    setUploadProgress(null);
  };

  return (
    <div className="min-h-screen flex flex-col px-4 sm:px-6 py-4 sm:py-8 relative overflow-hidden">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900 via-transparent to-slate-900"></div>
      </div>

      {/* Floating Elements - Hidden on mobile for cleaner look */}
      <div className="hidden sm:block absolute top-20 left-10 w-3 h-3 bg-amber-300 rounded-full animate-bounce opacity-60"></div>
      <div className="hidden sm:block absolute bottom-32 right-8 w-3 h-3 bg-stone-300 rounded-full animate-pulse opacity-60"></div>

      {/* Header - Mobile optimized */}
      <div className="flex items-center justify-between mb-4 sm:mb-8 z-10">
        <button className="glass-beige-light p-2 hover:glass-beige rounded-full transition-colors touch-manipulation">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
        </button>
        <div className="relative flex-1 mx-2">
          <h1 className="font-dancing-script text-4xl sm:text-6xl md:text-7xl leading-tight sm:leading-relaxed text-center text-black">
            {displayedText}
            {displayedText.length < fullText.length && (
              <span className="animate-pulse text-black">|</span>
            )}
          </h1>
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
        </div>
      </div>


      {/* Main Content Area - Centered - Mobile optimized spacing */}
      <div className="flex flex-col flex-grow justify-center items-center z-10 py-2 space-y-4 sm:space-y-6">
        {/* Photo Preview - Mobile responsive */}
        <div className="flex items-center justify-center w-full px-2">
          {capturedPhoto ? (
            <div className="relative">
              <img
                src={capturedPhoto.dataUrl}
                alt={`${photoStep.title} photo`}
                className="w-48 h-64 sm:w-56 sm:h-72 object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <button
                onClick={handleRetakePhoto}
                className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 glass-beige-light p-2 rounded-full shadow-lg hover:glass-beige active:scale-95 transition-all duration-300 touch-manipulation"
              >
                <RotateCcw className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          ) : (
            <div className="relative w-64 h-80 sm:w-72 sm:h-96 rounded-full bg-gradient-to-br from-stone-100/40 via-amber-50/30 to-stone-200/40 backdrop-blur-sm flex flex-col items-center justify-center p-6 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-stone-200/50 flex items-center justify-center mb-3 sm:mb-4">
                <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">{photoStep.title}</h3>
              <p className="text-gray-600 text-sm text-center px-4">{photoStep.instruction}</p>
              <p className="text-gray-500 text-xs text-center px-4 mt-2">{photoStep.tip}</p>
            </div>
          )}
        </div>

        {/* Photo Validation Results - Mobile optimized */}
        {capturedPhoto && (
          <div className="w-full max-w-sm mx-auto mb-4 sm:mb-6 px-2">
            {isValidating ? (
              <div className="bg-gradient-to-r from-amber-50 to-stone-50 rounded-xl p-3 sm:p-4 border border-amber-200">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                  <span className="text-xs sm:text-sm text-gray-700">Analyzing photo quality...</span>
                </div>
              </div>
            ) : photoValidation && (
              <div className={`rounded-xl p-3 sm:p-4 border ${
                photoValidation.isValid
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                  : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
              }`}>
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0">
                    {photoValidation.isValid ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mt-0.5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-xs sm:text-sm font-medium ${
                      photoValidation.isValid ? 'text-green-800' : 'text-orange-800'
                    }`}>
                      {photoValidation.isValid ? 'Photo looks great!' : 'Photo could be improved'}
                    </h4>

                    {photoValidation.issues.length > 0 && (
                      <ul className="mt-1.5 sm:mt-2 text-xs text-orange-700 space-y-1">
                        {photoValidation.issues.map((issue, index) => (
                          <li key={index} className="flex items-start space-x-1.5 sm:space-x-2">
                            <span className="text-orange-500 mt-0.5 text-xs">•</span>
                            <span className="leading-relaxed">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {photoValidation.recommendations.length > 0 && (
                      <div className="mt-1.5 sm:mt-2">
                        <div className="flex items-center space-x-1 mb-1">
                          <Info className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">Tips:</span>
                        </div>
                        <ul className="text-xs text-blue-700 space-y-1">
                          {photoValidation.recommendations.slice(0, 2).map((rec, index) => (
                            <li key={index} className="flex items-start space-x-1.5 sm:space-x-2">
                              <span className="text-blue-500 mt-0.5 text-xs">•</span>
                              <span className="leading-relaxed">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-1.5 sm:mt-2 text-xs text-gray-600">
                      Quality Score: {photoValidation.quality.overall}/100
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Progress/Error Messages - Mobile optimized */}
        {uploadProgress && (
          <div className="w-full max-w-sm mx-auto mb-3 sm:mb-4 px-2">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-3 sm:p-4 border border-purple-200">
              <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                <span className="text-xs sm:text-sm text-gray-700">{uploadProgress}</span>
              </div>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="w-full max-w-sm mx-auto mb-3 sm:mb-4 px-2">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-3 sm:p-4 border border-red-200">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-red-800 leading-relaxed">{uploadError}</p>
                  <button
                    onClick={() => setUploadError(null)}
                    className="text-xs text-red-600 hover:text-red-700 active:text-red-800 mt-1 underline touch-manipulation"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Mobile optimized with larger tap targets */}
        <div className="w-full max-w-sm mx-auto space-y-3 px-2">
          {!capturedPhoto ? (
            <>
              {/* Take Photo Button (Camera) */}
              <button
                onClick={handleTakePhoto}
                disabled={isCapturing || !!uploadProgress}
                className="relative w-full group transition-all duration-300 active:scale-[0.98] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl px-6 py-4 sm:px-8 sm:py-4 flex items-center justify-center shadow-lg active:shadow-md transition-shadow min-h-[64px]">
                  <Camera className="w-5 h-5 text-white mr-2 sm:mr-3 flex-shrink-0" />
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-white">
                      {isMobile ? 'Take Photo' : 'Use Camera'}
                    </div>
                    <div className="text-xs sm:text-sm text-purple-100">
                      Open camera
                    </div>
                  </div>
                </div>
              </button>

              {/* Choose from Photos Button */}
              <button
                onClick={handleChooseFromPhotos}
                disabled={isCapturing || !!uploadProgress}
                className="relative w-full group transition-all duration-300 active:scale-[0.98] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                <div className="bg-gradient-to-r from-stone-200/25 via-amber-100/25 to-stone-200/25 rounded-2xl px-6 py-4 sm:px-8 sm:py-4 flex items-center justify-center border-2 border-stone-200/50 active:border-stone-300/50 transition-colors min-h-[64px]">
                  <ImageIcon className="w-5 h-5 text-gray-700 mr-2 sm:mr-3 flex-shrink-0" />
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-black">
                      {isMobile ? 'Choose from Photos' : 'Upload Photo'}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      Select from {isMobile ? 'photo library' : 'files'}
                    </div>
                  </div>
                </div>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                console.log('Sending photo to next step:', capturedPhoto);
                onNext([capturedPhoto]);
              }}
              className="relative w-full group transition-all duration-300 active:scale-[0.98] focus:outline-none touch-manipulation bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl px-6 py-4 shadow-lg min-h-[64px]"
            >
              <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-base sm:text-lg font-bold text-white">
                    Continue to Avatar
                  </div>
                  <div className="text-xs sm:text-sm text-purple-100">
                    Generate your avatar
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>


      {/* Hidden File Inputs */}
      {/* Camera Input - Opens camera directly on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e, 'camera')}
        className="hidden"
      />

      {/* Photo Library Input - Opens file/photo picker */}
      <input
        ref={photoLibraryInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'photo_library')}
        className="hidden"
      />
    </div>
  );
};

export default PhotoCaptureFlow;