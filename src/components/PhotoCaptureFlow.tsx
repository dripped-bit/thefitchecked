import React, { useState, useRef, useEffect } from 'react';
import { Camera, RotateCcw, CheckCircle, ArrowRight, User, ArrowLeft, Sparkles, AlertCircle, Info } from 'lucide-react';
import { CapturedPhoto } from '../types/photo';
import { faceAnalysisService, PhotoValidation } from '../services/faceAnalysisService';

interface PhotoCaptureFlowProps {
  onNext: (photos: CapturedPhoto[]) => void;
}

const PhotoCaptureFlow: React.FC<PhotoCaptureFlowProps> = ({ onNext }) => {
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoValidation, setPhotoValidation] = useState<PhotoValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'Create Avatar';

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

  const handlePhotoCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;

        const newCapturedPhoto: CapturedPhoto = {
          id: `${photoStep.id}_${Date.now()}`,
          view: photoStep.view,
          type: photoStep.type,
          dataUrl: imageData,
          timestamp: Date.now(),
          file: file
        };

        setCapturedPhoto(newCapturedPhoto);
        console.log('📸 Photo captured:', newCapturedPhoto);

        // Validate the photo
        setIsValidating(true);
        setPhotoValidation(null);

        try {
          console.log('🔍 Validating photo quality and face detection...');
          const validation = await faceAnalysisService.validatePhoto(imageData);
          setPhotoValidation(validation);
          console.log('✅ Photo validation completed:', validation);
        } catch (error) {
          console.error('❌ Photo validation failed:', error);
          // Set a fallback validation result
          setPhotoValidation({
            isValid: true,
            issues: [],
            recommendations: [],
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
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setPhotoValidation(null);
    setIsValidating(false);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 relative overflow-hidden">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-900 via-transparent to-slate-900"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-amber-300 rounded-full animate-bounce opacity-60"></div>
      <div className="absolute bottom-32 right-8 w-3 h-3 bg-stone-300 rounded-full animate-pulse opacity-60"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 z-10">
        <button className="glass-beige-light p-2 hover:glass-beige rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="relative">
          <h1 className="font-dancing-script text-6xl md:text-7xl mb-4 leading-relaxed text-center text-black">
            {displayedText}
            {displayedText.length < fullText.length && (
              <span className="animate-pulse text-black">|</span>
            )}
          </h1>
        </div>
        <div className="w-10 h-10 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-amber-500" />
        </div>
      </div>


      {/* Main Content Area - Centered */}
      <div className="flex flex-col flex-grow justify-center items-center z-10 py-2 space-y-6">
        {/* Photo Preview */}
        <div className="flex items-center justify-center">
          {capturedPhoto ? (
            <div className="relative">
              <img
                src={capturedPhoto.dataUrl}
                alt={`${photoStep.title} photo`}
                className="w-56 h-72 object-cover rounded-2xl shadow-2xl"
              />
              <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <button
                onClick={handleRetakePhoto}
                className="absolute bottom-4 right-4 glass-beige-light p-2 rounded-full shadow-lg hover:glass-beige hover:scale-110 transition-all duration-300"
              >
                <RotateCcw className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          ) : (
            <div className="relative w-72 h-96 rounded-full bg-gradient-to-br from-stone-100/40 via-amber-50/30 to-stone-200/40 backdrop-blur-sm flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 rounded-full bg-stone-200/50 flex items-center justify-center mb-4">
                <Camera className="w-10 h-10 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{photoStep.title}</h3>
              <p className="text-gray-600 text-sm text-center px-4">{photoStep.instruction}</p>
              <p className="text-gray-500 text-xs text-center px-4 mt-2">{photoStep.tip}</p>
            </div>
          )}
        </div>

        {/* Photo Validation Results */}
        {capturedPhoto && (
          <div className="w-full max-w-sm mx-auto mb-6">
            {isValidating ? (
              <div className="bg-gradient-to-r from-amber-50 to-stone-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-700">Analyzing photo quality...</span>
                </div>
              </div>
            ) : photoValidation && (
              <div className={`rounded-xl p-4 border ${
                photoValidation.isValid
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                  : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {photoValidation.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${
                      photoValidation.isValid ? 'text-green-800' : 'text-orange-800'
                    }`}>
                      {photoValidation.isValid ? 'Photo looks great!' : 'Photo could be improved'}
                    </h4>

                    {photoValidation.issues.length > 0 && (
                      <ul className="mt-2 text-xs text-orange-700 space-y-1">
                        {photoValidation.issues.map((issue, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-orange-500 mt-0.5">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {photoValidation.recommendations.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-1 mb-1">
                          <Info className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">Tips:</span>
                        </div>
                        <ul className="text-xs text-blue-700 space-y-1">
                          {photoValidation.recommendations.slice(0, 2).map((rec, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-600">
                      Quality Score: {photoValidation.quality.overall}/100
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full max-w-sm mx-auto">
          {!capturedPhoto ? (
            <button
              onClick={handlePhotoCapture}
              disabled={isCapturing}
              className="relative w-full group transition-all duration-300 hover:scale-[1.02] focus:outline-none"
            >
              <div className="bg-gradient-to-r from-stone-200/25 via-amber-100/25 to-stone-200/25 rounded-2xl px-8 py-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-black">
                    Take Photo
                  </div>
                  <div className="text-sm text-gray-600">
                    {photoStep.title}
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                console.log('Sending photo to next step:', capturedPhoto);
                onNext([capturedPhoto]);
              }}
              className="relative w-full group transition-all duration-300 hover:scale-[1.02] focus:outline-none"
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-stone-200/50 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-gray-700" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-black">
                    Continue to Avatar
                  </div>
                  <div className="text-sm text-gray-600">
                    Generate your avatar
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>


      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default PhotoCaptureFlow;