/**
 * Enhanced Two-Step Clothing Generation Service
 * Complete implementation with mobile optimization, error handling, and UI integration
 */

interface ClothingGenerationResult {
  success: boolean;
  imageUrl?: string;
  clothingType?: 'tops' | 'bottoms' | 'dresses' | 'shoes' | 'accessories';
  error?: string;
  metadata?: {
    prompt: string;
    enhancedPrompt: string;
    style: string;
    confidence: number;
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
    category: string;
    timestamp: string;
  };
}

interface WorkflowState {
  step: 'idle' | 'generating' | 'preview' | 'confirming' | 'trying-on' | 'complete' | 'error';
  generatedOutfit?: ClothingGenerationResult;
  tryOnResult?: VirtualTryOnResult;
  originalPrompt?: string;
  progress: number;
  message: string;
}

interface OutfitHistory {
  id: string;
  prompt: string;
  imageUrl: string;
  type: string;
  timestamp: string;
  rating?: 'up' | 'down';
  triedOn: boolean;
}

export class EnhancedTwoStepService {
  private state: WorkflowState = {
    step: 'idle',
    progress: 0,
    message: 'Ready to generate outfit'
  };

  private outfitHistory: OutfitHistory[] = [];
  private retryCount = 0;
  private maxRetries = 3;

  /**
   * Step 1: Generate standalone clothing with enhanced prompts
   */
  async generateStandaloneOutfit(
    userPrompt: string,
    style: string = 'casual',
    useEnhancedPrompt: boolean = true
  ): Promise<ClothingGenerationResult> {
    try {
      this.updateState('generating', 20, 'Generating your outfit...');
      this.retryCount = 0;

      // Enhance prompt using LLM if requested
      const enhancedPrompt = useEnhancedPrompt
        ? await this.enhancePromptWithLLM(userPrompt, style)
        : this.enhancePromptBasic(userPrompt);

      // Detect clothing type for better parameters
      const clothingType = this.detectClothingType(userPrompt);

      this.updateState('generating', 40, `Creating ${clothingType}...`);

      const apiParams = this.getOptimizedParams(clothingType, enhancedPrompt);

      const response = await fetch('/api/fal/flux/dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiParams),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.images && result.images.length > 0) {
        const outfit: ClothingGenerationResult = {
          success: true,
          imageUrl: result.images[0].url,
          clothingType,
          metadata: {
            prompt: userPrompt,
            enhancedPrompt,
            style,
            confidence: 0.9, // TODO: Implement actual confidence scoring
            timestamp: new Date().toISOString()
          }
        };

        // Add to history
        this.addToHistory(outfit, userPrompt);

        this.updateState('preview', 60, 'Outfit generated! Review before trying on.');
        this.state.generatedOutfit = outfit;

        return outfit;
      } else {
        throw new Error('No outfit generated');
      }

    } catch (error) {
      console.error('❌ [ENHANCED-WORKFLOW] Generation failed:', error);

      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.updateState('generating', 30, `Retry ${this.retryCount}/${this.maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.generateStandaloneOutfit(userPrompt, style, useEnhancedPrompt);
      }

      this.updateState('error', 0, 'Generation failed. Try a different prompt.');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Step 2: User confirmation - handled by UI component
   */
  async awaitUserConfirmation(): Promise<boolean> {
    this.updateState('confirming', 65, 'Try this outfit on your avatar?');
    // This is handled by the UI component
    return true;
  }

  /**
   * Step 3: Virtual try-on with the generated outfit (Face-preserving implementation)
   */
  async performVirtualTryOn(
    avatarImageUrl: string,
    outfitImageUrl?: string
  ): Promise<VirtualTryOnResult> {
    try {
      const clothingUrl = outfitImageUrl || this.state.generatedOutfit?.imageUrl;
      if (!clothingUrl) {
        throw new Error('No outfit to try on');
      }

      this.updateState('trying-on', 80, 'Trying outfit on your avatar...');
      this.retryCount = 0;

      const clothingType = this.state.generatedOutfit?.clothingType || 'tops';

      // Use correct fal.ai virtual try-on API endpoint and parameters
      const tryOnApiUrl = 'https://fal.run/fal-ai/image-apps-v2/virtual-try-on';
      console.log('🔍 [ENHANCED] Calling Virtual Try-On API endpoint:', tryOnApiUrl);
      console.log('📤 [ENHANCED] Sending to try-on API:', {
        clothing: clothingUrl,
        avatar: avatarImageUrl,
        category: clothingType
      });

      // Correct request body format for fal.ai virtual try-on API
      const requestBody = {
        person_image_url: avatarImageUrl,
        clothing_image_url: clothingUrl,
        preserve_pose: true // Keep the person's pose
      };

      console.log('📤 [ENHANCED] Request body:', requestBody);

      const response = await fetch(tryOnApiUrl.replace('https://fal.run', '/api/fal'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 [ENHANCED] Try-on response status:', response.status);

      if (response.status === 422) {
        const errorData = await response.text();
        console.error('❌ [ENHANCED] 422 Error details:', errorData);
        throw new Error(`Invalid request format for virtual try-on: ${errorData}`);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 [ENHANCED] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Virtual try-on failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [ENHANCED] API Response:', result);

      // Handle fal.ai virtual try-on response format
      const finalImageUrl = result.images?.[0]?.url;

      if (finalImageUrl) {
        const tryOnResult: VirtualTryOnResult = {
          success: true,
          finalImageUrl,
          metadata: {
            clothingUrl: clothingUrl,
            avatarUrl: avatarImageUrl,
            category: clothingType,
            timestamp: new Date().toISOString()
          }
        };

        this.state.tryOnResult = tryOnResult;
        this.markOutfitAsTriedOn();
        this.updateState('complete', 100, 'Try-on complete!');

        console.log('✅ [ENHANCED-WORKFLOW] Face-preserving try-on completed successfully');
        return tryOnResult;
      } else {
        throw new Error('No final image generated');
      }

    } catch (error) {
      console.error('❌ [ENHANCED-WORKFLOW] Try-on failed:', error);

      // Retry with different parameters
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.updateState('trying-on', 75, `Try-on retry ${this.retryCount}/${this.maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.performVirtualTryOn(avatarImageUrl, outfitImageUrl);
      }

      this.updateState('error', 65, 'Try-on failed. Outfit saved for later.');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Try-on failed'
      };
    }
  }

