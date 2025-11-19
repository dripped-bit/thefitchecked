/**
 * Claude Comparison Service
 * Generates optimized search queries for finding better deals on fashion items
 * Enhanced with Claude Vision image analysis and OpenAI fashion trend insights
 */

import Anthropic from '@anthropic-ai/sdk';
import { getChatGPTJSON } from '../lib/openai';

export interface SearchQueries {
  exactMatch: string;
  similarItems: string[];
  visualAnalysis?: VisualAnalysis;
  trendInsights?: TrendInsights;
}

export interface VisualAnalysis {
  color: string;
  secondaryColors?: string[];
  style: string;
  fit?: string;
  pattern?: string;
  material?: string;
  details?: string[];
  vibe?: string;
  category: string;
}

export interface TrendInsights {
  trendKeywords: string[];
  searchOptimization: string[];
  alternativeBrands: string[];
  pricePoint: string;
}

class ClaudeComparisonService {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ [CLAUDE-COMPARISON] No API key found');
    }
    this.anthropic = new Anthropic({
      apiKey: apiKey || '',
      dangerouslyAllowBrowser: true
    });
  }

  async generateSearchQueries(item: any): Promise<SearchQueries> {
    try {
      console.log('🤖 [CLAUDE-COMPARISON] Generating search queries for:', item.name);

      // Step 1: Analyze image with Claude Vision if image available
      let visualAnalysis: VisualAnalysis | undefined;
      if (item.image || item.image_url) {
        console.log('👁️ [CLAUDE-COMPARISON] Analyzing product image with Claude Vision...');
        visualAnalysis = await this.analyzeProductImage(item.image || item.image_url);
        console.log('✅ [CLAUDE-COMPARISON] Visual analysis completed:', visualAnalysis);
      }

      // Step 2: Get fashion trend insights from OpenAI
      let trendInsights: TrendInsights | undefined;
      console.log('🔥 [CLAUDE-COMPARISON] Getting fashion trend insights from OpenAI...');
      trendInsights = await this.getFashionTrendInsights(item, visualAnalysis);
      console.log('✅ [CLAUDE-COMPARISON] Trend insights completed:', trendInsights);

      // Step 3: Generate comprehensive search queries using all insights
      const queries = await this.generateEnhancedQueries(item, visualAnalysis, trendInsights);
      
      return {
        ...queries,
        visualAnalysis,
        trendInsights
      };
    } catch (error) {
      console.error('❌ [CLAUDE-COMPARISON] Error:', error);
      // Fallback to basic queries
      return {
        exactMatch: `${item.brand || ''} ${item.name}`.trim(),
        similarItems: [
          `similar to ${item.name}`,
          `${item.category} alternative`,
          `budget ${item.category}`
        ]
      };
    }
  }

  /**
   * Analyze product image with Claude Vision to extract visual details
   */
  private async analyzeProductImage(imageUrl: string): Promise<VisualAnalysis> {
    try {
      const imageBase64 = await this.imageToBase64(imageUrl);

      const response = await fetch('/api/claude/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64
                }
              },
              {
                type: 'text',
                text: `Analyze this fashion product image and extract EXACT visual details for shopping search optimization.

Return ONLY a JSON object (no markdown):
{
  "category": "shirt|pants|dress|jacket|shoes|skirt|top|bottom|outerwear|accessory",
  "color": "EXACT primary color shade (e.g., navy blue, burgundy, sage green)",
  "secondaryColors": ["any additional colors"],
  "style": "detailed style (e.g., oversized, fitted, cropped, longline, relaxed)",
  "fit": "fit description (e.g., slim fit, relaxed fit, oversized, tailored)",
  "pattern": "pattern (e.g., solid, striped, floral, plaid, textured)",
  "material": "apparent material (e.g., denim, leather, cotton, silk, knit, wool)",
  "details": ["specific features: buttons, pockets, zipper, pleats, ruffles"],
  "vibe": "fashion aesthetic (e.g., minimalist, streetwear, bohemian, preppy, athletic)"
}

CRITICAL: Be EXTREMELY specific about EXACT color shades - this is most important for matching products!`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('No JSON in Claude Vision response');
    } catch (error) {
      console.error('❌ [CLAUDE-COMPARISON] Vision analysis failed:', error);
      return {
        color: 'unknown',
        style: 'unknown',
        category: 'fashion'
      };
    }
  }

  /**
   * Get fashion trend insights from OpenAI for better search optimization
   */
  private async getFashionTrendInsights(item: any, visualAnalysis?: VisualAnalysis): Promise<TrendInsights> {
    try {
      const prompt = `You are a fashion trend expert and shopping search specialist.

Product: ${item.name}
Brand: ${item.brand || 'Unknown'}
Price: ${item.price}
${visualAnalysis ? `
Visual Details:
- Color: ${visualAnalysis.color}
- Style: ${visualAnalysis.style}
- Material: ${visualAnalysis.material || 'Unknown'}
- Pattern: ${visualAnalysis.pattern || 'Unknown'}
- Vibe: ${visualAnalysis.vibe || 'Unknown'}
` : ''}

Provide fashion trend insights and search optimization for finding the BEST deals on this exact style.

Return ONLY valid JSON:
{
  "trendKeywords": ["current", "fashion", "trend", "keywords", "that", "match", "this", "style"],
  "searchOptimization": ["specific", "search", "terms", "for", "best", "results"],
  "alternativeBrands": ["similar", "quality", "brands", "to", "check"],
  "pricePoint": "budget|mid-range|premium|luxury"
}`;

      const response = await getChatGPTJSON(prompt, {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 400
      });

      console.log('🔥 [OPENAI-TRENDS] Response:', response);
      return response as TrendInsights;
    } catch (error) {
      console.error('❌ [CLAUDE-COMPARISON] OpenAI trends failed:', error);
      return {
        trendKeywords: ['fashion', 'style'],
        searchOptimization: [item.name],
        alternativeBrands: [],
        pricePoint: 'mid-range'
      };
    }
  }

  /**
   * Generate enhanced search queries using all gathered insights
   */
  private async generateEnhancedQueries(
    item: any,
    visualAnalysis?: VisualAnalysis,
    trendInsights?: TrendInsights
  ): Promise<Pick<SearchQueries, 'exactMatch' | 'similarItems'>> {
    const queryParts: string[] = [];
    
    // Start with brand for exact match
    if (item.brand) {
      queryParts.push(item.brand);
    }
    
    // Add visual details if available
    if (visualAnalysis) {
      if (visualAnalysis.color && visualAnalysis.color !== 'unknown') {
        queryParts.push(visualAnalysis.color);
      }
      if (visualAnalysis.style && visualAnalysis.style !== 'unknown') {
        queryParts.push(visualAnalysis.style);
      }
      if (visualAnalysis.material) {
        queryParts.push(visualAnalysis.material);
      }
      if (visualAnalysis.pattern && visualAnalysis.pattern !== 'solid') {
        queryParts.push(visualAnalysis.pattern);
      }
      queryParts.push(visualAnalysis.category);
    } else {
      // Fallback to item name
      queryParts.push(item.name);
    }
    
    const exactMatch = queryParts.join(' ');
    
    // Build similar items queries using trends and visual details
    const similarItems: string[] = [];
    
    if (visualAnalysis && trendInsights) {
      // Query 1: Color + style + category without brand
      similarItems.push(
        `${visualAnalysis.color} ${visualAnalysis.style} ${visualAnalysis.category}`
      );
      
      // Query 2: Alternative brands with same style
      if (trendInsights.alternativeBrands.length > 0) {
        similarItems.push(
          `${trendInsights.alternativeBrands[0]} ${visualAnalysis.color} ${visualAnalysis.category}`
        );
      }
      
      // Query 3: Trend keywords + visual details
      if (trendInsights.trendKeywords.length > 0) {
        similarItems.push(
          `${trendInsights.trendKeywords[0]} ${visualAnalysis.color} ${visualAnalysis.style} ${visualAnalysis.category}`
        );
      }
    } else {
      // Fallback similar queries
      similarItems.push(`similar to ${item.name}`);
      similarItems.push(`${item.category || 'fashion'} alternative`);
      similarItems.push(`budget ${item.name}`);
    }
    
    console.log('🎯 [CLAUDE-COMPARISON] Enhanced queries generated:');
    console.log('  Exact match:', exactMatch);
    console.log('  Similar items:', similarItems);
    
    return {
      exactMatch,
      similarItems: similarItems.slice(0, 3)
    };
  }

  /**
   * Convert image URL to base64
   */
  private async imageToBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ [CLAUDE-COMPARISON] Image conversion failed:', error);
      throw error;
    }
  }
}

export default new ClaudeComparisonService();
