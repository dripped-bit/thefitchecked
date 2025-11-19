/**
 * Claude Closet Analyzer
 * Uses Claude AI to deeply analyze user's wardrobe and provide rich context
 */

import { supabase } from './supabaseClient';
import authService from './authService';
import type { UserContext } from './userContextAggregatorService';

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

export interface ComprehensiveUserProfile {
  wardrobeOverview: string;
  styleProfile: string;
  strengths: string[];
  gaps: string[];
  recommendations: {
    fromCloset: string[];
    toConsider: string[];
  };
  colorPalette: string[];
  mostVersatilePieces: string[];
  underutilizedItems: string[];
  shoppingInsights: string;
  upcomingNeeds: string;
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
   * Analyze complete user profile with ALL context
   * Uses Claude to deeply understand user's fashion situation
   */
  async analyzeUserProfile(context: UserContext): Promise<ComprehensiveUserProfile> {
    console.log('🔍 [CLAUDE-PROFILE] Starting comprehensive profile analysis...');
    
    // If no data, return empty profile
    if (!context.hasData) {
      return this.emptyUserProfile();
    }
    
    // Build comprehensive prompt for Claude
    const prompt = this.buildUserProfilePrompt(context);
    
    // Call Claude API
    try {
      const response = await this.callClaudeAPI(prompt);
      return this.parseUserProfile(response, context);
    } catch (error) {
      console.error('❌ [CLAUDE-PROFILE] Analysis failed:', error);
      return this.fallbackProfile(context);
    }
  }
  
