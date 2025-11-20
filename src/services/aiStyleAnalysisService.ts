/**
 * AI Style Analysis Service
 * Analyzes user's closet and generates insights using Claude + OpenAI
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ClothingItem } from '../hooks/useCloset';

export interface StyleAnalysis {
  stylePersona: string;
  colorPalette: {
    primary: string[];
    missing: string[];
    suggestions: string[];
  };
  closetGaps: {
    category: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    exampleItems: string[];
  }[];
  mostWornItems: {
    itemId: string;
    timesWorn: number;
    versatilityScore: number;
  }[];
  lonelyItems: {
    itemId: string;
    lastWorn?: Date;
    stylingIdeas: string[];
  }[];
  weeklyChallenge: {
    title: string;
    description: string;
    items: string[];
  };
}

class AIStyleAnalysisService {
  private claude: Anthropic | null = null;
  private openai: OpenAI | null = null;

  constructor() {
    const claudeKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (claudeKey) {
      this.claude = new Anthropic({
        apiKey: claudeKey,
        dangerouslyAllowBrowser: true
      });
    }

    if (openaiKey) {
      this.openai = new OpenAI({
        apiKey: openaiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }

  /**
   * Complete style analysis of user's closet
   */
  async analyzeStyle(items: ClothingItem[]): Promise<StyleAnalysis> {
    console.log('🎨 [STYLE-ANALYSIS] Analyzing closet with', items.length, 'items');

    if (items.length === 0) {
      return this.getDefaultAnalysis();
    }

    // Build closet summary
    const summary = this.buildClosetSummary(items);

    // Analyze wear patterns
    const mostWorn = items
      .sort((a, b) => b.times_worn - a.times_worn)
      .slice(0, 5)
      .map(item => ({
        itemId: item.id,
        timesWorn: item.times_worn,
        versatilityScore: this.calculateVersatility(item)
      }));

    // Find lonely items (not worn in 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const lonely = items
      .filter(item => {
        if (!item.last_worn) return item.times_worn === 0;
        return new Date(item.last_worn) < ninetyDaysAgo;
      })
      .slice(0, 5)
      .map(item => ({
        itemId: item.id,
        lastWorn: item.last_worn ? new Date(item.last_worn) : undefined,
        stylingIdeas: []
      }));

    // Try AI analysis if available
    if (this.claude) {
      try {
        return await this.analyzeWithClaude(items, summary, mostWorn, lonely);
      } catch (error) {
        console.error('Claude analysis failed:', error);
        return this.analyzeWithHeuristics(items, summary, mostWorn, lonely);
      }
    } else {
      return this.analyzeWithHeuristics(items, summary, mostWorn, lonely);
    }
  }

  /**
   * Analyze with Claude AI
   */
  private async analyzeWithClaude(
    items: ClothingItem[],
    summary: string,
    mostWorn: any[],
    lonely: any[]
  ): Promise<StyleAnalysis> {
    const prompt = `Analyze this fashion closet and provide insights in JSON format:

${summary}

Provide a JSON object with:
1. stylePersona: A 2-3 word description of their aesthetic (e.g., "Minimalist Cool", "Bohemian Chic")
2. colorPalette: {
   primary: [array of their most used colors],
   missing: [array of 2-3 colors they should add],
   suggestions: [array of 1-2 style tips about colors]
}
3. closetGaps: [array of 2-3 objects with {category, priority, reasoning, exampleItems}]
4. weeklyChallenge: {title, description, items: [array of item suggestions]}

Return ONLY valid JSON, no markdown.`;

    const response = await this.claude!.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0];
    let data: any = {};
    
    if (content.type === 'text') {
      try {
        // Remove markdown code blocks if present
        let text = content.text.trim();
        if (text.startsWith('```')) {
          text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse Claude response:', e);
        data = {};
      }
    }

    return {
      stylePersona: data.stylePersona || this.inferStylePersona(items),
      colorPalette: data.colorPalette || this.analyzeColorPalette(items),
      closetGaps: data.closetGaps || [],
      mostWornItems: mostWorn,
      lonelyItems: lonely,
      weeklyChallenge: data.weeklyChallenge || this.generateDefaultChallenge()
    };
  }

  /**
   * Analyze with heuristics (fallback when no AI)
   */
  private analyzeWithHeuristics(
    items: ClothingItem[],
    summary: string,
    mostWorn: any[],
    lonely: any[]
  ): StyleAnalysis {
    return {
      stylePersona: this.inferStylePersona(items),
      colorPalette: this.analyzeColorPalette(items),
      closetGaps: this.identifyClosetGaps(items),
      mostWornItems: mostWorn,
      lonelyItems: lonely,
      weeklyChallenge: this.generateDefaultChallenge()
    };
  }

  /**
   * Infer style persona from closet
   */
  private inferStylePersona(items: ClothingItem[]): string {
    const categories = items.map(i => i.category);
    const colors = items.map(i => i.color?.toLowerCase() || '');
    
    const hasNeutrals = colors.filter(c => 
      c.includes('black') || c.includes('white') || c.includes('gray') || c.includes('beige')
    ).length > items.length * 0.5;

    const hasActivewear = categories.includes('activewear');
    const hasDresses = categories.includes('dresses');

    if (hasNeutrals) return 'Minimalist Modern';
    if (hasActivewear) return 'Athleisure Chic';
    if (hasDresses) return 'Feminine Classic';
    
    return 'Eclectic Style';
  }

  /**
   * Analyze color palette
   */
  private analyzeColorPalette(items: ClothingItem[]) {
    const colorCounts = new Map<string, number>();
    items.forEach(item => {
      if (item.color) {
        const color = item.color.toLowerCase();
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      }
    });

    const primary = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);

    const allColors = new Set(primary.map(c => c.toLowerCase()));
    const missing: string[] = [];
    
    if (!allColors.has('navy') && !allColors.has('blue')) missing.push('navy');
    if (!allColors.has('olive') && !allColors.has('green')) missing.push('olive');
    if (!allColors.has('camel') && !allColors.has('tan')) missing.push('camel');

    return {
      primary: primary.length > 0 ? primary : ['black', 'white', 'denim'],
      missing: missing.slice(0, 2),
      suggestions: ['Add warm neutrals for depth', 'Try layering complementary tones']
    };
  }

  /**
   * Identify gaps in closet
   */
  private identifyClosetGaps(items: ClothingItem[]) {
    const categories = new Set(items.map(i => i.category));
    const gaps: any[] = [];

    if (!categories.has('outerwear')) {
      gaps.push({
        category: 'outerwear',
        priority: 'high' as const,
        reasoning: 'Essential for layering and versatility',
        exampleItems: ['Blazer', 'Denim jacket', 'Trench coat']
      });
    }

    if (!categories.has('shoes')) {
      gaps.push({
        category: 'shoes',
        priority: 'high' as const,
        reasoning: 'Complete every outfit with the right footwear',
        exampleItems: ['White sneakers', 'Ankle boots', 'Loafers']
      });
    }

    if (!categories.has('accessories')) {
      gaps.push({
        category: 'accessories',
        priority: 'medium' as const,
        reasoning: 'Elevate basics with statement pieces',
        exampleItems: ['Statement earrings', 'Leather belt', 'Silk scarf']
      });
    }

    return gaps.slice(0, 3);
  }

  /**
   * Generate default weekly challenge
   */
  private generateDefaultChallenge() {
    const challenges = [
      {
        title: 'Monochrome Moment',
        description: 'Create an all-one-color outfit using different textures',
        items: ['Pick one color', 'Mix materials', 'Add texture']
      },
      {
        title: 'Mix & Match',
        description: 'Pair your dressiest top with casual bottoms',
        items: ['Silk blouse', 'Denim jeans', 'Sneakers']
      },
      {
        title: 'Color Pop',
        description: 'Build a neutral outfit and add one bright accent',
        items: ['Neutral base', 'Bright accessory', 'Confidence']
      }
    ];

    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  /**
   * Calculate how versatile an item is
   */
  private calculateVersatility(item: ClothingItem): number {
    let score = 0;
    
    // Neutral colors = more versatile
    const neutralColors = ['black', 'white', 'gray', 'navy', 'beige', 'camel'];
    if (item.color && neutralColors.some(n => item.color!.toLowerCase().includes(n))) {
      score += 30;
    }

    // Basic categories = more versatile
    const basicCategories = ['tops', 'bottoms'];
    if (basicCategories.includes(item.category)) {
      score += 20;
    }

    // Times worn = proven versatility
    score += Math.min(item.times_worn * 2, 50);

    return Math.min(score, 100);
  }

  /**
   * Build text summary of closet
   */
  private buildClosetSummary(items: ClothingItem[]): string {
    const byCategory = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byColor = items.reduce((acc, item) => {
      if (item.color) {
        acc[item.color] = (acc[item.color] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const brands = items
      .filter(i => i.brand)
      .map(i => i.brand)
      .slice(0, 10)
      .join(', ');

    return `
Total Items: ${items.length}

By Category:
${Object.entries(byCategory).map(([cat, count]) => `- ${cat}: ${count}`).join('\n')}

By Color:
${Object.entries(byColor).slice(0, 10).map(([color, count]) => `- ${color}: ${count}`).join('\n')}

Most Worn:
${items.sort((a, b) => b.times_worn - a.times_worn).slice(0, 5).map(i => `- ${i.name} (${i.times_worn}x)`).join('\n')}

${brands ? `Brands: ${brands}` : ''}
`;
  }

  /**
   * Get default analysis for empty closet
   */
  private getDefaultAnalysis(): StyleAnalysis {
    return {
      stylePersona: 'Getting Started',
      colorPalette: {
        primary: ['black', 'white', 'neutral'],
        missing: ['navy', 'camel'],
        suggestions: ['Start with versatile neutrals', 'Add pops of color gradually']
      },
      closetGaps: [
        {
          category: 'basics',
          priority: 'high',
          reasoning: 'Build your foundation wardrobe',
          exampleItems: ['White tee', 'Black jeans', 'Denim jacket']
        }
      ],
      mostWornItems: [],
      lonelyItems: [],
      weeklyChallenge: {
        title: 'Build Your Base',
        description: 'Add your first essential pieces',
        items: ['Upload items', 'Tag colors', 'Start styling']
      }
    };
  }

  /**
   * Generate styling suggestions for a specific item
   */
  async getStylingIdeas(item: ClothingItem, allItems: ClothingItem[]): Promise<string[]> {
    if (!this.openai) {
      return this.getHeuristicStylingIdeas(item, allItems);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Give me 3 creative ways to style this item:
        
Item: ${item.name}
Category: ${item.category}
Color: ${item.color}

Available items to pair with:
${allItems.slice(0, 20).map(i => `- ${i.name} (${i.category}, ${i.color})`).join('\n')}

Return ONLY a JSON array of 3 styling suggestions as strings.`
        }],
        temperature: 0.8
      });

      const content = response.choices[0].message.content;
      if (content) {
        try {
          return JSON.parse(content);
        } catch (e) {
          console.error('Failed to parse OpenAI response');
        }
      }
    } catch (error) {
      console.error('OpenAI styling ideas failed:', error);
    }

    return this.getHeuristicStylingIdeas(item, allItems);
  }

  /**
   * Heuristic styling ideas (fallback)
   */
  private getHeuristicStylingIdeas(item: ClothingItem, allItems: ClothingItem[]): string[] {
    const ideas: string[] = [];

    if (item.category === 'tops') {
      ideas.push('Pair with denim and sneakers for casual chic');
      ideas.push('Tuck into high-waisted bottoms');
      ideas.push('Layer under a blazer for polish');
    } else if (item.category === 'bottoms') {
      ideas.push('Style with an oversized sweater');
      ideas.push('Pair with a tucked-in blouse');
      ideas.push('Add a belt for definition');
    } else if (item.category === 'dresses') {
      ideas.push('Layer with a denim jacket');
      ideas.push('Add ankle boots and accessories');
      ideas.push('Belt at waist for shape');
    } else {
      ideas.push('Mix with complementary colors');
      ideas.push('Try unexpected pairings');
      ideas.push('Accessorize to complete the look');
    }

    return ideas;
  }
}

export default new AIStyleAnalysisService();
