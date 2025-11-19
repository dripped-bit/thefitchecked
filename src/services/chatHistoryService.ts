/**
 * Chat History Service
 * Manages stylist conversation persistence
 */

import { supabase } from './supabaseClient';
import authService from './authService';
import { StylistMessage } from './fashionStylistService';

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: StylistMessage[];
}

class ChatHistoryService {
  
  /**
   * Create a new conversation
   */
  async createConversation(title?: string): Promise<string | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        console.error('❌ [CHAT-HISTORY] No user logged in');
        return null;
      }

      const { data, error } = await supabase
        .from('stylist_conversations')
        .insert([{
          user_id: user.id,
          title: title || 'New Conversation'
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [CHAT-HISTORY] Conversation created:', data.id);
      return data.id;
    } catch (error) {
      console.error('❌ [CHAT-HISTORY] Error creating conversation:', error);
      return null;
    }
  }

  /**
   * Save a message to conversation
   */
  async saveMessage(
    conversationId: string,
    message: StylistMessage
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stylist_messages')
        .insert([{
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          images: message.images || null
        }]);

      if (error) throw error;

      console.log('✅ [CHAT-HISTORY] Message saved');
      return true;
    } catch (error) {
      console.error('❌ [CHAT-HISTORY] Error saving message:', error);
      return false;
    }
  }

  /**
   * Get all conversations for current user
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('stylist_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      console.log(`✅ [CHAT-HISTORY] Loaded ${data?.length || 0} conversations`);
      return data || [];
    } catch (error) {
      console.error('❌ [CHAT-HISTORY] Error loading conversations:', error);
      return [];
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<StylistMessage[]> {
    try {
      const { data, error } = await supabase
        .from('stylist_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messages: StylistMessage[] = (data || []).map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        images: msg.images || undefined,
        timestamp: new Date(msg.created_at)
      }));

      console.log(`✅ [CHAT-HISTORY] Loaded ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('❌ [CHAT-HISTORY] Error loading messages:', error);
      return [];
    }
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stylist_conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) throw error;

      console.log('✅ [CHAT-HISTORY] Title updated');
      return true;
    } catch (error) {
      console.error('❌ [CHAT-HISTORY] Error updating title:', error);
      return false;
    }
  }

  /**
   * Delete a conversation (and all its messages)
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stylist_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      console.log('✅ [CHAT-HISTORY] Conversation deleted');
      return true;
    } catch (error) {
      console.error('❌ [CHAT-HISTORY] Error deleting conversation:', error);
      return false;
    }
  }

  /**
   * Generate smart title from first message
   */
  generateTitle(firstMessage: string): string {
    const maxLength = 50;
    
    if (firstMessage.length <= maxLength) {
      return firstMessage;
    }
    
    // Truncate and add ellipsis
    return firstMessage.substring(0, maxLength).trim() + '...';
  }
}

export default new ChatHistoryService();
