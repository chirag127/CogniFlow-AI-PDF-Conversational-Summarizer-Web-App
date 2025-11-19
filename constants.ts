import { AppSettings, ModelInfo } from './types';

export const DEFAULT_MODELS: ModelInfo[] = [
  {
    name: "models/gemini-2.0-flash",
    version: "001",
    displayName: "Gemini 2.0 Flash",
    description: "Fastest, multimodal, efficient.",
    inputModalities: ["text", "image"],
    outputModalities: ["text"]
  },
  {
    name: "models/gemini-1.5-flash",
    version: "002",
    displayName: "Gemini 1.5 Flash",
    description: "Reliable, high-throughput.",
    inputModalities: ["text", "image"],
    outputModalities: ["text"]
  },
  {
    name: "models/gemini-1.5-pro",
    version: "002",
    displayName: "Gemini 1.5 Pro",
    description: "Complex reasoning, larger context.",
    inputModalities: ["text", "image"],
    outputModalities: ["text"]
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  backupApiKey: '',
  apiTimeout: 60,
  turboMode: false,
  parallelChunks: 3,
  autoRetry: true,
  batchSize: 10000, // approx tokens
  overlapSize: 200,
  maxRetries: 3,
  retryDelay: 2000,
  rateLimitDelay: 1000,
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  inputLanguage: 'English',
  outputLanguage: 'English',
  
  pdfFontSize: 12,
  pdfLineHeight: 1.5,
  pdfMargin: 20,
  pdfFontFamily: 'Times',
  addPageNumbers: true,
  generateTOC: true,

  modelPriority: [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ],

  systemPrompt: "You are an expert at converting technical documentation into natural, spoken language optimized for text-to-speech systems.",
  textTransformPrompt: "Convert the following text into a natural, spoken format that is easy to listen to. Maintain accuracy while making it conversational. Expand acronyms on first use. Convert formulas and special symbols into spoken words. Convert tables into narrative sentences. Describe figures and images clearly. Replace code blocks with descriptive explanations of what the code does (do not read code line-by-line). Preserve the logical order and headings. Add natural transitions between sections. Remove inline citations and footnotes. Make the output TTS-friendly with good rhythm (commas and pauses).",
  tablePrompt: "Convert this table into a narrative summary. Describe the columns and rows naturally.",
  codePrompt: "Summarize this code block. Explain its function, inputs, and outputs in plain English. Do not read syntax.",
  mathPrompt: "Convert this mathematical expression into spoken English (e.g., 'x squared' instead of 'x^2').",
  imagePrompt: "Analyze this image and provide a detailed description suitable for a visually impaired listener. Focus on the data or concept presented."
};

export const DB_NAME = 'SpokablePDF_DB';
export const DB_VERSION = 1;
export const STORE_LOGS = 'logs';
export const STORE_FILES = 'files';
export const STORE_BATCHES = 'batches';