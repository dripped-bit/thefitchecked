/**
 * Context-Aware Occasion Service
 * Intelligently determines appropriate outfit occasion based on:
 * - Day of week (weekday vs weekend)
 * - Time of day (morning, afternoon, evening)
 * - User's lifestyle profile
 * - User's typical dress occasions
 */

import authService from './authService';
import userPreferencesService from './userPreferencesService';

type TimeOfDay = 'morning' | 'afternoon' | 'evening';
type DayType = 'weekday' | 'saturday' | 'sunday';
type LifestyleType = 
  | 'professional_corporate'
  | 'remote_worker'
  | 'student'
  | 'parent_caregiver'
  | 'active_athletic'
  | 'creative_artistic'
  | 'frequent_traveler'
  | 'social_butterfly';

type OutfitOccasion = 
  | 'work_office'
  | 'casual_daily'
  | 'workout_active'
  | 'date_night'
  | 'special_events'
  | 'weekend_brunch';

export interface OccasionContext {
  occasion: OutfitOccasion;
  confidence: number;
  reasoning: string;
  formalityLevel: number; // 1-10
  alternatives?: OutfitOccasion[];
}

class ContextAwareOccasionService {
  /**
   * Determine appropriate outfit occasion based on full context
   */
  async determineOccasion(): Promise<OccasionContext> {
    // Get current context
    const now = new Date();
    const timeOfDay = this.getTimeOfDay(now);
    const dayType = this.getDayType(now);
    
    // Get user's lifestyle and preferences
    const user = await authService.getCurrentUser();
    let lifestyle: LifestyleType = 'remote_worker'; // default
    let occasionPriorities: string[] = [];
    
    if (user) {
      const styleProfile = await userPreferencesService.getStyleProfile(user.id);
      if (styleProfile) {
        lifestyle = this.detectLifestyle(styleProfile);
        occasionPriorities = styleProfile.occasion_priorities || [];
      }
    }

    console.log('📊 [OCCASION] Context:', {
      timeOfDay,
      dayType,
      lifestyle,
      occasionPriorities
    });

    // Apply decision matrix
    const occasion = this.applyDecisionMatrix(timeOfDay, dayType, lifestyle, occasionPriorities);
    
    return occasion;
  }

  /**
   * Get time of day category
   */
  private getTimeOfDay(date: Date): TimeOfDay {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
  }

