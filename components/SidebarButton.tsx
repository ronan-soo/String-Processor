import React from 'react';
import { Plus } from 'lucide-react';

interface SidebarButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isPrimary?: boolean;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ onClick, icon, label, isPrimary }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
      isPrimary 
        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 hover:-translate-y-0.5' 
        : 'text-slate-600 bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 hover:text-indigo-700'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-lg ${isPrimary ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-indigo-100 transition-colors'}`}>
        {icon}
      </div>
      <span className="text-xs font-bold tracking-tight uppercase">{label}</span>
    </div>
    <Plus className={`w-3 h-3 transition-transform group-hover:rotate-90 ${isPrimary ? 'text-white/50' : 'text-slate-300'}`} />
  </button>
);

export default SidebarButton;