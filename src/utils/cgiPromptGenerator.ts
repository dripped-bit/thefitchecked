/**
 * CGI Prompt Generator Utility
 * Generates measurement-based prompts for ByteDance Seedream v4 CGI avatar creation
 */

import { MeasurementData, BodyDescription, CGIPromptConfig } from '../types/cgiAvatar';

export class CGIPromptGenerator {
  private static readonly PROMPT_CONFIG: CGIPromptConfig = {
    basePrompt: 'professional photography, real human subject, camera captured portrait',
    qualityTerms: [
      'photorealistic human features',
      'detailed skin texture with visible pores',
      'natural skin oils and subtle shine',
      'authentic hair strands and texture',
      'professional camera photography',
      'natural lighting with soft shadows',
      'realistic depth of field',
      'subtle skin imperfections',
      'natural color grading',
      '4K ultra-high-definition quality',
      'sharp focus throughout',
      'authentic facial features',
      'natural skin texture with clearly visible pores',
      'realistic human imperfections and blemishes',
      'professional studio-grade photography',
      'camera-captured realism',
      'not digital art, not CGI, not rendered',
      'authentic photographic capture',
      'real human skin characteristics'
    ],
    styleTerms: [
      'professional portrait photography',
      'studio photography session',
      'real human subject',
      'authentic photographic quality',
      'natural skin and hair textures',
      'realistic human proportions',
      'photographic realism',
      'authentic human photography',
      'real person portrait',
      'camera-shot photography',
      'not digital art, not CGI rendering',
      'not computer generated',
      'authentic human features',
      'real photographic capture',
      'professional human model',
      'natural human appearance'
    ],
    lightingTerms: [
      'professional FASHN-optimized lighting',
      'high contrast body-background separation',
      'even lighting eliminating harsh shadows',
      'clear body outline definition',
      'professional three-point lighting',
      'soft diffused key light with body contrast',
      'optimal lighting for virtual try-on compatibility',
      'professional color temperature with definition',
      'studio lighting that enhances body structure',
      'natural skin illumination with clear edges',
      'commercial photography lighting setup',
      'clear body silhouette enhancement',
      'professional studio-grade illumination',
      'natural shadow depth without harsh contrasts',
      'soft box diffused lighting with body clarity',
      'professional photography standards for AI processing'
    ],
    poseTerms: [
      'perfect FASHN-compatible pose',
      'standing perfectly straight',
      'neutral T-pose stance',
      'ARMS STRAIGHT DOWN AT SIDES - NEVER ANGLED',
      'arms naturally hanging down at sides',
      'shoulders perfectly square to camera',
      'no arm movement or positioning',
      'body perfectly centered and aligned',
      'straight vertical posture',
      'facing camera directly front-on',
      'symmetric body positioning',
      'professional model stance for virtual try-on'
    ],
    backgroundTerms: [
      'pure white background',
      'seamless white backdrop',
      'clean studio background',
      'isolated subject',
      'no background distractions'
    ]
  };

