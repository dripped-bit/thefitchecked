/**
 * Direct Kling Avatar Service
 * Creates animated avatars directly from user photos + measurements using Kling Video
 * Bypasses Seedream completely for faster, more efficient avatar generation
 */

import { ImageFormatValidator } from '../utils/imageFormatValidator';
import { toAbsoluteUrl, prepareUrlForExternalApi } from '../utils/urlUtils';

console.log('🎬 Direct Kling Avatar Service Configuration:');
console.log('- Using /api/fal proxy for all FAL API calls');

// Measurement interface (simplified from original)
export interface DirectMeasurements {
  height?: number | string;
  heightFeet?: string;
  heightInches?: string;
  chest?: number | string;
  waist?: number | string;
  hips?: number | string;
  shoulderWidth?: number | string;
  shoulders?: number | string;
  inseam?: number | string;
  bodyType?: string;
  build?: 'athletic' | 'slim' | 'average' | 'curvy' | 'muscular';
  weight?: number | string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
}

// Real Kling Video API request parameters
export interface KlingVideoAPIRequest {
  prompt: string;
  image_url: string;
  duration?: '5' | '10';
  negative_prompt?: string;
  cfg_scale?: number;
}

// Real Kling Video API response structure
export interface KlingVideoAPIResponse {
  video: {
    url: string;
  };
}

// Simplified avatar result to match real API
export interface DirectAvatarResult {
  success: boolean;
  videoUrl?: string;
  staticImageUrl?: string;
  error?: string;
  metadata?: {
    originalPhotoUrl: string;
    measurements: DirectMeasurements;
    generationPrompt: string;
    processingTime: number;
    model: string;
    endpoint?: string;
    directGeneration: true;
    demoMode?: boolean;
  };
}

export class DirectKlingAvatarService {
  private readonly endpoint = 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video';
  private readonly DEMO_AVATAR_URL = '/3d-avatar.mp4';
  private readonly DEMO_STATIC_AVATAR_URL = '/78C366D4-95B3-486D-908B-1080B3060B2B.png';

  constructor() {
    console.log('🎬 [DIRECT-KLING] Service initialized:', {
      endpoint: this.endpoint,
      approach: 'Direct photo + measurements → Kling Video',
      bypassesSeedream: true,
      demoModeSupported: true,
      animationEnabled: this.isAnimationEnabled()
    });
  }

  /**
   * Check if avatar animation is enabled via environment variable
   */
  private isAnimationEnabled(): boolean {
    const enabled = import.meta.env.VITE_ENABLE_AVATAR_ANIMATION === 'true';
    console.log(`🎬 [ANIMATION-CHECK] Avatar animation is ${enabled ? 'ENABLED' : 'DISABLED'}`);
    return enabled;
  }

  /**
   * Check if demo mode is enabled
   */
  private isDemoModeEnabled(): boolean {
    return localStorage.getItem('fitChecked_demoMode') === 'true';
  }

  /**
   * Toggle demo mode on/off
   */
  toggleDemoMode(): boolean {
    const currentMode = this.isDemoModeEnabled();
    const newMode = !currentMode;
    localStorage.setItem('fitChecked_demoMode', newMode.toString());
    console.log(`🎭 [DEMO-MODE] ${newMode ? 'Enabled' : 'Disabled'} - API calls will be ${newMode ? 'skipped' : 'made'}`);
    return newMode;
  }

  /**
   * Get current demo mode status
   */
  getDemoModeStatus(): { enabled: boolean; avatarUrl: string } {
    const enabled = this.isDemoModeEnabled();
    return {
      enabled,
      avatarUrl: enabled ? this.DEMO_AVATAR_URL : ''
    };
  }

