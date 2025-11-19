/**
 * ByteDance Seedream v4 Avatar Service
 * Two-step avatar generation: body from measurements + face composition
 * Now integrates Perfect Avatar Configuration for high-quality facial preservation
 */

import { environmentConfig } from './environmentConfig';
import { faceAnalysisService, FaceAnalysis } from './faceAnalysisService';
import { klingVideoService, AnimatedAvatar } from './klingVideoService';
import { PerfectAvatarConfig, PERFECT_GENERATION_PARAMS } from '../config/perfectAvatarConfig.js';
import { getBestPromptForGeneration } from '../config/bestavatargenerated.js';
import promptDebugService from './promptDebugService';

console.log('🔧 FAL Client Configuration: Using /api/fal proxy');

export interface Measurements {
  height: number | string;
  chest: number;
  waist: number;
  hips: number;
  shoulders: number;
  inseam: number;
  neck?: number;
  bicep?: number;
  weight?: number;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  build?: 'slim' | 'athletic' | 'average' | 'curvy' | 'muscular';
}

export interface SeedreamV4TextToImageRequest {
  prompt: string; // Required, max 5000 characters
  num_images?: number; // 1-6, default 1
  image_size?: string | { width: number; height: number }; // Predefined strings or custom 1024-4096px
  max_images?: number; // 1-6, default 1
  seed?: number; // Optional integer for reproducibility
  enable_safety_checker?: boolean; // Default false
}

export interface SeedreamV4EditRequest {
  image_urls: string[]; // Required, up to 10 images
  prompt: string; // Required, max 5000 characters
  num_images?: number; // 1-6, default 1
  image_size?: string | { width: number; height: number }; // Predefined strings or custom 1024-4096px
  max_images?: number; // 1-6, default 1
  seed?: number; // Optional integer
  enable_safety_checker?: boolean; // Default false
}

export interface SeedreamV4Response {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  timings: {
    inference: number;
  };
  seed: number;
  has_nsfw_concepts: boolean[];
}

export interface CustomAvatar {
  imageUrl: string;
  bodyImageUrl: string;
  faceImageUrl: string;
  // New animated video properties
  animatedVideoUrl?: string;
  animatedAvatar?: AnimatedAvatar;
  isAnimated: boolean;
  metadata: {
    measurements: Measurements;
    bodyPrompt: string;
    processingTime: number;
    model: string;
    generation_type: 'two_step_avatar' | 'animated_avatar';
    steps: {
      bodyGeneration: {
        prompt: string;
        time: number;
        success: boolean;
      };
      faceComposition: {
        time: number;
        success: boolean;
      };
      videoAnimation?: {
        prompt: string;
        time: number;
        success: boolean;
        duration: number;
      };
    };
  };
  qualityScore: number;
}

export class SeedreamV4AvatarService {
  private readonly config = environmentConfig.getFalConfig?.() || {
    apiKey: falApiKey,
    apiUrl: 'https://fal.run/fal-ai/hyper-sdxl'
  };

  constructor() {
    // Log configuration status for debugging
    console.log('🔧 [SEEDREAM-V4] Service initialized:', {
      hasApiKey: !!falApiKey,
      apiKeyLength: falApiKey?.length || 0,
      apiKeyPrefix: falApiKey?.substring(0, 8) + '...',
      bodyGenEndpoint: 'fal-ai/bytedance/seedream/v4/text-to-image',
      faceComposeEndpoint: 'fal-ai/bytedance/seedream/v4/edit',
      workflow: 'measurements → body (text-to-image) → body+head (edit) → avatar',
      validationEnabled: true
    });
  }

