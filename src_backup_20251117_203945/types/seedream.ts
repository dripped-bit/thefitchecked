// TypeScript types for Seedream 4 API

export interface Seedream4Request {
  prompt: string;
  image_urls: string[];
  image_size?: {
    width: number;
    height: number;
  };
  num_images?: number;
  max_images?: number;
  seed?: number;
  sync_mode?: boolean;
  enable_safety_checker?: boolean;
}

export interface Seedream4Image {
  url: string;
  width?: number;
  height?: number;
  content_type?: string;
}

export interface Seedream4Response {
  images: Seedream4Image[];
  seed: number;
  requestId?: string;
  logs?: Array<{
    message: string;
    level: string;
    timestamp: string;
  }>;
}

// Helper types for the UI
export interface VirtualTryOnParams {
  personImage: File;
  garmentImage: File;
  prompt?: string;
  numImages?: number;
  seed?: number;
}

export interface ProcessingState {
  isLoading: boolean;
  progress: string;
  error?: string;
}