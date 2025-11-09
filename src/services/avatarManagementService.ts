/**
 * Avatar Management Service
 * Handles original avatar backup, clothing change tracking, warping detection, and auto-reset logic
 * Integrates with avatarStorageService for persistent avatar library
 */

import avatarStorageService, { type SavedAvatar } from './avatarStorageService';

export interface AvatarState {
  originalAvatar: string; // Always keep backup of the clean avatar
  currentAvatar: string; // Current avatar (may have clothing applied)
  clothingChanges: number; // Track number of clothing changes
  lastClothingChange?: string; // URL of last clothing change
  changeHistory: string[]; // History of avatar changes
  isWarped?: boolean; // Flag if current avatar is detected as warped
}

export interface WarpingDetectionResult {
  isWarped: boolean;
  confidence: number; // 0-1 score of warping confidence
  issues: string[]; // List of detected issues
  recommendation: 'accept' | 'retry' | 'revert';
}

export interface TryOnParameters {
  clothingImageUrl: string;
  avatarImageUrl: string;
  strength?: number; // 0.1-1.0, default 0.2 for minimal warping
  preserveFace?: boolean;
  preserveBody?: boolean;
}

class AvatarManagementService {
  private avatarState: AvatarState | null = null;
  private readonly MAX_CLOTHING_CHANGES = 2;
  private readonly DEFAULT_STRENGTH = 0.2; // Very low to prevent warping

  /**
   * Initialize avatar management with original avatar
   */
  initializeAvatar(originalAvatarUrl: string, saveToLibrary: boolean = true, avatarName?: string): AvatarState {
    console.log('🏠 [AVATAR-MGMT] Initializing avatar management with original:', originalAvatarUrl);

    this.avatarState = {
      originalAvatar: originalAvatarUrl,
      currentAvatar: originalAvatarUrl,
      clothingChanges: 0,
      changeHistory: [originalAvatarUrl],
      isWarped: false
    };

    // Save to localStorage for session persistence
    this.saveAvatarState();

    // Optionally save to avatar library for long-term persistence
    if (saveToLibrary) {
      this.saveAvatarToLibrary(originalAvatarUrl, avatarName);
    }

    return this.avatarState;
  }

  /**
   * Initialize avatar storage and sync with Supabase
   * Call this on app startup to enable cross-device avatar sync
   */
  async initializeAvatarStorage(): Promise<void> {
    console.log('🚀 [AVATAR-MGMT] Initializing avatar storage with Supabase sync...');
    await avatarStorageService.initialize();
    console.log('✅ [AVATAR-MGMT] Avatar storage initialized');
  }

  /**
   * Save current avatar to the persistent library
   */
  saveAvatarToLibrary(avatarUrl: string, name?: string, setAsDefault: boolean = false): SavedAvatar | null {
    try {
      // Create avatar data object that matches the expected format
      const avatarData = {
        imageUrl: avatarUrl,
        processedImageUrl: avatarUrl,
        metadata: {}
      };

      const savedAvatar = avatarStorageService.saveAvatar(avatarData, name, setAsDefault);
      console.log('💾 [AVATAR-MGMT] Avatar saved to library:', savedAvatar.name);
      return savedAvatar;
    } catch (error) {
      console.error('❌ [AVATAR-MGMT] Failed to save avatar to library:', error);
      return null;
    }
  }

  /**
   * Load avatar from library into current session
   */
  loadAvatarFromLibrary(avatarId: string): AvatarState | null {
    const library = avatarStorageService.getAvatarLibrary();
    const savedAvatar = library.savedAvatars.find(a => a.id === avatarId);

    if (savedAvatar) {
      this.avatarState = {
        originalAvatar: savedAvatar.imageUrl,
        currentAvatar: savedAvatar.imageUrl,
        clothingChanges: 0,
        changeHistory: [savedAvatar.imageUrl],
        isWarped: false
      };

      // Mark as current avatar in storage
      avatarStorageService.setCurrentAvatar(avatarId);

      // Save session state
      this.saveAvatarState();

      console.log('📥 [AVATAR-MGMT] Loaded avatar from library:', savedAvatar.name);
      return this.avatarState;
    }

    console.error('❌ [AVATAR-MGMT] Avatar not found in library:', avatarId);
    return null;
  }

