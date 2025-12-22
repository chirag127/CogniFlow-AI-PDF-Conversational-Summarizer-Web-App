import React from 'react';
import { PDFBatch } from '../types';

interface BatchGridProps {
  batches: PDFBatch[];
}

const BatchGrid: React.FC<BatchGridProps> = ({ batches }) => (
  <div className="mt-6">
    <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Chunk Status</h3>
    <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-20 gap-1">
      {batches.map(batch => (
        <div
          key={batch.id}
          title={`Batch ${batch.id}: ${batch.status}${batch.error ? ` - ${batch.error}` : ''}`}
          className={`aspect-square rounded-sm text-[8px] flex items-center justify-center cursor-default transition-colors
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
);

export default BatchGrid;