  /**
   * Build comprehensive prompt for user profile analysis
   */
  private buildUserProfilePrompt(context: UserContext): string {
    let prompt = 'Analyze this user\'s complete fashion profile and provide deep insights.\n\n';
    
    // CLOSET INVENTORY
    prompt += '=== CLOSET INVENTORY ===\n';
    prompt += `Total Items: ${context.closet.totalItems}\n\n`;
    
    if (context.closet.totalItems > 0) {
      prompt += 'Items by Category:\n';
      Object.entries(context.closet.byCategory).forEach(([cat, items]) => {
        prompt += `\n${cat.toUpperCase()} (${items.length} items):\n`;
        items.slice(0, 10).forEach(item => {
          const parts = [item.name];
          if (item.brand) parts.push(`by ${item.brand}`);
          if (item.color) parts.push(item.color);
          if (item.times_worn > 0) parts.push(`worn ${item.times_worn}x`);
          prompt += `- ${parts.join(', ')}\n`;
        });
        if (items.length > 10) prompt += `... and ${items.length - 10} more\n`;
      });
      
      if (context.closet.favoriteItems.length > 0) {
        prompt += '\nFAVORITE ITEMS:\n';
        context.closet.favoriteItems.slice(0, 5).forEach(item => {
          prompt += `- ${item.name}${item.brand ? ` by ${item.brand}` : ''}\n`;
        });
      }
    }
    
    // STYLE PREFERENCES
    if (context.stylePreferences) {
      const prefs = context.stylePreferences;
      prompt += '\n\n=== STYLE PREFERENCES ===\n';
      
      if (prefs.sizes?.gender) prompt += `Gender: ${prefs.sizes.gender}\n`;
      if (prefs.fashionPersonality?.archetypes?.length) {
        prompt += `Style Archetypes: ${prefs.fashionPersonality.archetypes.join(', ')}\n`;
      }
      if (prefs.fashionPersonality?.colorPalette?.length) {
        prompt += `Preferred Colors: ${prefs.fashionPersonality.colorPalette.join(', ')}\n`;
      }
      if (prefs.fashionPersonality?.avoidColors?.length) {
        prompt += `Avoid Colors: ${prefs.fashionPersonality.avoidColors.join(', ')}\n`;
      }
      if (prefs.shopping?.favoriteStores?.length) {
        prompt += `Favorite Stores: ${prefs.shopping.favoriteStores.join(', ')}\n`;
      }
      if (prefs.sizes) {
        prompt += 'Sizes: ';
        const sizes = [];
        if (prefs.sizes.tops) sizes.push(`Tops ${prefs.sizes.tops}`);
        if (prefs.sizes.bottoms) sizes.push(`Bottoms ${prefs.sizes.bottoms}`);
        if (prefs.sizes.shoes) sizes.push(`Shoes ${prefs.sizes.shoes}`);
        prompt += sizes.join(', ') + '\n';
      }
    }
    
    // ANALYTICS
    if (context.analytics) {
      const analytics = context.analytics;
      prompt += '\n\n=== WARDROBE ANALYTICS ===\n';
      prompt += `Total Wardrobe Value: $${analytics.totalValue.toFixed(2)}\n`;
      
      if (analytics.bestValueItems?.length) {
        prompt += '\nBest Value Items (Cost Per Wear):\n';
        analytics.bestValueItems.slice(0, 5).forEach(item => {
          prompt += `- ${item.name}: $${item.costPerWear.toFixed(2)}/wear (worn ${item.timesWorn}x)\n`;
        });
      }
      
      if (analytics.unwornItems && analytics.unwornItems > 0) {
        prompt += `\nUnworn Items: ${analytics.unwornItems} items ($${analytics.unwornValue?.toFixed(2) || '0'} value)\n`;
      }
      
      if (analytics.colors?.length) {
        prompt += '\nColor Distribution:\n';
        analytics.colors.slice(0, 5).forEach(c => {
          prompt += `- ${c.color}: ${c.count} items (${c.percentage.toFixed(0)}%)\n`;
        });
      }
    }
    
    // WISHLIST
    if (context.wishlist.items.length > 0) {
      prompt += '\n\n=== WISHLIST ===\n';
      prompt += `Total Items: ${context.wishlist.items.length}\n`;
      prompt += `Total Value: $${context.wishlist.totalValue.toFixed(2)}\n\n`;
      
      prompt += 'Wishlist Items:\n';
      context.wishlist.items.slice(0, 10).forEach(item => {
        prompt += `- ${item.name}${item.brand ? ` by ${item.brand}` : ''} - ${item.price}\n`;
      });
    }
    
    // UPCOMING TRIPS
    if (context.trips.upcoming.length > 0) {
      prompt += '\n\n=== UPCOMING TRIPS ===\n';
      context.trips.upcoming.forEach(trip => {
        prompt += `- ${trip.destination} (${trip.start_date} to ${trip.end_date})\n`;
        if (trip.trip_type) prompt += `  Type: ${trip.trip_type}\n`;
      });
    }
    
    // ANALYSIS REQUEST
    prompt += '\n\n=== ANALYSIS REQUEST ===\n';
    prompt += `Provide a comprehensive fashion profile analysis with the following sections:

WARDROBE OVERVIEW:
[2-3 sentences summarizing their overall wardrobe, style, and fashion situation]

STYLE PROFILE:
[Describe their fashion personality and aesthetic based on all data]

STRENGTHS (list 3-5):
- [What they have great pieces for - specific items and categories]

WARDROBE GAPS (list 3-5):
- [What's missing or underrepresented - be specific]

OUTFIT RECOMMENDATIONS FROM CLOSET (list 3-5):
- [Specific outfit combinations using their actual items - name the items!]

ITEMS TO CONSIDER ADDING (list 3-5):
- [Strategic additions that would expand their wardrobe - connect to their style and wishlist]

COLOR PALETTE:
[List dominant colors they own and wear]

MOST VERSATILE PIECES (list 3-5):
- [Items that work in many outfits - name them specifically]

UNDERUTILIZED ITEMS (list 3-5):
- [Items they own but don't wear much - suggest how to style them]

SHOPPING INSIGHTS:
[Based on their wishlist, favorite stores, and spending patterns]

UPCOMING NEEDS:
[Based on their trips, events, or seasonal transitions]

Be specific! Reference their actual item names, brands, and categories.`;
    
    return prompt;
  }
  
