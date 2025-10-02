/**
 * Environment Configuration for 3D Realistic Avatar Generation
 * Centralizes all environment variable access and validation
 */

export interface EnvironmentConfig {
  // FAL API Configuration (DEPRECATED - removed from dependencies)
  falKey: string | null;

  // FASHN API Configuration (for virtual try-on)
  fashnApiKey: string | null;

  // 3D Realistic Avatar Configuration
  avatarGenerationMode: '3D_REALISTIC' | '2D_CGI';
  defaultAvatarStyle: 'realistic' | 'artistic' | 'professional' | 'cinematic';
  defaultAvatarPerspective: 'portrait' | 'bust' | 'full';

  // Avatar Generation Model Selection
  avatarModelType: 'NANO_BANANA' | 'PHOTOMAKER' | 'NANO_BANANA_EDIT' | 'GEMINI_CGI' | 'BYTEDANCE_SEEDREAM';

  // Nano Banana Model Configuration
  nanoBananaModelId: string;
  nanoBananaEditModelId: string;
  defaultOutputFormat: 'jpeg' | 'png';
  defaultNumImages: number;
  enableSyncMode: boolean;

  // Gemini CGI Model Configuration
  geminiCGIModelId: string;

  // ByteDance Seedream Model Configuration
  byteDanceSeedreamModelId: string;
  byteDanceImageSizeWidth: number;
  byteDanceImageSizeHeight: number;

  // PhotoMaker Model Configuration
  photoMakerModelId: string;
  photoMakerDefaultStyle: 'Photographic' | 'Cinematic' | 'Disney Character';
  photoMakerStyleStrength: number;
  photoMakerGuidanceScale: number;
  photoMakerInferenceSteps: number;

  // CGI Enhancement Configuration
  cgiQualityPreset: 'animation_studio' | 'game_engine' | 'film_quality';
  enableCGIEnhancement: boolean;

  // Development Settings
  isDevelopmentMode: boolean;
  useDemoImages: boolean;
  forceProductionApi: boolean;
}

