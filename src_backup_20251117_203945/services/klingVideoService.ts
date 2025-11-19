/**
 * Kling Video Service
 * Converts static avatar images to animated videos using FAL AI Kling Video v2.5 Turbo Pro
 * Creates 5-second animations of avatars standing and waiting to get dressed
 */

import { Measurements } from './seedreamV4AvatarService';

console.log('🎬 Kling Video Service Configuration: Using /api/fal proxy');

export interface KlingVideoRequest {
  image_url: string; // Required - Static avatar image URL
  prompt: string; // Required - Animation description
  duration?: number; // Duration in seconds (default: 5)
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '3:4' | '4:3'; // Video aspect ratio
  loop?: boolean; // Whether to loop the video
  cfg_scale?: number; // Guidance scale (1.0-10.0)
  motion_strength?: number; // Motion intensity (0.0-1.0)
  seed?: number; // Random seed for reproducibility
}

export interface KlingVideoResponse {
  video?: {
    url: string;
    width: number;
    height: number;
    duration: number;
    file_size: number;
    content_type: string;
  };
  timings?: {
    inference: number;
  };
  seed?: number;
  has_nsfw_concepts?: boolean[];
}

export interface AnimatedAvatar {
  videoUrl: string;
  staticImageUrl: string;
  duration: number;
  metadata: {
    originalImageUrl: string;
    animationPrompt: string;
    measurements?: Measurements;
    processingTime: number;
    model: string;
    dimensions: {
      width: number;
      height: number;
    };
    fileSize: number;
    seed?: number;
    motionStrength: number;
    cfgScale: number;
  };
  qualityScore: number;
}

export class KlingVideoService {
  private readonly endpoint = 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video';

  constructor() {
    console.log('🎬 [KLING-VIDEO] Service initialized:', {
      hasApiKey: !!falApiKey,
      apiKeyLength: falApiKey?.length || 0,
      endpoint: this.endpoint,
      defaultDuration: 5,
      supportedAspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3'],
      animationEnabled: this.isAnimationEnabled()
    });
  }

  /**
   * Check if avatar animation is enabled via environment variable
   */
  private isAnimationEnabled(): boolean {
    const enabled = import.meta.env.VITE_ENABLE_AVATAR_ANIMATION === 'true';
    console.log(`🎬 [KLING-ANIMATION-CHECK] Avatar animation is ${enabled ? 'ENABLED' : 'DISABLED'}`);
    return enabled;
  }

