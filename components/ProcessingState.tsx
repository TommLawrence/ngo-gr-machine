
import React from 'react';
import { ICONS } from '../constants.tsx';

interface ProcessingStateProps {
  message: string;
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
        <ICONS.Loader className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-medium text-slate-800 mb-2">Processing Field Data</h3>
      <p className="text-slate-500 font-light text-center max-w-sm">{message}</p>
      
      <div className="mt-10 w-full max-w-xs bg-slate-200 h-1 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 animate-loading" style={{ width: '40%' }}></div>
      </div>
    </div>
  );
};