  /**
   * Generate animated avatar directly from user photo + measurements
   * Main method that replaces the entire Seedream pipeline
   */
  async generateDirectAnimatedAvatar(
    userPhotoUrl: string,
    measurements: DirectMeasurements,
    options: Partial<KlingVideoAPIRequest> = {}
  ): Promise<DirectAvatarResult> {
    try {
      // Check if animation is disabled first
      if (!this.isAnimationEnabled()) {
        console.log('🚫 [ANIMATION-DISABLED] Avatar animation is disabled - returning static image only');
        console.log('🚫 [ANIMATION-DISABLED] Skipping Kling video API call due to VITE_ENABLE_AVATAR_ANIMATION=false');

        return {
          success: true,
          videoUrl: null, // No video when animation is disabled
          staticImageUrl: userPhotoUrl || this.DEMO_STATIC_AVATAR_URL,
          animatedVideoUrl: null, // Explicitly null for disabled animation
          metadata: {
            originalPhotoUrl: userPhotoUrl,
            processedPhotoUrl: userPhotoUrl,
            measurements,
            generationPrompt: 'Animation disabled - static image only',
            processingTime: 50, // Instant when disabled
            model: 'Animation Disabled',
            endpoint: 'disabled://no-video-generation',
            directGeneration: false,
            animationDisabled: true
          }
        };
      }

      // Check for demo mode second
      if (this.isDemoModeEnabled()) {
        console.log('🎭 [DEMO-MODE] Demo mode enabled - returning hardcoded avatar');
        console.log('🎭 [DEMO-MODE] Skipping all FAL API calls to save credits');
        console.log('🎭 [DEMO-MODE] No photo upload required - using demo avatar');

        // Use actual demo avatar image instead of placeholder
        const demoPhotoUrl = userPhotoUrl || this.DEMO_STATIC_AVATAR_URL;

        // Convert demo URLs to absolute URLs for external API access (like FASHN)
        const absoluteVideoUrl = toAbsoluteUrl(this.DEMO_AVATAR_URL);
        const absoluteStaticUrl = toAbsoluteUrl(this.DEMO_STATIC_AVATAR_URL);

        console.log('🎭 [DEMO-MODE] Converting URLs to absolute format:', {
          originalVideoUrl: this.DEMO_AVATAR_URL,
          absoluteVideoUrl,
          originalStaticUrl: this.DEMO_STATIC_AVATAR_URL,
          absoluteStaticUrl,
          reason: 'External APIs like FASHN require publicly accessible HTTP URLs'
        });

        return {
          success: true,
          videoUrl: absoluteVideoUrl,
          staticImageUrl: absoluteStaticUrl, // Always use demo avatar for FASHN
          metadata: {
            originalPhotoUrl: demoPhotoUrl,
            processedPhotoUrl: demoPhotoUrl,
            measurements,
            generationPrompt: 'Demo mode - using hardcoded 3D avatar',
            processingTime: 100, // Instant in demo mode
            model: 'Demo Mode (3d-avatar.mp4)',
            endpoint: 'demo://hardcoded-avatar',
            directGeneration: true,
            demoMode: true
          }
        };
      }

      try {
        console.log('🎬 Kling avatar generation starting...');
      console.log('Input received:', {
        userPhotoUrl,
        type: typeof userPhotoUrl,
        isNull: userPhotoUrl === null,
        isUndefined: userPhotoUrl === undefined,
        length: userPhotoUrl?.length
      });

      // VALIDATE INPUT FIRST
      if (!userPhotoUrl || userPhotoUrl === undefined || userPhotoUrl === null) {
        console.error('❌ No image provided to Kling service - userPhotoUrl is undefined');
        throw new Error('No image provided to Kling service. Please upload a photo first.');
      }

      if (typeof userPhotoUrl !== 'string') {
        console.error('❌ Invalid image input type:', typeof userPhotoUrl);
        throw new Error(`Invalid image input type: ${typeof userPhotoUrl}. Expected string.`);
      }

      // Validate that we have a proper HTTP URL after processing
      console.log('🔍 Initial URL validation:', {
        userPhotoUrl: userPhotoUrl.substring(0, 50) + '...',
        isDataUrl: userPhotoUrl.startsWith('data:'),
        isHttpUrl: userPhotoUrl.startsWith('http')
      });

      console.log('✅ Image input validation passed');
      console.log('📏 Measurements:', measurements);

      const startTime = Date.now();

      // Step 1: Generate measurement-based animation prompt
      const animationPrompt = this.generateMeasurementBasedPrompt(measurements);
      console.log('📝 Generated animation prompt:', animationPrompt);

      // Step 2: Initialize processed image URL (will be undefined if userPhotoUrl is undefined)
      let processedImageUrl = userPhotoUrl;
      console.log('🔄 Initial processedImageUrl:', processedImageUrl);

      // Step 3: Validate and process image format
      const imageFormat = this.detectImageFormat(userPhotoUrl);
      console.log('🖼️  Detected image format:', imageFormat);

      // Step 4: Handle data URLs by uploading to FAL storage first
      if (userPhotoUrl && userPhotoUrl.startsWith('data:')) {
        console.log('🔄 Converting data URL to hosted image...');
        console.log('📊 Image format details:', {
          format: imageFormat,
          isSupported: this.isSupportedFormat(imageFormat),
          dataUrlLength: userPhotoUrl.length,
          mimeType: userPhotoUrl.substring(5, userPhotoUrl.indexOf(';')),
          dataUrlPreview: userPhotoUrl.substring(0, 100) + '...'
        });

        // Storage upload via proxy - validation skipped (using fetch directly)
        console.log('🔧 Storage upload will use /api/fal proxy');

        try {
          // Step 4a: Convert data URL to File object (browser-compatible)
          console.log('🔍 Converting data URL to File object for browser upload...');

          // Extract MIME type and base64 data
          const mimeMatch = userPhotoUrl.match(/data:([^;]+);base64,(.+)/);
          if (!mimeMatch) {
            throw new Error('Invalid data URL format');
          }

          const [, mimeType, base64Data] = mimeMatch;
          console.log('📊 Extracted data URL parts:', {
            mimeType,
            base64Length: base64Data.length,
            detectedFormat: imageFormat
          });

          // Convert base64 to binary data
          const binaryData = atob(base64Data);
          const uint8Array = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            uint8Array[i] = binaryData.charCodeAt(i);
          }

          // Create proper MIME type if needed
          const finalMimeType = mimeType.startsWith('image/') ? mimeType : this.getCorrectMimeType(imageFormat) || 'image/jpeg';

          // Create File object (browser-compatible)
          const fileName = `upload.${imageFormat || 'jpg'}`;
          const imageFile = new File([uint8Array], fileName, {
            type: finalMimeType,
            lastModified: Date.now()
          });

          console.log('📄 File object created:', {
            name: imageFile.name,
            size: imageFile.size,
            type: imageFile.type,
            lastModified: imageFile.lastModified
          });

          // Validate file
          if (imageFile.size === 0) {
            throw new Error('Invalid image data: file size is 0 bytes');
          }

          // Step 4b: Upload File to FAL storage via proxy with enhanced error handling
          console.log('📤 Uploading File to FAL storage via proxy...');
          console.log('📤 Converting File to FormData for upload');

          let uploadResult;
          try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', imageFile);

            const uploadResponse = await fetch('/api/fal/storage/upload', {
              method: 'POST',
              body: formData
            });

            if (!uploadResponse.ok) {
              throw new Error(`Storage upload failed: ${uploadResponse.status}`);
            }

            uploadResult = await uploadResponse.json();
            console.log('📤 Raw upload result:', uploadResult);
          } catch (storageError) {
            console.error('❌ FAL storage upload via proxy failed:', storageError);
            throw new Error(`FAL storage upload failed: ${storageError instanceof Error ? storageError.message : 'Unknown error'}`);
          }

          // Extract URL from result (handle different response formats)
          if (uploadResult && uploadResult.url) {
            processedImageUrl = uploadResult.url;
          } else if (uploadResult && uploadResult.file_url) {
            processedImageUrl = uploadResult.file_url;
          } else if (typeof uploadResult === 'string') {
            processedImageUrl = uploadResult;
          } else {
            console.error('❌ Unexpected upload result format:', uploadResult);
            throw new Error('Unexpected upload result format: ' + JSON.stringify(uploadResult));
          }

          console.log('📤 Extracted processedImageUrl:', processedImageUrl);

          // Validate the uploaded URL
          if (!processedImageUrl || !processedImageUrl.startsWith('http')) {
            console.error('❌ Invalid upload result URL:', processedImageUrl);
            throw new Error('Failed to get valid URL from FAL storage upload');
          }

          console.log('✅ Image successfully uploaded to FAL storage:', {
            originalUrl: userPhotoUrl.substring(0, 50) + '...',
            uploadedUrl: processedImageUrl,
            uploadSuccess: !!processedImageUrl,
            isHttpUrl: processedImageUrl?.match(/^https?:\/\//) !== null
          });

        } catch (uploadError) {
          console.error('❌ FAL storage upload failed with detailed error:');
          console.error('Error type:', typeof uploadError);
          console.error('Error name:', uploadError instanceof Error ? uploadError.name : 'Unknown');
          console.error('Error message:', uploadError instanceof Error ? uploadError.message : uploadError);
          console.error('Error stack:', uploadError instanceof Error ? uploadError.stack : 'N/A');

          // ENHANCED FALLBACK: Don't use data URL directly as Kling API likely won't accept it
          console.log('❌ FAL storage upload failed - cannot proceed without HTTP URL');

          // Provide specific error messages based on error type
          let errorMessage = 'Failed to upload image to FAL storage. ';
          if (uploadError instanceof Error) {
            if (uploadError.message.includes('credentials') || uploadError.message.includes('key')) {
              errorMessage += 'API key issue - please check your FAL API configuration.';
            } else if (uploadError.message.includes('network') || uploadError.message.includes('fetch')) {
              errorMessage += 'Network connection issue - please check your internet connection.';
            } else if (uploadError.message.includes('size') || uploadError.message.includes('limit')) {
              errorMessage += 'Image file too large - please try a smaller image.';
            } else {
              errorMessage += `Details: ${uploadError.message}`;
            }
          } else {
            errorMessage += 'Please try again or check your internet connection.';
          }

          throw new Error(errorMessage);
        }
      }

      // Step 4: Validate inputs
      console.log('🔍 Final validation - processedImageUrl:', processedImageUrl);
      console.log('🔍 processedImageUrl type:', typeof processedImageUrl);
      console.log('🔍 processedImageUrl defined:', processedImageUrl !== undefined);

      if (processedImageUrl) {
        console.log('🔍 URL starts with data:', processedImageUrl.startsWith('data:'));
        console.log('🔍 URL starts with http:', processedImageUrl.match(/^https?:\/\/.+/) !== null);
      } else {
        console.log('🔍 processedImageUrl is undefined/null');
      }

      // Strict validation: Only accept HTTP URLs for Kling API
      const isValidHttpUrl = processedImageUrl?.match(/^https?:\/\/.+/);

      if (!processedImageUrl || !isValidHttpUrl) {
        console.error('❌ Final validation failed - Kling requires valid HTTP/HTTPS URL:', {
          url: processedImageUrl,
          urlType: typeof processedImageUrl,
          isValidHttpUrl: !!isValidHttpUrl,
          isUndefined: processedImageUrl === undefined,
          isNull: processedImageUrl === null,
          isEmpty: processedImageUrl === '',
          length: processedImageUrl ? processedImageUrl.length : 'N/A',
          originalPhotoWasDataUrl: userPhotoUrl.startsWith('data:'),
          uploadWasAttempted: userPhotoUrl.startsWith('data:')
        });
        throw new Error('Kling API requires a valid HTTP/HTTPS URL. Data URLs must be uploaded to storage first.');
      }

      console.log('✅ Valid HTTP URL for Kling API:', processedImageUrl.substring(0, 100) + '...');

      // Validate image format support
      if (imageFormat && !this.isSupportedFormat(imageFormat)) {
        const supportedFormats = this.getFormatSupport().supportedFormats.join(', ');
        throw new Error(`Unsupported image format: ${imageFormat.toUpperCase()}. Supported formats: ${supportedFormats}`);
      }

      if (!animationPrompt || animationPrompt.length < 10) {
        throw new Error('Invalid prompt: must be at least 10 characters long');
      }

      // Step 5: Prepare Kling Video API request with processed image
      const negativePrompt = this.generateNegativePrompt();
      const requestPayload = {
        input: {
          prompt: animationPrompt,
          image_url: processedImageUrl,
          duration: "5",
          negative_prompt: negativePrompt,
          cfg_scale: 0.8,  // Increased for stronger prompt adherence and framing control
          // Enhanced motion parameters for API optimization
          motion_amplitude: 0.05,
          motion_frequency: 0.5,
          loop_duration: 4.0,
          temporal_coherence: 1.0,
          frame_consistency: true
        }
      };

      console.log('✅ Validation passed, making API call with processed image URL:', processedImageUrl);
      console.log('📤 Sending to Kling:', JSON.stringify(requestPayload, null, 2));

      // Step 7: Call FAL Kling Video API via proxy
      console.log('🚀 Making Kling Video API call via proxy...');
      let result;
      try {
        const klingApiResponse = await fetch(`/api/fal/${this.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload.input)
        });

        if (!klingApiResponse.ok) {
          throw new Error(`Kling API request failed: ${klingApiResponse.status}`);
        }

        result = await klingApiResponse.json();

        console.log('✅ Kling success:', result);
      } catch (error) {
        // Enhanced error logging
        console.error('❌ Kling failed with:');
        console.error('Status:', error?.status || 'unknown');
        console.error('Status Text:', error?.statusText || 'unknown');
        console.error('Body:', error?.body || 'no body');
        console.error('Detail:', error?.detail || 'no detail');

        // If it's a 404, the endpoint doesn't exist
        if (error?.status === 404) {
          console.error('Endpoint not found - try different endpoint');
        }

        // If it's a 422, validation error
        if (error?.status === 422) {
          console.error('Validation error - check parameters');
        }

        // If it's a 401, API key issue
        if (error?.status === 401) {
          console.error('Authentication failed - check FAL API key');
        }

        throw error;
      }

      const processingTime = Date.now() - startTime;

      console.log('📊 Raw Kling API response:', result);

      // Handle Kling API response formats
      let videoUrl;
      if (result?.data?.video_url) {
        videoUrl = result.data.video_url;
      } else if (result?.video_url) {
        videoUrl = result.video_url;
      } else if (result?.data?.video?.url) {
        videoUrl = result.data.video.url;
      } else if (result?.video?.url) {
        videoUrl = result.video.url;
      } else if (result?.data?.video) {
        videoUrl = result.data.video;
      } else {
        console.error('❌ No video URL found in Kling response. Response structure:', {
          hasData: !!result?.data,
          dataKeys: result?.data ? Object.keys(result.data) : 'none',
          topLevelKeys: result ? Object.keys(result) : 'none',
          fullResponse: result
        });
        throw new Error('Invalid response from Kling Video API: no video URL found');
      }

      console.log('✅ Direct animated avatar generation completed successfully');
      console.log(`🎥 Processing time: ${processingTime}ms`);
      console.log(`🔗 Video URL: ${videoUrl}`);

      return {
        success: true,
        videoUrl: videoUrl,
        staticImageUrl: processedImageUrl,
        metadata: {
          originalPhotoUrl: userPhotoUrl, // Keep original for reference
          processedPhotoUrl: processedImageUrl,
          measurements,
          generationPrompt: animationPrompt,
          processingTime,
          model: 'Kling Video v1 Standard (Direct)',
          endpoint: this.endpoint,
          directGeneration: true
        }
      };
    } catch (error) {
      console.error('❌ Direct Kling avatar generation failed:', error);

      // Log detailed error information for debugging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      // Check if it's a ValidationError from FAL
      const errorMessage = error instanceof Error ? error.message : 'Direct generation failed';
      if (errorMessage.includes('ValidationError') || error?.status === 422) {
        console.error('🚨 FAL API Validation Error - check API parameters:');
        console.error('- image_url:', userPhotoUrl);
        console.error('- endpoint:', this.endpoint);
        console.error('- request payload:', requestPayload);
      }

      return {
        success: false,
        error: errorMessage
      };
    }
    } catch (error) {
      console.error('❌ Direct Kling avatar generation method failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Avatar generation failed'
      };
    }
  }

  /**
   * Generate animation prompt based on measurements with enhanced film terminology
   * Creates specific movement descriptions from user measurements using professional cinematography terms
   */
  private generateMeasurementBasedPrompt(measurements: DirectMeasurements): string {
    // Professional studio capture with enhanced film terminology
    let prompt = 'Professional studio capture, static tripod-mounted camera, full-figure framing with 30% headroom and footroom, ';
    prompt += 'subject centered in frame, perpendicular viewing angle at 0 degrees, no camera movement or zoom transitions, ';
    prompt += 'person in natural standing pose wearing form-fitting white tank top and short fitted blue lounge shorts (above mid-thigh length), ';

    // Enhanced shot composition using cinematography terminology
    prompt += 'locked_off_tripod_mount, full_figure_wide shot_type, 14mm_ultra_wide_angle focal_length, ';
    prompt += 'chest_level_4ft camera_height, camera_distance_12_feet, full_room_perspective, ';
    prompt += 'square_1_1 aspect_ratio, static_no_pan_tilt_zoom camera_movement, ';
    prompt += 'complete_body_visible, full_legs_shown, feet_fully_visible, head_to_toe_framing, ';
    prompt += 'wide_angle_lens, full_body_portrait, standing_on_ground, feet_on_floor, shoes_visible, ankles_visible, ';

    // Add basic body type if available
    const bodyType = measurements.bodyType || measurements.build || 'average';
    if (bodyType === 'athletic' || bodyType === 'muscular') {
      prompt += 'athletic physique, ';
    } else if (bodyType === 'slim') {
      prompt += 'lean build, ';
    }

    // Simple full-body animation specifications
    prompt += 'natural standing pose, arms at sides, hands relaxed, ';
    prompt += 'simple A-pose, neutral expression, looking forward, ';
    prompt += 'subtle_idle_loop animation_style, minimal_5percent_sway movement_amplitude, ';
    prompt += 'gentle_weight_shift_pendulum_2second_cycle motion_description, ';
    prompt += 'natural_torso_expansion_3second_rhythm breathing_simulation, ';

    // Enhanced camera control and stability directives
    prompt += 'locked exposure and focus, consistent lighting throughout sequence, ';
    prompt += 'motion blur disabled, high temporal stability, frame_consistency true, ';
    prompt += 'temporal_coherence 1.0, full_body_product_shot, mannequin_style_pose, ready for virtual garment fitting';

    console.log('📝 Generated Kling prompt (enhanced professional film terminology):', prompt);
    console.log('📏 Prompt length:', prompt.length);

    return prompt;
  }

  /**
   * Generate negative prompt to prevent unwanted camera movements and cropping
   */
  private generateNegativePrompt(): string {
    const negativePrompt = [
      // Camera movement prevention
      'camera movement', 'camera motion', 'zoom in', 'zoom out', 'pan left', 'pan right',
      'camera pan', 'camera tilt', 'camera shake', 'handheld camera', 'dolly shot',

      // Framing issues prevention
      'cropped feet', 'cut off head', 'partial body', 'close up', 'medium shot',
      'cropped limbs', 'out of frame', 'body parts missing', 'tight framing',
      'legs cut off', 'feet cropped', 'ankles cut', 'head cropped', 'arms cropped',
      'torso only', 'waist up', 'chest up', 'feet_cut_off', 'shoes_cropped',
      'ankles_missing', 'bottom_cropped', 'lower_body_missing',

      // Quality and composition issues
      'blurry', 'low quality', 'distorted', 'warped', 'deformed', 'multiple people',
      'crowd', 'background people', 'split screen', 'collage',

      // Unwanted movements (but allow camera flash and shutter press)
      'fast movement', 'running', 'jumping', 'dancing', 'spinning', 'turning around',
      'walking away', 'dynamic pose', 'action pose', 'dramatic gestures', 'excessive movement',

      // Prevent conflicting objects
      'no camera', 'empty hands', 'phone in hands', 'multiple cameras'
    ].join(', ');

    console.log('📝 Generated negative prompt:', negativePrompt);
    return negativePrompt;
  }

  /**
   * Parse height from various measurement formats
   */
  private parseHeight(measurements: DirectMeasurements): number | null {
    // Try direct height value
    if (measurements.height) {
      const height = typeof measurements.height === 'string' ? parseFloat(measurements.height) : measurements.height;
      if (height && height > 50) return height; // Assume cm if > 50
    }

    // Try feet + inches format
    if (measurements.heightFeet && measurements.heightInches) {
      const feet = parseInt(measurements.heightFeet);
      const inches = parseInt(measurements.heightInches);
      if (feet && inches >= 0) {
        return Math.round((feet * 12 + inches) * 2.54); // Convert to cm
      }
    }

    return null;
  }

  /**
   * Get different animation styles based on use case
   */
  getAnimationStyles(): Record<string, string> {
    return {
      fashion: 'Professional fashion model pose, elegant stance, ready for virtual try-on, studio lighting',

      casual: 'Relaxed natural standing pose, comfortable positioning, everyday casual stance, soft lighting',

      confident: 'Strong confident posture, assertive stance, professional bearing, commanding presence',

      elegant: 'Graceful sophisticated pose, refined movements, high-fashion positioning, editorial quality',

      natural: 'Authentic natural stance, genuine comfortable pose, real person positioning, lifestyle feel',

      athletic: 'Strong athletic posture, fit physique showcase, active stance, sports-ready positioning'
    };
  }

  /**
   * Generate multiple animation variations from single photo
   */
  async generateAnimationVariations(
    userPhotoUrl: string,
    measurements: DirectMeasurements,
    variationCount: number = 3
  ): Promise<{
    success: boolean;
    variations?: DirectAvatarResult[];
    errors?: string[];
  }> {
    console.log(`🎬 Generating ${variationCount} direct animation variations...`);

    const styles = Object.keys(this.getAnimationStyles()).slice(0, variationCount);
    const results: DirectAvatarResult[] = [];
    const errors: string[] = [];

    for (let i = 0; i < styles.length; i++) {
      try {
        const style = styles[i];
        console.log(`🎬 Creating ${style} variation (${i + 1}/${styles.length})...`);

        // Use base measurements but different animation style
        const customPrompt = this.generateMeasurementBasedPrompt(measurements) +
                           '. ' + this.getAnimationStyles()[style];

        const result = await this.generateDirectAnimatedAvatar(
          userPhotoUrl,
          measurements,
          {
            cfg_scale: 0.3 + (i * 0.2) // Vary CFG scale for different styles
          }
        );

        if (result.success) {
          results.push(result);
        } else {
          errors.push(`${style} variation failed: ${result.error}`);
        }

        // Small delay between requests
        if (i < styles.length - 1) {
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
      variations: results,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validate user photo and measurements before processing
   */
  validateInputs(userPhotoUrl: string, measurements: DirectMeasurements): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate photo URL
    if (!userPhotoUrl || typeof userPhotoUrl !== 'string') {
      errors.push('User photo URL is required');
    } else if (!userPhotoUrl.match(/^(https?:\/\/|data:image\/)/)) {
      errors.push('User photo must be a valid HTTP URL or base64 data URL');
    } else {
      // Additional format validation
      const format = this.detectImageFormat(userPhotoUrl);
      if (format && !this.isSupportedFormat(format)) {
        const supportedFormats = this.getFormatSupport().supportedFormats.join(', ');
        errors.push(`Unsupported image format: ${format.toUpperCase()}. Supported formats: ${supportedFormats}`);
      }
    }

    // Validate measurements (at least some basic measurements)
    if (!measurements || typeof measurements !== 'object') {
      errors.push('Measurements object is required');
    } else {
      // Check for at least height or feet+inches
      const hasHeight = measurements.height || (measurements.heightFeet && measurements.heightInches);
      if (!hasHeight) {
        errors.push('Height measurement is required (height or heightFeet+heightInches)');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Alias method for compatibility with AppFacePage
   * Maps the expected interface to the actual implementation
   */
  async generateDirectAvatar(request: {
    headPhotoUrl: string;
    measurements: DirectMeasurements;
    preferences?: any
  }): Promise<{ success: boolean; animatedVideoUrl?: string | null; error?: string }> {
    try {
      console.log('🎬 [COMPAT-WRAPPER] generateDirectAvatar called - delegating to generateDirectAnimatedAvatar');

      const result = await this.generateDirectAnimatedAvatar(
        request.headPhotoUrl,
        request.measurements
      );

      // Transform result to match expected interface
      return {
        success: result.success,
        animatedVideoUrl: result.videoUrl || result.animatedVideoUrl,
        error: result.success ? undefined : 'Avatar generation failed'
      };

    } catch (error) {
      console.error('❌ [COMPAT-WRAPPER] generateDirectAvatar failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Avatar generation failed'
      };
    }
  }

  /**
   * Get service information
   */
  getServiceInfo() {
    return {
      name: 'Direct Kling Avatar Service',
      version: '1.0.0',
      description: 'Generate animated avatars directly from user photos using Kling Video',
      approach: 'Direct photo + measurements → Kling Video (bypasses Seedream)',
      endpoint: this.endpoint,
      isConfigured: true, // Using proxy, no API key needed in client
      capabilities: [
        'Direct photo-to-video animation',
        'Measurement-based motion prompts',
        '5-second avatar animations',
        'Multiple animation style variations',
        'Fast single-API-call generation',
        'Virtual try-on ready poses'
      ],
      advantages: [
        'Faster generation (no Seedream step)',
        'Uses actual user photo',
        'Cost effective (single API call)',
        'Measurement-driven animation',
        'Higher photo fidelity'
      ]
    };
  }

  /**
   * Detect image format from URL or data URL using centralized validator
   */
  private detectImageFormat(imageUrl: string | undefined): string | null {
    if (!imageUrl) {
      console.log('🔍 detectImageFormat: imageUrl is undefined/null');
      return null;
    }

    if (imageUrl.startsWith('data:')) {
      const validation = ImageFormatValidator.validateDataUrl(imageUrl);
      return validation.format || null;
    } else if (imageUrl.match(/^https?:\/\//)) {
      const validation = ImageFormatValidator.validateImageUrl(imageUrl);
      return validation.format || null;
    }
    return null;
  }

  /**
   * Check if image format is supported using centralized validator
   */
  private isSupportedFormat(format: string | null): boolean {
    return format ? ImageFormatValidator.isFormatSupported(format) : false;
  }

  /**
   * Get comprehensive format validation info using centralized validator
   */
  getFormatSupport() {
    return ImageFormatValidator.getFormatSupport();
  }

  /**
   * Get correct MIME type for image format to fix blob type issues
   */
  private getCorrectMimeType(format: string | null): string | null {
    if (!format) return null;

    const mimeTypeMap: Record<string, string> = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'avif': 'image/avif'
    };

    return mimeTypeMap[format.toLowerCase()] || null;
  }
}

// Export singleton instance
export const directKlingAvatarService = new DirectKlingAvatarService();
export default directKlingAvatarService;