  /**
   * Complete workflow: Generate → Confirm → Try-on
   */
  async executeCompleteWorkflow(
    userPrompt: string,
    avatarImageUrl: string,
    style: string = 'casual',
    autoConfirm: boolean = false
  ): Promise<{
    generation: ClothingGenerationResult;
    tryOn?: VirtualTryOnResult;
  }> {
    this.state.originalPrompt = userPrompt;

    // Step 1: Generate outfit
    const generation = await this.generateStandaloneOutfit(userPrompt, style);

    if (!generation.success) {
      return { generation };
    }

    // Step 2: Auto-confirm or wait for user
    if (autoConfirm) {
      // Step 3: Try-on
      const tryOn = await this.performVirtualTryOn(avatarImageUrl);
      return { generation, tryOn };
    }

    return { generation };
  }

  /**
   * Enhanced prompt generation using LLM
   */
  private async enhancePromptWithLLM(userPrompt: string, style: string): Promise<string> {
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 150,
          messages: [
            {
              role: 'user',
              content: `Enhance this clothing prompt for AI image generation: "${userPrompt}"

              Style: ${style}

              Requirements:
              - Make it specific and detailed
              - Add quality modifiers
              - Include "clothing item only, clean background"
              - Remove any person references
              - Keep it under 100 words

              Return only the enhanced prompt, no explanation.`
            }
          ]
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const enhanced = result.content?.[0]?.text || userPrompt;
        return enhanced.trim();
      }
    } catch (error) {
      console.warn('LLM enhancement failed, using basic enhancement');
    }

    return this.enhancePromptBasic(userPrompt);
  }

  /**
   * Basic prompt enhancement
   */
  private enhancePromptBasic(userPrompt: string): string {
    const qualityTerms = "high quality, detailed, professional photography, clean background, clothing item only";
    const negativeAvoidance = "no person, no model, no wearing, standalone garment";

    return `${userPrompt}, ${qualityTerms}, ${negativeAvoidance}`;
  }

  /**
   * Detect clothing type from prompt
   */
  private detectClothingType(prompt: string): 'tops' | 'bottoms' | 'dresses' | 'shoes' | 'accessories' {
    const lower = prompt.toLowerCase();

    if (lower.includes('dress') || lower.includes('gown') || lower.includes('frock')) {
      return 'dresses';
    }
    if (lower.includes('pants') || lower.includes('jeans') || lower.includes('trousers') ||
        lower.includes('shorts') || lower.includes('skirt')) {
      return 'bottoms';
    }
    if (lower.includes('shoes') || lower.includes('boots') || lower.includes('sneakers') ||
        lower.includes('sandals') || lower.includes('heels')) {
      return 'shoes';
    }
    if (lower.includes('necklace') || lower.includes('earrings') || lower.includes('bracelet') ||
        lower.includes('watch') || lower.includes('bag') || lower.includes('hat')) {
      return 'accessories';
    }

    // Default to tops for shirts, blouses, sweaters, etc.
    return 'tops';
  }

  /**
   * Get optimized parameters based on clothing type
   */
  private getOptimizedParams(clothingType: string, prompt: string) {
    const baseParams = {
      prompt,
      image_size: 'square_hd',
      num_inference_steps: 25,
      guidance_scale: 7.5,
      num_images: 1,
      enable_safety_checker: false
    };

    const negativePrompts = {
      tops: 'person, model, body, wearing, on body, distorted, blurry, low quality',
      bottoms: 'person, model, body, wearing, on body, distorted, blurry, low quality, top half',
      dresses: 'person, model, body, wearing, on body, distorted, blurry, low quality, separate pieces',
      shoes: 'person, model, body, wearing, feet, legs, distorted, blurry, low quality',
      accessories: 'person, model, body, wearing, on body, distorted, blurry, low quality'
    };

    return {
      ...baseParams,
      negative_prompt: negativePrompts[clothingType] || negativePrompts.tops
    };
  }

  /**
   * Add outfit to history
   */
  private addToHistory(outfit: ClothingGenerationResult, prompt: string): void {
    if (!outfit.imageUrl) return;

    const historyItem: OutfitHistory = {
      id: `outfit_${Date.now()}`,
      prompt,
      imageUrl: outfit.imageUrl,
      type: outfit.clothingType || 'unknown',
      timestamp: new Date().toISOString(),
      triedOn: false
    };

    this.outfitHistory.unshift(historyItem);
    // Keep only last 20 items
    this.outfitHistory = this.outfitHistory.slice(0, 20);

    // Save to localStorage
    localStorage.setItem('outfitHistory', JSON.stringify(this.outfitHistory));
  }

  /**
   * Mark outfit as tried on
   */
  private markOutfitAsTriedOn(): void {
    if (this.outfitHistory.length > 0) {
      this.outfitHistory[0].triedOn = true;
      localStorage.setItem('outfitHistory', JSON.stringify(this.outfitHistory));
    }
  }

  /**
   * Rate outfit (thumbs up/down)
   */
  rateOutfit(outfitId: string, rating: 'up' | 'down'): void {
    const outfit = this.outfitHistory.find(o => o.id === outfitId);
    if (outfit) {
      outfit.rating = rating;
      localStorage.setItem('outfitHistory', JSON.stringify(this.outfitHistory));
    }
  }

  /**
   * Get outfit history
   */
  getOutfitHistory(): OutfitHistory[] {
    try {
      const saved = localStorage.getItem('outfitHistory');
      if (saved) {
        this.outfitHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load outfit history');
    }
    return this.outfitHistory;
  }

  /**
   * Clear generated outfit and restart
   */
  restart(): void {
    this.updateState('idle', 0, 'Ready to generate outfit');
    this.state.generatedOutfit = undefined;
    this.state.tryOnResult = undefined;
    this.state.originalPrompt = undefined;
    this.retryCount = 0;
  }

  /**
   * Update workflow state
   */
  private updateState(step: WorkflowState['step'], progress: number, message: string): void {
    this.state = { ...this.state, step, progress, message };
  }

  /**
   * Get current workflow state
   */
  getState(): WorkflowState {
    return { ...this.state };
  }

  /**
   * Get mobile-optimized loading messages
   */
  getMobileMessage(): string {
    const messages = {
      idle: '✨ Ready to create',
      generating: '🎨 Creating outfit...',
      preview: '👀 How does it look?',
      confirming: '💫 Try it on?',
      'trying-on': '👗 Fitting...',
      complete: '✅ Perfect fit!',
      error: '❌ Let\'s try again'
    };

    return messages[this.state.step] || this.state.message;
  }

  /**
   * Haptic feedback for mobile
   */
  triggerHapticFeedback(type: 'success' | 'error' | 'light' = 'light'): void {
    if ('vibrate' in navigator) {
      const patterns = {
        success: [100, 50, 100],
        error: [200, 100, 200],
        light: [50]
      };
      navigator.vibrate(patterns[type]);
    }
  }
}

// Singleton instance
export const enhancedTwoStepService = new EnhancedTwoStepService();
export default enhancedTwoStepService;