/**
 * OpenAI Helper - Fetch-based implementation
 * Uses direct API calls instead of SDK to avoid browser initialization issues
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Get OpenAI API key from environment
 */
function getApiKey(): string {
  const key = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
  
  if (!key) {
    console.warn('⚠️ [OPENAI] API key not configured');
    throw new Error('OpenAI API key not configured - set VITE_OPENAI_API_KEY');
  }
  
  return key;
}

/**
 * Get a response from ChatGPT
 */
export async function getChatGPTResponse(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemMessage?: string;
  }
): Promise<string> {
  try {
    const apiKey = getApiKey();
    const messages: ChatMessage[] = [];

    // Add system message if provided
    if (options?.systemMessage) {
      messages.push({
        role: 'system',
        content: options.systemMessage
      });
    }

    // Add user prompt
    messages.push({
      role: 'user',
      content: prompt
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-4o',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from ChatGPT');
    }

    return content;

  } catch (error: any) {
    console.error('❌ [OPENAI] ChatGPT Error:', error.message);
    throw new Error(`ChatGPT API error: ${error.message}`);
  }
}

/**
 * Get structured JSON response from ChatGPT
 */
export async function getChatGPTJSON<T = any>(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    systemMessage?: string;
  }
): Promise<T> {
  try {
    const response = await getChatGPTResponse(prompt, {
      ...options,
      systemMessage: options?.systemMessage 
        ? `${options.systemMessage}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation, just raw JSON.`
        : 'Respond ONLY with valid JSON. No markdown, no explanation, just raw JSON.'
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
    console.error('❌ [OPENAI] ChatGPT JSON parsing error:', error.message);
    throw new Error(`Failed to get valid JSON from ChatGPT: ${error.message}`);
  }
}
