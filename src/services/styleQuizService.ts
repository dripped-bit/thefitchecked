/**
 * Style Quiz Service
 * Handles quiz analysis with OpenAI GPT-4 and database storage
 */

import { getChatGPTJSON } from '../lib/openai';
import { supabase } from './supabaseClient';
import authService from './authService';

export interface QuizAnswers {
  visualStyle: string[];
  weekendOutfit: string;
  shoppingTrigger: string[];
  colorPalette: string;
  fitPriority: string[];
  styleIcons: string[];
}

export interface ColorRecommendation {
  color: string; // hex code
  name: string;  // color name
}

export interface StyleQuizResult {
  // User identification
  userId: string;
  
  // Raw answers
  visualStyle: string[];
  weekendOutfit: string;
  shoppingTrigger: string[];
  colorPalette: string;
  fitPriority: string[];
  styleIcons: string[];
  
  // AI Analysis
  styleType: string;
  styleDescription: string;
  personality: string;
  shoppingBehavior: string;
  priorities: string[];
  recommendedPalette: ColorRecommendation[];
  recommendedBrands: string[];
  stylingTips: string[];
  aiInsights: string;
  
  // Metadata
  completedAt: string;
}

class StyleQuizService {
  /**
   * Analyze quiz answers with OpenAI GPT-4
   */
  async analyzeQuizWithAI(answers: QuizAnswers): Promise<Omit<StyleQuizResult, 'userId' | 'completedAt'>> {
    try {
      console.log('🤖 [STYLE-QUIZ] Analyzing answers with GPT-4...');

      const prompt = `You are a professional fashion stylist analyzing a style quiz. Create a personalized, encouraging style profile.

USER ANSWERS:
- Visual Style Preferences: ${answers.visualStyle.join(', ')}
- Weekend Outfit Choice: ${answers.weekendOutfit}
- Shopping Triggers: ${answers.shoppingTrigger.join(', ')}
- Color Palette: ${answers.colorPalette}
- Fit Priorities: ${answers.fitPriority.join(', ')}
- Style Icons: ${answers.styleIcons.join(', ')}

ANALYZE AND PROVIDE:

1. **styleType**: A catchy 2-3 word style archetype (e.g., "Minimalist Modern", "Boho Romantic", "Classic Elegance", "Edgy Sophisticate")

2. **styleDescription**: 2-3 sentences that capture their fashion personality in an uplifting, personalized way

3. **personality**: One engaging sentence about their fashion personality

4. **shoppingBehavior**: 1-2 sentences about how they approach shopping based on their triggers

5. **priorities**: Array of exactly 3 things they value most in clothing (based on fit priorities)

6. **recommendedPalette**: Array of exactly 4 color objects with:
   - color: hex code (e.g., "#000000")
   - name: color name (e.g., "Black")
   Based on their color palette answer, recommend complementary colors

7. **recommendedBrands**: Array of 5-7 accessible brands that match their style (mix of price points)

8. **stylingTips**: Array of exactly 4 actionable, specific styling tips personalized to their answers

9. **aiInsights**: 2-3 sentences of personalized insights about what their style choices reveal about them (positive and empowering)

IMPORTANT: 
- Be specific and personalized based on their actual answers
- Use an encouraging, fun tone (this is a fashion scrapbook!)
- Make recommendations practical and accessible
- Return ONLY valid JSON with these exact field names

Example JSON structure:
{
  "styleType": "Minimalist Modern",
  "styleDescription": "You love...",
  "personality": "You're a...",
  "shoppingBehavior": "You shop...",
  "priorities": ["Quality", "Versatility", "Comfort"],
  "recommendedPalette": [
    {"color": "#000000", "name": "Black"},
    {"color": "#FFFFFF", "name": "White"},
    {"color": "#8B7355", "name": "Camel"},
    {"color": "#2C3E50", "name": "Navy"}
  ],
  "recommendedBrands": ["Everlane", "COS", "Uniqlo", "Arket", "& Other Stories"],
  "stylingTips": [
    "Layer neutral pieces for depth",
    "Invest in quality basics",
    "Add one statement accessory",
    "Mix textures for interest"
  ],
  "aiInsights": "Your choices reveal..."
}`;

      const response = await getChatGPTJSON<any>(prompt, {
        systemPrompt: 'You are an expert fashion stylist who creates personalized, encouraging style profiles. Always respond with valid JSON only.',
        model: 'gpt-4o',
        temperature: 0.7,
      });

      console.log('✅ [STYLE-QUIZ] GPT-4 analysis complete');

      // Combine answers with AI results
      return {
        ...answers,
        styleType: response.styleType || 'Fashion Enthusiast',
        styleDescription: response.styleDescription || '',
        personality: response.personality || '',
        shoppingBehavior: response.shoppingBehavior || '',
        priorities: response.priorities || [],
        recommendedPalette: response.recommendedPalette || [],
        recommendedBrands: response.recommendedBrands || [],
        stylingTips: response.stylingTips || [],
        aiInsights: response.aiInsights || '',
      };
    } catch (error) {
      console.error('❌ [STYLE-QUIZ] Error analyzing with AI:', error);
      throw error;
    }
  }

