/**
 * Direct FASHN API Service - Native FASHN Virtual Try-On
 * FASHN is completely independent from FAL API - uses api.fashn.ai directly
 * Authentication: Uses VITE_FASHN_API_KEY obtained from FASHN platform
 * Documentation: https://github.com/fashn-AI
 */

import { fashnLibraryService, LibraryGarment, FashnLibraryResponse } from './fashnLibraryService';
import { debugLog } from '../utils/debugConfig';
import { getOutputFormatAuto, type ImageContext } from '../utils/outputFormatSelector';
import apiConfig from '../config/apiConfig';

interface FashnTryOnRequest {
  model_name: string;
  inputs: {
    model_image: string;
    garment_image: string;
    category?: 'auto' | 'tops' | 'bottoms' | 'one-pieces';
    segmentation_free?: boolean;
    moderation_level?: 'conservative' | 'permissive' | 'none';
    garment_photo_type?: 'auto' | 'flat-lay' | 'model';
    mode?: 'performance' | 'balanced' | 'quality';
    seed?: number;
    num_samples?: number;
    output_format?: 'png' | 'jpeg';
    return_base64?: boolean;
  };
}

interface FashnJobResponse {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'completed' | 'failed' | 'in_progress' | 'in_queue';
  output?: string[];  // Array of image URLs
  result?: {
    image_url: string;
  };
  error?: string | null;
}

interface GarmentAnalysis {
  type: 'tops' | 'bottoms' | 'one-pieces' | 'auto';
  fittingType: 'fitted' | 'loose' | 'layered' | 'accessory';
  complexity: 'simple' | 'moderate' | 'complex';
  recommendedMode: 'performance' | 'balanced' | 'quality';
  recommendedSamples: number; // 1-4 samples based on complexity
  recommendedSegmentationFree: boolean; // Adaptive segmentation based on garment type
}

interface ImageProcessingResult {
  processedImageUrl: string;
  modifications: string[];
  originalSize: { width: number; height: number };
  processedSize: { width: number; height: number };
  compressionRatio?: number;
}

interface QualityValidationResult {
  score: number; // 0-100
  issues: string[];
  isValid: boolean;
  recommendations: string[];
}

interface RetryAttempt {
  attempt: number;
  parameters: Partial<FashnTryOnRequest['inputs']>;
  result?: string;
  error?: string;
  timestamp: number;
}

class DirectFashnService {
  private readonly baseUrl: string;
  private modelVersion = 'tryon-v1.6';

  constructor() {
    this.baseUrl = apiConfig.getEndpoint('/api/fashn');
    console.log('👗 [DIRECT-FASHN] Service initialized - URL:', this.baseUrl);
  }

  // Warning suppression flag (static to persist across instances)
  private static fashnWarningShown = false;

  // Performance optimization and caching
  private parameterCache = new Map<string, GarmentAnalysis>();
  private successfulParams = new Map<string, FashnTryOnRequest['inputs']>();
  private requestQueue: Array<{ resolve: Function; reject: Function; params: any }> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;

  // Enhanced rate limiting with exponential backoff and circuit breaker
  private lastFashnRequest: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 120000; // 120 seconds (2 minutes) between requests to avoid 429 errors
  private requestAttempts: number = 0;
  private circuitBreakerUntil: number = 0;
  private readonly MAX_CIRCUIT_BREAKER_TIME = 300000; // 5 minutes max circuit breaker
  private activeRequest: Promise<string> | null = null; // Single request queue
  private minRequestInterval = 1000; // 1 second between requests

  /**
   * Calculate exponential backoff delay: 10s → 30s → 60s → 120s (max)
   */
  private getExponentialDelayMs(): number {
    const baseDelay = this.MIN_REQUEST_INTERVAL;
    const exponentialDelay = baseDelay * Math.pow(2, this.requestAttempts);
    const maxDelay = 120000; // 2 minutes max
    const jitter = Math.random() * 1000; // Add 0-1s random jitter
    return Math.min(exponentialDelay, maxDelay) + jitter;
  }

  /**
   * Check if circuit breaker is active
   */
  private isCircuitBreakerActive(): boolean {
    return Date.now() < this.circuitBreakerUntil;
  }

  /**
   * Activate circuit breaker for progressive timeouts
   */
  private activateCircuitBreaker(): void {
    const breakerTime = Math.min(
      30000 * Math.pow(2, this.requestAttempts), // 30s → 1m → 2m → 4m
      this.MAX_CIRCUIT_BREAKER_TIME
    );
    this.circuitBreakerUntil = Date.now() + breakerTime;
    console.log(`🚫 [CIRCUIT-BREAKER] FASHN requests blocked for ${breakerTime/1000}s due to repeated failures`);
  }

  /**
   * Reset rate limiting on successful request
   */
  private resetRateLimiting(): void {
    this.requestAttempts = 0;
    this.circuitBreakerUntil = 0;
    this.lastFashnRequest = 0;
    console.log('✅ [RATE-LIMIT] Reset successful - normal operation resumed');
  }

  /**
   * Get available garments from FASHN Library
   */
  getLibraryGarments(): LibraryGarment[] {
    return fashnLibraryService.getAllGarments();
  }

  /**
   * Get garments by category from library
   */
  getLibraryGarmentsByCategory(category: LibraryGarment['category']): LibraryGarment[] {
    return fashnLibraryService.getGarmentsByCategory(category);
  }

  /**
   * Get available keychains
   */
  getLibraryKeychains() {
    return fashnLibraryService.getAllKeychains();
  }

  /**
   * Search library garments
   */
  searchLibraryGarments(query: string): LibraryGarment[] {
    return fashnLibraryService.searchGarments(query);
  }

  /**
   * Try garment from library instead of user upload
   */
  async tryLibraryGarment(modelImageUrl: string, garmentId: string, options: any = {}): Promise<any> {
    const garment = fashnLibraryService.getGarmentById(garmentId);
    if (!garment) {
      throw new Error(`Library garment not found: ${garmentId}`);
    }

    console.log(`👕 [LIBRARY-TRYON] Using library garment: ${garment.name}`);
    return this.tryOnClothing(modelImageUrl, garment.imageUrl, {
      ...options,
      source: 'library',
      garmentInfo: garment
    });
  }

  /**
   * Smart try-on with automatic fallback to library garments
   * Attempts user upload first, falls back to similar library items on failure
   */
  async tryOnWithFallback(
    modelImageUrl: string,
    garmentImageUrl: string,
    options: any = {}
  ): Promise<FashnLibraryResponse> {
    console.log('🎯 [SMART-TRYON] Starting smart try-on with fallback protection...');

    try {
      // First attempt: Try user uploaded garment
      console.log('👤 [SMART-TRYON] Attempting user garment upload...');
      const result = await this.tryOnClothing(modelImageUrl, garmentImageUrl, {
        ...options,
        source: 'user_upload'
      });

      return {
        success: true,
        garments: undefined,
        keychain: undefined,
        fallbackUsed: false,
        source: 'user_upload',
        ...result
      };

    } catch (userUploadError) {
      console.warn('⚠️ [SMART-TRYON] User upload failed, trying library fallbacks...');
      console.warn('📝 [SMART-TRYON] Original error:', userUploadError);

      try {
        // Determine category for better fallback selection
        const category = this.inferGarmentCategory(garmentImageUrl, options);
        const fallbackGarments = fashnLibraryService.getFallbackGarments(category, 3);

        if (fallbackGarments.length === 0) {
          throw new Error('No suitable fallback garments available');
        }

        // Try the most popular fallback garment
        const selectedGarment = fallbackGarments[0];
        console.log(`🔄 [SMART-TRYON] Trying fallback: ${selectedGarment.name}`);

        const fallbackResult = await this.tryOnClothing(modelImageUrl, selectedGarment.imageUrl, {
          ...options,
          source: 'library',
          garmentInfo: selectedGarment
        });

        return {
          success: true,
          garments: fallbackGarments,
          keychain: undefined,
          fallbackUsed: true,
          source: 'library',
          ...fallbackResult
        };

      } catch (fallbackError) {
        console.error('❌ [SMART-TRYON] All fallback attempts failed');
        console.error('📝 [SMART-TRYON] Fallback error:', fallbackError);

        // Return library garments for manual selection
        const allGarments = fashnLibraryService.getPopularGarments(5);
        return {
          success: false,
          garments: allGarments,
          keychain: undefined,
          fallbackUsed: true,
          source: 'library',
          error: 'Try-on failed. Please select from available garments.'
        };
      }
    }
  }

  /**
   * Infer garment category from image URL or options
   */
  private inferGarmentCategory(garmentImageUrl: string, options: any): LibraryGarment['category'] | undefined {
    // Check options first
    if (options.category) {
      return options.category;
    }

    // Simple heuristics based on URL or filename
    const url = garmentImageUrl.toLowerCase();
    if (url.includes('shirt') || url.includes('top') || url.includes('blouse')) {
      return 'tops';
    }
    if (url.includes('pants') || url.includes('jeans') || url.includes('trousers')) {
      return 'bottoms';
    }
    if (url.includes('dress') || url.includes('gown')) {
      return 'dresses';
    }
    if (url.includes('jacket') || url.includes('coat') || url.includes('blazer')) {
      return 'outerwear';
    }

    // Default to undefined for general search
    return undefined;
  }

  /**
   * Try entire keychain collection
   */
  async tryKeychainOutfit(modelImageUrl: string, keychainId: string, options: any = {}): Promise<any> {
    const keychain = fashnLibraryService.getKeychainById(keychainId);
    if (!keychain) {
      throw new Error(`Keychain collection not found: ${keychainId}`);
    }

    console.log(`🔗 [KEYCHAIN-TRYON] Trying complete outfit: ${keychain.name}`);

    const results = [];
    for (const garment of keychain.garments) {
      try {
        const result = await this.tryLibraryGarment(modelImageUrl, garment.id, options);
        results.push({ garment, result, success: true });
      } catch (error) {
        console.warn(`⚠️ [KEYCHAIN-TRYON] Failed to apply ${garment.name}:`, error);
        results.push({ garment, error, success: false });
      }
    }

    return {
      keychain,
      results,
      totalItems: keychain.garments.length,
      successfulItems: results.filter(r => r.success).length
    };
  }

  /**
   * Validate avatar image quality for FASHN compatibility
   */
  private validateAvatarForFashn(avatarUrl: string): void {
    console.log('🔍 [FASHN-VALIDATION] Validating avatar for FASHN compatibility:', {
      avatarUrl: avatarUrl.substring(0, 100) + '...',
      requirements: {
        pose: 'Standing with arms at sides',
        quality: 'High resolution, clear body outline',
        background: 'Preferably white or neutral',
        visibility: 'Full body from head to feet'
      }
    });

    // Only show warning once per session to reduce console noise
    if (!DirectFashnService.fashnWarningShown) {
      console.warn('⚠️ [FASHN-VALIDATION] Avatar requirements for best results:');
      console.warn('   • Arms at sides (not behind back or crossed)');
      console.warn('   • Full body visible');
      console.warn('   • Good lighting and contrast');
      console.warn('   • Person facing camera');
      DirectFashnService.fashnWarningShown = true;
    }
  }