class EnvironmentConfigService {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): EnvironmentConfig {
    return {
      // FAL API Configuration (DEPRECATED - no longer used)
      falKey: null, // Removed fal-ai dependencies

      // FASHN API Configuration
      fashnApiKey: import.meta.env.VITE_FASHN_API_KEY || null,

      // 3D Realistic Avatar Configuration
      avatarGenerationMode: (import.meta.env.VITE_AVATAR_GENERATION_MODE as any) || '3D_REALISTIC',
      defaultAvatarStyle: (import.meta.env.VITE_DEFAULT_AVATAR_STYLE as any) || 'realistic',
      defaultAvatarPerspective: (import.meta.env.VITE_DEFAULT_AVATAR_PERSPECTIVE as any) || 'portrait',

      // Avatar Generation Model Selection
      avatarModelType: (import.meta.env.VITE_AVATAR_MODEL_TYPE as any) || 'GEMINI_CGI',

      // Nano Banana Model Configuration
      nanoBananaModelId: import.meta.env.VITE_NANO_BANANA_MODEL_ID || 'fal-ai/nano-banana',
      nanoBananaEditModelId: import.meta.env.VITE_NANO_BANANA_EDIT_MODEL_ID || 'fal-ai/nano-banana-edit',
      defaultOutputFormat: (import.meta.env.VITE_DEFAULT_OUTPUT_FORMAT as any) || 'jpeg',
      defaultNumImages: parseInt(import.meta.env.VITE_DEFAULT_NUM_IMAGES) || 1,
      enableSyncMode: import.meta.env.VITE_ENABLE_SYNC_MODE === 'true',

      // Gemini CGI Model Configuration
      geminiCGIModelId: import.meta.env.VITE_GEMINI_CGI_MODEL_ID || 'fal-ai/gemini-25-flash-image',

      // ByteDance Seedream Model Configuration
      byteDanceSeedreamModelId: import.meta.env.VITE_BYTEDANCE_SEEDREAM_MODEL_ID || 'fal-ai/bytedance/seedream/v4/edit',
      byteDanceImageSizeWidth: parseInt(import.meta.env.VITE_BYTEDANCE_IMAGE_SIZE_WIDTH) || 2048,
      byteDanceImageSizeHeight: parseInt(import.meta.env.VITE_BYTEDANCE_IMAGE_SIZE_HEIGHT) || 2048,

      // PhotoMaker Model Configuration
      photoMakerModelId: import.meta.env.VITE_PHOTOMAKER_MODEL_ID || 'fal-ai/photomaker',
      photoMakerDefaultStyle: (import.meta.env.VITE_PHOTOMAKER_DEFAULT_STYLE as any) || 'Photographic',
      photoMakerStyleStrength: parseFloat(import.meta.env.VITE_PHOTOMAKER_STYLE_STRENGTH) || 20,
      photoMakerGuidanceScale: parseFloat(import.meta.env.VITE_PHOTOMAKER_GUIDANCE_SCALE) || 5,
      photoMakerInferenceSteps: parseInt(import.meta.env.VITE_PHOTOMAKER_INFERENCE_STEPS) || 20,

      // CGI Enhancement Configuration
      cgiQualityPreset: (import.meta.env.VITE_CGI_QUALITY_PRESET as any) || 'animation_studio',
      enableCGIEnhancement: import.meta.env.VITE_ENABLE_CGI_ENHANCEMENT !== 'false',

      // Development Settings
      isDevelopmentMode: import.meta.env.VITE_DEVELOPMENT_MODE === 'true',
      useDemoImages: import.meta.env.VITE_USE_DEMO_IMAGES === 'true',
      forceProductionApi: import.meta.env.VITE_FORCE_PRODUCTION_API === 'true'
    };
  }

  /**
   * Get the current environment configuration
   */
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Validate the current environment configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log('🔧 Validating 3D Realistic Avatar environment configuration...');

    // FASHN API is accessed via proxy
    console.log('✅ FASHN API configured via /api/fashn proxy');

    // FAL API deprecation notice
    if (this.config.falKey) {
      warnings.push('VITE_FAL_KEY is deprecated - fal-ai dependencies have been removed');
    }

    // Validate Avatar Generation Mode
    if (!['3D_REALISTIC', '2D_CGI'].includes(this.config.avatarGenerationMode)) {
      warnings.push(`Invalid VITE_AVATAR_GENERATION_MODE: ${this.config.avatarGenerationMode}. Using 3D_REALISTIC.`);
    }

    // Validate Avatar Style
    if (!['realistic', 'artistic', 'professional', 'cinematic'].includes(this.config.defaultAvatarStyle)) {
      warnings.push(`Invalid VITE_DEFAULT_AVATAR_STYLE: ${this.config.defaultAvatarStyle}. Using realistic.`);
    }

    // Validate Avatar Perspective
    if (!['portrait', 'bust', 'full'].includes(this.config.defaultAvatarPerspective)) {
      warnings.push(`Invalid VITE_DEFAULT_AVATAR_PERSPECTIVE: ${this.config.defaultAvatarPerspective}. Using portrait.`);
    }

    // Validate Output Format
    if (!['jpeg', 'png'].includes(this.config.defaultOutputFormat)) {
      warnings.push(`Invalid VITE_DEFAULT_OUTPUT_FORMAT: ${this.config.defaultOutputFormat}. Using jpeg.`);
    }

    // Validate Number of Images
    if (this.config.defaultNumImages < 1 || this.config.defaultNumImages > 4) {
      warnings.push(`Invalid VITE_DEFAULT_NUM_IMAGES: ${this.config.defaultNumImages}. Should be 1-4. Using 1.`);
    }

    // Validate Model IDs
    if (!this.config.nanoBananaModelId.includes('nano-banana')) {
      warnings.push(`Unusual VITE_NANO_BANANA_MODEL_ID: ${this.config.nanoBananaModelId}. Expected to contain 'nano-banana'.`);
    }

    if (!this.config.nanoBananaEditModelId.includes('nano-banana')) {
      warnings.push(`Unusual VITE_NANO_BANANA_EDIT_MODEL_ID: ${this.config.nanoBananaEditModelId}. Expected to contain 'nano-banana'.`);
    }

    if (!this.config.geminiCGIModelId.includes('gemini')) {
      warnings.push(`Unusual VITE_GEMINI_CGI_MODEL_ID: ${this.config.geminiCGIModelId}. Expected to contain 'gemini'.`);
    }

    if (!this.config.photoMakerModelId.includes('photomaker')) {
      warnings.push(`Unusual VITE_PHOTOMAKER_MODEL_ID: ${this.config.photoMakerModelId}. Expected to contain 'photomaker'.`);
    }

    if (!this.config.byteDanceSeedreamModelId.includes('bytedance') && !this.config.byteDanceSeedreamModelId.includes('seedream')) {
      warnings.push(`Unusual VITE_BYTEDANCE_SEEDREAM_MODEL_ID: ${this.config.byteDanceSeedreamModelId}. Expected to contain 'bytedance' or 'seedream'.`);
    }

    // Validate Avatar Model Type
    if (!['NANO_BANANA', 'PHOTOMAKER', 'NANO_BANANA_EDIT', 'GEMINI_CGI', 'BYTEDANCE_SEEDREAM'].includes(this.config.avatarModelType)) {
      warnings.push(`Invalid VITE_AVATAR_MODEL_TYPE: ${this.config.avatarModelType}. Using GEMINI_CGI.`);
    }

    // Validate PhotoMaker Style
    if (!['Photographic', 'Cinematic', 'Disney Character'].includes(this.config.photoMakerDefaultStyle)) {
      warnings.push(`Invalid VITE_PHOTOMAKER_DEFAULT_STYLE: ${this.config.photoMakerDefaultStyle}. Using Photographic.`);
    }

    // Validate PhotoMaker Parameters
    if (this.config.photoMakerStyleStrength < 0 || this.config.photoMakerStyleStrength > 100) {
      warnings.push(`Invalid VITE_PHOTOMAKER_STYLE_STRENGTH: ${this.config.photoMakerStyleStrength}. Should be 0-100. Using 20.`);
    }

    if (this.config.photoMakerGuidanceScale < 1 || this.config.photoMakerGuidanceScale > 20) {
      warnings.push(`Invalid VITE_PHOTOMAKER_GUIDANCE_SCALE: ${this.config.photoMakerGuidanceScale}. Should be 1-20. Using 5.`);
    }

    if (this.config.photoMakerInferenceSteps < 1 || this.config.photoMakerInferenceSteps > 50) {
      warnings.push(`Invalid VITE_PHOTOMAKER_INFERENCE_STEPS: ${this.config.photoMakerInferenceSteps}. Should be 1-50. Using 20.`);
    }

    // Validate ByteDance Image Sizes
    if (this.config.byteDanceImageSizeWidth < 512 || this.config.byteDanceImageSizeWidth > 4096) {
      warnings.push(`Invalid VITE_BYTEDANCE_IMAGE_SIZE_WIDTH: ${this.config.byteDanceImageSizeWidth}. Should be 512-4096. Using 2048.`);
    }

    if (this.config.byteDanceImageSizeHeight < 512 || this.config.byteDanceImageSizeHeight > 4096) {
      warnings.push(`Invalid VITE_BYTEDANCE_IMAGE_SIZE_HEIGHT: ${this.config.byteDanceImageSizeHeight}. Should be 512-4096. Using 2048.`);
    }

    // Validate CGI Settings
    if (!['animation_studio', 'game_engine', 'film_quality'].includes(this.config.cgiQualityPreset)) {
      warnings.push(`Invalid VITE_CGI_QUALITY_PRESET: ${this.config.cgiQualityPreset}. Using animation_studio.`);
    }

    // Log configuration summary
    console.log('📊 Environment Configuration Summary:', {
      mode: this.config.avatarGenerationMode,
      modelType: this.config.avatarModelType,
      style: this.config.defaultAvatarStyle,
      perspective: this.config.defaultAvatarPerspective,
      nanoBananaModel: this.config.nanoBananaModelId,
      photoMakerModel: this.config.photoMakerModelId,
      photoMakerStyle: this.config.photoMakerDefaultStyle,
      // CGI Settings
      cgiQualityPreset: this.config.cgiQualityPreset,
      cgiEnhancementEnabled: this.config.enableCGIEnhancement,
      outputFormat: this.config.defaultOutputFormat,
      numImages: this.config.defaultNumImages,
      syncMode: this.config.enableSyncMode,
      development: this.config.isDevelopmentMode,
      hasApiKey: !!this.config.falKey, // DEPRECATED
      hasFashnApiKey: !!this.config.fashnApiKey
    });

    if (warnings.length > 0) {
      console.warn('⚠️ Configuration warnings:', warnings);
    }

    if (errors.length > 0) {
      console.error('❌ Configuration errors:', errors);
    } else {
      console.log('✅ Environment configuration validation passed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get configuration for Nano Banana API requests
   */
  getNanoBananaConfig() {
    return {
      modelId: this.config.nanoBananaModelId,
      defaultOutputFormat: this.config.defaultOutputFormat,
      defaultNumImages: this.config.defaultNumImages,
      enableSyncMode: this.config.enableSyncMode
    };
  }

  /**
   * Get configuration for Nano Banana Edit API requests
   */
  getNanoBananaEditConfig() {
    return {
      modelId: this.config.nanoBananaEditModelId,
      defaultOutputFormat: this.config.defaultOutputFormat,
      defaultNumImages: this.config.defaultNumImages,
      enableSyncMode: this.config.enableSyncMode,
      // CGI Enhancement settings
      cgiQualityPreset: this.config.cgiQualityPreset,
      enableCGIEnhancement: this.config.enableCGIEnhancement
    };
  }

  /**
   * Get configuration for Gemini CGI API requests
   */
  getGeminiCGIConfig() {
    return {
      modelId: this.config.geminiCGIModelId,
      defaultOutputFormat: this.config.defaultOutputFormat,
      defaultNumImages: this.config.defaultNumImages,
      enableSyncMode: this.config.enableSyncMode,
      // CGI Enhancement settings
      cgiQualityPreset: this.config.cgiQualityPreset,
      enableCGIEnhancement: this.config.enableCGIEnhancement
    };
  }

  /**
   * Get configuration for PhotoMaker API requests
   */
  getPhotoMakerConfig() {
    return {
      modelId: this.config.photoMakerModelId,
      defaultStyle: this.config.photoMakerDefaultStyle,
      defaultStyleStrength: this.config.photoMakerStyleStrength,
      defaultGuidanceScale: this.config.photoMakerGuidanceScale,
      defaultInferenceSteps: this.config.photoMakerInferenceSteps,
      defaultNumImages: this.config.defaultNumImages,
      // CGI Enhancement settings
      cgiQualityPreset: this.config.cgiQualityPreset,
      enableCGIEnhancement: this.config.enableCGIEnhancement
    };
  }

  /**
   * Get configuration for ByteDance Seedream API requests
   */
  getByteDanceSeedreamConfig() {
    return {
      modelId: this.config.byteDanceSeedreamModelId,
      imageWidth: this.config.byteDanceImageSizeWidth,
      imageHeight: this.config.byteDanceImageSizeHeight,
      defaultNumImages: this.config.defaultNumImages,
      // CGI Enhancement settings
      cgiQualityPreset: this.config.cgiQualityPreset,
      enableCGIEnhancement: this.config.enableCGIEnhancement
    };
  }

  /**
   * Get CGI enhancement configuration
   */
  getCGIEnhancementConfig() {
    return {
      qualityPreset: this.config.cgiQualityPreset,
      enabled: this.config.enableCGIEnhancement
    };
  }

  /**
   * Get configuration for 3D avatar generation
   */
  getAvatarGenerationConfig() {
    return {
      mode: this.config.avatarGenerationMode,
      modelType: this.config.avatarModelType,
      style: this.config.defaultAvatarStyle,
      perspective: this.config.defaultAvatarPerspective,
      isDevelopmentMode: this.config.isDevelopmentMode
    };
  }

  /**
   * Check if we should use PhotoMaker for avatar generation
   */
  shouldUsePhotoMaker(): boolean {
    return this.config.avatarModelType === 'PHOTOMAKER';
  }

  /**
   * Check if we should use Nano Banana for avatar generation
   */
  shouldUseNanoBanana(): boolean {
    return this.config.avatarModelType === 'NANO_BANANA';
  }

  /**
   * Check if we should use Nano Banana Edit for avatar generation
   */
  shouldUseNanoBananaEdit(): boolean {
    return this.config.avatarModelType === 'NANO_BANANA_EDIT';
  }

  /**
   * Check if we should use Gemini CGI for avatar generation
   */
  shouldUseGeminiCGI(): boolean {
    return this.config.avatarModelType === 'GEMINI_CGI';
  }

  /**
   * Check if we should use ByteDance Seedream for avatar generation
   */
  shouldUseByteDanceSeedream(): boolean {
    return this.config.avatarModelType === 'BYTEDANCE_SEEDREAM';
  }

  /**
   * Check if we're in development mode
   */
  isDevelopment(): boolean {
    return import.meta.env.DEV || this.config.isDevelopmentMode;
  }

  /**
   * Check if FAL API is available (DEPRECATED)
   * @deprecated FAL API dependencies have been removed - use FASHN API instead
   */
  isFalApiAvailable(): boolean {
    console.warn('⚠️ isFalApiAvailable() is deprecated - fal-ai dependencies removed');
    return false;
  }

  /**
   * Check if FASHN API is available
   */
  isFashnApiAvailable(): boolean {
    return !!this.config.fashnApiKey;
  }

  /**
   * Check if we should use production API (DEPRECATED - was for FAL API)
   * @deprecated Use isFashnApiAvailable() for FASHN virtual try-on
   */
  shouldUseProductionApi(): boolean {
    console.warn('⚠️ shouldUseProductionApi() is deprecated - use isFashnApiAvailable() for FASHN API');
    return false;
  }

  /**
   * Get FASHN API configuration for virtual try-on
   */
  getFashnConfig() {
    return {
      apiKey: this.config.fashnApiKey,
      isAvailable: this.isFashnApiAvailable()
    };
  }
}

// Export singleton instance
export const environmentConfig = new EnvironmentConfigService();
export default environmentConfig;