  /**
   * Generate comprehensive full-body avatar prompt based on measurements and outfit specifications
   * Creates detailed complete figure from head to feet for universal avatar system
   */
  static generateBodyPrompt(measurements: MeasurementData): string {
    console.log('👤 [FULL-BODY] Creating comprehensive full-body avatar prompt from measurements:', measurements);

    // Analyze proportional characteristics from measurements
    const proportions = this.analyzeProportionalCharacteristics(measurements);
    const headAnalysis = this.analyzeHeadPhotoCharacteristics(measurements);

    console.log('📊 [BODY-ANALYSIS]:', { proportions, headAnalysis });

    // Build comprehensive full-body avatar prompt
    const heightInInches = this.convertHeightToInches(measurements.heightFeet, measurements.heightInches);
    const bodySpecs = this.generateComprehensiveBodySpecs(measurements, proportions, heightInInches);

    const prompt = `
PROFESSIONAL PHOTOGRAPHY: High-end studio portrait of real human subject, captured with professional camera equipment.
Photorealistic quality, natural lighting, authentic human appearance with no artificial or digital rendering.

POSE: PERFECT FASHN-COMPATIBLE POSE - Standing straight facing camera, ARMS MUST BE STRAIGHT DOWN AT SIDES (never angled, crossed, or positioned away from body), shoulders square to camera, COMPLETE FULL BODY from head to feet visible.
CRITICAL: Arms naturally hanging straight down at sides for optimal virtual try-on compatibility. No arm movement or positioning.

CAMERA FRAMING: FULL-BODY 9:16 VERTICAL COMPOSITION - Camera positioned at proper distance to capture complete figure from head to feet with generous margins. MANDATORY: Full legs completely visible with bare feet clearly shown at bottom edge of frame. NO CROPPING of legs, knees, arms, or head. Camera height positioned at mid-torso level to ensure balanced perspective. Wide enough framing to include full arm span, tall enough framing to show complete height plus safety margins above head and below feet.
Perfect centering with symmetric positioning, professionally framed for AI processing and virtual try-on compatibility.

BODY SPECIFICATIONS: Height ${bodySpecs.heightDescription}, chest ${measurements.chest}", waist ${measurements.waist}", hips ${measurements.hips}".
${bodySpecs.chestDescription}, ${bodySpecs.waistDescription}, ${bodySpecs.hipDescription}.
Natural human proportions, realistic body shape with authentic skin characteristics.

CLOTHING: Form-fitting white tank top (clean, bright white, proper fit) and form-fitting blue lounge shorts
(short fitted length, above mid-thigh, comfortable athletic fit).

PHOTOGRAPHIC REALISM: Natural human skin with visible pores, subtle skin texture variations, natural oils giving slight shine.
Realistic skin imperfections, natural color variations, authentic human characteristics.
Shallow depth of field with natural bokeh, professional color grading, realistic shadows.

LIGHTING: Professional three-point studio lighting setup with soft key light, subtle fill light, and natural rim lighting.
Soft shadows with realistic shadow casting, natural skin tone illumination, professional color temperature.

QUALITY: Shot with professional camera, natural depth of field, realistic focus, authentic photographic grain.
No artificial enhancement, natural human appearance, real person photography.

REQUIREMENTS: COMPLETE FULL-BODY composition - include entire head to feet within frame.
Complete figure from head to feet visible with clear face, full torso, complete legs and bare feet clearly shown.
Clean white studio background with proper margins around entire figure - ensure NO cropping of any body parts.
STATIC POSE - single photograph moment, no movement or animation.
    `.trim();

    console.log('👤 [FULL-BODY] Generated comprehensive full-body avatar prompt:', prompt);

    return prompt;
  }

