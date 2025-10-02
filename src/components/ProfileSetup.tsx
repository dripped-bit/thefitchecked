import React, { useState } from 'react';
import { ArrowLeft, User, Heart, Sparkles, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

interface ProfileSetupProps {
  onComplete: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    stylePreferences: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: boolean}>({});
  const [activeField, setActiveField] = useState<string | null>(null);

  const genderOptions = [
    { id: 'female', label: 'Female', emoji: '👩' },
    { id: 'male', label: 'Male', emoji: '👨' },
    { id: 'non-binary', label: 'Non-binary', emoji: '🧑' },
    { id: 'prefer-not-to-say', label: 'Prefer not to say', emoji: '✨' }
  ];

  const styleOptions = [
    { id: 'casual', label: 'Casual', emoji: '👕' },
    { id: 'formal', label: 'Formal', emoji: '👔' },
    { id: 'sporty', label: 'Sporty', emoji: '🏃‍♀️' },
    { id: 'trendy', label: 'Trendy', emoji: '✨' },
    { id: 'vintage', label: 'Vintage', emoji: '🕰️' },
    { id: 'bohemian', label: 'Bohemian', emoji: '🌸' },
    { id: 'minimalist', label: 'Minimalist', emoji: '⚪' },
    { id: 'edgy', label: 'Edgy', emoji: '🖤' }
  ];

  const handleStylePreferenceToggle = (styleId: string) => {
    setFormData(prev => ({
      ...prev,
      stylePreferences: prev.stylePreferences.includes(styleId)
        ? prev.stylePreferences.filter(id => id !== styleId)
        : [...prev.stylePreferences, styleId]
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: false
      }));
    }
  };

  const validateField = (field: string, value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({
        ...prev,
        [field]: true
      }));
      return false;
    }
    return true;
  };

  const handleFieldBlur = (field: string) => {
    setActiveField(null);
    const value = formData[field as keyof typeof formData] as string;
    validateField(field, value);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.age || !formData.gender) return;
    
    setIsSubmitting(true);
    
    try {
      // Create anonymous user session first
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      
      if (authError) throw authError;

      // Save user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: authData.user.id,
            name: formData.name,
            age: parseInt(formData.age),
            gender: formData.gender,
            style_preferences: formData.stylePreferences,
            created_at: new Date().toISOString()
          }
        ]);

      if (profileError) throw profileError;

      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      // For demo purposes, continue anyway
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name && formData.age && formData.gender;

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 max-w-md mx-auto bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between mb-0 relative">
        <button className="glass-beige-light p-2 hover:glass-beige hover:scale-105 rounded-full transition-all duration-300">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-gray-400 via-gray-100 via-white via-gray-100 to-gray-400 bg-clip-text text-transparent bg-[length:200%_100%] animate-metallic-shimmer drop-shadow-2xl hover:drop-shadow-3xl transition-all duration-300 absolute left-1/2 transform -translate-x-1/2">Complete Your Profile</h1>
        <div className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        {/* Basic Info */}
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              What's your name?
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onFocus={() => setActiveField('name')}
              onBlur={() => handleFieldBlur('name')}
              placeholder="Enter your name"
              className={`w-full px-4 py-4 glass-beige-light rounded-xl border-2 transition-all duration-300 text-lg ${
                activeField === 'name'
                  ? 'border-blue-500 shadow-lg shadow-blue-200/50 animate-glow-blue'
                  : errors.name
                  ? 'border-red-500 shadow-lg shadow-red-200/50 animate-shake'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              How old are you?
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              onFocus={() => setActiveField('age')}
              onBlur={() => handleFieldBlur('age')}
              placeholder="Enter your age"
              min="13"
              max="100"
              className={`w-full px-4 py-4 glass-beige-light rounded-xl border-2 transition-all duration-300 text-lg ${
                activeField === 'age'
                  ? 'border-blue-500 shadow-lg shadow-blue-200/50 animate-glow-blue'
                  : errors.age
                  ? 'border-red-500 shadow-lg shadow-red-200/50 animate-shake'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            />
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Gender
            </label>
            <div className="grid grid-cols-2 gap-2">
              {genderOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setFormData(prev => ({ ...prev, gender: option.id }))}
                  className={`p-2 rounded-xl border-2 transition-all duration-300 text-left ${
                    formData.gender === option.id
                      ? 'border-purple-500 glass-beige-dark'
                      : 'border-gray-200 hover:border-gray-300 glass-beige-light'
                  } hover:scale-105 hover:shadow-lg`}
                >
                  <div className="text-lg mb-1">{option.emoji}</div>
                  <p className="text-xs font-medium text-gray-700">{option.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Style Preferences */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-pink-500" />
            Style Preferences (Optional)
          </label>
          <p className="text-xs text-gray-600 mb-2">Select styles you love to get personalized recommendations</p>
          
          <div className="grid grid-cols-2 gap-2">
            {styleOptions.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStylePreferenceToggle(style.id)}
                className={`p-2 rounded-xl border-2 transition-all duration-300 text-left ${
                  formData.stylePreferences.includes(style.id)
                    ? 'border-pink-500 glass-beige-dark'
                    : 'border-gray-200 hover:border-gray-300 glass-beige-light'
                } hover:scale-105 hover:shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg mb-1">{style.emoji}</div>
                    <p className="text-xs font-medium text-gray-700">{style.label}</p>
                  </div>
                  {formData.stylePreferences.includes(style.id) && (
                    <CheckCircle className="w-5 h-5 text-pink-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Button */}
      <div className="mt-0">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="max-w-md mx-auto bg-transparent text-purple-600 font-semibold p-0 m-0 rounded-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img
            src="/set-up/completed.PNG"
            alt="Complete Profile Setup button"
            className="w-full object-contain rounded-2xl block"
          />
          {isSubmitting && (
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center space-x-2 mt-0">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <div className="w-6 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
      </div>
    </div>
  );
};

export default ProfileSetup;