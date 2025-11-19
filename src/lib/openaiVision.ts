/**
 * OpenAI Vision Helper
 * Provides utility functions for GPT-4o Vision API calls
 */

interface VisionMessage {
  role: 'system' | 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
      detail?: 'low' | 'high' | 'auto';
    };
  }>;
}

interface VisionOptions {
  model?: 'gpt-4o' | 'gpt-4o-mini';
  temperature?: number;
  maxTokens?: number;
  detail?: 'low' | 'high' | 'auto';
  systemMessage?: string;
}

/**
 * Call OpenAI Vision API with an image and text prompt
 */
export async function analyzeImage(
  imageDataUrl: string,
  prompt: string,
  options?: VisionOptions
): Promise<string> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || 
                    import.meta.env.OPENAI_API_KEY;

  if (!openaiKey) {
    console.warn('⚠️ [OPENAI-VISION] API key not configured');
    throw new Error('OpenAI API key not configured - set VITE_OPENAI_API_KEY');
  }

  try {
    const messages: VisionMessage[] = [];

    // Add system message if provided
    if (options?.systemMessage) {
      messages.push({
        role: 'system',
        content: [{ type: 'text', text: options.systemMessage }]
      });
    }

    // Add user message with image and prompt
    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: imageDataUrl,
            detail: options?.detail || 'low' // 'low' is cheaper and faster
          }
        },
        {
          type: 'text',
          text: prompt
        }
      ]
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4o-mini',
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI Vision API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI Vision API');
    }

    return content;

  } catch (error: any) {
    console.error('❌ [OPENAI-VISION] Error:', error.message);
    throw new Error(`OpenAI Vision API error: ${error.message}`);
  }
}

/**
 * Analyze image and return JSON response
 */
export async function analyzeImageJSON<T = any>(
  imageDataUrl: string,
  prompt: string,
  options?: VisionOptions
): Promise<T> {
  try {
    const systemPrompt = options?.systemMessage
      ? `${options.systemMessage}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation, just raw JSON.`
      : 'Respond ONLY with valid JSON. No markdown, no explanation, just raw JSON.';

    const response = await analyzeImage(imageDataUrl, prompt, {
      ...options,
      systemMessage: systemPrompt
    });

    // Clean up markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    return JSON.parse(cleanedResponse) as T;

  } catch (error: any) {
    console.error('❌ [OPENAI-VISION] JSON parsing error:', error.message);
    throw new Error(`Failed to get valid JSON from OpenAI Vision: ${error.message}`);
  }
}

/**
 * Convert base64 image to data URL format for OpenAI
 */
export function base64ToDataUrl(base64: string, mediaType: string = 'image/jpeg'): string {
  // If already a data URL, return as-is
  if (base64.startsWith('data:')) {
    return base64;
  }
  
  // Otherwise, create data URL
  return `data:${mediaType};base64,${base64}`;
}

/**
 * Resize and compress image for OpenAI Vision API
 * OpenAI has different pricing based on image size
 */
export async function optimizeImageForVision(
  imageUrl: string,
  targetDetail: 'low' | 'high' = 'low'
): Promise<string> {
  // For 'low' detail: resize to max 512px (cheapest)
  // For 'high' detail: resize to max 2048px (better quality)
  const maxSize = targetDetail === 'low' ? 512 : 2048;

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    // Calculate new dimensions
    if (width > height && width > maxSize) {
      height = (height * maxSize) / width;
      width = maxSize;
    } else if (height > maxSize) {
      width = (width * maxSize) / height;
      height = maxSize;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(img, 0, 0, width, height);

    // Convert to base64 JPEG (smaller file size)
    return canvas.toDataURL('image/jpeg', 0.85);

  } catch (error) {
    console.warn('⚠️ [OPENAI-VISION] Image optimization failed, using original:', error);
    return imageUrl;
  }
}

export default {
  analyzeImage,
  analyzeImageJSON,
  base64ToDataUrl,
  optimizeImageForVision
};