  /**
   * Analyze head photo for characteristics to inform body generation with enhanced 9:16 support
   * Provides detailed facial analysis for maximum identity preservation in full-body format
   */
  static analyzeHeadPhotoCharacteristics(measurements: MeasurementData, headPhotoUrl?: string): any {
    console.log('👤 [HEAD-ANALYSIS] Performing enhanced facial analysis for 9:16 identity preservation');

    // Enhanced facial feature mapping for 9:16 format
    const facialAnalysis = {
      identityPriority: 'CRITICAL - maintain exact facial identity from uploaded photo',
      resolutionNotes: '9:16 format requires enhanced facial detail despite smaller proportional size',
      preservationLevel: 'MAXIMUM - no facial modifications allowed'
    };

    // Enhanced skin tone inference with precise characteristics
    let skinTone = 'natural human skin tone - preserve exact tone from uploaded photo';
    let skinTexture = 'authentic skin texture with clearly visible pores, natural skin oils, realistic imperfections, and natural color variations - match source photo exactly';

    if (measurements.ethnicity) {
      switch (measurements.ethnicity.toLowerCase()) {
        case 'caucasian': case 'white':
          skinTone = 'fair to medium Caucasian skin tone with natural undertones';
          skinTexture = 'European skin texture with clearly visible pores, natural skin oils, subtle freckles, realistic imperfections, and authentic human characteristics';
          break;
        case 'hispanic': case 'latino':
          skinTone = 'warm olive to tan skin tone with golden undertones';
          skinTexture = 'Latino skin with natural warmth, visible pores, authentic texture, natural skin oils, and realistic imperfections';
          break;
        case 'african': case 'black':
          skinTone = 'rich dark skin tone with beautiful melanin depth';
          skinTexture = 'African heritage skin with natural melanin sheen, visible pores, authentic texture, natural skin oils, and beautiful realistic characteristics';
          break;
        case 'asian':
          skinTone = 'light to medium Asian skin tone with neutral undertones';
          skinTexture = 'Asian skin characteristics with visible pores, smooth natural texture, natural skin oils, and authentic human imperfections';
          break;
        case 'middle eastern':
          skinTone = 'olive to tan Middle Eastern skin tone with warm undertones';
          skinTexture = 'Mediterranean skin with visible pores, natural warmth, depth, authentic texture, and realistic skin characteristics';
          break;
        case 'mixed': case 'multiracial':
          skinTone = 'unique mixed heritage skin tone with complex undertones';
          skinTexture = 'multiracial skin characteristics with visible pores, diverse features, natural texture, and authentic human imperfections';
          break;
        default:
          skinTone = 'natural human skin tone';
          skinTexture = 'authentic human skin texture with clearly visible pores, natural skin oils, and realistic imperfections';
      }
    }

    // Enhanced age-based characteristics with specific details
    let ageCharacteristics = 'natural age-appropriate features';
    let ageSpecificSkin = 'age-appropriate skin quality';

    if (measurements.age) {
      if (measurements.age < 25) {
        ageCharacteristics = 'youthful features with bright clear eyes and smooth skin';
        ageSpecificSkin = 'young adult skin with minimal aging signs and natural glow';
      } else if (measurements.age < 35) {
        ageCharacteristics = 'young professional features with confident appearance';
        ageSpecificSkin = 'early adult skin with natural maturity and healthy appearance';
      } else if (measurements.age < 45) {
        ageCharacteristics = 'mature adult features with natural confidence and wisdom';
        ageSpecificSkin = 'mid-adult skin with subtle character lines and natural aging';
      } else {
        ageCharacteristics = 'distinguished mature features with natural grace';
        ageSpecificSkin = 'mature skin with natural aging patterns and life experience';
      }
    }

    // Enhanced gender-based facial structure with detailed characteristics
    let faceShape = 'natural human facial structure';
    let facialFeatures = 'authentic individual facial characteristics';

    if (measurements.gender === 'female') {
      faceShape = 'feminine facial features with soft natural contours and gentle bone structure';
      facialFeatures = 'feminine characteristics with natural beauty and individual traits';
    } else if (measurements.gender === 'male') {
      faceShape = 'masculine facial features with defined jawline and strong bone structure';
      facialFeatures = 'masculine characteristics with natural strength and individual traits';
    }

    // Enhanced hair characteristics with detailed descriptions
    let hairDescription = 'natural human hair with authentic characteristics';
    let hairDetails = 'individual hair texture and natural movement';

    if (measurements.hairColor) {
      hairDescription = `${measurements.hairColor} hair with natural color depth and variations`;
      hairDetails = `authentic ${measurements.hairColor} hair texture with natural highlights and movement`;
    }

    // Enhanced analysis with 9:16 identity preservation priorities
    const analysis = {
      ...facialAnalysis,
      skinTone,
      skinTexture,
      faceShape,
      facialFeatures,
      ageCharacteristics,
      ageSpecificSkin,
      hairDescription,
      hairDetails,
      lighting: 'natural studio lighting that preserves authentic appearance with enhanced facial clarity for 9:16 format',
      gender: measurements.gender || 'person',
      // Enhanced preservation guidelines for 9:16 format
      identityPreservation: {
        priority: 'ABSOLUTE HIGHEST - exact facial identity from uploaded photo',
        skinMatching: 'PERFECT skin tone continuity between face and body - seamless match',
        featurePreservation: 'ALL unique facial features, expressions, and characteristics preserved exactly',
        naturalAppearance: 'Maintain authentic human appearance from original photo with enhanced detail',
        aspectRatioCompensation: 'Enhanced facial definition required for 9:16 format where face occupies smaller proportion',
        identityVerification: 'Same person check - eye color, nose, mouth, jawline all must match exactly'
      },
      // Detailed characteristic mapping optimized for 9:16 AI understanding
      detailedCharacteristics: {
        eyeColor: 'preserve EXACT eye color from photo - no variations allowed',
        eyeShape: 'maintain IDENTICAL eye shape and size - critical identity marker',
        noseShape: 'keep EXACT nose structure and proportions - no modifications',
        mouthShape: 'preserve EXACT mouth shape and lip characteristics',
        jawline: 'maintain IDENTICAL jawline and chin structure - key facial identifier',
        cheekbones: 'preserve EXACT natural cheekbone structure',
        facialHair: 'maintain any facial hair EXACTLY as in photo',
        eyebrows: 'keep EXACT eyebrow shape and thickness',
        uniqueFeatures: 'preserve ANY moles, freckles, scars, or distinctive marks exactly',
        skinToneExact: 'match skin tone PRECISELY - no color variations',
        facialSymmetry: 'maintain natural facial asymmetries from original photo'
      },
      // 9:16 specific enhancement requirements
      aspectRatioOptimization: {
        facialDetail: 'Enhance facial sharpness and definition for smaller proportional face size in 9:16',
        resolutionPriority: 'Face must remain high-resolution and detailed despite full-body framing',
        identitySharpness: 'Critical facial features require extra clarity in vertical format',
        proportionalBalance: 'Maintain facial prominence while ensuring full-body visibility'
      }
    };

    console.log('👤 [HEAD-ANALYSIS] Generated enhanced identity preservation characteristics:', analysis);
    return analysis;
  }

