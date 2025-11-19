/**
 * Trip Types and Constants
 * Defines all trip-related enums, types, and configuration
 */

export const TRIP_TYPES = {
  vacation: {
    label: 'Vacation/Leisure',
    icon: '🏖️',
    color: '#FF6B6B',
    description: 'Relaxing getaway, beach vacation, resort stay',
  },
  business: {
    label: 'Business Trip',
    icon: '💼',
    color: '#4A90E2',
    description: 'Conference, meetings, work travel',
  },
  weekend: {
    label: 'Weekend Getaway',
    icon: '🎒',
    color: '#95E1D3',
    description: 'Short 2-3 day trip, quick escape',
  },
  adventure: {
    label: 'Adventure/Outdoor',
    icon: '🏔️',
    color: '#38A169',
    description: 'Hiking, camping, outdoor activities',
  },
  event: {
    label: 'Event/Wedding',
    icon: '🎉',
    color: '#ED64A6',
    description: 'Wedding, party, special occasion',
  },
  'multi-destination': {
    label: 'Multi-Destination',
    icon: '🌍',
    color: '#805AD5',
    description: 'Multiple cities, backpacking, tour',
  },
} as const;

export const ACTIVITY_ICONS = {
  beach: '🏖️',
  sightseeing: '🏛️',
  dining: '🍽️',
  business: '💼',
  workout: '🏃',
  nightlife: '🌙',
  casual: '☕',
  formal: '🎭',
  outdoor: '🏔️',
  shopping: '🛍️',
} as const;

export const TIME_SLOT_LABELS = {
  morning: 'Morning (6am-12pm)',
  afternoon: 'Afternoon (12pm-6pm)',
  evening: 'Evening (6pm-12am)',
} as const;

export const ACCOMMODATION_TYPES = {
  hotel: 'Hotel',
  airbnb: 'Airbnb',
  resort: 'Resort',
  hostel: 'Hostel',
  camping: 'Camping',
  friend: 'Friend/Family',
} as const;

export const PACKING_CATEGORIES = {
  essentials: 'Essentials',
  clothing: 'Clothing',
  accessories: 'Accessories',
  toiletries: 'Toiletries',
  documents: 'Documents',
  electronics: 'Electronics',
  other: 'Other',
} as const;

export const TRIP_STATUS = {
  planning: 'Planning',
  packed: 'Packed',
  traveling: 'Traveling',
  completed: 'Completed',
} as const;

export const FORMALITY_LEVELS = [
  { value: 1, label: 'Very Casual', description: 'Beach, lounging, athletic' },
  { value: 2, label: 'Casual', description: 'Everyday wear, sightseeing' },
  { value: 3, label: 'Smart Casual', description: 'Nice restaurant, casual event' },
  { value: 4, label: 'Business Casual', description: 'Work meeting, upscale venue' },
  { value: 5, label: 'Formal', description: 'Black tie, gala, wedding' },
] as const;

// Type exports
export type TripType = keyof typeof TRIP_TYPES;
export type ActivityType = keyof typeof ACTIVITY_ICONS;
export type TimeSlot = keyof typeof TIME_SLOT_LABELS;
export type AccommodationType = keyof typeof ACCOMMODATION_TYPES;
export type PackingCategory = keyof typeof PACKING_CATEGORIES;
export type TripStatus = keyof typeof TRIP_STATUS;
export type FormalityLevel = 1 | 2 | 3 | 4 | 5;
