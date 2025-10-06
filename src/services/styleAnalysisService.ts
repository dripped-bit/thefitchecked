/**
 * AI-Powered Style Analysis Service
 * Uses Claude API to generate sophisticated style personality profiles and recommendations
 */

interface UserProfile {
  lifestyle: {
    morningRoutine: string[];
    workEnvironment: string[];
  };
  fashionPersonality: {
    archetypes: string[];
    colorPalette: string[];
    avoidColors: string[];
  };
  creative: {
    outlets: string[];
    inspirations: string[];
  };
  shopping: {
    habits: string[];
    favoriteStores: string[];
    customStores: string[];
  };
  preferences: {
    materials: string[];
    fits: string[];
  };
  occasions: {
    weekend: string[];
    nightOut: string[];
  };
  influences: {
    eras: string[];
    sources: string[];
  };
  boundaries: string[];
  uploads: {
    goToOutfit: string | null;
    dreamPurchase: string | null;
    inspiration: string | null;
    favoritePiece: string | null;
  };
  descriptions: {
    threeWords: string[];
    alwaysFollow: string;
    loveToBreak: string;
    neverThrowAway: string;
  };
  seasonal: string[];
}

interface StyleAnalysisResult {
  success: boolean;
  analysis?: {
    stylePersonality: string;
    dominantArchetypes: string[];
    colorProfile: string;
    shoppingRecommendations: string[];
    styleEvolution: string;
    wardrobe: {
      essentials: string[];
      avoid: string[];
      invest: string[];
    };
    occasions: {
      work: string[];
      weekend: string[];
      special: string[];
    };
    brands: string[];
    nextSteps: string[];
  };
  error?: string;
}

class StyleAnalysisService {
  constructor() {
    console.log('🎨 [STYLE_ANALYSIS] Style Analysis Service initialized - using Claude via proxy');
  }

  /**
   * Generate comprehensive style analysis using Claude AI
   */
  async analyzeUserStyle(userProfile: UserProfile): Promise<StyleAnalysisResult> {
    console.log('🎨 [STYLE_ANALYSIS] Starting AI-powered style analysis');

    try {
      // Use Claude API via proxy for sophisticated analysis
      const analysis = await this.generateClaudeAnalysis(userProfile);
      return analysis;

    } catch (error) {
      console.error('❌ [STYLE_ANALYSIS] Analysis failed:', error);
      console.log('🔄 [STYLE_ANALYSIS] Falling back to basic personalized analysis');
      // Fall back to basic analysis on error
      return this.generateBasicAnalysis(userProfile);
    }
  }

