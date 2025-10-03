/**
 * Best Avatar Generated - Successful Prompt Configurations
 *
 * This file stores the prompts and parameters that generated the best avatars.
 * Use these as reference when generating new avatars or as starting points for variations.
 */

// Current Perfect Avatar Prompt (from perfectAvatarConfig.js)
export const CURRENT_PERFECT_PROMPT = {
  name: 'Professional Full-Body Portrait (Current Best)',
  timestamp: '2025-10-03',
  prompt: 'Professional full-body portrait photograph of person with natural facial features exactly matching the reference photo, natural standing pose showing complete figure from head to feet, professional studio photography with clean white background, soft natural lighting, photorealistic high-quality image, natural skin texture and realistic proportions, full-length view with feet visible. Body measurements: chest ${userMeasurements.chest}cm, waist ${userMeasurements.waist}cm, hips ${userMeasurements.hips}cm, height ${userMeasurements.height}cm. Wearing form-fitting white tank top and blue athletic shorts. Pose: standing naturally with arms at sides, FASHN-compatible pose',
  negativePrompt: 'wrong face, different person, face swap, identity change, wrong person entirely, facial distortion, different eye color, wrong eye shape, wrong nose shape, different mouth, wrong mouth shape, different skin tone, cropped legs, cropped feet, cut off legs, cut off feet, missing feet, missing legs, partial body, close-up framing, zoomed in, body parts cut off, tight framing, cropped, headshot only, torso only, cut off at knees, blurry, distorted, deformed, bad anatomy, extra limbs, missing limbs, doll-like, mannequin, cartoon, anime, illustration, painting, drawing, low quality, mutation, disfigured',
  parameters: {
    num_inference_steps: 100,
    guidance_scale: 5.5,
    strength: 0.65,
    image_size: { width: 1152, height: 2048 }, // 9:16 aspect ratio for full body display
    seed: 'dynamic' // Changes with each generation
  },
  quality: 'OPTIMAL',
  notes: 'Universal avatar prompt for all users. Uses 9:16 aspect ratio (1152x2048) to ensure full body visibility including legs and feet. Includes body measurements, specific clothing (white tank top and blue athletic shorts), clean white background, and FASHN-compatible pose for optimal try-on compatibility. Natural language instead of camera jargon, gentler parameters (strength 0.65, guidance 5.5) for better facial preservation.',
  rating: 5
};

// User-Saved Best Prompts
// These will be populated from localStorage via savedPromptsService
// Example structure:
export const EXAMPLE_SAVED_PROMPTS = [
  {
    id: 'example_1',
    timestamp: '2025-10-02T19:44:25.000Z',
    name: 'Natural Full Body - Version 1',
    prompt: 'Professional full-body portrait photograph of person with natural facial features...',
    negativePrompt: 'wrong face, cropped legs...',
    parameters: {
      num_inference_steps: 100,
      guidance_scale: 5.5,
      strength: 0.65,
      image_size: { width: 1152, height: 2048 }
    },
    quality: 'OPTIMAL',
    notes: 'First successful generation after parameter adjustments',
    rating: 4
  },
  {
    id: 'example_2',
    timestamp: '2025-10-02T20:15:30.000Z',
    name: 'Ultra Quality Full Body',
    prompt: 'Professional full-body portrait photograph of person with natural facial features...',
    negativePrompt: 'wrong face, cropped legs...',
    parameters: {
      num_inference_steps: 150,
      guidance_scale: 5.0,
      strength: 0.60,
      image_size: { width: 1152, height: 2048 }
    },
    quality: 'ULTRA',
    notes: 'Best quality so far - very natural looking',
    rating: 5
  }
];

