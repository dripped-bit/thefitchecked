import React, { useState, useRef } from 'react';
import { Camera, RotateCcw, CheckCircle, ArrowRight, ArrowLeft, Sparkles, AlertTriangle, Info } from 'lucide-react';
import { PhotoValidator, getPoseInstructions, PhotoValidationResult } from '../utils/photoValidation';

interface PhotoCaptureFlowProps {
  onNext: (photos: CapturedPhoto[]) => void;
  onBack?: () => void;
}

interface CapturedPhoto {
  id: string;
  pose: string;
  file: File;
  dataUrl: string;
  validation: PhotoValidationResult;
  timestamp: number;
}

const EnhancedPhotoCaptureFlow: React.FC<PhotoCaptureFlowProps> = ({ onNext, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<PhotoValidationResult[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced photo steps for full body capture
  const photoSteps = [
    {
      id: 'front_upper',
      title: 'Front View (Upper)',
      instruction: 'Face the camera - upper body focus',
      pose: 'front',
      icon: '🤳',
      tip: 'Show from waist up, arms slightly away from body',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'side_upper',
      title: 'Side View (Upper)',
      instruction: 'Turn 90° right - upper body profile',
      pose: 'side',
      icon: '📸',
      tip: 'Complete side profile, arms away from body',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'back_upper',
      title: 'Back View (Upper)',
      instruction: 'Turn your back - upper body',
      pose: 'back',
      icon: '📷',
      tip: 'Show back from waist up, keep posture straight',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'front_full',
      title: 'Front View (Full)',
      instruction: 'Face camera - full body',
      pose: 'front',
      icon: '🧍',
      tip: 'Full body shot, head to feet visible',
      color: 'from-slate-500 to-gray-600'
    },
    {
      id: 'side_full',
      title: 'Side View (Full)',
      instruction: 'Turn 90° right - full body profile',
      pose: 'side',
      icon: '🚶',
      tip: 'Complete side profile, full body visible',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      id: 'back_full',
      title: 'Back View (Full)',
      instruction: 'Turn your back - full body',
      pose: 'back',
      icon: '🏃',
      tip: 'Full body back view, head to feet',
      color: 'from-pink-500 to-rose-500'
    }
  ];

  const currentStepData = photoSteps[currentStep];
  const progressPercent = (currentStep / photoSteps.length) * 100;
  const allPhotosComplete = capturedPhotos.length === photoSteps.length;
  const currentInstructions = getPoseInstructions(currentStepData?.pose || 'front');

  const handlePhotoCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsValidating(true);

    try {
      // Create data URL for preview
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;

        // Validate the photo
        const validation = await PhotoValidator.validatePhoto(file, currentStepData.pose);

        // Create photo object
        const newPhoto: CapturedPhoto = {
          id: currentStepData.id,
          pose: currentStepData.pose,
          file,
          dataUrl,
          validation,
          timestamp: Date.now()
        };

        // Update captured photos
        const updatedPhotos = [...capturedPhotos];
        const existingIndex = updatedPhotos.findIndex(p => p.id === currentStepData.id);

        if (existingIndex >= 0) {
          updatedPhotos[existingIndex] = newPhoto;
        } else {
          updatedPhotos.push(newPhoto);
        }

        setCapturedPhotos(updatedPhotos);
        setValidationResults(prev => {
          const updated = [...prev];
          updated[currentStep] = validation;
          return updated;
        });

        // Auto-advance if photo is good quality
        if (validation.score >= 80 && currentStep < photoSteps.length - 1) {
          setTimeout(() => {
            setCurrentStep(currentStep + 1);
            setShowInstructions(true);
          }, 1500);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing photo:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRetakePhoto = () => {
    const updatedPhotos = capturedPhotos.filter(p => p.id !== currentStepData.id);
    setCapturedPhotos(updatedPhotos);
    setValidationResults(prev => {
      const updated = [...prev];
      updated[currentStep] = undefined!;
      return updated;
    });
  };

  const getCurrentPhoto = () => {
    return capturedPhotos.find(p => p.id === currentStepData.id);
  };

  const getStepStatus = (stepIndex: number) => {
    const photo = capturedPhotos.find(p => p.id === photoSteps[stepIndex].id);
    if (!photo) return 'pending';

    if (photo.validation.score >= 80) return 'excellent';
    if (photo.validation.score >= 60) return 'good';
    return 'needs_improvement';
  };

  const handleContinue = () => {
    const validPhotos = capturedPhotos.filter(p => p.validation.isValid);
    if (validPhotos.length === photoSteps.length) {
      onNext(capturedPhotos);
    }
  };

  const renderValidationFeedback = (validation: PhotoValidationResult) => {
    if (!validation) return null;

    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-600 bg-green-50';
      if (score >= 60) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
    };

    return (
      <div className={`mt-4 p-4 rounded-xl border ${getScoreColor(validation.score)}`}>
        <div className="flex items-center space-x-2 mb-2">
          <div className={`text-lg font-bold ${getScoreColor(validation.score)}`}>
            Quality Score: {validation.score}/100
          </div>
          {validation.score >= 80 && <CheckCircle className="w-5 h-5 text-green-600" />}
          {validation.score < 60 && <AlertTriangle className="w-5 h-5 text-red-600" />}
        </div>

        {validation.issues.length > 0 && (
          <div className="mb-2">
            <p className="font-medium text-sm mb-1">Issues to fix:</p>
            <ul className="text-sm space-y-1">
              {validation.issues.map((issue, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span>•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.recommendations.length > 0 && (
          <div>
            <p className="font-medium text-sm mb-1">Recommendations:</p>
            <ul className="text-sm space-y-1">
              {validation.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span>💡</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <img
          src="https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
          alt="Background"
          className="w-full h-full object-cover opacity-50 mix-blend-multiply"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/50 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-gray-400 via-gray-100 via-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            Capture Photos for 3D Avatar
          </h1>
        </div>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="p-2 hover:bg-white/50 rounded-full transition-colors"
        >
          <Info className="w-6 h-6 text-purple-500" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 z-10">
        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
          <div
            className={`bg-gradient-to-r ${currentStepData?.color || 'from-purple-500 to-pink-500'} h-3 rounded-full shadow-lg transition-all duration-1000 ease-out`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Photo {currentStep + 1} of {photoSteps.length}</span>
          <span>{Math.round(progressPercent)}% Complete</span>
        </div>
      </div>

      {/* Instructions Panel */}
      {showInstructions && currentStepData && (
        <div className="mb-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 z-10">
          <h3 className="font-bold text-lg mb-2">{currentInstructions.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-sm mb-2">Instructions:</p>
              <ul className="text-sm space-y-1">
                {currentInstructions.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-sm mb-2">Tip:</p>
              <p className="text-sm text-gray-600">{currentInstructions.tips}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 space-y-4">
        {/* Photo Preview */}
        <div className="relative">
          {getCurrentPhoto() ? (
            <div className="relative">
              <img
                src={getCurrentPhoto()!.dataUrl}
                alt={`${currentStepData.title} photo`}
                className="w-64 h-80 object-cover rounded-2xl shadow-2xl"
              />

              {/* Quality Badge */}
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-bold ${
                getCurrentPhoto()!.validation.score >= 80
                  ? 'bg-green-500 text-white'
                  : getCurrentPhoto()!.validation.score >= 60
                  ? 'bg-yellow-500 text-white'
                  : 'bg-red-500 text-white'
              }`}>
                {getCurrentPhoto()!.validation.score}/100
              </div>

              <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>

              <button
                onClick={handleRetakePhoto}
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
              >
                <RotateCcw className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          ) : (
            <div className="w-64 h-80 bg-white/5 backdrop-blur-lg rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-600">{currentStepData.title}</p>
                <p className="text-sm text-gray-500">{currentStepData.instruction}</p>
              </div>
            </div>
          )}
        </div>

        {/* Validation Feedback */}
        {getCurrentPhoto() && renderValidationFeedback(getCurrentPhoto()!.validation)}

        {/* Action Buttons */}
        <div className="w-full max-w-md space-y-4">
          {!getCurrentPhoto() ? (
            <button
              onClick={handlePhotoCapture}
              disabled={isValidating}
              className={`w-full py-4 px-6 bg-gradient-to-r ${currentStepData?.color || 'from-slate-500 to-gray-600'} text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 ${
                isValidating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>{isValidating ? 'Processing...' : 'Take Photo'}</span>
            </button>
          ) : currentStep < photoSteps.length - 1 ? (
            <button
              onClick={() => {
                setCurrentStep(currentStep + 1);
                setShowInstructions(true);
              }}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>Next Photo</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : null}

          {allPhotosComplete && (
            <button
              onClick={handleContinue}
              disabled={!capturedPhotos.every(p => p.validation.isValid)}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Continue to Measurements</span>
            </button>
          )}
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="flex justify-center space-x-2 mt-4 z-10 overflow-x-auto pb-2">
        {photoSteps.map((step, index) => {
          const status = getStepStatus(index);
          const photo = capturedPhotos.find(p => p.id === step.id);

          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`flex-shrink-0 w-16 h-20 rounded-lg flex items-center justify-center text-xs transition-all duration-300 shadow-lg hover:scale-105 ${
                index === currentStep
                  ? `bg-gradient-to-br ${step.color} text-white shadow-lg`
                  : status === 'excellent'
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
                  : status === 'good'
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                  : status === 'needs_improvement'
                  ? 'bg-gradient-to-br from-red-400 to-pink-500 text-white'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
              }`}
            >
              {photo ? (
                <img
                  src={photo.dataUrl}
                  alt={step.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <div className="text-lg mb-1">{step.icon}</div>
                  <div className="text-xs font-medium">{step.title.split(' ')[0]}</div>
                </div>
              )}
            </button>
          );
        })}
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

export default EnhancedPhotoCaptureFlow;