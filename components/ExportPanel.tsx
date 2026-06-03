
import React from 'react';
import { ICONS } from '../constants.tsx';

interface ExportPanelProps {
  onExport: (format: string) => void;
  isAvailable: boolean;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ onExport, isAvailable }) => {
  if (!isAvailable) return null;

  const formats = [
    { id: 'pdf', label: 'Professional PDF', icon: ICONS.Pdf, color: 'hover:bg-red-50 text-red-600 border-red-100' },
    { id: 'word', label: 'Microsoft Word', icon: ICONS.Word, color: 'hover:bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'ppt', label: 'PowerPoint Deck', icon: ICONS.Ppt, color: 'hover:bg-orange-50 text-orange-600 border-orange-100' },
    { id: 'gdoc', label: 'Google Docs', icon: ICONS.GoogleDoc, color: 'hover:bg-green-50 text-green-600 border-green-100' },
  ];

  return (
    <div className="mt-8 pt-8 border-t border-slate-200/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finalize & Export Report</h3>
        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">READY</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {formats.map((format) => (
          <button
            key={format.id}
            onClick={() => onExport(format.id)}
            className={`flex flex-col items-center gap-3 p-4 bg-white border rounded-2xl transition-all hover:scale-[1.02] shadow-sm hover:shadow-md ${format.color}`}
          >
            <format.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-center leading-tight">
              {format.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
