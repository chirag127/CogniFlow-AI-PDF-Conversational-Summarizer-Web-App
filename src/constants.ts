import { AppSettings, ModelInfo } from './types';

/**
 * Defines the available Cerebras models for the application.
 * Follows the fallback cascade specified in AGENTS.md.
 */
export const CEREBRAS_MODELS: ModelInfo[] = [
  { name: 'zai-glm-4.6', displayName: 'Zai GLM 4.6 (357B)', description: 'Tier 1: Frontier Intelligence' },
  { name: 'qwen-3-235b-a22b-instruct-2507', displayName: 'Qwen-3 235B', description: 'Tier 2: Heavy Reasoning' },
  { name: 'gpt-oss-120b', displayName: 'GPT-OSS (120B)', description: 'Tier 3: General Purpose' },
  { name: 'llama-3.3-70b', displayName: 'Llama 3.3 (70B)', description: 'Tier 4: Balanced Workhorse' },
  { name: 'qwen-3-32b', displayName: 'Qwen-3 (32B)', description: 'Tier 5: Fast Inference' },
  { name: 'llama3.1-8b', displayName: 'Llama 3.1 (8B)', description: 'Tier 6: Ultra-Fast/Instant' },
];

/**
 * Default application settings.
 * Tuned for the Cerebras API and the application's purpose.
 */
export const DEFAULT_SETTINGS: AppSettings = {
  // --- API & Model Configuration ---
  apiKey: '',
  modelPriority: [
    'zai-glm-4.6',
    'qwen-3-235b-a22b-instruct-2507',
    'llama-3.3-70b',
  ],
  // --- Processing & Concurrency ---
  turboMode: true,
  parallelChunks: 5, // Safe limit for free tier
  batchSize: 12000, // Token size for each chunk sent to the API
  overlapSize: 500, // Token overlap between chunks to maintain context
  // --- Reliability ---
  maxRetries: 3,
  retryDelay: 2000, // Initial delay for exponential backoff
  // --- AI Parameters ---
  temperature: 0.7, // Balances creativity and determinism
  maxOutputTokens: 32768, // Cerebras free tier limit
  // --- Prompt Engineering ---
  systemPrompt: `You are an AI assistant specializing in transforming complex PDF documents into clear, accessible, and conversational text suitable for Text-to-Speech (TTS) systems. Your primary goal is to make technical or dense information easy to understand for a listening audience.
Key Directives:
- Simplify complex sentences without losing the core meaning.
- Expand all acronyms upon their first use.
- Convert tables, charts, and diagrams into descriptive narrative summaries.
- Describe the purpose and logic of code blocks in plain English; do not read the code itself.
- Translate mathematical formulas into spoken words (e.g., "E equals m c squared").
- Maintain a logical flow and use natural transitions.
- Remove citations, footnotes, and metadata.
- Ensure the final output is well-structured for listening, with clear paragraphs and pauses.`,
  textTransformPrompt: `Based on the system instructions, transform the following text chunk into a clear, conversational, and TTS-friendly format.
--- TEXT CHUNK START ---
{TEXT_CHUNK}
--- TEXT CHUNK END ---
Your transformed output must be clean, easy to read aloud, and contain only the processed text.`,
  // --- PDF Generation ---
  pdfFontSize: 12,
  pdfLineHeight: 1.5,
  pdfMargin: 25, // Generous margin for readability
};

/**
 * IndexedDB configuration constants.
 */
export const DB_NAME = 'CogniFlowDB';
export const DB_VERSION = 2; // Incremented due to schema changes/updates
export const STORE_LOGS = 'process_logs';
export const STORE_BATCHES = 'pdf_batches';
export const STORE_SETTINGS = 'app_settings';
