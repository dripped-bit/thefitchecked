/**
 * Perfect Avatar Configuration
 * Contains the exact prompts and parameters that produce high-quality avatars
 * with perfect facial likeness and full-body generation
 */

// Perfect Prompt Templates
export const PERFECT_PROMPT_TEMPLATE = {
  // Main prompt structure that preserves facial identity and shows full body
  BASE: `Professional full-body portrait photograph of person with natural facial features exactly matching the reference photo, natural standing pose showing complete figure from head to feet, neutral indoor background, soft natural lighting, photorealistic high-quality image, natural skin texture and realistic proportions, full-length view with feet visible`,

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
  FACIAL_PRESERVATION: `wrong face, different person, face swap, identity change, wrong person entirely, facial distortion, different eye color, wrong eye shape, wrong nose shape, different mouth, wrong mouth shape, different skin tone`,

  // Anti-cropping for full body visibility
  ANTI_CROPPING: `cropped legs, cropped feet, cut off legs, cut off feet, missing feet, missing legs, partial body, close-up framing, zoomed in, body parts cut off, tight framing, cropped, headshot only, torso only, cut off at knees`,

  // General quality issues
  GENERAL_ISSUES: `blurry, distorted, deformed, bad anatomy, extra limbs, missing limbs, doll-like, mannequin, cartoon, anime, illustration, painting, drawing, low quality, mutation, disfigured`,

  // Complete combined negative prompt
  get COMPLETE() {
    return `${this.FACIAL_PRESERVATION}, ${this.ANTI_CROPPING}, ${this.GENERAL_ISSUES}`;
  }
};

// Perfect Generation Parameters
export const PERFECT_GENERATION_PARAMS = {
  // Optimal parameters for quality and facial preservation
  OPTIMAL: {
    num_inference_steps: 100,        // Increased for better facial detail processing
    guidance_scale: 5.5,             // Gentler transformations for more natural results
    strength: 0.65,                  // Lower strength for better facial identity preservation
    image_size: { width: 1152, height: 2048 }, // 9:16 aspect ratio for full body
    enable_safety_checker: false,
    get seed() { return Date.now(); } // Timestamp seed to prevent caching
  },

  // Faster parameters for development/testing
  FAST: {
    num_inference_steps: 50,
    guidance_scale: 5.5,
    strength: 0.65,
    image_size: { width: 1152, height: 2048 },
    enable_safety_checker: false,
    get seed() { return Date.now(); }
  },

  // Ultra-quality parameters for final generation
  ULTRA: {
    num_inference_steps: 150,
    guidance_scale: 5.0,             // Gentler for maximum natural appearance
    strength: 0.60,                  // Lowest strength for maximum facial fidelity
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
    if (currentConfig.strength > 0.7) {
      issues.push('Strength too high - may compromise facial identity (recommended: 0.60-0.65)');
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