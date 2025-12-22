/**
 * Defines the structure for application settings, stored in IndexedDB.
 */
export interface AppSettings {
  // --- API & Model Configuration ---
  apiKey: string;
  modelPriority: string[];

  // --- Processing & Concurrency ---
  turboMode: boolean;
  parallelChunks: number;
  batchSize: number; // In "tokens", estimated from character count
  overlapSize: number; // In "tokens", for context between chunks

  // --- Reliability ---
  maxRetries: number;
  retryDelay: number; // In milliseconds

  // --- AI Generation Parameters ---
  temperature: number;
  maxOutputTokens: number;

  // --- Prompt Engineering ---
  systemPrompt: string;
  textTransformPrompt: string;

  // --- PDF Output Styling ---
  pdfFontSize: number;
  pdfLineHeight: number;
  pdfMargin: number; // In 'pt' units
}

/**
 * Represents a single log entry for tracking application activity.
 */
export interface ProcessLog {
  id: string; // Unique identifier (e.g., crypto.randomUUID())
  timestamp: number; // UNIX timestamp (Date.now())
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  modelUsed?: string; // Optional: name of the model that completed a task
}

/**
 * Represents a chunk of the original PDF text for processing.
 */
export interface PDFBatch {
  id: number; // Sequential identifier (1, 2, 3...)
  status: 'pending' | 'processing' | 'completed' | 'failed';
  textContent: string; // The original text content of this chunk
  transformedText: string; // The AI-processed text
  error: string | null; // Stores the error message if processing failed
}

/**
 * Defines the possible states for the main processing job.
 */
export type JobStatus = 'idle' | 'analyzing' | 'processing' | 'paused' | 'completed' | 'error';

/**
 * Represents the complete state of a PDF processing job.
 */
export interface JobState {
  fileName: string;
  fileSize: number;
  status: JobStatus;
  progress: number; // A percentage from 0 to 100
  currentStage: string; // A user-friendly message about the current step
  batches: PDFBatch[];
  error: string | null; // Stores job-level errors (e.g., file extraction failure)
}

/**
 * Provides metadata for an available AI model.
 */
export interface ModelInfo {
  name: string;
  displayName: string;
  description: string;
}
