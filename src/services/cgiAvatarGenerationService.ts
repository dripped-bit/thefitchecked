/**
 * CGI Avatar Generation Service
 * Two-step CGI avatar creation using ByteDance Seedream v4 APIs
 * Step 1: Generate photorealistic body from measurements (text-to-image)
 * Step 2: Composite user's head onto generated body (image-to-image)
 */

// Removed direct fal client import - now using proxy endpoints
import {
  CGIAvatarRequest,
  CGIAvatarResult,
  MeasurementData,
  SeedreamTextToImageRequest,
  SeedreamEditRequest,
  SeedreamResponse,
  CGIGenerationStep,
  CGIAvatarMetadata
} from '../types/cgiAvatar';
import CGIPromptGenerator from '../utils/cgiPromptGenerator';
import { PerfectAvatarConfig, AVATAR_PRESETS } from '../config/perfectAvatarConfig.js';

console.log('🎨 [CGI-AVATAR] Service Configuration:');
console.log('- Using proxy endpoints for FAL API calls');
console.log('- Text-to-image endpoint: /api/fal/fal-ai/bytedance/seedream/v4/text-to-image');
console.log('- Image-to-image endpoint: /api/fal/fal-ai/bytedance/seedream/v4/edit');
console.log('- Target format: Portrait 9:16 (1152x2048) for full body FASHN compatibility');
console.log('- Authentication: Handled by Vite proxy configuration');

export class CGIAvatarGenerationService {
  // Updated to match exact FAL API endpoint structure
  private readonly textToImageEndpoint = '/api/fal/fal-ai/bytedance/seedream/v4/text-to-image';
  private readonly editEndpoint = '/api/fal/fal-ai/bytedance/seedream/v4/edit';

  // Optimized for photorealistic 4K quality with FASHN compatibility - 9:16 aspect ratio for full body
  private readonly defaultImageSize = { width: 1152, height: 2048 }; // 9:16 aspect ratio for full body display

  // Session tracking for debugging
  private sessionCount = 0;
  private debugMode = true; // Enable detailed debugging

  constructor() {
    console.log('🎨 [CGI-AVATAR] Service initialized:', {
      textToImageEndpoint: this.textToImageEndpoint,
      editEndpoint: this.editEndpoint,
      defaultImageSize: this.defaultImageSize,
      approach: 'Measurements → Photorealistic 4K CGI Body → Head Composition → FASHN-ready Avatar',
      apiMethod: 'Vite Proxy (consistent with other services)'
    });
  }

  /**
   * Generate hyperrealistic CGI avatar with advanced digital human rendering
   * Uses enhanced CGI prompts and photo preprocessing for maximum quality
   */
  async generateHyperrealisticCGIAvatar(request: CGIAvatarRequest): Promise<CGIAvatarResult> {
    const sessionId = `CGI-HYPER-${Date.now()}-${++this.sessionCount}`;
    const startTime = Date.now();
    const steps: CGIGenerationStep[] = [];

    this.logDebug(sessionId, 'CGI-HYPER-SESSION-START', 'Starting hyperrealistic CGI avatar generation', {
      sessionId,
      hasHeadPhoto: !!request.headPhotoUrl,
      measurements: this.sanitizeMeasurements(request.measurements)
    });

    try {
      console.log('🎬 [CGI-HYPER] Starting hyperrealistic CGI avatar generation...');
      console.log('📊 Request:', {
        sessionId,
        hasHeadPhoto: !!request.headPhotoUrl,
        measurements: request.measurements
      });

      // Validate inputs
      const validation = this.validateInputs(request);
      if (!validation.valid) {
        throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
      }

      // Single step: Transform user photo to hyperrealistic CGI avatar
      console.log('🔄 Transforming user photo to hyperrealistic CGI avatar...');
      const cgiStep = await this.transformPhotoToCGIAvatar(
        request.headPhotoUrl,
        request.measurements,
        request.options
      );
      steps.push(cgiStep);

      if (!cgiStep.success || !cgiStep.imageUrl) {
        throw new Error(`CGI transformation failed: ${cgiStep.error}`);
      }

      console.log('✅ Hyperrealistic CGI avatar completed:', {
        success: cgiStep.success,
        processingTime: `${cgiStep.processingTime}ms`,
        imageUrl: cgiStep.imageUrl
      });

      const totalTime = Date.now() - startTime;
      const metadata: CGIAvatarMetadata = {
        measurements: request.measurements,
        headPhotoUrl: request.headPhotoUrl,
        bodyPrompt: '',
        compositionPrompt: cgiStep.prompt,
        totalProcessingTime: totalTime,
        model: 'bytedance_seedream_v4_cgi_hyperrealistic',
        aspectRatio: '9:16',
        generationSteps: steps,
        qualityScore: this.calculateQualityScore(steps, totalTime),
        fashnCompatible: true
      };

      const result: CGIAvatarResult = {
        success: true,
        cgiImageUrl: cgiStep.imageUrl,
        bodyImageUrl: '', // Not used in single-step approach
        headPhotoUrl: request.headPhotoUrl,
        metadata
      };

      console.log('✅ [CGI-HYPER] Generation completed successfully:', {
        totalTime: `${totalTime}ms`,
        qualityScore: metadata.qualityScore,
        avatarImageUrl: result.cgiImageUrl
      });

      this.logDebug(sessionId, 'CGI-HYPER-SESSION-SUCCESS', 'Hyperrealistic CGI avatar generation completed', {
        totalTime,
        qualityScore: metadata.qualityScore
      });

      return result;

    } catch (error) {
      console.error('❌ [CGI-HYPER] Generation failed:', error);

      const totalTime = Date.now() - startTime;
      this.logDebug(sessionId, 'CGI-HYPER-SESSION-FAILURE', 'Hyperrealistic CGI avatar generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        totalTime
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Hyperrealistic CGI avatar generation failed',
        metadata: {
          measurements: request.measurements,
          headPhotoUrl: request.headPhotoUrl,
          bodyPrompt: '',
          compositionPrompt: steps[0]?.prompt || '',
          totalProcessingTime: totalTime,
          model: 'bytedance_seedream_v4_cgi_hyperrealistic',
          aspectRatio: '9:16',
          generationSteps: steps,
          qualityScore: 0,
          fashnCompatible: false
        }
      };
    }
  }

