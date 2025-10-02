/**
 * Photo and Avatar Generation Types
 * Shared interfaces for photo capture and avatar generation
 */

export interface CapturedPhoto {
  id: string;
  view: string;
  type: string;
  dataUrl: string;
  timestamp: number;
  file?: File;
}

export interface PhotoStep {
  id: string;
  title: string;
  view: string;
  type: string;
  instruction: string;
  icon: string;
  tip: string;
  graphicPath: string;
}

export interface AvatarData {
  // 3D Realistic Avatar Data (Primary - Nano Banana)
  imageUrl?: string;          // Primary 3D realistic image URL
  enhancedImageUrl?: string;  // Enhanced/edited version
  description?: string;       // Generated description from Nano Banana

  // Legacy 2D CGI Data (Deprecated)
  modelUrl?: string;          // 3D model URL (deprecated)
  previewUrl?: string;        // Thumbnail/preview

  metadata?: {
    // 3D Realistic Metadata (Nano Banana)
    prompt?: string;
    style?: string;
    quality?: string;
    generation_time?: number;
    model?: string;
    perspective?: string;
    lighting?: string;

    // Legacy 2D CGI Metadata (deprecated)
    seed?: number;
    vertices?: number;
    faces?: number;
    materials?: number;
    animations?: string[];
  };
  qualityScore?: number;
}

// New interface specifically for 3D realistic avatars (Nano Banana)
export interface Avatar3DData {
  imageUrl: string;
  description?: string;
  metadata: {
    prompt: string;
    style: string;
    quality: string;
    generation_time: number;
    model: string;
    perspective: string;
    lighting: string;
  };
  qualityScore: number;
}

// Legacy interface for 2D CGI avatars (deprecated - Seedream)
export interface CGIAvatarData {
  imageUrl: string;
  enhancedImageUrl?: string;
  metadata: {
    seed: number;
    prompt: string;
    style: string;
    quality: string;
    generation_time: number;
  };
  qualityScore: number;
}

// Avatar generation style options
export type AvatarStyle = 'realistic' | 'artistic' | 'professional' | 'cinematic';

// Avatar perspective options for 3D generation
export type Avatar3DPerspective = 'portrait' | 'bust' | 'full';

// Avatar generation mode
export type AvatarGenerationMode = '3D_REALISTIC' | '2D_CGI';