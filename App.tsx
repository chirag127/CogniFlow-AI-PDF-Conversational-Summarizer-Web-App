import React, { useState, useEffect, useRef } from 'react';
import { Settings, UploadCloud, Play, Pause, Download, AlertCircle, FileText, Trash2, Menu, X } from 'lucide-react';
import { AppSettings, JobState, ProcessLog, PDFBatch } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { getSettings, saveSettings, addLog, getLogs, saveBatch, clearAllData } from './services/storage';
import { extractContentFromPDF, createBatches, generateFinalPDF } from './services/pdfUtils';
import { processBatchWithGemini } from './services/gemini';
import SettingsPanel from './components/SettingsPanel';
import LogViewer from './components/LogViewer';

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [logs, setLogs] = useState<ProcessLog[]>([]);
  const [job, setJob] = useState<JobState | null>(null);
  const [processedBatches, setProcessedBatches] = useState<PDFBatch[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Load initial state
  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    refreshLogs();
  }, []);

  const refreshLogs = async () => {
    const l = await getLogs();
    setLogs(l);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      startJob(file);
    } else {
      alert("Please upload a PDF file.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      startJob(e.target.files[0]);
    }
  };

  const startJob = async (file: File) => {
    setJob({
      fileName: file.name,
      fileSize: file.size,
      totalPages: 0,
      status: 'analyzing',
      progress: 0,
      currentStage: 'Extracting content...',
      batches: []
    });
    setProcessedBatches([]);

    try {
      await addLog({ id: crypto.randomUUID(), timestamp: Date.now(), level: 'info', message: `Started job for ${file.name}` });
      refreshLogs();

      const content = await extractContentFromPDF(file, (pct) => {
         setJob(prev => prev ? ({ ...prev, progress: pct * 0.5 }) : null);
      });

      await addLog({ id: crypto.randomUUID(), timestamp: Date.now(), level: 'success', message: `Extracted ${content.text.length} chars` });
      
      const batches = createBatches(content.text, settings.batchSize, settings.overlapSize);
      
      setJob(prev => prev ? ({
        ...prev,
        status: 'idle',
        progress: 50,
        currentStage: `Ready to process ${batches.length} batches`,
        batches: batches
      }) : null);

    } catch (e: any) {
      console.error(e);
      setJob(prev => prev ? ({ ...prev, status: 'error', currentStage: `Error: ${e.message}` }) : null);
      await addLog({ id: crypto.randomUUID(), timestamp: Date.now(), level: 'error', message: `Extraction failed: ${e.message}` });
    } finally {
      refreshLogs();
    }
  };

  const processBatches = async () => {
    if (!job || !job.batches.length) return;
    if (!settings.apiKey) {
        setShowSettings(true);
        alert("Please configure your API Key in Settings.");
        return;
    }

    setJob(prev => ({ ...prev!, status: 'processing', currentStage: 'Starting transformation...' }));
    
    // Filter pending or failed batches
    const todo = job.batches.filter(b => b.status === 'pending' || b.status === 'failed');
    
    // Concurrency Control
    const limit = settings.turboMode ? settings.parallelChunks : 1;
    let active = 0;
    let index = 0;
    
    const processQueue = async () => {
        if (job?.status === 'paused') return; // Check pause state
        
        while(index < todo.length) {
            if (active >= limit) {
                await new Promise(r => setTimeout(r, 100));
                continue;
            }
            
            const batch = todo[index];
            index++;
            active++;

            // Update UI for start
            setJob(prev => {
                if (!prev) return null;
                const newBatches = [...prev.batches];
                const target = newBatches.find(b => b.id === batch.id);
                if (target) target.status = 'processing';
                return { ...prev, batches: newBatches };
            });

            // Process
            processBatchWithGemini(batch, settings)
                .then(async (res) => {
                    batch.transformedText = res.text;
                    batch.status = 'completed';
                    await saveBatch(batch);
                    setProcessedBatches(prev => [...prev, batch]);
                    
                    await addLog({ 
                        id: crypto.randomUUID(), 
                        timestamp: Date.now(), 
                        level: 'success', 
                        message: `Batch ${batch.id} complete`,
                        modelUsed: res.modelUsed
                    });
                })
                .catch(async (err) => {
                     batch.status = 'failed';
                     batch.error = err.message;
                     await addLog({ 
                        id: crypto.randomUUID(), 
                        timestamp: Date.now(), 
                        level: 'error', 
                        message: `Batch ${batch.id} final fail: ${err.message}`
                    });
                })
                .finally(() => {
                    active--;
                    setJob(prev => {
                        if (!prev) return null;
                        const newBatches = [...prev.batches];
                        const total = newBatches.length;
                        const completed = newBatches.filter(b => b.status === 'completed').length;
                        const failed = newBatches.filter(b => b.status === 'failed').length;
                        
                        // Update status in the state list
                        const target = newBatches.find(b => b.id === batch.id);
                        if (target) {
                            target.status = batch.status;
                            target.error = batch.error;
                        }

                        const progress = 50 + ((completed / total) * 50);
                        
                        return { 
                            ...prev, 
                            batches: newBatches,
                            progress: progress,
                            currentStage: `Processed ${completed}/${total} (Failed: ${failed})`
                        };
                    });
                    refreshLogs();
                });
        }

        // Wait for all active to finish
        while (active > 0) {
            await new Promise(r => setTimeout(r, 200));
        }
        
        setJob(prev => {
            if (!prev) return null;
            const failed = prev.batches.filter(b => b.status === 'failed').length;
            return { 
                ...prev, 
                status: failed > 0 ? 'error' : 'completed', 
                currentStage: failed > 0 ? 'Completed with errors' : 'Transformation Complete!' 
            };
        });
    };

    processQueue();
  };

  const downloadPDF = () => {
    if (!job) return;
    const blob = generateFinalPDF(processedBatches, settings);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Readable_${job.fileName}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
      if (confirm("Erase all data and logs?")) {
          await clearAllData();
          window.location.reload();
      }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div className="w-64 bg-dark border-r border-slate-800 flex flex-col p-4">
        <div className="mb-8">
           <h1 className="text-xl font-bold text-blue-500 leading-tight">Readable Spokable PDF</h1>
           <p className="text-xs text-slate-500 mt-1">AI-Powered TTS Converter</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => setShowSettings(false)} className="w-full flex items-center gap-2 px-3 py-2 rounded bg-slate-800 text-white">
            <FileText size={18} /> Dashboard
          </button>
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-800 text-slate-400 transition">
            <Settings size={18} /> Settings
          </button>
        </nav>

        <div className="mt-auto">
            <button onClick={handleReset} className="text-xs text-red-500 flex items-center gap-2 hover:text-red-400">
                <Trash2 size={14} /> Erase All Data
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Settings Overlay */}
        {showSettings && (
            <div className="absolute inset-0 z-50">
                <SettingsPanel 
                    settings={settings} 
                    updateSettings={(s) => { setSettings(s); saveSettings(s); }} 
                    onClose={() => setShowSettings(false)} 
                />
            </div>
        )}

        <main className="flex-1 overflow-y-auto p-8">
           {!job ? (
             <div 
                className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
             >
                <UploadCloud size={48} className="text-slate-500 mb-4" />
                <p className="text-lg text-slate-300">Drag & Drop PDF here</p>
                <p className="text-sm text-slate-500 my-2">or</p>
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow">
                    Select File
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileSelect} />
                </label>
             </div>
           ) : (
             <div className="bg-paper rounded-xl p-6 shadow-lg mb-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">{job.fileName}</h2>
                        <p className="text-sm text-slate-400">
                            {(job.fileSize / 1024 / 1024).toFixed(2)} MB • {job.batches.length} Batches identified
                        </p>
                    </div>
                    <div className="flex gap-2">
                         {job.status === 'idle' && (
                             <button onClick={processBatches} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded">
                                <Play size={18} /> Start Processing
                             </button>
                         )}
                         {job.status === 'processing' && (
                             <button className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded animate-pulse">
                                <RotateIcon /> Processing...
                             </button>
                         )}
                         {(job.status === 'completed' || processedBatches.length > 0) && (
                             <button onClick={downloadPDF} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">
                                <Download size={18} /> Download PDF
                             </button>
                         )}
                         <button onClick={() => setJob(null)} className="p-2 text-slate-500 hover:text-red-400">
                            <X size={20} />
                         </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-400 font-medium">{job.currentStage}</span>
                        <span>{Math.round(job.progress)}%</span>
                    </div>
                    <div className="h-2 bg-dark rounded overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500" 
                            style={{ width: `${job.progress}%` }}
                        />
                    </div>
                </div>

                {/* Batch Grid */}
                <div className="mt-6">
                    <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Chunk Status</h3>
                    <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-20 gap-1">
                        {job.batches.map(batch => (
                            <div 
                                key={batch.id} 
                                title={`Batch ${batch.id}: ${batch.status}`}
                                className={`aspect-square rounded-sm text-[8px] flex items-center justify-center cursor-default
                                    ${batch.status === 'pending' ? 'bg-slate-800 text-slate-600' : ''}
                                    ${batch.status === 'processing' ? 'bg-amber-500/50 text-amber-200 animate-pulse' : ''}
                                    ${batch.status === 'completed' ? 'bg-green-500/50 text-green-200' : ''}
                                    ${batch.status === 'failed' ? 'bg-red-500/50 text-red-200' : ''}
                                `}
                            >
                                {batch.id}
                            </div>
                        ))}
                    </div>
                </div>
             </div>
           )}

           <LogViewer logs={logs} />
        </main>
      </div>
    </div>
  );
};

const RotateIcon = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default App;