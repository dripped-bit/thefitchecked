/**
 * Fashion Stylist Service
 * AI-powered fashion advice using OpenAI GPT-4o, Claude Vision, and SerpAPI
 */

import { getChatGPTResponse } from '../lib/openai';
import { supabase } from './supabaseClient';
import authService from './authService';

export interface StylistMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  timestamp: Date;
}

export interface StylistResponse {
  message: string;
  suggestions?: string[];
  error?: string;
}

const STYLIST_SYSTEM_PROMPT = `
You are a professional fashion stylist and personal shopper with expertise in:
- Outfit coordination and color theory
- Current fashion trends and timeless style
- Seasonal dressing and occasion-appropriate attire
- Wardrobe building and capsule collections
- Body types and flattering fits
- Sustainable fashion and quality brands

Your role:
- Provide personalized, actionable fashion advice
- Work with what the user already owns
- Suggest specific outfits and styling tips
- Be encouraging and boost user's confidence
- Consider budget, lifestyle, and preferences

Communication style:
- Friendly and enthusiastic but professional
- Clear and concise (under 200 words unless asked for more)
- Use emojis sparingly (only for outfit suggestions)
- Always explain your reasoning
`;

class FashionStylistService {
  private conversationHistory: StylistMessage[] = [];
  
  /**
   * Main method: Ask fashion advice with optional images
   */
  async askStylist(
    question: string,
    images?: string[]
  ): Promise<StylistResponse> {
    console.log('💬 [STYLIST] Processing question:', question);
    
    try {
      // 1. Get user's closet context
      const closetContext = await this.getUserClosetContext();
      
      // 2. Analyze images if provided (future: Claude Vision)
      let imageAnalysis = '';
      if (images && images.length > 0) {
        imageAnalysis = `User provided ${images.length} image(s) for styling advice.`;
      }
      
      // 3. Build comprehensive prompt
      const prompt = this.buildStylistPrompt({
        question,
        closetContext,
        imageAnalysis,
        history: this.conversationHistory.slice(-4) // Last 4 messages for context
      });
      
      // 4. Get response from OpenAI
      const response = await getChatGPTResponse(prompt, {
        model: 'gpt-4o',
        temperature: 0.8,
        maxTokens: 1500,
        systemMessage: STYLIST_SYSTEM_PROMPT
      });
      
      // 5. Update conversation history
      this.conversationHistory.push({
        role: 'user',
        content: question,
        images,
        timestamp: new Date()
      });
      
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });
      
      // 6. Generate follow-up suggestions
      const suggestions = this.generateSuggestions(question, response);
      
      console.log('✅ [STYLIST] Response generated');
      
      return {
        message: response,
        suggestions
      };
      
    } catch (error: any) {
      console.error('❌ [STYLIST] Error:', error.message);
      return {
        message: "I'm having trouble connecting right now. Please try again!",
        error: error.message
      };
    }
  }
  
  /**
   * Get user's closet items for context
   */
  private async getUserClosetContext(): Promise<string> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return 'No closet data available.';
      
      const { data: items } = await supabase
        .from('wardrobe_items')
        .select('name, category, color, brand, times_worn, subcategory')
        .eq('user_id', user.id)
        .order('times_worn', { ascending: false })
        .limit(30);
      
      if (!items || items.length === 0) {
        return 'User has an empty closet. Suggest building a versatile wardrobe.';
      }
      
      // Summarize by category
      const byCategory: Record<string, any[]> = {};
      items.forEach(item => {
        const cat = item.category || 'other';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(item);
      });
      
      let summary = `User's Closet (${items.length} items):\n\n`;
      
      for (const [category, categoryItems] of Object.entries(byCategory)) {
        summary += `${category.toUpperCase()} (${categoryItems.length}):\n`;
        categoryItems.slice(0, 5).forEach(item => {
          summary += `  - ${item.name}`;
          if (item.color) summary += ` (${item.color})`;
          if (item.brand) summary += ` - ${item.brand}`;
          if (item.times_worn > 0) summary += ` [worn ${item.times_worn}x]`;
          summary += '\n';
        });
        if (categoryItems.length > 5) {
          summary += `  ... and ${categoryItems.length - 5} more\n`;
        }
        summary += '\n';
      }
      
      return summary.trim();
      
    } catch (error) {
      console.error('❌ [STYLIST] Error fetching closet:', error);
      return 'Unable to access closet data.';
    }
  }
  
  /**
   * Build comprehensive prompt for OpenAI
   */
  private buildStylistPrompt(context: {
    question: string;
    closetContext: string;
    imageAnalysis: string;
    history: StylistMessage[];
  }): string {
    let prompt = '';
    
    // Add conversation history if exists
    if (context.history.length > 0) {
      prompt += 'CONVERSATION HISTORY:\n';
      context.history.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Stylist'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }
    
    prompt += `CURRENT QUESTION:\n${context.question}\n\n`;
    
    if (context.imageAnalysis) {
      prompt += `IMAGE CONTEXT:\n${context.imageAnalysis}\n\n`;
    }
    
    prompt += `USER'S CLOSET:\n${context.closetContext}\n\n`;
    
    prompt += `
Provide helpful, personalized fashion advice. Be specific about:
- Outfit combinations from user's existing closet
- Styling tips and techniques
- What might be missing or needed
- Color coordination
- Occasion appropriateness

Keep response conversational and under 200 words unless detailed explanation needed.
Use formatting (bullets, emojis) to make advice easy to scan.
    `.trim();
    
    return prompt;
  }
  
  /**
   * Generate follow-up suggestions based on conversation
   */
  private generateSuggestions(question: string, response: string): string[] {
    const lowerQuestion = question.toLowerCase();
    const suggestions: string[] = [];
    
    // Context-aware suggestions
    if (lowerQuestion.includes('wedding') || lowerQuestion.includes('formal')) {
      suggestions.push('What accessories should I add?');
      suggestions.push('Show me similar formal looks');
    } else if (lowerQuestion.includes('casual') || lowerQuestion.includes('everyday')) {
      suggestions.push('Give me 3 more casual outfits');
      suggestions.push('What shoes work best?');
    } else if (lowerQuestion.includes('pack') || lowerQuestion.includes('trip')) {
      suggestions.push('How do I maximize suitcase space?');
      suggestions.push('What else should I pack?');
    } else if (lowerQuestion.includes('style') || lowerQuestion.includes('wear')) {
      suggestions.push('Show me another way to style this');
      suggestions.push('What is missing in my closet?');
    } else {
      // Default suggestions
      suggestions.push('What should I wear today?');
      suggestions.push('Help me build a capsule wardrobe');
    }
    
    return suggestions;
  }
  
  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    console.log('🧹 [STYLIST] Conversation history cleared');
  }
  
  /**
   * Get conversation history
   */
  getHistory(): StylistMessage[] {
    return [...this.conversationHistory];
  }
}

export default new FashionStylistService();
