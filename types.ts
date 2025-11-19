export interface AppSettings {
  apiKey: string;
  backupApiKey: string;
  apiTimeout: number; // seconds
  turboMode: boolean;
  parallelChunks: number;
  autoRetry: boolean;
  batchSize: number; // tokens (approx)
  overlapSize: number; // tokens
  maxRetries: number;
  retryDelay: number; // ms
  rateLimitDelay: number; // ms
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  inputLanguage: string;
  outputLanguage: string;
  
  // PDF Output Settings
  pdfFontSize: number;
  pdfLineHeight: number;
  pdfMargin: number;
  pdfFontFamily: string;
  addPageNumbers: boolean;
  generateTOC: boolean;

  // Prompts
  systemPrompt: string;
  textTransformPrompt: string;
  tablePrompt: string;
  codePrompt: string;
  mathPrompt: string;
  imagePrompt: string;
  
  // Preferred Models (Ordered List)
  modelPriority: string[];
}

export interface ProcessLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: string;
  batchIndex?: number;
  modelUsed?: string;
}

export interface PDFBatch {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  originalText: string;
  transformedText: string;
  images: string[]; // base64
  startIndex: number;
  endIndex: number;
  error?: string;
  attempts: number;
}

export interface JobState {
  fileName: string;
  fileSize: number;
  totalPages: number;
  status: 'idle' | 'analyzing' | 'processing' | 'paused' | 'completed' | 'error';
  progress: number; // 0-100
  currentStage: string;
  batches: PDFBatch[];
  startTime?: number;
  estimatedTimeRemaining?: string;
}

export interface ModelInfo {
  name: string;
  version: string;
  displayName: string;
  description: string;
  inputModalities: string[];
  outputModalities: string[];
}