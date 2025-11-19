import React from 'react';
import { ProcessLog } from '../types';

const LogViewer: React.FC<{ logs: ProcessLog[] }> = ({ logs }) => {
  if (logs.length === 0) return <div className="text-slate-500 text-center p-4">No logs yet.</div>;

  return (
    <div className="bg-black rounded border border-slate-800 font-mono text-xs overflow-hidden h-64 flex flex-col">
      <div className="bg-slate-800 px-4 py-2 text-slate-300 font-bold">Activity Log</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 border-b border-slate-900 pb-1 mb-1 last:border-0">
            <span className="text-slate-500 w-20 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className={`w-16 shrink-0 font-bold uppercase ${
              log.level === 'error' ? 'text-red-500' : 
              log.level === 'warn' ? 'text-orange-400' : 
              log.level === 'success' ? 'text-green-400' : 'text-blue-400'
            }`}>{log.level}</span>
            <span className="text-slate-300 break-all">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogViewer;