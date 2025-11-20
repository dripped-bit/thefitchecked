/**
 * Weekly Challenge Service
 * Generates and monitors weekly fashion challenges using Claude AI
 */

import { supabase } from './supabaseClient';
import Anthropic from '@anthropic-ai/sdk';

type ChallengeType =
  | 'wear_color'        // Wear a specific color 3x this week
  | 'try_new_combo'     // Create outfit with unlikely pairing
  | 'closet_hero'       // Wear your least-worn item
  | 'monochrome'        // Full monochrome outfit
  | 'pattern_mix'       // Mix 2 different patterns
  | 'accessory_focus'   // Highlight specific accessory type
  | 'seasonal_twist'    // Wear summer item in winter styling
  | 'color_block';      // Bold color blocking outfit

interface WeeklyChallenge {
  id: string;
  user_id: string;
  week_start: string;
  challenge_type: ChallengeType;
  challenge_text: string;
  accepted_at?: string;
  completed_at?: string;
  completion_data?: {
    outfitIds: string[];
    complimentText: string;
  };
  created_at: string;
  updated_at: string;
}

class WeeklyChallengeService {
  private anthropic: Anthropic | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ 
        apiKey,
        dangerouslyAllowBrowser: true 
      });
    }
  }

  /**
   * Get Monday of current week
   */
  private getWeekStart(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  /**
   * Generate new challenge for the week using Claude
   */
  async generateWeeklyChallenge(userId: string): Promise<WeeklyChallenge> {
    const weekStart = this.getWeekStart();

    // Check if challenge already exists for this week
    const { data: existing } = await supabase
      .from('weekly_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single();

    if (existing) {
      return existing as WeeklyChallenge;
    }

    // Get user's closet data for personalization
    const { data: closetItems } = await supabase
      .from('closet_items')
      .select('*')
      .eq('user_id', userId);

    // Get past challenges to avoid repetition
    const { data: pastChallenges } = await supabase
      .from('weekly_challenges')
      .select('challenge_type')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(4);

    const usedTypes = pastChallenges?.map((c: any) => c.challenge_type) || [];

    // Generate with Claude
    if (!this.anthropic) {
      throw new Error('Claude API not initialized');
    }

    const prompt = `Generate a fun, achievable fashion challenge for this week.

User's Closet: ${closetItems?.length || 0} items
Recent challenge types (avoid these): ${usedTypes.join(', ')}

Available challenge types:
- wear_color: Wear a specific color 3x this week
- try_new_combo: Create outfit with unlikely pairing
- closet_hero: Wear your least-worn item
- monochrome: Full monochrome outfit
- pattern_mix: Mix 2 different patterns
- accessory_focus: Highlight specific accessory type
- seasonal_twist: Wear summer item in winter styling (or vice versa)
- color_block: Bold color blocking outfit

Return ONLY valid JSON (no markdown):
{
  "challengeType": "type from list above",
  "challengeText": "Exciting, short description (max 60 chars)"
}

Make it fun, achievable, and personalized!`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    // Extract JSON from response (Claude might wrap it in markdown)
    let result;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(textContent);
      }
    } catch (error) {
      console.error('Failed to parse Claude response:', textContent);
      // Fallback challenge
      result = {
        challengeType: 'wear_color',
        challengeText: 'Wear pink 3 times this week!'
      };
    }

    // Save to database
    const { data: challenge, error } = await supabase
      .from('weekly_challenges')
      .insert({
        user_id: userId,
        week_start: weekStart,
        challenge_type: result.challengeType,
        challenge_text: result.challengeText
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving challenge:', error);
      throw error;
    }

    return challenge as WeeklyChallenge;
  }

  /**
   * Accept challenge
   */
  async acceptChallenge(challengeId: string): Promise<void> {
    const { error } = await supabase
      .from('weekly_challenges')
      .update({ 
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', challengeId);

    if (error) {
      console.error('Error accepting challenge:', error);
      throw error;
    }
  }

  /**
   * Check if user completed challenge using Claude
   */
  async checkCompletion(
    userId: string, 
    challengeId: string
  ): Promise<{ completed: boolean; compliment?: string }> {
    // Get challenge details
    const { data: challenge } = await supabase
      .from('weekly_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (!challenge || challenge.completed_at) {
      return { completed: false };
    }

    // Get user's outfits from this week
    const { data: outfits } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', challenge.week_start)
      .order('start_time', { ascending: false });

    if (!outfits || outfits.length === 0) {
      return { completed: false };
    }

    // Use Claude to analyze if challenge is met
    if (!this.anthropic) {
      return { completed: false };
    }

    const prompt = `Analyze if this fashion challenge was completed:

Challenge: ${challenge.challenge_text}
Type: ${challenge.challenge_type}

User's outfits this week: ${JSON.stringify(outfits.slice(0, 10), null, 2)}

Did they complete the challenge? Return ONLY valid JSON (no markdown):
{
  "completed": true/false,
  "compliment": "Witty, fun 1-sentence fashion compliment if completed (or empty string if not)"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';

      // Extract JSON from response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textContent);

      if (result.completed) {
        // Mark as complete
        await supabase
          .from('weekly_challenges')
          .update({
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            completion_data: {
              outfitIds: outfits.map((o: any) => o.id),
              complimentText: result.compliment
            }
          })
          .eq('id', challengeId);
      }

      return result;
    } catch (error) {
      console.error('Error checking completion:', error);
      return { completed: false };
    }
  }

  /**
   * Get current week's challenge for user
   */
  async getCurrentChallenge(userId: string): Promise<WeeklyChallenge | null> {
    const weekStart = this.getWeekStart();

    const { data } = await supabase
      .from('weekly_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single();

    return data as WeeklyChallenge | null;
  }
}

export default new WeeklyChallengeService();
