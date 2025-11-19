/**
 * Saved Advice Service
 * Bookmark and manage favorite fashion advice
 */

import { supabase } from './supabaseClient';
import authService from './authService';

export interface SavedAdvice {
  id: string;
  user_id: string;
  conversation_id: string | null;
  advice_content: string;
  tags: string[];
  notes: string | null;
  created_at: string;
}

class SavedAdviceService {
  
  /**
   * Save advice as favorite
   */
  async saveAdvice(
    content: string,
    conversationId?: string,
    tags?: string[]
  ): Promise<string | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        console.error('❌ [SAVED-ADVICE] No user logged in');
        return null;
      }

      const { data, error } = await supabase
        .from('stylist_saved_advice')
        .insert([{
          user_id: user.id,
          conversation_id: conversationId || null,
          advice_content: content,
          tags: tags || []
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [SAVED-ADVICE] Advice saved:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ [SAVED-ADVICE] Error saving advice:', error);
      return null;
    }
  }

  /**
   * Get all saved advice for current user
   */
  async getSavedAdvice(): Promise<SavedAdvice[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('stylist_saved_advice')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`✅ [SAVED-ADVICE] Loaded ${data?.length || 0} saved items`);
      return data || [];
    } catch (error) {
      console.error('❌ [SAVED-ADVICE] Error loading advice:', error);
      return [];
    }
  }

  /**
   * Delete saved advice
   */
  async deleteSavedAdvice(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stylist_saved_advice')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ [SAVED-ADVICE] Advice deleted');
      return true;
    } catch (error) {
      console.error('❌ [SAVED-ADVICE] Error deleting advice:', error);
      return false;
    }
  }

  /**
   * Update notes for saved advice
   */
  async updateNotes(id: string, notes: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stylist_saved_advice')
        .update({ notes })
        .eq('id', id);

      if (error) throw error;

      console.log('✅ [SAVED-ADVICE] Notes updated');
      return true;
    } catch (error) {
      console.error('❌ [SAVED-ADVICE] Error updating notes:', error);
      return false;
    }
  }

  /**
   * Update tags for saved advice
   */
  async updateTags(id: string, tags: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stylist_saved_advice')
        .update({ tags })
        .eq('id', id);

      if (error) throw error;

      console.log('✅ [SAVED-ADVICE] Tags updated');
      return true;
    } catch (error) {
      console.error('❌ [SAVED-ADVICE] Error updating tags:', error);
      return false;
    }
  }

  /**
   * Search saved advice by tags or content
   */
  async searchAdvice(query: string): Promise<SavedAdvice[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('stylist_saved_advice')
        .select('*')
        .eq('user_id', user.id)
        .ilike('advice_content', `%${query}%`);

      if (error) throw error;

      console.log(`✅ [SAVED-ADVICE] Found ${data?.length || 0} results`);
      return data || [];
    } catch (error) {
      console.error('❌ [SAVED-ADVICE] Error searching advice:', error);
      return [];
    }
  }
}

export default new SavedAdviceService();
