/**
 * Gamification Service - Handles achievements, challenges, voice commands, and seasonal features
 * Makes the closet experience engaging and interactive
 */

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'organizing' | 'sustainability' | 'creativity' | 'social';
  xpReward: number;
  badgeIcon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface StyleChallenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  deadline: string;
  xpReward: number;
  requirements: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  participants: number;
  completed: boolean;
}

interface VoiceCommand {
  phrase: string;
  action: string;
  description: string;
  enabled: boolean;
}

interface SeasonalEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  theme: string;
  bonusXP: number;
  specialChallenges: string[];
  rewards: string[];
}

interface ClosetStats {
  totalItems: number;
  totalValue: number;
  sustainabilityScore: number;
  mostWornItem: string;
  leastWornItem: string;
  favoriteCategory: string;
  averageOutfitRating: number;
  daysActive: number;
}

class GamificationService {
  private achievements: Achievement[] = [];
  private styleChallenges: StyleChallenge[] = [];
  private voiceCommands: VoiceCommand[] = [];
  private currentSeason: 'spring' | 'summer' | 'fall' | 'winter' = 'fall';
  private userLevel = 1;
  private userXP = 0;
  private speechRecognition: any = null;

  constructor() {
    this.initializeAchievements();
    this.initializeStyleChallenges();
    this.initializeVoiceCommands();
    this.setupSpeechRecognition();
    this.detectCurrentSeason();
  }

  /**
   * Initialize achievement system
   */
  private initializeAchievements() {
    this.achievements = [
      {
        id: 'first-upload',
        title: 'First Steps',
        description: 'Upload your first clothing item',
        category: 'organizing',
        xpReward: 50,
        badgeIcon: '👕',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        rarity: 'common'
      },
      {
        id: 'closet-organizer',
        title: 'Closet Organizer',
        description: 'Organize 50 items in your closet',
        category: 'organizing',
        xpReward: 200,
        badgeIcon: '📦',
        unlocked: false,
        progress: 0,
        maxProgress: 50,
        rarity: 'rare'
      },
      {
        id: 'eco-warrior',
        title: 'Eco Warrior',
        description: 'Add 20 sustainable fashion items',
        category: 'sustainability',
        xpReward: 300,
        badgeIcon: '🌱',
        unlocked: false,
        progress: 0,
        maxProgress: 20,
        rarity: 'epic'
      },
      {
        id: 'style-innovator',
        title: 'Style Innovator',
        description: 'Create 10 unique outfit combinations',
        category: 'creativity',
        xpReward: 250,
        badgeIcon: '🎨',
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        rarity: 'rare'
      },
      {
        id: 'fashion-influencer',
        title: 'Fashion Influencer',
        description: 'Share 5 outfits with the community',
        category: 'social',
        xpReward: 400,
        badgeIcon: '⭐',
        unlocked: false,
        progress: 0,
        maxProgress: 5,
        rarity: 'epic'
      },
      {
        id: 'master-curator',
        title: 'Master Curator',
        description: 'Reach level 25 and organize 200+ items',
        category: 'organizing',
        xpReward: 1000,
        badgeIcon: '👑',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        rarity: 'legendary'
      },
      {
        id: 'voice-commander',
        title: 'Voice Commander',
        description: 'Use voice commands 50 times',
        category: 'organizing',
        xpReward: 150,
        badgeIcon: '🎤',
        unlocked: false,
        progress: 0,
        maxProgress: 50,
        rarity: 'rare'
      },
      {
        id: 'seasonal-stylist',
        title: 'Seasonal Stylist',
        description: 'Complete outfits for all four seasons',
        category: 'creativity',
        xpReward: 350,
        badgeIcon: '🍂',
        unlocked: false,
        progress: 0,
        maxProgress: 4,
        rarity: 'epic'
      }
    ];
  }

  /**
   * Initialize style challenges
   */
  private initializeStyleChallenges() {
    this.styleChallenges = [
      {
        id: 'autumn-elegance',
        title: 'Autumn Elegance',
        description: 'Create a sophisticated fall outfit using warm colors',
        theme: 'Fall Fashion',
        deadline: '2024-11-15',
        xpReward: 100,
        requirements: ['Use warm colors', 'Include outerwear', 'Professional look'],
        difficulty: 'easy',
        participants: 1247,
        completed: false
      },
      {
        id: 'sustainable-chic',
        title: 'Sustainable Chic',
        description: 'Design an outfit using only eco-friendly pieces',
        theme: 'Eco Fashion',
        deadline: '2024-10-30',
        xpReward: 150,
        requirements: ['Only eco-friendly items', 'Minimum 3 pieces', 'Document sustainability'],
        difficulty: 'medium',
        participants: 892,
        completed: false
      },
      {
        id: 'monochrome-mastery',
        title: 'Monochrome Mastery',
        description: 'Create 3 stunning single-color outfits',
        theme: 'Color Theory',
        deadline: '2024-11-08',
        xpReward: 200,
        requirements: ['3 different monochrome outfits', 'Different textures', 'Photo documentation'],
        difficulty: 'hard',
        participants: 445,
        completed: false
      },
      {
        id: 'vintage-revival',
        title: 'Vintage Revival',
        description: 'Mix vintage pieces with modern elements',
        theme: 'Retro Fashion',
        deadline: '2024-11-20',
        xpReward: 175,
        requirements: ['Include vintage pieces', 'Modern accessories', 'Tell the story'],
        difficulty: 'medium',
        participants: 623,
        completed: false
      }
    ];
  }