  /**
   * Get saved avatars from library
   */
  getSavedAvatars(): SavedAvatar[] {
    const library = avatarStorageService.getAvatarLibrary();
    return library.savedAvatars;
  }

  /**
   * Check if any avatars are saved
   */
  hasStoredAvatars(): boolean {
    return avatarStorageService.hasAvatars();
  }

  /**
   * Get the default avatar from library
   */
  getDefaultAvatar(): SavedAvatar | null {
    return avatarStorageService.getDefaultAvatar();
  }

  /**
   * Get the current avatar from library
   */
  getCurrentAvatar(): SavedAvatar | null {
    return avatarStorageService.getCurrentAvatar();
  }

  /**
   * Get the best available avatar (perfect > default > current > most recent)
   */
  getBestAvatar(): SavedAvatar | null {
    return avatarStorageService.getBestAvatar();
  }

  /**
   * Delete an avatar from the library
   */
  deleteAvatar(avatarId: string): boolean {
    try {
      avatarStorageService.deleteAvatar(avatarId);
      console.log('🗑️ [AVATAR-MGMT] Deleted avatar:', avatarId);
      return true;
    } catch (error) {
      console.error('❌ [AVATAR-MGMT] Failed to delete avatar:', error);
      return false;
    }
  }

  /**
   * Load default avatar if available
   */
  loadDefaultAvatar(): AvatarState | null {
    const defaultAvatar = this.getDefaultAvatar();
    if (defaultAvatar) {
      return this.loadAvatarFromLibrary(defaultAvatar.id);
    }
    return null;
  }

  /**
   * Check if we need to reset due to max clothing changes
   */
  shouldResetForMaxChanges(): boolean {
    if (!this.avatarState) return false;
    return this.avatarState.clothingChanges >= this.MAX_CLOTHING_CHANGES;
  }

  /**
   * Get current avatar state
   */
  getAvatarState(): AvatarState | null {
    return this.avatarState ? { ...this.avatarState } : null;
  }

  /**
   * Reset to original avatar
   */
  resetToOriginal(): AvatarState {
    if (!this.avatarState) {
      throw new Error('Avatar not initialized');
    }

    console.log('🔄 [AVATAR-MGMT] Resetting to original avatar');

    this.avatarState = {
      ...this.avatarState,
      currentAvatar: this.avatarState.originalAvatar,
      clothingChanges: 0,
      lastClothingChange: undefined,
      changeHistory: [this.avatarState.originalAvatar],
      isWarped: false
    };

    this.saveAvatarState();
    return this.avatarState;
  }

