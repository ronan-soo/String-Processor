import React from 'react';
import { 
  Code, 
  ArrowRightLeft, 
  Brackets, 
  Hash, 
  Scissors, 
  FolderOpen, 
  FileText, 
  X, 
  ChevronRight 
} from 'lucide-react';
import { BlockType, SavedOperation } from '../types';
import SidebarButton from './SidebarButton';

interface SidebarProps {
  onAddBlock: (type: BlockType) => void;
  savedOps: SavedOperation[];
  activeOpId: string | null;
  onLoadOp: (op: SavedOperation) => void;
  onDeleteOp: (id: string, e: React.MouseEvent) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onAddBlock, 
  savedOps, 
  activeOpId, 
  onLoadOp, 
  onDeleteOp 
}) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-10">
        <div>
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Pipeline Blocks</h2>
          <div className="grid grid-cols-1 gap-2">
            <SidebarButton onClick={() => onAddBlock(BlockType.ESCAPE)} icon={<Code className="w-4 h-4" />} label="Escape" />
            <SidebarButton onClick={() => onAddBlock(BlockType.UNESCAPE)} icon={<ArrowRightLeft className="w-4 h-4" />} label="Unescape" />
            <SidebarButton onClick={() => onAddBlock(BlockType.PARSE_JSON)} icon={<Brackets className="w-4 h-4" />} label="Parse JSON" />
            <SidebarButton onClick={() => onAddBlock(BlockType.SELECT_FIELD)} icon={<Hash className="w-4 h-4" />} label="Select Field" />
            <SidebarButton onClick={() => onAddBlock(BlockType.SPLIT)} icon={<Scissors className="w-4 h-4" />} label="Split String" />
            <SidebarButton onClick={() => onAddBlock(BlockType.TRANSFORM_CASE)} icon={<ArrowRightLeft className="w-4 h-4" />} label="Case Switch" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <FolderOpen className="w-3 h-3" /> Saved Ops
            </h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md">{savedOps.length}</span>
          </div>
          
          {savedOps.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
              <p className="text-[11px] text-slate-400 italic">No saved workflows.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedOps.map(op => (
                <div 
                  key={op.id}
                  onClick={() => onLoadOp(op)}
                  className={`group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    activeOpId === op.id 
                      ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-50' 
                      : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <div className="min-w-0 flex-1 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activeOpId === op.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${activeOpId === op.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                        {op.name}
                      </div>
                      <div className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter text-nowrap">
                        {op.blocks.length} Steps • {new Date(op.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button 
                      onClick={(e) => onDeleteOp(op.id, e)}
                      className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <ChevronRight className={`w-4 h-4 transition-transform ${activeOpId === op.id ? 'text-indigo-400' : 'text-slate-200 opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6 bg-indigo-900 text-white/80">
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Workspace Info</h3>
        <p className="text-[11px] leading-relaxed">
          Drag to reorder. Output flows top to bottom.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;