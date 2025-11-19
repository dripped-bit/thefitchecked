import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Ruler, Info, User, AlertTriangle, CheckCircle, Calculator } from 'lucide-react';
import { ProportionCalculator, BodyMeasurements, ProportionValidationResult } from '../utils/proportionCalculator';
import useDevMode from '../hooks/useDevMode';

interface EnhancedMeasurementFormProps {
  onNext: (measurements: BodyMeasurements, validation: ProportionValidationResult) => void;
  onBack?: () => void;
  capturedPhotos?: any[]; // Photos from previous step
}

interface MeasurementInputs {
  height: string;
  chest: string;
  waist: string;
  hips: string;
  shoulders: string;
  inseam: string;
  weight: string;
  age: string;
  gender: 'male' | 'female' | 'other';
}

const EnhancedMeasurementForm: React.FC<EnhancedMeasurementFormProps> = ({
  onNext,
  onBack,
  capturedPhotos
}) => {
  const [measurements, setMeasurements] = useState<MeasurementInputs>({
    height: '4\'11"',
    chest: '35"',
    waist: '23"',
    hips: '24"',
    shoulders: '24"',
    inseam: '24"',
    weight: '',
    age: '',
    gender: 'female'
  });

  const [activeField, setActiveField] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [validation, setValidation] = useState<ProportionValidationResult | null>(null);
  const [showIdealMeasurements, setShowIdealMeasurements] = useState(false);
  const [idealMeasurements, setIdealMeasurements] = useState<BodyMeasurements | null>(null);
  const [unit, setUnit] = useState<'cm' | 'inches'>('cm');

  // Add dev mode support for auto-filling measurements
  useDevMode({
    onMeasurements: (demoData) => {
      console.log('📝 [DEV-MODE] Auto-filling measurements:', demoData);
      setMeasurements({
        height: demoData.height || '4\'11"',
        chest: demoData.chest || '35"',
        waist: demoData.waist || '23"',
        hips: demoData.hips || '24"',
        shoulders: demoData.shoulders || demoData.shoulderWidth || '24"',
        inseam: demoData.inseam || '25"',
        weight: demoData.weight || '115 lbs',
        age: demoData.age || '28',
        gender: demoData.gender || 'female'
      });
    },
    onClearAll: () => {
      console.log('🧹 [DEV-MODE] Clearing measurement form');
      setMeasurements({
        height: '',
        chest: '',
        waist: '',
        hips: '',
        shoulders: '',
        inseam: '',
        weight: '',
        age: '',
        gender: 'female'
      });
      setErrors({});
      setValidation(null);
    }
  });

  const measurementFields = [
    {
      key: 'height',
      label: 'Height',
      placeholder: unit === 'cm' ? '170cm' : '5\'7"',
      instruction: 'Stand straight against a wall, measure from floor to top of head',
      icon: '📏',
      required: true
    },
    {
      key: 'chest',
      label: 'Chest/Bust',
      placeholder: unit === 'cm' ? '90cm' : '36"',
      instruction: 'Measure around the fullest part of your chest/bust',
      icon: '👕',
      required: true
    },
    {
      key: 'waist',
      label: 'Waist',
      placeholder: unit === 'cm' ? '70cm' : '28"',
      instruction: 'Measure at your natural waistline (narrowest part)',
      icon: '📐',
      required: true
    },
    {
      key: 'hips',
      label: 'Hips',
      placeholder: unit === 'cm' ? '95cm' : '38"',
      instruction: 'Measure around the widest part of your hips',
      icon: '📏',
      required: true
    },
    {
      key: 'shoulders',
      label: 'Shoulder Width',
      placeholder: unit === 'cm' ? '45cm' : '18"',
      instruction: 'Measure from shoulder point to shoulder point across your back',
      icon: '📐',
      required: true
    },
    {
      key: 'inseam',
      label: 'Inseam',
      placeholder: unit === 'cm' ? '80cm' : '32"',
      instruction: 'Measure from crotch to ankle bone along inside of leg',
      icon: '📏',
      required: true
    },
    {
      key: 'weight',
      label: 'Weight (Optional)',
      placeholder: '65kg / 143lbs',
      instruction: 'Your current weight for BMI calculation',
      icon: '⚖️',
      required: false
    },
    {
      key: 'age',
      label: 'Age (Optional)',
      placeholder: '25',
      instruction: 'Your age for more accurate body modeling',
      icon: '🎂',
      required: false
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
        [key]: ''
      }));
    }

    // Auto-validate on height change to generate ideal measurements
    if (key === 'height' && value) {
      const parsed = ProportionCalculator.parseMeasurementString(value);
      if (parsed) {
        const heightInCm = parsed.unit === 'inches' ? Math.round(parsed.value * 2.54) : parsed.value;
        if (heightInCm > 100 && heightInCm < 250) { // Reasonable height range
          const ideal = ProportionCalculator.generateIdealMeasurements(heightInCm, measurements.gender);
          setIdealMeasurements(ideal);
        }
      }
    }
  };

  const validateField = (key: string, value: string): string => {
    if (measurementFields.find(f => f.key === key)?.required && !value.trim()) {
      return 'This measurement is required';
    }

    if (value.trim()) {
      const parsed = ProportionCalculator.parseMeasurementString(value);
      if (!parsed && key !== 'age' && key !== 'weight') {
        return 'Invalid format. Use cm (e.g., "170cm") or inches (e.g., "5\'7\"")';
      }

      // Validate reasonable ranges
      if (parsed) {
        const valueInCm = parsed.unit === 'inches' ? parsed.value * 2.54 : parsed.value;

        switch (key) {
          case 'height':
            if (valueInCm < 120 || valueInCm > 230) {
              return 'Height should be between 120-230cm (4\'-7\'6")';
            }
            break;
          case 'chest':
          case 'waist':
          case 'hips':
            if (valueInCm < 50 || valueInCm > 200) {
              return 'Measurement should be between 50-200cm (20"-80")';
            }
            break;
          case 'shoulders':
            if (valueInCm < 30 || valueInCm > 80) {
              return 'Shoulder width should be between 30-80cm (12"-32")';
            }
            break;
          case 'inseam':
            if (valueInCm < 50 || valueInCm > 120) {
              return 'Inseam should be between 50-120cm (20"-48")';
            }
            break;
        }
      }

      // Validate age and weight
      if (key === 'age' && value) {
        const age = parseInt(value);
        if (isNaN(age) || age < 13 || age > 100) {
          return 'Age should be between 13-100 years';
        }
      }

      if (key === 'weight' && value) {
        const weightMatch = value.match(/(\d+\.?\d*)\s*(kg|lbs)?/);
        if (!weightMatch) {
          return 'Invalid weight format. Use kg or lbs (e.g., "65kg" or "143lbs")';
        }
      }
    }

    return '';
  };

  const handleFieldBlur = (key: string) => {
    setActiveField(null);
    const value = measurements[key as keyof MeasurementInputs];
    const error = validateField(key, value);

    if (error) {
      setErrors(prev => ({
        ...prev,
        [key]: error
      }));
    }
  };

  const parseMeasurements = (): BodyMeasurements | null => {
    try {
      const parsed: any = {
        gender: measurements.gender
      };

      // Parse required measurements
      const requiredFields = ['height', 'chest', 'waist', 'hips', 'shoulders', 'inseam'];

      for (const field of requiredFields) {
        const value = measurements[field as keyof MeasurementInputs];
        if (!value) return null;

        const parsedValue = ProportionCalculator.parseMeasurementString(value);
        if (!parsedValue) return null;

        // Convert to cm
        parsed[field] = parsedValue.unit === 'inches'
          ? Math.round(parsedValue.value * 2.54)
          : Math.round(parsedValue.value);
      }

      // Parse optional measurements
      if (measurements.weight) {
        const weightMatch = measurements.weight.match(/(\d+\.?\d*)\s*(kg|lbs)?/);
        if (weightMatch) {
          let weight = parseFloat(weightMatch[1]);
          const unit = weightMatch[2]?.toLowerCase();
          if (unit === 'lbs') {
            weight = weight * 0.453592; // Convert to kg
          }
          parsed.weight = Math.round(weight);
        }
      }

      if (measurements.age) {
        parsed.age = parseInt(measurements.age);
      }

      return parsed as BodyMeasurements;
    } catch (error) {
      return null;
    }
  };

  const validateMeasurements = () => {
    const parsedMeasurements = parseMeasurements();
    if (!parsedMeasurements) {
      setValidation(null);
      return;
    }

    const result = ProportionCalculator.validateMeasurements(parsedMeasurements);
    setValidation(result);
  };

  const isFormValid = () => {
    const hasAllRequired = measurementFields
      .filter(f => f.required)
      .every(f => measurements[f.key as keyof MeasurementInputs].trim() !== '');

    const hasNoErrors = Object.values(errors).every(error => !error);

    return hasAllRequired && hasNoErrors;
  };

  const handleContinue = () => {
    const parsedMeasurements = parseMeasurements();
    if (parsedMeasurements && validation) {
      onNext(parsedMeasurements, validation);
    }
  };

  const applyIdealMeasurement = (field: string) => {
    if (idealMeasurements) {
      const value = idealMeasurements[field as keyof BodyMeasurements];
      if (typeof value === 'number') {
        const displayValue = unit === 'inches'
          ? `${Math.round(value / 2.54)}"`
          : `${value}cm`;

        setMeasurements(prev => ({
          ...prev,
          [field]: displayValue
        }));
      }
    }
  };

  // Trigger validation when measurements change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isFormValid()) {
        validateMeasurements();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [measurements]);

  const renderValidationResults = () => {
    if (!validation) return null;

    return (
      <div className="mt-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50">
        <div className="flex items-center space-x-2 mb-3">
          <Calculator className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-lg">Proportion Analysis</h3>
          <div className={`px-2 py-1 rounded-full text-sm font-bold ${
            validation.score >= 85 ? 'bg-green-100 text-green-800' :
            validation.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {validation.score}/100
          </div>
        </div>

        <div className="mb-3">
          <p className="font-medium text-gray-700">Body Type: {validation.bodyType}</p>
        </div>

        {validation.issues.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-1 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <p className="font-medium text-sm text-orange-800">Proportion Notes:</p>
            </div>
            <ul className="text-sm space-y-1 text-gray-700">
              {validation.issues.map((issue, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-orange-500">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.recommendations.length > 0 && (
          <div>
            <div className="flex items-center space-x-1 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <p className="font-medium text-sm text-blue-800">Recommendations:</p>
            </div>
            <ul className="text-sm space-y-1 text-gray-700">
              {validation.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-blue-500">💡</span>
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
    <div className="min-h-screen flex flex-col px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/50 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                unit === 'cm' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
              }`}
            >
              CM
            </button>
            <button
              onClick={() => setUnit('inches')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                unit === 'inches' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
              }`}
            >
              INCHES
            </button>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center mb-2">Body Measurements</h1>
      <p className="text-center text-gray-600 mb-6">Accurate measurements ensure a perfect 3D avatar</p>

      {/* Gender Selection */}
      <div className="mb-6">
        <label className="block text-lg font-semibold text-gray-800 mb-3">Gender</label>
        <div className="flex space-x-3">
          {(['female', 'male', 'other'] as const).map((genderOption) => (
            <button
              key={genderOption}
              onClick={() => setMeasurements(prev => ({ ...prev, gender: genderOption }))}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                measurements.gender === genderOption
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {genderOption.charAt(0).toUpperCase() + genderOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Ideal Measurements Helper */}
      {idealMeasurements && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-800">Suggested Proportions</h3>
            <button
              onClick={() => setShowIdealMeasurements(!showIdealMeasurements)}
              className="text-blue-600 text-sm hover:text-blue-800"
            >
              {showIdealMeasurements ? 'Hide' : 'Show'}
            </button>
          </div>
          {showIdealMeasurements && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {measurementFields.filter(f => f.required && f.key !== 'height').map(field => (
                <div key={field.key} className="flex justify-between items-center">
                  <span>{field.label}:</span>
                  <button
                    onClick={() => applyIdealMeasurement(field.key)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {unit === 'inches'
                      ? `${Math.round((idealMeasurements[field.key as keyof BodyMeasurements] as number) / 2.54)}"`
                      : `${idealMeasurements[field.key as keyof BodyMeasurements]}cm`
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Measurement Fields */}
      <div className="space-y-6 flex-1 mb-8">
        {measurementFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">{field.icon}</span>
              <label className="text-lg font-semibold text-gray-800">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                value={measurements[field.key as keyof MeasurementInputs]}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                onFocus={() => setActiveField(field.key)}
                onBlur={() => handleFieldBlur(field.key)}
                placeholder={field.placeholder}
                className={`w-full px-4 py-4 bg-white rounded-xl border-2 transition-all duration-300 text-lg ${
                  activeField === field.key
                    ? 'border-blue-500 shadow-lg shadow-blue-200/50'
                    : errors[field.key]
                    ? 'border-red-500 shadow-lg shadow-red-200/50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              />
              <Ruler className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {errors[field.key] && (
              <p className="text-red-600 text-sm">{errors[field.key]}</p>
            )}

            {activeField === field.key && (
              <div className="animate-fadeIn">
                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  💡 {field.instruction}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Validation Results */}
      {renderValidationResults()}

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!isFormValid() || !validation?.isValid}
        className={`w-full py-4 px-6 font-semibold rounded-2xl shadow-lg transform transition-all duration-300 flex items-center justify-center space-x-2 mt-6 ${
          isFormValid() && validation?.isValid
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-xl hover:scale-105'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {validation?.isValid ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <Calculator className="w-5 h-5" />
        )}
        <span>Generate 3D Avatar</span>
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Size Guide Link */}
      <div className="text-center mt-4">
        <button className="text-purple-600 font-medium hover:text-purple-700 hover:scale-105 transition-all duration-300">
          📊 Need help? View measurement guide
        </button>
      </div>
    </div>
  );
};

export default EnhancedMeasurementForm;