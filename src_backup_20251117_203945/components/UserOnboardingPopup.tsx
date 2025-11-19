import React, { useState } from 'react';
import { X, Calendar, User, Shield, Sparkles, MapPin } from 'lucide-react';
import { OnboardingPopupProps, OnboardingFormData } from '../types/user';
import useDevMode from '../hooks/useDevMode';
import { glassModalClasses } from '../styles/glassEffects';

const UserOnboardingPopup: React.FC<OnboardingPopupProps> = ({ isOpen, onComplete, onSkip }) => {
  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: '',
    birthday: '',
    city: '',
    state: ''
  });
  const [errors, setErrors] = useState<Partial<OnboardingFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useDevMode({
    onUserOnboarding: (demoData) => {
      setFormData({
        firstName: demoData.firstName || 'Alex',
        birthday: demoData.birthday || '1995-06-15',
        city: demoData.city || 'Austin',
        state: demoData.state || 'Texas'
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
      {/* Backdrop - Apple Blur */}
      <div className="absolute inset-0 bg-black/50 ios-blur" onClick={onSkip}></div>

      {/* Modal - Apple Card */}
      <div className="relative ios-card ios-blur bg-ios-bg-secondary/95 max-w-md w-full mx-4 ios-slide-up">
        {/* Header - Apple Design */}
        <div className="relative overflow-hidden rounded-t-ios-2xl bg-gradient-to-br from-ios-blue/10 to-ios-indigo/10 p-6">
          <div className="absolute top-2 right-2">
            <button
              onClick={onSkip}
              className="w-8 h-8 rounded-full bg-ios-fill hover:bg-ios-fill-secondary flex items-center justify-center transition-colors"
              aria-label="Skip onboarding"
            >
              <X className="w-5 h-5 text-ios-label-secondary" />
            </button>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-ios-blue to-ios-indigo rounded-full mb-4 shadow-ios-md">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="ios-title-1 mb-2">Welcome to FitChecked!</h2>
            <p className="ios-body text-ios-label-secondary">Let's personalize your experience</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* First Name - iOS Input */}
          <div>
            <label htmlFor="firstName" className="flex items-center ios-subheadline text-ios-label-secondary mb-2">
              <User className="w-4 h-4 mr-2 text-ios-blue" />
              What should we call you?
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter your first name"
              className={`ios-input ${errors.firstName ? 'border-ios-red' : ''}`}
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="mt-1 ios-caption-1 text-ios-red">{errors.firstName}</p>
            )}
          </div>

          {/* Birthday - iOS Input */}
          <div>
            <label htmlFor="birthday" className="flex items-center ios-subheadline text-ios-label-secondary mb-2">
              <Calendar className="w-4 h-4 mr-2 text-ios-blue" />
              When's your birthday?
            </label>
            <input
              type="date"
              id="birthday"
              value={formData.birthday}
              onChange={(e) => handleInputChange('birthday', e.target.value)}
              className={`ios-input ${errors.birthday ? 'border-ios-red' : ''}`}
              disabled={isSubmitting}
            />
            {errors.birthday && (
              <p className="mt-1 ios-caption-1 text-ios-red">{errors.birthday}</p>
            )}
            <p className="mt-1 ios-caption-1 text-ios-label-tertiary">We'll send you special birthday messages!</p>
          </div>

          {/* Location for Weather - iOS Inputs */}
          <div>
            <label className="flex items-center ios-subheadline text-ios-label-secondary mb-2">
              <MapPin className="w-4 h-4 mr-2 text-ios-blue" />
              Where are you located?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="City"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="ios-input"
                disabled={isSubmitting}
              />
              <input
                type="text"
                placeholder="State"
                value={formData.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="ios-input"
                disabled={isSubmitting}
              />
            </div>
            <p className="mt-1 ios-caption-1 text-ios-label-tertiary">
              📍 We'll use this for weather-appropriate outfit suggestions
            </p>
          </div>

          {/* Privacy Notice - Apple Style */}
          <div className="bg-ios-fill rounded-ios-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-ios-green flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="ios-subheadline mb-1">Privacy & Data</h4>
                <p className="ios-caption-1 text-ios-label-secondary leading-relaxed">
                  Your information is stored locally on your device only. We never share your personal data.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons - iOS Style */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 ios-button-secondary"
              disabled={isSubmitting}
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 ios-button-primary bg-gradient-to-r from-ios-blue to-ios-indigo disabled:opacity-50"
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