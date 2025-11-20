/**
 * OpenAI Image Curator Service
 * Uses GPT-4 to curate, filter, and rank fashion images
 * Filters by gender, removes duplicates, ranks by relevance
 */

import { CuratedImage } from './fashionImageCurationService';

export interface ImageCurationResult {
  selectedImages: CuratedImage[];
  rankings: {
    imageId: string;
    score: number;
    reasoning: string;
  }[];
  rejected: {
    imageId: string;
    reason: string;
  }[];
}

class OpenAIImageCurator {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  /**
   * Curate images using GPT-4
   * Filters by gender, removes duplicates, ranks by relevance
   */
  async curateImages(
    candidates: CuratedImage[],
    userGender: string,
    stylePersona: string,
    purpose: 'style-steal' | 'trend'
  ): Promise<ImageCurationResult> {
    try {
      console.log(`✨ [OPENAI] Curating ${candidates.length} images for ${purpose}...`);

      if (candidates.length === 0) {
        return {
          selectedImages: [],
          rankings: [],
          rejected: []
        };
      }

      // For small sets, do basic filtering without API
      if (candidates.length <= 4) {
        return this.basicCuration(candidates, userGender, purpose);
      }

      const prompt = this.buildCurationPrompt(candidates, userGender, stylePersona, purpose);
      const response = await this.callOpenAI(prompt);
      const result = this.parseImageSelections(response, candidates);

      console.log(`✅ [OPENAI] Selected ${result.selectedImages.length} images`);
      
      return result;
    } catch (error) {
      console.error('❌ [OPENAI] Error curating images:', error);
      
      // Fallback to basic curation
      return this.basicCuration(candidates, userGender, purpose);
    }
  }

  /**
   * Build curation prompt for GPT-4
   */
  private buildCurationPrompt(
    candidates: CuratedImage[],
    userGender: string,
    stylePersona: string,
    purpose: string
  ): string {
    const targetCount = purpose === 'style-steal' ? 6 : 4;
    const genderFilter = userGender === 'women' ? 'womens fashion' : userGender === 'men' ? 'mens fashion' : 'unisex fashion';

    // Create image descriptions for analysis
    const imageDescriptions = candidates.map((img, idx) => {
      return `${idx}: ${img.description || 'fashion outfit'} (id: ${img.id})`;
    }).join('\n');

    return `You are a fashion image curator selecting outfit inspiration photos.

USER CONTEXT:
- Gender: ${userGender}
- Target Fashion: ${genderFilter}
- Style Persona: ${stylePersona}
- Purpose: ${purpose === 'style-steal' ? 'Everyday wearable outfit inspiration' : 'Trend showcase'}

CANDIDATE IMAGES (${candidates.length} total):
${imageDescriptions}

TASK:
1. **Gender Filter**: Remove images showing ${userGender === 'women' ? 'mens fashion/menswear' : userGender === 'men' ? 'womens fashion/womenswear' : 'nothing'}
   - Look for keywords like "man", "men", "male", "guy" OR "woman", "women", "female", "girl"
   - Be strict: reject if gender doesn't match
   
2. **Duplicate Detection**: Remove similar/duplicate images
   - Same outfit style
   - Same color palette
   - Similar composition
   
3. **Relevance Ranking**: Rank remaining images by:
   - Gender appropriateness (CRITICAL - must match ${genderFilter})
   - Trend relevance (2024 fashion trends)
   - Wearability (can user recreate this look?)
   - Visual appeal and quality
   - Match to style persona: "${stylePersona}"

4. **Selection**: Return top ${targetCount} images

OUTPUT FORMAT (valid JSON only, no markdown):
{
  "selected": ["imageId1", "imageId2", ...],
  "rankings": [
    {"imageId": "xyz", "score": 95, "reasoning": "Perfect match"},
    ...
  ],
  "rejected": [
    {"imageId": "abc", "reason": "Shows menswear"}
  ]
}

Be strict on gender matching. When in doubt about gender, reject the image.`;
  }

  /**
   * Call OpenAI GPT-4 API
   */
  private async callOpenAI(prompt: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse OpenAI response and select images
   */
  private parseImageSelections(
    responseText: string,
    candidates: CuratedImage[]
  ): ImageCurationResult {
    try {
      // Remove markdown code blocks if present
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanedText);

      // Map selected IDs to actual images
      const selectedIds = parsed.selected || [];
      const selectedImages = selectedIds
        .map((id: string) => candidates.find(img => img.id === id))
        .filter(Boolean) as CuratedImage[];

      return {
        selectedImages,
        rankings: parsed.rankings || [],
        rejected: parsed.rejected || []
      };
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.log('Raw response:', responseText);
      throw error;
    }
  }

  /**
   * Basic curation without API (fallback)
   */
  private basicCuration(
    candidates: CuratedImage[],
    userGender: string,
    purpose: string
  ): ImageCurationResult {
    console.log('⚠️ [OPENAI] Using basic curation fallback');

    const targetCount = purpose === 'style-steal' ? 6 : 4;

    // Basic gender filtering by keywords in description
    const genderKeywords = {
      women: ['woman', 'women', 'female', 'girl', 'lady', 'womens'],
      men: ['man', 'men', 'male', 'guy', 'mens']
    };

    const filtered = candidates.filter(img => {
      const desc = (img.description || '').toLowerCase();
      
      if (userGender === 'women') {
        // Reject if it mentions men/male
        const hasMaleKeywords = genderKeywords.men.some(kw => desc.includes(kw));
        return !hasMaleKeywords;
      } else if (userGender === 'men') {
        // Reject if it mentions women/female
        const hasFemaleKeywords = genderKeywords.women.some(kw => desc.includes(kw));
        return !hasFemaleKeywords;
      }
      
      return true; // unisex - accept all
    });

    // Remove exact duplicates by ID
    const uniqueImages = filtered.filter((img, idx, arr) => 
      arr.findIndex(i => i.id === img.id) === idx
    );

    // Take first N images
    const selected = uniqueImages.slice(0, targetCount);

    return {
      selectedImages: selected,
      rankings: selected.map((img, idx) => ({
        imageId: img.id,
        score: 80 - (idx * 5),
        reasoning: 'Basic filtering applied'
      })),
      rejected: candidates
        .filter(img => !selected.find(s => s.id === img.id))
        .map(img => ({
          imageId: img.id,
          reason: 'Not selected in basic filtering'
        }))
    };
  }

  /**
   * Remove duplicate images (standalone method)
   */
  async removeDuplicates(images: CuratedImage[]): Promise<CuratedImage[]> {
    // For now, just remove exact ID duplicates
    // Could be enhanced with GPT-4 Vision in the future
    return images.filter((img, idx, arr) => 
      arr.findIndex(i => i.id === img.id) === idx
    );
  }
}

// Export singleton instance
const openaiImageCurator = new OpenAIImageCurator();
export default openaiImageCurator;
