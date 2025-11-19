/**
 * Claude Vision Stylist Service
 * Analyzes clothing/outfit photos for styling advice
 */

export interface ImageAnalysis {
  description: string;
  colors: string[];
  style: string;
  items: string[];
  suggestions: string[];
  occasion: string;
}

class ClaudeVisionStylistService {
  
  /**
   * Analyze clothing/outfit image with Claude Vision
   */
  async analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
    console.log('👁️ [CLAUDE-VISION] Analyzing image...');
    
    try {
      const response = await fetch('/api/claude-vision-stylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          analysisType: 'styling'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [CLAUDE-VISION] Image analyzed');
      
      return data.analysis;
      
    } catch (error) {
      console.error('❌ [CLAUDE-VISION] Error:', error);
      throw error;
    }
  }
  
  /**
   * Analyze multiple images at once
   */
  async analyzeMultipleImages(imageUrls: string[]): Promise<ImageAnalysis> {
    console.log(`👁️ [CLAUDE-VISION] Analyzing ${imageUrls.length} images...`);
    
    try {
      const response = await fetch('/api/claude-vision-stylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls,
          analysisType: 'styling'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [CLAUDE-VISION] Images analyzed');
      
      return data.analysis;
      
    } catch (error) {
      console.error('❌ [CLAUDE-VISION] Error:', error);
      throw error;
    }
  }
}

export default new ClaudeVisionStylistService();