  /**
   * Create animated avatar from static image
   */
  async animateAvatar(
    staticImageUrl: string,
    measurements?: Measurements,
    customPrompt?: string,
    options: Partial<KlingVideoRequest> = {}
  ): Promise<{ success: boolean; animatedAvatar?: AnimatedAvatar; error?: string }> {
    try {
      // Check if animation is disabled first
      if (!this.isAnimationEnabled()) {
        console.log('🚫 [KLING-DISABLED] Avatar animation is disabled - returning static image');
        console.log('🚫 [KLING-DISABLED] Skipping Kling video API call due to VITE_ENABLE_AVATAR_ANIMATION=false');

        return {
          success: true,
          animatedAvatar: {
            videoUrl: null, // No video when animation is disabled
            staticImageUrl: staticImageUrl,
            metadata: {
              measurements: measurements || {},
              prompt: 'Animation disabled - static image only',
              processingTime: 25, // Instant when disabled
              model: 'Animation Disabled',
              endpoint: 'disabled://no-animation',
              animationDisabled: true,
              aspectRatio: options.aspectRatio || '1:1',
              quality: 'static',
              durationSeconds: 0, // No duration for static
              qualityScore: 100 // Perfect for static
            }
          }
        };
      }

      console.log('🎬 Starting avatar animation with Kling Video v2.5 Turbo Pro');
      console.log('📸 Static image URL:', staticImageUrl);
      console.log('📏 Measurements available:', !!measurements);

      const startTime = Date.now();

      // Generate animation prompt based on measurements and context
      const animationPrompt = customPrompt || this.generateAnimationPrompt(measurements);
      console.log('📝 Animation prompt:', animationPrompt);

      // Prepare Kling Video request
      const request: KlingVideoRequest = {
        image_url: staticImageUrl,
        prompt: animationPrompt,
        duration: options.duration || 5,
        aspect_ratio: options.aspect_ratio || '1:1', // Square for full-body avatar
        loop: options.loop !== false, // Default to true
        cfg_scale: options.cfg_scale || 7.5, // Good balance
        motion_strength: options.motion_strength || 0.6, // Moderate motion
        seed: options.seed
      };

      // Validate request
      this.validateKlingRequest(request);

      console.log('🚀 Sending request to Kling Video API via proxy...');
      console.log('⚙️ Request parameters:', JSON.stringify(request, null, 2));

      // Call Kling Video API via proxy
      const klingResponse = await fetch(`/api/fal/${this.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!klingResponse.ok) {
        throw new Error(`Kling Video API request failed: ${klingResponse.status}`);
      }

      const result = await klingResponse.json() as KlingVideoResponse;

      const processingTime = Date.now() - startTime;

      // Debug: Log response structure
      console.log('📦 Kling Video Response Structure:', {
        hasVideo: !!result.video,
        videoUrl: result.video?.url,
        videoDuration: result.video?.duration,
        videoSize: result.video?.file_size,
        processingTime: result.timings?.inference,
        seed: result.seed
      });

      if (!result.video || !result.video.url) {
        console.error('❌ No video generated by Kling API');
        console.error('Full response:', JSON.stringify(result, null, 2));
        throw new Error('No animated video was generated by Kling API');
      }

      // Create AnimatedAvatar object
      const animatedAvatar: AnimatedAvatar = {
        videoUrl: result.video.url,
        staticImageUrl,
        duration: result.video.duration,
        metadata: {
          originalImageUrl: staticImageUrl,
          animationPrompt,
          measurements,
          processingTime,
          model: 'Kling Video v2.5 Turbo Pro',
          dimensions: {
            width: result.video.width,
            height: result.video.height
          },
          fileSize: result.video.file_size,
          seed: result.seed,
          motionStrength: request.motion_strength || 0.6,
          cfgScale: request.cfg_scale || 7.5
        },
        qualityScore: this.calculateQualityScore(result, processingTime)
      };

      console.log(`✅ Avatar animation completed successfully in ${processingTime}ms`);
      console.log(`🎥 Video duration: ${result.video.duration}s`);
      console.log(`📐 Video dimensions: ${result.video.width}x${result.video.height}`);
      console.log(`💾 File size: ${(result.video.file_size / 1024 / 1024).toFixed(2)}MB`);

      return {
        success: true,
        animatedAvatar
      };

    } catch (error) {
      console.error('❌ Kling Video animation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Animation failed'
      };
    }
  }

  /**
   * Generate animation prompt based on measurements and context
   */
  generateAnimationPrompt(measurements?: Measurements): string {
    let prompt = 'Person standing naturally in a neutral pose, ';

    // Add build-specific animation cues based on measurements
    if (measurements) {
      const height = typeof measurements.height === 'string'
        ? parseFloat(measurements.height)
        : measurements.height;

      // Height-based posture
      if (height && height < 160) {
        prompt += 'confident posture with slight weight shift, ';
      } else if (height && height > 180) {
        prompt += 'tall elegant stance with gentle swaying, ';
      } else {
        prompt += 'balanced posture with natural breathing motion, ';
      }

      // Build-based movement
      if (measurements.build === 'athletic') {
        prompt += 'strong confident stance with subtle muscle definition, ';
      } else if (measurements.build === 'slim') {
        prompt += 'graceful movements with gentle swaying, ';
      } else {
        prompt += 'natural comfortable stance, ';
      }
    } else {
      prompt += 'gentle breathing motion with slight weight shifting, ';
    }

    // Core animation description
    prompt += 'waiting patiently to get dressed, subtle natural movements, ';
    prompt += 'professional lighting, clean background, ';
    prompt += 'fashion model pose ready for virtual try-on, ';
    prompt += 'smooth 5-second loop animation, ';
    prompt += 'high quality video, realistic motion, cinematic quality';

    return prompt;
  }

  /**
   * Generate specialized animation prompts for different scenarios
   */
  getAnimationPrompts(): Record<string, string> {
    return {
      waiting: 'Person standing naturally, gentle breathing motion, subtle weight shifting, waiting patiently, professional pose',

      confidence: 'Confident stance with slight hip shift, natural arm positioning, ready for fashion, strong posture',

      elegant: 'Elegant model pose, graceful movements, sophisticated stance, gentle swaying, high-fashion positioning',

      casual: 'Relaxed natural stance, comfortable positioning, casual breathing motion, approachable pose',

      professional: 'Professional model stance, studio-quality positioning, industry-standard pose, commercial-ready',

      athletic: 'Strong confident posture, athletic stance, defined positioning, fitness-ready pose',

      minimal: 'Minimal natural movement, subtle breathing, clean positioning, understated elegance'
    };
  }

  /**
   * Create multiple animation variations
   */
  async createAnimationVariations(
    staticImageUrl: string,
    measurements?: Measurements,
    variationCount: number = 3
  ): Promise<{
    success: boolean;
    animations?: AnimatedAvatar[];
    errors?: string[];
  }> {
    console.log(`🎬 Creating ${variationCount} animation variations...`);

    const prompts = Object.values(this.getAnimationPrompts()).slice(0, variationCount);
    const results: AnimatedAvatar[] = [];
    const errors: string[] = [];

    for (let i = 0; i < prompts.length; i++) {
      try {
        console.log(`🎬 Creating variation ${i + 1}/${prompts.length}...`);

        const result = await this.animateAvatar(
          staticImageUrl,
          measurements,
          prompts[i],
          { seed: Math.floor(Math.random() * 1000000) }
        );

        if (result.success && result.animatedAvatar) {
          results.push(result.animatedAvatar);
        } else {
          errors.push(`Variation ${i + 1}: ${result.error}`);
        }

        // Small delay between requests
        if (i < prompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        const errorMsg = `Variation ${i + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return {
      success: results.length > 0,
      animations: results,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validate Kling Video request parameters
   */
  private validateKlingRequest(request: KlingVideoRequest): void {
    const errors: string[] = [];

    // Validate image URL
    if (!request.image_url || typeof request.image_url !== 'string') {
      errors.push('image_url is required and must be a string');
    } else if (!request.image_url.match(/^(https?:\/\/|data:image\/)/)) {
      errors.push('image_url must be a valid HTTP URL or base64 data URL');
    }

    // Validate prompt
    if (!request.prompt || typeof request.prompt !== 'string') {
      errors.push('prompt is required and must be a string');
    } else if (request.prompt.length > 1000) {
      errors.push('prompt must be 1000 characters or less');
    }

    // Validate duration
    if (request.duration !== undefined) {
      if (!Number.isInteger(request.duration) || request.duration < 1 || request.duration > 10) {
        errors.push('duration must be an integer between 1 and 10 seconds');
      }
    }

    // Validate aspect ratio
    if (request.aspect_ratio !== undefined) {
      const validRatios = ['1:1', '16:9', '9:16', '3:4', '4:3'];
      if (!validRatios.includes(request.aspect_ratio)) {
        errors.push(`aspect_ratio must be one of: ${validRatios.join(', ')}`);
      }
    }

    // Validate cfg_scale
    if (request.cfg_scale !== undefined) {
      if (typeof request.cfg_scale !== 'number' || request.cfg_scale < 1.0 || request.cfg_scale > 10.0) {
        errors.push('cfg_scale must be a number between 1.0 and 10.0');
      }
    }

    // Validate motion_strength
    if (request.motion_strength !== undefined) {
      if (typeof request.motion_strength !== 'number' || request.motion_strength < 0.0 || request.motion_strength > 1.0) {
        errors.push('motion_strength must be a number between 0.0 and 1.0');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Kling Video request validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Calculate quality score for animated avatar
   */
  private calculateQualityScore(result: KlingVideoResponse, processingTime: number): number {
    let score = 70; // Base score

    // Video quality factors
    if (result.video) {
      // Resolution bonus
      const pixels = result.video.width * result.video.height;
      if (pixels >= 1920 * 1080) score += 15; // HD+
      else if (pixels >= 1280 * 720) score += 10; // HD
      else if (pixels >= 854 * 480) score += 5; // SD

      // Duration accuracy (5s target)
      const durationDiff = Math.abs(result.video.duration - 5);
      if (durationDiff <= 0.5) score += 10;
      else if (durationDiff <= 1.0) score += 5;

      // File size efficiency
      const sizeMB = result.video.file_size / 1024 / 1024;
      if (sizeMB > 2 && sizeMB < 10) score += 5; // Good compression
    }

    // Processing time bonus
    if (processingTime < 60000) score += 5; // Under 1 minute
    if (processingTime < 30000) score += 5; // Under 30 seconds

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get service information
   */
  getServiceInfo() {
    return {
      name: 'Kling Video Avatar Animation Service',
      version: '1.0.0',
      description: 'Convert static avatars to animated videos using Kling Video v2.5 Turbo Pro',
      endpoint: this.endpoint,
      isConfigured: !!falApiKey,
      capabilities: [
        '5-second avatar animations',
        'Multiple animation styles',
        'Measurement-based motion prompts',
        'Professional quality output',
        'Loop-ready videos',
        'Portrait aspect ratio optimization'
      ],
      supportedFormats: ['MP4 video'],
      maxDuration: '10 seconds',
      recommendedDuration: '5 seconds',
      aspectRatios: ['1:1', '16:9', '9:16', '3:4', '4:3']
    };
  }
}

// Export singleton instance
export const klingVideoService = new KlingVideoService();
export default klingVideoService;