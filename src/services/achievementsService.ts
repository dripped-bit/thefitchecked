export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  current: number;
  target: number;
  reward: string;
  completed: boolean;
  locked: boolean;
  category: string;
}

export interface AchievementCategory {
  id: string;
  title: string;
  achievements: Achievement[];
}

export interface UserProgress {
  totalUnlocked: number;
  totalAchievements: number;
  completionPercentage: number;
  currentStreak: number;
  lastActivity: Date;
}

class AchievementsService {
  private storageKey = 'fit_checked_achievements';

  private defaultAchievements: AchievementCategory[] = [
    {
      id: 'creation',
      title: '🎨 Outfit Creation',
      achievements: [
        {
          id: 'first_outfit',
          title: 'First Steps',
          description: 'Generate your first outfit',
          icon: '👗',
          current: 0,
          target: 1,
          reward: 'Unlock "Trending" prompt suggestions',
          completed: false,
          locked: false,
          category: 'creation'
        },
        {
          id: 'outfit_creator',
          title: 'Outfit Creator',
          description: 'Generate 10 different outfits',
          icon: '🎯',
          current: 0,
          target: 10,
          reward: 'Unlock "Premium" style filters',
          completed: false,
          locked: false,
          category: 'creation'
        },
        {
          id: 'style_explorer',
          title: 'Style Explorer',
          description: 'Try 5 different style categories',
          icon: '🌟',
          current: 0,
          target: 5,
          reward: 'Unlock custom color palette',
          completed: false,
          locked: false,
          category: 'creation'
        },
        {
          id: 'fashion_master',
          title: 'Fashion Master',
          description: 'Generate 50 outfits',
          icon: '👑',
          current: 0,
          target: 50,
          reward: 'Unlock exclusive designer templates',
          completed: false,
          locked: true,
          category: 'creation'
        }
      ]
    },
    {
      id: 'collection',
      title: '👚 Collection Building',
      achievements: [
        {
          id: 'first_item',
          title: 'First Addition',
          description: 'Add your first item to closet',
          icon: '📦',
          current: 0,
          target: 1,
          reward: 'Unlock smart organization',
          completed: false,
          locked: false,
          category: 'collection'
        },
        {
          id: 'growing_wardrobe',
          title: 'Growing Wardrobe',
          description: 'Collect 25 clothing items',
          icon: '👔',
          current: 0,
          target: 25,
          reward: 'Unlock outfit combinations',
          completed: false,
          locked: false,
          category: 'collection'
        },
        {
          id: 'fashionista',
          title: 'Fashionista',
          description: 'Build a collection of 100+ items',
          icon: '✨',
          current: 0,
          target: 100,
          reward: 'Unlock AI styling assistant',
          completed: false,
          locked: false,
          category: 'collection'
        },
        {
          id: 'category_collector',
          title: 'Category Collector',
          description: 'Have items in all 8 categories',
          icon: '🎪',
          current: 0,
          target: 8,
          reward: 'Unlock mix & match mode',
          completed: false,
          locked: false,
          category: 'collection'
        }
      ]
    },
    {
      id: 'social',
      title: '💝 Social & Sharing',
      achievements: [
        {
          id: 'first_favorite',
          title: 'First Love',
          description: 'Mark your first item as favorite',
          icon: '❤️',
          current: 0,
          target: 1,
          reward: 'Unlock favorites filter',
          completed: false,
          locked: false,
          category: 'social'
        },
        {
          id: 'curator',
          title: 'Curator',
          description: 'Have 20+ favorite items',
          icon: '💎',
          current: 0,
          target: 20,
          reward: 'Unlock personal style insights',
          completed: false,
          locked: false,
          category: 'social'
        },
        {
          id: 'trend_setter',
          title: 'Trend Setter',
          description: 'Try 15+ different outfit styles',
          icon: '🔥',
          current: 0,
          target: 15,
          reward: 'Unlock trend predictions',
          completed: false,
          locked: true,
          category: 'social'
        }
      ]
    },
    {
      id: 'exploration',
      title: '🚀 Digital Exploration',
      achievements: [
        {
          id: 'avatar_customizer',
          title: 'Avatar Customizer',
          description: 'Upload and set up your avatar',
          icon: '🧑‍🎨',
          current: 0,
          target: 1,
          reward: 'Unlock advanced try-on features',
          completed: false,
          locked: false,
          category: 'exploration'
        },
        {
          id: 'virtual_fashionista',
          title: 'Virtual Fashionista',
          description: 'Try on 30+ different items',
          icon: '🎭',
          current: 0,
          target: 30,
          reward: 'Unlock AR preview mode',
          completed: false,
          locked: false,
          category: 'exploration'
        },
        {
          id: 'daily_stylist',
          title: 'Daily Stylist',
          description: 'Use the app for 7 consecutive days',
          icon: '📅',
          current: 0,
          target: 7,
          reward: 'Unlock daily outfit suggestions',
          completed: false,
          locked: false,
          category: 'exploration'
        }
      ]
    }
  ];

