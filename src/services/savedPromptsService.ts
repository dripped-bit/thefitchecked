/**
 * Saved Prompts Service
 * Manages storage and retrieval of successful avatar generation prompts
 */

export interface SavedAvatarPrompt {
  id: string;
  timestamp: string;
  name: string;
  prompt: string;
  negativePrompt: string;
  parameters: {
    num_inference_steps: number;
    guidance_scale: number;
    strength: number;
    image_size: { width: number; height: number };
    seed?: number;
  };
  quality: 'FAST' | 'OPTIMAL' | 'ULTRA';
  notes?: string;
  resultImageUrl?: string; // Optional: store the generated avatar image
  rating?: number; // 1-5 stars for how good the result was
}

const STORAGE_KEY = 'fitChecked_savedAvatarPrompts';

class SavedPromptsService {
  /**
   * Get all saved prompts
   */
  getAllPrompts(): SavedAvatarPrompt[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load saved prompts:', error);
      return [];
    }
  }

  /**
   * Save a new prompt
   */
  savePrompt(promptData: Omit<SavedAvatarPrompt, 'id' | 'timestamp'>): SavedAvatarPrompt {
    const newPrompt: SavedAvatarPrompt = {
      ...promptData,
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    const allPrompts = this.getAllPrompts();
    allPrompts.unshift(newPrompt); // Add to beginning

    // Keep only last 50 prompts to avoid storage bloat
    const trimmedPrompts = allPrompts.slice(0, 50);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedPrompts));
      console.log('✅ [SAVED-PROMPTS] Prompt saved:', newPrompt.name);
      return newPrompt;
    } catch (error) {
      console.error('❌ [SAVED-PROMPTS] Failed to save prompt:', error);
      throw new Error('Unable to save prompt');
    }
  }

  /**
   * Get a specific prompt by ID
   */
  getPromptById(id: string): SavedAvatarPrompt | null {
    const allPrompts = this.getAllPrompts();
    return allPrompts.find(p => p.id === id) || null;
  }

  /**
   * Update an existing prompt
   */
  updatePrompt(id: string, updates: Partial<SavedAvatarPrompt>): boolean {
    try {
      const allPrompts = this.getAllPrompts();
      const index = allPrompts.findIndex(p => p.id === id);

      if (index === -1) {
        return false;
      }

      allPrompts[index] = {
        ...allPrompts[index],
        ...updates,
        id: allPrompts[index].id, // Preserve ID
        timestamp: allPrompts[index].timestamp // Preserve timestamp
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allPrompts));
      console.log('✅ [SAVED-PROMPTS] Prompt updated:', id);
      return true;
    } catch (error) {
      console.error('❌ [SAVED-PROMPTS] Failed to update prompt:', error);
      return false;
    }
  }

  /**
   * Delete a prompt
   */
  deletePrompt(id: string): boolean {
    try {
      const allPrompts = this.getAllPrompts();
      const filtered = allPrompts.filter(p => p.id !== id);

      if (filtered.length === allPrompts.length) {
        return false; // No prompt was deleted
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log('🗑️ [SAVED-PROMPTS] Prompt deleted:', id);
      return true;
    } catch (error) {
      console.error('❌ [SAVED-PROMPTS] Failed to delete prompt:', error);
      return false;
    }
  }

  /**
   * Get prompts sorted by rating (highest first)
   */
  getTopRatedPrompts(limit: number = 10): SavedAvatarPrompt[] {
    const allPrompts = this.getAllPrompts();
    return allPrompts
      .filter(p => p.rating !== undefined)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }

  /**
   * Get recent prompts
   */
  getRecentPrompts(limit: number = 10): SavedAvatarPrompt[] {
    const allPrompts = this.getAllPrompts();
    return allPrompts.slice(0, limit);
  }

  /**
   * Export all prompts as JSON
   */
  exportPrompts(): string {
    const allPrompts = this.getAllPrompts();
    return JSON.stringify(allPrompts, null, 2);
  }

  /**
   * Import prompts from JSON
   */
  importPrompts(jsonData: string): boolean {
    try {
      const importedPrompts = JSON.parse(jsonData);
      if (!Array.isArray(importedPrompts)) {
        throw new Error('Invalid format: expected array');
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(importedPrompts));
      console.log('📥 [SAVED-PROMPTS] Prompts imported:', importedPrompts.length);
      return true;
    } catch (error) {
      console.error('❌ [SAVED-PROMPTS] Failed to import prompts:', error);
      return false;
    }
  }

  /**
   * Clear all saved prompts
   */
  clearAllPrompts(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🧹 [SAVED-PROMPTS] All prompts cleared');
      return true;
    } catch (error) {
      console.error('❌ [SAVED-PROMPTS] Failed to clear prompts:', error);
      return false;
    }
  }

  /**
   * Get statistics about saved prompts
   */
  getStats() {
    const allPrompts = this.getAllPrompts();
    const ratedPrompts = allPrompts.filter(p => p.rating !== undefined);

    return {
      totalPrompts: allPrompts.length,
      ratedPrompts: ratedPrompts.length,
      averageRating: ratedPrompts.length > 0
        ? ratedPrompts.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedPrompts.length
        : 0,
      qualityBreakdown: {
        FAST: allPrompts.filter(p => p.quality === 'FAST').length,
        OPTIMAL: allPrompts.filter(p => p.quality === 'OPTIMAL').length,
        ULTRA: allPrompts.filter(p => p.quality === 'ULTRA').length
      }
    };
  }
}

// Export singleton instance
export const savedPromptsService = new SavedPromptsService();
export default savedPromptsService;
