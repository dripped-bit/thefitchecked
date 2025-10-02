/**
 * Perfect Avatar Configuration
 * Contains the exact prompts and parameters that produce high-quality avatars
 * with perfect facial likeness and full-body generation
 */

// Perfect Prompt Templates
export const PERFECT_PROMPT_TEMPLATE = {
  // Main prompt structure that preserves facial identity and shows full body
  BASE: `FACIAL IDENTITY PRIORITY: Preserve exact facial features, eye shape, nose structure, mouth shape, jawline, and skin tone from uploaded photo. ULTRA WIDE SHOT. Person standing 3 meters from camera. FULL LENGTH PORTRAIT showing complete body from head to toes. Feet MUST be visible at bottom of frame with floor showing. Camera pulled back for complete figure.`,

  // Additional elements that can be appended
  EXTENSIONS: {
    BODY_MEASUREMENTS: `Apply body measurements: {measurements}`,
    CLOTHING_STYLE: `Wearing: {clothing}`,
    ENVIRONMENT: `Background: {background}`,
    POSE: `Pose: {pose}`
  }
};

// Perfect Negative Prompt Structure
export const PERFECT_NEGATIVE_PROMPT = {
  // Facial preservation - highest priority
  FACIAL_PRESERVATION: `FACIAL PRESERVATION PRIORITY: face modification, facial changes, different facial structure, altered eye shape, nose reshaping, mouth alteration, identity drift, face swap, identity change, wrong person entirely, facial feature changes, eye color change, nose modification, jaw reshaping, skin tone shift, different person, wrong face, changed facial features, different eye color, wrong eye shape, wrong nose shape, altered nose, different mouth, wrong mouth shape, changed lips, different jawline, wrong chin, modified cheekbones, changed face shape, facial modifications, different skin tone, wrong hair color, changed hair texture, modified facial structure, face distortion, identity corruption, wrong individual`,

  // Ultra-strict identity protection
  ULTRA_STRICT: `ULTRA-STRICT: any facial changes, any identity modifications, any feature alterations`,

  // Anti-cropping for full body visibility
  ANTI_CROPPING: `ANTI-CROPPING: cropped legs, cropped feet, cut off legs, cut off feet, knee-level crop, partial body, close-up framing, zoomed in, truncated figure, missing feet, missing legs, lower body cropped, body parts cut off, tight framing, portrait crop, cropped, close-up, partial body, knees only, torso only, headshot, medium shot, cut off at knees, cut off at thighs`,

  // General quality issues
  GENERAL_ISSUES: `GENERAL ISSUES: animated, blurry, distorted, poor framing, bad positioning, off center, misaligned, artificial, CGI, 3D render, digital art, cartoon, anime, illustration, painting, synthetic skin, plastic appearance, fake skin, artificial lighting, over-processed, digital enhancement, perfect skin, airbrushed, unnatural smoothness, doll-like, mannequin, robotic, fake textures, digital manipulation`,

  // Complete combined negative prompt
  get COMPLETE() {
    return `${this.FACIAL_PRESERVATION}, ${this.ULTRA_STRICT}, ${this.ANTI_CROPPING}, ${this.GENERAL_ISSUES}`;
  }
};

// Perfect Generation Parameters
export const PERFECT_GENERATION_PARAMS = {
  // Optimal parameters for quality and facial preservation
  OPTIMAL: {
    num_inference_steps: 100,        // Increased for better facial detail processing
    guidance_scale: 6.5,             // Gentler transformations for facial preservation
    strength: 0.75,                  // Balanced for facial identity preservation with full-body generation
    image_size: { width: 1152, height: 2048 }, // 9:16 aspect ratio for full body
    enable_safety_checker: false,
    get seed() { return Date.now(); } // Timestamp seed to prevent caching
  },

  // Faster parameters for development/testing
  FAST: {
    num_inference_steps: 50,
    guidance_scale: 6.5,
    strength: 0.75,
    image_size: { width: 1152, height: 2048 },
    enable_safety_checker: false,
    get seed() { return Date.now(); }
  },

  // Ultra-quality parameters for final generation
  ULTRA: {
    num_inference_steps: 150,
    guidance_scale: 6.0,             // Even gentler for maximum preservation
    strength: 0.70,                  // Lower strength for maximum facial fidelity
    image_size: { width: 1152, height: 2048 },
    enable_safety_checker: false,
    get seed() { return Date.now(); }
  }
};

