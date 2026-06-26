
import React, { useEffect, useState } from 'react';
import { ICONS } from '../constants.tsx';
import { AdminFeedbackRecord, User } from '../types.ts';
import { fetchFeedbackReview } from '../services/difyService.ts';

interface AdminFeedbackReviewProps {
  user: User;
  theme?: 'light' | 'dark';
}

export const AdminFeedbackReview: React.FC<AdminFeedbackReviewProps> = ({ user, theme = 'light' }) => {
  const [records, setRecords] = useState<AdminFeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchFeedbackReview(user.id);
        setRecords(data);
      } catch (err: any) {
        setError(err.message || "Failed to retrieve feedback logs.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <ICONS.Loader className="w-10 h-10 text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Accessing Intelligence Logs...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 h-full flex flex-col min-h-0 overflow-y-auto sm:overflow-hidden scrollbar-thin scroll-smooth">
      <div className="flex items-start justify-between mb-6 flex-shrink-0">
        <div>
          <h3 className={`text-lg sm:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Intelligence Review (Read-Only)</h3>
          <p className={`text-sm font-medium mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
            Audit trail of synthesized intelligence. Immutable records.
          </p>
        </div>
        <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 mt-1">
          Audit Mode
        </div>
      </div>

      <div className="flex-grow min-h-0 sm:overflow-y-auto pr-0 sm:pr-1 scrollbar-thin">
        {records.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
            <ICONS.MessageSquare className="w-12 h-12 mb-4" />
            <p className="text-sm font-medium dark:text-slate-400">No feedback entries recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead className="bg-slate-50/80 dark:bg-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-100 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Timestamp</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-100 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Context</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-100 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Voice Acc.</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-100 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 text-center">Tone</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-100 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {records.map((record, idx) => (
                  <tr key={record.workflow_run_id || idx} className="hover:bg-white/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-4 text-[11px] text-slate-500 dark:text-slate-300 whitespace-nowrap">
                      {record.submitted_at ? new Date(record.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{record.donor_type}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400 uppercase tracking-tighter">{record.style}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap ${record.transcription_correct === 'true' || record.transcription_correct === '1' || record.transcription_correct === true ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {record.transcription_correct === 'true' || record.transcription_correct === '1' || record.transcription_correct === true ? 'Correct' : 'Poor'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{record.tone_rating}</span>
                        <ICONS.Star className="w-3 h-3 text-yellow-400 fill-current" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 max-w-[200px] italic">
                        {record.auditor_note || <span className="text-slate-300 dark:text-slate-600 opacity-50">Clear</span>}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