  /**
   * Generate comprehensive body specifications for headless body generation
   */
  private static generateComprehensiveBodySpecs(measurements: MeasurementData, proportions: any, heightInInches: number) {
    return {
      heightDescription: this.getHeightDescription(heightInInches),
      chestDescription: this.getChestDescription(parseFloat(measurements.chest || '0')),
      waistDescription: this.getWaistDescription(parseFloat(measurements.waist || '0')),
      hipDescription: this.getHipDescription(parseFloat(measurements.hips || '0')),
      bodyTypeDescription: this.getBodyTypeDescription(measurements.bodyType || 'average')
    };
  }

  /**
   * Get height description from inches
   */
  private static getHeightDescription(inches: number): string {
    if (inches < 60) return "short (under 5'0\")";
    if (inches < 64) return "below average height (5'0\" - 5'4\")";
    if (inches < 68) return "average height (5'4\" - 5'8\")";
    if (inches < 72) return "above average height (5'8\" - 6'0\")";
    if (inches < 76) return "tall (6'0\" - 6'4\")";
    return "very tall (over 6'4\")";
  }

  /**
   * Get realistic chest description for natural appearance
   */
  private static getChestDescription(inches: number): string {
    if (inches < 32) return "petite frame with delicate build, natural small curves";
    if (inches < 34) return "small frame with slender build, subtle natural contours";
    if (inches < 36) return "medium frame with balanced proportions, gentle curves";
    if (inches < 38) return "medium to full frame with natural feminine/masculine curves";
    if (inches < 40) return "full frame with soft natural curves, comfortable proportions";
    if (inches < 42) return "fuller frame with generous curves, natural body shape";
    return "full figured with natural proportions, authentic body curves";
  }

  /**
   * Get realistic waist description for natural appearance
   */
  private static getWaistDescription(inches: number): string {
    if (inches < 26) return "very slim waist with toned definition, natural curve";
    if (inches < 28) return "slim waist with fit appearance, gentle taper";
    if (inches < 30) return "small waist with athletic tone, natural proportions";
    if (inches < 32) return "medium waist with natural curve, comfortable shape";
    if (inches < 34) return "average waist with healthy proportions, realistic shape";
    if (inches < 36) return "fuller waist with soft curves, natural comfort";
    return "full waist with relaxed curves, authentic body shape";
  }

  /**
   * Get realistic hip description for natural appearance
   */
  private static getHipDescription(inches: number): string {
    if (inches < 36) return "narrow hips with slender curves, delicate lower body";
    if (inches < 38) return "medium hips with balanced curves, natural proportions";
    if (inches < 40) return "curvy hips with feminine/masculine appeal, soft curves";
    if (inches < 42) return "full hips with natural curves, comfortable proportions";
    return "very full hips with soft generous curves, authentic body shape";
  }

  /**
   * Get body type description for detailed prompts
   */
  private static getBodyTypeDescription(type: string): string {
    const types: Record<string, string> = {
      'athletic': 'fit and toned, muscular definition, strong athletic build',
      'slim': 'slender frame, lean build, delicate proportions',
      'average': 'balanced proportions, natural build, healthy weight',
      'curvy': 'soft curves, fuller figure, natural curves',
      'muscular': 'strong muscular build, defined muscles, powerful frame',
      'plus': 'larger frame, full figure, substantial build'
    };

    return types[type.toLowerCase()] || types['average'];
  }

