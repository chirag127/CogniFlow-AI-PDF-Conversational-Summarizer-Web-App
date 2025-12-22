import React from 'react';

interface ProgressBarProps {
  stage: string;
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ stage, progress }) => (
  <div className="mb-4">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-blue-400 font-medium">{stage}</span>
      <span>{Math.round(progress)}%</span>
    </div>
    <div className="h-2 bg-dark rounded overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

export default ProgressBar;