  /**
   * Initialize voice commands
   */
  private initializeVoiceCommands() {
    this.voiceCommands = [
      {
        phrase: 'show my closet',
        action: 'navigate_closet',
        description: 'Open your closet view',
        enabled: true
      },
      {
        phrase: 'create outfit',
        action: 'open_outfit_creator',
        description: 'Open the outfit creator',
        enabled: true
      },
      {
        phrase: 'upload clothes',
        action: 'open_upload',
        description: 'Start uploading new clothes',
        enabled: true
      },
      {
        phrase: 'show achievements',
        action: 'show_achievements',
        description: 'Display your achievements',
        enabled: true
      },
      {
        phrase: 'style challenge',
        action: 'show_challenges',
        description: 'View current style challenges',
        enabled: true
      },
      {
        phrase: 'outfit of the day',
        action: 'generate_ootd',
        description: 'Generate today\'s outfit suggestion',
        enabled: true
      },
      {
        phrase: 'sustainability score',
        action: 'show_sustainability',
        description: 'Show your closet\'s sustainability metrics',
        enabled: true
      },
      {
        phrase: 'find [item]',
        action: 'search_item',
        description: 'Search for a specific clothing item',
        enabled: true
      }
    ];
  }

  /**
   * Setup speech recognition
   */
  private setupSpeechRecognition() {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      this.speechRecognition = new (window as any).webkitSpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = 'en-US';

      this.speechRecognition.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase();
        this.processVoiceCommand(command);
      };

