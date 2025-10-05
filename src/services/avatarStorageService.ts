/**
 * Avatar Storage Service
 * Manages persistent storage and retrieval of user avatars across sessions
 */

export interface SavedAvatar {
  id: string;
  name: string;
  imageUrl: string;
  originalPhoto?: string;
  animatedVideoUrl?: string;
  createdAt: string;
  isDefault: boolean;
  isPerfect?: boolean; // NEW: Flag for avatars generated with perfect avatar config
  metadata: {
    quality: 'low' | 'medium' | 'high';
    source: 'photo' | 'demo' | 'generated';
    dimensions?: { width: number; height: number };
    fileSize?: number;
    usedPerfectConfig?: boolean; // NEW: Track if perfect avatar config was used
  };
  tryOnHistory?: string[]; // Track clothing items tried on this avatar
}

export interface AvatarLibrary {
  savedAvatars: SavedAvatar[];
  currentAvatarId?: string;
  maxAvatars: number;
}

class AvatarStorageService {
  private readonly STORAGE_KEY = 'avatarLibrary';
  private readonly MAX_AVATARS = 3; // Limit to 3 saved avatars for user management
  private readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB limit

  /**
   * Get all saved avatars
   */
  getAvatarLibrary(): AvatarLibrary {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const library = JSON.parse(stored) as AvatarLibrary;
        console.log('📚 [AVATAR-STORAGE] Loaded avatar library:', {
          totalAvatars: library.savedAvatars.length,
          currentAvatar: library.currentAvatarId,
          defaultAvatar: library.savedAvatars.find(a => a.isDefault)?.name || 'none'
        });
        return library;
      }
    } catch (error) {
      console.error('❌ [AVATAR-STORAGE] Failed to load avatar library:', error);
    }

    // Return empty library if nothing saved or error occurred
    return {
      savedAvatars: [],
      maxAvatars: this.MAX_AVATARS
    };
  }

  /**
   * Save a new avatar to the library
   */
  saveAvatar(avatarData: any, name?: string, setAsDefault: boolean = false, isPerfect: boolean = false): SavedAvatar {
    console.log('💾 [AVATAR-STORAGE] Saving new avatar:', { name, setAsDefault, isPerfect });

    const library = this.getAvatarLibrary();

    // Generate unique ID
    const avatarId = `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if avatar was generated with perfect config
    const usedPerfectConfig = isPerfect || avatarData.metadata?.usedPerfectConfig || false;

    // Create saved avatar object
    const savedAvatar: SavedAvatar = {
      id: avatarId,
      name: name || (usedPerfectConfig ? `Perfect Avatar ${library.savedAvatars.length + 1}` : `Avatar ${library.savedAvatars.length + 1}`),
      imageUrl: avatarData.imageUrl || avatarData.processedImageUrl,
      originalPhoto: avatarData.originalPhoto,
      animatedVideoUrl: avatarData.animatedVideoUrl,
      createdAt: new Date().toISOString(),
      isDefault: setAsDefault,
      isPerfect: usedPerfectConfig,
      metadata: {
        quality: this.assessImageQuality(avatarData.imageUrl || avatarData.processedImageUrl),
        source: avatarData.metadata?.demoMode ? 'demo' : 'photo',
        dimensions: avatarData.dimensions,
        fileSize: this.estimateImageSize(avatarData.imageUrl || avatarData.processedImageUrl),
        usedPerfectConfig
      },
      tryOnHistory: []
    };

    // If setting as default, remove default flag from others
    if (setAsDefault) {
      library.savedAvatars.forEach(avatar => avatar.isDefault = false);
    }

    // Add to library
    library.savedAvatars.push(savedAvatar);
    library.currentAvatarId = avatarId;

    // Manage storage limits
    this.enforceStorageLimits(library);

    // Save to localStorage
    this.saveLibrary(library);

    console.log('✅ [AVATAR-STORAGE] Avatar saved successfully:', {
      id: avatarId,
      name: savedAvatar.name,
      isPerfect: savedAvatar.isPerfect,
      totalAvatars: library.savedAvatars.length
    });

    return savedAvatar;
  }

  /**
   * Get the default avatar (if any)
   */
  getDefaultAvatar(): SavedAvatar | null {
    const library = this.getAvatarLibrary();
    return library.savedAvatars.find(avatar => avatar.isDefault) || null;
  }

  /**
   * Get the perfect avatar (generated with perfect avatar config)
   * NEW: Prioritizes perfect avatars for best quality
   */
  getPerfectAvatar(): SavedAvatar | null {
    const library = this.getAvatarLibrary();
    // Find most recent perfect avatar
    const perfectAvatars = library.savedAvatars
      .filter(avatar => avatar.isPerfect)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const perfectAvatar = perfectAvatars[0] || null;
    if (perfectAvatar) {
      console.log('✨ [AVATAR-STORAGE] Found perfect avatar:', perfectAvatar.name);
    }
    return perfectAvatar;
  }

  /**
   * Get the best available avatar (perfect > default > current > most recent)
   * NEW: Smart avatar selection for best quality
   */
  getBestAvatar(): SavedAvatar | null {
    // Priority: Perfect > Default > Current > Most Recent
    const perfectAvatar = this.getPerfectAvatar();
    if (perfectAvatar) return perfectAvatar;

    const defaultAvatar = this.getDefaultAvatar();
    if (defaultAvatar) return defaultAvatar;

    const currentAvatar = this.getCurrentAvatar();
    if (currentAvatar) return currentAvatar;

    const library = this.getAvatarLibrary();
    if (library.savedAvatars.length > 0) {
      // Return most recent
      return library.savedAvatars.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
    }

    return null;
  }

  /**
   * Get the current avatar (last used)
   */
  getCurrentAvatar(): SavedAvatar | null {
    const library = this.getAvatarLibrary();
    if (library.currentAvatarId) {
      return library.savedAvatars.find(avatar => avatar.id === library.currentAvatarId) || null;
    }
    return null;
  }

  /**
   * Set an avatar as current (last used)
   */
  setCurrentAvatar(avatarId: string): boolean {
    const library = this.getAvatarLibrary();
    const avatar = library.savedAvatars.find(a => a.id === avatarId);

    if (avatar) {
      library.currentAvatarId = avatarId;
      this.saveLibrary(library);
      console.log('🎯 [AVATAR-STORAGE] Set current avatar:', avatar.name);
      return true;
    }

    console.error('❌ [AVATAR-STORAGE] Avatar not found:', avatarId);
    return false;
  }

  /**
   * Set an avatar as default
   */
  setDefaultAvatar(avatarId: string): boolean {
    const library = this.getAvatarLibrary();

    // Remove default flag from all avatars
    library.savedAvatars.forEach(avatar => avatar.isDefault = false);

    // Set new default
    const avatar = library.savedAvatars.find(a => a.id === avatarId);
    if (avatar) {
      avatar.isDefault = true;
      this.saveLibrary(library);
      console.log('⭐ [AVATAR-STORAGE] Set default avatar:', avatar.name);
      return true;
    }

    console.error('❌ [AVATAR-STORAGE] Avatar not found:', avatarId);
    return false;
  }

  /**
   * Delete an avatar from the library
   */
  deleteAvatar(avatarId: string): boolean {
    const library = this.getAvatarLibrary();
    const initialCount = library.savedAvatars.length;

    library.savedAvatars = library.savedAvatars.filter(avatar => avatar.id !== avatarId);

    // If we deleted the current avatar, clear current avatar ID
    if (library.currentAvatarId === avatarId) {
      library.currentAvatarId = undefined;
    }

    if (library.savedAvatars.length < initialCount) {
      this.saveLibrary(library);
      console.log('🗑️ [AVATAR-STORAGE] Avatar deleted:', avatarId);
      return true;
    }

    console.error('❌ [AVATAR-STORAGE] Avatar not found for deletion:', avatarId);
    return false;
  }

  /**
   * Update avatar name
   */
  updateAvatarName(avatarId: string, newName: string): boolean {
    const library = this.getAvatarLibrary();
    const avatar = library.savedAvatars.find(a => a.id === avatarId);

    if (avatar) {
      avatar.name = newName;
      this.saveLibrary(library);
      console.log('✏️ [AVATAR-STORAGE] Avatar renamed:', { id: avatarId, newName });
      return true;
    }

    console.error('❌ [AVATAR-STORAGE] Avatar not found for rename:', avatarId);
    return false;
  }

  /**
   * Add clothing try-on to avatar history
   */
  addTryOnHistory(avatarId: string, clothingUrl: string): void {
    const library = this.getAvatarLibrary();
    const avatar = library.savedAvatars.find(a => a.id === avatarId);

    if (avatar) {
      if (!avatar.tryOnHistory) {
        avatar.tryOnHistory = [];
      }

      // Add to beginning of history, limit to 10 items
      avatar.tryOnHistory.unshift(clothingUrl);
      avatar.tryOnHistory = avatar.tryOnHistory.slice(0, 10);

      this.saveLibrary(library);
      console.log('👕 [AVATAR-STORAGE] Added try-on to history:', avatarId);
    }
  }

  /**
   * Check if avatars exist
   */
  hasAvatars(): boolean {
    const library = this.getAvatarLibrary();
    return library.savedAvatars.length > 0;
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): { avatarCount: number; estimatedSize: number; maxSize: number } {
    const library = this.getAvatarLibrary();
    const estimatedSize = this.estimateLibrarySize(library);

    return {
      avatarCount: library.savedAvatars.length,
      estimatedSize,
      maxSize: this.MAX_STORAGE_SIZE
    };
  }

  /**
   * Clear all saved avatars
   */
  clearAllAvatars(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ [AVATAR-STORAGE] All avatars cleared');
  }

  /**
   * Export avatars as JSON (for backup)
   */
  exportAvatars(): string {
    const library = this.getAvatarLibrary();
    return JSON.stringify(library, null, 2);
  }

  /**
   * Import avatars from JSON (for restore)
   */
  importAvatars(jsonData: string): boolean {
    try {
      const library = JSON.parse(jsonData) as AvatarLibrary;

      // Validate structure
      if (!library.savedAvatars || !Array.isArray(library.savedAvatars)) {
        throw new Error('Invalid avatar library format');
      }

      this.saveLibrary(library);
      console.log('📥 [AVATAR-STORAGE] Avatars imported successfully:', library.savedAvatars.length);
      return true;
    } catch (error) {
      console.error('❌ [AVATAR-STORAGE] Import failed:', error);
      return false;
    }
  }

  // Private helper methods

  private saveLibrary(library: AvatarLibrary): void {
    try {
      const jsonString = JSON.stringify(library);
      localStorage.setItem(this.STORAGE_KEY, jsonString);
    } catch (error) {
      console.error('❌ [AVATAR-STORAGE] Failed to save library:', error);

      // If storage is full, try to free space
      if (error instanceof DOMException && error.code === DOMException.QUOTA_EXCEEDED_ERR) {
        console.log('💾 [AVATAR-STORAGE] Storage quota exceeded, cleaning up...');
        this.cleanupOldAvatars(library);

        // Try saving again
        try {
          const jsonString = JSON.stringify(library);
          localStorage.setItem(this.STORAGE_KEY, jsonString);
        } catch (retryError) {
          console.error('❌ [AVATAR-STORAGE] Failed to save even after cleanup:', retryError);
        }
      }
    }
  }

  private enforceStorageLimits(library: AvatarLibrary): void {
    // Remove excess avatars (keep most recent)
    if (library.savedAvatars.length > this.MAX_AVATARS) {
      // Sort by creation date, keep newest
      library.savedAvatars.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      library.savedAvatars = library.savedAvatars.slice(0, this.MAX_AVATARS);
      console.log('📦 [AVATAR-STORAGE] Enforced avatar count limit');
    }

    // Check size limits
    const estimatedSize = this.estimateLibrarySize(library);
    if (estimatedSize > this.MAX_STORAGE_SIZE) {
      this.cleanupOldAvatars(library);
    }
  }

  private cleanupOldAvatars(library: AvatarLibrary): void {
    // Remove oldest non-default avatars first
    const nonDefaultAvatars = library.savedAvatars.filter(a => !a.isDefault);
    nonDefaultAvatars.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Remove oldest 25% of non-default avatars
    const toRemove = Math.max(1, Math.floor(nonDefaultAvatars.length * 0.25));
    const idsToRemove = nonDefaultAvatars.slice(0, toRemove).map(a => a.id);

    library.savedAvatars = library.savedAvatars.filter(a => !idsToRemove.includes(a.id));
    console.log(`🧹 [AVATAR-STORAGE] Cleaned up ${toRemove} old avatars`);
  }

  private assessImageQuality(imageUrl: string): 'low' | 'medium' | 'high' {
    if (!imageUrl) return 'low';

    // Estimate quality based on data size
    const sizeKB = this.estimateImageSize(imageUrl) / 1024;

    if (sizeKB > 1000) return 'high';
    if (sizeKB > 500) return 'medium';
    return 'low';
  }

  private estimateImageSize(imageUrl: string): number {
    if (!imageUrl || !imageUrl.startsWith('data:')) return 0;

    // Base64 encoded images: every 4 characters represent 3 bytes
    const base64Data = imageUrl.split(',')[1] || '';
    return Math.floor(base64Data.length * 0.75);
  }

  private estimateLibrarySize(library: AvatarLibrary): number {
    return library.savedAvatars.reduce((total, avatar) => {
      let size = this.estimateImageSize(avatar.imageUrl);
      if (avatar.originalPhoto) {
        size += this.estimateImageSize(avatar.originalPhoto);
      }
      if (avatar.animatedVideoUrl) {
        size += this.estimateImageSize(avatar.animatedVideoUrl);
      }
      return total + size;
    }, 0);
  }
}

export default new AvatarStorageService();