/**
 * Claude Closet Analyzer
 * Uses Claude AI to deeply analyze user's wardrobe and provide rich context
 */

import { supabase } from './supabaseClient';
import authService from './authService';

export interface ClosetAnalysis {
  summary: string;
  styleProfile: string;
  colorPalette: string[];
  categoryBreakdown: Record<string, number>;
  topItems: string[];
  gaps: string[];
  versatilePieces: string[];
  totalItems: number;
}

class ClaudeClosetAnalyzer {
  
  /**
   * Analyze user's closet with Claude AI
   */
  async analyzeCloset(): Promise<ClosetAnalysis> {
    console.log('🔍 [CLAUDE-CLOSET] Starting analysis...');
    
    // 1. Fetch all closet items
    const items = await this.fetchAllClosetItems();
    
    if (items.length === 0) {
      console.log('📭 [CLAUDE-CLOSET] Empty closet detected');
      return this.emptyClosetAnalysis();
    }
    
    console.log(`📊 [CLAUDE-CLOSET] Analyzing ${items.length} items...`);
    
    // 2. Build prompt for Claude
    const prompt = this.buildAnalysisPrompt(items);
    
    // 3. Call Claude API
    const analysis = await this.callClaudeAPI(prompt);
    
    // 4. Parse and structure response
    return this.parseAnalysis(analysis, items);
  }
  
  /**
   * Fetch ALL closet items from correct table
   */
  private async fetchAllClosetItems(): Promise<any[]> {
    const user = await authService.getCurrentUser();
    if (!user) {
      console.log('⚠️ [CLAUDE-CLOSET] No authenticated user');
      return [];
    }
    
    // Try multiple table names (app may use different naming)
    const possibleTables = [
      'wardrobe_items',
      'closet_items', 
      'clothing_items',
      'user_wardrobe'
    ];
    
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', user.id);
        
        if (!error && data && data.length > 0) {
          console.log(`✅ [CLAUDE-CLOSET] Found ${data.length} items in ${tableName}`);
          return data;
        }
      } catch (e) {
        // Table doesn't exist, try next
        continue;
      }
    }
    
    console.warn('⚠️ [CLAUDE-CLOSET] No closet items found in any table');
    return [];
  }
  
  /**
   * Build comprehensive prompt for Claude
   */
  private buildAnalysisPrompt(items: any[]): string {
    // Format items data
    const itemsList = items.map(item => {
      const parts = [item.name || 'Unnamed'];
      
      if (item.category) parts.push(item.category);
      if (item.subcategory) parts.push(item.subcategory);
      if (item.color) parts.push(item.color);
      if (item.brand) parts.push(`by ${item.brand}`);
      
      return `- ${parts.join(', ')}`;
    }).join('\n');
    
    return `
You are a professional fashion analyst. Analyze this wardrobe and provide a comprehensive breakdown.

USER'S WARDROBE (${items.length} items):
${itemsList}

Provide analysis in this format:

STYLE PROFILE:
[Describe overall style - classic, trendy, minimalist, eclectic, etc.]

COLOR PALETTE:
[List dominant colors and their frequency]

CATEGORY BREAKDOWN:
[Count by category: tops, bottoms, dresses, shoes, etc.]

MOST VERSATILE PIECES:
[List 5-7 items that work with many outfits]

WARDROBE GAPS:
[What essential pieces are missing?]

STRENGTH AREAS:
[What categories are well-stocked?]

STYLING OPPORTUNITIES:
[Suggest 2-3 outfit combinations from existing items]

Keep response structured and specific. Focus on actionable insights.
    `.trim();
  }
  
  /**
   * Call Claude API via backend proxy
   */
  private async callClaudeAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [CLAUDE-CLOSET] Analysis complete');
      return data.content[0].text;
    } catch (error) {
      console.error('❌ [CLAUDE-CLOSET] API error:', error);
      throw error;
    }
  }
  
  /**
   * Parse Claude's response into structured data
   */
  private parseAnalysis(claudeResponse: string, items: any[]): ClosetAnalysis {
    // Extract sections from Claude's response
    const sections = this.extractSections(claudeResponse);
    
    // Count categories
    const categoryBreakdown: Record<string, number> = {};
    items.forEach(item => {
      const cat = item.category || 'uncategorized';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });
    
    // Extract colors
    const colors = [...new Set(items.map(i => i.color).filter(Boolean))];
    
    return {
      summary: claudeResponse,
      styleProfile: sections.styleProfile || 'Mixed style wardrobe',
      colorPalette: colors,
      categoryBreakdown,
      topItems: sections.versatilePieces || [],
      gaps: sections.gaps || [],
      versatilePieces: sections.versatilePieces || [],
      totalItems: items.length
    };
  }
  
  /**
   * Extract sections from Claude's formatted response
   */
  private extractSections(text: string): any {
    const sections: any = {};
    
    // Extract style profile
    const styleMatch = text.match(/STYLE PROFILE:\s*\n([^\n]+)/i);
    if (styleMatch) sections.styleProfile = styleMatch[1].trim();
    
    // Extract versatile pieces
    const versatileMatch = text.match(/MOST VERSATILE PIECES:\s*\n((?:.*\n?){1,10})/i);
    if (versatileMatch) {
      sections.versatilePieces = versatileMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim());
    }
    
    // Extract gaps
    const gapsMatch = text.match(/WARDROBE GAPS:\s*\n((?:.*\n?){1,10})/i);
    if (gapsMatch) {
      sections.gaps = gapsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim());
    }
    
    return sections;
  }
  
  /**
   * Return analysis for empty closet
   */
  private emptyClosetAnalysis(): ClosetAnalysis {
    return {
      summary: 'Your closet is currently empty. Start building your wardrobe with versatile basics!',
      styleProfile: 'Building from scratch',
      colorPalette: [],
      categoryBreakdown: {},
      topItems: [],
      gaps: [
        'Essential white t-shirt',
        'Dark jeans',
        'Black blazer',
        'Comfortable sneakers',
        'Little black dress'
      ],
      versatilePieces: [],
      totalItems: 0
    };
  }
}

export default new ClaudeClosetAnalyzer();