  /**
   * Generate detailed body description for precise avatar creation
   */
  private static generateDetailedBodyDescription(proportions: any, measurements: MeasurementData, headAnalysis?: any) {
    const heightDesc = proportions.heightDesc;
    const buildDesc = proportions.buildDesc;
    const gender = proportions.gender;

    // Use head analysis for more accurate characteristics
    const skinTone = headAnalysis?.skinTone || 'natural skin tone';
    const ageCharacteristics = headAnalysis?.ageCharacteristics || 'adult features';

    // Detailed body proportions based on measurements
    let bodyProportions = 'balanced proportions';
    const chest = parseFloat(measurements.chest || '0');
    const waist = parseFloat(measurements.waist || '0');
    const hips = parseFloat(measurements.hips || '0');

    if (chest && waist && hips) {
      if (gender === 'woman') {
        const waistHipRatio = waist / hips;
        if (waistHipRatio < 0.75) bodyProportions = 'curvy hourglass figure with defined waist';
        else if (waistHipRatio > 0.85) bodyProportions = 'athletic straight figure';
        else bodyProportions = 'balanced feminine proportions';
      } else if (gender === 'man') {
        const chestWaistRatio = chest / waist;
        if (chestWaistRatio > 1.4) bodyProportions = 'broad shoulders with muscular chest';
        else if (chestWaistRatio < 1.1) bodyProportions = 'lean athletic build';
        else bodyProportions = 'balanced masculine proportions';
      }
    }

    return {
      heightDesc,
      buildDesc,
      gender,
      skinTone,
      ageCharacteristics,
      bodyProportions
    };
  }

  /**
   * Analyze proportional characteristics from measurements
   * Focus on overall appearance rather than exact measurements
   */
  private static analyzeProportionalCharacteristics(measurements: MeasurementData) {
    const heightInInches = this.convertHeightToInches(measurements.heightFeet, measurements.heightInches);

    // Determine gender
    let gender = 'person';
    if (measurements.gender === 'male') gender = 'man';
    else if (measurements.gender === 'female') gender = 'woman';
    else if (measurements.bodyType === 'curvy') gender = 'woman';
    else if (measurements.bodyType === 'athletic') gender = 'man';

    // Height-based proportional description
    let heightDesc = 'average height';
    if (heightInInches) {
      if (heightInInches < 60) heightDesc = 'petite';           // Under 5'0"
      else if (heightInInches < 64) heightDesc = 'short';       // 5'0" - 5'4"
      else if (heightInInches < 68) heightDesc = 'average';     // 5'4" - 5'8"
      else if (heightInInches < 72) heightDesc = 'tall';        // 5'8" - 6'0"
      else heightDesc = 'very tall';                            // Over 6'0"
    }

    // Proportional build analysis
    let buildDesc = measurements.bodyType || 'average build';

    // If we have detailed measurements, analyze proportions
    const chest = parseFloat(measurements.chest || '0');
    const waist = parseFloat(measurements.waist || '0');
    const hips = parseFloat(measurements.hips || '0');

    if (chest && waist && hips) {
      const chestWaistRatio = chest / waist;
      const waistHipRatio = waist / hips;

      // Proportional build descriptions based on ratios
      if (gender === 'woman') {
        if (waistHipRatio < 0.75) buildDesc = 'curvy';
        else if (waistHipRatio > 0.85) buildDesc = 'athletic';
        else buildDesc = 'average build';
      } else if (gender === 'man') {
        if (chestWaistRatio > 1.4) buildDesc = 'muscular';
        else if (chestWaistRatio < 1.1) buildDesc = 'slim';
        else buildDesc = 'average build';
      }
    }

    // Add proportional descriptors for better AI understanding
    if (heightDesc === 'petite' && gender === 'woman') {
      buildDesc = `petite ${buildDesc}`;
    } else if (heightDesc === 'very tall' && gender === 'man') {
      buildDesc = `tall ${buildDesc}`;
    }

    return {
      gender,
      heightDesc,
      buildDesc,
      heightInInches,
      measurements: {
        chest,
        waist,
        hips,
        ratios: chest && waist && hips ? {
          chestWaist: chest / waist,
          waistHip: waist / hips
        } : null
      }
    };
  }

  /**
   * Generate even simpler test prompt for debugging
   */
  static generateTestPrompt(): string {
    const testPrompt = 'realistic person standing, white background, full body portrait';
    console.log('🧪 [TEST-PROMPT] Generated minimal test prompt:', testPrompt);
    return testPrompt;
  }