  /**
   * Save quiz results to database
   */
  async saveQuizResults(results: Omit<StyleQuizResult, 'userId' | 'completedAt'>): Promise<StyleQuizResult> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('💾 [STYLE-QUIZ] Saving results to database...');

      const dataToSave = {
        user_id: user.id,
        visual_style: results.visualStyle,
        weekend_outfit: results.weekendOutfit,
        shopping_trigger: results.shoppingTrigger,
        color_palette: results.colorPalette,
        fit_priority: results.fitPriority,
        style_icons: results.styleIcons,
        style_type: results.styleType,
        style_description: results.styleDescription,
        personality: results.personality,
        shopping_behavior: results.shoppingBehavior,
        priorities: results.priorities,
        recommended_palette: results.recommendedPalette,
        recommended_brands: results.recommendedBrands,
        styling_tips: results.stylingTips,
        ai_insights: results.aiInsights,
        quiz_version: 1,
        completed_at: new Date().toISOString(),
      };

      // Use upsert to handle retakes
      const { data, error } = await supabase
        .from('style_quiz_results')
        .upsert(dataToSave, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [STYLE-QUIZ] Database error:', error);
        throw error;
      }

      console.log('✅ [STYLE-QUIZ] Results saved successfully');

      return {
        userId: data.user_id,
        visualStyle: data.visual_style,
        weekendOutfit: data.weekend_outfit,
        shoppingTrigger: data.shopping_trigger,
        colorPalette: data.color_palette,
        fitPriority: data.fit_priority,
        styleIcons: data.style_icons,
        styleType: data.style_type,
        styleDescription: data.style_description,
        personality: data.personality,
        shoppingBehavior: data.shopping_behavior,
        priorities: data.priorities,
        recommendedPalette: data.recommended_palette,
        recommendedBrands: data.recommended_brands,
        stylingTips: data.styling_tips,
        aiInsights: data.ai_insights,
        completedAt: data.completed_at,
      };
    } catch (error) {
      console.error('❌ [STYLE-QUIZ] Error saving results:', error);
      throw error;
    }
  }

  /**
   * Get user's quiz results from database
   */
  async getQuizResults(): Promise<StyleQuizResult | null> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('style_quiz_results')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ [STYLE-QUIZ] Error fetching results:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        userId: data.user_id,
        visualStyle: data.visual_style,
        weekendOutfit: data.weekend_outfit,
        shoppingTrigger: data.shopping_trigger,
        colorPalette: data.color_palette,
        fitPriority: data.fit_priority,
        styleIcons: data.style_icons,
        styleType: data.style_type,
        styleDescription: data.style_description,
        personality: data.personality,
        shoppingBehavior: data.shopping_behavior,
        priorities: data.priorities,
        recommendedPalette: data.recommended_palette,
        recommendedBrands: data.recommended_brands,
        stylingTips: data.styling_tips,
        aiInsights: data.ai_insights,
        completedAt: data.completed_at,
      };
    } catch (error) {
      console.error('❌ [STYLE-QUIZ] Error getting quiz results:', error);
      return null;
    }
  }

  /**
   * Check if user has completed the quiz
   */
  async hasCompletedQuiz(): Promise<boolean> {
    const results = await this.getQuizResults();
    return results !== null;
  }

  /**
   * Delete quiz results (for retaking)
   */
  async deleteQuizResults(): Promise<void> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return;
      }

      const { error } = await supabase
        .from('style_quiz_results')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ [STYLE-QUIZ] Error deleting results:', error);
        throw error;
      }

      console.log('✅ [STYLE-QUIZ] Results deleted');
    } catch (error) {
      console.error('❌ [STYLE-QUIZ] Error deleting quiz results:', error);
      throw error;
    }
  }

  /**
   * Complete flow: analyze and save
   */
  async completeQuiz(answers: QuizAnswers): Promise<StyleQuizResult> {
    try {
      console.log('🎯 [STYLE-QUIZ] Starting quiz completion flow...');
      
      // 1. Analyze with AI
      const analysis = await this.analyzeQuizWithAI(answers);
      
      // 2. Save to database
      const results = await this.saveQuizResults(analysis);
      
      console.log('🎉 [STYLE-QUIZ] Quiz completed successfully!');
      return results;
    } catch (error) {
      console.error('❌ [STYLE-QUIZ] Error completing quiz:', error);
      throw error;
    }
  }
}

// Export singleton
const styleQuizService = new StyleQuizService();
export default styleQuizService;
