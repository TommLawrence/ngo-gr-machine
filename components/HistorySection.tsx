
import React from 'react';
import { ICONS } from '../constants.tsx';
import { HistoryItem, User } from '../types.ts';

interface HistorySectionProps {
  user: User;
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  theme?: 'light' | 'dark';
}

export const HistorySection: React.FC<HistorySectionProps> = ({ user, history, onSelectItem, onDeleteItem, theme = 'light' }) => {
  const filteredHistory = user.role === 'MANAGER' 
    ? history 
    : history.filter(item => item.userId === user.id);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h3 className={`text-lg sm:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            {user.role === 'MANAGER' ? 'Organization Archives' : 'Draft History'}
          </h3>
          <p className={`text-sm font-medium mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
            {filteredHistory.length} synthesized drafts found.
          </p>
        </div>
        <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${user.role === 'MANAGER' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
          {user.role} View
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pr-1">
        {filteredHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
            <ICONS.History className="w-12 h-12 mb-4" />
            <p className="text-sm font-medium">No archived reports yet.</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filteredHistory.map((item) => (
              <div 
                key={item.id}
                className="glass bg-white/40 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-800/90 border-white/50 dark:border-slate-700/50 p-4 rounded-xl flex items-center justify-between transition-all group relative"
              >
                <div 
                  onClick={() => onSelectItem(item)}
                  className="flex items-center gap-4 flex-grow cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ICONS.FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.donorType} Draft</h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-1 mt-0.5">{item.summary}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    title="Delete Draft"
                  >
                    <ICONS.Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
