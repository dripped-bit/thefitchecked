/**
 * User data types for the FitChecked application
 */

export interface UserData {
  firstName: string;
  birthday: string; // ISO date string (YYYY-MM-DD)
  onboardingCompleted: boolean;
  createdAt: string; // ISO date string
  city?: string; // User's city for weather
  state?: string; // User's state for weather
  timezone?: string; // User's timezone (e.g., "America/Los_Angeles")
}

export interface UserGreeting {
  message: string;
  isSpecial: boolean; // true for birthday or special occasions
  emoji?: string;
}

export interface OnboardingFormData {
  firstName: string;
  birthday: string;
  city?: string;
  state?: string;
}

export interface OnboardingPopupProps {
  isOpen: boolean;
  onComplete: (userData: OnboardingFormData) => void;
  onSkip: () => void;
}