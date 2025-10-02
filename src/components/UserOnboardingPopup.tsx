import React, { useState } from 'react';
import { X, Calendar, User, Shield, Sparkles } from 'lucide-react';
import { OnboardingPopupProps, OnboardingFormData } from '../types/user';
import useDevMode from '../hooks/useDevMode';

const UserOnboardingPopup: React.FC<OnboardingPopupProps> = ({ isOpen, onComplete, onSkip }) => {
  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: '',
    birthday: ''
  });
  const [errors, setErrors] = useState<Partial<OnboardingFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useDevMode({
    onUserOnboarding: (demoData) => {
      setFormData({
        firstName: demoData.firstName || 'Alex',
        birthday: demoData.birthday || '1995-06-15'
      });
      // Clear any existing errors when demo data is filled
      setErrors({});
    }
  });

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Partial<OnboardingFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.birthday) {
      newErrors.birthday = 'Birthday is required';
    } else {
      const birthDate = new Date(formData.birthday);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120); // Maximum age
      const maxDate = new Date();
      maxDate.setFullYear(today.getFullYear() - 13); // Minimum age

      if (birthDate > maxDate) {
        newErrors.birthday = 'You must be at least 13 years old';
      } else if (birthDate < minDate) {
        newErrors.birthday = 'Please enter a valid birth date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate a brief loading state for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    onComplete(formData);
    setIsSubmitting(false);
  };

  const handleInputChange = (field: keyof OnboardingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onSkip}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          <div className="absolute top-2 right-2">
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Skip onboarding"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to FitChecked!</h2>
            <p className="text-gray-600">Let's personalize your experience</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 mr-2 text-blue-500" />
              What should we call you?
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter your first name"
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                errors.firstName
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              } focus:outline-none focus:ring-2`}
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Birthday */}
          <div>
            <label htmlFor="birthday" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 mr-2 text-blue-500" />
              When's your birthday?
            </label>
            <input
              type="date"
              id="birthday"
              value={formData.birthday}
              onChange={(e) => handleInputChange('birthday', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                errors.birthday
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              } focus:outline-none focus:ring-2`}
              disabled={isSubmitting}
            />
            {errors.birthday && (
              <p className="mt-1 text-sm text-red-600">{errors.birthday}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">We'll send you special birthday messages!</p>
          </div>

          {/* Privacy Notice */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-1">Privacy & Data</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your information is stored locally on your device only. We never share your personal data with third parties.
                  You can clear this data anytime in your browser settings.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              disabled={isSubmitting}
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Setting up...
                </span>
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserOnboardingPopup;