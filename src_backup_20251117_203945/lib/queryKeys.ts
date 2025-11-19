// Centralized query keys for type safety and consistency
export const queryKeys = {
  // Closet/Wardrobe
  closet: {
    all: ['closet'] as const,
    lists: () => [...queryKeys.closet.all, 'list'] as const,
    list: (userId: string, filters?: any) =>
      [...queryKeys.closet.lists(), userId, filters] as const,
    details: () => [...queryKeys.closet.all, 'detail'] as const,
    detail: (itemId: string) => [...queryKeys.closet.details(), itemId] as const,
  },
  
  // Wishlist
  wishlist: {
    all: ['wishlist'] as const,
    lists: () => [...queryKeys.wishlist.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.wishlist.lists(), userId] as const,
  },
  
  // Calendar/Outfits
  calendar: {
    all: ['calendar'] as const,
    events: (userId: string, dateRange: string) =>
      [...queryKeys.calendar.all, 'events', userId, dateRange] as const,
  },
  
  // Saved Outfits
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
