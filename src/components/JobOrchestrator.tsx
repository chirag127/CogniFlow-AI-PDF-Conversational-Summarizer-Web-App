import React, { useState, useReducer, useCallback } from 'react';
import { UploadCloud, Play, Download, X } from 'lucide-react';
import { AppSettings, JobState, PDFBatch } from '../types';
import { addLog, saveBatch } from '../services/storage';
import { extractContentFromPDF, createBatches, generateFinalPDF } from '../services/pdfUtils';
import { processBatchWithAI } from '../services/ai';
import { jobReducer } from '../hooks/jobReducer';
import ProgressBar from './ProgressBar';
import BatchGrid from './BatchGrid';
import JobControls from './JobControls';

interface JobOrchestratorProps {
  settings: AppSettings;
  refreshLogs: () => void;
}

/**
 * Component responsible for managing the entire lifecycle of a PDF processing job.
 */
const JobOrchestrator: React.FC<JobOrchestratorProps> = ({ settings, refreshLogs }) => {
  const [job, dispatch] = useReducer(jobReducer, null);
  const [isDragging, setIsDragging] = useState(false);

  const log = useCallback(async (level: 'info' | 'success' | 'error', message: string, modelUsed?: string) => {
    await addLog({ id: crypto.randomUUID(), timestamp: Date.now(), level, message, modelUsed });
    refreshLogs();
  }, [refreshLogs]);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      await startJob(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      startJob(file);
    }
  }, []);

  const startJob = async (file: File) => {
    dispatch({ type: 'START_JOB', payload: { fileName: file.name, fileSize: file.size } });

    try {
      await log('info', `Started job for ${file.name}`);
      const content = await extractContentFromPDF(file, (progress) => {
        dispatch({ type: 'UPDATE_PROGRESS', payload: { progress: progress * 50, currentStage: 'Extracting content...' } });
      });

      await log('success', `Extracted ${content.text.length} characters from PDF.`);
      const batches = createBatches(content.text, settings.batchSize, settings.overlapSize);

      dispatch({ type: 'JOB_READY', payload: { batches } });
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || 'An unknown error occurred';
      dispatch({ type: 'SET_ERROR', payload: { error: `Extraction failed: ${errorMessage}` } });
      await log('error', `Extraction failed: ${errorMessage}`);
    }
  };

  const processAllBatches = async () => {
    if (!job || !job.batches.length) return;
    if (!settings.apiKey) {
      alert("Please configure your Cerebras API Key in Settings before processing.");
      return;
    }

    dispatch({ type: 'START_PROCESSING' });

    const batchesToProcess = job.batches.filter(b => b.status === 'pending' || b.status === 'failed');
    const concurrencyLimit = settings.turboMode ? settings.parallelChunks : 1;
    let activePromises: Promise<void>[] = [];

    for (const batch of batchesToProcess) {
      if (job.status === 'paused') {
        // This check is a bit simplistic. A real implementation might need a more robust pausing mechanism.
        break;
      }

      const promise = processSingleBatch(batch)
        .then(() => {
          // Remove the completed promise from the active list
          activePromises = activePromises.filter(p => p !== promise);
        });

      activePromises.push(promise);

      if (activePromises.length >= concurrencyLimit) {
        await Promise.race(activePromises);
      }
    }

    await Promise.all(activePromises);
    dispatch({ type: 'FINISH_PROCESSING' });
  };

  const processSingleBatch = async (batch: PDFBatch): Promise<void> => {
    dispatch({ type: 'UPDATE_BATCH_STATUS', payload: { batchId: batch.id, status: 'processing' } });

    try {
      const result = await processBatchWithAI(batch, settings);
      const processedBatch: PDFBatch = {
        ...batch,
        transformedText: result.text,
        status: 'completed',
      };
      await saveBatch(processedBatch);
      dispatch({ type: 'COMPLETE_BATCH', payload: { batch: processedBatch, modelUsed: result.modelUsed } });
      await log('success', `Batch ${batch.id} completed successfully.`, result.modelUsed);
    } catch (error: any) {
      console.error(`Error processing batch ${batch.id}:`, error);
      const errorMessage = error.message || 'Unknown error';
      dispatch({ type: 'FAIL_BATCH', payload: { batchId: batch.id, error: errorMessage } });
      await log('error', `Batch ${batch.id} failed: ${errorMessage}`);
    }
  };

  const handleDownload = () => {
    if (!job) return;
    const completedBatches = job.batches.filter(b => b.status === 'completed');
    if (completedBatches.length === 0) {
      alert("No batches were successfully processed. Cannot generate PDF.");
      return;
    }
    const blob = generateFinalPDF(completedBatches, settings);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CogniFlow_${job.fileName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetJob = () => dispatch({ type: 'RESET_JOB' });

  if (!job) {
    return (
      <div
        className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
      >
        <UploadCloud size={48} className="text-slate-500 mb-4" />
        <p className="text-lg text-slate-300">Drag & Drop PDF here</p>
        <p className="text-sm text-slate-500 my-2">or</p>
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow transition-colors">
          Select File
          <input type="file" className="hidden" accept=".pdf" onChange={handleFileSelect} />
        </label>
      </div>
    );
  }

  return (
    <div className="bg-paper rounded-xl p-6 shadow-lg mb-6">
      <header className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">{job.fileName}</h2>
          <p className="text-sm text-slate-400">
            {(job.fileSize / 1024 / 1024).toFixed(2)} MB • {job.batches.length} Batches
          </p>
        </div>
        <JobControls
          jobStatus={job.status}
          onProcess={processAllBatches}
          onDownload={handleDownload}
          onReset={resetJob}
        />
      </header>

      <ProgressBar stage={job.currentStage} progress={job.progress} />
      <BatchGrid batches={job.batches} />
    </div>
  );
};

export default JobOrchestrator;
