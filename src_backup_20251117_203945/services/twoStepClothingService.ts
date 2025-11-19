/**
 * Two-Step Clothing Service - Prevents avatar distortion by separating clothing generation from try-on
 * Step 1: Generate standalone clothing with text-to-image
 * Step 2: Apply clothing to avatar with virtual try-on using avatar management service
 */
import avatarManagementService, { TryOnParameters } from './avatarManagementService';
import virtualTryOnService from './virtualTryOnService';

interface ClothingGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    prompt: string;
    style: string;
    timestamp: string;
  };
}

interface VirtualTryOnResult {
  success: boolean;
  finalImageUrl?: string;
  error?: string;
  metadata?: {
    clothingUrl: string;
    avatarUrl: string;
    timestamp: string;
  };
}

interface TwoStepWorkflowState {
  step: 'idle' | 'generating-clothing' | 'clothing-ready' | 'applying-to-avatar' | 'complete';
  generatedClothingUrl?: string;
  finalAvatarUrl?: string;
  currentPrompt?: string;
}

class TwoStepClothingService {
  private readonly FAL_API_BASE = '/fal-ai';
  private workflowState: TwoStepWorkflowState = { step: 'idle' };

  /**
   * Step 1: Generate standalone clothing using text-to-image
   */
  async generateStandaloneClothing(
    clothingPrompt: string,
    style: 'casual' | 'formal' | 'trendy' | 'vintage' | 'minimalist' | 'edgy' = 'casual'
  ): Promise<ClothingGenerationResult> {
    try {
      console.log('👗 [STEP 1] Generating standalone clothing...');
      console.log('📝 Prompt:', clothingPrompt);

      this.workflowState = {
        step: 'generating-clothing',
        currentPrompt: clothingPrompt
      };

      // Enhanced prompt for standalone clothing generation
      const enhancedPrompt = this.enhanceClothingPrompt(clothingPrompt, style);

      // Use SeedDream v4 for better clothing generation with enhanced prompt
      const apiUrl = '/api/fal/bytedance/seedream/v4/text-to-image';
      console.log('🎨 Calling SeedDream v4 API via proxy:', apiUrl);

      // Enhanced prompt for better clothing generation
      const seedreamPrompt = `${enhancedPrompt}, high quality fashion photography, clothing item only, no mannequin, no person, plain white background, centered composition, professional product photography, detailed fabric texture, well-lit, crisp details`;
      console.log('📝 SeedDream enhanced prompt:', seedreamPrompt);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: seedreamPrompt,
          image_size: 'square_hd',
          num_images: 1,
          enable_safety_checker: false,
          guidance_scale: 4.5, // Adjust for prompt adherence
          num_inference_steps: 20, // Balance between speed and quality
          sync_mode: true // For immediate results
        }),
      });

      // Enhanced error handling with status details
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 [SEEDREAM-V4] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`SeedDream v4 API failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Handle SeedDream v4 response format
      const clothingImageUrl = result.images?.[0]?.url || result.output || result.url;

      if (clothingImageUrl) {

        // Validate the image URL
        console.log('🔍 Validating clothing image URL:', clothingImageUrl);
        const isValidUrl = await this.validateImageUrl(clothingImageUrl);

        if (!isValidUrl) {
          throw new Error('Generated clothing image URL is invalid or inaccessible');
        }

        this.workflowState = {
          step: 'clothing-ready',
          generatedClothingUrl: clothingImageUrl,
          currentPrompt: clothingPrompt
        };

        console.log('✅ [STEP 1] Standalone clothing generated successfully');
        console.log('🖼️ Valid Image URL:', clothingImageUrl);

        return {
          success: true,
          imageUrl: clothingImageUrl,
          metadata: {
            prompt: clothingPrompt,
            style,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        throw new Error('No clothing image generated');
      }

    } catch (error) {
      console.error('❌ [STEP 1] Clothing generation failed:', error);
      this.workflowState = { step: 'idle' };

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Step 2: Apply generated clothing to avatar using avatar management service with warping protection
   */
  async applyClothingToAvatar(
    clothingImageUrl: string,
    avatarImageUrl: string
  ): Promise<VirtualTryOnResult> {
    try {
      console.log('👤 [STEP 2] Applying clothing to avatar with warping protection...');
      console.log('👗 Clothing URL:', clothingImageUrl);
      console.log('🧑 Avatar URL:', avatarImageUrl);

      this.workflowState = {
        ...this.workflowState,
        step: 'applying-to-avatar'
      };

      // Validate both image URLs before proceeding
      console.log('🔍 Validating image URLs before virtual try-on...');
      const [clothingValid, avatarValid] = await Promise.all([
        this.validateImageUrl(clothingImageUrl),
        this.validateImageUrl(avatarImageUrl)
      ]);

      if (!clothingValid) {
        throw new Error(`Clothing image URL is invalid or inaccessible: ${clothingImageUrl}`);
      }

      if (!avatarValid) {
        throw new Error(`Avatar image URL is invalid or inaccessible: ${avatarImageUrl}`);
      }

      console.log('✅ Both image URLs are valid, proceeding with direct FASHN API try-on...');

      // Use direct FASHN API for virtual try-on with fallback
      const tryOnResult = await this.tryOnWithFashnAndFallback(clothingImageUrl, avatarImageUrl);

      const safeResult = tryOnResult;

      if (safeResult.success && safeResult.finalImageUrl) {
        this.workflowState = {
          ...this.workflowState,
          step: 'complete',
          finalAvatarUrl: safeResult.finalImageUrl
        };

        console.log('✅ [STEP 2] Safe virtual try-on completed successfully');
        console.log('🎯 Final avatar URL:', safeResult.finalImageUrl);
        console.log('🛡️ Warping detection:', safeResult.warpingDetection);

        return {
          success: true,
          finalImageUrl: safeResult.finalImageUrl,
          metadata: {
            clothingUrl: clothingImageUrl,
            avatarUrl: avatarImageUrl,
            timestamp: new Date().toISOString(),
            warpingDetection: safeResult.warpingDetection,
            avatarState: avatarManagementService.getAvatarState()
          }
        };
      } else {
        this.workflowState = { step: 'idle' };

        return {
          success: false,
          error: safeResult.error || 'Avatar management service failed',
          metadata: {
            clothingUrl: clothingImageUrl,
            avatarUrl: avatarImageUrl,
            timestamp: new Date().toISOString(),
            resetRequired: safeResult.resetRequired,
            warpingDetection: safeResult.warpingDetection
          }
        };
      }

    } catch (error) {
      console.error('❌ [STEP 2] Virtual try-on failed:', error);
      this.workflowState = { step: 'idle' };

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Complete two-step workflow
   */
  async executeTwoStepWorkflow(
    clothingPrompt: string,
    avatarImageUrl: string,
    style: 'casual' | 'formal' | 'trendy' | 'vintage' | 'minimalist' | 'edgy' = 'casual'
  ): Promise<{
    clothingResult: ClothingGenerationResult;
    tryOnResult?: VirtualTryOnResult;
  }> {
    console.log('🔄 [WORKFLOW] Starting two-step clothing workflow...');

    // Step 1: Generate clothing
    const clothingResult = await this.generateStandaloneClothing(clothingPrompt, style);

    if (!clothingResult.success || !clothingResult.imageUrl) {
      return { clothingResult };
    }

    // Step 2: Apply to avatar (this would typically be triggered by user confirmation)
    const tryOnResult = await this.applyClothingToAvatar(
      clothingResult.imageUrl,
      avatarImageUrl
    );

    return {
      clothingResult,
      tryOnResult
    };
  }

  /**
   * Enhanced prompt engineering for standalone clothing generation
   */
  private enhanceClothingPrompt(basePrompt: string, style: string): string {
    const styleModifiers = {
      casual: "casual, comfortable, everyday wear, relaxed fit",
      formal: "formal, elegant, professional, business attire, sophisticated",
      trendy: "trendy, fashionable, contemporary, modern, stylish",
      vintage: "vintage, retro, classic, timeless, traditional",
      minimalist: "minimalist, clean lines, simple, understated, modern",
      edgy: "edgy, bold, alternative, unique, statement piece"
    };

    // Enhanced terms for better standalone clothing generation
    const qualityTerms = "high quality, detailed, professional product photography, studio lighting, clean white background, 4K resolution, crisp details, well-lit, sharp focus";
    const clothingFocus = "standalone clothing item laid flat, product photography, no person wearing it, isolated garment on clean background, fashion product shot, clothing only";
    const negativeGuidance = "not worn by person, no body, no mannequin, no model";

    return `${basePrompt}, ${styleModifiers[style]}, ${clothingFocus}, ${qualityTerms}, ${negativeGuidance}`;
  }

  /**
   * Reset workflow state
   */
  resetWorkflow(): void {
    console.log('🔄 [WORKFLOW] Resetting two-step workflow...');
    this.workflowState = { step: 'idle' };
  }

  /**
   * Get current workflow state
   */
  getWorkflowState(): TwoStepWorkflowState {
    return { ...this.workflowState };
  }

  /**
   * Check if ready for step 2
   */
  isReadyForTryOn(): boolean {
    return this.workflowState.step === 'clothing-ready' && !!this.workflowState.generatedClothingUrl;
  }

  /**
   * Get generated clothing URL
   */
  getGeneratedClothingUrl(): string | undefined {
    return this.workflowState.generatedClothingUrl;
  }

  /**
   * Try-on with FASHN and fallback to FAL if needed
   */
  private async tryOnWithFashnAndFallback(clothingImageUrl: string, avatarImageUrl: string): Promise<{
    success: boolean;
    finalImageUrl?: string;
    error?: string;
    warpingDetection?: any;
  }> {
    try {
      console.log('🎯 [DIRECT-FASHN] Attempting direct FASHN API virtual try-on...');

      // Use direct FASHN API for virtual try-on
      const fashnResult = await virtualTryOnService.tryOnClothing(
        avatarImageUrl,
        clothingImageUrl,
        { category: 'upper_body' }
      );

      if (fashnResult.success && fashnResult.imageUrl) {
        console.log('✅ [DIRECT-FASHN] Try-on completed successfully with direct API');
        return {
          success: true,
          finalImageUrl: fashnResult.imageUrl,
          warpingDetection: { fashnUsed: true, riskLevel: 'low' }
        };
      } else {
        console.log('⚠️ [FASHN] Failed, attempting fallback to FAL...');
        return await this.fallbackToFalTryOn(clothingImageUrl, avatarImageUrl);
      }

    } catch (error) {
      console.error('❌ [DIRECT-FASHN] Error occurred with direct FASHN API, falling back to FAL:', error);
      return await this.fallbackToFalTryOn(clothingImageUrl, avatarImageUrl);
    }
  }

  /**
   * Fallback to original FAL try-on implementation
   */
  private async fallbackToFalTryOn(clothingImageUrl: string, avatarImageUrl: string): Promise<{
    success: boolean;
    finalImageUrl?: string;
    error?: string;
    warpingDetection?: any;
  }> {
    try {
      console.log('🔄 [FALLBACK] Using FAL try-on as fallback...');

      // Initialize avatar management if not already done
      const avatarState = avatarManagementService.getAvatarState();
      if (!avatarState) {
        console.log('🏠 Initializing avatar management with current avatar');
        avatarManagementService.initializeAvatar(avatarImageUrl);
      }

      // Use avatar management service for safe try-on
      const safeResult = await avatarManagementService.performSafeTryOn({
        clothingImageUrl,
        avatarImageUrl,
        strength: 0.2, // Very low strength to prevent warping
        preserveFace: true,
        preserveBody: true
      });

      console.log('✅ [FALLBACK] FAL try-on completed');
      return safeResult;

    } catch (error) {
      console.error('❌ [FALLBACK] FAL try-on also failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Both FASHN and FAL try-on failed'
      };
    }
  }

  /**
   * Validate image URLs
   */
  private async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch {
      return false;
    }
  }

  /**
   * Get workflow progress percentage
   */
  getWorkflowProgress(): { step: string; progress: number; message: string } {
    switch (this.workflowState.step) {
      case 'idle':
        return { step: 'idle', progress: 0, message: 'Ready to start' };
      case 'generating-clothing':
        return { step: 'generating-clothing', progress: 25, message: 'Generating clothing...' };
      case 'clothing-ready':
        return { step: 'clothing-ready', progress: 50, message: 'Clothing ready - awaiting confirmation' };
      case 'applying-to-avatar':
        return { step: 'applying-to-avatar', progress: 75, message: 'Applying to avatar...' };
      case 'complete':
        return { step: 'complete', progress: 100, message: 'Workflow complete!' };
      default:
        return { step: 'unknown', progress: 0, message: 'Unknown state' };
    }
  }

  /**
   * Generate clothing variations
   */
  async generateClothingVariations(
    basePrompt: string,
    count: number = 3,
    style: string = 'casual'
  ): Promise<ClothingGenerationResult[]> {
    console.log(`🎨 [VARIATIONS] Generating ${count} clothing variations...`);

    const variations = [];
    const colorVariations = ['', 'blue', 'red', 'black', 'white', 'green', 'purple'];
    const styleVariations = ['', 'striped', 'solid', 'patterned', 'textured'];

    for (let i = 0; i < count; i++) {
      const colorMod = colorVariations[i % colorVariations.length];
      const styleMod = styleVariations[i % styleVariations.length];

      const variationPrompt = `${basePrompt} ${colorMod} ${styleMod}`.trim();
      const result = await this.generateStandaloneClothing(variationPrompt, style as any);
      variations.push(result);

      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return variations;
  }

  /**
   * Reset avatar to original state
   */
  resetAvatarToOriginal(): any {
    console.log('🔄 [AVATAR-RESET] Resetting avatar to original state');
    return avatarManagementService.resetToOriginal();
  }

  /**
   * Get avatar management status
   */
  getAvatarStatus(): {
    state: any;
    statusMessage: string;
    needsResetWarning: boolean;
    changeProgress: any;
  } {
    return {
      state: avatarManagementService.getAvatarState(),
      statusMessage: avatarManagementService.getStatusMessage(),
      needsResetWarning: avatarManagementService.needsResetWarning(),
      changeProgress: avatarManagementService.getChangeProgress()
    };
  }

  /**
   * Initialize avatar management
   */
  initializeAvatarManagement(originalAvatarUrl: string): any {
    console.log('🏠 [AVATAR-INIT] Initializing avatar management');
    return avatarManagementService.initializeAvatar(originalAvatarUrl);
  }

  /**
   * Check if avatar should be reset due to max changes
   */
  shouldResetAvatar(): boolean {
    return avatarManagementService.shouldResetForMaxChanges();
  }
}

export const twoStepClothingService = new TwoStepClothingService();
export default twoStepClothingService;