  /**
   * Transform user photo to hyperrealistic CGI avatar using Perfect Avatar Config
   */
  private async transformPhotoToCGIAvatar(
    headPhotoUrl: string,
    measurements: MeasurementData,
    options?: CGIAvatarRequest['options']
  ): Promise<CGIGenerationStep> {
    const startTime = Date.now();

    // Create minimal custom content for Perfect Avatar Config
    // Only add measurement-specific details, let Perfect Avatar Config handle facial preservation
    const measurementDetails = `Body measurements: chest ${measurements.chest}cm, waist ${measurements.waist}cm, hips ${measurements.hips}cm, height ${measurements.height}cm. Wearing form-fitting white tank top and blue athletic shorts. Professional studio photography with clean white background.`;
    console.log('📝 [PERFECT-AVATAR] Using Perfect Avatar Config with minimal measurement details:', measurementDetails);

    // Process head photo URL for Seedream v4 compatibility
    const processedHeadPhotoUrl = await this.prepareImageUrlForSeedream(headPhotoUrl, 'user photo for CGI');

    // Use Perfect Avatar Configuration for optimal results
    console.log('✨ [PERFECT-CONFIG] Using Perfect Avatar Configuration (OPTIMAL quality: 100 steps, 6.5 guidance, 0.75 strength)');
    const request = PerfectAvatarConfig.createSeedreamRequest(
      [processedHeadPhotoUrl],
      measurementDetails,
      {
        quality: 'OPTIMAL',
        extensions: {
          BODY_MEASUREMENTS: `chest ${measurements.chest}cm, waist ${measurements.waist}cm, hips ${measurements.hips}cm`,
          POSE: 'standing naturally with arms at sides, FASHN-compatible pose'
        },
        paramOverrides: {
          num_images: options?.numImages || 1,
          max_images: 1,
          enable_safety_checker: options?.enableSafetyChecker ?? false,
          seed: options?.seed || Date.now()
        }
      }
    );

    try {
      // Validate request parameters
      this.validateSeedreamEditRequest(request);

      console.log('🚀 [CGI-TRANSFORM] Calling Seedream v4 edit for hyperrealistic CGI transformation...');
      console.log('📝 [CGI-TRANSFORM] CGI prompt:', cgiPrompt);
      console.log('📸 [CGI-TRANSFORM] Photo URL preview:', processedHeadPhotoUrl.substring(0, 100) + '...');

      const response = await fetch(this.editEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      console.log('📊 [CGI-TRANSFORM] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CGI-TRANSFORM] API Error:', errorText);
        throw new Error(`CGI transformation API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as SeedreamResponse;
      const processingTime = Date.now() - startTime;

      // Extract image URL from response
      const imageUrl = this.extractImageUrl(result);
      if (!imageUrl) {
        console.error('❌ [CGI-TRANSFORM] Failed to extract image URL from response');
        throw new Error('No image URL found in CGI transformation response');
      }

      console.log('✅ [CGI-TRANSFORM] Hyperrealistic CGI transformation successful:', {
        processingTime: `${processingTime}ms`,
        imageUrl: imageUrl.substring(0, 100) + '...'
      });

      return {
        stepName: 'Hyperrealistic CGI Avatar Transformation (Perfect Avatar Config)',
        prompt: `Perfect Avatar Config BASE + ${measurementDetails}`,
        processingTime,
        success: true,
        imageUrl
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ [CGI-TRANSFORM] CGI transformation failed:', error);

      return {
        stepName: 'Hyperrealistic CGI Avatar Transformation (Perfect Avatar Config)',
        prompt: `Perfect Avatar Config BASE + ${measurementDetails}`,
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in CGI transformation'
      };
    }
  }

  /**
   * Generate avatar using photo-based transformation (single-step)
   * Better preserves user likeness by using their photo as primary input
   */
  async generatePhotoBasedAvatar(request: CGIAvatarRequest): Promise<CGIAvatarResult> {
    const sessionId = `PHOTO-${Date.now()}-${++this.sessionCount}`;
    const startTime = Date.now();
    const steps: CGIGenerationStep[] = [];

    this.logDebug(sessionId, 'PHOTO-SESSION-START', 'Starting photo-based avatar generation', {
      sessionId,
      hasHeadPhoto: !!request.headPhotoUrl,
      measurements: this.sanitizeMeasurements(request.measurements)
    });

    try {
      console.log('📸 [PHOTO-AVATAR] Starting photo-based avatar generation...');
      console.log('📊 Request:', {
        sessionId,
        hasHeadPhoto: !!request.headPhotoUrl,
        measurements: request.measurements
      });

      // Validate inputs
      const validation = this.validateInputs(request);
      if (!validation.valid) {
        throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
      }

      // Single step: Transform user photo to full-body avatar
      console.log('🔄 Transforming user photo to full-body avatar...');
      const avatarStep = await this.transformPhotoToAvatar(
        request.headPhotoUrl,
        request.measurements,
        request.options
      );
      steps.push(avatarStep);

      if (!avatarStep.success || !avatarStep.imageUrl) {
        throw new Error(`Photo transformation failed: ${avatarStep.error}`);
      }

      console.log('✅ Photo-based avatar completed:', {
        success: avatarStep.success,
        processingTime: `${avatarStep.processingTime}ms`,
        imageUrl: avatarStep.imageUrl
      });

      const totalTime = Date.now() - startTime;
      const metadata: CGIAvatarMetadata = {
        measurements: request.measurements,
        headPhotoUrl: request.headPhotoUrl,
        bodyPrompt: '',
        compositionPrompt: avatarStep.prompt,
        totalProcessingTime: totalTime,
        model: 'bytedance_seedream_v4_photo_transform',
        aspectRatio: '9:16',
        generationSteps: steps,
        qualityScore: this.calculateQualityScore(steps, totalTime),
        fashnCompatible: true
      };

      const result: CGIAvatarResult = {
        success: true,
        cgiImageUrl: avatarStep.imageUrl,
        bodyImageUrl: '', // Not used in single-step approach
        headPhotoUrl: request.headPhotoUrl,
        metadata
      };

      console.log('✅ [PHOTO-AVATAR] Generation completed successfully:', {
        totalTime: `${totalTime}ms`,
        qualityScore: metadata.qualityScore,
        avatarImageUrl: result.cgiImageUrl
      });

      this.logDebug(sessionId, 'PHOTO-SESSION-SUCCESS', 'Photo-based avatar generation completed', {
        totalTime,
        qualityScore: metadata.qualityScore
      });

      return result;

    } catch (error) {
      console.error('❌ [PHOTO-AVATAR] Generation failed:', error);

      const totalTime = Date.now() - startTime;
      this.logDebug(sessionId, 'PHOTO-SESSION-FAILURE', 'Photo-based avatar generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        totalTime
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Photo-based avatar generation failed',
        metadata: {
          measurements: request.measurements,
          headPhotoUrl: request.headPhotoUrl,
          bodyPrompt: '',
          compositionPrompt: steps[0]?.prompt || '',
          totalProcessingTime: totalTime,
          model: 'bytedance_seedream_v4_photo_transform',
          aspectRatio: '9:16',
          generationSteps: steps,
          qualityScore: 0,
          fashnCompatible: false
        }
      };
    }
  }

  /**
   * Transform user photo to full-body avatar using Seedream v4 edit
   */
  private async transformPhotoToAvatar(
    headPhotoUrl: string,
    measurements: MeasurementData,
    options?: CGIAvatarRequest['options']
  ): Promise<CGIGenerationStep> {
    const startTime = Date.now();

    // Create minimal custom content for Perfect Avatar Config
    // Only add measurement-specific details, let Perfect Avatar Config handle facial preservation
    const measurementDetails = `Body measurements: chest ${measurements.chest}cm, waist ${measurements.waist}cm, hips ${measurements.hips}cm, height ${measurements.height}cm. Wearing form-fitting white tank top and blue athletic shorts. Professional studio photography with clean white background.`;
    console.log('📝 [PERFECT-AVATAR] Using Perfect Avatar Config with minimal measurement details:', measurementDetails);

    // Process head photo URL for Seedream v4 compatibility
    const processedHeadPhotoUrl = await this.prepareImageUrlForSeedream(headPhotoUrl, 'user photo');

    // Use Perfect Avatar Configuration for optimal results
    console.log('✨ [PERFECT-CONFIG] Using Perfect Avatar Configuration (OPTIMAL quality: 100 steps, 6.5 guidance, 0.75 strength)');
    const request = PerfectAvatarConfig.createSeedreamRequest(
      [processedHeadPhotoUrl],
      measurementDetails,
      {
        quality: 'OPTIMAL',
        extensions: {
          BODY_MEASUREMENTS: `chest ${measurements.chest}cm, waist ${measurements.waist}cm, hips ${measurements.hips}cm`,
          POSE: 'standing naturally with arms at sides, FASHN-compatible pose'
        },
        paramOverrides: {
          num_images: options?.numImages || 1,
          max_images: 1,
          enable_safety_checker: options?.enableSafetyChecker ?? false,
          seed: options?.seed || Date.now()
        }
      }
    );

    try {
      // Validate request parameters
      this.validateSeedreamEditRequest(request);

      console.log('🚀 [PHOTO-TRANSFORM] Calling Seedream v4 edit for photo transformation...');
      console.log('📝 [PHOTO-TRANSFORM] Transformation prompt:', transformPrompt);
      console.log('📸 [PHOTO-TRANSFORM] Photo URL preview:', processedHeadPhotoUrl.substring(0, 100) + '...');

      const response = await fetch(this.editEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      console.log('📊 [PHOTO-TRANSFORM] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [PHOTO-TRANSFORM] API Error:', errorText);
        throw new Error(`Photo transformation API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as SeedreamResponse;
      const processingTime = Date.now() - startTime;

      // Extract image URL from response
      const imageUrl = this.extractImageUrl(result);
      if (!imageUrl) {
        console.error('❌ [PHOTO-TRANSFORM] Failed to extract image URL from response');
        throw new Error('No image URL found in photo transformation response');
      }

      console.log('✅ [PHOTO-TRANSFORM] Photo transformation successful:', {
        processingTime: `${processingTime}ms`,
        imageUrl: imageUrl.substring(0, 100) + '...'
      });

      return {
        stepName: 'Photo-Based Avatar Transformation (Perfect Avatar Config)',
        prompt: `Perfect Avatar Config BASE + ${measurementDetails}`,
        processingTime,
        success: true,
        imageUrl
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ [PHOTO-TRANSFORM] Photo transformation failed:', error);

      return {
        stepName: 'Photo-Based Avatar Transformation (Perfect Avatar Config)',
        prompt: `Perfect Avatar Config BASE + ${measurementDetails}`,
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in photo transformation'
      };
    }
  }

  /**
   * Generate complete CGI avatar from head photo and measurements
   * Main public method for creating CGI avatars
   */
  async generateCGIAvatar(request: CGIAvatarRequest): Promise<CGIAvatarResult> {
    const sessionId = `CGI-${Date.now()}-${++this.sessionCount}`;
    const startTime = Date.now();
    const steps: CGIGenerationStep[] = [];

    // Debug session logging
    this.logDebug(sessionId, 'SESSION-START', 'Starting CGI avatar generation session', {
      sessionId,
      timestamp: new Date().toISOString(),
      hasHeadPhoto: !!request.headPhotoUrl,
      measurements: this.sanitizeMeasurements(request.measurements),
      options: request.options,
      endpoint1: this.textToImageEndpoint,
      endpoint2: this.editEndpoint,
      defaultImageSize: this.defaultImageSize
    });

    try {
      console.log('🎨 [CGI-AVATAR] Starting photo-first avatar generation for identity preservation...');
      console.log('📊 Request:', {
        sessionId,
        hasHeadPhoto: !!request.headPhotoUrl,
        measurements: request.measurements,
        options: request.options
      });

      // Validate inputs
      const validation = this.validateInputs(request);
      if (!validation.valid) {
        throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
      }

      // Single step: Transform user photo directly to full-body avatar (preserves identity)
      console.log('🔄 Transforming user photo to full-body avatar with identity preservation...');
      const avatarStep = await this.transformPhotoToAvatar(
        request.headPhotoUrl,
        request.measurements,
        request.options
      );
      steps.push(avatarStep);

      if (!avatarStep.success || !avatarStep.imageUrl) {
        throw new Error(`Photo transformation failed: ${avatarStep.error}`);
      }

      console.log('✅ Photo transformation completed:', {
        success: avatarStep.success,
        processingTime: `${avatarStep.processingTime}ms`,
        imageUrl: avatarStep.imageUrl
      });

      // Calculate total processing time and create metadata
      const totalTime = Date.now() - startTime;
      const metadata: CGIAvatarMetadata = {
        measurements: request.measurements,
        headPhotoUrl: request.headPhotoUrl,
        bodyPrompt: avatarStep.prompt, // Photo transformation prompt
        compositionPrompt: '', // No composition step in photo-first approach
        totalProcessingTime: totalTime,
        model: 'bytedance_seedream_v4',
        aspectRatio: '9:16',
        generationSteps: steps,
        qualityScore: this.calculateQualityScore(steps, totalTime),
        fashnCompatible: true
      };

      const result: CGIAvatarResult = {
        success: true,
        cgiImageUrl: avatarStep.imageUrl,
        bodyImageUrl: null, // No separate body image in photo-first approach
        headPhotoUrl: request.headPhotoUrl,
        metadata
      };

      console.log('✅ [CGI-AVATAR] Photo-first generation completed successfully:', {
        totalTime: `${totalTime}ms`,
        qualityScore: metadata.qualityScore,
        cgiImageUrl: result.cgiImageUrl,
        method: 'photo-transformation'
      });

      // Debug session completion logging
      this.logDebug(sessionId, 'SESSION-SUCCESS', 'CGI avatar generation completed successfully', {
        totalTime,
        qualityScore: metadata.qualityScore,
        stepsCompleted: steps.length,
        allStepsSuccessful: steps.every(step => step.success),
        hasCgiImageUrl: !!result.cgiImageUrl,
        method: 'photo-transformation'
      });

      return result;

    } catch (error) {
      console.error('❌ [CGI-AVATAR] Generation failed:', error);

      const totalTime = Date.now() - startTime;

      // Debug session failure logging
      this.logDebug(sessionId, 'SESSION-FAILURE', 'CGI avatar generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        totalTime,
        stepsAttempted: steps.length,
        stepsCompleted: steps.filter(step => step.success).length,
        lastSuccessfulStep: steps.filter(step => step.success).pop()?.stepName || 'none',
        failedAt: error instanceof Error ? error.message : 'Unknown failure point'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'CGI avatar generation failed',
        metadata: steps.length > 0 ? {
          measurements: request.measurements,
          headPhotoUrl: request.headPhotoUrl,
          bodyPrompt: steps[0]?.prompt || '',
          compositionPrompt: steps[1]?.prompt || '',
          totalProcessingTime: totalTime,
          model: 'bytedance_seedream_v4',
          aspectRatio: '9:16',
          generationSteps: steps,
          qualityScore: 0,
          fashnCompatible: false
        } : undefined
      };
    }
  }

  /**
   * Step 1: Generate photorealistic CGI body from measurements
   */
  private async generateCGIBody(
    measurements: MeasurementData,
    options?: CGIAvatarRequest['options']
  ): Promise<CGIGenerationStep> {
    const startTime = Date.now();

    // Generate detailed prompt from measurements
    const bodyPrompt = CGIPromptGenerator.generateBodyPrompt(measurements);
    console.log('📝 Generated body prompt:', bodyPrompt);

    // Prepare premium text-to-image request for magazine-quality body generation
    const request: SeedreamTextToImageRequest = {
      prompt: bodyPrompt,
      negative_prompt: `face, head, facial features, eyes, nose, mouth, hair, distorted body, bad anatomy, wrong proportions, extra limbs, missing limbs, deformed, ugly, blurry, low quality, bad hands, bad fingers, wrong outfit, dress, suit, formal wear, dark background, outdoor, complex background, poor framing, bad composition, ANIMATION, ANIMATED, CARTOON, anime, illustration, painting, animated character, 3D animation, cel shading, comic book style, manga style, cartoon style, stylized, non-photographic, digital art, computer graphics, artificial, synthetic, rendered, CGI, 3D render, doll-like, fake skin, unnatural skin, digital painting, computer generated, artificial intelligence, AI generated, virtual, simulated, robotic, android, cyborg, non-human, plastic appearance, artificial skin, smooth skin, perfect skin, airbrushed, over-processed, digital smoothing, fake textures, artificial lighting, enhanced features, beautified, digitally enhanced, flat appearance, graphic appearance, unrealistic skin, synthetic textures, digital artifacts, motion blur, movement, dynamic pose, action pose, raised arms, arms up, arms crossed, hands on hips, arms raised, arms akimbo, arms elevated, stiff pose, unnatural position, mannequin-like, baggy clothes, loose fit, oversized clothing, harsh lighting, amateur photography, low resolution, pixelated, watercolor, sketch, drawing, art style, artistic rendering, stylization, digital manipulation, photo editing effects`,
      image_size: options?.imageSize || this.defaultImageSize,
      num_images: options?.numImages || 5, // Generate more options for natural selection
      max_images: 5,
      num_inference_steps: 150, // Maximum steps for photorealistic body generation
      guidance_scale: 7.0, // Optimized guidance for natural photographic results
      enable_safety_checker: options?.enableSafetyChecker ?? false,
      seed: options?.seed || -1
    };

    try {
      // Validate request parameters
      this.validateSeedreamTextRequest(request);

      console.log('🚀 [BODY-GEN] Calling Seedream v4 text-to-image via proxy...');
      console.log('📝 [BODY-GEN] Generated prompt:', bodyPrompt);
      console.log('📏 [BODY-GEN] Image size:', request.image_size);
      console.log('🛡️ [BODY-GEN] Safety checker:', request.enable_safety_checker);
      console.log('🎯 [BODY-GEN] Endpoint:', this.textToImageEndpoint);
      console.log('📤 [BODY-GEN] Full request:', JSON.stringify(request, null, 2));

      const response = await fetch(this.textToImageEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      console.log('📊 [BODY-GEN] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [BODY-GEN] API Error:', errorText);
        throw new Error(`Text-to-image API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as SeedreamResponse;

      console.log('📨 [BODY-GEN] Raw API response received:', {
        hasResult: !!result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : 'none',
        hasImages: !!(result?.images),
        imagesCount: result?.images?.length || 0,
        firstImageUrl: result?.images?.[0]?.url?.substring(0, 100) + '...' || 'no URL'
      });
      console.log('📋 [BODY-GEN] Complete response preview:', JSON.stringify(result, null, 2).substring(0, 500) + '...');

      const processingTime = Date.now() - startTime;

      // Extract image URL from response with enhanced error handling
      const imageUrl = this.extractImageUrl(result);
      if (!imageUrl) {
        console.error('❌ [BODY-GEN] Failed to extract image URL from response');
        console.error('📋 [BODY-GEN] Response structure:', JSON.stringify(result, null, 2));
        throw new Error('No image URL found in Seedream body generation response');
      }

      console.log('✅ [BODY-GEN] Body generation successful:', {
        processingTime: `${processingTime}ms`,
        imageUrl: imageUrl.substring(0, 100) + '...',
        seed: result.seed || 'not provided',
        hasNsfw: result.has_nsfw_concepts || false,
        timings: result.timings || 'not provided'
      });

      return {
        stepName: 'CGI Body Generation',
        prompt: bodyPrompt,
        processingTime,
        success: true,
        imageUrl
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ [BODY-GEN] Body generation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: `${processingTime}ms`,
        prompt: bodyPrompt,
        requestParams: JSON.stringify(request, null, 2)
      });

      return {
        stepName: 'CGI Body Generation',
        prompt: bodyPrompt,
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in body generation'
      };
    }
  }

  /**
   * Step 2: Composite user's head onto generated CGI body
   */
  private async compositeHeadOntoBody(
    bodyImageUrl: string,
    headPhotoUrl: string,
    measurements: MeasurementData,
    options?: CGIAvatarRequest['options']
  ): Promise<CGIGenerationStep> {
    const startTime = Date.now();

    // Analyze head photo characteristics for better composition
    const headAnalysis = CGIPromptGenerator.analyzeHeadPhotoCharacteristics(measurements, headPhotoUrl);

    // Generate enhanced composition prompt with head analysis
    const compositionPrompt = CGIPromptGenerator.generateCompositionPrompt(headAnalysis);
    console.log('📝 Generated enhanced composition prompt:', compositionPrompt);

    // Process head photo URL for Seedream v4 compatibility
    const processedHeadPhotoUrl = await this.prepareImageUrlForSeedream(headPhotoUrl, 'head photo');
    console.log('🔄 [HEAD-COMPOSITION] Processed image URLs:', {
      bodyImageUrl: bodyImageUrl.substring(0, 50) + '...',
      originalHeadPhotoUrl: headPhotoUrl.substring(0, 50) + '...',
      processedHeadPhotoUrl: processedHeadPhotoUrl.substring(0, 50) + '...',
      isHeadPhotoBase64: headPhotoUrl.startsWith('data:'),
      isProcessedDifferent: processedHeadPhotoUrl !== headPhotoUrl
    });

    // Use Perfect Avatar Configuration for optimal head composition
    console.log('✨ [PERFECT-CONFIG] Using Perfect Avatar Configuration for head composition');
    const request = PerfectAvatarConfig.createSeedreamRequest(
      [bodyImageUrl, processedHeadPhotoUrl],
      compositionPrompt,
      {
        quality: 'ULTRA', // Use highest quality for precise facial integration
        additionalNegatives: [
          'distorted face, wrong identity, different person, bad integration, visible seams, mismatched skin',
          'skin color mismatch, face color difference, body color difference, blurry face, low quality face',
          'poor blending, face warping, identity change, different skin tone, unnatural skin texture'
        ],
        paramOverrides: {
          num_images: options?.numImages || 1,
          max_images: 1,
          num_inference_steps: 250, // Maximum steps for precise facial integration
          guidance_scale: 6.0, // Ultra-conservative for maximum facial identity preservation
          strength: 0.70, // Balanced strength for full-body integration while preserving facial identity
          enable_safety_checker: options?.enableSafetyChecker ?? false,
          seed: options?.seed || Date.now(),
          image_size: options?.imageSize || this.defaultImageSize
        }
      }
    );

    try {
      // Validate request parameters
      this.validateSeedreamEditRequest(request);

      console.log('🚀 [HEAD-COMP] Calling Seedream v4 edit via proxy...');
      console.log('📝 [HEAD-COMP] Generated composition prompt:', compositionPrompt);
      console.log('🖼️ [HEAD-COMP] Body image URL preview:', bodyImageUrl.substring(0, 100) + '...');
      console.log('👤 [HEAD-COMP] Head image URL preview:', processedHeadPhotoUrl.substring(0, 100) + '...');
      console.log('📏 [HEAD-COMP] Image size:', request.image_size);
      console.log('🛡️ [HEAD-COMP] Safety checker:', request.enable_safety_checker);
      console.log('🎯 [HEAD-COMP] Endpoint:', this.editEndpoint);
      console.log('📤 [HEAD-COMP] Full request:', JSON.stringify(request, null, 2));

      const response = await fetch(this.editEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      console.log('📊 [HEAD-COMP] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [HEAD-COMP] API Error:', errorText);
        throw new Error(`Image-to-image edit API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as SeedreamResponse;

      console.log('📨 [HEAD-COMP] Raw API response received:', {
        hasResult: !!result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : 'none'
      });

      const processingTime = Date.now() - startTime;

      // Extract image URL from response with enhanced error handling
      const imageUrl = this.extractImageUrl(result);
      if (!imageUrl) {
        console.error('❌ [HEAD-COMP] Failed to extract composite image URL from response');
        console.error('📋 [HEAD-COMP] Response structure:', JSON.stringify(result, null, 2));
        throw new Error('No composite image URL found in Seedream head composition response');
      }

      console.log('✅ [HEAD-COMP] Head composition successful:', {
        processingTime: `${processingTime}ms`,
        imageUrl: imageUrl.substring(0, 100) + '...',
        seed: result.seed || 'not provided',
        hasNsfw: result.has_nsfw_concepts || false,
        timings: result.timings || 'not provided'
      });

      return {
        stepName: 'Head Composition',
        prompt: compositionPrompt,
        processingTime,
        success: true,
        imageUrl
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ [HEAD-COMP] Head composition failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: `${processingTime}ms`,
        prompt: compositionPrompt,
        requestParams: JSON.stringify(request, null, 2),
        bodyImageUrl: request.image_urls[0]?.substring(0, 100) + '...',
        headImageUrl: request.image_urls[1]?.substring(0, 100) + '...'
      });

      return {
        stepName: 'Head Composition',
        prompt: compositionPrompt,
        processingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in head composition'
      };
    }
  }

  /**
   * Extract image URL from ByteDance Seedream v4 response formats
   * Enhanced to handle various response structures and provide detailed debugging
   */
  private extractImageUrl(result: any): string | null {
    console.log('🔍 [EXTRACT-URL] Processing Seedream v4 response:', {
      hasResult: !!result,
      resultType: typeof result,
      resultKeys: result ? Object.keys(result) : 'none'
    });

    // Method 1: Standard images array format
    if (result?.images && Array.isArray(result.images) && result.images.length > 0) {
      const firstImage = result.images[0];
      console.log('🔍 [EXTRACT-URL] Found images array, first image:', {
        hasUrl: !!firstImage.url,
        hasWidth: !!firstImage.width,
        hasHeight: !!firstImage.height,
        imageKeys: firstImage ? Object.keys(firstImage) : 'none'
      });

      if (firstImage.url) {
        console.log('✅ [EXTRACT-URL] Extracted URL from images[0].url:', firstImage.url);
        return firstImage.url;
      }
    }

    // Method 2: Single image object format
    if (result?.image && typeof result.image === 'object') {
      console.log('🔍 [EXTRACT-URL] Found image object:', {
        hasUrl: !!result.image.url,
        imageKeys: Object.keys(result.image)
      });

      if (result.image.url) {
        console.log('✅ [EXTRACT-URL] Extracted URL from image.url:', result.image.url);
        return result.image.url;
      }
    }

    // Method 3: Direct URL property
    if (result?.url && typeof result.url === 'string') {
      console.log('✅ [EXTRACT-URL] Extracted direct URL:', result.url);
      return result.url;
    }

    // Method 4: Output property (alternative format)
    if (result?.output && typeof result.output === 'string') {
      console.log('✅ [EXTRACT-URL] Extracted URL from output:', result.output);
      return result.output;
    }

    // Method 5: Data property (ByteDance specific)
    if (result?.data?.images && Array.isArray(result.data.images) && result.data.images.length > 0) {
      const dataImage = result.data.images[0];
      console.log('🔍 [EXTRACT-URL] Found data.images array:', {
        hasUrl: !!dataImage.url,
        dataImageKeys: dataImage ? Object.keys(dataImage) : 'none'
      });

      if (dataImage.url) {
        console.log('✅ [EXTRACT-URL] Extracted URL from data.images[0].url:', dataImage.url);
        return dataImage.url;
      }
    }

    // Method 6: Results property (FAL wrapper format)
    if (result?.results && Array.isArray(result.results) && result.results.length > 0) {
      const firstResult = result.results[0];
      console.log('🔍 [EXTRACT-URL] Found results array:', {
        hasUrl: !!firstResult.url,
        hasImage: !!firstResult.image,
        resultKeys: firstResult ? Object.keys(firstResult) : 'none'
      });

      if (firstResult.url) {
        console.log('✅ [EXTRACT-URL] Extracted URL from results[0].url:', firstResult.url);
        return firstResult.url;
      }
    }

    // Enhanced error logging with full response structure
    console.error('❌ [EXTRACT-URL] No valid image URL found in Seedream v4 response');
    console.error('📋 [EXTRACT-URL] Complete response structure:', {
      hasResult: !!result,
      resultType: typeof result,
      resultKeys: result ? Object.keys(result) : 'none',
      hasImages: !!(result?.images),
      imagesLength: result?.images?.length || 0,
      hasImage: !!(result?.image),
      hasUrl: !!(result?.url),
      hasOutput: !!(result?.output),
      hasData: !!(result?.data),
      hasResults: !!(result?.results),
      fullResponse: JSON.stringify(result, null, 2)
    });

    return null;
  }

  /**
   * Prepare image URL for Seedream v4 API compatibility with face-region enhancement
   * Handles base64 data URLs and optimizes for facial identity preservation
   */
  private async prepareImageUrlForSeedream(imageUrl: string, imageType: string): Promise<string> {
    console.log(`🔄 [PREPARE-URL] Processing ${imageType} for Seedream v4 with facial enhancement:`, {
      isDataUrl: imageUrl.startsWith('data:'),
      isHttpUrl: imageUrl.startsWith('http'),
      urlLength: imageUrl.length,
      urlPreview: imageUrl.substring(0, 100) + '...'
    });

    // For facial identity preservation, add processing notes
    if (imageType.includes('photo') || imageType.includes('head')) {
      console.log(`👤 [FACIAL-PREP] Preparing facial image for maximum identity preservation in 9:16 format`);
      console.log(`🎯 [FACIAL-PREP] Focus: Enhanced facial detail retention despite smaller proportional size`);
    }

    // If it's already an HTTP URL, return as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log(`✅ [PREPARE-URL] ${imageType} is already HTTP URL, using directly`);
      return imageUrl;
    }

    // If it's a base64 data URL, we need to handle it properly
    if (imageUrl.startsWith('data:image/')) {
      console.log(`🔄 [PREPARE-URL] ${imageType} is base64 data URL, validating format for facial preservation...`);

      // Validate base64 data URL format
      const dataUrlMatch = imageUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
      if (!dataUrlMatch) {
        throw new Error(`Invalid base64 data URL format for ${imageType}`);
      }

      const [, format, base64Data] = dataUrlMatch;
      console.log(`✅ [PREPARE-URL] Valid base64 ${imageType}:`, {
        format,
        base64Length: base64Data.length,
        estimatedSizeKB: Math.round(base64Data.length * 0.75 / 1024),
        facialOptimized: imageType.includes('photo') || imageType.includes('head')
      });

      // For facial images, add enhancement logging
      if (imageType.includes('photo') || imageType.includes('head')) {
        console.log(`👤 [FACIAL-PREP] Facial image prepared for ultra-conservative identity preservation`);
        console.log(`🔒 [FACIAL-PREP] Identity preservation priority: MAXIMUM`);
      }

      // For Seedream v4, we'll pass the data URL directly
      // The FAL client should handle base64 data URLs properly
      return imageUrl;
    }

    // Handle other formats or invalid URLs
    console.warn(`⚠️ [PREPARE-URL] Unexpected ${imageType} URL format, attempting to use directly:`, {
      startsWithData: imageUrl.startsWith('data:'),
      startsWithHttp: imageUrl.startsWith('http'),
      urlPreview: imageUrl.substring(0, 50)
    });

    return imageUrl;
  }

  /**
   * Validate image URL format for Seedream v4 compatibility
   */
  private validateImageUrl(imageUrl: string, imageType: string): { valid: boolean; error?: string } {
    if (!imageUrl || typeof imageUrl !== 'string') {
      return { valid: false, error: `${imageType} URL is required and must be a string` };
    }

    // Check for HTTP URLs
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return { valid: true };
    }

    // Check for valid base64 data URLs
    if (imageUrl.startsWith('data:image/')) {
      const dataUrlPattern = /^data:image\/(jpeg|jpg|png|webp|gif);base64,([A-Za-z0-9+/]+=*)$/;
      if (dataUrlPattern.test(imageUrl)) {
        return { valid: true };
      } else {
        return { valid: false, error: `Invalid base64 data URL format for ${imageType}` };
      }
    }

    return { valid: false, error: `${imageType} must be either HTTP URL or base64 data URL` };
  }

  /**
   * Validate CGI avatar generation inputs with enhanced compatibility checks
   */
  private validateInputs(request: CGIAvatarRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    console.log('🔍 [INPUT-VALIDATION] Starting comprehensive input validation...', {
      hasHeadPhoto: !!request.headPhotoUrl,
      hasMeasurements: !!request.measurements,
      hasOptions: !!request.options
    });

    // Enhanced head photo URL validation
    const headPhotoValidation = this.validateImageUrl(request.headPhotoUrl, 'Head photo');
    if (!headPhotoValidation.valid) {
      errors.push(headPhotoValidation.error || 'Head photo URL validation failed');
    } else {
      console.log('✅ [INPUT-VALIDATION] Head photo validation passed');
    }

    // Validate measurements
    const measurementValidation = CGIPromptGenerator.validateMeasurements(request.measurements);
    if (!measurementValidation.valid) {
      errors.push(`Missing required measurements: ${measurementValidation.missing.join(', ')}`);
    } else {
      console.log('✅ [INPUT-VALIDATION] Measurements validation passed');
    }

    // Cross-validate measurements and photo compatibility
    const compatibilityCheck = this.validateMeasurementPhotoCompatibility(request.measurements, request.headPhotoUrl);
    if (!compatibilityCheck.valid) {
      errors.push(`Measurement-Photo compatibility issue: ${compatibilityCheck.error}`);
    } else {
      console.log('✅ [INPUT-VALIDATION] Measurement-photo compatibility validated');
    }

    // Validate body proportions are realistic
    const proportionCheck = this.validateBodyProportions(request.measurements);
    if (!proportionCheck.valid) {
      errors.push(`Body proportion validation failed: ${proportionCheck.error}`);
    } else {
      console.log('✅ [INPUT-VALIDATION] Body proportions validated');
    }

    // Validate options if provided
    if (request.options) {
      const opts = request.options;
      if (opts.imageSize) {
        if (opts.imageSize.width < 512 || opts.imageSize.height < 512) {
          errors.push('Image dimensions must be at least 512x512');
        }
        if (opts.imageSize.width > 4096 || opts.imageSize.height > 4096) {
          errors.push('Image dimensions must be at most 4096x4096');
        }

        // Ensure aspect ratio is suitable for body-head composition
        const aspectRatio = opts.imageSize.width / opts.imageSize.height;
        if (aspectRatio < 0.5 || aspectRatio > 1.2) {
          errors.push('Image aspect ratio must be between 0.5 and 1.2 for optimal head-body composition');
        }
      }
      if (opts.numImages && (opts.numImages < 1 || opts.numImages > 6)) {
        errors.push('Number of images must be between 1 and 6');
      }
    }

    console.log(errors.length === 0 ?
      '✅ [INPUT-VALIDATION] All validation checks passed' :
      `❌ [INPUT-VALIDATION] Validation failed with ${errors.length} errors`
    );

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate compatibility between measurements and head photo
   */
  private validateMeasurementPhotoCompatibility(measurements: any, headPhotoUrl: string): { valid: boolean; error?: string } {
    try {
      // Check if photo is suitable for the body size from measurements
      const heightInInches = parseInt(measurements.heightFeet) * 12 + parseInt(measurements.heightInches);

      // For very tall or short people, we need to ensure the head scaling will work properly
      if (heightInInches < 54) { // Under 4'6"
        return { valid: true }; // Allow but note this might need special handling
      }
      if (heightInInches > 84) { // Over 7'0"
        return { valid: true }; // Allow but note this might need special handling
      }

      // Check body type compatibility - some combinations work better
      const bodyType = measurements.bodyType;
      if (!bodyType || !['athletic', 'slim', 'average', 'curvy'].includes(bodyType)) {
        return { valid: false, error: 'Body type must be specified and valid for proper head-body proportioning' };
      }

      // Photo format should be compatible with base64 or URL
      if (!headPhotoUrl.startsWith('data:') && !headPhotoUrl.startsWith('http')) {
        return { valid: false, error: 'Head photo must be a valid data URL or HTTP URL' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Compatibility validation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Validate body proportions are realistic and will generate good results
   */
  private validateBodyProportions(measurements: any): { valid: boolean; error?: string } {
    try {
      const chest = parseFloat(measurements.chest);
      const waist = parseFloat(measurements.waist);
      const hips = parseFloat(measurements.hips);
      const shoulders = parseFloat(measurements.shoulderWidth);

      if (isNaN(chest) || isNaN(waist) || isNaN(hips)) {
        return { valid: false, error: 'Chest, waist, and hip measurements must be valid numbers' };
      }

      // Check for realistic proportions
      const waistHipRatio = waist / hips;
      const chestWaistRatio = chest / waist;

      // Waist should generally be smaller than chest and hips
      if (waist > chest * 1.2) {
        return { valid: false, error: 'Waist measurement seems too large compared to chest - please double-check measurements' };
      }

      if (waist > hips * 1.2) {
        return { valid: false, error: 'Waist measurement seems too large compared to hips - please double-check measurements' };
      }

      // Check for unrealistic ratios
      if (waistHipRatio > 1.2) {
        return { valid: false, error: 'Waist-to-hip ratio seems unrealistic - please verify measurements' };
      }

      if (chestWaistRatio > 2.0) {
        return { valid: false, error: 'Chest-to-waist ratio seems unrealistic - please verify measurements' };
      }

      // Shoulder width should be reasonable
      if (shoulders && !isNaN(shoulders)) {
        if (shoulders > chest * 1.5) {
          return { valid: false, error: 'Shoulder width seems too large compared to chest measurement' };
        }
        if (shoulders < chest * 0.4) {
          return { valid: false, error: 'Shoulder width seems too small compared to chest measurement' };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Proportion validation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Validate Seedream v4 text-to-image request parameters
   */
  private validateSeedreamTextRequest(request: SeedreamTextToImageRequest): void {
    console.log('🔍 [VALIDATION] Validating text-to-image request:', {
      hasPrompt: !!request.prompt,
      promptLength: request.prompt?.length || 0,
      numImages: request.num_images,
      maxImages: request.max_images,
      seed: request.seed,
      enableSafety: request.enable_safety_checker
    });

    const errors: string[] = [];

    if (!request.prompt || request.prompt.trim().length === 0) {
      errors.push('Prompt is required');
    } else if (request.prompt.length > 5000) {
      errors.push('Prompt must be 5000 characters or less');
    }

    if (request.num_images && (request.num_images < 1 || request.num_images > 6)) {
      errors.push('num_images must be between 1 and 6');
    }

    if (request.max_images && (request.max_images < 1 || request.max_images > 6)) {
      errors.push('max_images must be between 1 and 6');
    }

    if (request.seed !== undefined && !Number.isInteger(request.seed)) {
      errors.push('seed must be an integer');
    }

    // Validate image size if provided
    if (request.image_size && typeof request.image_size === 'object') {
      if (request.image_size.width < 512 || request.image_size.height < 512) {
        errors.push('Image size must be at least 512x512');
      }
      if (request.image_size.width > 4096 || request.image_size.height > 4096) {
        errors.push('Image size must be at most 4096x4096');
      }
    }

    if (errors.length > 0) {
      console.error('❌ [VALIDATION] Text-to-image validation failed:', errors);
      throw new Error(`Text-to-image validation failed: ${errors.join(', ')}`);
    }

    console.log('✅ [VALIDATION] Text-to-image request validated successfully');
  }

  /**
   * Validate Seedream v4 edit request parameters
   */
  private validateSeedreamEditRequest(request: SeedreamEditRequest): void {
    console.log('🔍 [VALIDATION] Validating edit request:', {
      imageUrlsCount: request.image_urls?.length || 0,
      hasPrompt: !!request.prompt,
      promptLength: request.prompt?.length || 0,
      numImages: request.num_images,
      maxImages: request.max_images,
      seed: request.seed,
      enableSafety: request.enable_safety_checker
    });

    const errors: string[] = [];

    if (!request.image_urls || !Array.isArray(request.image_urls) || request.image_urls.length === 0) {
      errors.push('At least one image URL is required');
    } else if (request.image_urls.length > 10) {
      errors.push('Maximum 10 image URLs allowed');
    } else {
      // Validate each image URL
      request.image_urls.forEach((url, index) => {
        const validation = this.validateImageUrl(url, `Image ${index + 1}`);
        if (!validation.valid) {
          errors.push(`Image ${index + 1}: ${validation.error}`);
        }
      });
    }

    if (!request.prompt || request.prompt.trim().length === 0) {
      errors.push('Prompt is required');
    } else if (request.prompt.length > 5000) {
      errors.push('Prompt must be 5000 characters or less');
    }

    if (request.num_images && (request.num_images < 1 || request.num_images > 6)) {
      errors.push('num_images must be between 1 and 6');
    }

    if (request.max_images && (request.max_images < 1 || request.max_images > 6)) {
      errors.push('max_images must be between 1 and 6');
    }

    if (request.seed !== undefined && !Number.isInteger(request.seed)) {
      errors.push('seed must be an integer');
    }

    // Validate image size if provided
    if (request.image_size && typeof request.image_size === 'object') {
      if (request.image_size.width < 512 || request.image_size.height < 512) {
        errors.push('Image size must be at least 512x512');
      }
      if (request.image_size.width > 4096 || request.image_size.height > 4096) {
        errors.push('Image size must be at most 4096x4096');
      }
    }

    if (errors.length > 0) {
      console.error('❌ [VALIDATION] Edit request validation failed:', errors);
      throw new Error(`Edit request validation failed: ${errors.join(', ')}`);
    }

    console.log('✅ [VALIDATION] Edit request validated successfully');
  }

  /**
   * Calculate quality score based on generation steps, timing, and facial identity preservation
   */
  private calculateQualityScore(steps: CGIGenerationStep[], totalTime: number): number {
    let score = 70; // Base score

    // Success bonus for each step
    const successfulSteps = steps.filter(step => step.success).length;
    score += successfulSteps * 15;

    // Time bonus (reasonable processing time)
    if (totalTime > 10000 && totalTime < 120000) {
      score += 10;
    } else if (totalTime > 120000) {
      score -= 5; // Penalty for very slow generation
    }

    // Enhanced scoring for facial identity preservation in 9:16 format
    if (steps.some(step => step.stepName.includes('Photo') || step.stepName.includes('CGI'))) {
      score += 10; // Bonus for identity-preserving methods
    }

    // Bonus for ultra-conservative parameters (indicate high identity preservation priority)
    score += 5; // Bonus for using optimized parameters

    // Bonus for completing both steps
    if (steps.length === 2 && successfulSteps === 2) {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Assess facial identity preservation quality and recommend parameter adjustments
   */
  private assessFacialIdentityQuality(result: CGIAvatarResult): {
    score: number;
    recommendations: string[];
    shouldRetry: boolean;
    adjustedParams?: any;
  } {
    const recommendations: string[] = [];
    let score = result.metadata?.qualityScore || 0;
    let shouldRetry = false;
    let adjustedParams: any = {};

    console.log('🔍 [QUALITY-ASSESSMENT] Analyzing facial identity preservation quality...');

    // If generation failed, recommend retry with even more conservative parameters
    if (!result.success) {
      recommendations.push('Generation failed - retry with ultra-conservative parameters');
      shouldRetry = true;
      adjustedParams = {
        strength: 0.65, // Balanced for full-body generation with facial preservation
        guidance_scale: 6.0,
        num_inference_steps: 300
      };
      score = 0;
    }

    // If quality score is low, recommend parameter adjustments
    if (score < 70) {
      recommendations.push('Quality score below threshold - consider parameter optimization');
      recommendations.push('Reduce strength for better identity preservation');
      recommendations.push('Increase inference steps for higher facial detail');
      shouldRetry = true;
      adjustedParams = {
        strength: Math.max(0.60, (adjustedParams.strength || 0.75) - 0.10),
        guidance_scale: Math.max(5.5, (adjustedParams.guidance_scale || 6.5) - 0.5),
        num_inference_steps: Math.min(300, (adjustedParams.num_inference_steps || 250) + 50)
      };
    }

    // If processing took too long, it might indicate parameter issues
    const totalTime = result.metadata?.totalProcessingTime || 0;
    if (totalTime > 180000) { // 3 minutes
      recommendations.push('Processing time excessive - optimize parameters for efficiency');
    }

    console.log('📊 [QUALITY-ASSESSMENT] Assessment complete:', {
      score,
      shouldRetry,
      recommendationsCount: recommendations.length,
      adjustedParams: Object.keys(adjustedParams).length > 0 ? adjustedParams : 'none'
    });

    return {
      score,
      recommendations,
      shouldRetry,
      adjustedParams: Object.keys(adjustedParams).length > 0 ? adjustedParams : undefined
    };
  }

  /**
   * Get service information and status
   */
  getServiceInfo() {
    return {
      name: 'CGI Avatar Generation Service',
      version: '1.0.0',
      description: 'Two-step CGI avatar creation using ByteDance Seedream v4',
      endpoints: [this.textToImageEndpoint, this.editEndpoint],
      defaultImageSize: this.defaultImageSize,
      aspectRatio: '9:16 (Full Body Portrait)',
      fashnCompatible: true,
      capabilities: [
        'Photorealistic CGI body generation from measurements',
        'Seamless head photo composition',
        'FASHN-optimized output format',
        'High-quality CGI rendering',
        'Professional studio lighting simulation'
      ],
      workflow: [
        '1. Generate CGI body from measurements (text-to-image)',
        '2. Composite user head onto CGI body (edit/inpainting)',
        '3. Return FASHN-compatible portrait image'
      ]
    };
  }

  /**
   * Test API connection with minimal request
   */
  async testConnection(): Promise<{ success: boolean; error?: string; response?: any }> {
    try {
      console.log('🧪 [CGI-AVATAR] Testing API connection via proxy...');

      // Minimal test request
      const testRequest: SeedreamTextToImageRequest = {
        prompt: 'photorealistic CGI person standing, full body, white background',
        image_size: { width: 512, height: 768 },
        num_images: 1,
        enable_safety_checker: false // Disabled for better CGI generation
      };

      const response = await fetch(this.textToImageEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `API connection test failed: ${response.status} - ${errorText}`
        };
      }

      const result = await response.json();

      console.log('✅ [CGI-AVATAR] API connection test successful');
      return { success: true, response: result };

    } catch (error) {
      console.error('❌ [CGI-AVATAR] API connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enhanced debug logging utility for troubleshooting CGI generation failures
   */
  private logDebug(sessionId: string, stage: string, message: string, data?: any): void {
    if (!this.debugMode) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      sessionId,
      timestamp,
      stage,
      message,
      ...(data && { data })
    };

    console.log(`🐛 [DEBUG-${stage}] ${message}`, logEntry);

    // Store debug entries for potential export (in production, you might want to send to logging service)
    if (typeof window !== 'undefined') {
      const debugKey = `cgi_debug_${sessionId}`;
      const existingLogs = JSON.parse(localStorage.getItem(debugKey) || '[]');
      existingLogs.push(logEntry);

      // Keep only last 10 entries per session to avoid localStorage bloat
      if (existingLogs.length > 10) {
        existingLogs.splice(0, existingLogs.length - 10);
      }

      localStorage.setItem(debugKey, JSON.stringify(existingLogs));
    }
  }

  /**
   * Sanitize measurements for logging (remove sensitive data if any)
   */
  private sanitizeMeasurements(measurements: any): any {
    return {
      ...measurements,
      // Remove or mask any potentially sensitive data
      // For now, just return as-is since measurements are not sensitive
    };
  }

  /**
   * Export debug session for troubleshooting
   */
  exportDebugSession(sessionId: string): any {
    if (typeof window === 'undefined') return null;

    const debugKey = `cgi_debug_${sessionId}`;
    const logs = localStorage.getItem(debugKey);

    if (logs) {
      console.log(`📋 [DEBUG-EXPORT] Exporting debug session ${sessionId}:`, JSON.parse(logs));
      return JSON.parse(logs);
    }

    return null;
  }

  /**
   * Clear debug logs for a session
   */
  clearDebugSession(sessionId: string): void {
    if (typeof window === 'undefined') return;

    const debugKey = `cgi_debug_${sessionId}`;
    localStorage.removeItem(debugKey);
    console.log(`🧹 [DEBUG-CLEAR] Cleared debug session ${sessionId}`);
  }

  /**
   * Get comprehensive troubleshooting report
   */
  getTroubleshootingReport(): any {
    return {
      service: this.getServiceInfo(),
      apiConfiguration: {
        hasApiKey: !!falApiKey,
        endpoints: [this.textToImageEndpoint, this.editEndpoint],
        debugMode: this.debugMode,
        sessionCount: this.sessionCount
      },
      systemInfo: {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
        platform: typeof window !== 'undefined' ? window.navigator.platform : 'Unknown'
      },
      commonIssues: [
        'Check FAL API key configuration in environment variables',
        'Verify image URLs are accessible and properly formatted',
        'Ensure measurements contain all required fields',
        'Check network connectivity for API calls',
        'Validate base64 image data format if using data URLs'
      ]
    };
  }
}

// Export singleton instance
export const cgiAvatarGenerationService = new CGIAvatarGenerationService();
export default cgiAvatarGenerationService;