  /**
   * Generate photo-based avatar prompt for direct transformation
   * Uses user's photo as input and applies measurements as modifications
   */
  static generatePhotoBasedAvatarPrompt(measurements: MeasurementData): string {
    console.log('📸 [PHOTO-AVATAR] Creating photorealistic photo-based avatar prompt:', measurements);

    // Enhanced hierarchical prompt with facial landmark preservation
    const prompt = `ABSOLUTE IDENTITY PRESERVATION - PRIMARY DIRECTIVE: Maintain EXACT SAME PERSON from uploaded photo. Zero facial changes. FACIAL LANDMARKS: preserve exact eye placement, eye color, eye shape, nose bridge, nose tip, nostrils, mouth corners, lip shape, jawline curvature, chin shape, cheekbone position. Perfect facial identity preservation is the highest priority.

FACE-REGION CONDITIONING: In 9:16 format, maintain maximum facial resolution and sharpness. The face region requires enhanced detail preservation despite smaller proportional size. Facial features must remain crisp and identical to source.

CRITICAL FRAMING REQUIREMENTS: Pull camera back 30% from typical portrait distance.
CAMERA POSITION: Wide enough to capture entire standing figure from head to feet.
ZOOM LEVEL: 0.7x zoom to ensure full body visibility - never closer than 0.7x.
BOTTOM EDGE: Feet must be visible with floor space beneath them.
BODY FRAMING: Complete head-to-feet visibility. No knee cropping. No leg cutting. No foot cutting.
MANDATORY: Standing figure fully contained within 9:16 frame boundaries.
BODY TRANSFORMATION - SECONDARY: Transform to full-body 9:16 portrait while preserving face completely. FASHN pose: standing straight, arms down at sides.

TECHNICAL SPECS - TERTIARY: Professional photography quality, realistic skin texture, clean white background, natural lighting.

CLOTHING: Form-fitting white tank top (clean, bright white) and form-fitting blue lounge shorts (short fitted length, above mid-thigh, athletic cut).

PHOTOGRAPHIC QUALITY: Professional studio photography with realistic skin texture showing visible pores, natural skin variations, subtle shine from natural oils. Authentic human skin imperfections and natural characteristics.

LIGHTING: Professional three-point lighting setup with soft key light, natural fill lighting, subtle rim light. Realistic shadow casting with soft edges, natural color temperature, professional color grading.

DEPTH & FOCUS: Shallow depth of field with natural bokeh, realistic camera focus, authentic photographic quality with slight grain.

BACKGROUND: Clean white studio background, professional photography setup.

QUALITY: Shot with professional camera equipment, photorealistic rendering, natural human appearance, no artificial or digital art characteristics.`;

    console.log('📸 [PHOTO-AVATAR] Generated photorealistic prompt:', prompt);
    return prompt;
  }

  /**
   * Generate hyperrealistic CGI avatar prompt for digital human rendering
   * Focuses on CGI realism with subsurface scattering and advanced rendering
   */
  static generateHyperrealisticCGIPrompt(measurements: MeasurementData): string {
    console.log('🎬 [CGI-AVATAR] Creating photorealistic avatar prompt (no CGI terminology):', measurements);

    // Enhanced hierarchical prompt with facial landmark conditioning
    const prompt = `MAXIMUM IDENTITY PRESERVATION - PRIMARY DIRECTIVE: This is the EXACT SAME PERSON from the uploaded photo. FACIAL LANDMARKS: maintain identical eye placement, eye color, iris patterns, nose bridge angle, nose tip shape, nostril width, mouth corner position, lip curvature, jawline definition, chin prominence, cheekbone structure. Zero facial modifications. Perfect identity preservation is mandatory.

FACIAL REGION ENHANCEMENT: In 9:16 aspect ratio, the face requires maximum detail preservation. Maintain ultra-sharp facial definition and perfect identity match despite smaller face proportion in full-body composition.

CRITICAL FRAMING REQUIREMENTS: Pull camera back 30% from typical portrait distance.
CAMERA POSITION: Wide enough to capture entire standing figure from head to feet.
ZOOM LEVEL: 0.7x zoom to ensure full body visibility - never closer than 0.7x.
BOTTOM EDGE: Feet must be visible with floor space beneath them.
BODY FRAMING: Complete head-to-feet visibility. No knee cropping. No leg cutting. No foot cutting.
MANDATORY: Standing figure fully contained within 9:16 frame boundaries.
BODY TRANSFORMATION - SECONDARY: Create full-body 9:16 portrait preserving facial identity completely. FASHN stance: straight posture, arms at sides.

TECHNICAL SPECS - TERTIARY: Hyperrealistic quality, professional lighting, detailed skin texture, clean background.

CLOTHING: High-quality form-fitting white tank top and form-fitting blue lounge shorts (short fitted length, above mid-thigh).

ULTRA-REALISTIC SKIN: Detailed skin texture with visible pores, natural skin oils creating subtle shine, realistic skin color variations, authentic human imperfections. Natural subsurface scattering effects, realistic skin translucency.

ADVANCED LIGHTING: Professional studio lighting with three-point setup - soft key light with natural shadows, subtle fill light eliminating harsh contrasts, gentle rim lighting for dimension. Realistic light interaction with skin and fabric.

PHOTOGRAPHIC EFFECTS: Natural depth of field with realistic bokeh, professional color grading with accurate skin tones, subtle film grain for authenticity. Realistic focus and camera characteristics.

MATERIAL REALISM: Authentic cotton fabric texture with natural drape and wrinkles, realistic fabric interaction with skin and body form.

FINAL QUALITY: Professional portrait photography standard, photorealistic human appearance, natural lighting and shadows, authentic skin and material textures.`;

    console.log('🎬 [CGI-AVATAR] Generated photorealistic prompt:', prompt);
    return prompt;
  }

