/**
 * User data service for managing localStorage operations and user data
 */

import { UserData, UserGreeting, OnboardingFormData } from '../types/user';

const STORAGE_KEYS = {
  USER_DATA: 'fitchecked_user_data',
  ONBOARDING_SHOWN: 'fitchecked_onboarding_shown',
  FLOW_COMPLETED: 'fitchecked_flow_completed'
} as const;

export class UserService {
  /**
   * Save user data to localStorage
   */
  static saveUserData(formData: OnboardingFormData): UserData {
    const userData: UserData = {
      firstName: formData.firstName.trim(),
      birthday: formData.birthday,
      city: formData.city?.trim(),
      state: formData.state?.trim(),
      onboardingCompleted: true,
      createdAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_SHOWN, 'true');
      return userData;
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw new Error('Unable to save user preferences');
    }
  }

  /**
   * Get user data from localStorage
   */
  static getUserData(): UserData | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  /**
   * Check if onboarding has been shown/completed
   */
  static hasCompletedOnboarding(): boolean {
    const userData = this.getUserData();
    return userData?.onboardingCompleted || false;
  }

  /**
   * Check if onboarding popup has been shown (even if skipped)
   */
  static hasShownOnboarding(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Mark onboarding as shown (even if user skipped)
   */
  static markOnboardingShown(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_SHOWN, 'true');
    } catch (error) {
      console.error('Failed to mark onboarding as shown:', error);
    }
  }

  /**
   * Generate personalized greeting based on user data and current date
   */
  static getPersonalizedGreeting(userData: UserData | null): UserGreeting {
    const now = new Date();
    const hour = now.getHours();

    // Default greeting if no user data
    if (!userData) {
      if (hour < 12) return { message: 'Good Morning', isSpecial: false };
      if (hour < 17) return { message: 'Good Afternoon', isSpecial: false };
      return { message: 'Good Evening', isSpecial: false };
    }

    const firstName = userData.firstName;
    let baseGreeting = '';

    if (hour < 12) baseGreeting = 'Good Morning';
    else if (hour < 17) baseGreeting = 'Good Afternoon';
    else baseGreeting = 'Good Evening';

    // Check if it's the user's birthday
    if (this.isBirthday(userData.birthday)) {
      return {
        message: `Happy Birthday, ${firstName}! 🎉`,
        isSpecial: true,
        emoji: '🎂'
      };
    }

    // Check if it's close to birthday (within 7 days)
    const daysUntilBirthday = this.getDaysUntilBirthday(userData.birthday);
    if (daysUntilBirthday <= 7 && daysUntilBirthday > 0) {
      return {
        message: `${baseGreeting}, ${firstName}! 🎈`,
        isSpecial: true,
        emoji: '🎉'
      };
    }

    // Special greetings for holidays or seasons
    const specialGreeting = this.getSeasonalGreeting(firstName, baseGreeting);
    if (specialGreeting) return specialGreeting;

    // Regular personalized greeting
    return {
      message: `${baseGreeting}, ${firstName}`,
      isSpecial: false
    };
  }

  /**
   * Check if today is the user's birthday
   */
  private static isBirthday(birthday: string): boolean {
    try {
      const birthDate = new Date(birthday);
      const today = new Date();

      return (
        birthDate.getMonth() === today.getMonth() &&
        birthDate.getDate() === today.getDate()
      );
    } catch {
      return false;
    }
  }

  /**
   * Get days until next birthday
   */
  private static getDaysUntilBirthday(birthday: string): number {
    try {
      const birthDate = new Date(birthday);
      const today = new Date();

      const thisYear = today.getFullYear();
      let nextBirthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate());

      // If birthday has passed this year, check next year
      if (nextBirthday < today) {
        nextBirthday = new Date(thisYear + 1, birthDate.getMonth(), birthDate.getDate());
      }

      const diffTime = nextBirthday.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return -1;
    }
  }

  /**
   * Get seasonal or holiday greetings
   */
  private static getSeasonalGreeting(firstName: string, baseGreeting: string): UserGreeting | null {
    const today = new Date();
    const month = today.getMonth();
    const date = today.getDate();

    // Christmas season (December 20-26)
    if (month === 11 && date >= 20 && date <= 26) {
      return {
        message: `${baseGreeting}, ${firstName}! 🎄`,
        isSpecial: true,
        emoji: '🎁'
      };
    }

    // New Year (December 31 - January 2)
    if ((month === 11 && date === 31) || (month === 0 && date <= 2)) {
      return {
        message: `${baseGreeting}, ${firstName}! ✨`,
        isSpecial: true,
        emoji: '🎊'
      };
    }

    // Valentine's Day (February 14)
    if (month === 1 && date === 14) {
      return {
        message: `${baseGreeting}, ${firstName}! 💕`,
        isSpecial: true,
        emoji: '❤️'
      };
    }

    // Halloween (October 31)
    if (month === 9 && date === 31) {
      return {
        message: `${baseGreeting}, ${firstName}! 🎃`,
        isSpecial: true,
        emoji: '👻'
      };
    }

    return null;
  }

  /**
   * Mark the full onboarding flow as completed
   * (avatar generated, measurements taken, style profile completed)
   */
  static markFlowCompleted(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FLOW_COMPLETED, 'true');
      console.log('✅ [USER-SERVICE] Full onboarding flow marked as completed');
    } catch (error) {
      console.error('Failed to mark flow as completed:', error);
    }
  }

  /**
   * Check if user has completed the full onboarding flow
   * (avatar + measurements + style profile)
   */
  static hasCompletedFlow(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.FLOW_COMPLETED) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Clear all user data (for privacy/reset purposes)
   */
  static clearUserData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING_SHOWN);
      localStorage.removeItem(STORAGE_KEYS.FLOW_COMPLETED);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  /**
   * Get user's age from birthday
   */
  static getUserAge(birthday: string): number | null {
    try {
      const birthDate = new Date(birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age;
    } catch {
      return null;
    }
  }
}

export default UserService;