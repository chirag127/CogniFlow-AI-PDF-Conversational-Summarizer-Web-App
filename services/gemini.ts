import { AppSettings, PDFBatch, ProcessLog } from '../types';
import { addLog } from './storage';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export const listModels = async (apiKey: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}/models?key=${apiKey}`);
    if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
    return await response.json();
  } catch (error: any) {
    console.error("Model fetch error", error);
    throw error;
  }
};

interface GenerationResult {
  text: string;
  modelUsed: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const processBatchWithGemini = async (
  batch: PDFBatch,
  settings: AppSettings,
  retryCount = 0
): Promise<GenerationResult> => {
  const { modelPriority, apiKey, backupApiKey, systemPrompt, textTransformPrompt } = settings;
  
  // Key Rotation
  let currentKey = apiKey;
  // Logic: if retrying and we have a backup, potentially switch? 
  // For simplicity, we stick to primary unless 429/403 explicitly triggers a switch logic, 
  // but here we will just use primary unless empty, then backup.
  if (!currentKey && backupApiKey) currentKey = backupApiKey;

  // Construct Prompt
  // If batch has images, we use the multimodal payload
  const parts: any[] = [];
  
  // Add text content
  if (batch.originalText) {
    parts.push({ text: `${textTransformPrompt}\n\n---\n\nSOURCE TEXT:\n${batch.originalText}` });
  }

  // Add images (if any)
  if (batch.images && batch.images.length > 0) {
    batch.images.forEach(b64 => {
       // Gemini API expects base64 without the data prefix
       const cleanB64 = b64.split(',')[1] || b64;
       parts.push({
         inline_data: {
           mime_type: "image/jpeg", // Assuming converted to JPEG during extraction
           data: cleanB64
         }
       });
    });
  }

  // Try models in order
  for (const modelName of modelPriority) {
    const fullModelName = modelName.includes('/') ? modelName : `models/${modelName}`;
    const url = `${BASE_URL}/${fullModelName}:generateContent?key=${currentKey}`;

    const payload = {
      contents: [{ parts }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: settings.temperature,
        topP: settings.topP,
        topK: settings.topK,
        maxOutputTokens: settings.maxOutputTokens,
      }
    };

    try {
        await addLog({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            level: 'info',
            message: `Sending Batch ${batch.id} to ${modelName}`,
            batchIndex: batch.id
        });

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(settings.apiTimeout * 1000)
      });

      if (response.status === 429) {
        // Rate Limit
        throw new Error("RATE_LIMIT");
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        // Safety filter or empty response
        throw new Error("Blocked by safety settings or empty response");
      }

      const resultText = data.candidates[0].content.parts[0].text;
      
      return { text: resultText, modelUsed: modelName };

    } catch (error: any) {
      const isRateLimit = error.message === "RATE_LIMIT" || error.message.includes("429");
      
      await addLog({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level: 'warn',
        message: `Failed Batch ${batch.id} on ${modelName}: ${error.message}`,
        batchIndex: batch.id
      });

      // If rate limit and we have a backup key, try that immediately on same model? 
      // Or just backoff?
      if (isRateLimit) {
        if (backupApiKey && currentKey !== backupApiKey) {
           currentKey = backupApiKey; // Switch key for next loop iteration
           // Actually, we should probably retry this loop iteration with new key?
           // For now, let's just let it fall through to next model or retry logic.
        }
        await delay(settings.rateLimitDelay);
      } else {
        // Other error, try next model
        continue; 
      }
    }
  }

  // If we exhausted models, check retries
  if (retryCount < settings.maxRetries) {
    const backoff = settings.retryDelay * Math.pow(2, retryCount);
    await addLog({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level: 'warn',
        message: `All models failed for Batch ${batch.id}. Retrying in ${backoff}ms (Attempt ${retryCount + 1}/${settings.maxRetries})`,
        batchIndex: batch.id
    });
    await delay(backoff);
    return processBatchWithGemini(batch, settings, retryCount + 1);
  }

  throw new Error(`Batch ${batch.id} failed after ${settings.maxRetries} retries on all models.`);
};