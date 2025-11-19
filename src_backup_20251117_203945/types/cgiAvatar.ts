/**
 * TypeScript interfaces for CGI Avatar Generation System
 * Defines types for ByteDance Seedream v4 CGI avatar creation
 */

export interface MeasurementData {
  heightFeet: string;
  heightInches: string;
  chest: string;
  waist: string;
  hips: string;
  shoulderWidth: string;
  inseam: string;
  bodyType: 'athletic' | 'slim' | 'average' | 'curvy';
  weight?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
}

export interface CGIAvatarRequest {
  headPhotoUrl: string;
  measurements: MeasurementData;
  options?: {
    imageSize?: { width: number; height: number };
    numImages?: number;
    enableSafetyChecker?: boolean;
    seed?: number;
    cgiMode?: 'standard' | 'hyperrealistic';
    qualityLevel?: 'balanced' | 'maximum';
    numInferenceSteps?: number;
    guidanceScale?: number;
    strength?: number;
  };
}

export interface PhotoPreprocessingOptions {
  targetResolution?: { width: number; height: number };
  enableLightingEnhancement?: boolean;
  enableContrastAdjustment?: boolean;
  enableAutoRotation?: boolean;
  compressionQuality?: number;
  outputFormat?: 'png' | 'jpeg' | 'webp';
}

export interface CGIGenerationConfig {
  mode: 'standard' | 'hyperrealistic';
  qualityLevel: 'balanced' | 'maximum';
  resolution: { width: number; height: number };
  inferenceSteps: number;
  guidanceScale: number;
  strength: number;
  enablePreprocessing: boolean;
  preprocessingOptions: PhotoPreprocessingOptions;
}

export interface SeedreamTextToImageRequest {
  prompt: string;
  image_size?: { width: number; height: number } | string;
  num_images?: number;
  max_images?: number;
  seed?: number;
  enable_safety_checker?: boolean;
}

export interface SeedreamEditRequest {
  image_urls: string[];
  prompt: string;
  negative_prompt?: string;
  image_size?: { width: number; height: number } | string;
  num_images?: number;
  max_images?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  strength?: number;
  seed?: number;
  enable_safety_checker?: boolean;
}

export interface SeedreamResponse {
  images: Array<{
    url: string;
    width?: number;
    height?: number;
    content_type?: string;
  }>;
  seed: number;
  timings?: {
    inference: number;
  };
  has_nsfw_concepts?: boolean[];
}

export interface CGIGenerationStep {
  stepName: string;
  prompt: string;
  processingTime: number;
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface CGIAvatarMetadata {
  measurements: MeasurementData;
  headPhotoUrl: string;
  bodyPrompt: string;
  compositionPrompt: string;
  totalProcessingTime: number;
  model: string;
  aspectRatio: string;
  generationSteps: CGIGenerationStep[];
  qualityScore: number;
  fashnCompatible: boolean;
}

export interface CGIAvatarResult {
  success: boolean;
  cgiImageUrl?: string;
  bodyImageUrl?: string;
  headPhotoUrl?: string;
  metadata?: CGIAvatarMetadata;
  error?: string;
}

export interface CGIPromptConfig {
  basePrompt: string;
  qualityTerms: string[];
  styleTerms: string[];
  lightingTerms: string[];
  poseTerms: string[];
  backgroundTerms: string[];
}

export interface BodyDescription {
  gender: string;
  age: string;
  bodyType: string;
  height: string;
  proportions: string;
  build: string;
}