  /**
   * Generate CGI quality specifications for advanced rendering
   */
  private static generateCGIQualityPrompt(): string {
    return 'CGI QUALITY SPECIFICATIONS: Hyperrealistic 2D render with subsurface scattering on skin, ' +
           'realistic fabric textures with material physics, professional studio lighting with CGI precision, ' +
           '8K quality details with pixel-perfect rendering, clean white infinity background, ' +
           'no harsh shadows with professional CGI lighting setup, advanced skin shader with pore detail, ' +
           'realistic hair rendering with individual strand detail, fabric wrinkle physics and material response, ' +
           'professional color grading with CGI post-processing quality. ';
  }

  /**
   * Generate CGI lighting prompt for professional studio setup
   */
  static generateCGILightingPrompt(): string {
    return 'PROFESSIONAL PHOTOGRAPHY LIGHTING: Advanced three-point studio lighting setup with soft key light providing natural skin illumination, ' +
           'subtle fill light eliminating harsh shadows while maintaining natural contrast, gentle rim light adding dimensional separation. ' +
           'Natural subsurface scattering effects on skin creating realistic translucency, professional color temperature calibrated for accurate skin tones. ' +
           'Soft shadow casting with realistic edge transitions, natural light interaction with skin texture and fabric materials. ' +
           'Professional color grading with authentic skin tone reproduction, natural ambient lighting providing subtle global illumination. ' +
           'Realistic depth and dimension through natural shadow play, professional studio quality with photographic authenticity. ';
  }

  /**
   * Generate CGI fabric and material prompt for realistic textures
   */
  static generateCGIFabricPrompt(): string {
    return 'REALISTIC FABRIC RENDERING: High-quality cotton t-shirt material with authentic fiber texture and natural fabric drape, ' +
           'realistic wrinkles and fabric creases following natural physics, authentic material weight and thickness characteristics. ' +
           'Cotton brief material with natural stretch properties and comfortable fit, professional garment construction with visible seams and stitching details. ' +
           'Natural fabric surface variation with realistic roughness and smoothness patterns, authentic light interaction with textile fibers. ' +
           'Realistic fabric opacity and light transmission properties, professional clothing photography quality. ' +
           'Natural fabric-to-skin interaction with realistic fit and drape physics, authentic garment behavior and form. ';
  }

  /**
   * Generate comprehensive face integration prompt for headless body
   * Advanced blending for seamless face-body integration
   */
  static generateCompositionPrompt(headPhotoAnalysis?: any): string {
    // Hierarchical prompt: Identity First (60%), Integration Second (30%), Technical Third (10%)
    const prompt = `ABSOLUTE FACIAL IDENTITY PRESERVATION - PRIMARY DIRECTIVE: This face from the source photo is SACRED - maintain every detail exactly. Same person, same eyes, same nose, same mouth, same jawline, same skin tone. Zero facial changes during integration.

SEAMLESS INTEGRATION - SECONDARY: Blend face with generated body maintaining perfect identity preservation. Perfect skin tone matching, invisible seams, natural appearance. Full-body 9:16 composition with complete head-to-feet visibility.

TECHNICAL EXECUTION - TERTIARY: Professional quality, natural lighting, realistic textures.

PHOTOREALISTIC QUALITY: Natural skin texture with visible pores, realistic skin variations, subtle natural shine. Consistent skin characteristics across entire figure.

LIGHTING CONTINUITY: Professional studio lighting with consistent illumination across face and body. Natural shadow casting, realistic light interaction with skin surface.

MATERIAL RENDERING: Form-fitting white tank top and blue lounge shorts with realistic fabric texture and natural drape.

TECHNICAL EXCELLENCE: Seamless blending, perfect color matching, natural depth of field, professional color grading, photographic realism throughout.

FINAL RESULT: Professional portrait photography quality with authentic human appearance, natural lighting, and realistic material textures.`;

    console.log('🎭 [FACE-INTEGRATION] Generated photorealistic composition prompt:', prompt);
    return prompt;
  }

