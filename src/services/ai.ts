import OpenAI from 'openai';
import { AppSettings, PDFBatch } from '../types';

/**
 * Creates and configures an OpenAI client instance for Cerebras API.
 * @param apiKey - The user's Cerebras API key.
 * @returns A configured OpenAI client.
 */
const createCerebrasClient = (apiKey: string): OpenAI => {
  return new OpenAI({
    baseURL: "https://api.cerebras.ai/v1",
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Required for client-side usage
  });
};

/**
 * Processes a single PDF batch using the Cerebras API with a fallback model strategy.
 *
 * @param batch - The PDF batch to process.
 * @param settings - The application settings containing API keys and model preferences.
 * @returns The processed text and the model that was successfully used.
 * @throws An error if all models in the priority list fail.
 */
export const processBatchWithAI = async (
  batch: PDFBatch,
  settings: AppSettings
): Promise<{ text: string; modelUsed: string }> => {
  const { apiKey, modelPriority, systemPrompt, textTransformPrompt, temperature, maxOutputTokens } = settings;

  if (!apiKey) {
    throw new Error("Cerebras API key is not configured.");
  }

  const client = createCerebrasClient(apiKey);
  const fullPrompt = textTransformPrompt.replace('{TEXT_CHUNK}', batch.textContent);

  let lastError: any = null;

  for (const model of modelPriority) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullPrompt },
        ],
        temperature,
        max_tokens: maxOutputTokens,
      });

      const transformedText = completion.choices[0]?.message?.content?.trim();

      if (!transformedText) {
        throw new Error("Received an empty response from the AI model.");
      }

      return { text: transformedText, modelUsed: model };

    } catch (error: any) {
      lastError = error;
      console.warn(`Model ${model} failed:`, error.message);
      // Optional: Add a small delay before trying the next model
      await new Promise(res => setTimeout(res, 500));
    }
  }

  // If all models have failed, throw the last captured error
  throw new Error(`All AI models failed. Last error: ${lastError?.message || 'Unknown error'}`);
};
