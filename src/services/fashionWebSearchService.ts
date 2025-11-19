/**
 * Fashion Web Search Service
 * Uses SerpAPI to search for current fashion trends, styling tips, and advice
 */

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

class FashionWebSearchService {
  
  /**
   * Search web for fashion advice
   */
  async searchFashionAdvice(query: string): Promise<WebSearchResult[]> {
    console.log('🔍 [WEB-SEARCH] Searching for:', query);
    
    try {
      // Call backend API that uses SerpAPI
      const response = await fetch('/api/fashion-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query + ' fashion style advice 2025'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ [WEB-SEARCH] Found ${data.results?.length || 0} results`);
      
      return data.results || [];
      
    } catch (error) {
      console.error('❌ [WEB-SEARCH] Error:', error);
      return [];
    }
  }
  
  /**
   * Extract fashion-related keywords from question
   */
  extractKeywords(question: string): string | null {
    const lowerQuestion = question.toLowerCase();
    
    // Specific event keywords
    if (lowerQuestion.includes('wedding')) return 'wedding guest outfit';
    if (lowerQuestion.includes('interview')) return 'job interview outfit';
    if (lowerQuestion.includes('date')) return 'date night outfit ideas';
    if (lowerQuestion.includes('party')) return 'party outfit ideas';
    if (lowerQuestion.includes('beach')) return 'beach outfit styling';
    if (lowerQuestion.includes('formal')) return 'formal attire styling';
    if (lowerQuestion.includes('casual')) return 'casual outfit ideas';
    
    // Item-specific keywords
    if (lowerQuestion.includes('boots')) return 'how to style boots';
    if (lowerQuestion.includes('jeans')) return 'how to style jeans';
    if (lowerQuestion.includes('dress')) return 'dress styling tips';
    if (lowerQuestion.includes('blazer')) return 'blazer outfit ideas';
    
    // General fashion keywords
    if (lowerQuestion.includes('pack')) return 'packing tips outfit planning';
    if (lowerQuestion.includes('color')) return 'color coordination fashion';
    if (lowerQuestion.includes('capsule')) return 'capsule wardrobe essentials';
    if (lowerQuestion.includes('missing')) return 'wardrobe essentials checklist';
    
    // If no specific keywords, return null (don't search)
    return null;
  }
  
  /**
   * Determine if question would benefit from web search
   */
  shouldSearchWeb(question: string): boolean {
    return this.extractKeywords(question) !== null;
  }
}

export default new FashionWebSearchService();
