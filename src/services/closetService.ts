/**
 * Closet Service - Manages user's clothing storage and organization
 * Handles localStorage operations for clothing items by category
 */

export interface ClothingItem {
  id: string | number;
  name: string;
  imageUrl: string;
  category: ClothingCategory;
  uploadDate?: string;
  dateAdded?: string;
  favorite?: boolean;
  tags?: string[];
  description?: string;
  isUserGenerated?: boolean;
  source?: string;
}

export type ClothingCategory = 'shirts' | 'pants' | 'skirts' | 'dresses' | 'shoes' | 'accessories' | 'outerwear' | 'tops' | 'jackets' | 'other';

export interface UserCloset {
  shirts: ClothingItem[];
  pants: ClothingItem[];
  skirts: ClothingItem[];
  dresses: ClothingItem[];
  shoes: ClothingItem[];
  accessories: ClothingItem[];
  outerwear: ClothingItem[];
  tops: ClothingItem[];
  jackets: ClothingItem[];
  other: ClothingItem[];
}

export interface DailyOutfit {
  date: string;
  items: ClothingItem[];
  notes?: string;
  createdAt?: string;
  scheduledTime?: string; // Time in "HH:MM" format (e.g., "14:30")
  needsPurchase?: boolean; // Flag if any item needs to be purchased
  purchaseLink?: string; // URL to buy the item online
  purchaseReminders?: string[]; // Array of ISO date strings for reminders
}

export interface WeeklyOutfitPlan {
  weekStartDate: string;
  outfits: {
    monday: DailyOutfit;
    tuesday: DailyOutfit;
    wednesday: DailyOutfit;
    thursday: DailyOutfit;
    friday: DailyOutfit;
    saturday: DailyOutfit;
    sunday: DailyOutfit;
  };
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const STORAGE_KEY = 'userCloset';
const OUTFIT_PLANS_KEY = 'weeklyOutfitPlans';

export class ClosetService {
  /**
   * Get user's entire closet
   */
  static getUserCloset(): UserCloset {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return this.getEmptyCloset();
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load user closet:', error);
      return this.getEmptyCloset();
    }
  }

  /**
   * Get empty closet structure
   */
  private static getEmptyCloset(): UserCloset {
    return {
      shirts: [],
      pants: [],
      skirts: [],
      dresses: [],
      shoes: [],
      accessories: [],
      outerwear: [],
      tops: [],
      jackets: [], // Added to match SaveToClosetModal categories
      other: []    // Added to match SaveToClosetModal categories
    };
  }

  /**
   * Save clothing item to specific category
   */
  static async saveClothingItem(
    imageUrl: string,
    category: ClothingCategory,
    name?: string,
    description?: string
  ): Promise<ClothingItem> {
    const closet = this.getUserCloset();

    const newItem: ClothingItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `${category} ${closet[category].length + 1}`,
      imageUrl,
      category,
      uploadDate: new Date().toISOString(),
      description: description || '',
      favorite: false,
      tags: []
    };

