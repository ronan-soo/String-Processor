import React from 'react';
import { Plus } from 'lucide-react';

interface SidebarButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isPrimary?: boolean;
  isCollapsed?: boolean;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ onClick, icon, label, isPrimary, isCollapsed }) => (
  <button 
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    className={`flex items-center transition-all duration-300 group ${
      isCollapsed 
        ? 'w-12 h-12 justify-center rounded-xl mx-auto' 
        : 'w-full justify-between px-4 py-3.5 rounded-2xl'
    } ${
      isPrimary 
        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 hover:-translate-y-0.5' 
        : 'text-slate-600 bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 hover:text-indigo-700'
    }`}
  >
    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
      <div className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${
        isPrimary ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-indigo-100'
      }`}>
        {icon}
      </div>
      {!isCollapsed && <span className="text-xs font-bold tracking-tight uppercase whitespace-nowrap">{label}</span>}
    </div>
    {!isCollapsed && (
      <Plus className={`w-3 h-3 transition-transform group-hover:rotate-90 ${isPrimary ? 'text-white/50' : 'text-slate-300'}`} />
    )}
  </button>
);

export default SidebarButton;