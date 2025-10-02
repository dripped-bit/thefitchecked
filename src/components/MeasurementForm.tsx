import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Ruler, Info, User } from 'lucide-react';

// Animated Checkmark Component
const AnimatedCheckmark: React.FC = () => (
  <div className="relative w-5 h-5">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 12l2 2 4-4"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-checkmark-draw"
        style={{
          strokeDasharray: '100',
          strokeDashoffset: '100'
        }}
      />
    </svg>
  </div>
);

interface MeasurementFormProps {
  onNext: () => void;
  useDefaultMeasurements?: boolean;
}

interface Measurements {
  height: string;
  chest: string;
  waist: string;
  hips: string;
  shoulders: string;
  inseam: string;
}

const MeasurementForm: React.FC<MeasurementFormProps> = ({ onNext, useDefaultMeasurements }) => {
  const [measurements, setMeasurements] = useState<Measurements>({
    height: '',
    chest: '',
    waist: '',
    hips: '',
    shoulders: '',
    inseam: ''
  });

  const [activeField, setActiveField] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: boolean}>({});

  // Handle default measurements population
  useEffect(() => {
    if (useDefaultMeasurements) {
      setMeasurements({
        height: "5'11\"",
        chest: '34',
        waist: '24',
        hips: '25',
        shoulders: '25.5',
        inseam: '26'
      });
      // Clear any existing errors when auto-populating
      setErrors({});
    } else {
      // Clear all measurements when unchecked
      setMeasurements({
        height: '',
        chest: '',
        waist: '',
        hips: '',
        shoulders: '',
        inseam: ''
      });
    }
  }, [useDefaultMeasurements]);

  const measurementFields = [
    {
      key: 'height',
      label: 'Height',
      placeholder: "5'8\" or 173cm",
      instruction: 'Stand straight against a wall',
      icon: '📏'
    },
    {
      key: 'chest',
      label: 'Chest/Bust',
      placeholder: '36" or 91cm',
      instruction: 'Measure around the fullest part',
      icon: '👕'
    },
    {
      key: 'waist',
      label: 'Waist',
      placeholder: '28" or 71cm',
      instruction: 'Measure at your natural waistline',
      icon: '📐'
    },
    {
      key: 'hips',
      label: 'Hips',
      placeholder: '38" or 96cm',
      instruction: 'Measure around the widest part',
      icon: '📏'
    },
    {
      key: 'shoulders',
      label: 'Shoulder Width',
      placeholder: '18" or 46cm',
      instruction: 'Measure from shoulder to shoulder',
      icon: '📐'
    },
    {
      key: 'inseam',
      label: 'Inseam',
      placeholder: '32" or 81cm',
      instruction: 'Measure from crotch to ankle',
      icon: '📏'
    }
  ];

  const handleInputChange = (key: string, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: false
      }));
    }
  };

  const validateField = (key: string, value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({
        ...prev,
        [key]: true
      }));
      return false;
    }
    return true;
  };

  const handleFieldBlur = (key: string) => {
    setActiveField(null);
    const value = measurements[key as keyof Measurements];
    validateField(key, value);
  };
  const isFormValid = Object.values(measurements).every(value => value.trim() !== '');

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button className="glass-beige-light p-2 hover:glass-beige rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Your Measurements Banner */}
      <img
        src="/my-measurements-image/your-measurments.png"
        alt="Your Measurements"
        className="w-full h-auto rounded-2xl mb-1"
      />

      {/* Instructions */}
      <img
        src="/my-measurement-tips-image.png/tips.png"
        alt="Measurement Tips"
        className="w-3/4 h-auto rounded-2xl mb-8 mx-auto"
      />

      {/* Measurement Fields */}
      <div className="space-y-6 flex-1 mb-8">
        {measurementFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">{field.icon}</span>
              <label className="text-lg font-semibold text-gray-800">
                {field.label}
              </label>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={measurements[field.key as keyof Measurements]}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                onFocus={() => setActiveField(field.key)}
                onBlur={() => handleFieldBlur(field.key)}
                placeholder={field.placeholder}
                className={`w-full px-4 py-4 glass-beige-light rounded-xl border-2 transition-all duration-300 text-lg ${
                  activeField === field.key
                    ? 'border-blue-500 shadow-lg shadow-blue-200/50 animate-glow-blue'
                    : errors[field.key]
                    ? 'border-red-500 shadow-lg shadow-red-200/50 animate-shake'
                    : 'border-gray-200 hover:border-gray-300'
                } ${errors[field.key] ? 'animate-shake' : ''}`}
              />
              <Ruler className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            
            {activeField === field.key && (
              <div className="animate-fadeIn">
                <p className="text-sm text-gray-600 glass-beige-light px-3 py-2 rounded-lg">
                  💡 {field.instruction}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Size Guide Link */}
      <div className="text-center mb-8">
        <button className="text-purple-600 font-medium hover:text-purple-700 hover:scale-105 transition-all duration-300">
          📊 Need help? View size guide
        </button>
      </div>

      {/* Continue Button */}
      <button
        onClick={() => onNext(measurements)}
        disabled={!isFormValid}
        className={`w-3/4 mx-auto py-3 font-semibold px-4 rounded-2xl shadow-lg transform transition-all duration-300 flex items-center justify-center space-x-2 relative group ${
          isFormValid
            ? 'glass-beige text-gray-800 hover:shadow-xl hover:shadow-yellow-400/50 hover:scale-105 hover:glass-beige-dark'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        <AnimatedCheckmark />
        <img
          src="/generate-avatar-button/pin.png"
          alt="Generate Avatar button"
          className="absolute inset-0 w-full h-full object-cover rounded-2xl z-0 opacity-70 filter-gold animate-golden-sparkle animate-golden-pulse group-hover:animate-golden-hover transition-all duration-300"
          style={{
            backgroundSize: '200% 100%',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Progress Indicator */}
      <div className="flex justify-center space-x-2 mt-6">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <div className="w-6 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );
};

export default MeasurementForm;