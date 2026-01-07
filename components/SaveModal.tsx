import React, { useRef, useEffect } from 'react';
import { Save, X } from 'lucide-react';

interface SaveModalProps {
  isOpen: boolean;
  tempName: string;
  setTempName: (name: string) => void;
  onSave: (name: string) => void;
  onClose: () => void;
}

const SaveModal: React.FC<SaveModalProps> = ({ isOpen, tempName, setTempName, onSave, onClose }) => {
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
            <Save className="w-4 h-4 text-indigo-600" /> Save Operation
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Operation Name</label>
            <input 
              ref={nameInputRef}
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && tempName.trim() && onSave(tempName.trim())}
              placeholder="My Data Pipeline"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => tempName.trim() && onSave(tempName.trim())}
              disabled={!tempName.trim()}
              className="flex-1 px-4 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
            >
              Confirm Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveModal;