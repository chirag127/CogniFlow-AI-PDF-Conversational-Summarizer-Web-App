import React from 'react';
import { ProcessLog } from '../types';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

interface LogViewerProps {
  logs: ProcessLog[];
}

const LogLevelIndicator: React.FC<{ level: ProcessLog['level'] }> = ({ level }) => {
  switch (level) {
    case 'success':
      return <CheckCircle size={14} className="text-green-500" />;
    case 'error':
      return <XCircle size={14} className="text-red-500" />;
    case 'warn':
      return <AlertTriangle size={14} className="text-orange-400" />;
    case 'info':
    default:
      return <Info size={14} className="text-blue-500" />;
  }
};

const LogEntry: React.FC<{ log: ProcessLog }> = ({ log }) => (
  <div className="flex gap-2 items-start font-mono text-xs py-1 border-b border-slate-900 last:border-0">
    <span className="text-slate-500 shrink-0" style={{ width: '70px' }}>
      {new Date(log.timestamp).toLocaleTimeString()}
    </span>
    <div className="shrink-0 w-5">
      <LogLevelIndicator level={log.level} />
    </div>
    <span className="text-slate-300 break-words flex-1">
      {log.message}
      {log.modelUsed && <span className="text-purple-400 ml-2">[{log.modelUsed}]</span>}
    </span>
  </div>
);

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="text-slate-500 text-center p-8 border-t border-slate-800 mt-6">
        Activity logs will appear here.
      </div>
    );
  }

  return (
    <div className="bg-paper rounded-xl border border-slate-800 shadow-lg mt-6">
      <header className="px-4 py-2 border-b border-slate-800">
        <h3 className="text-sm font-bold text-slate-300 tracking-wider">Activity Log</h3>
      </header>
      <div className="h-64 overflow-y-auto p-4">
        <div className="space-y-1">
          {logs.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent re-renders if logs haven't changed.
export default React.memo(LogViewer);