  /**
   * Get day type (weekday, saturday, sunday)
   */
  private getDayType(date: Date): DayType {
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0) return 'sunday';
    if (day === 6) return 'saturday';
    return 'weekday';
  }

  /**
   * Detect user's lifestyle from style preferences
   */
  private detectLifestyle(styleProfile: any): LifestyleType {
    const lifestyle = styleProfile.lifestyle || [];
    const occasionPriorities = styleProfile.occasion_priorities || [];

    // Check lifestyle tags
    if (lifestyle.includes('professional') || lifestyle.includes('corporate')) {
      return 'professional_corporate';
    }
    if (lifestyle.includes('remote') || lifestyle.includes('work from home')) {
      return 'remote_worker';
    }
    if (lifestyle.includes('student') || lifestyle.includes('college')) {
      return 'student';
    }
    if (lifestyle.includes('parent') || lifestyle.includes('caregiver')) {
      return 'parent_caregiver';
    }
    if (lifestyle.includes('athletic') || lifestyle.includes('fitness')) {
      return 'active_athletic';
    }
    if (lifestyle.includes('creative') || lifestyle.includes('artistic')) {
      return 'creative_artistic';
    }
    if (lifestyle.includes('travel') || lifestyle.includes('traveler')) {
      return 'frequent_traveler';
    }
    if (lifestyle.includes('social') || occasionPriorities.includes('parties')) {
      return 'social_butterfly';
    }

    // Check occasion priorities
    if (occasionPriorities.includes('work') || occasionPriorities.includes('professional')) {
      return 'professional_corporate';
    }
    if (occasionPriorities.includes('casual') || occasionPriorities.includes('everyday')) {
      return 'remote_worker'; // Casual-heavy
    }

    // Default fallback
    return 'remote_worker'; // Most flexible default
  }

  /**
   * Apply the decision matrix based on all context
   */
  private applyDecisionMatrix(
    timeOfDay: TimeOfDay,
    dayType: DayType,
    lifestyle: LifestyleType,
    occasionPriorities: string[]
  ): OccasionContext {
    
    // WEEKDAY PATTERNS
    if (dayType === 'weekday') {
      
      // WEEKDAY MORNING (6am-12pm)
      if (timeOfDay === 'morning') {
        switch (lifestyle) {
          case 'professional_corporate':
            return {
              occasion: 'work_office',
              confidence: 95,
              reasoning: 'Weekday morning + Professional lifestyle → Work attire',
              formalityLevel: 8,
              alternatives: ['casual_daily']
            };

          case 'active_athletic':
            // Check if early morning (before 8am) → Workout
            if (new Date().getHours() < 8) {
              return {
                occasion: 'workout_active',
                confidence: 90,
                reasoning: 'Early weekday morning + Athletic lifestyle → Workout gear',
                formalityLevel: 2,
                alternatives: ['casual_daily']
              };
            }
            return {
              occasion: 'casual_daily',
              confidence: 75,
              reasoning: 'Weekday morning + Athletic lifestyle → Casual after workout',
              formalityLevel: 4,
              alternatives: ['workout_active']
            };

          case 'remote_worker':
          case 'student':
          case 'parent_caregiver':
          case 'creative_artistic':
          case 'frequent_traveler':
          case 'social_butterfly':
          default:
            return {
              occasion: 'casual_daily',
              confidence: 85,
              reasoning: `Weekday morning + ${lifestyle.replace(/_/g, ' ')} → Comfortable daily wear`,
              formalityLevel: 5,
              alternatives: ['workout_active']
            };
        }
      }

      // WEEKDAY AFTERNOON (12pm-5pm)
      if (timeOfDay === 'afternoon') {
        switch (lifestyle) {
          case 'professional_corporate':
            return {
              occasion: 'work_office',
              confidence: 95,
              reasoning: 'Weekday afternoon + Professional lifestyle → Work attire',
              formalityLevel: 8
            };

          default:
            return {
              occasion: 'casual_daily',
              confidence: 85,
              reasoning: `Weekday afternoon + ${lifestyle.replace(/_/g, ' ')} → Casual daily wear`,
              formalityLevel: 5
            };
        }
      }

      // WEEKDAY EVENING (5pm-12am)
      if (timeOfDay === 'evening') {
        const dayOfWeek = new Date().getDay();
        const isThursdayOrFriday = dayOfWeek === 4 || dayOfWeek === 5;

        if (isThursdayOrFriday) {
          // Thursday/Friday evening → Higher chance of social activities
          if (occasionPriorities.includes('date night') || occasionPriorities.includes('social') || lifestyle === 'social_butterfly') {
            return {
              occasion: 'date_night',
              confidence: 80,
              reasoning: `${dayOfWeek === 4 ? 'Thursday' : 'Friday'} evening + Social interests → Date night or social event`,
              formalityLevel: 7,
              alternatives: ['special_events', 'casual_daily']
            };
          }
        }

        // Mon-Wed evening or no social priorities
        return {
          occasion: 'casual_daily',
          confidence: 85,
          reasoning: 'Weekday evening → Casual relaxation',
          formalityLevel: 4,
          alternatives: ['workout_active']
        };
      }
    }

    // SATURDAY PATTERNS
    if (dayType === 'saturday') {
      
      // SATURDAY MORNING
      if (timeOfDay === 'morning') {
        if (lifestyle === 'active_athletic') {
          return {
            occasion: 'workout_active',
            confidence: 90,
            reasoning: 'Saturday morning + Athletic lifestyle → Long training session',
            formalityLevel: 2,
            alternatives: ['casual_daily']
          };
        }
        
        if (lifestyle === 'social_butterfly' || occasionPriorities.includes('brunch')) {
          return {
            occasion: 'weekend_brunch',
            confidence: 85,
            reasoning: 'Saturday morning + Social lifestyle → Brunch outfit',
            formalityLevel: 6,
            alternatives: ['casual_daily']
          };
        }

        return {
          occasion: 'casual_daily',
          confidence: 80,
          reasoning: 'Saturday morning → Casual weekend wear',
          formalityLevel: 4,
          alternatives: ['workout_active', 'weekend_brunch']
        };
      }

      // SATURDAY AFTERNOON
      if (timeOfDay === 'afternoon') {
        return {
          occasion: 'casual_daily',
          confidence: 85,
          reasoning: 'Saturday afternoon → Casual activities, shopping, hobbies',
          formalityLevel: 5,
          alternatives: ['weekend_brunch']
        };
      }

      // SATURDAY EVENING (HIGH SOCIAL NIGHT)
      if (timeOfDay === 'evening') {
        if (occasionPriorities.includes('date night') || occasionPriorities.includes('parties') || lifestyle === 'social_butterfly') {
          return {
            occasion: 'special_events',
            confidence: 90,
            reasoning: 'Saturday evening + Social lifestyle → Special events or date night (peak social night)',
            formalityLevel: 8,
            alternatives: ['date_night']
          };
        }

        return {
          occasion: 'date_night',
          confidence: 75,
          reasoning: 'Saturday evening → Date night or social gathering',
          formalityLevel: 7,
          alternatives: ['casual_daily']
        };
      }
    }

    // SUNDAY PATTERNS
    if (dayType === 'sunday') {
      
      // SUNDAY MORNING (BRUNCH TIME)
      if (timeOfDay === 'morning') {
        if (lifestyle === 'social_butterfly' || occasionPriorities.includes('brunch')) {
          return {
            occasion: 'weekend_brunch',
            confidence: 95,
            reasoning: 'Sunday morning + Social lifestyle → Peak brunch time',
            formalityLevel: 6,
            alternatives: ['casual_daily']
          };
        }

        return {
          occasion: 'casual_daily',
          confidence: 85,
          reasoning: 'Sunday morning → Relaxed weekend wear',
          formalityLevel: 4,
          alternatives: ['weekend_brunch', 'workout_active']
        };
      }

      // SUNDAY AFTERNOON/EVENING (PREP/WIND DOWN)
      return {
        occasion: 'casual_daily',
        confidence: 90,
        reasoning: 'Sunday afternoon/evening → Relaxation and week prep',
        formalityLevel: 3
      };
    }

    // Fallback
    return {
      occasion: 'casual_daily',
      confidence: 70,
      reasoning: 'Default casual suggestion',
      formalityLevel: 5
    };
  }

  /**
   * Map outfit occasion to user-friendly display text
   */
  getOccasionDisplayText(occasion: OutfitOccasion): string {
    const displayMap: Record<OutfitOccasion, string> = {
      work_office: 'Work & Office',
      casual_daily: 'Casual Daily',
      workout_active: 'Workout & Active',
      date_night: 'Date Night',
      special_events: 'Special Events',
      weekend_brunch: 'Weekend Brunch'
    };
    return displayMap[occasion];
  }

  /**
   * Get appropriate clothing categories for occasion
   */
  getCategoriesForOccasion(occasion: OutfitOccasion): string[] {
    const categoryMap: Record<OutfitOccasion, string[]> = {
      work_office: ['blazers', 'dress pants', 'button-downs', 'pencil skirts', 'professional dresses', 'loafers', 'heels'],
      casual_daily: ['jeans', 't-shirts', 'sweaters', 'casual dresses', 'sneakers', 'sandals'],
      workout_active: ['athletic wear', 'sports bras', 'leggings', 'running shoes', 'tank tops'],
      date_night: ['cocktail dresses', 'nice pants', 'dressy tops', 'heels', 'jewelry'],
      special_events: ['evening gowns', 'suits', 'formal dresses', 'dress shoes', 'statement pieces'],
      weekend_brunch: ['casual dresses', 'nice jeans', 'blouses', 'flats', 'light accessories']
    };
    return categoryMap[occasion];
  }
}

export const contextAwareOccasionService = new ContextAwareOccasionService();
export default contextAwareOccasionService;
