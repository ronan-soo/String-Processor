import React from 'react';
import { Zap, Save, Download, Trash2 } from 'lucide-react';

interface HeaderProps {
  activeOpName?: string;
  activeOpId: string | null;
  onSave: (forceNew?: boolean) => void;
  onExport: () => void;
  onClear: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeOpName, activeOpId, onSave, onExport, onClear }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-100">
            <Zap className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">TextFlow <span className="text-indigo-600">Pro</span></h1>
        </div>
        {activeOpName && (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider truncate max-w-[150px]">
              {activeOpName}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        {activeOpId ? (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => onSave(false)}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all shadow-sm"
            >
              <Save className="w-4 h-4" /> Update
            </button>
            <button 
              onClick={() => onSave(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Save as New
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onSave(false)}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Save className="w-4 h-4" /> Save Operation
          </button>
        )}
        
        <div className="w-px h-10 bg-slate-200 mx-1" />
        
        <button 
          onClick={onExport}
          title="Export as JSON"
          className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <Download className="w-5 h-5" />
        </button>
        
        <button 
          onClick={onClear}
          className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;