// Utility Functions
export const PerfectAvatarConfig = {
  /**
   * Build complete prompt with custom content
   */
  buildPrompt(customContent = '', extensions = {}) {
    let prompt = PERFECT_PROMPT_TEMPLATE.BASE;

    // Add custom content
    if (customContent) {
      prompt += ` ${customContent}`;
    }

    // Add extensions
    Object.entries(extensions).forEach(([key, value]) => {
      if (PERFECT_PROMPT_TEMPLATE.EXTENSIONS[key] && value) {
        const extensionTemplate = PERFECT_PROMPT_TEMPLATE.EXTENSIONS[key];
        const extensionText = extensionTemplate.replace(`{${key.toLowerCase()}}`, value);
        prompt += ` ${extensionText}`;
      }
    });

    return prompt;
  },

  /**
   * Get complete negative prompt
   */
  getNegativePrompt(additionalNegatives = []) {
    let negativePrompt = PERFECT_NEGATIVE_PROMPT.COMPLETE;

    if (additionalNegatives.length > 0) {
      negativePrompt += `, ${additionalNegatives.join(', ')}`;
    }

    return negativePrompt;
  },

  /**
   * Get generation parameters for specific quality level
   */
  getParams(quality = 'OPTIMAL', overrides = {}) {
    const baseParams = PERFECT_GENERATION_PARAMS[quality] || PERFECT_GENERATION_PARAMS.OPTIMAL;

    return {
      ...baseParams,
      ...overrides,
      // Ensure seed is always fresh if not overridden
      seed: overrides.seed !== undefined ? overrides.seed : baseParams.seed
    };
  },

  /**
   * Create complete Seedream request config
   */
  createSeedreamRequest(imageUrls, customContent = '', options = {}) {
    const {
      quality = 'OPTIMAL',
      extensions = {},
      additionalNegatives = [],
      paramOverrides = {},
      ...otherOptions
    } = options;

    return {
      image_urls: Array.isArray(imageUrls) ? imageUrls : [imageUrls],
      prompt: this.buildPrompt(customContent, extensions),
      negative_prompt: this.getNegativePrompt(additionalNegatives),
      ...this.getParams(quality, paramOverrides),
      ...otherOptions
    };
  },

  /**
   * Validate that current settings match perfect config
   */
  validateConfig(currentConfig) {
    const issues = [];

    // Check aspect ratio
    if (currentConfig.image_size?.width !== 1152 || currentConfig.image_size?.height !== 2048) {
      issues.push('Image size should be 1152x2048 for optimal full-body generation');
    }

    // Check strength range
    if (currentConfig.strength > 0.8) {
      issues.push('Strength too high - may compromise facial identity');
    }

    // Check inference steps
    if (currentConfig.num_inference_steps < 50) {
      issues.push('Inference steps too low - may reduce quality');
    }

    // Check guidance scale
    if (currentConfig.guidance_scale > 8.0) {
      issues.push('Guidance scale too high - may cause over-processing');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
};

// Preset configurations for different use cases
export const AVATAR_PRESETS = {
  // Standard avatar generation after measurements
  MEASUREMENTS_AVATAR: {
    quality: 'OPTIMAL',
    extensions: {
      BODY_MEASUREMENTS: 'applied',
      POSE: 'standing naturally'
    }
  },

  // Avatar generation from photo only
  PHOTO_AVATAR: {
    quality: 'OPTIMAL',
    extensions: {
      POSE: 'standing naturally'
    }
  },

  // High-quality final avatar
  FINAL_AVATAR: {
    quality: 'ULTRA',
    extensions: {
      BODY_MEASUREMENTS: 'precisely applied',
      POSE: 'confident standing pose'
    }
  },

  // Quick preview avatar
  PREVIEW_AVATAR: {
    quality: 'FAST',
    extensions: {
      POSE: 'standing'
    }
  }
};

// Export default configuration
export default {
  PERFECT_PROMPT_TEMPLATE,
  PERFECT_NEGATIVE_PROMPT,
  PERFECT_GENERATION_PARAMS,
  PerfectAvatarConfig,
  AVATAR_PRESETS
};