  /**
   * Generate animated custom avatar from measurements and face photo
   */
  async generateAnimatedAvatar(
    measurements: Measurements,
    facePhotoUrl: string,
    options: Partial<SeedreamV4TextToImageRequest & SeedreamV4EditRequest> = {}
  ): Promise<{ success: boolean; avatar?: CustomAvatar; error?: string; faceAnalysis?: FaceAnalysis }> {
    try {
      console.log('🎬 Starting animated avatar generation with Kling Video + Seedream v4');
      console.log('📏 Measurements:', measurements);
      console.log('👤 Face photo provided:', !!facePhotoUrl);

      // Step 1: Generate static avatar first
      console.log('🔄 Step 1: Generating static avatar base...');
      const staticAvatarResult = await this.generateCustomAvatar(measurements, facePhotoUrl, options);

      if (!staticAvatarResult.success || !staticAvatarResult.avatar) {
        throw new Error('Failed to generate static avatar base: ' + staticAvatarResult.error);
      }

      const staticAvatar = staticAvatarResult.avatar;
      console.log('✅ Static avatar generated:', staticAvatar.imageUrl);

      // Step 2: Animate the static avatar with Kling Video
      console.log('🔄 Step 2: Animating avatar with Kling Video v2.5 Turbo Pro...');
      const animationStartTime = Date.now();

      const animationResult = await klingVideoService.animateAvatar(
        staticAvatar.imageUrl,
        measurements,
        undefined, // Use default animation prompt
        {
          duration: 5,
          aspect_ratio: '1:1',
          motion_strength: 0.6,
          cfg_scale: 7.5
        }
      );

      const animationTime = Date.now() - animationStartTime;

      if (!animationResult.success || !animationResult.animatedAvatar) {
        console.warn('⚠️ Animation failed, returning static avatar only:', animationResult.error);
        // Return static avatar if animation fails
        return staticAvatarResult;
      }

      console.log('✅ Avatar animation completed successfully');
      console.log('🎥 Animated video URL:', animationResult.animatedAvatar.videoUrl);

      // Step 3: Create animated avatar object
      const animatedAvatar: CustomAvatar = {
        ...staticAvatar,
        animatedVideoUrl: animationResult.animatedAvatar.videoUrl,
        animatedAvatar: animationResult.animatedAvatar,
        isAnimated: true,
        metadata: {
          ...staticAvatar.metadata,
          generation_type: 'animated_avatar',
          processingTime: staticAvatar.metadata.processingTime + animationTime,
          steps: {
            ...staticAvatar.metadata.steps,
            videoAnimation: {
              prompt: animationResult.animatedAvatar.metadata.animationPrompt,
              time: animationTime,
              success: true,
              duration: animationResult.animatedAvatar.duration
            }
          }
        }
      };

      // Update quality score for animated version
      animatedAvatar.qualityScore = this.calculateAnimatedQualityScore(
        staticAvatar.qualityScore,
        animationResult.animatedAvatar.qualityScore
      );

      console.log(`✅ Animated avatar generation completed in ${animatedAvatar.metadata.processingTime}ms`);
      console.log(`🎥 Video duration: ${animationResult.animatedAvatar.duration}s`);

      return {
        success: true,
        avatar: animatedAvatar,
        faceAnalysis: staticAvatarResult.faceAnalysis
      };

    } catch (error) {
      console.error('❌ Animated avatar generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate complete custom avatar from measurements and face photo
   */
  async generateCustomAvatar(
    measurements: Measurements,
    facePhotoUrl: string,
    options: Partial<SeedreamV4TextToImageRequest & SeedreamV4EditRequest> = {}
  ): Promise<{ success: boolean; avatar?: CustomAvatar; error?: string; faceAnalysis?: FaceAnalysis }> {
    try {
      console.log('🎨 Starting two-step avatar generation with Seedream v4');
      console.log('📏 Measurements:', measurements);
      console.log('👤 Face photo provided:', !!facePhotoUrl);

      const startTime = Date.now();

      // Step 0: Analyze face photo for better prompt generation
      console.log('🔍 Analyzing face photo...');
      const faceAnalysis = await faceAnalysisService.analyzePhoto(facePhotoUrl);
      console.log('📊 Face analysis results:', faceAnalysis);

      // Step 1: Generate body from measurements with enhanced prompt
      console.log('🔄 Step 1: Generating body from measurements...');
      const bodyStep = await this.generateBodyFromMeasurements(measurements, options, faceAnalysis);

      if (!bodyStep.success || !bodyStep.bodyImageUrl) {
        throw new Error('Failed to generate body: ' + bodyStep.error);
      }

      // Step 2: Compose face onto generated body
      console.log('🔄 Step 2: Composing face onto generated body...');
      const faceStep = await this.composeFaceOntoBody(
        bodyStep.bodyImageUrl,
        facePhotoUrl,
        options
      );

      if (!faceStep.success || !faceStep.compositeImageUrl) {
        throw new Error('Failed to compose face onto body: ' + faceStep.error);
      }

      const totalTime = Date.now() - startTime;
      console.log(`✅ Avatar generation completed in ${totalTime}ms`);

      const customAvatar: CustomAvatar = {
        imageUrl: faceStep.compositeImageUrl,
        bodyImageUrl: bodyStep.bodyImageUrl,
        faceImageUrl: facePhotoUrl,
        isAnimated: false, // Static avatar
        metadata: {
          measurements,
          bodyPrompt: bodyStep.prompt,
          processingTime: totalTime,
          model: 'bytedance_seedream_v4',
          generation_type: 'two_step_avatar',
          steps: {
            bodyGeneration: {
              prompt: bodyStep.prompt,
              time: bodyStep.processingTime,
              success: bodyStep.success
            },
            faceComposition: {
              time: faceStep.processingTime,
              success: faceStep.success
            }
          }
        },
        qualityScore: this.calculateQualityScore(measurements, totalTime, bodyStep.success && faceStep.success)
      };

      return {
        success: true,
        avatar: customAvatar,
        faceAnalysis
      };

    } catch (error) {
      console.error('❌ Avatar generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Step 1: Generate body image from measurements using text-to-image
   */
  private async generateBodyFromMeasurements(
    measurements: Measurements,
    options: Partial<SeedreamV4TextToImageRequest>,
    faceAnalysis?: FaceAnalysis
  ): Promise<{
    success: boolean;
    bodyImageUrl?: string;
    prompt: string;
    processingTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    // Generate detailed body description from measurements and face analysis
    const bodyPrompt = await this.generateBodyPrompt(measurements, faceAnalysis);
    console.log('📝 Generated enhanced body prompt:', bodyPrompt);

    // Create request using PERFECT AVATAR CONFIG parameters
    const perfectParams = PERFECT_GENERATION_PARAMS.OPTIMAL;
    const request: SeedreamV4TextToImageRequest = {
      prompt: bodyPrompt,
      num_images: Math.min(Math.max(options.num_images || 1, 1), 6), // Clamp 1-6
      image_size: options.image_size || perfectParams.image_size, // Use PERFECT config 1152x2048
      max_images: Math.min(Math.max(options.max_images || 1, 1), 6), // Clamp 1-6
      enable_safety_checker: perfectParams.enable_safety_checker,
      seed: options.seed || perfectParams.seed // Use timestamp seed from perfect config
    };

    console.log('✨ [PERFECT-AVATAR] Using Perfect Avatar Config parameters:', {
      image_size: request.image_size,
      enable_safety_checker: request.enable_safety_checker
    });

    // Log prompt to debug service
    promptDebugService.logPrompt({
      type: 'avatar',
      serviceName: 'Seedream V4 - Body Generation',
      prompt: bodyPrompt,
      parameters: {
        num_images: request.num_images,
        image_size: request.image_size,
        enable_safety_checker: request.enable_safety_checker,
        seed: request.seed
      }
    });

    try {

      // Enhanced logging before API call
      console.log('📤 Sending body generation request to Seedream V4/text-to-image:');
      console.log('- Endpoint: fal-ai/bytedance/seedream/v4/text-to-image');
      console.log('- Parameters:', JSON.stringify(request, null, 2));
      console.log('- FAL Key configured:', !!import.meta.env.VITE_FAL_KEY);

      // Validate request parameters to prevent 422 errors
      this.validateSeedreamRequest(request);

      console.log('🚀 Calling fal-ai/bytedance/seedream/v4/text-to-image via proxy...');
      const response = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Seedream API request failed: ${response.status}`);
      }

      const result = await response.json();

      const processingTime = Date.now() - startTime;

      // DEBUG: Log the entire response structure
      console.log('📦 FAL Response Structure:', {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : 'no result',
        hasImages: !!(result?.images),
        imagesLength: result?.images?.length,
        hasImage: !!(result?.image),
        hasUrl: !!(result?.url),
        hasOutput: !!(result?.output),
        fullResult: result
      });

      // Check different possible response formats
      let bodyImageUrl: string | undefined;

      if (result?.images?.[0]?.url) {
        console.log('✅ Found image at result.images[0].url');
        bodyImageUrl = result.images[0].url;
      } else if (result?.image?.url) {
        console.log('✅ Found image at result.image.url');
        bodyImageUrl = result.image.url;
      } else if (result?.url) {
        console.log('✅ Found image at result.url');
        bodyImageUrl = result.url;
      } else if (result?.output) {
        console.log('✅ Found image at result.output');
        bodyImageUrl = result.output;
      } else {
        // Log what we actually got for debugging
        console.error('❌ Unexpected response format. Full result:', JSON.stringify(result, null, 2));
        throw new Error(`No image found in FAL response. Available keys: ${result ? Object.keys(result).join(', ') : 'none'}`);
      }

      if (!bodyImageUrl) {
        throw new Error('No valid image URL found in FAL response');
      }

      console.log(`✅ Body generated successfully in ${processingTime}ms`);

      return {
        success: true,
        bodyImageUrl,
        prompt: bodyPrompt,
        processingTime
      };

    } catch (error) {
      console.error('❌ Body generation failed - DETAILED ERROR ANALYSIS:');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error status:', (error as any)?.status);
      console.error('Error body:', JSON.stringify((error as any)?.body, null, 2));
      console.error('Error detail:', (error as any)?.detail);
      console.error('Error logs:', (error as any)?.logs);
      console.error('Request data:', JSON.stringify(request, null, 2));
      console.error('Full error object:', error);

      // Check for specific FAL validation issues
      const errorBody = (error as any)?.body;
      const errorDetail = (error as any)?.detail;

      if (errorBody?.detail) {
        console.error('🔴 FAL Validation Details:', errorBody.detail);

        if (typeof errorBody.detail === 'string') {
          if (errorBody.detail.includes('prompt')) {
            console.error('📝 Issue with prompt:', request.prompt);
          }
          if (errorBody.detail.includes('api_key') || errorBody.detail.includes('unauthorized')) {
            console.error('🔑 API Key issue - Current key exists:', !!import.meta.env.VITE_FAL_KEY);
            console.error('🔑 Key length:', import.meta.env.VITE_FAL_KEY?.length);
          }
          if (errorBody.detail.includes('image_size')) {
            console.error('📐 Issue with image_size:', request.image_size);
          }
        }
      }

      if (errorDetail) {
        console.error('🔴 Additional Error Detail:', errorDetail);
      }

      // Provide specific error message for different error types
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('422')) {
          errorMessage = `Validation Error (422): ${error.message}. Check the console for detailed request parameters.`;
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Authentication Error: Please check your FAL API key configuration.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate Limit Error: Too many requests. Please try again later.';
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          errorMessage = 'Server Error: FAL API is experiencing issues. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        prompt: await this.generateBodyPrompt(measurements, faceAnalysis),
        processingTime: Date.now() - startTime,
        error: errorMessage
      };
    }
  }

  /**
   * Step 2: Compose face onto generated body using edit/inpainting
   */
  private async composeFaceOntoBody(
    bodyImageUrl: string,
    facePhotoUrl: string,
    options: Partial<SeedreamV4EditRequest>
  ): Promise<{
    success: boolean;
    compositeImageUrl?: string;
    processingTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    // Use PERFECT AVATAR CONFIG parameters for face composition
    const perfectParams = PERFECT_GENERATION_PARAMS.OPTIMAL;

    const request: SeedreamV4EditRequest = {
      image_urls: [bodyImageUrl, facePhotoUrl],
      prompt: 'FACIAL IDENTITY PRIORITY: Preserve exact facial features, eye shape, nose structure, mouth shape, jawline, and skin tone from uploaded photo. Seamlessly blend and composite the face onto the body, maintaining natural proportions and realistic appearance. Use the second image (face photo) to replace the face area of the first image (body), preserving exact facial features while matching skin tone and lighting. Perfect facial likeness required.',
      num_images: Math.min(Math.max(options.num_images || 1, 1), 6), // Clamp 1-6
      image_size: options.image_size || perfectParams.image_size, // Use PERFECT config 1152x2048
      max_images: Math.min(Math.max(options.max_images || 1, 1), 6), // Clamp 1-6
      enable_safety_checker: perfectParams.enable_safety_checker,
      seed: options.seed || perfectParams.seed
    };

    console.log('✨ [PERFECT-AVATAR] Face composition using Perfect Avatar Config');

    // Log prompt to debug service
    promptDebugService.logPrompt({
      type: 'avatar',
      serviceName: 'Seedream V4 - Face Composition',
      prompt: request.prompt,
      parameters: {
        num_images: request.num_images,
        image_size: request.image_size,
        enable_safety_checker: request.enable_safety_checker,
        seed: request.seed,
        image_count: request.image_urls.length
      }
    });

    try {

      console.log('🚀 Calling fal-ai/bytedance/seedream/v4/edit via proxy...');
      console.log('📤 Edit request parameters:', JSON.stringify(request, null, 2));

      const editResponse = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!editResponse.ok) {
        throw new Error(`Seedream Edit API request failed: ${editResponse.status}`);
      }

      const result = await editResponse.json() as SeedreamV4Response;

      const processingTime = Date.now() - startTime;

      // DEBUG: Log the entire response structure for face composition
      console.log('📦 Face Composition FAL Response Structure:', {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : 'no result',
        hasImages: !!(result?.images),
        imagesLength: result?.images?.length,
        hasImage: !!(result?.image),
        hasUrl: !!(result?.url),
        hasOutput: !!(result?.output),
        fullResult: result
      });

      // Check different possible response formats
      let compositeImageUrl: string | undefined;

      if (result?.images?.[0]?.url) {
        console.log('✅ Found composite image at result.images[0].url');
        compositeImageUrl = result.images[0].url;
      } else if (result?.image?.url) {
        console.log('✅ Found composite image at result.image.url');
        compositeImageUrl = result.image.url;
      } else if (result?.url) {
        console.log('✅ Found composite image at result.url');
        compositeImageUrl = result.url;
      } else if (result?.output) {
        console.log('✅ Found composite image at result.output');
        compositeImageUrl = result.output;
      } else {
        // Log what we actually got for debugging
        console.error('❌ Unexpected face composition response format. Full result:', JSON.stringify(result, null, 2));
        throw new Error(`No composite image found in FAL response. Available keys: ${result ? Object.keys(result).join(', ') : 'none'}`);
      }

      if (!compositeImageUrl) {
        throw new Error('No valid composite image URL found in FAL response');
      }

      console.log(`✅ Face composition completed successfully in ${processingTime}ms`);

      return {
        success: true,
        compositeImageUrl,
        processingTime
      };

    } catch (error) {
      console.error('❌ Face composition failed:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorBody: (error as any)?.body || (error as any)?.detail,
        requestData: JSON.stringify(request, null, 2)
      });

      // Provide specific error message for different error types
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('422')) {
          errorMessage = `Validation Error (422): ${error.message}. Check the console for detailed request parameters.`;
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Authentication Error: Please check your FAL API key configuration.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate Limit Error: Too many requests. Please try again later.';
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          errorMessage = 'Server Error: FAL API is experiencing issues. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        processingTime: Date.now() - startTime,
        error: errorMessage
      };
    }
  }

  /**
   * Generate detailed body description prompt from measurements and face analysis
   * NOW USES PERFECT AVATAR CONFIG FOR HIGH-QUALITY FACIAL PRESERVATION
   */
  private async generateBodyPrompt(measurements: Measurements, faceAnalysis?: FaceAnalysis): Promise<string> {
    const height = typeof measurements.height === 'string' ?
      parseFloat(measurements.height) : measurements.height;

    // GET BEST PROMPT (user's 5-star saved prompt or CURRENT_PERFECT_PROMPT fallback)
    const bestPrompt = await getBestPromptForGeneration();
    console.log(`🌟 [BEST-AVATAR] Using prompt from: ${bestPrompt.source}`);
    console.log(`📝 [BEST-AVATAR] Prompt name: "${bestPrompt.name}"`);

    // BUILD USER-SPECIFIC DETAILS
    let customContent = '';

    // Use face analysis for gender and age if available
    if (faceAnalysis?.characteristics.gender && faceAnalysis.characteristics.gender !== 'neutral') {
      customContent += `${faceAnalysis.characteristics.gender} `;
    } else if (measurements.gender) {
      customContent += `${measurements.gender} `;
    }

    // Use face analysis for age
    if (faceAnalysis?.characteristics.estimatedAge) {
      switch (faceAnalysis.characteristics.estimatedAge) {
        case 'young':
          customContent += 'young adult ';
          break;
        case 'mature':
          customContent += 'mature adult ';
          break;
        default:
          customContent += 'adult ';
      }
    } else if (measurements.age) {
      if (measurements.age < 25) customContent += 'young adult ';
      else if (measurements.age > 45) customContent += 'mature adult ';
      else customContent += 'adult ';
    }

    // Add skin tone from face analysis
    if (faceAnalysis?.characteristics.skinTone) {
      customContent += `${faceAnalysis.characteristics.skinTone} skin tone, `;
    }

    // Height description
    if (height) {
      if (height < 160) customContent += 'petite height, ';
      else if (height > 185) customContent += 'tall height, ';
      else customContent += 'average height, ';
    }

    // Body proportions from measurements
    const chestWaistRatio = measurements.chest / measurements.waist;
    const waistHipRatio = measurements.waist / measurements.hips;

    // Build type
    if (measurements.build) {
      customContent += `${measurements.build} build, `;
    } else {
      // Infer build from ratios
      if (chestWaistRatio > 1.3) customContent += 'athletic build with broad shoulders, ';
      else if (waistHipRatio > 0.85) customContent += 'slender build, ';
      else customContent += 'balanced proportions, ';
    }

    // Detailed measurements
    const measurementDetails = `Body measurements: chest ${measurements.chest}cm, waist ${measurements.waist}cm, hips ${measurements.hips}cm, height ${height}cm`;

    if (measurements.shoulders) {
      customContent += `, shoulder width ${measurements.shoulders}cm`;
    }

    if (measurements.inseam) {
      customContent += `, inseam ${measurements.inseam}cm for proportional legs`;
    }

    customContent += '. '; // End custom content with period

    // BUILD COMPLETE PROMPT USING BEST SAVED PROMPT TEMPLATE
    // If using user's saved prompt, use their exact prompt
    // If using CURRENT_PERFECT_PROMPT fallback, build using PerfectAvatarConfig
    let finalPrompt: string;

    if (bestPrompt.source === 'user-saved') {
      // Use user's saved prompt template and inject their measurements
      finalPrompt = bestPrompt.prompt
        .replace('${userMeasurements.chest}', measurements.chest.toString())
        .replace('${userMeasurements.waist}', measurements.waist.toString())
        .replace('${userMeasurements.hips}', measurements.hips.toString())
        .replace('${userMeasurements.height}', height?.toString() || '170');

      // Add user-specific details at the beginning
      finalPrompt = customContent + finalPrompt;

      console.log('✨ [BEST-AVATAR] Using user\'s saved prompt with measurements');
    } else {
      // Fallback to CURRENT_PERFECT_PROMPT using PerfectAvatarConfig
      finalPrompt = PerfectAvatarConfig.buildPrompt(customContent, {
        BODY_MEASUREMENTS: measurementDetails
      });

      console.log('✨ [BEST-AVATAR] Using CURRENT_PERFECT_PROMPT fallback');
      console.log('✨ [BEST-AVATAR] BASE includes: white tank top, blue athletic shorts, FASHN-compatible pose, clean white background, 9:16 aspect ratio');
    }

    console.log('✨ [BEST-AVATAR] User-specific details: age, gender, skin tone, build type');
    console.log('✨ [BEST-AVATAR] Body measurements:', measurementDetails);
    return finalPrompt;
  }

  /**
   * Calculate quality score for animated avatar
   */
  private calculateAnimatedQualityScore(
    staticScore: number,
    animationScore: number
  ): number {
    // Weighted average: static avatar (60%) + animation (40%)
    const combinedScore = (staticScore * 0.6) + (animationScore * 0.4);

    // Bonus for successful animation
    const animationBonus = 10;

    return Math.min(100, Math.max(0, combinedScore + animationBonus));
  }

  /**
   * Calculate quality score for generated avatar
   */
  private calculateQualityScore(
    measurements: Measurements,
    processingTime: number,
    success: boolean
  ): number {
    let score = 70; // Base score

    // Success bonus
    if (success) score += 20;

    // Measurements completeness
    const measurementFields = ['height', 'chest', 'waist', 'hips', 'shoulders', 'inseam'];
    const completeness = measurementFields.filter(field =>
      measurements[field as keyof Measurements] !== undefined
    ).length / measurementFields.length;
    score += Math.round(completeness * 10);

    // Processing time bonus (faster is better, but not too fast)
    if (processingTime > 10000 && processingTime < 60000) {
      score += 5; // Good processing time
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Validate measurements for avatar generation
   */
  validateMeasurements(measurements: Measurements): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const requiredFields: (keyof Measurements)[] = ['height', 'chest', 'waist', 'hips', 'shoulders'];

    requiredFields.forEach(field => {
      if (!measurements[field]) {
        errors.push(`${field} is required`);
      }
    });

    // Validate numeric values
    const numericFields: (keyof Measurements)[] = ['chest', 'waist', 'hips', 'shoulders', 'inseam'];
    numericFields.forEach(field => {
      const value = measurements[field];
      if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
        errors.push(`${field} must be a positive number`);
      }
    });

    // Height validation
    const height = typeof measurements.height === 'string' ?
      parseFloat(measurements.height) : measurements.height;
    if (height && (height < 120 || height > 220)) {
      errors.push('Height must be between 120cm and 220cm');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate Seedream V4 API request parameters to prevent 422 errors
   */
  private validateSeedreamRequest(request: SeedreamV4TextToImageRequest): void {
    const errors: string[] = [];

    // Validate prompt
    if (!request.prompt || typeof request.prompt !== 'string') {
      errors.push('Prompt is required and must be a string');
    } else if (request.prompt.length > 5000) {
      errors.push('Prompt must be 5000 characters or less');
    } else if (request.prompt.trim().length === 0) {
      errors.push('Prompt cannot be empty');
    }

    // Validate num_images
    if (request.num_images !== undefined) {
      if (!Number.isInteger(request.num_images) || request.num_images < 1 || request.num_images > 6) {
        errors.push('num_images must be an integer between 1 and 6');
      }
    }

    // Validate max_images
    if (request.max_images !== undefined) {
      if (!Number.isInteger(request.max_images) || request.max_images < 1 || request.max_images > 6) {
        errors.push('max_images must be an integer between 1 and 6');
      }
    }

    // Validate image_size
    if (request.image_size !== undefined) {
      if (typeof request.image_size === 'string') {
        const validSizes = ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'];
        if (!validSizes.includes(request.image_size)) {
          errors.push(`image_size must be one of: ${validSizes.join(', ')}`);
        }
      } else if (typeof request.image_size === 'object' && request.image_size !== null) {
        const { width, height } = request.image_size;
        if (!Number.isInteger(width) || !Number.isInteger(height)) {
          errors.push('Custom image_size width and height must be integers');
        } else if (width < 1024 || width > 4096 || height < 1024 || height > 4096) {
          errors.push('Custom image_size width and height must be between 1024 and 4096 pixels');
        } else if (width % 8 !== 0 || height % 8 !== 0) {
          errors.push('Custom image_size width and height must be divisible by 8');
        }
      }
    }

    // Validate seed
    if (request.seed !== undefined && !Number.isInteger(request.seed)) {
      errors.push('seed must be an integer');
    }

    if (errors.length > 0) {
      throw new Error(`Seedream V4 request validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Validate Seedream V4 Edit Request parameters to prevent 422 errors
   */
  private validateSeedreamEditRequest(request: SeedreamV4EditRequest): void {
    const errors: string[] = [];

    // Validate image_urls (can be empty for text-to-image generation)
    if (request.image_urls !== undefined) {
      if (!Array.isArray(request.image_urls)) {
        errors.push('image_urls must be an array');
      } else if (request.image_urls.length > 2) {
        errors.push('image_urls can contain at most 2 images');
      }
    }

    // Validate prompt
    if (!request.prompt || typeof request.prompt !== 'string') {
      errors.push('Prompt is required and must be a string');
    } else if (request.prompt.length > 5000) {
      errors.push('Prompt must be 5000 characters or less');
    } else if (request.prompt.trim().length === 0) {
      errors.push('Prompt cannot be empty');
    }

    // Validate num_images
    if (request.num_images !== undefined) {
      if (!Number.isInteger(request.num_images) || request.num_images < 1 || request.num_images > 6) {
        errors.push('num_images must be an integer between 1 and 6');
      }
    }

    // Validate image_size for edit endpoint (uses underscore format)
    if (request.image_size !== undefined) {
      if (typeof request.image_size === 'string') {
        const validSizes = ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'];
        if (!validSizes.includes(request.image_size)) {
          errors.push(`image_size must be one of: ${validSizes.join(', ')}`);
        }
      } else if (typeof request.image_size === 'object' && request.image_size !== null) {
        const { width, height } = request.image_size;
        if (!Number.isInteger(width) || !Number.isInteger(height)) {
          errors.push('Custom image_size width and height must be integers');
        } else if (width < 1024 || width > 4096 || height < 1024 || height > 4096) {
          errors.push('Custom image_size width and height must be between 1024 and 4096 pixels');
        } else if (width % 8 !== 0 || height % 8 !== 0) {
          errors.push('Custom image_size width and height must be divisible by 8');
        }
      }
    }

    // Validate seed
    if (request.seed !== undefined && !Number.isInteger(request.seed)) {
      errors.push('seed must be an integer');
    }

    if (errors.length > 0) {
      throw new Error(`Seedream V4 Edit request validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Generate multiple animated variations of an avatar
   */
  async generateAnimatedVariations(
    measurements: Measurements,
    facePhotoUrl: string,
    variationCount: number = 3,
    options: Partial<SeedreamV4TextToImageRequest & SeedreamV4EditRequest> = {}
  ): Promise<{ success: boolean; avatars?: CustomAvatar[]; errors?: string[] }> {
    try {
      console.log(`🎬 Generating ${variationCount} animated avatar variations...`);

      // Step 1: Generate static avatar base
      const staticAvatarResult = await this.generateCustomAvatar(measurements, facePhotoUrl, options);

      if (!staticAvatarResult.success || !staticAvatarResult.avatar) {
        throw new Error('Failed to generate static avatar base for variations');
      }

      const staticAvatar = staticAvatarResult.avatar;
      console.log('✅ Static avatar base generated for variations');

      // Step 2: Create multiple animated variations
      const animationResult = await klingVideoService.createAnimationVariations(
        staticAvatar.imageUrl,
        measurements,
        variationCount
      );

      if (!animationResult.success || !animationResult.animations) {
        throw new Error('Failed to create animation variations: ' + (animationResult.errors?.join(', ') || 'Unknown error'));
      }

      // Step 3: Create CustomAvatar objects for each variation
      const animatedAvatars: CustomAvatar[] = animationResult.animations.map((animatedAvatar, index) => ({
        ...staticAvatar,
        animatedVideoUrl: animatedAvatar.videoUrl,
        animatedAvatar: animatedAvatar,
        isAnimated: true,
        metadata: {
          ...staticAvatar.metadata,
          generation_type: 'animated_avatar',
          processingTime: staticAvatar.metadata.processingTime + animatedAvatar.metadata.processingTime,
          steps: {
            ...staticAvatar.metadata.steps,
            videoAnimation: {
              prompt: animatedAvatar.metadata.animationPrompt,
              time: animatedAvatar.metadata.processingTime,
              success: true,
              duration: animatedAvatar.duration
            }
          }
        },
        qualityScore: this.calculateAnimatedQualityScore(
          staticAvatar.qualityScore,
          animatedAvatar.qualityScore
        )
      }));

      console.log(`✅ Generated ${animatedAvatars.length} animated avatar variations`);

      return {
        success: true,
        avatars: animatedAvatars,
        errors: animationResult.errors
      };

    } catch (error) {
      console.error('❌ Animated variations generation failed:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Test minimal FAL API request to diagnose issues
   */
  async testMinimalFAL(): Promise<{ success: boolean; error?: string; response?: any }> {
    console.log('🧪 Testing minimal FAL request...');

    try {
      console.log('🔑 FAL API accessed via /api/fal proxy');

      // Minimal test request with absolute basics
      const testRequest = {
        prompt: "a person standing, full body",
        image_size: { width: 512, height: 768 },
        num_images: 1
      };

      console.log('📤 Sending minimal test request:', JSON.stringify(testRequest, null, 2));

      const testResponse = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRequest)
      });

      if (!testResponse.ok) {
        throw new Error(`Minimal test request failed: ${testResponse.status}`);
      }

      const result = await testResponse.json();

      console.log('✅ Minimal FAL test successful!', result);

      return {
        success: true,
        response: result
      };

    } catch (error) {
      console.error('❌ Minimal FAL test failed - DETAILED ERROR:');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error status:', (error as any)?.status);
      console.error('Error body:', JSON.stringify((error as any)?.body, null, 2));
      console.error('Error detail:', (error as any)?.detail);
      console.error('Full error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Test minimal API request to verify configuration
   */
  async testApiConnection(): Promise<{ success: boolean; error?: string; response?: any }> {
    try {
      console.log('🧪 Testing Seedream V4 API connection via /api/fal proxy...');

      // Minimal test request for text-to-image endpoint
      const testRequest: SeedreamV4TextToImageRequest = {
        prompt: "a simple test image of a person, photorealistic",
        num_images: 1,
        image_size: "square_hd",
        max_images: 1,
        enable_safety_checker: false
      };

      // Validate the test request
      this.validateSeedreamRequest(testRequest);

      console.log('📤 Sending minimal test request:', testRequest);

      const apiTestResponse = await fetch('/api/fal/fal-ai/bytedance/seedream/v4/text-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRequest)
      });

      if (!apiTestResponse.ok) {
        throw new Error(`API test request failed: ${apiTestResponse.status}`);
      }

      const result = await apiTestResponse.json();

      console.log('✅ API test successful:', result);

      return {
        success: true,
        response: result
      };

    } catch (error) {
      console.error('❌ API test failed:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorBody: (error as any)?.body || (error as any)?.detail,
        testRequest: JSON.stringify(testRequest, null, 2)
      });

      // Provide specific error message for different error types
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('422')) {
          errorMessage = `API Validation Error (422): ${error.message}. Check the console for detailed request parameters.`;
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Authentication Error: Please check your FAL API key configuration.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate Limit Error: Too many requests. Please try again later.';
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          errorMessage = 'Server Error: FAL API is experiencing issues. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get service configuration and status
   */
  getServiceInfo() {
    return {
      name: 'ByteDance Seedream v4 Avatar Service',
      version: '1.0.0',
      description: 'Two-step custom avatar generation: body from measurements + face composition',
      endpoints: [
        'fal-ai/bytedance/seedream/v4/text-to-image',
        'fal-ai/bytedance/seedream/v4/edit'
      ],
      capabilities: [
        'Body generation from measurements',
        'Face composition onto generated body',
        'Photorealistic avatar creation',
        'Measurements validation',
        'Quality scoring'
      ],
      requirements: {
        api_key: 'VITE_FAL_KEY environment variable',
        measurements: 'height, chest, waist, hips, shoulders (required)',
        face_photo: 'Base64 data URL or HTTP URL'
      }
    };
  }
}

// Export singleton instance
export const seedreamV4AvatarService = new SeedreamV4AvatarService();
export default seedreamV4AvatarService;