      this.speechRecognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
    }
  }

  /**
   * Process voice commands
   */
  private processVoiceCommand(command: string): string | null {
    console.log('🎤 [VOICE] Processing command:', command);

    for (const voiceCommand of this.voiceCommands) {
      if (!voiceCommand.enabled) continue;

      const pattern = voiceCommand.phrase.replace('[item]', '(.+)');
      const regex = new RegExp(pattern, 'i');
      const match = command.match(regex);

      if (match) {
        console.log('✅ [VOICE] Command matched:', voiceCommand.action);

        // Award XP for voice command usage
        this.awardXP(5, 'Voice command used');
        this.updateAchievementProgress('voice-commander', 1);

        return voiceCommand.action;
      }
    }

    console.log('❌ [VOICE] No matching command found');
    return null;
  }

  /**
   * Start listening for voice commands
   */
  startListening(): void {
    if (this.speechRecognition) {
      this.speechRecognition.start();
      console.log('🎤 [VOICE] Listening for commands...');
    } else {
      console.warn('Speech recognition not available');
    }
  }

  /**
   * Stop listening for voice commands
   */
  stopListening(): void {
    if (this.speechRecognition) {
      this.speechRecognition.stop();
      console.log('🎤 [VOICE] Stopped listening');
    }
  }

  /**
   * Award XP and check for level ups
   */
  awardXP(amount: number, reason: string): { levelUp: boolean; newLevel?: number } {
    this.userXP += amount;
    console.log(`⭐ [XP] Awarded ${amount} XP for: ${reason}`);

    // Calculate level (100 XP per level, with increasing requirements)
    const newLevel = Math.floor(Math.sqrt(this.userXP / 100)) + 1;

    if (newLevel > this.userLevel) {
      const oldLevel = this.userLevel;
      this.userLevel = newLevel;
      console.log(`🎉 [LEVEL UP] Level ${oldLevel} → ${newLevel}!`);

      return { levelUp: true, newLevel };
    }

    return { levelUp: false };
  }

  /**
   * Update achievement progress
   */
  updateAchievementProgress(achievementId: string, progress: number): Achievement | null {
    const achievement = this.achievements.find(a => a.id === achievementId);

    if (achievement && !achievement.unlocked) {
      achievement.progress = Math.min(achievement.progress + progress, achievement.maxProgress);

      if (achievement.progress >= achievement.maxProgress) {
        achievement.unlocked = true;
        this.awardXP(achievement.xpReward, `Achievement unlocked: ${achievement.title}`);
        console.log(`🏆 [ACHIEVEMENT] Unlocked: ${achievement.title}`);
        return achievement;
      }
    }

    return null;
  }

  /**
   * Calculate closet statistics
   */
  calculateClosetStats(clothingItems: any[]): ClosetStats {
    const totalItems = clothingItems.length;
    const totalValue = clothingItems.reduce((sum, item) => sum + (item.price || 0), 0);

    const ecoItems = clothingItems.filter(item => item.sustainability === 'eco');
    const sustainabilityScore = totalItems > 0 ? Math.round((ecoItems.length / totalItems) * 100) : 0;

    // Find most/least worn items
    const wornItems = clothingItems.filter(item => item.timesWorn > 0);
    const mostWorn = wornItems.sort((a, b) => b.timesWorn - a.timesWorn)[0];
    const leastWorn = clothingItems.filter(item => item.timesWorn === 0)[0];

    // Find favorite category
    const categoryCount = clothingItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'shirts';

    return {
      totalItems,
      totalValue,
      sustainabilityScore,
      mostWornItem: mostWorn?.name || 'None',
      leastWornItem: leastWorn?.name || 'None',
      favoriteCategory,
      averageOutfitRating: 4.2, // Mock data
      daysActive: Math.floor((Date.now() - Date.parse('2024-01-01')) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * Get seasonal recommendations
   */
  getSeasonalRecommendations(): {
    message: string;
    suggestions: string[];
    warningItems: string[];
  } {
    const season = this.getCurrentSeason();

    const recommendations: Record<string, any> = {
      spring: {
        message: "Spring is here! Time to add fresh, light pieces to your wardrobe.",
        suggestions: [
          "Light jackets and cardigans",
          "Pastel and floral prints",
          "Comfortable sneakers",
          "Lightweight scarves"
        ],
        warningItems: ["Heavy coats", "Thick sweaters", "Winter boots"]
      },
      summer: {
        message: "Summer vibes! Focus on breathable, lightweight clothing.",
        suggestions: [
          "Cotton and linen fabrics",
          "Bright and vibrant colors",
          "Sandals and canvas shoes",
          "Sun hats and sunglasses"
        ],
        warningItems: ["Heavy fabrics", "Dark colors", "Closed shoes"]
      },
      fall: {
        message: "Fall fashion is all about layers and warm tones.",
        suggestions: [
          "Layering pieces like vests",
          "Earth tones and warm colors",
          "Boots and closed shoes",
          "Cozy sweaters and scarves"
        ],
        warningItems: ["Summer dresses", "Shorts", "Flip flops"]
      },
      winter: {
        message: "Winter warmth meets style. Focus on cozy, insulating pieces.",
        suggestions: [
          "Heavy coats and jackets",
          "Wool and cashmere",
          "Warm boots",
          "Hats, gloves, and scarves"
        ],
        warningItems: ["Tank tops", "Shorts", "Sandals"]
      }
    };

    return recommendations[season];
  }

  /**
   * Detect current season based on date
   */
  private detectCurrentSeason(): void {
    const month = new Date().getMonth();

    if (month >= 2 && month <= 4) this.currentSeason = 'spring';
    else if (month >= 5 && month <= 7) this.currentSeason = 'summer';
    else if (month >= 8 && month <= 10) this.currentSeason = 'fall';
    else this.currentSeason = 'winter';
  }

  /**
   * Generate daily style tips
   */
  generateStyleTip(): string {
    const tips = [
      "Try mixing textures for a more interesting outfit.",
      "The rule of three: limit your outfit to three colors maximum.",
      "Invest in quality basics that you can mix and match.",
      "Accessories can completely transform a simple outfit.",
      "When in doubt, add a belt to define your silhouette.",
      "Layer different lengths for a dynamic look.",
      "Choose one statement piece and keep everything else simple.",
      "Your shoes can make or break an outfit - choose wisely!",
      "Don't be afraid to mix patterns, just vary the scales.",
      "Confidence is your best accessory!"
    ];

    return tips[Math.floor(Math.random() * tips.length)];
  }

  /**
   * Get user progress summary
   */
  getUserProgress(): {
    level: number;
    xp: number;
    xpToNextLevel: number;
    achievementsUnlocked: number;
    totalAchievements: number;
    challengesCompleted: number;
  } {
    const xpForNextLevel = Math.pow(this.userLevel, 2) * 100;
    const xpToNextLevel = xpForNextLevel - this.userXP;

    return {
      level: this.userLevel,
      xp: this.userXP,
      xpToNextLevel: Math.max(0, xpToNextLevel),
      achievementsUnlocked: this.achievements.filter(a => a.unlocked).length,
      totalAchievements: this.achievements.length,
      challengesCompleted: this.styleChallenges.filter(c => c.completed).length
    };
  }

  // Getters
  getCurrentSeason() { return this.currentSeason; }
  getAchievements() { return this.achievements; }
  getStyleChallenges() { return this.styleChallenges; }
  getVoiceCommands() { return this.voiceCommands; }
  getUserLevel() { return this.userLevel; }
  getUserXP() { return this.userXP; }
}

export const gamificationService = new GamificationService();
export default gamificationService;