    closet[category].push(newItem);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(closet));
      console.log(`✅ Saved ${category} item to closet:`, newItem.name);
      return newItem;
    } catch (error) {
      console.error('Failed to save clothing item:', error);
      throw new Error('Unable to save clothing item to closet');
    }
  }

  /**
   * Add clothing item with full data (for generated items)
   */
  static async addClothingItem(
    category: ClothingCategory,
    itemData: Partial<ClothingItem> & { imageUrl: string; name: string }
  ): Promise<ClothingItem> {
    const closet = this.getUserCloset();

    // Ensure the category exists in the closet structure
    if (!closet[category]) {
      console.warn(`Category '${category}' not found in closet, initializing as empty array`);
      closet[category] = [];
    }

    const newItem: ClothingItem = {
      id: itemData.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: itemData.name,
      imageUrl: itemData.imageUrl,
      category,
      uploadDate: itemData.uploadDate || new Date().toISOString(),
      dateAdded: itemData.dateAdded || new Date().toISOString(),
      description: itemData.description || '',
      favorite: itemData.favorite || false,
      tags: itemData.tags || [],
      isUserGenerated: itemData.isUserGenerated || false,
      source: itemData.source || 'upload'
    };

    closet[category].push(newItem);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(closet));
      console.log(`✅ Added ${category} item to closet:`, newItem.name);
      return newItem;
    } catch (error) {
      console.error('Failed to add clothing item:', error);
      throw new Error('Unable to add clothing item to closet');
    }
  }

  /**
   * Get clothing items by category
   */
  static getClothingByCategory(category: ClothingCategory): ClothingItem[] {
    const closet = this.getUserCloset();
    return closet[category] || [];
  }

  /**
   * Get all clothing items (flattened)
   */
  static getAllClothingItems(): ClothingItem[] {
    const closet = this.getUserCloset();
    return Object.values(closet).flat();
  }

  /**
   * Delete clothing item
   */
  static deleteClothingItem(itemId: string): boolean {
    try {
      const closet = this.getUserCloset();
      let itemFound = false;

      // Search through all categories
      Object.keys(closet).forEach(categoryKey => {
        const category = categoryKey as ClothingCategory;
        const itemIndex = closet[category].findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
          closet[category].splice(itemIndex, 1);
          itemFound = true;
        }
      });

      if (itemFound) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(closet));
        console.log(`🗑️ Deleted clothing item: ${itemId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to delete clothing item:', error);
      return false;
    }
  }

  /**
   * Toggle favorite status
   */
  static toggleFavorite(itemId: string): boolean {
    try {
      const closet = this.getUserCloset();
      let updated = false;

      Object.keys(closet).forEach(categoryKey => {
        const category = categoryKey as ClothingCategory;
        const item = closet[category].find(item => item.id === itemId);
        if (item) {
          item.favorite = !item.favorite;
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(closet));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }
  }

  /**
   * Update clothing item
   */
  static updateClothingItem(itemId: string, updates: Partial<ClothingItem>): boolean {
    try {
      const closet = this.getUserCloset();
      let updated = false;

      Object.keys(closet).forEach(categoryKey => {
        const category = categoryKey as ClothingCategory;
        const item = closet[category].find(item => item.id === itemId);
        if (item) {
          Object.assign(item, updates);
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(closet));
        console.log(`📝 Updated clothing item: ${itemId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to update clothing item:', error);
      return false;
    }
  }

  /**
   * Search clothing items
   */
  static searchClothingItems(query: string): ClothingItem[] {
    const allItems = this.getAllClothingItems();
    const lowercaseQuery = query.toLowerCase();

    return allItems.filter(item =>
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.category.toLowerCase().includes(lowercaseQuery) ||
      item.description?.toLowerCase().includes(lowercaseQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get favorite items
   */
  static getFavoriteItems(): ClothingItem[] {
    return this.getAllClothingItems().filter(item => item.favorite);
  }

  /**
   * Get recent items (last 10)
   */
  static getRecentItems(limit: number = 10): ClothingItem[] {
    return this.getAllClothingItems()
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, limit);
  }

  /**
   * Get closet statistics
   */
  static getClosetStats() {
    const closet = this.getUserCloset();
    const totalItems = this.getAllClothingItems().length;
    const favoriteItems = this.getFavoriteItems().length;

    const categoryStats = Object.keys(closet).map(categoryKey => {
      const category = categoryKey as ClothingCategory;
      return {
        category,
        count: closet[category].length
      };
    });

    return {
      totalItems,
      favoriteItems,
      categoryStats,
      isEmpty: totalItems === 0
    };
  }

  /**
   * Auto-detect clothing category from image (basic implementation)
   */
  static autoDetectCategory(imageName: string, imageUrl?: string): ClothingCategory {
    const name = imageName.toLowerCase();

    // Basic keyword detection
    if (name.includes('shirt') || name.includes('tshirt') || name.includes('t-shirt') || name.includes('blouse')) {
      return 'shirts';
    }
    if (name.includes('pants') || name.includes('jeans') || name.includes('trouser')) {
      return 'pants';
    }
    if (name.includes('skirt')) {
      return 'skirts';
    }
    if (name.includes('dress')) {
      return 'dresses';
    }
    if (name.includes('shoe') || name.includes('sneaker') || name.includes('boot') || name.includes('sandal')) {
      return 'shoes';
    }
    if (name.includes('jacket') || name.includes('coat') || name.includes('blazer') || name.includes('cardigan')) {
      return 'outerwear';
    }
    if (name.includes('accessory') || name.includes('belt') || name.includes('bag') || name.includes('hat') || name.includes('scarf')) {
      return 'accessories';
    }
    if (name.includes('top') || name.includes('tank') || name.includes('camisole')) {
      return 'tops';
    }

    // Default to tops for ambiguous items
    return 'tops';
  }

  /**
   * Clear entire closet (for development/reset)
   */
  static clearCloset(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🧹 Closet cleared');
    } catch (error) {
      console.error('Failed to clear closet:', error);
    }
  }

  /**
   * Export closet data
   */
  static exportCloset(): string {
    try {
      const closet = this.getUserCloset();
      return JSON.stringify(closet, null, 2);
    } catch (error) {
      console.error('Failed to export closet:', error);
      return '{}';
    }
  }

  /**
   * Import closet data
   */
  static importCloset(jsonData: string): boolean {
    try {
      const closet = JSON.parse(jsonData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(closet));
      console.log('📥 Closet imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import closet:', error);
      return false;
    }
  }

  // ===== OUTFIT PLANNING METHODS =====

  /**
   * Get the start of the week for a given date (Monday)
   */
  private static getWeekStartDate(date: Date = new Date()): string {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    startOfWeek.setDate(diff);
    return startOfWeek.toISOString().split('T')[0];
  }

  /**
   * Get empty daily outfit
   */
  private static getEmptyDailyOutfit(date: string): DailyOutfit {
    return {
      date,
      items: [],
      notes: '',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Get empty weekly outfit plan
   */
  private static getEmptyWeeklyPlan(weekStartDate: string): WeeklyOutfitPlan {
    const startDate = new Date(weekStartDate);
    const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const outfits = {} as WeeklyOutfitPlan['outfits'];

    days.forEach((day, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const dateString = date.toISOString().split('T')[0];
      outfits[day] = this.getEmptyDailyOutfit(dateString);
    });

    return {
      weekStartDate,
      outfits
    };
  }

  /**
   * Get all weekly outfit plans
   */
  static getAllWeeklyPlans(): WeeklyOutfitPlan[] {
    try {
      const stored = localStorage.getItem(OUTFIT_PLANS_KEY);
      if (!stored) {
        return [];
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load weekly outfit plans:', error);
      return [];
    }
  }

  /**
   * Get weekly outfit plan for specific week
   */
  static getWeeklyPlan(weekStartDate?: string): WeeklyOutfitPlan {
    const targetWeekStart = weekStartDate || this.getWeekStartDate();
    const allPlans = this.getAllWeeklyPlans();

    const existingPlan = allPlans.find(plan => plan.weekStartDate === targetWeekStart);

    if (existingPlan) {
      return existingPlan;
    }

    // Return empty plan if not found
    return this.getEmptyWeeklyPlan(targetWeekStart);
  }

  /**
   * Save weekly outfit plan
   */
  static saveWeeklyPlan(plan: WeeklyOutfitPlan): boolean {
    try {
      const allPlans = this.getAllWeeklyPlans();
      const existingIndex = allPlans.findIndex(p => p.weekStartDate === plan.weekStartDate);

      if (existingIndex !== -1) {
        allPlans[existingIndex] = plan;
      } else {
        allPlans.push(plan);
      }

      // Keep only last 8 weeks to prevent storage bloat
      const sortedPlans = allPlans
        .sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime())
        .slice(0, 8);

      localStorage.setItem(OUTFIT_PLANS_KEY, JSON.stringify(sortedPlans));
      console.log('📅 Weekly outfit plan saved:', plan.weekStartDate);
      return true;
    } catch (error) {
      console.error('Failed to save weekly outfit plan:', error);
      return false;
    }
  }

  /**
   * Set outfit for specific day
   */
  static setDailyOutfit(day: DayOfWeek, items: ClothingItem[], notes?: string, weekStartDate?: string): boolean {
    const targetWeekStart = weekStartDate || this.getWeekStartDate();
    const weeklyPlan = this.getWeeklyPlan(targetWeekStart);

    const date = new Date(targetWeekStart);
    const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(day);
    date.setDate(date.getDate() + dayIndex);

    weeklyPlan.outfits[day] = {
      date: date.toISOString().split('T')[0],
      items: [...items],
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    return this.saveWeeklyPlan(weeklyPlan);
  }

  /**
   * Get outfit for specific day
   */
  static getDailyOutfit(day: DayOfWeek, weekStartDate?: string): DailyOutfit {
    const plan = this.getWeeklyPlan(weekStartDate);
    return plan.outfits[day];
  }

  /**
   * Clear outfit for specific day
   */
  static clearDailyOutfit(day: DayOfWeek, weekStartDate?: string): boolean {
    const targetWeekStart = weekStartDate || this.getWeekStartDate();
    return this.setDailyOutfit(day, [], '', targetWeekStart);
  }

  /**
   * Copy outfit from one day to another
   */
  static copyOutfitToDay(fromDay: DayOfWeek, toDay: DayOfWeek, weekStartDate?: string): boolean {
    const sourceOutfit = this.getDailyOutfit(fromDay, weekStartDate);
    return this.setDailyOutfit(toDay, sourceOutfit.items, sourceOutfit.notes, weekStartDate);
  }

  /**
   * Get current week's outfit plan
   */
  static getCurrentWeekPlan(): WeeklyOutfitPlan {
    return this.getWeeklyPlan();
  }

  /**
   * Get next week's start date
   */
  static getNextWeekStartDate(currentWeekStart?: string): string {
    const current = currentWeekStart || this.getWeekStartDate();
    const date = new Date(current);
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get previous week's start date
   */
  static getPreviousWeekStartDate(currentWeekStart?: string): string {
    const current = currentWeekStart || this.getWeekStartDate();
    const date = new Date(current);
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get outfit planning statistics
   */
  static getOutfitPlanningStats(): {
    totalPlannedDays: number;
    currentWeekPlannedDays: number;
    mostUsedItems: ClothingItem[];
  } {
    const allPlans = this.getAllWeeklyPlans();
    let totalPlannedDays = 0;
    const itemUsageCount = new Map<string, { item: ClothingItem; count: number }>();

    allPlans.forEach(plan => {
      Object.values(plan.outfits).forEach(outfit => {
        if (outfit.items.length > 0) {
          totalPlannedDays++;
          outfit.items.forEach(item => {
            const key = item.id.toString();
            const existing = itemUsageCount.get(key);
            if (existing) {
              existing.count++;
            } else {
              itemUsageCount.set(key, { item, count: 1 });
            }
          });
        }
      });
    });

    const currentWeekPlan = this.getCurrentWeekPlan();
    const currentWeekPlannedDays = Object.values(currentWeekPlan.outfits)
      .filter(outfit => outfit.items.length > 0).length;

    const mostUsedItems = Array.from(itemUsageCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(usage => usage.item);

    return {
      totalPlannedDays,
      currentWeekPlannedDays,
      mostUsedItems
    };
  }
}

export default ClosetService;