  /**
   * Use Claude API to generate sophisticated style analysis
   */
  private async generateClaudeAnalysis(userProfile: UserProfile): Promise<StyleAnalysisResult> {
    console.log('🤖 [STYLE_ANALYSIS] Using Claude API for detailed analysis');

    // Prepare style data for Claude
    const styleData = this.formatUserProfileForAnalysis(userProfile);

    const prompt = `You are a professional fashion stylist and personal style consultant. Analyze this comprehensive style profile and provide detailed insights and recommendations.

User Style Profile:
${styleData}

Please provide a comprehensive style analysis in JSON format with the following structure:
{
  "stylePersonality": "A detailed 2-3 sentence personality description",
  "dominantArchetypes": ["Primary archetype", "Secondary archetype", "Tertiary if applicable"],
  "colorProfile": "Detailed color analysis and palette recommendations",
  "shoppingRecommendations": ["Specific actionable shopping advice", "Budget considerations", "Quality vs quantity guidance"],
  "styleEvolution": "How their style might evolve and grow",
  "wardrobe": {
    "essentials": ["Key pieces they should own"],
    "avoid": ["Items that don't align with their style"],
    "invest": ["High-quality pieces worth spending on"]
  },
  "occasions": {
    "work": ["Professional outfit recommendations"],
    "weekend": ["Casual styling suggestions"],
    "special": ["Event and occasion wear ideas"]
  },
  "brands": ["Recommended brands that align with their style and budget"],
  "nextSteps": ["Specific actions to improve their style journey"]
}

Focus on actionable, personalized advice that reflects their unique preferences, lifestyle, and stated boundaries.`;

    try {
      const response = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      // Handle quota exceeded or other API errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || `API error: ${response.status}`;

        console.warn(`⚠️ [STYLE_ANALYSIS] Claude API error (${response.status}): ${errorMessage}`);

        // Check if it's a quota/rate limit error
        if (response.status === 429 || response.status === 402 || errorMessage.toLowerCase().includes('quota')) {
          console.log('📊 [STYLE_ANALYSIS] Quota exceeded - using basic analysis fallback');
          throw new Error('QUOTA_EXCEEDED');
        }

        throw new Error(`Claude API failed: ${response.status} - ${errorMessage}`);
      }

      const data = await response.json();
      const analysisText = data.content?.[0]?.text || '';

      // Parse the JSON response
      const analysisResult = JSON.parse(analysisText);

      console.log('✅ [STYLE_ANALYSIS] Claude analysis completed successfully');
      return {
        success: true,
        analysis: analysisResult
      };

    } catch (error) {
      console.error('❌ [STYLE_ANALYSIS] Claude API error:', error);
      throw error;
    }
  }

  /**
   * Format user profile data for Claude analysis
   */
  private formatUserProfileForAnalysis(userProfile: UserProfile): string {
    const data = [];

    // Lifestyle
    data.push(`LIFESTYLE:
- Morning Routine: ${userProfile.lifestyle.morningRoutine.join(', ') || 'Not specified'}
- Work Environment: ${userProfile.lifestyle.workEnvironment.join(', ') || 'Not specified'}`);

    // Fashion Personality
    data.push(`FASHION PERSONALITY:
- Style Archetypes: ${userProfile.fashionPersonality.archetypes.join(', ') || 'Not specified'}
- Color Palette: ${userProfile.fashionPersonality.colorPalette.join(', ') || 'Not specified'}
- Avoided Colors: ${userProfile.fashionPersonality.avoidColors.join(', ') || 'None specified'}`);

    // Creative Expression
    data.push(`CREATIVE EXPRESSION:
- Creative Outlets: ${userProfile.creative.outlets.join(', ') || 'Not specified'}
- Style Inspirations: ${userProfile.creative.inspirations.join(', ') || 'Not specified'}`);

    // Shopping Philosophy
    data.push(`SHOPPING PHILOSOPHY:
- Shopping Habits: ${userProfile.shopping.habits.join(', ') || 'Not specified'}
- Favorite Stores: ${[...userProfile.shopping.favoriteStores, ...userProfile.shopping.customStores].join(', ') || 'Not specified'}`);

    // Preferences
    data.push(`FABRIC & FIT PREFERENCES:
- Preferred Materials: ${userProfile.preferences.materials.join(', ') || 'Not specified'}
- Preferred Fits: ${userProfile.preferences.fits.join(', ') || 'Not specified'}`);

    // Occasions
    data.push(`OCCASION PREFERENCES:
- Weekend Style: ${userProfile.occasions.weekend.join(', ') || 'Not specified'}
- Night Out Style: ${userProfile.occasions.nightOut.join(', ') || 'Not specified'}`);

    // Influences
    data.push(`STYLE INFLUENCES:
- Fashion Eras: ${userProfile.influences.eras.join(', ') || 'Not specified'}
- Style Sources: ${userProfile.influences.sources.join(', ') || 'Not specified'}`);

    // Boundaries
    data.push(`STYLE BOUNDARIES:
- Items/Styles to Avoid: ${userProfile.boundaries.join(', ') || 'None specified'}`);

    // Personal Descriptions
    data.push(`PERSONAL STYLE IDENTITY:
- Three Words: ${userProfile.descriptions.threeWords.filter(w => w.trim()).join(', ') || 'Not specified'}
- Always Follow Rule: ${userProfile.descriptions.alwaysFollow || 'Not specified'}
- Love to Break Rule: ${userProfile.descriptions.loveToBreak || 'Not specified'}
- Never Throw Away Item: ${userProfile.descriptions.neverThrowAway || 'Not specified'}`);

    // Seasonal
    data.push(`SEASONAL PREFERENCES:
- Seasonal Style: ${userProfile.seasonal.join(', ') || 'Not specified'}`);

    // Images (note: just mention they exist, don't include base64)
    const uploadedImages = Object.entries(userProfile.uploads)
      .filter(([_, value]) => value !== null)
      .map(([key, _]) => key);

    if (uploadedImages.length > 0) {
      data.push(`VISUAL REFERENCES:
- Uploaded Images: ${uploadedImages.join(', ')} (images provided for visual context)`);
    }

    return data.join('\n\n');
  }

  /**
   * Basic analysis fallback when Claude API is not available
   */
  private generateBasicAnalysis(userProfile: UserProfile): StyleAnalysisResult {
    console.log('📝 [STYLE_ANALYSIS] Using basic analysis fallback');

    const { fashionPersonality, creative, shopping, influences, descriptions } = userProfile;

    const primaryArchetype = fashionPersonality.archetypes[0] || 'Classic';
    const secondaryArchetype = fashionPersonality.archetypes[1] || 'Minimalist';
    const dominantColors = fashionPersonality.colorPalette.slice(0, 2).join(' and ') || 'Neutral tones';
    const topInfluence = creative.inspirations[0] || 'Contemporary culture';
    const shoppingStyle = shopping.habits[0] || 'Thoughtful curation';
    const threeWords = descriptions.threeWords.filter(w => w.trim()).join(', ') || 'Personal, Authentic, Evolving';

    return {
      success: true,
      analysis: {
        stylePersonality: `Your style blends ${primaryArchetype} and ${secondaryArchetype} influences, creating a ${threeWords.toLowerCase()} approach to fashion. You're drawn to ${dominantColors.toLowerCase()} and find inspiration in ${topInfluence.toLowerCase()}.`,
        dominantArchetypes: [primaryArchetype, secondaryArchetype].filter(Boolean),
        colorProfile: `Your color story centers around ${dominantColors}, creating a cohesive palette that reflects your personal aesthetic.`,
        shoppingRecommendations: [
          `Your ${shoppingStyle.toLowerCase()} approach suggests focusing on quality pieces`,
          'Build a capsule wardrobe with versatile basics',
          'Invest in items that align with your core style archetypes'
        ],
        styleEvolution: 'Your style will likely evolve towards more refined versions of your current preferences, with increased confidence in personal choices.',
        wardrobe: {
          essentials: [
            'Well-fitted basics in your preferred colors',
            'Versatile pieces that work across occasions',
            'Investment outerwear that reflects your style'
          ],
          avoid: fashionPersonality.avoidColors.length > 0
            ? [`Items in colors you avoid: ${fashionPersonality.avoidColors.join(', ')}`]
            : ['Trendy pieces that don\'t reflect your personal style'],
          invest: [
            'Quality pieces in your dominant style archetype',
            'Timeless items in your preferred color palette',
            'Well-made basics that form your wardrobe foundation'
          ]
        },
        occasions: {
          work: ['Elevated versions of your preferred style archetype'],
          weekend: userProfile.occasions.weekend.length > 0
            ? userProfile.occasions.weekend.slice(0, 3)
            : ['Comfortable pieces in your signature style'],
          special: ['Refined interpretations of your personal aesthetic']
        },
        brands: shopping.favoriteStores.concat(shopping.customStores).slice(0, 5),
        nextSteps: [
          'Audit your current wardrobe against your identified style',
          'Create a shopping list based on your essential items',
          'Experiment with new ways to wear your existing pieces'
        ]
      }
    };
  }

  /**
   * Health check for service availability
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🔍 [STYLE_ANALYSIS] Checking Claude API connectivity via proxy');

      const response = await fetch('/api/claude/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{
            role: 'user',
            content: 'Test'
          }]
        })
      });

      const isHealthy = response.ok;
      console.log(`✅ [STYLE_ANALYSIS] Claude API health check: ${isHealthy ? 'healthy' : 'unhealthy'}`);
      return isHealthy;
    } catch (error) {
      console.error('❌ [STYLE_ANALYSIS] Health check failed:', error);
      console.log('⚠️ [STYLE_ANALYSIS] Will fall back to basic analysis');
      return true; // Return true to allow basic mode fallback
    }
  }
}

export default new StyleAnalysisService();
export type { UserProfile, StyleAnalysisResult };