  /**
   * Generate test composition prompt for debugging
   */
  static generateTestCompositionPrompt(): string {
    const testPrompt = 'combine these images, face from second image onto body from first image';
    console.log('🧪 [TEST-COMPOSITION] Generated minimal composition prompt:', testPrompt);
    return testPrompt;
  }

  /**
   * Analyze body characteristics from measurements
   */
  private static analyzeBodyFromMeasurements(measurements: MeasurementData): BodyDescription {
    // Determine gender (with fallback)
    let gender = 'person';
    if (measurements.gender === 'male') gender = 'male';
    else if (measurements.gender === 'female') gender = 'female';
    // Fallback to inferring from body type if no gender specified
    else if (measurements.bodyType === 'curvy') gender = 'female';
    else if (measurements.bodyType === 'athletic') gender = 'male';

    // Determine age description
    let age = 'adult';
    if (measurements.age) {
      if (measurements.age < 25) age = 'young adult';
      else if (measurements.age > 45) age = 'mature adult';
    }

    // Use provided body type or infer from measurements
    let bodyType = measurements.bodyType || 'average';

    // Determine height category
    const heightInInches = this.convertHeightToInches(measurements.heightFeet, measurements.heightInches);
    let height = 'average height';
    if (heightInInches) {
      if (heightInInches < 64) height = 'petite height';
      else if (heightInInches > 72) height = 'tall height';
    }

    // Analyze proportions from measurements
    let proportions = 'balanced proportions';
    let build = 'average build';

    const chest = parseFloat(measurements.chest);
    const waist = parseFloat(measurements.waist);
    const hips = parseFloat(measurements.hips);

    if (chest && waist && hips) {
      const chestWaistRatio = chest / waist;
      const waistHipRatio = waist / hips;

      if (bodyType === 'athletic' || chestWaistRatio > 1.3) {
        build = 'athletic build with broad shoulders';
        proportions = 'muscular proportions';
      } else if (bodyType === 'slim' || waistHipRatio > 0.85) {
        build = 'slim build';
        proportions = 'slender proportions';
      } else if (bodyType === 'curvy') {
        build = 'curvy build';
        proportions = 'feminine curves';
      }
    }

    return {
      gender,
      age,
      bodyType,
      height,
      proportions,
      build
    };
  }

  /**
   * Convert height from feet/inches to total inches
   */
  private static convertHeightToInches(feet: string, inches: string): number | null {
    const feetNum = parseInt(feet);
    const inchesNum = parseInt(inches);

    if (isNaN(feetNum) || isNaN(inchesNum)) return null;

    return (feetNum * 12) + inchesNum;
  }

  /**
   * Get prompt configuration for debugging/testing
   */
  static getPromptConfig(): CGIPromptConfig {
    return this.PROMPT_CONFIG;
  }

  /**
   * Generate short quality prompt for quick generation
   */
  static generateQuickPrompt(measurements: MeasurementData): string {
    const bodyDesc = this.analyzeBodyFromMeasurements(measurements);
    return `photorealistic CGI ${bodyDesc.gender} ${bodyDesc.bodyType} build, full body standing pose, white background, professional quality`;
  }

  /**
   * Validate measurements completeness for prompt generation
   */
  static validateMeasurements(measurements: MeasurementData): { valid: boolean; missing: string[] } {
    const required = ['heightFeet', 'heightInches', 'chest', 'waist', 'hips', 'bodyType'];
    const missing = required.filter(field => !measurements[field as keyof MeasurementData]);

    return {
      valid: missing.length === 0,
      missing
    };
  }
}

export default CGIPromptGenerator;