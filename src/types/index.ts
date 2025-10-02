export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  style_preferences: string[];
  avatar_data?: any;
  measurements?: {
    height: string;
    chest: string;
    waist: string;
    hips: string;
    shoulders: string;
    inseam: string;
  };
  created_at: string;
}

export interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  size: string;
  type: 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessories';
  color: string;
  price?: number;
  image_url: string;
  fit_data?: any;
  created_at: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  name: string;
  items: string[]; // array of clothing item IDs
  occasion?: string;
  weather?: string;
  created_at: string;
}