  // Get user's current achievement progress
  getUserProgress(): UserProgress {
    const achievements = this.getAchievements();
    const allAchievements = achievements.flatMap(category => category.achievements);
    const unlockedCount = allAchievements.filter(a => a.completed).length;
    const totalCount = allAchievements.length;

    return {
      totalUnlocked: unlockedCount,
      totalAchievements: totalCount,
      completionPercentage: Math.round((unlockedCount / totalCount) * 100),
      currentStreak: this.getCurrentStreak(),
      lastActivity: new Date()
    };
  }

  // Get all achievement categories with current progress
  getAchievements(): AchievementCategory[] {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing stored achievements:', error);
      }
    }

    // Initialize with default achievements
    this.saveAchievements(this.defaultAchievements);
    return this.defaultAchievements;
  }

  // Save achievements to storage
  private saveAchievements(achievements: AchievementCategory[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(achievements));
  }

  // Update achievement progress
  updateAchievementProgress(achievementId: string, increment: number = 1): Achievement | null {
    const achievements = this.getAchievements();
    let updatedAchievement: Achievement | null = null;

    for (const category of achievements) {
      const achievement = category.achievements.find(a => a.id === achievementId);
      if (achievement && !achievement.locked && !achievement.completed) {
        achievement.current = Math.min(achievement.current + increment, achievement.target);

        // Check if achievement is completed
        if (achievement.current >= achievement.target) {
          achievement.completed = true;
          updatedAchievement = achievement;

          // Unlock dependent achievements
          this.unlockDependentAchievements(achievementId, achievements);
        }

        this.saveAchievements(achievements);
        return updatedAchievement;
      }
    }

    return null;
  }

  // Set achievement progress to specific value
  setAchievementProgress(achievementId: string, value: number): Achievement | null {
    const achievements = this.getAchievements();
    let updatedAchievement: Achievement | null = null;

    for (const category of achievements) {
      const achievement = category.achievements.find(a => a.id === achievementId);
      if (achievement && !achievement.locked) {
        const wasCompleted = achievement.completed;
        achievement.current = Math.min(value, achievement.target);
        achievement.completed = achievement.current >= achievement.target;

        if (!wasCompleted && achievement.completed) {
          updatedAchievement = achievement;
          this.unlockDependentAchievements(achievementId, achievements);
        }

        this.saveAchievements(achievements);
        return updatedAchievement;
      }
    }

    return null;
  }

  // Unlock achievements based on dependencies
  private unlockDependentAchievements(completedId: string, achievements: AchievementCategory[]): void {
    // Fashion Master unlocks after Outfit Creator
    if (completedId === 'outfit_creator') {
      this.unlockAchievement('fashion_master', achievements);
    }

    // Trend Setter unlocks after First Favorite
    if (completedId === 'first_favorite') {
      this.unlockAchievement('trend_setter', achievements);
    }
  }

  private unlockAchievement(achievementId: string, achievements: AchievementCategory[]): void {
    for (const category of achievements) {
      const achievement = category.achievements.find(a => a.id === achievementId);
      if (achievement) {
        achievement.locked = false;
        break;
      }
    }
  }

  // Get current daily streak
  private getCurrentStreak(): number {
    const streakKey = 'fit_checked_daily_streak';
    const lastVisitKey = 'fit_checked_last_visit';

    const storedStreak = localStorage.getItem(streakKey);
    const lastVisit = localStorage.getItem(lastVisitKey);

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (!lastVisit) {
      localStorage.setItem(lastVisitKey, today);
      localStorage.setItem(streakKey, '1');
      return 1;
    }

    if (lastVisit === today) {
      return parseInt(storedStreak || '1');
    } else if (lastVisit === yesterday) {
      const newStreak = parseInt(storedStreak || '0') + 1;
      localStorage.setItem(lastVisitKey, today);
      localStorage.setItem(streakKey, newStreak.toString());
      this.updateAchievementProgress('daily_stylist', 1);
      return newStreak;
    } else {
      // Streak broken
      localStorage.setItem(lastVisitKey, today);
      localStorage.setItem(streakKey, '1');
      this.setAchievementProgress('daily_stylist', 0);
      return 1;
    }
  }

  // Trigger achievement checks based on user actions
  onOutfitGenerated(): Achievement | null {
    return this.updateAchievementProgress('first_outfit') ||
           this.updateAchievementProgress('outfit_creator');
  }

  onItemAdded(): Achievement | null {
    return this.updateAchievementProgress('first_item') ||
           this.updateAchievementProgress('growing_wardrobe') ||
           this.updateAchievementProgress('fashionista');
  }

  onItemFavorited(): Achievement | null {
    return this.updateAchievementProgress('first_favorite') ||
           this.updateAchievementProgress('curator');
  }

  onAvatarSet(): Achievement | null {
    return this.updateAchievementProgress('avatar_customizer');
  }

  onTryOnUsed(): Achievement | null {
    return this.updateAchievementProgress('virtual_fashionista');
  }

  onStyleExplored(): Achievement | null {
    return this.updateAchievementProgress('style_explorer') ||
           this.updateAchievementProgress('trend_setter');
  }

  // Update category-based achievements
  updateCategoryProgress(totalCategories: number): Achievement | null {
    return this.setAchievementProgress('category_collector', totalCategories);
  }

  // Reset all achievements (for testing)
  resetAchievements(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem('fit_checked_daily_streak');
    localStorage.removeItem('fit_checked_last_visit');
  }
}

export default new AchievementsService();