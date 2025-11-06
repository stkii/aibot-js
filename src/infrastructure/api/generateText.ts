import { openai } from '@ai-sdk/openai';
import type { LanguageModelUsage } from 'ai';
import { generateText } from 'ai';

/**
 * Generate text using OpenAI API
 * @param model - OpenAI model identifier (e.g., 'gpt-5')
 * @param prompt - Input text to generate from
 * @param maxTokens - Maximum number of tokens to generate
 * @param system - Optional system message to define behavior
 * @param temperature - Optional sampling temperature (0-2), controls randomness
 * @param topP - Optional nucleus sampling parameter
 * @param topK - Optional top-k sampling parameter
 * @returns Promise containing generated text and token usage information
 */
export async function generateOpenAIText(
  model: string,
  prompt: string,
  maxTokens: number,
  system?: string,
  temperature?: number,
  topP?: number,
  topK?: number
): Promise<{ text: string; token: LanguageModelUsage }> {
  const res = await generateText({
    model: openai(model), // use OpenAI Responses API
    prompt: prompt,
    maxOutputTokens: maxTokens,
    ...(system !== undefined && { system }),
    ...(temperature !== undefined && { temperature }),
    ...(topP !== undefined && { topP }),
    ...(topK !== undefined && { topK }),
  });

  // Get generated text and token usage
  return { text: res.text, token: res.usage };
}
