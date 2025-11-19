// Centralized query keys for type safety and consistency
export const queryKeys = {
  // Closet/Wardrobe (legacy - kept for backward compatibility)
  closet: {
    all: ['closet'] as const,
    lists: () => [...queryKeys.closet.all, 'list'] as const,
    list: (userId: string, filters?: any) =>
      [...queryKeys.closet.lists(), userId, filters] as const,
    details: () => [...queryKeys.closet.all, 'detail'] as const,
    detail: (itemId: string) => [...queryKeys.closet.details(), itemId] as const,
  },
  
  // Closet Items (clothing_items table - enhanced)
  closetItems: {
    all: ['closetItems'] as const,
    lists: () => [...queryKeys.closetItems.all, 'list'] as const,
    list: (userId: string, filters?: any) => 
      [...queryKeys.closetItems.lists(), userId, filters] as const,
    detail: (itemId: string) => 
      [...queryKeys.closetItems.all, 'detail', itemId] as const,
    stats: (userId: string) => 
      [...queryKeys.closetItems.all, 'stats', userId] as const,
    favorites: (userId: string) => 
      [...queryKeys.closetItems.all, 'favorites', userId] as const,
  },
  
  // Wishlist
  wishlist: {
    all: ['wishlist'] as const,
    lists: () => [...queryKeys.wishlist.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.wishlist.lists(), userId] as const,
  },
  
  // Calendar/Events
  calendar: {
    all: ['calendar'] as const,
    events: (userId: string, dateRange: string) =>
      [...queryKeys.calendar.all, 'events', userId, dateRange] as const,
  },
  
  // Saved Outfits (user-created outfit combinations)
  savedOutfits: {
    all: ['savedOutfits'] as const,
    lists: () => [...queryKeys.savedOutfits.all, 'list'] as const,
    list: (userId: string, filters?: any) => 
      [...queryKeys.savedOutfits.lists(), userId, filters] as const,
    detail: (outfitId: string) => 
      [...queryKeys.savedOutfits.all, 'detail', outfitId] as const,
    stats: (userId: string) => 
      [...queryKeys.savedOutfits.all, 'stats', userId] as const,
  },
  
  // AI Outfits (AI-generated outfit images)
  aiOutfits: {
    all: ['aiOutfits'] as const,
    lists: () => [...queryKeys.aiOutfits.all, 'list'] as const,
    list: (userId: string, filters?: any) => 
      [...queryKeys.aiOutfits.lists(), userId, filters] as const,
    detail: (outfitId: string) => 
      [...queryKeys.aiOutfits.all, 'detail', outfitId] as const,
    stats: (userId: string) => 
      [...queryKeys.aiOutfits.all, 'stats', userId] as const,
    shared: (shareToken: string) => 
      [...queryKeys.aiOutfits.all, 'shared', shareToken] as const,
  },
  
  // Legacy - kept for backward compatibility
  outfits: {
    all: ['outfits'] as const,
    lists: () => [...queryKeys.outfits.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.outfits.lists(), userId] as const,
    detail: (outfitId: string) =>
      [...queryKeys.outfits.all, 'detail', outfitId] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    closet: (userId: string) =>
      [...queryKeys.analytics.all, 'closet', userId] as const,
    colors: (userId: string) =>
      [...queryKeys.analytics.all, 'colors', userId] as const,
  },
  
  // User Profile
  user: {
    all: ['user'] as const,
    profile: (userId: string) => [...queryKeys.user.all, 'profile', userId] as const,
  },
};