  /**
   * Perform anti-warping virtual try-on with safety checks
   */
  async performSafeTryOn(params: TryOnParameters): Promise<{
    success: boolean;
    finalImageUrl?: string;
    warpingDetection?: WarpingDetectionResult;
    error?: string;
    resetRequired?: boolean;
  }> {
    try {
      if (!this.avatarState) {
        throw new Error('Avatar not initialized');
      }

      // Check if we need to reset first
      if (this.shouldResetForMaxChanges()) {
        console.log('⚠️ [AVATAR-MGMT] Max clothing changes reached, forcing reset');
        this.resetToOriginal();
        return {
          success: false,
          resetRequired: true,
          error: 'Maximum clothing changes reached. Avatar reset to original.'
        };
      }

      console.log('👗 [AVATAR-MGMT] Starting safe virtual try-on...');

      // Use very low strength to prevent warping
      const safeParams = {
        person_image_url: params.avatarImageUrl,
        clothing_image_url: params.clothingImageUrl,
        strength: params.strength || this.DEFAULT_STRENGTH,
        prompt: 'ONLY change clothing, preserve exact body shape, same face, same proportions',
        negative_prompt: 'warping, distortion, deformed body, changed face, altered proportions, body warping, face change, different person',
        preserve_pose: true,
        preserve_face: params.preserveFace !== false,
        preserve_body: params.preserveBody !== false
      };

      console.log('📤 [AVATAR-MGMT] Try-on parameters:', safeParams);

      // Call fal.ai virtual try-on API via proxy with anti-warping settings
      const response = await fetch('/api/fal/image-apps-v2/virtual-try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(safeParams),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 [AVATAR-MGMT] Virtual try-on failed:', errorText);
        throw new Error(`Virtual try-on failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const finalImageUrl = result.images?.[0]?.url;

      if (!finalImageUrl) {
        throw new Error('No image generated from virtual try-on');
      }

      // Detect warping in the result
      const warpingDetection = await this.detectWarping(
        this.avatarState.originalAvatar,
        finalImageUrl
      );

      console.log('🔍 [AVATAR-MGMT] Warping detection result:', warpingDetection);

      // Handle result based on warping detection
      if (warpingDetection.isWarped && warpingDetection.recommendation === 'revert') {
        console.log('⚠️ [AVATAR-MGMT] Severe warping detected, reverting to original');
        this.resetToOriginal();
        return {
          success: false,
          warpingDetection,
          error: 'Severe warping detected. Avatar reverted to original.',
          resetRequired: true
        };
      }

      if (warpingDetection.isWarped && warpingDetection.recommendation === 'retry') {
        console.log('🔄 [AVATAR-MGMT] Minor warping detected, attempting retry with lower strength');

        // Retry with even lower strength
        const retryParams = { ...safeParams, strength: Math.max(0.1, safeParams.strength * 0.7) };

        const retryResponse = await fetch('/api/fal/image-apps-v2/virtual-try-on', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(retryParams),
        });

        if (retryResponse.ok) {
          const retryResult = await retryResponse.json();
          const retryImageUrl = retryResult.images?.[0]?.url;

          if (retryImageUrl) {
            const retryWarpingDetection = await this.detectWarping(
              this.avatarState.originalAvatar,
              retryImageUrl
            );

            if (!retryWarpingDetection.isWarped || retryWarpingDetection.recommendation === 'accept') {
              return this.updateAvatarAfterTryOn(retryImageUrl, params.clothingImageUrl, retryWarpingDetection);
            }
          }
        }

        // If retry failed, revert
        console.log('⚠️ [AVATAR-MGMT] Retry failed, reverting to original');
        this.resetToOriginal();
        return {
          success: false,
          warpingDetection,
          error: 'Try-on retry failed. Avatar reverted to original.',
          resetRequired: true
        };
      }

      // Success case - update avatar state
      return this.updateAvatarAfterTryOn(finalImageUrl, params.clothingImageUrl, warpingDetection);

    } catch (error) {
      console.error('❌ [AVATAR-MGMT] Safe try-on failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update avatar state after successful try-on
   */
  private updateAvatarAfterTryOn(
    newAvatarUrl: string,
    clothingUrl: string,
    warpingDetection: WarpingDetectionResult
  ) {
    if (!this.avatarState) {
      throw new Error('Avatar state not initialized');
    }

    this.avatarState = {
      ...this.avatarState,
      currentAvatar: newAvatarUrl,
      clothingChanges: this.avatarState.clothingChanges + 1,
      lastClothingChange: clothingUrl,
      changeHistory: [...this.avatarState.changeHistory, newAvatarUrl],
      isWarped: warpingDetection.isWarped
    };

    this.saveAvatarState();

    console.log('✅ [AVATAR-MGMT] Avatar updated successfully:', {
      clothingChanges: this.avatarState.clothingChanges,
      maxChanges: this.MAX_CLOTHING_CHANGES,
      isWarped: this.avatarState.isWarped
    });

    return {
      success: true,
      finalImageUrl: newAvatarUrl,
      warpingDetection
    };
  }

  /**
   * Detect warping by comparing original and result images
   */
  private async detectWarping(
    originalImageUrl: string,
    resultImageUrl: string
  ): Promise<WarpingDetectionResult> {
    try {
      console.log('🔍 [AVATAR-MGMT] Analyzing images for warping...');

      // For now, implement basic heuristic detection
      // In the future, this could use computer vision APIs or ML models

      // Check if images are accessible
      const [originalResponse, resultResponse] = await Promise.all([
        fetch(originalImageUrl, { method: 'HEAD' }),
        fetch(resultImageUrl, { method: 'HEAD' })
      ]);

      if (!originalResponse.ok || !resultResponse.ok) {
        return {
          isWarped: false,
          confidence: 0,
          issues: ['Unable to access images for comparison'],
          recommendation: 'accept'
        };
      }

      // Basic warping detection logic
      // This is a simplified implementation - in production you'd want more sophisticated analysis
      const issues: string[] = [];
      let confidence = 0;

      // Check file sizes (dramatic size changes might indicate warping)
      const originalSize = parseInt(originalResponse.headers.get('content-length') || '0');
      const resultSize = parseInt(resultResponse.headers.get('content-length') || '0');

      if (originalSize > 0 && resultSize > 0) {
        const sizeDifference = Math.abs(originalSize - resultSize) / originalSize;
        if (sizeDifference > 0.5) {
          issues.push('Significant file size change detected');
          confidence += 0.3;
        }
      }

      // For now, use conservative approach - assume no warping unless we detect obvious issues
      const isWarped = confidence > 0.6;

      let recommendation: 'accept' | 'retry' | 'revert' = 'accept';
      if (isWarped) {
        recommendation = confidence > 0.8 ? 'revert' : 'retry';
      }

      return {
        isWarped,
        confidence,
        issues,
        recommendation
      };

    } catch (error) {
      console.warn('⚠️ [AVATAR-MGMT] Warping detection failed:', error);
      return {
        isWarped: false,
        confidence: 0,
        issues: ['Warping detection failed'],
        recommendation: 'accept'
      };
    }
  }

  /**
   * Get status message for UI
   */
  getStatusMessage(): string {
    if (!this.avatarState) {
      return 'Avatar not initialized';
    }

    const remaining = this.MAX_CLOTHING_CHANGES - this.avatarState.clothingChanges;

    if (remaining <= 0) {
      return '⚠️ Reset required - max changes reached';
    }

    if (this.avatarState.isWarped) {
      return '⚠️ Minor warping detected - consider reset';
    }

    return `${remaining} clothing change${remaining === 1 ? '' : 's'} remaining`;
  }

  /**
   * Check if avatar needs reset warning
   */
  needsResetWarning(): boolean {
    if (!this.avatarState) return false;
    return this.avatarState.clothingChanges >= this.MAX_CLOTHING_CHANGES - 1 || this.avatarState.isWarped === true;
  }

  /**
   * Save avatar state to localStorage
   */
  private saveAvatarState(): void {
    if (this.avatarState) {
      localStorage.setItem('avatarManagementState', JSON.stringify(this.avatarState));
    }
  }

  /**
   * Load avatar state from localStorage
   */
  loadAvatarState(): AvatarState | null {
    try {
      const saved = localStorage.getItem('avatarManagementState');
      if (saved) {
        this.avatarState = JSON.parse(saved);
        console.log('📁 [AVATAR-MGMT] Loaded avatar state from storage');
        return this.avatarState;
      }
    } catch (error) {
      console.warn('⚠️ [AVATAR-MGMT] Failed to load avatar state:', error);
    }
    return null;
  }

  /**
   * Clear all avatar state
   */
  clearAvatarState(): void {
    this.avatarState = null;
    localStorage.removeItem('avatarManagementState');
    console.log('🗑️ [AVATAR-MGMT] Avatar state cleared');
  }

  /**
   * Get clothing change progress
   */
  getChangeProgress(): { current: number; max: number; percentage: number } {
    const current = this.avatarState?.clothingChanges || 0;
    const max = this.MAX_CLOTHING_CHANGES;
    const percentage = (current / max) * 100;

    return { current, max, percentage };
  }
}

// Singleton instance
export const avatarManagementService = new AvatarManagementService();
export default avatarManagementService;