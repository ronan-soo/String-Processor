
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
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUp,
  ArrowDown,
  FileJson,
  Minimize2,
  FileCode
} from 'lucide-react';
import { BlockType, SavedOperation } from '../types';
import SidebarButton from '../components/SidebarButton';

interface SidebarProps {
  onAddBlock: (type: BlockType) => void;
  savedOps: SavedOperation[];
  activeOpId: string | null;
  onLoadOp: (op: SavedOperation) => void;
  onDeleteOp: (id: string, e: React.MouseEvent) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onAddBlock, 
  savedOps, 
  activeOpId, 
  onLoadOp, 
  onDeleteOp,
  isCollapsed,
  onToggle
}) => {
  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out relative group/sidebar`}>
      {/* Sidebar Header with Toggle */}
      <div className={`h-16 flex items-center border-b border-slate-50 flex-none px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Menu</span>
        )}
        <button 
          onClick={onToggle}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-4' : 'p-6'} flex flex-col gap-10 scrollbar-hide`}>
        <div>
          {!isCollapsed && (
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Pipeline Blocks</h2>
          )}
          <div className={`grid grid-cols-1 ${isCollapsed ? 'gap-4' : 'gap-2'}`}>
            <SidebarButton isCollapsed={isCollapsed} onClick={() => onAddBlock(BlockType.ESCAPE)} icon={<Code className="w-4 h-4" />} label="Escape" />
            <SidebarButton isCollapsed={isCollapsed} onClick={() => onAddBlock(BlockType.UNESCAPE)} icon={<ArrowRightLeft className="w-4 h-4" />} label="Unescape" />
            <SidebarButton isCollapsed={isCollapsed} onClick={() => onAddBlock(BlockType.PARSE_JSON)} icon={<Brackets className="w-4 h-4" />} label="Parse JSON" />
            <SidebarButton isCollapsed={isCollapsed} onClick={() => onAddBlock(BlockType.PARSE_XML)} icon={<FileCode className="w-4 h-4" />} label="Parse XML" />
            <SidebarButton isCollapsed={isCollapsed} onClick={() => onAddBlock(BlockType.JSON_STRINGIFY)} icon={<FileJson className="w-4 h-4" />} label="JSON Stringify" />
            <SidebarButton isCollapsed={isCollapsed} onClick={() => onAddBlock(BlockType.MINIFY)} icon={<Minimize2 className="w-4 h-4" />} label="Minify" />
            <SidebarButton isCollapsed={isCollapsed} onClick={() => onAddBlock(BlockType.SELECT_FIELD)} icon={<Hash className="w-4 h-4" />} label="Select Field" />
            <SidebarButton isCollapsed={isCollapsed} onClick={() => onAddBlock(BlockType.SPLIT)} icon={<Scissors className="w-4 h-4" />} label="Split String" />
            <SidebarButton isCollapsed={isCollapsed} onClick={() => onAddBlock(BlockType.TRANSFORM_UPPERCASE)} icon={<ArrowUp className="w-4 h-4" />} label="Uppercase" />
            <SidebarButton isCollapsed={isCollapsed} onClick={() => onAddBlock(BlockType.TRANSFORM_LOWERCASE)} icon={<ArrowDown className="w-4 h-4" />} label="Lowercase" />
          </div>
        </div>

        <div>
          {!isCollapsed && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <FolderOpen className="w-3 h-3" /> Saved Ops
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md">{savedOps.length}</span>
            </div>
          )}
          
          {savedOps.length === 0 ? (
            !isCollapsed && (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                <p className="text-[11px] text-slate-400 italic">No saved workflows.</p>
              </div>
            )
          ) : (
            <div className={`space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
              {savedOps.map(op => (
                <div 
                  key={op.id}
                  onClick={() => onLoadOp(op)}
                  title={isCollapsed ? op.name : undefined}
                  className={`group flex items-center justify-between transition-all cursor-pointer border ${
                    isCollapsed 
                      ? 'w-12 h-12 justify-center rounded-xl' 
                      : 'p-3 rounded-2xl'
                  } ${
                    activeOpId === op.id 
                      ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-50' 
                      : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <div className={`min-w-0 flex-1 flex ${isCollapsed ? 'items-center justify-center' : 'items-start gap-3'}`}>
                    <div className={`p-2 rounded-lg flex-shrink-0 ${activeOpId === op.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    {!isCollapsed && (
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-bold break-words leading-tight mb-0.5 ${activeOpId === op.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                          {op.name}
                        </div>
                        <div className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter text-nowrap">
                          {op.blocks.length} Steps
                        </div>
                      </div>
                    )}
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center self-center pl-2">
                      <button 
                        onClick={(e) => onDeleteOp(op.id, e)}
                        className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <ChevronRight className={`w-4 h-4 transition-transform flex-shrink-0 ${activeOpId === op.id ? 'text-indigo-400' : 'text-slate-200 opacity-0 group-hover:opacity-100'}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="p-6 bg-indigo-900 text-white/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Workspace Info</h3>
          <p className="text-[11px] leading-relaxed">
            Drag to reorder. Output flows top to bottom.
          </p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
