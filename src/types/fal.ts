// Comprehensive TypeScript types for FAL API responses and requests

// Base types
export interface FalResponse {
  requestId?: string;
  status?: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  logs?: FalLogEntry[];
  metrics?: {
    predict_time?: number;
    queue_time?: number;
    total_time?: number;
  };
}

export interface FalLogEntry {
  message: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  timestamp: string;
}

export interface FalError {
  error: string;
  message: string;
  detail?: string;
  status_code?: number;
}

// Image-related types
export interface FalImage {
  url: string;
  width: number;
  height: number;
  content_type: string;
  file_name?: string;
  file_size?: number;
}

export interface FalImageResponse extends FalResponse {
  images: FalImage[];
}

// Virtual Try-On types for new API
export interface VirtualTryOnRequest {
  person_image_url: string;
  clothing_image_url: string;
  preserve_pose?: boolean;
  aspect_ratio?: AspectRatio;
}

export interface VirtualTryOnResponse extends FalResponse {
  images: FalImage[];
}

// Aspect ratio type for the new API
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';

// Outfit Anyone types
export interface OutfitAnyoneRequest {
  human_img: string | File;
  garment_img: string | File;
  prompt?: string;
  negative_prompt?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  seed?: number;
  width?: number;
  height?: number;
}

export interface OutfitAnyoneResponse extends FalImageResponse {
  seed?: number;
  prompt?: string;
  negative_prompt?: string;
}

// Background Removal types
export interface BackgroundRemovalRequest {
  image: string | File;
  model?: 'General Use (Light)' | 'General Use (Heavy)' | 'Human';
  operating_resolution?: number;
  output_format?: 'png' | 'webp';
}

export interface BackgroundRemovalResponse extends FalResponse {
  image: FalImage;
}

// Face Swap types
export interface FaceSwapRequest {
  source_image: string | File;
  target_image: string | File;
  source_indexes?: number[];
  target_indexes?: number[];
}

export interface FaceSwapResponse extends FalImageResponse {
  source_faces_count?: number;
  target_faces_count?: number;
}

// Stable Diffusion types
export interface StableDiffusionRequest {
  prompt: string;
  negative_prompt?: string;
  image_size?: 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
  num_inference_steps?: number;
  guidance_scale?: number;
  num_images?: number;
  seed?: number;
  safety_tolerance?: 1 | 2 | 3 | 4 | 5 | 6;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface StableDiffusionResponse extends FalImageResponse {
  seed?: number;
  has_nsfw_concepts?: boolean[];
  prompt?: string;
}

// Queue types
export interface QueueStatus {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  queue_position?: number;
  response_url?: string;
  logs?: FalLogEntry[];
}

export interface QueueUpdate {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  queue_position?: number;
  logs?: FalLogEntry[];
}

// Subscription options
export interface FalSubscribeOptions<T = any> {
  input: T;
  logs?: boolean;
  onQueueUpdate?: (update: QueueUpdate) => void;
  mode?: 'streaming' | 'polling';
  pollInterval?: number;
  timeout?: number;
}

// Utility types for fashion applications
export type GarmentType = 'upper_body' | 'lower_body' | 'dresses';

export interface FashionTryOnParams {
  personImage: File | string;
  garmentImage: File | string;
  garmentType?: GarmentType;
  numInferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
}

export interface ProcessingState {
  isLoading: boolean;
  progress: number;
  message: string;
  error?: string;
}

// Webhook types
export interface WebhookPayload {
  request_id: string;
  status: 'COMPLETED' | 'FAILED';
  response_url?: string;
  error?: FalError;
}

// Configuration types
export interface FalConfig {
  credentials?: string;
  requestMiddleware?: (request: Request) => Request;
  responseHandler?: (response: Response) => Response;
}

// Export utility type guards
export const isFalError = (obj: any): obj is FalError => {
  return obj && typeof obj.error === 'string';
};

export const isFalImageResponse = (obj: any): obj is FalImageResponse => {
  return obj && Array.isArray(obj.images);
};

export const isVirtualTryOnResponse = (obj: any): obj is VirtualTryOnResponse => {
  return isFalImageResponse(obj) && obj.images.length > 0;
};