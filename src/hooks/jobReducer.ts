import { JobState, PDFBatch } from '../types';

export type JobAction =
  | { type: 'START_JOB'; payload: { fileName: string; fileSize: number } }
  | { type: 'UPDATE_PROGRESS'; payload: { progress: number; currentStage: string } }
  | { type: 'JOB_READY'; payload: { batches: PDFBatch[] } }
  | { type: 'SET_ERROR'; payload: { error: string } }
  | { type: 'START_PROCESSING' }
  | { type: 'UPDATE_BATCH_STATUS'; payload: { batchId: number; status: 'processing' | 'completed' | 'failed' } }
  | { type: 'COMPLETE_BATCH'; payload: { batch: PDFBatch; modelUsed?: string } }
  | { type: 'FAIL_BATCH'; payload: { batchId: number; error: string } }
  | { type: 'FINISH_PROCESSING' }
  | { type: 'RESET_JOB' };

export const jobReducer = (state: JobState | null, action: JobAction): JobState | null => {
  switch (action.type) {
    case 'START_JOB':
      return {
        ...action.payload,
        status: 'analyzing',
        progress: 0,
        currentStage: 'Initializing...',
        batches: [],
        error: null
      };

    case 'UPDATE_PROGRESS':
      if (!state) return null;
      return { ...state, ...action.payload };

    case 'JOB_READY':
      if (!state) return null;
      return {
        ...state,
        status: 'idle',
        progress: 50,
        currentStage: `Ready to process ${action.payload.batches.length} batches`,
        batches: action.payload.batches,
      };

    case 'SET_ERROR':
      if (!state) return null;
      return { ...state, status: 'error', currentStage: action.payload.error };

    case 'START_PROCESSING':
      if (!state) return null;
      return { ...state, status: 'processing', currentStage: 'Processing batches...' };

    case 'UPDATE_BATCH_STATUS': {
      if (!state) return null;
      const batches = state.batches.map(b =>
        b.id === action.payload.batchId ? { ...b, status: action.payload.status } : b
      );
      return { ...state, batches };
    }

    case 'COMPLETE_BATCH': {
        if (!state) return null;
        const batches = state.batches.map(b =>
          b.id === action.payload.batch.id ? action.payload.batch : b
        );
        const completed = batches.filter(b => b.status === 'completed').length;
        const total = batches.length;
        const progress = 50 + (completed / total) * 50;
        const failed = batches.filter(b => b.status === 'failed').length;

        return {
          ...state,
          batches,
          progress,
          currentStage: `Processed ${completed}/${total} (Failed: ${failed})`
        };
    }

    case 'FAIL_BATCH': {
        if (!state) return null;
        const batches = state.batches.map((b): PDFBatch =>
          b.id === action.payload.batchId ? { ...b, status: 'failed', error: action.payload.error } : b
        );
        const completed = batches.filter(b => b.status === 'completed').length;
        const total = batches.length;
        const failed = batches.filter(b => b.status === 'failed').length;

        return {
          ...state,
          batches,
          currentStage: `Processed ${completed}/${total} (Failed: ${failed})`
        };
    }

    case 'FINISH_PROCESSING': {
      if (!state) return null;
      const failedCount = state.batches.filter(b => b.status === 'failed').length;
      return {
        ...state,
        status: failedCount > 0 ? 'error' : 'completed',
        currentStage: failedCount > 0 ? `Completed with ${failedCount} errors` : 'Transformation Complete!',
        progress: 100,
      };
    }

    case 'RESET_JOB':
      return null;

    default:
      return state;
  }
};
