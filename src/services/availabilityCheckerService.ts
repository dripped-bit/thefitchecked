/**
 * Availability Checker Service
 * Uses Claude AI to check real-time product stock status
 */

import { supabase } from './supabaseClient';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

export type AvailabilityStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'restocking';

interface AvailabilityResult {
  success: boolean;
  status: AvailabilityStatus;
  details?: string;
  stockCount?: number;
  error?: string;
}

class AvailabilityCheckerService {
  async checkAvailability(url: string, productName: string): Promise<AvailabilityResult> {
    try {
      const prompt = `Check stock availability for this product:

URL: ${url}
Product: ${productName}

Extract the current stock/availability status.

Return ONLY valid JSON:
{
  "status": "in_stock",
  "stockCount": 10,
  "details": "In stock - 10 available"
}

Status options: in_stock, low_stock (< 5 items), out_of_stock, restocking
NO additional text.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'X-API-Key': CLAUDE_API_KEY!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250514',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error(`API error ${response.status}`);

      const data = await response.json();
      const content = data.content?.[0]?.text?.trim() || '';
      const cleaned = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      const result = JSON.parse(cleaned);

      // Update database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: item } = await supabase
          .from('wishlist_items')
          .select('id')
          .eq('url', url)
          .eq('user_id', user.id)
          .single();

        if (item) {
          await supabase
            .from('wishlist_items')
            .update({
              availability_status: result.status,
              availability_details: result.details,
              availability_checked_at: new Date().toISOString()
            })
            .eq('id', item.id);
        }
      }

      return {
        success: true,
        status: result.status,
        details: result.details,
        stockCount: result.stockCount
      };
    } catch (error: any) {
      console.error('❌ [AVAILABILITY] Error:', error);
      return {
        success: false,
        status: 'in_stock',
        error: error.message
      };
    }
  }
}

export default new AvailabilityCheckerService();
