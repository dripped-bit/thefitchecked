/**
 * Fashion Stylist Service
 * AI-powered fashion advice using OpenAI GPT-4o, Claude Vision, and User Context
 * Now with COMPREHENSIVE user data integration - closet, preferences, analytics, wishlist, trips
 */

import { getChatGPTResponse } from '../lib/openai';
import { supabase } from './supabaseClient';
import authService from './authService';
import claudeClosetAnalyzer, { ComprehensiveUserProfile } from './claudeClosetAnalyzer';
import claudeVisionStylistService from './claudeVisionStylistService';
import fashionWebSearchService from './fashionWebSearchService';
import userContextAggregatorService, { UserContext } from './userContextAggregatorService';

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

const COMPREHENSIVE_STYLIST_PROMPT = `
You are an expert AI Fashion Stylist for TheFitChecked, a personal wardrobe management app. Your role is to provide highly personalized, actionable fashion advice by leveraging the user's complete fashion profile.

## AVAILABLE USER DATA YOU HAVE ACCESS TO:

### 1. CLOSET INVENTORY
- Complete wardrobe with photos, categories, colors, brands, styles, and tags
- Item conditions, purchase dates, and wear frequency
- Season and occasion tags for each piece

### 2. STYLE PREFERENCES
- Gender identity and preferred style aesthetic
- Preferred colors, patterns, and silhouettes
- Comfort level preferences (casual, formal, etc.)
- Body type and fit preferences
- Style inspirations and fashion goals

### 3. ANALYTICS DATA
- Most worn items and outfit combinations
- Least worn items (suggest styling ideas for these)
- Favorite brands and store preferences
- Color palette analysis from their wardrobe
- Cost per wear analytics

### 4. WISHLIST & SHOPPING DATA
- Items they're considering purchasing
- Price tracking and deal alerts
- Shopping preferences and budget ranges

### 5. TRIP & CALENDAR DATA
- Upcoming trips with packing needs
- Destination weather forecasts
- Past outfit history for similar events

## YOUR CORE CAPABILITIES:

**When User Uploads a Photo:**
1. Identify items shown
2. Ask: "Would you like outfit ideas from your closet, or should I search online for styling inspiration?"
3. Ask: "What's the occasion - casual everyday, work, date night, special event?"

**Styling Specific Items:**
- Reference their ACTUAL closet items by name/brand
- Match their style preferences
- Consider the item's color and suggest complementary pieces they own
- Mention if they've worn similar combinations before

**Outfit Critiques:**
- Compliment what's working
- Suggest tweaks using items they own
- Reference fashion principles (proportions, color theory)

## RESPONSE GUIDELINES:

**Tone:**
- Friendly, encouraging, enthusiastic (like a supportive friend who loves fashion)
- Honest but never harsh
- Knowledgeable without being pretentious
- Adapt to user's communication style

**Structure:**
- Start with immediate, actionable advice
- Use their actual item names/descriptions from closet
- Provide reasoning for suggestions
- Offer 2-3 options when possible
- End with a follow-up question

**Personalization Markers:**
- "Based on your love of [brand/style from their data]..."
- "I notice you wear [item] often, so..."
- "Since you prefer [style preference]..."
- "Looking at your closet, you have..."
- "Your analytics show you feel great in..."

**Format Outfit Suggestions Like:**
"✨ Outfit Option 1: [Occasion/Vibe]
- Top: [Their specific item with brand if known]
- Bottom: [Their specific item]
- Shoes: [Their specific item]
- Accessories: [Their specific items]
*Why this works: [Brief reasoning based on style principles]*"

## KEY RULES:

✅ Always reference user's ACTUAL closet items by name
✅ Consider their gender identity and style preferences
✅ Use analytics to inform suggestions
✅ Mention upcoming trips/events when relevant
✅ Check wishlist before suggesting new purchases
✅ Celebrate all body types and personal style choices
✅ Focus on how they FEEL, not arbitrary rules

❌ Don't suggest buying items when they have suitable options in closet
❌ Don't reference trends that clash with their aesthetic
❌ Don't ignore their analytics data
❌ Don't make assumptions without data
❌ Don't shame past outfit choices

Remember: You're not giving generic fashion advice - you're a personal stylist who KNOWS this user's wardrobe, preferences, lifestyle, and style evolution!
`;