// Prompt Variations to Try
export const PROMPT_VARIATIONS = {
  POSES: [
    'natural standing pose',
    'confident standing pose',
    'relaxed standing pose',
    'professional standing pose'
  ],

  BACKGROUNDS: [
    'neutral indoor background',
    'studio background',
    'plain white background',
    'soft gradient background'
  ],

  LIGHTING: [
    'soft natural lighting',
    'studio lighting',
    'soft diffused lighting',
    'professional portrait lighting'
  ]
};

// Parameter Presets for Different Goals
export const PARAMETER_PRESETS = {
  // Maximum facial preservation
  MAX_IDENTITY_PRESERVATION: {
    strength: 0.55,
    guidance_scale: 5.0,
    num_inference_steps: 150,
    notes: 'Lowest strength for maximum facial fidelity'
  },

  // Balanced quality and speed
  BALANCED: {
    strength: 0.65,
    guidance_scale: 5.5,
    num_inference_steps: 100,
    notes: 'Current optimal balance'
  },

  // Quick previews
  FAST_PREVIEW: {
    strength: 0.65,
    guidance_scale: 5.5,
    num_inference_steps: 50,
    notes: 'Faster generation for testing'
  },

  // Maximum quality
  ULTRA_QUALITY: {
    strength: 0.60,
    guidance_scale: 5.0,
    num_inference_steps: 150,
    notes: 'Slowest but highest quality'
  }
};

// Tips for Creating Good Prompts
export const PROMPT_TIPS = [
  'Use natural language instead of technical camera terms',
  'Keep negative prompts focused on key issues (facial preservation, cropping, quality)',
  'Avoid contradictory terms in negative prompts',
  'Lower strength (0.60-0.65) preserves facial features better',
  'Lower guidance scale (5.0-5.5) produces more natural results',
  'Always use 9:16 aspect ratio (1152x2048) for full-body avatars with feet visible',
  'Standard clothing: form-fitting white tank top and blue athletic shorts for FASHN compatibility',
  'Standard pose: standing naturally with arms at sides (FASHN-compatible)',
  'Standard background: professional studio photography with clean white background',
  'Include body measurements for accurate proportions',
  'More inference steps = better quality but slower (50=fast, 100=balanced, 150=ultra)',
  'Always use fresh seeds to avoid cached results'
];

// Export utility to get current best settings
export const getCurrentBestSettings = () => ({
  ...CURRENT_PERFECT_PROMPT,
  timestamp: new Date().toISOString()
});

/**
 * Get the best prompt to use for avatar generation
 * Priority: User's best saved prompt > CURRENT_PERFECT_PROMPT
 *
 * NOTE: This function requires savedPromptsService to be imported dynamically
 * to avoid circular dependencies
 */
export const getBestPromptForGeneration = async () => {
  try {
    // Dynamically import savedPromptsService to avoid circular dependency
    const { savedPromptsService } = await import('../services/savedPromptsService');

    // Try to get user's best saved prompt
    const userBestPrompt = savedPromptsService.getBestUserPrompt();

    if (userBestPrompt) {
      console.log(`🌟 [BEST-PROMPT] Using user's best saved prompt: "${userBestPrompt.name}"`);
      return {
        source: 'user-saved',
        ...userBestPrompt
      };
    }

    // Fallback to CURRENT_PERFECT_PROMPT
    console.log('📋 [BEST-PROMPT] No user prompts found, using CURRENT_PERFECT_PROMPT');
    return {
      source: 'default',
      ...CURRENT_PERFECT_PROMPT,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ [BEST-PROMPT] Error getting best prompt:', error);
    // On error, always fall back to CURRENT_PERFECT_PROMPT
    return {
      source: 'default-fallback',
      ...CURRENT_PERFECT_PROMPT,
      timestamp: new Date().toISOString()
    };
  }
};

export default {
  CURRENT_PERFECT_PROMPT,
  EXAMPLE_SAVED_PROMPTS,
  PROMPT_VARIATIONS,
  PARAMETER_PRESETS,
  PROMPT_TIPS,
  getCurrentBestSettings,
  getBestPromptForGeneration
};
