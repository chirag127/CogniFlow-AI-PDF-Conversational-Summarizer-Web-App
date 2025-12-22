import React from 'react';
import { Play, Download, X } from 'lucide-react';
import { JobStatus } from '../types';

interface JobControlsProps {
  jobStatus: JobStatus;
  onProcess: () => void;
  onDownload: () => void;
  onReset: () => void;
}

const RotateIcon = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const JobControls: React.FC<JobControlsProps> = ({ jobStatus, onProcess, onDownload, onReset }) => {
  const isProcessing = jobStatus === 'processing';
  const isCompleted = jobStatus === 'completed';
  const isIdle = jobStatus === 'idle';

  return (
    <div className="flex gap-2">
      {isIdle && (
        <button onClick={onProcess} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors">
          <Play size={18} /> Start Processing
        </button>
      )}
      {isProcessing && (
        <button disabled className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded animate-pulse cursor-not-allowed">
          <RotateIcon /> Processing...
        </button>
      )}
      {(isCompleted) && (
        <button onClick={onDownload} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors">
          <Download size={18} /> Download PDF
        </button>
      )}
      <button onClick={onReset} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
        <X size={20} />
      </button>
    </div>
  );
};

export default JobControls;