class FashionStylistService {
  private conversationHistory: StylistMessage[] = [];
  
  /**
   * Main method: Ask fashion advice with optional images
   * NOW WITH COMPREHENSIVE USER CONTEXT!
   */
  async askStylist(
    question: string,
    images?: string[]
  ): Promise<StylistResponse> {
    console.log('💬 [STYLIST] Processing question with FULL context:', question);
    
    try {
      // 1. Gather COMPLETE user context (closet, preferences, analytics, wishlist, trips)
      console.log('📦 [STYLIST] Gathering complete user context...');
      const fullContext = await userContextAggregatorService.gatherAllData();
      
      // 2. Let Claude deeply analyze everything
      console.log('🔍 [STYLIST] Claude analyzing user profile...');
      const userProfile = await claudeClosetAnalyzer.analyzeUserProfile(fullContext);
      
      // 3. Analyze uploaded images if present
      let imageAnalysis = '';
      if (images && images.length > 0) {
        console.log(`📸 [STYLIST] Analyzing ${images.length} image(s) with Claude Vision...`);
        try {
          const visionAnalysis = await claudeVisionStylistService.analyzeMultipleImages(images);
          imageAnalysis = `
IMAGE ANALYSIS:
Items: ${visionAnalysis.items.join(', ')}
Colors: ${visionAnalysis.colors.join(', ')}
Style: ${visionAnalysis.style}
Occasion: ${visionAnalysis.occasion}
Suggestions: ${visionAnalysis.suggestions.join('; ')}
          `.trim();
          console.log('✅ [STYLIST] Image analysis complete');
        } catch (error) {
          console.error('❌ [STYLIST] Vision analysis failed:', error);
          imageAnalysis = `User provided ${images.length} image(s) for styling advice.`;
        }
      }
      
      // 4. Search web for relevant fashion trends (if applicable)
      let webResults = '';
      if (fashionWebSearchService.shouldSearchWeb(question)) {
        console.log('🌐 [STYLIST] Searching web for fashion trends...');
        try {
          const keywords = fashionWebSearchService.extractKeywords(question);
          if (keywords) {
            const searchResults = await fashionWebSearchService.searchFashionAdvice(keywords);
            if (searchResults.length > 0) {
              webResults = `
CURRENT FASHION TRENDS:
${searchResults.slice(0, 3).map(r => `• ${r.title}: ${r.snippet}`).join('\n')}
              `.trim();
              console.log('✅ [STYLIST] Web search complete');
            }
          }
        } catch (error) {
          console.error('❌ [STYLIST] Web search failed:', error);
        }
      }
      
      // 5. Build comprehensive prompt with ALL data
      const prompt = this.buildEnhancedPrompt({
        question,
        userProfile,
        fullContext,
        imageAnalysis,
        webResults,
        history: this.conversationHistory.slice(-4) // Last 4 messages for context
      });
      
      // 6. Get personalized response from GPT-4o
      const response = await getChatGPTResponse(prompt, {
        model: 'gpt-4o',
        temperature: 0.8,
        maxTokens: 1500,
        systemMessage: COMPREHENSIVE_STYLIST_PROMPT // New comprehensive prompt!
      });
      
      // 7. Update conversation history
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
      
      // 8. Generate follow-up suggestions
      const suggestions = this.generateSuggestions(question, response);
      
      console.log('✅ [STYLIST] Personalized response generated with full context!');
      
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
   * Build ENHANCED comprehensive prompt with complete user profile
   */
  private buildEnhancedPrompt(context: {
    question: string;
    userProfile: ComprehensiveUserProfile;
    fullContext: UserContext;
    imageAnalysis: string;
    webResults?: string;
    history: StylistMessage[];
  }): string {
    let prompt = '';
    
    // Add conversation history if exists
    if (context.history.length > 0) {
      prompt += '=== CONVERSATION HISTORY ===\n';
      context.history.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Stylist'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }
    
    prompt += '=== USER\'S COMPLETE FASHION PROFILE ===\n\n';
    
    // CLOSET INVENTORY
    prompt += '## CLOSET INVENTORY:\n';
    prompt += `- Total Items: ${context.fullContext.closet.totalItems}\n`;
    
    if (context.fullContext.closet.totalItems > 0) {
      const categories = Object.entries(context.fullContext.closet.byCategory);
      prompt += `- Categories: ${categories.map(([cat, items]) => `${cat} (${items.length})`).join(', ')}\n`;
      
      if (context.fullContext.closet.favoriteItems.length > 0) {
        prompt += `\nFavorite Items:\n`;
        context.fullContext.closet.favoriteItems.slice(0, 5).forEach(item => {
          const desc = [item.name];
          if (item.brand) desc.push(`by ${item.brand}`);
          if (item.color) desc.push(item.color);
          if (item.times_worn > 0) desc.push(`(worn ${item.times_worn}x)`);
          prompt += `  - ${desc.join(' ')}\n`;
        });
      }
      
      if (context.fullContext.closet.recentlyAdded.length > 0) {
        prompt += `\nRecently Added:\n`;
        context.fullContext.closet.recentlyAdded.slice(0, 3).forEach(item => {
          prompt += `  - ${item.name}${item.brand ? ` by ${item.brand}` : ''}\n`;
        });
      }
    }
    
    // STYLE PREFERENCES
    if (context.fullContext.stylePreferences) {
      const prefs = context.fullContext.stylePreferences;
      prompt += '\n## STYLE PREFERENCES:\n';
      
      if (prefs.sizes?.gender) prompt += `- Gender: ${prefs.sizes.gender}\n`;
      if (prefs.fashionPersonality?.archetypes?.length) {
        prompt += `- Style Archetypes: ${prefs.fashionPersonality.archetypes.join(', ')}\n`;
      }
      if (prefs.fashionPersonality?.colorPalette?.length) {
        prompt += `- Preferred Colors: ${prefs.fashionPersonality.colorPalette.join(', ')}\n`;
      }
      if (prefs.fashionPersonality?.avoidColors?.length) {
        prompt += `- Avoid Colors: ${prefs.fashionPersonality.avoidColors.join(', ')}\n`;
      }
      if (prefs.shopping?.favoriteStores?.length) {
        prompt += `- Favorite Stores: ${prefs.shopping.favoriteStores.slice(0, 3).join(', ')}\n`;
      }
    }
    
    // ANALYTICS INSIGHTS
    if (context.fullContext.analytics) {
      const analytics = context.fullContext.analytics;
      prompt += '\n## ANALYTICS INSIGHTS:\n';
      prompt += `- Total Wardrobe Value: $${analytics.totalValue.toFixed(2)}\n`;
      
      if (analytics.bestValueItems?.length) {
        prompt += `\nBest Value Items (Most Worn):\n`;
        analytics.bestValueItems.slice(0, 3).forEach(item => {
          prompt += `  - ${item.name}: $${item.costPerWear.toFixed(2)}/wear (worn ${item.timesWorn}x)\n`;
        });
      }
      
      if (analytics.unwornItems && analytics.unwornItems > 0) {
        prompt += `\nUnworn Items: ${analytics.unwornItems} items ($${analytics.unwornValue?.toFixed(2) || '0'} value) - SUGGEST STYLING THESE!\n`;
      }
      
      if (analytics.colors?.length) {
        prompt += `\nColor Palette: ${analytics.colors.slice(0, 5).map(c => c.color).join(', ')}\n`;
      }
    }
    
    // WISHLIST
    if (context.fullContext.wishlist.items.length > 0) {
      prompt += '\n## WISHLIST:\n';
      prompt += `- Total Items: ${context.fullContext.wishlist.items.length}\n`;
      prompt += `- Total Value: $${context.fullContext.wishlist.totalValue.toFixed(2)}\n`;
      
      const wishlistSample = context.fullContext.wishlist.items.slice(0, 3);
      if (wishlistSample.length > 0) {
        prompt += `\nTop Wishlist Items:\n`;
        wishlistSample.forEach(item => {
          prompt += `  - ${item.name}${item.brand ? ` by ${item.brand}` : ''} (${item.price})\n`;
        });
      }
    }
    
    // UPCOMING TRIPS
    if (context.fullContext.trips.upcoming.length > 0) {
      prompt += '\n## UPCOMING TRIPS:\n';
      context.fullContext.trips.upcoming.forEach(trip => {
        prompt += `- ${trip.destination} (${trip.start_date} to ${trip.end_date})`;
        if (trip.trip_type) prompt += ` - ${trip.trip_type}`;
        prompt += '\n';
      });
    }
    
    // CLAUDE'S ANALYSIS
    prompt += '\n## CLAUDE\'S WARDROBE ANALYSIS:\n';
    prompt += `${context.userProfile.wardrobeOverview}\n\n`;
    prompt += `Style Profile: ${context.userProfile.styleProfile}\n`;
    
    if (context.userProfile.strengths.length > 0) {
      prompt += `\nWardrobe Strengths:\n`;
      context.userProfile.strengths.forEach(s => prompt += `  - ${s}\n`);
    }
    
    if (context.userProfile.gaps.length > 0) {
      prompt += `\nWardrobe Gaps:\n`;
      context.userProfile.gaps.forEach(g => prompt += `  - ${g}\n`);
    }
    
    if (context.userProfile.mostVersatilePieces.length > 0) {
      prompt += `\nMost Versatile Pieces:\n`;
      context.userProfile.mostVersatilePieces.forEach(p => prompt += `  - ${p}\n`);
    }
    
    if (context.userProfile.underutilizedItems.length > 0) {
      prompt += `\nUnderutilized Items (Suggest styling these!):\n`;
      context.userProfile.underutilizedItems.forEach(u => prompt += `  - ${u}\n`);
    }
    
    if (context.userProfile.shoppingInsights) {
      prompt += `\nShopping Insights: ${context.userProfile.shoppingInsights}\n`;
    }
    
    if (context.userProfile.upcomingNeeds) {
      prompt += `\nUpcoming Needs: ${context.userProfile.upcomingNeeds}\n`;
    }
    
    // CURRENT QUESTION
    prompt += '\n\n=== CURRENT QUESTION ===\n';
    prompt += `${context.question}\n`;
    
    // UPLOADED PHOTOS
    if (context.imageAnalysis) {
      prompt += '\n=== UPLOADED PHOTOS ===\n';
      prompt += `${context.imageAnalysis}\n`;
    }
    
    // WEB TRENDS
    if (context.webResults) {
      prompt += '\n=== CURRENT FASHION TRENDS ===\n';
      prompt += `${context.webResults}\n`;
    }
    
    // INSTRUCTIONS
    prompt += `\n\n=== INSTRUCTIONS ===
Provide personalized fashion advice using:
1. User's ACTUAL closet items (reference by name/brand)
2. Their established style preferences
3. Analytics insights (what they love wearing)
4. Upcoming events/trips if relevant
5. Wishlist context if shopping advice needed

Be specific - mention their actual items!
Format outfit suggestions clearly with emojis.
Keep response conversational and actionable.
    `.trim();
    
    return prompt;
  }
  
  /**
   * Legacy method - now simplified (kept for backwards compatibility)
   */
  private async getUserClosetContext(): string {
    try {
      // Now just calls the aggregator for basic context
      const context = await userContextAggregatorService.gatherAllData();
      
      if (context.closet.totalItems === 0) {
        return 'User has an empty closet. Suggest building a versatile wardrobe.';
      }
      
      return `User has ${context.closet.totalItems} items across ${Object.keys(context.closet.byCategory).length} categories.`;
    } catch (error) {
      return 'Unable to access closet data.';
    }
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