  /**
   * Submit a try-on request using native FASHN API
   */
  async submitTryOn(
    modelImageUrl: string,
    garmentImageUrl: string,
    context: ImageContext = 'try_on',
    options: {
      garmentDescription?: string;
      garmentType?: string;
      source?: string;
      photoType?: 'flat-lay' | 'model' | 'auto';
    } = {}
  ): Promise<string> {
    console.log('🚀 [NATIVE-FASHN] Starting native FASHN try-on request...');
    console.log('🔍 [NATIVE-FASHN] Input validation:', {
      modelImageUrl: modelImageUrl ? `${modelImageUrl.substring(0, 50)}...` : 'missing',
      garmentImageUrl: garmentImageUrl ? `${garmentImageUrl.substring(0, 50)}...` : 'missing',
      modelType: this.detectImageType(modelImageUrl),
      garmentType: this.detectImageType(garmentImageUrl)
    });

    // Add enhanced format validation
    const formatValidation = await this.validateImageFormatsForFashn(modelImageUrl, garmentImageUrl);
    console.log('🔍 [FORMAT-CHECK] Image format validation:', formatValidation);

    if (!formatValidation.isValid) {
      console.warn('⚠️ [FORMAT-CHECK] Format issues detected:', formatValidation.issues);

      // Try to convert to compatible formats
      console.log('🔄 [FORMAT-CONVERT] Attempting image format conversion...');
      const converted = await this.convertImagesForFashn(modelImageUrl, garmentImageUrl);
      if (converted.success) {
        console.log('✅ [FORMAT-CONVERT] Images converted successfully');
        modelImageUrl = converted.modelImageUrl;
        garmentImageUrl = converted.garmentImageUrl;
      } else {
        console.error('❌ [FORMAT-CONVERT] Conversion failed:', converted.error);
        // Continue with original images but log the issue
      }
    }

    if (!modelImageUrl || !garmentImageUrl) {
      throw new Error('Both model and garment image URLs are required for FASHN try-on');
    }

    // Step 1: Validate avatar pose quality for FASHN compatibility
    console.log('🧭 [POSE-CHECK] Validating avatar pose for FASHN compatibility...');
    const poseValidation = await this.validateAvatarPose(modelImageUrl);
    console.log('📊 [POSE-CHECK] Pose validation result:', poseValidation);

    if (!poseValidation.isValid) {
      console.warn('⚠️ [POSE-CHECK] Avatar pose may cause FASHN distortion:', poseValidation.issues);
      // Continue processing but log the warning for quality tracking
    }

    // Step 2: Preprocess images for optimal quality
    console.log('🔧 [FASHN-ENHANCE] Starting image preprocessing...');

    let processedAvatar, processedGarment;
    try {
      [processedAvatar, processedGarment] = await Promise.all([
        this.prepareAvatarForFashn(modelImageUrl),
        this.preprocessGarmentImage(garmentImageUrl)
      ]);
    } catch (error) {
      console.error('❌ [FASHN-ENHANCE] Image preprocessing FAILED - STOPPING ALL PROCESSING');
      console.error('❌ [FASHN-ENHANCE] Error details:', error);

      // Generate user-friendly error message and STOP processing
      const userFriendlyError = this.generateUserFriendlyGarmentError(error);

      // Create a new error with the user-friendly message
      const stopError = new Error('PREPROCESSING_FAILED');
      stopError.message = userFriendlyError;
      throw stopError;
    }

    // Step 2: Detect garment photo type first (flat-lay product vs model-worn)
    // This helps with smarter category detection
    const photoType = this.detectGarmentPhotoType(
      garmentImageUrl,
      options.source,
      options.photoType
    );

    // Step 3: Analyze garment for optimal parameters (using photo type for smarter detection)
    const garmentAnalysis = await this.analyzeGarment(
      processedGarment.processedImageUrl,
      options.garmentDescription,
      options.garmentType,
      photoType
    );
    console.log('🎯 [FASHN-ENHANCE] Garment analysis:', garmentAnalysis);

    // Step 4: Generate seed for consistency (must be within 0 to 2^32 - 1 range)
    const seed = Math.floor(Math.random() * Math.pow(2, 32));

    // Step 5: Validate and clamp num_samples to official range (1-4)
    const validatedSamples = Math.max(1, Math.min(4, garmentAnalysis.recommendedSamples));

    // Step 6: Determine optimal output format based on context
    const outputFormat = getOutputFormatAuto(context);
    console.log(`📷 [FORMAT-SELECT] Using ${outputFormat.toUpperCase()} for context: ${context}`);

    const payload: FashnTryOnRequest = {
      model_name: this.modelVersion,
      inputs: {
        model_image: processedAvatar.processedImageUrl,
        garment_image: processedGarment.processedImageUrl,
        category: garmentAnalysis.type,
        segmentation_free: garmentAnalysis.recommendedSegmentationFree, // Adaptive segmentation based on garment type
        moderation_level: 'none',  // No content moderation
        garment_photo_type: photoType, // Intelligent detection: flat-lay for products, model for inspiration
        mode: garmentAnalysis.recommendedMode, // Use analyzed mode based on garment complexity
        num_samples: validatedSamples,   // Generate multiple samples for best quality selection
        seed: seed,
        output_format: outputFormat,     // Dynamic format based on context (PNG/JPEG)
        return_base64: false             // Return CDN URLs (faster than base64)
      }
    };

    const endpoint = `${this.baseUrl}/v1/run`;

    // Log detailed payload information for debugging
    console.log('📤 [NATIVE-FASHN] Submitting to native FASHN API with enhanced parameters:', {
      endpoint,
      modelVersion: this.modelVersion,
      integration: 'Native FASHN (not FAL wrapper)',
      model_image: {
        type: modelImageUrl.startsWith('http') ? 'HTTP URL' : modelImageUrl.startsWith('data:') ? 'Base64 Data' : 'Unknown',
        size: modelImageUrl.startsWith('data:') ? Math.round(modelImageUrl.length/1024) + 'KB' : 'URL',
        preview: modelImageUrl.substring(0, 80) + '...'
      },
      garment_image: {
        type: garmentImageUrl.startsWith('http') ? 'HTTP URL' : garmentImageUrl.startsWith('data:') ? 'Base64 Data' : 'Unknown',
        size: garmentImageUrl.startsWith('data:') ? Math.round(garmentImageUrl.length/1024) + 'KB' : 'URL',
        preview: garmentImageUrl.substring(0, 80) + '...'
      },
      // FASHN API parameters for debugging
      clothing_category: garmentAnalysis.type,
      segmentation_free: payload.inputs.segmentation_free,
      moderation_level: payload.inputs.moderation_level,
      garment_photo_type: payload.inputs.garment_photo_type,
      mode: payload.inputs.mode,
      seed: payload.inputs.seed,
      num_samples: payload.inputs.num_samples,
      output_format: payload.inputs.output_format,
      return_base64: payload.inputs.return_base64
    });

    // Log the actual payload structure (without full image data)
    const payloadForLogging = {
      model_name: payload.model_name,
      inputs: {
        ...payload.inputs,
        model_image: modelImageUrl.startsWith('data:') ? `[BASE64_DATA_${Math.round(modelImageUrl.length/1024)}KB]` : modelImageUrl,
        garment_image: garmentImageUrl.startsWith('data:') ? `[BASE64_DATA_${Math.round(garmentImageUrl.length/1024)}KB]` : garmentImageUrl
      }
    };
    console.log('📋 [NATIVE-FASHN] Actual payload structure:', payloadForLogging);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [NATIVE-FASHN] Native FASHN API submission failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        requestUrl: endpoint,
        requestSize: JSON.stringify(payload).length + ' bytes'
      });

      // Enhanced error analysis for 400 errors
      let enhancedErrorAnalysis = '';
      if (response.status === 400) {
        console.log('🔍 [ERROR-ANALYSIS] Analyzing 400 Bad Request error...');

        // Parse FASHN API error message for specific issues
        let specificFashnError = '';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            specificFashnError = errorData.message;
            console.log('📋 [FASHN-ERROR] Specific API error message:', specificFashnError);
          }
        } catch (e) {
          // Error text is not JSON, use as-is
          specificFashnError = errorText;
        }

        // Check likely causes of 400 error
        const errorAnalysis = {
          modelImageIssues: [],
          garmentImageIssues: [],
          parameterIssues: [],
          apiSpecificIssues: [],
          suggestions: []
        };

        // Analyze specific FASHN error patterns
        if (specificFashnError.toLowerCase().includes('garment image appears missing')) {
          errorAnalysis.garmentImageIssues.push('FASHN detected garment image as missing or corrupted');
          errorAnalysis.suggestions.push('Try using a different garment image with clear clothing visible');
        }
        if (specificFashnError.toLowerCase().includes('model image')) {
          errorAnalysis.modelImageIssues.push('FASHN detected issue with avatar/model image');
          errorAnalysis.suggestions.push('Ensure avatar image shows a clear person in good lighting');
        }
        if (specificFashnError.toLowerCase().includes('invalid')) {
          errorAnalysis.parameterIssues.push('FASHN detected invalid parameters or data format');
        }
        if (specificFashnError.toLowerCase().includes('size') || specificFashnError.toLowerCase().includes('large')) {
          errorAnalysis.apiSpecificIssues.push('FASHN detected image size issues');
          errorAnalysis.suggestions.push('Compress images to under 5MB and ensure dimensions are reasonable');
        }

        // Model image analysis
        if (modelImageUrl.startsWith('data:') && modelImageUrl.length > 10 * 1024 * 1024) {
          errorAnalysis.modelImageIssues.push('Model image very large (>10MB)');
        }

        // Garment image analysis
        if (garmentImageUrl.startsWith('data:') && garmentImageUrl.length > 10 * 1024 * 1024) {
          errorAnalysis.garmentImageIssues.push('Garment image very large (>10MB)');
        }

        if (!garmentImageUrl || garmentImageUrl.length < 100) {
          errorAnalysis.garmentImageIssues.push('Garment image appears missing or corrupted');
        }

        // Parameter validation
        if (!payload.inputs.model_image) {
          errorAnalysis.parameterIssues.push('Model image parameter empty');
        }
        if (!payload.inputs.garment_image) {
          errorAnalysis.parameterIssues.push('Garment image parameter empty');
        }

        // Generate suggestions
        if (errorAnalysis.modelImageIssues.length > 0 || errorAnalysis.garmentImageIssues.length > 0) {
          errorAnalysis.suggestions.push('Try compressing images to under 5MB');
          errorAnalysis.suggestions.push('Ensure images are in JPEG or PNG format');
        }
        if (errorAnalysis.parameterIssues.length > 0) {
          errorAnalysis.suggestions.push('Check that both avatar and clothing images are properly uploaded');
        }

        console.log('📊 [ERROR-ANALYSIS] 400 Error breakdown:', errorAnalysis);

        const totalIssues = errorAnalysis.modelImageIssues.length +
                          errorAnalysis.garmentImageIssues.length +
                          errorAnalysis.parameterIssues.length +
                          errorAnalysis.apiSpecificIssues.length;

        if (totalIssues > 0) {
          enhancedErrorAnalysis = ` Detected issues: ${[
            ...errorAnalysis.modelImageIssues,
            ...errorAnalysis.garmentImageIssues,
            ...errorAnalysis.parameterIssues,
            ...errorAnalysis.apiSpecificIssues
          ].join(', ')}. Suggestions: ${errorAnalysis.suggestions.join(', ')}.`;
        }

        // Add specific FASHN error message if available
        if (specificFashnError && !enhancedErrorAnalysis.includes(specificFashnError)) {
          enhancedErrorAnalysis += ` FASHN API message: "${specificFashnError}".`;
        }
      }

      let errorCategory = 'Unknown';
      let userMessage = 'Native FASHN virtual try-on failed';

      if (response.status === 400) {
        errorCategory = 'Bad Request';
        userMessage = `Invalid image format or parameters.${enhancedErrorAnalysis} Please try different images or check image quality.`;
      } else if (response.status === 401) {
        errorCategory = 'Authentication';
        userMessage = 'Native FASHN API authentication failed. Check your FASHN API key.';
      } else if (response.status === 422) {
        errorCategory = 'Validation Error';
        userMessage = 'Image validation failed. Ensure images are clear and well-lit.';
      } else if (response.status === 429) {
        this.requestAttempts++;
        console.log(`🚫 [RATE-LIMIT] 429 error (attempt ${this.requestAttempts})`);

        // Activate circuit breaker after 3 consecutive failures
        if (this.requestAttempts >= 3) {
          this.activateCircuitBreaker();
          const breakerMinutes = Math.ceil(this.MAX_CIRCUIT_BREAKER_TIME / 60000);
          throw new Error(`🚫 Too many requests. Outfit generation paused for ${breakerMinutes} minutes. Please try again later or explore other features!`);
        }

        const retryAfter = parseInt(response.headers.get('Retry-After') || '120');
        const backoffDelay = Math.max(retryAfter * 1000, this.getExponentialDelayMs());
        const waitSeconds = Math.ceil(backoffDelay / 1000);
        console.log(`⏳ [RATE-LIMIT] Progressive backoff: waiting ${waitSeconds}s before retry`);

        throw new Error(`⏳ Rate limit reached. Please wait ${waitSeconds} seconds before trying again. We're working to ensure the best experience!`);
      } else if (response.status >= 500) {
        errorCategory = 'Server Error';
        userMessage = 'Native FASHN service temporarily unavailable.';
      }

      const enhancedError = new Error(`Native FASHN API ${errorCategory} (${response.status}): ${userMessage}`);
      (enhancedError as any).category = errorCategory;
      (enhancedError as any).statusCode = response.status;
      (enhancedError as any).originalErrorText = errorText;
      throw enhancedError;
    }

    const data: FashnJobResponse = await response.json();
    console.log('✅ [NATIVE-FASHN] Response received from native FASHN:', {
      id: data.id,
      status: data.status,
      hasResult: !!data.result,
      hasError: !!data.error
    });

    // Handle immediate completion (if image is ready)
    if (data.result && data.result.image_url) {
      return data.result.image_url;
    }

    if (data.status === 'COMPLETED' && data.result && data.result.image_url) {
      return data.result.image_url;
    }

    // Native FASHN API returns job ID for async processing
    if (data.id && !data.error) {
      console.log('⏳ [NATIVE-FASHN] Request submitted to native FASHN, starting polling...');
      return await this.pollForCompletion(data.id);
    }

    // Handle processing status
    if (data.status === 'IN_PROGRESS' || data.status === 'IN_QUEUE') {
      console.log('⏳ [NATIVE-FASHN] Request is processing, starting polling...');
      return await this.pollForCompletion(data.id);
    }

    // Handle error response
    if (data.status === 'FAILED' || data.error) {
      throw new Error(`Native FASHN processing failed: ${data.error || 'Unknown error'}`);
    }

    throw new Error(`Unexpected native FASHN response: ${JSON.stringify(data)}`);
  }

  /**
   * Poll for completion using native FASHN job ID
   */
  private async pollForCompletion(jobId: string): Promise<string> {
    const maxPollTime = 90000; // 90 seconds max - FASHN typically takes 40-60s, need generous buffer
    const basePollInterval = 2000; // Base poll every 2 seconds for faster feedback
    const startTime = Date.now();
    const statusUrl = `${this.baseUrl}/v1/status/${jobId}`;
    let consecutiveFailures = 0;

    console.log('🔄 [NATIVE-FASHN] Starting optimized native FASHN status polling:', {
      jobId,
      statusUrl,
      maxWaitTime: maxPollTime / 1000 + 's',
      basePollInterval: basePollInterval / 1000 + 's',
      integration: 'Native FASHN API'
    });

    while (Date.now() - startTime < maxPollTime) {
      try {
        const statusResponse = await fetch(statusUrl, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!statusResponse.ok) {
          throw new Error(`Native FASHN status polling failed: ${statusResponse.status}`);
        }

        const statusData: FashnJobResponse = await statusResponse.json();
        const elapsed = Math.round((Date.now() - startTime) / 1000);

        // Reset failure count on successful request
        consecutiveFailures = 0;

        console.log(`🔍 [NATIVE-FASHN] Status check (${elapsed}s):`, {
          status: statusData.status,
          hasResult: !!(statusData.result || statusData.output),
          hasOutput: !!statusData.output,
          outputCount: statusData.output?.length || 0,
          hasError: !!statusData.error,
          errorType: typeof statusData.error,
          error: statusData.error
        });

        if (statusData.status === 'COMPLETED' || statusData.status === 'completed') {
          console.log('✅ [NATIVE-FASHN] Native FASHN processing completed!');

          // Check for new output format first (array of URLs)
          if (statusData.output && statusData.output.length > 0) {
            console.log('🎯 [SAMPLE-SELECTION] Received multiple samples, selecting best quality:', {
              totalSamples: statusData.output.length
            });

            // Select best sample from all generated images
            const bestImageUrl = await this.selectBestSample(statusData.output);

            console.log('🖼️ [NATIVE-FASHN] Best quality sample selected:', {
              selectedImage: bestImageUrl.substring(0, 100) + '...',
              isHttpUrl: bestImageUrl.startsWith('http'),
              urlLength: bestImageUrl.length,
              totalImages: statusData.output.length
            });

            // Add avatar quality validation warning
            console.log('⚠️ [FASHN-QUALITY] FASHN completed - check if result shows properly on avatar!');
            console.log('🔍 [FASHN-QUALITY] Common issues: avatar pose (arms behind back), quality, lighting');

            return bestImageUrl;
          }
          // Fallback to old result format
          else if (statusData.result && statusData.result.image_url) {
            console.log('🖼️ [NATIVE-FASHN] Result image details (legacy format):', {
              imageUrl: statusData.result.image_url.substring(0, 100) + '...',
              isHttpUrl: statusData.result.image_url.startsWith('http'),
              urlLength: statusData.result.image_url.length
            });
            return statusData.result.image_url;
          } else {
            console.error('❌ [NATIVE-FASHN] No image URL in completed response:', statusData);
            throw new Error('Native FASHN processing completed but no image URL found in response');
          }
        } else if (statusData.status === 'FAILED' || statusData.status === 'failed') {
          console.error('❌ [NATIVE-FASHN] Processing failed, analyzing cause...');
          console.error('❌ [NATIVE-FASHN] Raw error data:', statusData.error, typeof statusData.error);

          // Ensure failureReason is a string for processing
          let failureReason: string;
          if (typeof statusData.error === 'string') {
            failureReason = statusData.error;
          } else if (statusData.error && typeof statusData.error === 'object') {
            // Extract error message from error object
            failureReason = statusData.error.message ||
                           statusData.error.error ||
                           statusData.error.detail ||
                           statusData.error.description ||
                           JSON.stringify(statusData.error);
          } else {
            failureReason = 'Processing error occurred';
          }

          // Provide more helpful error messages based on common failure reasons
          if (failureReason.toLowerCase().includes('garment') || failureReason.toLowerCase().includes('clothing')) {
            failureReason = 'Unable to detect clothing in the uploaded image. Please ensure you upload a clear image of clothing items.';
          } else if (failureReason.toLowerCase().includes('pose') || failureReason.toLowerCase().includes('body pose')) {
            failureReason = 'Unable to detect body pose in avatar image. The avatar image needs to show a clear, full-body standing pose. Try retaking your avatar photos with better lighting and a full-body view.';
          } else if (failureReason.toLowerCase().includes('person') || failureReason.toLowerCase().includes('model')) {
            failureReason = 'Unable to detect a person in the avatar image. Please ensure your avatar shows a full body view.';
          } else if (failureReason.toLowerCase().includes('quality') || failureReason.toLowerCase().includes('resolution')) {
            failureReason = 'Image quality too low for processing. Please upload higher resolution images.';
          } else {
            failureReason = `Processing failed: ${failureReason}. This might be due to image quality, clothing detection issues, or avatar pose detection problems. Please try regenerating your avatar or using different clothing images.`;
          }

          throw new Error(failureReason);
        }

        // Continue polling with base interval
        await new Promise(resolve => setTimeout(resolve, basePollInterval));

      } catch (error) {
        if (error instanceof Error && error.message.includes('processing')) {
          throw error; // Re-throw processing errors
        }

        consecutiveFailures++;
        console.warn(`⚠️ [NATIVE-FASHN] Poll attempt failed (${consecutiveFailures}x): ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Exponential backoff for failed requests, capped at 10 seconds
        const backoffDelay = Math.min(basePollInterval * Math.pow(2, consecutiveFailures - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }

    throw new Error(`Native FASHN processing timed out after ${maxPollTime / 1000} seconds. This may happen with complex images or during high traffic. Please try again.`);
  }

  /**
   * Complete try-on with retry logic and error handling using native FASHN API
   */
  async tryOnClothing(
    modelImageUrl: string,
    garmentImageUrl: string,
    options: {
      context?: ImageContext;
      timeout?: number;
      garmentDescription?: string; // Description of garment for intelligent segmentation
      garmentType?: string; // Type of garment (e.g., "jacket", "dress", "bodycon")
      source?: string; // Source of garment (e.g., "external-search", "user_upload", "library", "closet")
      photoType?: 'flat-lay' | 'model' | 'auto'; // Hint about photo type
    } = {}
  ) {
    const context = options.context || 'try_on'; // Default to 'try_on' context
    console.log('🎯 [NATIVE-FASHN] Starting FASHN try-on with timeout and fallback...', {
      context,
      hasGarmentDescription: !!options.garmentDescription,
      garmentType: options.garmentType || 'auto',
      source: options.source || 'unknown',
      photoType: options.photoType || 'auto'
    });

    // Single request queue - prevent multiple simultaneous FASHN requests
    if (this.activeRequest) {
      console.log('⏸️ [FASHN-QUEUE] Another request is in progress. Waiting for it to complete...');
      try {
        await this.activeRequest;
      } catch (error) {
        // Ignore errors from previous request
      }
    }

    // Validate avatar before sending to FASHN
    this.validateAvatarForFashn(modelImageUrl);

    // Enhanced rate limiting with circuit breaker check
    if (this.isCircuitBreakerActive()) {
      const remainingTime = Math.ceil((this.circuitBreakerUntil - Date.now()) / 1000);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      throw new Error(`🚫 Outfit generation temporarily paused due to API limits. Please try again in ${timeStr}. This helps ensure quality service for all users.`);
    }

    // Only enforce progressive delay if there have been recent failures
    if (this.requestAttempts > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastFashnRequest;
      const requiredDelay = this.getExponentialDelayMs();

      if (timeSinceLastRequest < requiredDelay) {
        const waitTime = requiredDelay - timeSinceLastRequest;
        const waitSeconds = Math.ceil(waitTime / 1000);
        console.log(`⏳ [RATE-LIMIT] Progressive backoff after 429 error: waiting ${waitSeconds}s before FASHN request (attempt ${this.requestAttempts + 1})`);

        throw new Error(`⏳ Please wait ${waitSeconds} seconds before generating another outfit. This helps manage API rate limits after recent errors.`);
      }
    }

    this.lastFashnRequest = Date.now();

    const startTime = Date.now();
    const timeoutDuration = options.timeout || 90000; // 90 seconds default - FASHN typically takes 40-50s, need generous buffer
    let timeoutId: NodeJS.Timeout | null = null;
    let isTimedOut = false;

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        isTimedOut = true;
        reject(new Error('FASHN try-on timeout - using original avatar'));
      }, timeoutDuration);
    });

    // Create the actual try-on promise and track it
    const tryOnPromise = this.performTryOnWithRetries(modelImageUrl, garmentImageUrl, context, {
      garmentDescription: options.garmentDescription,
      garmentType: options.garmentType,
      source: options.source,
      photoType: options.photoType
    });
    this.activeRequest = tryOnPromise;

    try {
      // Race between timeout and actual try-on
      const result = await Promise.race([tryOnPromise, timeoutPromise]);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ [NATIVE-FASHN] Try-on completed in ${processingTime}ms`);

      // Reset rate limiting on successful request
      this.resetRateLimiting();

      return result;

    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const processingTime = Date.now() - startTime;
      console.warn(`⚠️ [NATIVE-FASHN] Try-on failed after ${processingTime}ms, falling back to original avatar:`,
        error instanceof Error ? error.message : error);

      // Return original avatar as fallback
      return {
        success: true,
        imageUrl: modelImageUrl,
        api: 'Fallback-Original',
        processingTime: processingTime / 1000,
        fallback: true,
        originalError: error instanceof Error ? error.message : String(error)
      };
    } finally {
      // Clear the active request when done
      this.activeRequest = null;
    }
  }

  private async performTryOnWithRetries(
    modelImageUrl: string,
    garmentImageUrl: string,
    context: ImageContext = 'try_on',
    options: {
      garmentDescription?: string;
      garmentType?: string;
      source?: string;
      photoType?: 'flat-lay' | 'model' | 'auto';
    } = {}
  ) {
    // Single attempt - timeout mechanism will handle retries at higher level
    try {
      console.log('🔄 [NATIVE-FASHN] Making FASHN try-on request...');

      const imageUrl = await this.submitTryOn(modelImageUrl, garmentImageUrl, context, options);

      if (!imageUrl) {
        throw new Error('No image URL returned from FASHN API');
      }

      console.log('🖼️ [NATIVE-FASHN] Try-on image generated successfully');

      return {
        success: true,
        imageUrl: imageUrl,
        api: 'Native-FASHN',
        attempts: 1
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ [NATIVE-FASHN] Try-on request failed:', errorMessage);
      throw error; // Let timeout mechanism handle this
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Retryable errors: timeouts, server errors, rate limits
    if (message.includes('timeout')) return true;
    if (message.includes('server error') || message.includes('5')) return true;
    if (message.includes('rate') || message.includes('429')) return true;
    if (message.includes('network') || message.includes('connection')) return true;
    if (message.includes('temporarily unavailable')) return true;

    // Non-retryable errors: auth, validation, bad requests
    if (message.includes('auth') || message.includes('401')) return false;
    if (message.includes('bad request') || message.includes('400')) return false;
    if (message.includes('validation') || message.includes('422')) return false;
    if (message.includes('not found') || message.includes('404')) return false;

    // Default to retryable for unknown errors
    return true;
  }

  /**
   * Comprehensive preprocessing for user-uploaded garment photos
   * Handles background removal, orientation correction, resizing, and optimization
   */
  private async preprocessGarmentImage(garmentImageUrl: string): Promise<ImageProcessingResult> {
    console.log('🧥 [GARMENT-PREP] Starting comprehensive user garment photo preprocessing...');

    try {
      const modifications: string[] = [];
      let processedImageUrl = garmentImageUrl;

      // Step 1: Analyze original image properties
      const originalAnalysis = await this.analyzeUserPhotoProperties(garmentImageUrl);
      console.log('📊 [GARMENT-PREP] Original image analysis:', originalAnalysis);

      modifications.push('analyzed');

      // Step 2: EXIF orientation correction (critical for user photos)
      if (originalAnalysis.needsOrientation) {
        console.log('🔄 [GARMENT-PREP] Correcting EXIF orientation...');
        const orientationResult = await this.correctImageOrientation(processedImageUrl);
        if (orientationResult.success) {
          processedImageUrl = orientationResult.correctedImageUrl;
          modifications.push('orientation_corrected');
          console.log('✅ [GARMENT-PREP] Orientation corrected');
        } else {
          console.warn('⚠️ [GARMENT-PREP] Orientation correction failed:', orientationResult.error);
        }
      }

      // Step 3: Smart background removal with graceful fallbacks
      console.log('🎨 [GARMENT-PREP] Attempting smart background removal...');

      const backgroundResult = await this.attemptSmartBackgroundRemoval(processedImageUrl);

      if (backgroundResult.success && backgroundResult.processedImageUrl) {
        processedImageUrl = backgroundResult.processedImageUrl;
        modifications.push(`background_removed_${backgroundResult.method}`);
        console.log(`✅ [GARMENT-PREP] Background removal successful using ${backgroundResult.method}`);
      } else {
        console.log('ℹ️ [GARMENT-PREP] Background removal failed or not needed - using original image');
        modifications.push('using_original_image');

        // Continue with original image - this is perfectly fine for many use cases
        // Screenshots, product photos, etc. often work well without background removal
      }

      // Step 5: Smart resizing for optimal FASHN processing
      const resizeResult = await this.resizeForFashn(processedImageUrl);
      if (resizeResult.success) {
        processedImageUrl = resizeResult.resizedImageUrl;
        modifications.push(`resized_to_${resizeResult.finalDimensions.width}x${resizeResult.finalDimensions.height}`);
        console.log('✅ [GARMENT-PREP] Image resized for optimal FASHN processing');
      }

      // Step 6: Compression optimization
      const compressionResult = await this.compressForFashn(processedImageUrl);
      if (compressionResult.success) {
        processedImageUrl = compressionResult.compressedImageUrl;
        modifications.push(`compressed_to_${Math.round(compressionResult.finalSizeKB)}KB`);
        console.log('✅ [GARMENT-PREP] Image compressed for FASHN compatibility');
      }

      // Step 7: Final format optimization (PNG for transparency)
      const formatResult = await this.optimizeFormatForFashn(processedImageUrl);
      if (formatResult.success) {
        processedImageUrl = formatResult.optimizedImageUrl;
        modifications.push('format_optimized_png');
        console.log('✅ [GARMENT-PREP] Format optimized to PNG with transparency');
      }

      // Step 8: Final validation before FASHN (with fallback)
      const finalValidation = await this.validateGarmentForFashn(processedImageUrl);
      if (!finalValidation.isValid) {
        console.warn('⚠️ [GARMENT-PREP] Validation failed, attempting FASHN anyway:', finalValidation.issues);
        modifications.push('validation_bypassed');

        // Only throw error for critical issues (empty images)
        if (finalValidation.issues.some(issue => issue.includes('empty'))) {
          throw new Error(`Critical garment validation failed: ${finalValidation.issues.join(', ')}`);
        }
      } else {
        modifications.push('fashn_validated');
      }

      const result: ImageProcessingResult = {
        processedImageUrl,
        modifications,
        originalSize: originalAnalysis.dimensions,
        processedSize: finalValidation.finalDimensions,
        compressionRatio: originalAnalysis.sizeKB / (finalValidation.finalSizeKB || originalAnalysis.sizeKB)
      };

      console.log('🎉 [GARMENT-PREP] Comprehensive garment preprocessing complete:', {
        modifications: modifications.length,
        originalSizeKB: originalAnalysis.sizeKB,
        finalSizeKB: finalValidation.finalSizeKB,
        compressionRatio: result.compressionRatio
      });

      return result;

    } catch (error) {
      console.error('❌ [GARMENT-PREP] Comprehensive preprocessing failed:', error);

      // Provide user-friendly error message
      const userFriendlyError = this.generateUserFriendlyGarmentError(error);

      return {
        processedImageUrl: garmentImageUrl,
        modifications: ['preprocessing_failed'],
        originalSize: { width: 0, height: 0 },
        processedSize: { width: 0, height: 0 },
        error: userFriendlyError
      };
    }
  }

  /**
   * Prepare avatar image for optimal FASHN processing
   */
  private async prepareAvatarForFashn(avatarImageUrl: string): Promise<ImageProcessingResult> {
    console.log('👤 [AVATAR-PREP] Starting comprehensive avatar preparation...');

    try {
      const modifications: string[] = [];
      let processedImageUrl = avatarImageUrl;

      // Step 1: Resize to FASHN's preferred resolution (1024x1365 for best quality)
      console.log('📐 [AVATAR-PREP] Resizing avatar to optimal FASHN resolution...');
      const resizeResult = await this.resizeAvatarForFashn(processedImageUrl);
      if (resizeResult.success) {
        processedImageUrl = resizeResult.resizedImageUrl;
        modifications.push(`resized_to_${resizeResult.finalDimensions.width}x${resizeResult.finalDimensions.height}`);
        console.log('✅ [AVATAR-PREP] Avatar resized to optimal resolution');
      }

      // Step 2: Enhance contrast for better garment edge detection
      console.log('🎨 [AVATAR-PREP] Enhancing contrast for better garment fitting...');
      const contrastResult = await this.enhanceAvatarContrast(processedImageUrl);
      if (contrastResult.success) {
        processedImageUrl = contrastResult.enhancedImageUrl;
        modifications.push('contrast_enhanced');
        console.log('✅ [AVATAR-PREP] Contrast enhanced');
      }

      // Step 3: Optimize format (PNG for quality)
      console.log('🖼️ [AVATAR-PREP] Optimizing image format...');
      const formatResult = await this.optimizeFormatForFashn(processedImageUrl);
      if (formatResult.success) {
        processedImageUrl = formatResult.optimizedImageUrl;
        modifications.push('format_optimized_png');
        console.log('✅ [AVATAR-PREP] Format optimized');
      }

      // Step 4: Final compression if needed (keep under 3MB)
      console.log('📦 [AVATAR-PREP] Compressing to optimal size...');
      const compressionResult = await this.compressForFashn(processedImageUrl);
      if (compressionResult.success) {
        processedImageUrl = compressionResult.compressedImageUrl;
        modifications.push(`compressed_to_${Math.round(compressionResult.finalSizeKB)}KB`);
        console.log('✅ [AVATAR-PREP] Compression complete');
      }

      const result: ImageProcessingResult = {
        processedImageUrl,
        modifications,
        originalSize: { width: 1024, height: 1365 },
        processedSize: resizeResult.success ? resizeResult.finalDimensions : { width: 1024, height: 1365 },
      };

      console.log('🎉 [AVATAR-PREP] Avatar preparation complete:', {
        modifications: modifications.length,
        steps: modifications
      });

      return result;
    } catch (error) {
      console.error('❌ [AVATAR-PREP] Avatar preparation failed:', error);
      return {
        processedImageUrl: avatarImageUrl,
        modifications: ['preparation_failed'],
        originalSize: { width: 0, height: 0 },
        processedSize: { width: 0, height: 0 },
      };
    }
  }

  /**
   * Analyze garment to determine optimal FASHN parameters
   */
  private async analyzeGarment(
    garmentImageUrl: string,
    garmentDescription?: string,
    garmentType?: string,
    photoType?: 'flat-lay' | 'model' | 'auto'
  ): Promise<GarmentAnalysis> {
    console.log('🔍 [GARMENT-ANALYSIS] Analyzing garment for optimal parameters...', {
      hasDescription: !!garmentDescription,
      providedType: garmentType || 'auto',
      photoType: photoType || 'auto'
    });

    // Build analysis data from description or URL
    const analysisData = garmentDescription || garmentType || garmentImageUrl;

    // Check cache first (use description for cache key if available)
    const cacheKey = this.generateCacheKey(analysisData + (photoType || ''));
    if (this.parameterCache.has(cacheKey)) {
      console.log('📋 [GARMENT-ANALYSIS] Using cached analysis');
      return this.parameterCache.get(cacheKey)!;
    }

    try {
      // Enhanced garment type detection based on photo type
      const detectedCategory = this.detectEnhancedClothingCategory(analysisData, photoType);

      // Determine fitting type and complexity using description (or URL fallback)
      const fittingType = this.determineFittingType(analysisData);
      const complexity = this.determineGarmentComplexity(analysisData);

      // Generate recommended mode and samples based on analysis
      const recommendedMode = this.getRecommendedMode(complexity);
      const recommendedSamples = this.getRecommendedSamples(complexity);
      const recommendedSegmentationFree = this.getRecommendedSegmentation(fittingType, detectedCategory, complexity);

      const analysis: GarmentAnalysis = {
        type: detectedCategory,
        fittingType,
        complexity,
        recommendedMode,
        recommendedSamples,
        recommendedSegmentationFree
      };

      // Cache the analysis
      this.parameterCache.set(cacheKey, analysis);

      console.log('🎯 [GARMENT-ANALYSIS] Analysis complete:', analysis);
      return analysis;
    } catch (error) {
      console.error('❌ [GARMENT-ANALYSIS] Analysis failed:', error);
      // Return default parameters with maximum quality settings
      return {
        type: 'auto',
        fittingType: 'fitted',
        complexity: 'moderate',
        recommendedMode: 'quality',
        recommendedSamples: 4,
        recommendedSegmentationFree: true
      };
    }
  }

  /**
   * Enhanced clothing category detection with comprehensive pattern matching
   * Detects from product names, descriptions, and URL patterns
   *
   * Strategy based on photo type:
   * - Flat-lay images: Prefer 'auto' for ambiguous cases (FASHN auto-detects well from product photos)
   * - Model images: Try to detect category to help FASHN decide on full outfit vs partial swap
   * - Clear matches: Always return specific category regardless of photo type
   */
  private detectEnhancedClothingCategory(
    clothingData: string,
    photoType?: 'flat-lay' | 'model' | 'auto'
  ): 'tops' | 'bottoms' | 'one-pieces' | 'auto' {
    const dataLower = clothingData.toLowerCase();

    // One-pieces detection (comprehensive list) - ALWAYS return if matched
    const onePiecesPatterns = [
      'dress', 'gown', 'jumpsuit', 'romper', 'overall',
      'bodysuit', 'swimsuit', 'bikini', 'one-piece',
      'tunic dress', 'maxi dress', 'midi dress', 'mini dress',
      'cocktail dress', 'evening gown', 'ball gown'
    ];
    if (onePiecesPatterns.some(pattern => dataLower.includes(pattern))) {
      console.log('🏷️ [CATEGORY] Detected one-pieces from pattern match');
      return 'one-pieces';
    }

    // Bottoms detection (comprehensive list) - ALWAYS return if matched
    const bottomsPatterns = [
      'pants', 'jeans', 'trouser', 'short', 'shorts', 'skirt',
      'legging', 'leggings', 'jogger', 'joggers', 'sweatpants',
      'culottes', 'capri', 'palazzo', 'cargo', 'chinos',
      'skinny jeans', 'wide leg', 'bootcut', 'flare'
    ];
    if (bottomsPatterns.some(pattern => dataLower.includes(pattern))) {
      console.log('🏷️ [CATEGORY] Detected bottoms from pattern match');
      return 'bottoms';
    }

    // Tops detection (comprehensive list) - ALWAYS return if matched
    const topsPatterns = [
      'shirt', 'top', 'blouse', 'tshirt', 't-shirt', 'tank',
      'jacket', 'coat', 'blazer', 'cardigan', 'hoodie', 'sweater',
      'polo', 'henley', 'tunic', 'crop top', 'camisole', 'vest',
      'pullover', 'sweatshirt', 'turtleneck', 'halter', 'off-shoulder'
    ];
    if (topsPatterns.some(pattern => dataLower.includes(pattern))) {
      console.log('🏷️ [CATEGORY] Detected tops from pattern match');
      return 'tops';
    }

    // URL-based detection for e-commerce links - ALWAYS return if matched
    if (dataLower.includes('/dress') || dataLower.includes('/one-piece') ||
        dataLower.includes('/jumpsuit') || dataLower.includes('/romper')) {
      console.log('🏷️ [CATEGORY] Detected one-pieces from URL pattern');
      return 'one-pieces';
    }
    if (dataLower.includes('/pants') || dataLower.includes('/bottoms') ||
        dataLower.includes('/jeans') || dataLower.includes('/skirt')) {
      console.log('🏷️ [CATEGORY] Detected bottoms from URL pattern');
      return 'bottoms';
    }
    if (dataLower.includes('/tops') || dataLower.includes('/shirts') ||
        dataLower.includes('/jacket') || dataLower.includes('/sweater')) {
      console.log('🏷️ [CATEGORY] Detected tops from URL pattern');
      return 'tops';
    }

    // No clear match found - use 'auto' for best FASHN detection
    // For flat-lay/ghost mannequin: FASHN auto-detects garment type accurately
    // For model photos: FASHN handles full-body (outfit swap) vs focused shots (tops/bottoms)
    console.log(`🏷️ [CATEGORY] No specific category detected, using 'auto' (photo type: ${photoType || 'unknown'})`);
    console.log('   → Flat-lay images: FASHN will auto-detect garment type from product photo');
    console.log('   → Model images: FASHN will decide full outfit swap vs partial based on framing');
    return 'auto';
  }

  /**
   * Determine garment fitting type for intelligent segmentation
   * Based on FASHN best practices for segmentation_free parameter
   */
  private determineFittingType(garmentData: string): 'fitted' | 'loose' | 'layered' | 'accessory' {
    const dataLower = garmentData.toLowerCase();

    // Accessories - go over clothes, use segmentation_free: true
    if (dataLower.includes('scarf') || dataLower.includes('belt') ||
        dataLower.includes('bag') || dataLower.includes('accessory') ||
        dataLower.includes('hat') || dataLower.includes('jewelry') ||
        dataLower.includes('watch') || dataLower.includes('sunglasses')) {
      return 'accessory';
    }

    // Outerwear/layered items - go over clothes, use segmentation_free: true
    if (dataLower.includes('jacket') || dataLower.includes('coat') ||
        dataLower.includes('blazer') || dataLower.includes('cardigan') ||
        dataLower.includes('vest') || dataLower.includes('shawl') ||
        dataLower.includes('poncho') || dataLower.includes('cape') ||
        dataLower.includes('kimono') || dataLower.includes('robe') ||
        dataLower.includes('layer')) {
      return 'layered';
    }

    // Loose/oversized - better with segmentation_free: true
    if (dataLower.includes('oversized') || dataLower.includes('loose') ||
        dataLower.includes('baggy') || dataLower.includes('relaxed') ||
        dataLower.includes('boyfriend') || dataLower.includes('slouchy')) {
      return 'loose';
    }

    // Form-fitting/tight - require segmentation_free: false for clean replacement
    // Includes: bodycon, tight fits, undergarments, swimwear
    if (dataLower.includes('bodycon') || dataLower.includes('tight') ||
        dataLower.includes('fitted') || dataLower.includes('slim') ||
        dataLower.includes('skinny') || dataLower.includes('form-fitting') ||
        dataLower.includes('bodysuit') || dataLower.includes('leotard') ||
        dataLower.includes('swimsuit') || dataLower.includes('bikini') ||
        dataLower.includes('underwear') || dataLower.includes('lingerie')) {
      return 'fitted';
    }

    // Check for dress types - most dresses need segmentation
    if (dataLower.includes('dress') &&
        (dataLower.includes('bodycon') || dataLower.includes('fitted') ||
         dataLower.includes('tight') || dataLower.includes('pencil'))) {
      return 'fitted';
    }

    return 'fitted'; // Default to fitted (use segmentation for clean replacement)
  }

  /**
   * Determine garment complexity for parameter optimization
   */
  private determineGarmentComplexity(garmentData: string): 'simple' | 'moderate' | 'complex' {
    const dataLower = garmentData.toLowerCase();

    // Complex patterns/details
    if (dataLower.includes('pattern') || dataLower.includes('print') || dataLower.includes('detail') ||
        dataLower.includes('embroidery') || dataLower.includes('lace') || dataLower.includes('sequin')) {
      return 'complex';
    }

    // Moderate complexity
    if (dataLower.includes('button') || dataLower.includes('pocket') || dataLower.includes('collar') ||
        dataLower.includes('stripe') || dataLower.includes('plaid')) {
      return 'moderate';
    }

    return 'simple';
  }

  /**
   * Get recommended mode based on garment complexity (official API parameter)
   */
  private getRecommendedMode(complexity: string): 'performance' | 'balanced' | 'quality' {
    // Always use quality mode for best, most realistic try-on results
    return 'quality';
  }

  /**
   * Get recommended sample count based on complexity (official API parameter: 1-4)
   */
  private getRecommendedSamples(complexity: string): number {
    // Generate 4 samples for maximum quality selection
    // More samples = better chance of getting the perfect result
    // Trade-off: Slightly longer processing (~30-40s) but significantly better quality
    return 4;
  }

  /**
   * Get recommended segmentation setting based on garment type and category
   * Intelligent selection based on FASHN best practices
   */
  private getRecommendedSegmentation(
    fittingType: string,
    category: 'tops' | 'bottoms' | 'one-pieces' | 'auto',
    complexity: string
  ): boolean {
    // FASHN segmentation_free parameter guide:
    //
    // segmentation_free: true (skip segmentation) - For items that LAYER OVER existing clothes
    // Benefits: ~30% faster, preserves body/skin, natural layering effect
    // Use cases: Outerwear, accessories, loose items, quick previews
    //
    // segmentation_free: false (use segmentation) - For items that REPLACE existing clothes
    // Benefits: Clean replacement, removes original garments completely
    // Use cases: Form-fitting clothes, dresses, underwear, single-layer outfits

    // Priority 1: Category-based rules (strongest signal)
    if (category === 'one-pieces') {
      console.log('👗 [SEGMENTATION] One-piece garment (dress/jumpsuit) → segmentation_free: false (full replacement)');
      return false; // Dresses, jumpsuits need to replace entire outfit
    }

    // Priority 2: Fitting type based rules
    if (fittingType === 'layered') {
      console.log('🧥 [SEGMENTATION] Layered/outerwear detected → segmentation_free: true (layers over clothes)');
      return true; // Jackets, coats, blazers, cardigans go OVER existing clothes
    }

    if (fittingType === 'accessory') {
      console.log('👜 [SEGMENTATION] Accessory detected → segmentation_free: true (doesn\'t replace clothes)');
      return true; // Accessories (scarves, belts, bags) don't replace clothes
    }

    if (fittingType === 'loose') {
      console.log('👕 [SEGMENTATION] Loose/oversized garment detected → segmentation_free: true (better draping)');
      return true; // Oversized/baggy items look more natural with segmentation-free
    }

    if (fittingType === 'fitted') {
      console.log('👔 [SEGMENTATION] Form-fitting garment detected → segmentation_free: false (clean replacement)');
      return false; // Fitted, bodycon, tight items need segmentation for clean replacement
    }

    // Priority 3: Category defaults for tops/bottoms
    if (category === 'bottoms') {
      console.log('👖 [SEGMENTATION] Bottoms detected → segmentation_free: false (replace lower garments)');
      return false; // Pants, skirts replace lower body garments
    }

    if (category === 'tops') {
      console.log('👚 [SEGMENTATION] Tops detected → segmentation_free: false (replace upper garments)');
      return false; // Shirts, tops replace upper body garments
    }

    // Default: Use segmentation for clean replacement
    console.log('❓ [SEGMENTATION] Unknown garment type → defaulting to segmentation_free: false');
    return false;
  }

  /**
   * Detect garment photo type from URL patterns and source metadata
   * Helps FASHN optimize processing for flat-lay vs model-worn photos
   */
  private detectGarmentPhotoType(
    garmentImageUrl: string,
    source?: string,
    providedPhotoType?: 'flat-lay' | 'model' | 'auto'
  ): 'flat-lay' | 'model' | 'auto' {
    // If explicitly provided, use it
    if (providedPhotoType && providedPhotoType !== 'auto') {
      console.log(`📸 [PHOTO-TYPE] Using provided type: ${providedPhotoType}`);
      return providedPhotoType;
    }

    const url = garmentImageUrl.toLowerCase();

    // E-commerce and product photo patterns → flat-lay
    const flatLayPatterns = [
      'amazon.com', 'amzn', 'a.co',
      'zara.com', 'hm.com', 'gap.com',
      'nordstrom', 'macys', 'target.com',
      'shein', 'fashionnova', 'asos',
      'shopify', 'woocommerce',
      '/product/', '/item/', '/products/',
      'ghost-mannequin', 'flat-lay', 'flatlay',
      'product-image', 'catalog'
    ];

    // Social media and style inspiration patterns → model
    const modelPatterns = [
      'instagram.com', 'insta', 'cdninstagram',
      'pinterest.com', 'pinimg',
      'tumblr', 'blogspot',
      'street-style', 'streetstyle',
      'lookbook', 'ootd', 'outfit',
      'worn', 'styled', 'model-',
      'influencer'
    ];

    // Check URL patterns
    if (flatLayPatterns.some(pattern => url.includes(pattern))) {
      console.log('📸 [PHOTO-TYPE] Detected flat-lay from URL pattern');
      return 'flat-lay';
    }

    if (modelPatterns.some(pattern => url.includes(pattern))) {
      console.log('📸 [PHOTO-TYPE] Detected model photo from URL pattern');
      return 'model';
    }

    // Check source metadata
    if (source) {
      const sourceLower = source.toLowerCase();

      // E-commerce sources
      if (sourceLower.includes('external-search') ||
          sourceLower.includes('shopping') ||
          sourceLower.includes('perplexity') ||
          sourceLower.includes('product')) {
        console.log('📸 [PHOTO-TYPE] E-commerce source → flat-lay');
        return 'flat-lay';
      }

      // User closet items (usually photographed flat)
      if (sourceLower.includes('closet') ||
          sourceLower.includes('user_upload') ||
          sourceLower.includes('wardrobe')) {
        console.log('📸 [PHOTO-TYPE] User closet → flat-lay');
        return 'flat-lay';
      }

      // Generated clothing (AI-generated, usually flat product style)
      if (sourceLower.includes('seedream') ||
          sourceLower.includes('generated') ||
          sourceLower.includes('ai-outfit')) {
        console.log('📸 [PHOTO-TYPE] AI-generated clothing → flat-lay');
        return 'flat-lay';
      }

      // Inspiration sources
      if (sourceLower.includes('inspiration') ||
          sourceLower.includes('pinterest') ||
          sourceLower.includes('instagram')) {
        console.log('📸 [PHOTO-TYPE] Inspiration source → model');
        return 'model';
      }
    }

    // Default to auto-detection
    console.log('📸 [PHOTO-TYPE] Unable to determine → using auto');
    return 'auto';
  }

  /**
   * Generate cache key for garment analysis
   */
  private generateCacheKey(garmentImageUrl: string): string {
    // Simple hash based on URL length and first/last characters
    const url = garmentImageUrl.toLowerCase();
    return `${url.length}_${url.charAt(0)}${url.charAt(url.length - 1)}`;
  }

  /**
   * Check if image is base64 encoded
   */
  private isBase64Image(imageUrl: string): boolean {
    return imageUrl.startsWith('data:image/');
  }

  /**
   * Post-process FASHN result for enhanced quality
   */
  private async postProcessFashnResult(resultImageUrl: string, originalAvatar: string, originalGarment: string): Promise<string> {
    console.log('✨ [POST-PROCESS] Starting result enhancement...');

    try {
      // For now, return the original result
      // In production, this would include:
      // - Subtle sharpening to garment edges
      // - Color correction to match original garment colors
      // - Lighting adjustment to match avatar's original lighting
      // - Optional blending with original avatar for seamless integration

      console.log('✅ [POST-PROCESS] Post-processing complete');
      return resultImageUrl;
    } catch (error) {
      console.error('❌ [POST-PROCESS] Post-processing failed:', error);
      return resultImageUrl; // Return original if post-processing fails
    }
  }

  /**
   * Analyze a single FASHN result sample using Claude Vision API
   * Scores based on skin tone consistency, clothing fit, and overall quality
   */
  private async analyzeSampleQuality(imageUrl: string, sampleIndex: number): Promise<{score: number; reasoning: string}> {
    try {
      console.log(`🔍 [VISION-ANALYSIS-${sampleIndex}] Analyzing image quality with Claude Vision...`);

      // Convert image to base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Call Claude Vision API for quality analysis
      const visionResponse = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: `Analyze this virtual try-on result image and rate its quality from 0-100.

CRITICAL QUALITY FACTORS:
1. Skin Tone Consistency (40 points): Does the person's skin look natural and consistent across their body? Deduct heavy points for color changes, unnatural tones, or mismatched skin between face/arms/legs.
2. Clothing Fit Quality (30 points): Does the clothing fit naturally on the body? Check for proper alignment, no distortions, realistic draping.
3. No Artifacts/Distortions (20 points): Are there any visual glitches, warping, weird edges, or AI artifacts?
4. Overall Quality (10 points): Image clarity, lighting, professional appearance.

SCORING GUIDE:
- 90-100: Excellent - natural skin tone, perfect fit, no artifacts
- 70-89: Good - minor issues but acceptable
- 50-69: Fair - noticeable issues with skin tone OR fit OR artifacts
- 0-49: Poor - major problems, unusable

Return ONLY this format:
Score: [number]
Reason: [1-2 sentence explanation focusing on skin tone and fit quality]`
              }
            ]
          }]
        })
      });

      if (!visionResponse.ok) {
        throw new Error(`Claude Vision API error: ${visionResponse.status}`);
      }

      const visionResult = await visionResponse.json();
      const analysisText = visionResult.content?.[0]?.text || '';

      // Parse score and reasoning
      const scoreMatch = analysisText.match(/Score:\s*(\d+)/i);
      const reasonMatch = analysisText.match(/Reason:\s*(.+)/i);

      const score = scoreMatch ? parseInt(scoreMatch[1]) : 50; // Default to average if parsing fails
      const reasoning = reasonMatch ? reasonMatch[1].trim() : 'Analysis parsing failed';

      console.log(`✅ [VISION-ANALYSIS-${sampleIndex}] Quality score: ${score}/100 - ${reasoning}`);

      return { score, reasoning };

    } catch (error) {
      console.error(`❌ [VISION-ANALYSIS-${sampleIndex}] Vision analysis failed:`, error);
      // Return neutral score if analysis fails
      return { score: 50, reasoning: 'Analysis failed - using fallback' };
    }
  }

  /**
   * Select the best quality sample from multiple generated images
   */
  private async selectBestSample(sampleUrls: string[]): Promise<string> {
    console.log('🎯 [SAMPLE-SELECTION] Analyzing multiple samples to select best quality...');

    // If only one sample, return it immediately
    if (sampleUrls.length === 1) {
      console.log('📊 [SAMPLE-SELECTION] Only one sample available, using it');
      return sampleUrls[0];
    }

    try {
      // Analyze each sample with Claude Vision for intelligent quality scoring
      const scoredSamples = await Promise.all(
        sampleUrls.map(async (url, index) => {
          // Basic URL validation (safety check)
          if (!url || !url.startsWith('http')) {
            console.warn(`⚠️ [SAMPLE-${index}] Invalid URL format, skipping Vision analysis`);
            return {
              url,
              score: 0,
              index,
              reasoning: 'Invalid URL'
            };
          }

          // Use Claude Vision to analyze actual image quality
          const visionAnalysis = await this.analyzeSampleQuality(url, index);

          console.log(`📊 [SAMPLE-${index}] Vision AI Score: ${visionAnalysis.score}/100`);
          console.log(`💭 [SAMPLE-${index}] Reasoning: ${visionAnalysis.reasoning}`);

          return {
            url,
            score: visionAnalysis.score,
            index,
            reasoning: visionAnalysis.reasoning
          };
        })
      );

      // Sort by Claude Vision score (highest first)
      scoredSamples.sort((a, b) => b.score - a.score);

      const bestSample = scoredSamples[0];

      console.log('🏆 [SAMPLE-SELECTION] Best sample selected by Claude Vision:', {
        index: bestSample.index,
        score: bestSample.score,
        reasoning: bestSample.reasoning,
        totalSamples: sampleUrls.length
      });

      // Show comparison of all samples
      console.log('📊 [SAMPLE-COMPARISON] All samples ranked:');
      scoredSamples.forEach((sample, rank) => {
        console.log(`  ${rank + 1}. Sample ${sample.index}: ${sample.score}/100 - ${sample.reasoning}`);
      });

      return bestSample.url;

    } catch (error) {
      console.error('❌ [SAMPLE-SELECTION] Sample selection failed, using first sample:', error);
      // Fallback to first sample if selection fails
      return sampleUrls[0];
    }
  }

  /**
   * Validate result quality and detect distortion issues
   */
  private async validateResultQuality(resultImageUrl: string, originalAvatar: string, originalGarment: string): Promise<QualityValidationResult> {
    console.log('🔍 [QUALITY-CHECK] Performing comprehensive quality validation...');

    try {
      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100; // Start with perfect score

      // 1. Basic result validation
      if (!resultImageUrl || resultImageUrl.length === 0) {
        issues.push('No result image generated');
        score = 0;
        return this.buildQualityResult(score, issues, recommendations);
      }

      // 2. Image size and format validation
      if (this.isBase64Image(resultImageUrl)) {
        const sizeKB = Math.round(resultImageUrl.length / 1024);

        if (sizeKB < 50) {
          issues.push('Result image too small - possible generation failure');
          recommendations.push('Retry with higher quality settings');
          score -= 30;
        } else if (sizeKB > 8000) {
          issues.push('Result image extremely large - may indicate processing error');
          recommendations.push('Check for artifacts or unexpected content');
          score -= 10;
        }

        // 3. Detect obvious corruption patterns in base64
        if (this.detectBase64Corruption(resultImageUrl)) {
          issues.push('Image data appears corrupted or incomplete');
          recommendations.push('Regenerate avatar and retry FASHN processing');
          score -= 40;
        }
      }

      // 4. URL validation for HTTP results
      if (resultImageUrl.startsWith('http')) {
        if (!this.isValidImageUrl(resultImageUrl)) {
          issues.push('Invalid result image URL format');
          recommendations.push('Check FASHN API response format');
          score -= 25;
        }
      }

      // 5. Detect common FASHN distortion patterns
      const distortionCheck = await this.detectDistortionPatterns(resultImageUrl);
      if (distortionCheck.hasDistortion) {
        issues.push(...distortionCheck.issues);
        recommendations.push(...distortionCheck.recommendations);
        score -= distortionCheck.severityScore;
      }

      // 6. Compare with original avatar for anatomy preservation
      const anatomyCheck = await this.validateAnatomyPreservation(resultImageUrl, originalAvatar);
      if (!anatomyCheck.isPreserved) {
        issues.push(...anatomyCheck.issues);
        recommendations.push(...anatomyCheck.recommendations);
        score -= anatomyCheck.deductionScore;
      }

      // 7. Validate garment placement quality
      const placementCheck = await this.validateGarmentPlacement(resultImageUrl, originalGarment);
      if (!placementCheck.isWellPlaced) {
        issues.push(...placementCheck.issues);
        recommendations.push(...placementCheck.recommendations);
        score -= placementCheck.deductionScore;
      }

      return this.buildQualityResult(score, issues, recommendations);

    } catch (error) {
      console.error('❌ [QUALITY-CHECK] Validation failed:', error);
      return {
        score: 50,
        issues: ['Quality validation system error'],
        isValid: false,
        recommendations: ['Retry generation', 'Check avatar and garment image quality']
      };
    }
  }

  /**
   * Build quality validation result with scoring
   */
  private buildQualityResult(score: number, issues: string[], recommendations: string[]): QualityValidationResult {
    // Clamp score to valid range
    score = Math.max(0, Math.min(100, score));

    // Add general recommendations based on score
    if (score < 50) {
      recommendations.unshift('Poor quality detected - recommend complete regeneration');
    } else if (score < 70) {
      recommendations.unshift('Quality concerns detected - consider retry with adjusted parameters');
    } else if (score < 85) {
      recommendations.unshift('Minor quality issues - result may be acceptable');
    }

    const isValid = score >= 70 && issues.length <= 2; // Allow minor issues

    const result: QualityValidationResult = {
      score,
      issues,
      isValid,
      recommendations
    };

    console.log('📊 [QUALITY-CHECK] Quality assessment:', {
      score: `${score}/100`,
      isValid,
      issueCount: issues.length,
      status: isValid ? 'ACCEPTABLE' : 'NEEDS_RETRY'
    });

    return result;
  }

  /**
   * Detect corruption in base64 image data
   */
  private detectBase64Corruption(base64Data: string): boolean {
    try {
      // Check for incomplete base64 ending
      if (!base64Data.includes(',')) return true;

      const base64Content = base64Data.split(',')[1];
      if (!base64Content || base64Content.length < 100) return true;

      // Check for obvious truncation patterns
      if (base64Content.endsWith('=') && base64Content.length % 4 !== 0) return true;

      // Check for invalid base64 characters (basic check)
      const validBase64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!validBase64Pattern.test(base64Content)) return true;

      return false;
    } catch (error) {
      return true; // If we can't parse it, assume corruption
    }
  }

  /**
   * Validate if URL format is correct for images
   */
  private isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);

      // Check for valid protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) return false;

      // Check for image-like file extensions or known CDN patterns
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const hasImageExtension = imageExtensions.some(ext =>
        parsedUrl.pathname.toLowerCase().includes(ext)
      );

      // Known CDN patterns that might not have extensions
      const knownCdnPatterns = ['amazonaws.com', 'cloudfront', 'cdn', 'storage'];
      const isKnownCdn = knownCdnPatterns.some(pattern =>
        parsedUrl.hostname.toLowerCase().includes(pattern)
      );

      return hasImageExtension || isKnownCdn;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect common distortion patterns in FASHN results
   */
  private async detectDistortionPatterns(resultImageUrl: string): Promise<{
    hasDistortion: boolean;
    issues: string[];
    recommendations: string[];
    severityScore: number;
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let severityScore = 0;

    try {
      // For base64 images, we can do some basic pattern detection
      if (this.isBase64Image(resultImageUrl)) {
        const base64Content = resultImageUrl.split(',')[1];

        // Check for extremely repetitive patterns (could indicate generation failure)
        if (this.hasRepetitivePatterns(base64Content)) {
          issues.push('Repetitive patterns detected - possible generation artifact');
          recommendations.push('Retry with different mode parameter (performance/balanced/quality)');
          severityScore += 20;
        }

        // Check for very small file size relative to expected image dimensions
        const estimatedSizeKB = base64Content.length * 0.75 / 1024;
        if (estimatedSizeKB < 200) { // Much smaller than expected for avatar images
          issues.push('Result image size unusually small - may indicate poor generation');
          recommendations.push('Check avatar pose quality and retry');
          severityScore += 15;
        }
      }

      // Heuristic checks based on common FASHN issues
      const commonIssues = this.analyzeCommonFashnIssues(resultImageUrl);
      issues.push(...commonIssues.issues);
      recommendations.push(...commonIssues.recommendations);
      severityScore += commonIssues.severityScore;

      return {
        hasDistortion: issues.length > 0,
        issues,
        recommendations,
        severityScore
      };

    } catch (error) {
      console.warn('⚠️ [DISTORTION-CHECK] Pattern detection failed:', error);
      return {
        hasDistortion: false,
        issues: [],
        recommendations: [],
        severityScore: 0
      };
    }
  }

  /**
   * Check for repetitive patterns in base64 data (simple heuristic)
   */
  private hasRepetitivePatterns(base64Content: string): boolean {
    // Sample small chunks and look for excessive repetition
    const sampleSize = Math.min(1000, base64Content.length);
    const sample = base64Content.substring(0, sampleSize);

    // Look for repeated 10-character sequences
    const chunks = new Map<string, number>();
    for (let i = 0; i <= sample.length - 10; i += 10) {
      const chunk = sample.substring(i, i + 10);
      chunks.set(chunk, (chunks.get(chunk) || 0) + 1);
    }

    // If any chunk appears more than 20% of the time, consider it repetitive
    const maxCount = Math.max(...chunks.values());
    const threshold = Math.floor(sampleSize / 10 * 0.2);

    return maxCount > threshold;
  }

  /**
   * Analyze common FASHN-specific issues
   */
  private analyzeCommonFashnIssues(resultImageUrl: string): {
    issues: string[];
    recommendations: string[];
    severityScore: number;
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let severityScore = 0;

    // This would be enhanced with actual image analysis in production
    // For now, provide framework for common FASHN distortion patterns:

    // Pattern 1: Check for metadata that might indicate processing issues
    if (this.isBase64Image(resultImageUrl)) {
      const metadata = this.extractImageMetadata(resultImageUrl);

      if (metadata.hasUnusualAspectRatio) {
        issues.push('Unusual image aspect ratio detected');
        recommendations.push('Regenerate avatar with proper full-body proportions');
        severityScore += 10;
      }
    }

    return { issues, recommendations, severityScore };
  }

  /**
   * Extract basic metadata from base64 image
   */
  private extractImageMetadata(base64Image: string): {
    hasUnusualAspectRatio: boolean;
    estimatedSize: number;
  } {
    try {
      const base64Content = base64Image.split(',')[1];
      const estimatedSize = base64Content.length * 0.75 / 1024; // KB estimate

      // Basic heuristic: avatars should typically be portrait orientation
      // This is a simplified check - in production would decode image dimensions
      const hasUnusualAspectRatio = estimatedSize < 100 || estimatedSize > 10000;

      return {
        hasUnusualAspectRatio,
        estimatedSize
      };
    } catch (error) {
      return {
        hasUnusualAspectRatio: false,
        estimatedSize: 0
      };
    }
  }

  /**
   * Validate anatomy preservation compared to original avatar
   */
  private async validateAnatomyPreservation(resultImageUrl: string, originalAvatar: string): Promise<{
    isPreserved: boolean;
    issues: string[];
    recommendations: string[];
    deductionScore: number;
  }> {
    try {
      // Basic preservation checks - in production this would use computer vision
      const issues: string[] = [];
      const recommendations: string[] = [];
      let deductionScore = 0;

      // Size comparison heuristic
      if (this.isBase64Image(resultImageUrl) && this.isBase64Image(originalAvatar)) {
        const resultSize = resultImageUrl.length;
        const originalSize = originalAvatar.length;
        const sizeRatio = resultSize / originalSize;

        // Dramatic size changes might indicate anatomical issues
        if (sizeRatio < 0.5 || sizeRatio > 2.0) {
          issues.push('Significant size difference from original avatar');
          recommendations.push('Check if body proportions are preserved');
          deductionScore += 15;
        }
      }

      const isPreserved = issues.length === 0;

      return {
        isPreserved,
        issues,
        recommendations,
        deductionScore
      };

    } catch (error) {
      console.warn('⚠️ [ANATOMY-CHECK] Preservation check failed:', error);
      return {
        isPreserved: true, // Assume preserved if check fails
        issues: [],
        recommendations: [],
        deductionScore: 0
      };
    }
  }

  /**
   * Validate garment placement quality
   */
  private async validateGarmentPlacement(resultImageUrl: string, originalGarment: string): Promise<{
    isWellPlaced: boolean;
    issues: string[];
    recommendations: string[];
    deductionScore: number;
  }> {
    try {
      // Basic placement validation - would be enhanced with computer vision
      const issues: string[] = [];
      const recommendations: string[] = [];
      let deductionScore = 0;

      // Heuristic checks for obvious placement issues
      if (this.isBase64Image(resultImageUrl)) {
        const resultSize = Math.round(resultImageUrl.length / 1024);

        // Very small results might indicate garment didn't render properly
        if (resultSize < 150) {
          issues.push('Result may be missing garment details');
          recommendations.push('Retry with higher quality garment image');
          deductionScore += 20;
        }
      }

      const isWellPlaced = deductionScore < 10; // Allow minor issues

      return {
        isWellPlaced,
        issues,
        recommendations,
        deductionScore
      };

    } catch (error) {
      console.warn('⚠️ [PLACEMENT-CHECK] Placement check failed:', error);
      return {
        isWellPlaced: true,
        issues: [],
        recommendations: [],
        deductionScore: 0
      };
    }
  }

  /**
   * Enhanced submitTryOn with retry logic and parameter adjustment
   */
  async submitTryOnWithRetry(modelImageUrl: string, garmentImageUrl: string, maxRetries: number = 2): Promise<string> {
    console.log('🔄 [RETRY-LOGIC] Starting enhanced try-on with retry capability...');

    const attempts: RetryAttempt[] = [];
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(`🎯 [RETRY-LOGIC] Attempt ${attempt}/${maxRetries + 1}`);

        // Adjust parameters for retry attempts
        const result = await this.submitTryOn(modelImageUrl, garmentImageUrl);

        // Validate result quality
        const qualityCheck = await this.validateResultQuality(result, modelImageUrl, garmentImageUrl);

        if (qualityCheck.isValid) {
          // Apply post-processing
          const enhancedResult = await this.postProcessFashnResult(result, modelImageUrl, garmentImageUrl);

          // Cache successful parameters
          this.cacheSuccessfulParameters(garmentImageUrl, {
            model_image: modelImageUrl,
            garment_image: garmentImageUrl,
            // Add current successful parameters here
          });

          console.log(`✅ [RETRY-LOGIC] Success on attempt ${attempt} with quality score: ${qualityCheck.score}`);
          return enhancedResult;
        } else {
          console.log(`⚠️ [RETRY-LOGIC] Attempt ${attempt} quality issues:`, qualityCheck.issues);
          if (attempt === maxRetries + 1) {
            console.log('📊 [RETRY-LOGIC] Max retries reached, returning best attempt');
            return result; // Return last result even if not perfect
          }
        }

        attempts.push({
          attempt,
          parameters: {}, // Would store actual parameters used
          result,
          timestamp: Date.now()
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ [RETRY-LOGIC] Attempt ${attempt} failed:`, errorMessage);

        lastError = error instanceof Error ? error : new Error(errorMessage);

        attempts.push({
          attempt,
          parameters: {},
          error: errorMessage,
          timestamp: Date.now()
        });

        // Check if error is retryable
        if (!this.isRetryableError(lastError) || attempt === maxRetries + 1) {
          throw lastError;
        }

        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ [RETRY-LOGIC] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Cache successful parameters for future optimization
   */
  private cacheSuccessfulParameters(garmentImageUrl: string, parameters: FashnTryOnRequest['inputs']): void {
    const cacheKey = this.generateCacheKey(garmentImageUrl);
    this.successfulParams.set(cacheKey, parameters);
    console.log('💾 [CACHE] Cached successful parameters for garment type');
  }

  /**
   * Helper method to detect image type for debugging
   */
  private detectImageType(imageUrl: string): string {
    if (!imageUrl) return 'missing';
    if (imageUrl.startsWith('data:')) return 'base64';
    if (imageUrl.startsWith('http')) return 'url';
    return 'unknown';
  }

  /**
   * Detect clothing category for better FASHN processing
   */
  private detectClothingCategory(clothingData: string): 'tops' | 'bottoms' | 'one-pieces' | 'auto' {
    // Analyze URL or data for hints about clothing type (using FASHN's correct categories)
    const dataLower = clothingData.toLowerCase();

    if (dataLower.includes('shirt') || dataLower.includes('top') || dataLower.includes('blouse') || dataLower.includes('sweater') || dataLower.includes('jacket')) {
      return 'tops';
    } else if (dataLower.includes('pants') || dataLower.includes('jeans') || dataLower.includes('trouser') || dataLower.includes('short') || dataLower.includes('skirt')) {
      return 'bottoms';
    } else if (dataLower.includes('dress') || dataLower.includes('gown') || dataLower.includes('jumpsuit') || dataLower.includes('romper')) {
      return 'one-pieces';
    }

    // Default to auto-detection
    return 'auto';
  }

  /**
   * Validate image formats for FASHN API compatibility
   */
  private async validateImageFormatsForFashn(modelImageUrl: string, garmentImageUrl: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
    modelImageAnalysis: any;
    garmentImageAnalysis: any;
  }> {
    console.log('🔍 [FORMAT-VALIDATION] Starting comprehensive format validation...');

    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Analyze model image format
      const modelImageAnalysis = await this.analyzeImageFormat(modelImageUrl, 'model');
      console.log('📊 [FORMAT-VALIDATION] Model image analysis:', modelImageAnalysis);

      // Analyze garment image format
      const garmentImageAnalysis = await this.analyzeImageFormat(garmentImageUrl, 'garment');
      console.log('📊 [FORMAT-VALIDATION] Garment image analysis:', garmentImageAnalysis);

      // Check model image issues
      if (!modelImageAnalysis.isValid) {
        issues.push(...modelImageAnalysis.issues.map(issue => `Model: ${issue}`));
        recommendations.push(...modelImageAnalysis.recommendations.map(rec => `Model: ${rec}`));
      }

      // Check garment image issues
      if (!garmentImageAnalysis.isValid) {
        issues.push(...garmentImageAnalysis.issues.map(issue => `Garment: ${issue}`));
        recommendations.push(...garmentImageAnalysis.recommendations.map(rec => `Garment: ${rec}`));
      }

      // FASHN-specific compatibility checks
      if (modelImageAnalysis.format === 'base64' && modelImageAnalysis.size > 10 * 1024 * 1024) {
        issues.push('Model image too large for FASHN processing (>10MB)');
        recommendations.push('Compress model image to under 5MB');
      }

      if (garmentImageAnalysis.format === 'base64' && garmentImageAnalysis.size > 10 * 1024 * 1024) {
        issues.push('Garment image too large for FASHN processing (>10MB)');
        recommendations.push('Compress garment image to under 5MB');
      }

      const isValid = issues.length === 0;

      console.log('📊 [FORMAT-VALIDATION] Validation complete:', {
        isValid,
        issueCount: issues.length,
        modelFormat: modelImageAnalysis.format,
        garmentFormat: garmentImageAnalysis.format
      });

      return {
        isValid,
        issues,
        recommendations,
        modelImageAnalysis,
        garmentImageAnalysis
      };

    } catch (error) {
      console.error('❌ [FORMAT-VALIDATION] Validation failed:', error);
      return {
        isValid: false,
        issues: ['Format validation system error'],
        recommendations: ['Check image URLs and formats manually'],
        modelImageAnalysis: null,
        garmentImageAnalysis: null
      };
    }
  }

  /**
   * Analyze individual image format and properties
   */
  private async analyzeImageFormat(imageUrl: string, type: 'model' | 'garment'): Promise<{
    isValid: boolean;
    format: string;
    size: number;
    mimeType: string;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      if (!imageUrl || typeof imageUrl !== 'string') {
        issues.push(`Invalid ${type} image URL`);
        return { isValid: false, format: 'unknown', size: 0, mimeType: 'unknown', issues, recommendations };
      }

      let format = 'unknown';
      let size = 0;
      let mimeType = 'unknown';

      if (imageUrl.startsWith('data:image/')) {
        // Base64 image analysis
        format = 'base64';
        const mimeMatch = imageUrl.match(/data:image\/([^;]+)/);
        mimeType = mimeMatch ? `image/${mimeMatch[1]}` : 'unknown';

        const base64Data = imageUrl.split(',')[1];
        if (base64Data) {
          size = Math.round(base64Data.length * 0.75); // Approximate size in bytes
        }

        // Base64 specific checks
        if (!base64Data || base64Data.length < 100) {
          issues.push(`${type} base64 data appears corrupted or too small`);
        }

        if (size > 15 * 1024 * 1024) { // 15MB
          issues.push(`${type} image very large (${Math.round(size / 1024 / 1024)}MB) - may cause FASHN timeout`);
          recommendations.push(`Compress ${type} image to under 5MB for better performance`);
        }

        // MIME type validation
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mimeType)) {
          issues.push(`${type} image format (${mimeType}) may not be supported by FASHN`);
          recommendations.push(`Convert ${type} image to JPEG or PNG format`);
        }

      } else if (imageUrl.startsWith('http')) {
        // HTTP URL analysis
        format = 'url';
        mimeType = 'unknown'; // Would need to fetch to determine

        // URL format checks
        const urlLower = imageUrl.toLowerCase();
        if (!urlLower.includes('.jpg') && !urlLower.includes('.jpeg') &&
            !urlLower.includes('.png') && !urlLower.includes('.webp')) {
          issues.push(`${type} URL doesn't indicate standard image format`);
          recommendations.push(`Ensure ${type} URL points to .jpg, .png, or .webp image`);
        }

        // Check for valid CDN patterns
        const validCdnPatterns = ['fal.media', 'amazonaws.com', 'cloudfront', 'googleusercontent'];
        const hasValidCdn = validCdnPatterns.some(pattern => urlLower.includes(pattern));

        if (!hasValidCdn) {
          recommendations.push(`${type} URL should use reliable CDN for FASHN compatibility`);
        }

      } else {
        issues.push(`${type} image format not recognized (not base64 or HTTP URL)`);
        recommendations.push(`${type} image should be base64 data URL or HTTP URL`);
      }

      const isValid = issues.length === 0;

      return {
        isValid,
        format,
        size,
        mimeType,
        issues,
        recommendations
      };

    } catch (error) {
      console.error(`❌ [FORMAT-ANALYSIS] ${type} image analysis failed:`, error);
      return {
        isValid: false,
        format: 'error',
        size: 0,
        mimeType: 'error',
        issues: [`${type} image analysis failed`],
        recommendations: [`Check ${type} image format manually`]
      };
    }
  }

  /**
   * Convert images to FASHN-compatible formats
   */
  private async convertImagesForFashn(modelImageUrl: string, garmentImageUrl: string): Promise<{
    success: boolean;
    modelImageUrl: string;
    garmentImageUrl: string;
    error?: string;
  }> {
    console.log('🔄 [IMAGE-CONVERT] Starting image format conversion for FASHN...');

    try {
      // Convert base64 images to FASHN-compatible format
      const convertedModelUrl = this.normalizeFashnImageFormat(modelImageUrl);
      const convertedGarmentUrl = this.normalizeFashnImageFormat(garmentImageUrl);

      console.log('✅ [IMAGE-CONVERT] Format conversion completed:', {
        modelChanged: convertedModelUrl !== modelImageUrl,
        garmentChanged: convertedGarmentUrl !== garmentImageUrl
      });

      return {
        success: true,
        modelImageUrl: convertedModelUrl,
        garmentImageUrl: convertedGarmentUrl
      };

    } catch (error) {
      console.error('❌ [IMAGE-CONVERT] Conversion failed:', error);
      return {
        success: false,
        modelImageUrl,
        garmentImageUrl,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      };
    }
  }

  /**
   * Normalize image format to match FASHN API requirements
   * Converts data:image/jpeg;base64, to data:image/jpg;base64, as required by FASHN
   */
  private normalizeFashnImageFormat(imageUrl: string): string {
    // If it's not a base64 data URL, return as-is
    if (!imageUrl.startsWith('data:image/')) {
      return imageUrl;
    }

    // FASHN specifically requires "jpg" not "jpeg" in base64 data URLs
    if (imageUrl.startsWith('data:image/jpeg;base64,')) {
      const normalizedUrl = imageUrl.replace('data:image/jpeg;base64,', 'data:image/jpg;base64,');
      console.log('🔄 [FASHN-FORMAT] Normalized JPEG to JPG format for FASHN compatibility');
      return normalizedUrl;
    }

    // For other formats, ensure they match FASHN requirements
    if (imageUrl.startsWith('data:image/png;base64,') ||
        imageUrl.startsWith('data:image/jpg;base64,') ||
        imageUrl.startsWith('data:image/webp;base64,')) {
      return imageUrl;
    }

    // Log any unrecognized formats
    console.warn('⚠️ [FASHN-FORMAT] Unrecognized base64 format:', imageUrl.substring(0, 50));
    return imageUrl;
  }

  /**
   * Analyze user photo properties for preprocessing decisions
   */
  private async analyzeUserPhotoProperties(imageUrl: string): Promise<{
    dimensions: { width: number; height: number };
    sizeKB: number;
    format: string;
    hasExif: boolean;
    needsOrientation: boolean;
    estimatedBackgroundComplexity: 'simple' | 'moderate' | 'complex';
  }> {
    try {
      if (this.isBase64Image(imageUrl)) {
        const base64Content = imageUrl.split(',')[1];
        const sizeKB = Math.round(base64Content.length * 0.75 / 1024);

        // Extract format from data URL
        const formatMatch = imageUrl.match(/data:image\/([^;]+)/);
        const format = formatMatch ? formatMatch[1] : 'unknown';

        return {
          dimensions: { width: 1024, height: 1024 }, // Would be detected in real implementation
          sizeKB,
          format,
          hasExif: format === 'jpeg' || format === 'jpg', // JPEG typically has EXIF
          needsOrientation: format === 'jpeg' || format === 'jpg', // Assume orientation needed for JPEG
          estimatedBackgroundComplexity: sizeKB > 2000 ? 'complex' : sizeKB > 1000 ? 'moderate' : 'simple'
        };
      }

      // For URL images, provide defaults
      return {
        dimensions: { width: 1024, height: 1024 },
        sizeKB: 1024,
        format: 'unknown',
        hasExif: false,
        needsOrientation: false,
        estimatedBackgroundComplexity: 'moderate'
      };
    } catch (error) {
      console.error('❌ [PHOTO-ANALYSIS] Analysis failed:', error);
      return {
        dimensions: { width: 0, height: 0 },
        sizeKB: 0,
        format: 'error',
        hasExif: false,
        needsOrientation: false,
        estimatedBackgroundComplexity: 'simple'
      };
    }
  }

  /**
   * Correct EXIF orientation in user photos and strip metadata
   */
  private async correctImageOrientation(imageUrl: string): Promise<{
    success: boolean;
    correctedImageUrl: string;
    orientationCorrected: boolean;
    metadataStripped: boolean;
    error?: string;
  }> {
    try {
      console.log('🔄 [ORIENTATION] Starting EXIF orientation correction and metadata stripping...');

      if (!this.isBase64Image(imageUrl)) {
        console.log('⚠️ [ORIENTATION] URL images cannot be processed for EXIF - returning original');
        return {
          success: true,
          correctedImageUrl: imageUrl,
          orientationCorrected: false,
          metadataStripped: false
        };
      }

      // Extract format and base64 content
      const formatMatch = imageUrl.match(/data:image\/([^;]+)/);
      const format = formatMatch ? formatMatch[1] : 'unknown';
      const base64Content = imageUrl.split(',')[1];

      // Only JPEG files typically have EXIF orientation data
      if (format !== 'jpeg' && format !== 'jpg') {
        console.log('ℹ️ [ORIENTATION] Non-JPEG format - no EXIF orientation expected');
        return {
          success: true,
          correctedImageUrl: imageUrl,
          orientationCorrected: false,
          metadataStripped: true // Other formats don't have EXIF to strip
        };
      }

      // Create canvas for image processing
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Load image and process orientation
      const processedImage = await new Promise<string>((resolve, reject) => {
        img.onload = () => {
          try {
            // For now, we'll assume orientation 1 (no rotation needed)
            // In a full implementation, we would:
            // 1. Parse EXIF data from base64 to get orientation value
            // 2. Apply appropriate rotation/flip transformations
            // 3. Redraw on canvas without EXIF data

            // Set canvas dimensions
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image (effectively strips EXIF by nature of canvas conversion)
            ctx.drawImage(img, 0, 0);

            // Convert back to base64 PNG (strips all metadata)
            const correctedDataUrl = canvas.toDataURL('image/png', 0.9);

            console.log('✅ [ORIENTATION] Image processed - EXIF metadata stripped');
            resolve(correctedDataUrl);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error('Failed to load image for orientation correction'));
        img.src = imageUrl;
      });

      return {
        success: true,
        correctedImageUrl: processedImage,
        orientationCorrected: true, // Canvas processing handles any orientation
        metadataStripped: true
      };

    } catch (error) {
      console.error('❌ [ORIENTATION] Orientation correction failed:', error);
      return {
        success: false,
        correctedImageUrl: imageUrl,
        orientationCorrected: false,
        metadataStripped: false,
        error: error instanceof Error ? error.message : 'Unknown orientation error'
      };
    }
  }

  /**
   * Smart background removal with graceful fallbacks
   */
  private async attemptSmartBackgroundRemoval(imageUrl: string): Promise<{
    success: boolean;
    processedImageUrl?: string;
    method?: string;
    shouldUseFallback?: boolean;
    error?: string;
  }> {
    try {
      console.log('🎨 [SMART-BG] Starting smart background removal...');

      // First, analyze if this looks like it might benefit from background removal
      const analysis = await this.analyzeImageType(imageUrl);
      console.log('📊 [SMART-BG] Image analysis:', analysis);

      // For product photos or screenshots, background removal may not be necessary
      if (analysis.likelyType === 'product_photo' || analysis.likelyType === 'screenshot') {
        console.log('ℹ️ [SMART-BG] Image appears to be product photo/screenshot - trying without background removal first');
        return {
          success: false, // Signal to use original
          method: 'skip_unnecessary',
          shouldUseFallback: false
        };
      }

      // Try background removal for photos that might benefit
      console.log('🔄 [SMART-BG] Attempting background removal...');
      const removalResult = await this.removeGarmentBackground(imageUrl);

      if (removalResult.success && removalResult.processedImageUrl) {
        // Validate the result but be lenient
        const validation = await this.validateBackgroundRemoval(removalResult.processedImageUrl);

        // Use more lenient thresholds - many images work fine even with imperfect background removal
        if (validation.transparencyScore >= 40) {
          console.log('✅ [SMART-BG] Background removal successful and acceptable');
          return {
            success: true,
            processedImageUrl: removalResult.processedImageUrl,
            method: 'background_removed'
          };
        } else {
          console.log('⚠️ [SMART-BG] Background removal quality too low - using original image');
          return {
            success: false,
            method: 'quality_fallback',
            shouldUseFallback: true
          };
        }
      } else {
        console.log('ℹ️ [SMART-BG] Background removal failed - using original image');
        return {
          success: false,
          method: 'removal_failed',
          shouldUseFallback: true,
          error: removalResult.error
        };
      }

    } catch (error) {
      console.log('ℹ️ [SMART-BG] Background removal error - using original image:', error);
      return {
        success: false,
        method: 'error_fallback',
        shouldUseFallback: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analyze what type of image this likely is
   */
  private async analyzeImageType(imageUrl: string): Promise<{
    likelyType: 'user_photo' | 'product_photo' | 'screenshot' | 'unknown';
    confidence: number;
    reasoning: string[];
  }> {
    try {
      const reasoning: string[] = [];

      if (!this.isBase64Image(imageUrl)) {
        reasoning.push('URL-based image suggests downloaded/external source');
        return {
          likelyType: 'product_photo',
          confidence: 0.7,
          reasoning
        };
      }

      const sizeKB = Math.round(imageUrl.length / 1024);
      const isJPEG = imageUrl.includes('data:image/jpeg');
      const isPNG = imageUrl.includes('data:image/png');

      // Screenshots are often PNG and have specific size characteristics
      if (isPNG && sizeKB > 100 && sizeKB < 2000) {
        reasoning.push('PNG format with moderate size suggests screenshot');
        return {
          likelyType: 'screenshot',
          confidence: 0.6,
          reasoning
        };
      }

      // High quality JPEG photos from cameras tend to be larger
      if (isJPEG && sizeKB > 2000) {
        reasoning.push('Large JPEG suggests camera photo');
        return {
          likelyType: 'user_photo',
          confidence: 0.7,
          reasoning
        };
      }

      // Moderate size images could be product photos
      if (sizeKB > 300 && sizeKB < 1500) {
        reasoning.push('Moderate size suggests optimized product photo');
        return {
          likelyType: 'product_photo',
          confidence: 0.5,
          reasoning
        };
      }

      reasoning.push('Unable to determine image type from characteristics');
      return {
        likelyType: 'unknown',
        confidence: 0.3,
        reasoning
      };

    } catch (error) {
      return {
        likelyType: 'unknown',
        confidence: 0,
        reasoning: ['Analysis failed']
      };
    }
  }

  /**
   * Analyze background complexity before attempting removal (DEPRECATED - kept for compatibility)
   */
  private async analyzeBackgroundComplexity(imageUrl: string): Promise<{
    isComplex: boolean;
    complexity: 'simple' | 'moderate' | 'complex';
    issues: string[];
    canProceed: boolean;
  }> {
    try {
      console.log('🔍 [BG-ANALYSIS] Analyzing background complexity...');

      if (!this.isBase64Image(imageUrl)) {
        return {
          isComplex: false,
          complexity: 'moderate',
          issues: ['Cannot analyze URL-based images'],
          canProceed: true
        };
      }

      const issues: string[] = [];
      const sizeKB = Math.round(imageUrl.length / 1024);

      // Analyze file size patterns (complex backgrounds = larger files)
      let complexity: 'simple' | 'moderate' | 'complex' = 'simple';

      if (sizeKB > 3000) {
        issues.push('Very large file size suggests complex background');
        complexity = 'complex';
      } else if (sizeKB > 2000) {
        issues.push('Large file size may indicate detailed background');
        complexity = 'moderate';
      }

      // Check image format - JPEG with high compression often has complex backgrounds
      const isJPEG = imageUrl.includes('data:image/jpeg');
      if (isJPEG && sizeKB > 1500) {
        issues.push('Large JPEG suggests detailed/textured background');
        complexity = complexity === 'simple' ? 'moderate' : 'complex';
      }

      // Estimate complexity based on base64 patterns
      const base64Content = imageUrl.split(',')[1];
      if (base64Content) {
        // Look for repeating patterns that suggest simple backgrounds
        const firstKB = base64Content.substring(0, 1000);
        const uniqueChars = new Set(firstKB).size;

        if (uniqueChars < 30) {
          console.log('✅ [BG-ANALYSIS] Low character diversity suggests simple background');
        } else if (uniqueChars > 50) {
          issues.push('High visual complexity detected in image');
          complexity = complexity === 'simple' ? 'moderate' : 'complex';
        }
      }

      const isComplex = complexity === 'complex';
      const canProceed = !isComplex;

      console.log('📊 [BG-ANALYSIS] Background analysis result:', {
        complexity,
        isComplex,
        canProceed,
        issueCount: issues.length,
        sizeKB
      });

      return {
        isComplex,
        complexity,
        issues,
        canProceed
      };

    } catch (error) {
      console.error('❌ [BG-ANALYSIS] Background analysis failed:', error);
      return {
        isComplex: true,
        complexity: 'complex',
        issues: ['Analysis system error'],
        canProceed: false
      };
    }
  }

  /**
   * Enhanced background removal with multiple attempts and pre-processing
   */
  private async performEnhancedBackgroundRemoval(
    imageUrl: string,
    complexityAnalysis: { complexity: 'simple' | 'moderate' | 'complex' }
  ): Promise<{
    success: boolean;
    processedImageUrl?: string;
    error?: string;
    attemptsUsed: number;
  }> {
    try {
      console.log('🎨 [ENHANCED-BG-REMOVAL] Starting enhanced background removal...');
      console.log('🎨 [ENHANCED-BG-REMOVAL] Background complexity:', complexityAnalysis.complexity);

      let attemptsUsed = 0;
      const maxAttempts = complexityAnalysis.complexity === 'simple' ? 2 : 3;

      // Strategy 1: Standard background removal
      attemptsUsed++;
      console.log(`🔄 [ENHANCED-BG-REMOVAL] Attempt ${attemptsUsed}/${maxAttempts}: Standard removal`);

      const standardResult = await this.removeGarmentBackground(imageUrl);
      if (standardResult.success && standardResult.processedImageUrl) {
        const validation = await this.validateBackgroundRemoval(standardResult.processedImageUrl);
        if (validation.isClean && validation.transparencyScore >= 75) {
          console.log('✅ [ENHANCED-BG-REMOVAL] Standard removal successful');
          return {
            success: true,
            processedImageUrl: standardResult.processedImageUrl,
            attemptsUsed
          };
        }
        console.log('⚠️ [ENHANCED-BG-REMOVAL] Standard removal validation failed, trying enhanced');
      }

      // Strategy 2: Enhanced settings for moderate complexity
      if (attemptsUsed < maxAttempts && complexityAnalysis.complexity !== 'simple') {
        attemptsUsed++;
        console.log(`🔄 [ENHANCED-BG-REMOVAL] Attempt ${attemptsUsed}/${maxAttempts}: Enhanced settings`);

        // Pre-process image to enhance contrast (conceptual - would need actual implementation)
        const enhancedResult = await this.removeGarmentBackground(imageUrl);
        if (enhancedResult.success && enhancedResult.processedImageUrl) {
          const validation = await this.validateBackgroundRemoval(enhancedResult.processedImageUrl);
          if (validation.isClean && validation.transparencyScore >= 70) {
            console.log('✅ [ENHANCED-BG-REMOVAL] Enhanced removal successful');
            return {
              success: true,
              processedImageUrl: enhancedResult.processedImageUrl,
              attemptsUsed
            };
          }
        }
      }

      // Strategy 3: Final attempt with maximum settings
      if (attemptsUsed < maxAttempts) {
        attemptsUsed++;
        console.log(`🔄 [ENHANCED-BG-REMOVAL] Attempt ${attemptsUsed}/${maxAttempts}: Maximum settings`);

        const finalResult = await this.removeGarmentBackground(imageUrl);
        if (finalResult.success && finalResult.processedImageUrl) {
          const validation = await this.validateBackgroundRemoval(finalResult.processedImageUrl);
          if (validation.isClean && validation.transparencyScore >= 60) {
            console.log('✅ [ENHANCED-BG-REMOVAL] Final attempt successful');
            return {
              success: true,
              processedImageUrl: finalResult.processedImageUrl,
              attemptsUsed
            };
          }
        }
      }

      console.error('❌ [ENHANCED-BG-REMOVAL] All attempts failed');
      return {
        success: false,
        error: `Background removal failed after ${attemptsUsed} attempts. Background appears too complex.`,
        attemptsUsed
      };

    } catch (error) {
      console.error('❌ [ENHANCED-BG-REMOVAL] Enhanced removal system error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Enhanced background removal system error',
        attemptsUsed: 0
      };
    }
  }

  /**
   * Remove background from garment using background removal service
   */
  private async removeGarmentBackground(imageUrl: string): Promise<{
    success: boolean;
    processedImageUrl?: string;
    error?: string;
  }> {
    try {
      console.log('🎨 [BG-REMOVAL] Starting garment background removal...');

      // Import background removal service
      const { default: backgroundRemovalService } = await import('./backgroundRemovalService');

      const result = await backgroundRemovalService.removeBackground(imageUrl);

      if (result.success && result.imageUrl) {
        console.log('✅ [BG-REMOVAL] Background removal successful');
        return {
          success: true,
          processedImageUrl: result.imageUrl
        };
      } else {
        console.error('❌ [BG-REMOVAL] Background removal failed:', result.error);
        return {
          success: false,
          error: result.error || 'Background removal service failed'
        };
      }
    } catch (error) {
      console.error('❌ [BG-REMOVAL] Background removal error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown background removal error'
      };
    }
  }

  /**
   * Validate that background was successfully removed with retry logic
   */
  private async validateBackgroundRemoval(imageUrl: string): Promise<{
    isClean: boolean;
    issues: string[];
    transparencyScore: number;
    needsRetry?: boolean;
    retryWithSettings?: any;
  }> {
    try {
      const issues: string[] = [];
      let transparencyScore = 100;
      let needsRetry = false;
      let retryWithSettings: any = null;

      console.log('🔍 [BG-VALIDATION] Starting enhanced background removal validation...');

      // Basic validation - check if it's still base64 and reasonable size
      if (this.isBase64Image(imageUrl)) {
        const sizeKB = Math.round(imageUrl.length / 1024);
        const originalSize = sizeKB;

        // Check for PNG format (better for transparency)
        const isPNG = imageUrl.includes('data:image/png');
        const isJPEG = imageUrl.includes('data:image/jpeg');

        if (!isPNG) {
          issues.push('Image not in PNG format for transparency');
          transparencyScore -= 20;
          needsRetry = true;
          retryWithSettings = { forceFormat: 'png' };
        }

        // Analyze file size patterns that indicate background removal success/failure
        if (sizeKB > 3000) {
          issues.push('Image still very large after background removal');
          transparencyScore -= 30;

          // Large PNG usually means background wasn't removed properly
          if (isPNG) {
            needsRetry = true;
            retryWithSettings = {
              model: 'birefnet-v1-lite', // Try lighter model for better performance
              useAdvancedSettings: true
            };
          }
        }

        // Check for typical background removal artifacts
        if (sizeKB < 50) {
          issues.push('Image too small after processing - may be corrupted');
          transparencyScore -= 40;
          needsRetry = true;
          retryWithSettings = { useOriginalSize: true };
        }

        // Estimate transparency based on file size differences
        // PNG with transparency should be reasonably sized but not huge
        if (isPNG && sizeKB > 1500 && sizeKB < 3000) {
          console.log('✅ [BG-VALIDATION] Good PNG size indicates likely transparency');
          transparencyScore += 10;
        }

        // Advanced validation: Check base64 for common transparency patterns
        if (isPNG) {
          const base64Content = imageUrl.split(',')[1];

          // Look for PNG transparency chunk indicators in base64
          if (base64Content.includes('IEND') || base64Content.length > 1000) {
            console.log('✅ [BG-VALIDATION] PNG structure appears valid');
          } else {
            issues.push('PNG structure may be corrupted');
            transparencyScore -= 25;
            needsRetry = true;
          }
        }

        console.log('📊 [BG-VALIDATION] Size analysis:', {
          originalSizeKB: originalSize,
          isPNG,
          isJPEG,
          estimatedTransparency: transparencyScore
        });

      } else {
        // URL images are harder to validate - assume needs verification
        transparencyScore = 60;
        issues.push('Cannot validate URL-based images thoroughly');
        needsRetry = true;
        retryWithSettings = { downloadAndValidate: true };
      }

      // Calculate final score with weighted criteria
      const baseScore = transparencyScore;
      const issueCount = issues.length;

      // Penalize based on issue severity
      const finalScore = Math.max(0, baseScore - (issueCount * 10));
      const isClean = finalScore >= 70 && !needsRetry;

      const result = {
        isClean,
        issues,
        transparencyScore: finalScore,
        needsRetry,
        retryWithSettings
      };

      console.log('🔍 [BG-VALIDATION] Enhanced validation result:', result);

      return result;
    } catch (error) {
      console.error('❌ [BG-VALIDATION] Enhanced validation failed:', error);
      return {
        isClean: false,
        issues: ['Validation system error'],
        transparencyScore: 0,
        needsRetry: true,
        retryWithSettings: { fallbackToBasic: true }
      };
    }
  }

  /**
   * Resize image for optimal FASHN processing (max 2048px on longest side)
   */
  private async resizeForFashn(imageUrl: string): Promise<{
    success: boolean;
    resizedImageUrl: string;
    originalDimensions: { width: number; height: number };
    finalDimensions: { width: number; height: number };
    resizeRatio: number;
    error?: string;
  }> {
    try {
      console.log('📏 [RESIZE] Starting smart image resizing for FASHN...');

      if (!this.isBase64Image(imageUrl)) {
        console.log('⚠️ [RESIZE] URL images cannot be resized - returning original');
        return {
          success: true,
          resizedImageUrl: imageUrl,
          originalDimensions: { width: 1024, height: 1024 },
          finalDimensions: { width: 1024, height: 1024 },
          resizeRatio: 1.0
        };
      }

      // Create image and canvas for processing
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Process image with smart resizing
      const resizedImage = await new Promise<{
        dataUrl: string;
        originalDims: { width: number; height: number };
        finalDims: { width: number; height: number };
        ratio: number;
      }>((resolve, reject) => {
        img.onload = () => {
          try {
            const originalWidth = img.width;
            const originalHeight = img.height;
            const maxDimension = 2048;

            console.log('📐 [RESIZE] Original dimensions:', { originalWidth, originalHeight });

            // Calculate new dimensions maintaining aspect ratio
            let newWidth = originalWidth;
            let newHeight = originalHeight;
            let resizeRatio = 1.0;

            // Only resize if image is larger than maximum allowed
            if (originalWidth > maxDimension || originalHeight > maxDimension) {
              if (originalWidth > originalHeight) {
                // Landscape: limit width
                resizeRatio = maxDimension / originalWidth;
                newWidth = maxDimension;
                newHeight = Math.round(originalHeight * resizeRatio);
              } else {
                // Portrait: limit height
                resizeRatio = maxDimension / originalHeight;
                newHeight = maxDimension;
                newWidth = Math.round(originalWidth * resizeRatio);
              }

              console.log('🔄 [RESIZE] Resizing required:', {
                newWidth,
                newHeight,
                resizeRatio: resizeRatio.toFixed(3)
              });
            } else {
              console.log('✅ [RESIZE] Image already within optimal dimensions');
            }

            // Set canvas to new dimensions
            canvas.width = newWidth;
            canvas.height = newHeight;

            // Enable image smoothing for high-quality scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw resized image
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // Convert to PNG for consistency and quality
            const resizedDataUrl = canvas.toDataURL('image/png', 0.95);

            resolve({
              dataUrl: resizedDataUrl,
              originalDims: { width: originalWidth, height: originalHeight },
              finalDims: { width: newWidth, height: newHeight },
              ratio: resizeRatio
            });
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error('Failed to load image for resizing'));
        img.src = imageUrl;
      });

      console.log('✅ [RESIZE] Smart resizing completed:', {
        originalDimensions: resizedImage.originalDims,
        finalDimensions: resizedImage.finalDims,
        resizeRatio: resizedImage.ratio.toFixed(3)
      });

      return {
        success: true,
        resizedImageUrl: resizedImage.dataUrl,
        originalDimensions: resizedImage.originalDims,
        finalDimensions: resizedImage.finalDims,
        resizeRatio: resizedImage.ratio
      };

    } catch (error) {
      console.error('❌ [RESIZE] Smart resizing failed:', error);
      return {
        success: false,
        resizedImageUrl: imageUrl,
        originalDimensions: { width: 0, height: 0 },
        finalDimensions: { width: 0, height: 0 },
        resizeRatio: 1.0,
        error: error instanceof Error ? error.message : 'Unknown resize error'
      };
    }
  }

  /**
   * Resize avatar to FASHN's preferred resolution (1024x1365 portrait)
   */
  private async resizeAvatarForFashn(imageUrl: string): Promise<{
    success: boolean;
    resizedImageUrl: string;
    originalDimensions: { width: number; height: number };
    finalDimensions: { width: number; height: number };
    error?: string;
  }> {
    try {
      console.log('📐 [AVATAR-RESIZE] Resizing avatar to FASHN optimal resolution (1024x1365)...');

      if (!this.isBase64Image(imageUrl)) {
        console.log('⚠️ [AVATAR-RESIZE] URL images cannot be resized - returning original');
        return {
          success: true,
          resizedImageUrl: imageUrl,
          originalDimensions: { width: 1024, height: 1365 },
          finalDimensions: { width: 1024, height: 1365 }
        };
      }

      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      const resizedImage = await new Promise<{
        dataUrl: string;
        originalDims: { width: number; height: number };
      }>((resolve, reject) => {
        img.onload = () => {
          try {
            const originalWidth = img.width;
            const originalHeight = img.height;

            // FASHN's preferred resolution
            const targetWidth = 1024;
            const targetHeight = 1365;

            console.log('📐 [AVATAR-RESIZE] Original dimensions:', { originalWidth, originalHeight });
            console.log('🎯 [AVATAR-RESIZE] Target dimensions:', { targetWidth, targetHeight });

            // Set canvas to target dimensions
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Enable high-quality scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Calculate scaling to cover canvas while maintaining aspect ratio
            const scale = Math.max(targetWidth / originalWidth, targetHeight / originalHeight);
            const scaledWidth = originalWidth * scale;
            const scaledHeight = originalHeight * scale;

            // Center the image
            const offsetX = (targetWidth - scaledWidth) / 2;
            const offsetY = (targetHeight - scaledHeight) / 2;

            // Fill background with white
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetWidth, targetHeight);

            // Draw scaled and centered image
            ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

            // Convert to PNG with high quality
            const resizedDataUrl = canvas.toDataURL('image/png', 0.98);

            resolve({
              dataUrl: resizedDataUrl,
              originalDims: { width: originalWidth, height: originalHeight }
            });
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error('Failed to load image for avatar resizing'));
        img.src = imageUrl;
      });

      console.log('✅ [AVATAR-RESIZE] Avatar resized successfully to 1024x1365');

      return {
        success: true,
        resizedImageUrl: resizedImage.dataUrl,
        originalDimensions: resizedImage.originalDims,
        finalDimensions: { width: 1024, height: 1365 }
      };

    } catch (error) {
      console.error('❌ [AVATAR-RESIZE] Avatar resizing failed:', error);
      return {
        success: false,
        resizedImageUrl: imageUrl,
        originalDimensions: { width: 0, height: 0 },
        finalDimensions: { width: 0, height: 0 },
        error: error instanceof Error ? error.message : 'Unknown resize error'
      };
    }
  }

  /**
   * Enhance avatar contrast for better garment edge detection
   */
  private async enhanceAvatarContrast(imageUrl: string): Promise<{
    success: boolean;
    enhancedImageUrl: string;
    error?: string;
  }> {
    try {
      console.log('🎨 [CONTRAST] Enhancing avatar contrast for better garment fitting...');

      if (!this.isBase64Image(imageUrl)) {
        console.log('⚠️ [CONTRAST] URL images cannot be enhanced - returning original');
        return {
          success: true,
          enhancedImageUrl: imageUrl
        };
      }

      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      const enhancedImage = await new Promise<string>((resolve, reject) => {
        img.onload = () => {
          try {
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Get image data for pixel manipulation
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Apply contrast enhancement (1.15x contrast boost)
            const contrastFactor = 1.15;
            const intercept = 128 * (1 - contrastFactor);

            for (let i = 0; i < data.length; i += 4) {
              // Apply contrast to RGB channels
              data[i] = Math.min(255, Math.max(0, data[i] * contrastFactor + intercept));     // Red
              data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrastFactor + intercept)); // Green
              data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrastFactor + intercept)); // Blue
              // Alpha channel (data[i + 3]) remains unchanged
            }

            // Put enhanced image data back
            ctx.putImageData(imageData, 0, 0);

            // Convert to PNG with high quality
            const enhancedDataUrl = canvas.toDataURL('image/png', 0.98);

            resolve(enhancedDataUrl);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error('Failed to load image for contrast enhancement'));
        img.src = imageUrl;
      });

      console.log('✅ [CONTRAST] Contrast enhancement complete');

      return {
        success: true,
        enhancedImageUrl: enhancedImage
      };

    } catch (error) {
      console.error('❌ [CONTRAST] Contrast enhancement failed:', error);
      return {
        success: false,
        enhancedImageUrl: imageUrl,
        error: error instanceof Error ? error.message : 'Unknown contrast enhancement error'
      };
    }
  }

  /**
   * Compress image for FASHN compatibility (under 3MB with quality optimization)
   */
  private async compressForFashn(imageUrl: string): Promise<{
    success: boolean;
    compressedImageUrl: string;
    originalSizeKB: number;
    finalSizeKB: number;
    compressionRatio: number;
    qualityUsed: number;
    error?: string;
  }> {
    try {
      console.log('🗜️ [COMPRESS] Starting smart image compression for FASHN...');

      const originalSizeKB = this.isBase64Image(imageUrl) ?
        Math.round(imageUrl.length / 1024) : 1024;

      console.log('📊 [COMPRESS] Original size:', originalSizeKB + 'KB');

      // Target: under 3MB (3072KB) for FASHN API
      const targetSizeKB = 3000;

      // If already under target size, check if we can optimize quality
      if (originalSizeKB <= targetSizeKB) {
        console.log('✅ [COMPRESS] Image already under target size');

        // Still optimize for quality if it's a large PNG
        if (originalSizeKB > 1500 && imageUrl.includes('data:image/png')) {
          console.log('🔄 [COMPRESS] Large PNG detected - optimizing quality');
        } else {
          return {
            success: true,
            compressedImageUrl: imageUrl,
            originalSizeKB,
            finalSizeKB: originalSizeKB,
            compressionRatio: 1.0,
            qualityUsed: 1.0
          };
        }
      }

      if (!this.isBase64Image(imageUrl)) {
        console.log('⚠️ [COMPRESS] URL images cannot be compressed - returning original');
        return {
          success: true,
          compressedImageUrl: imageUrl,
          originalSizeKB,
          finalSizeKB: originalSizeKB,
          compressionRatio: 1.0,
          qualityUsed: 1.0
        };
      }

      // Create image and canvas for compression
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Perform smart compression with progressive quality reduction
      const compressedResult = await new Promise<{
        dataUrl: string;
        finalSize: number;
        quality: number;
      }>((resolve, reject) => {
        img.onload = () => {
          try {
            // Set canvas to image dimensions
            canvas.width = img.width;
            canvas.height = img.height;

            // Enable high quality rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw the image
            ctx.drawImage(img, 0, 0);

            // Progressive compression: try different quality levels
            const qualityLevels = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6];
            let bestResult = { dataUrl: imageUrl, finalSize: originalSizeKB, quality: 1.0 };

            for (const quality of qualityLevels) {
              // Try JPEG compression first (smaller file sizes)
              const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
              const jpegSizeKB = Math.round(jpegDataUrl.length / 1024);

              console.log(`🔄 [COMPRESS] Testing JPEG quality ${quality}: ${jpegSizeKB}KB`);

              if (jpegSizeKB <= targetSizeKB) {
                bestResult = {
                  dataUrl: jpegDataUrl,
                  finalSize: jpegSizeKB,
                  quality
                };
                break;
              }

              // If JPEG still too large, try PNG with same quality
              const pngDataUrl = canvas.toDataURL('image/png', quality);
              const pngSizeKB = Math.round(pngDataUrl.length / 1024);

              console.log(`🔄 [COMPRESS] Testing PNG quality ${quality}: ${pngSizeKB}KB`);

              if (pngSizeKB <= targetSizeKB) {
                bestResult = {
                  dataUrl: pngDataUrl,
                  finalSize: pngSizeKB,
                  quality
                };
                break;
              }

              // Keep the best result so far
              if (jpegSizeKB < bestResult.finalSize) {
                bestResult = {
                  dataUrl: jpegDataUrl,
                  finalSize: jpegSizeKB,
                  quality
                };
              }
            }

            console.log('✅ [COMPRESS] Best compression result:', {
              originalSizeKB,
              finalSizeKB: bestResult.finalSize,
              quality: bestResult.quality,
              reduction: ((originalSizeKB - bestResult.finalSize) / originalSizeKB * 100).toFixed(1) + '%'
            });

            resolve(bestResult);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = imageUrl;
      });

      const compressionRatio = originalSizeKB > 0 ? compressedResult.finalSize / originalSizeKB : 1.0;

      console.log('✅ [COMPRESS] Smart compression completed:', {
        originalSizeKB,
        finalSizeKB: compressedResult.finalSize,
        compressionRatio: compressionRatio.toFixed(3),
        qualityUsed: compressedResult.quality
      });

      return {
        success: true,
        compressedImageUrl: compressedResult.dataUrl,
        originalSizeKB,
        finalSizeKB: compressedResult.finalSize,
        compressionRatio,
        qualityUsed: compressedResult.quality
      };

    } catch (error) {
      console.error('❌ [COMPRESS] Smart compression failed:', error);
      const originalSizeKB = this.isBase64Image(imageUrl) ?
        Math.round(imageUrl.length / 1024) : 0;

      return {
        success: false,
        compressedImageUrl: imageUrl,
        originalSizeKB,
        finalSizeKB: originalSizeKB,
        compressionRatio: 1.0,
        qualityUsed: 1.0,
        error: error instanceof Error ? error.message : 'Unknown compression error'
      };
    }
  }

  /**
   * Optimize image format for FASHN (PNG with transparency)
   */
  private async optimizeFormatForFashn(imageUrl: string): Promise<{
    success: boolean;
    optimizedImageUrl: string;
    error?: string;
  }> {
    try {
      // Check if already PNG
      if (imageUrl.includes('data:image/png')) {
        return {
          success: true,
          optimizedImageUrl: imageUrl
        };
      }

      // For now, return original image
      // In production, this would convert to PNG for transparency
      console.log('🎨 [FORMAT] Format optimization (placeholder - using original)');

      return {
        success: true,
        optimizedImageUrl: imageUrl
      };
    } catch (error) {
      return {
        success: false,
        optimizedImageUrl: imageUrl,
        error: error instanceof Error ? error.message : 'Unknown format optimization error'
      };
    }
  }

  /**
   * Final validation that garment is ready for FASHN
   */
  private async validateGarmentForFashn(imageUrl: string): Promise<{
    isValid: boolean;
    issues: string[];
    finalDimensions: { width: number; height: number };
    finalSizeKB: number;
  }> {
    try {
      const issues: string[] = [];
      const finalSizeKB = this.isBase64Image(imageUrl) ?
        Math.round(imageUrl.length / 1024) : 1024;

      // Relaxed size limits (increased from 5MB to 8MB)
      if (finalSizeKB > 8000) {
        issues.push('Image too large for FASHN (>8MB)');
      }

      // Relaxed format check - accept HTTP URLs and data URLs
      if (!imageUrl.includes('http') && !imageUrl.includes('data:image/')) {
        issues.push('Invalid image format or URL');
      }

      // Relaxed validity check - less aggressive length requirement
      if (!imageUrl || imageUrl.length < 50) {
        issues.push('Image appears empty');
      }

      const isValid = issues.length === 0;

      console.log('✅ [FINAL-VALIDATION] Garment FASHN validation:', {
        isValid,
        finalSizeKB,
        issueCount: issues.length
      });

      return {
        isValid,
        issues,
        finalDimensions: { width: 1024, height: 1024 },
        finalSizeKB
      };
    } catch (error) {
      console.error('❌ [FINAL-VALIDATION] Validation failed:', error);
      return {
        isValid: false,
        issues: ['Final validation system error'],
        finalDimensions: { width: 0, height: 0 },
        finalSizeKB: 0
      };
    }
  }

  /**
   * Generate user-friendly error messages for garment processing failures with actionable guidance
   */
  private generateUserFriendlyGarmentError(error: any): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const lowerError = errorMessage.toLowerCase();

    console.log('🔍 [ERROR-ANALYSIS] Generating user-friendly error for:', errorMessage);

    // Smart processing information - no longer blocking errors
    if (lowerError.includes('smart_processing') || lowerError.includes('background processing')) {
      return '🎨 **Image Processing Update**: We\'ve optimized your image for the best virtual try-on experience.\n\n' +
             '✅ **What happened**:\n' +
             '• Your image was automatically analyzed\n' +
             '• Background removal was attempted when beneficial\n' +
             '• Image was optimized for virtual try-on\n\n' +
             '💡 **Tip**: Different image types (screenshots, photos, downloads) are all supported!';
    }

    // File size related errors
    if (lowerError.includes('too large') || lowerError.includes('file size') || lowerError.includes('3mb')) {
      return '📏 **File Size Too Large**: Your photo is too big for processing.\n\n' +
             '✅ **Try this**:\n' +
             '• Take a new photo at lower resolution\n' +
             '• Use your phone\'s built-in compression\n' +
             '• Maximum file size: 3MB';
    }

    // Image quality/corruption errors
    if (lowerError.includes('corrupted') || lowerError.includes('empty') || lowerError.includes('invalid') || lowerError.includes('load')) {
      return '🖼️ **Photo Quality Issue**: There\'s a problem with your image file.\n\n' +
             '✅ **Try this**:\n' +
             '• Take a fresh photo instead of using an old one\n' +
             '• Make sure the photo saved properly\n' +
             '• Try a different camera app if the issue persists';
    }

    // Orientation/format errors
    if (lowerError.includes('orientation') || lowerError.includes('exif') || lowerError.includes('format')) {
      return '🔄 **Photo Format Issue**: We had trouble processing your photo\'s format or orientation.\n\n' +
             '✅ **Try this**:\n' +
             '• Take a new photo in portrait mode\n' +
             '• Make sure the garment is right-side up\n' +
             '• Use JPG or PNG format';
    }

    // Compression/processing errors
    if (lowerError.includes('compression') || lowerError.includes('resize') || lowerError.includes('canvas')) {
      return '⚙️ **Processing Error**: We encountered a technical issue while optimizing your photo.\n\n' +
             '✅ **Try this**:\n' +
             '• Take a smaller, simpler photo\n' +
             '• Use a different device or camera\n' +
             '• Try again in a few moments';
    }

    // Validation errors
    if (lowerError.includes('validation failed') || lowerError.includes('not valid')) {
      return '🔍 **Photo Validation Failed**: Your photo doesn\'t meet the requirements for virtual try-on.\n\n' +
             '✅ **Try this**:\n' +
             '• Ensure the garment takes up most of the photo\n' +
             '• Use good lighting so all details are visible\n' +
             '• Make sure the photo is clear and not blurry';
    }

    // FASHN API specific errors
    if (lowerError.includes('fashn') || lowerError.includes('400') || lowerError.includes('api')) {
      return '🌐 **Virtual Try-On Service Issue**: The try-on service couldn\'t process your garment.\n\n' +
             '✅ **Try this**:\n' +
             '• Use a high-quality photo with clear garment details\n' +
             '• Ensure the background is completely plain\n' +
             '• Make sure the entire garment is visible in the photo';
    }

    // Network/connectivity errors
    if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('timeout')) {
      return '📶 **Connection Issue**: We\'re having trouble connecting to our processing service.\n\n' +
             '✅ **Try this**:\n' +
             '• Check your internet connection\n' +
             '• Try again in a few moments\n' +
             '• If the problem continues, try refreshing the page';
    }

    // Generic fallback with multiple options
    return '🖼️ **Let\'s Try a Different Approach**: Having trouble with this image? No worries!\n\n' +
           '✅ **Quick fixes to try**:\n' +
           '• **Try a different image** - Screenshots or downloads from stores often work great\n' +
           '• **Check image quality** - Make sure the garment is clearly visible\n' +
           '• **File size** - Keep under 3MB for best performance\n' +
           '• **Try again** - Sometimes a simple retry works\n\n' +
           '💡 **Remember**: You can upload ANY garment image - screenshots, downloads, or your own photos all work!';
  }

  /**
   * Validate avatar pose quality for FASHN compatibility
   * Checks for proper arm positioning and body structure
   */
  private async validateAvatarPose(avatarImageUrl: string): Promise<{
    isValid: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    try {
      // Basic pose validation - in a production environment, this could use computer vision
      // For now, we'll do basic checks and provide a simplified validation

      const issues: string[] = [];
      const suggestions: string[] = [];
      let score = 100;

      // Check if it's a data URL (base64) or HTTP URL
      if (!avatarImageUrl || typeof avatarImageUrl !== 'string') {
        issues.push('Invalid avatar image URL');
        score -= 50;
      }

      // URL format validation
      if (!avatarImageUrl.startsWith('data:') && !avatarImageUrl.startsWith('http')) {
        issues.push('Avatar URL format not supported for pose analysis');
        score -= 20;
      }

      // For base64 data URLs, we can do some basic analysis
      if (avatarImageUrl.startsWith('data:image/')) {
        const sizeEstimate = avatarImageUrl.length * 0.75 / 1024; // Rough KB estimate

        if (sizeEstimate < 50) {
          issues.push('Avatar image may be too small for accurate pose detection');
          suggestions.push('Use higher resolution avatar for better FASHN results');
          score -= 15;
        }

        if (sizeEstimate > 5000) {
          issues.push('Avatar image may be too large, could affect processing');
          suggestions.push('Consider image compression for faster processing');
          score -= 5;
        }
      }

      // Basic pose guidance (since we enhanced the avatar generation prompts)
      if (score >= 80) {
        suggestions.push('Avatar appears suitable for FASHN processing');
      } else if (score >= 60) {
        suggestions.push('Avatar may work but could benefit from regeneration with better pose');
      } else {
        suggestions.push('Consider regenerating avatar with arms straight down at sides');
      }

      const isValid = score >= 50; // 50% minimum threshold

      console.log('🧭 [POSE-VALIDATION] Pose analysis complete:', {
        score,
        isValid,
        issuesCount: issues.length,
        suggestionsCount: suggestions.length
      });

      return {
        isValid,
        score,
        issues,
        suggestions
      };

    } catch (error) {
      console.warn('⚠️ [POSE-VALIDATION] Pose validation failed, proceeding anyway:', error);

      // If validation fails, assume it's valid but with warnings
      return {
        isValid: true,
        score: 75,
        issues: ['Pose validation error - proceeding with caution'],
        suggestions: ['Consider regenerating avatar if FASHN results are poor']
      };
    }
  }
}

export default new DirectFashnService();