  /**
   * Parse Claude's comprehensive profile analysis
   */
  private parseUserProfile(text: string, context: UserContext): ComprehensiveUserProfile {
    const sections: any = {
      strengths: [],
      gaps: [],
      recommendations: { fromCloset: [], toConsider: [] },
      colorPalette: [],
      mostVersatilePieces: [],
      underutilizedItems: []
    };
    
    // Extract wardrobe overview
    const overviewMatch = text.match(/WARDROBE OVERVIEW:\s*\n((?:.*\n?){1,5})/i);
    sections.wardrobeOverview = overviewMatch ? overviewMatch[1].trim() : 
      `User has ${context.closet.totalItems} items in their closet.`;
    
    // Extract style profile
    const styleMatch = text.match(/STYLE PROFILE:\s*\n((?:.*\n?){1,5})/i);
    sections.styleProfile = styleMatch ? styleMatch[1].trim() : 'Analyzing style...';
    
    // Extract strengths
    const strengthsMatch = text.match(/STRENGTHS[^:]*:\s*\n((?:.*\n?){1,15})/i);
    if (strengthsMatch) {
      sections.strengths = strengthsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(Boolean);
    }
    
    // Extract gaps
    const gapsMatch = text.match(/WARDROBE GAPS[^:]*:\s*\n((?:.*\n?){1,15})/i);
    if (gapsMatch) {
      sections.gaps = gapsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(Boolean);
    }
    
    // Extract outfit recommendations
    const outfitsMatch = text.match(/OUTFIT RECOMMENDATIONS FROM CLOSET[^:]*:\s*\n((?:.*\n?){1,20})/i);
    if (outfitsMatch) {
      sections.recommendations.fromCloset = outfitsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(Boolean);
    }
    
    // Extract items to consider
    const considerMatch = text.match(/ITEMS TO CONSIDER ADDING[^:]*:\s*\n((?:.*\n?){1,15})/i);
    if (considerMatch) {
      sections.recommendations.toConsider = considerMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(Boolean);
    }
    
    // Extract color palette
    const colorMatch = text.match(/COLOR PALETTE:\s*\n((?:.*\n?){1,3})/i);
    if (colorMatch) {
      const colorText = colorMatch[1].trim();
      sections.colorPalette = colorText.split(/[,\n]/).map(c => c.trim()).filter(Boolean);
    }
    
    // Extract versatile pieces
    const versatileMatch = text.match(/MOST VERSATILE PIECES[^:]*:\s*\n((?:.*\n?){1,15})/i);
    if (versatileMatch) {
      sections.mostVersatilePieces = versatileMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(Boolean);
    }
    
    // Extract underutilized items
    const underutilizedMatch = text.match(/UNDERUTILIZED ITEMS[^:]*:\s*\n((?:.*\n?){1,15})/i);
    if (underutilizedMatch) {
      sections.underutilizedItems = underutilizedMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(Boolean);
    }
    
    // Extract shopping insights
    const shoppingMatch = text.match(/SHOPPING INSIGHTS:\s*\n((?:.*\n?){1,5})/i);
    sections.shoppingInsights = shoppingMatch ? shoppingMatch[1].trim() : '';
    
    // Extract upcoming needs
    const needsMatch = text.match(/UPCOMING NEEDS:\s*\n((?:.*\n?){1,5})/i);
    sections.upcomingNeeds = needsMatch ? needsMatch[1].trim() : '';
    
    return sections as ComprehensiveUserProfile;
  }
  
  /**
   * Fallback profile if Claude fails
   */
  private fallbackProfile(context: UserContext): ComprehensiveUserProfile {
    return {
      wardrobeOverview: `User has ${context.closet.totalItems} items in their wardrobe.`,
      styleProfile: 'Building fashion profile...',
      strengths: context.closet.favoriteItems.slice(0, 3).map(i => i.name),
      gaps: ['Versatile basics', 'Layering pieces', 'Statement accessories'],
      recommendations: {
        fromCloset: ['Mix and match existing pieces'],
        toConsider: ['Basics that fill wardrobe gaps']
      },
      colorPalette: context.analytics?.colors?.slice(0, 5).map(c => c.color) || [],
      mostVersatilePieces: context.closet.favoriteItems.slice(0, 3).map(i => i.name),
      underutilizedItems: [],
      shoppingInsights: `Total wishlist value: $${context.wishlist.totalValue.toFixed(2)}`,
      upcomingNeeds: context.trips.upcoming.length > 0 ? 
        `Upcoming trip to ${context.trips.upcoming[0].destination}` : ''
    };
  }
  
  /**
   * Empty profile for new users
   */
  private emptyUserProfile(): ComprehensiveUserProfile {
    return {
      wardrobeOverview: 'Your closet is currently empty. Let\'s build your perfect wardrobe together!',
      styleProfile: 'Building from scratch - let\'s discover your style!',
      strengths: [],
      gaps: [
        'Essential white t-shirt or blouse',
        'Well-fitting dark jeans',
        'Versatile black blazer or jacket',
        'Comfortable everyday shoes',
        'Go-to dress or outfit'
      ],
      recommendations: {
        fromCloset: [],
        toConsider: [
          'Start with versatile basics in neutral colors',
          'Invest in quality pieces that fit well',
          'Choose items that reflect your lifestyle',
          'Build a capsule wardrobe foundation'
        ]
      },
      colorPalette: [],
      mostVersatilePieces: [],
      underutilizedItems: [],
      shoppingInsights: 'Starting fresh! Focus on quality over quantity.',
      upcomingNeeds: 'Build a foundation wardrobe with essential pieces.'
    };
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
