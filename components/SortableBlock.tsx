
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  Trash2, 
  Settings, 
  Code, 
  Brackets, 
  Scissors, 
  ArrowRightLeft, 
  Hash,
  AlertCircle
} from 'lucide-react';
import { BlockInstance, BlockType } from '../types';

interface SortableBlockProps {
  block: BlockInstance;
  onRemove: () => void;
  onUpdateConfig: (config: any) => void;
}

const SortableBlock: React.FC<SortableBlockProps> = ({ 
  block, 
  onRemove, 
  onUpdateConfig
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  const getIcon = () => {
    switch (block.type) {
      case BlockType.ESCAPE: return <Code className="w-4 h-4 text-emerald-500" />;
      case BlockType.UNESCAPE: return <ArrowRightLeft className="w-4 h-4 text-emerald-500" />;
      case BlockType.PARSE_JSON: return <Brackets className="w-4 h-4 text-indigo-500" />;
      case BlockType.SELECT_FIELD: return <Hash className="w-4 h-4 text-indigo-500" />;
      case BlockType.SPLIT: return <Scissors className="w-4 h-4 text-amber-500" />;
      case BlockType.TRANSFORM_CASE: return <ArrowRightLeft className="w-4 h-4 text-slate-500" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    return block.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:border-indigo-300 transition-colors"
    >
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 transition-colors">
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{getLabel()}</span>
          </div>
        </div>
        <button onClick={onRemove} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 flex flex-col md:flex-row gap-6">
        {/* Config Panel */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configuration</div>
          
          {block.type === BlockType.SELECT_FIELD && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">JSON Path</label>
              <input 
                type="text" 
                value={block.config.path} 
                onChange={(e) => onUpdateConfig({ ...block.config, path: e.target.value })}
                placeholder="e.g. data.users[0].name"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          )}

          {block.type === BlockType.SPLIT && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Separator</label>
              <input 
                type="text" 
                value={block.config.separator} 
                onChange={(e) => onUpdateConfig({ ...block.config, separator: e.target.value })}
                placeholder="Empty for char by char"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          )}

          {(block.type === BlockType.ESCAPE || block.type === BlockType.UNESCAPE) && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Mode</label>
              <select 
                value={block.config.mode} 
                onChange={(e) => onUpdateConfig({ ...block.config, mode: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="html">HTML Entities</option>
                <option value="uri">URL Encoding</option>
              </select>
            </div>
          )}

          {block.type === BlockType.TRANSFORM_CASE && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Target Case</label>
              <select 
                value={block.config.mode} 
                onChange={(e) => onUpdateConfig({ ...block.config, mode: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="upper">UPPERCASE</option>
                <option value="lower">lowercase</option>
              </select>
            </div>
          )}
          
          {block.type === BlockType.PARSE_JSON && (
            <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
              Parses the incoming string into a JSON object for further manipulation.
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="w-full md:w-2/3 flex flex-col gap-4 border-l border-slate-100 md:pl-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Output Stage Result</span>
            <div className="flex gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                block.output.error ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'
              }`}>
                {block.output.type}
              </span>
            </div>
          </div>
          
          <div className="relative group/output">
            {block.output.error ? (
              <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm animate-pulse">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{block.output.error}</p>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-xl p-4 overflow-hidden relative">
                <pre className="text-xs code-font text-slate-300 overflow-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-700">
                  {JSON.stringify(block.output.data, null, 2)}
                </pre>
                <div className="absolute top-2 right-2 opacity-0 group-hover/output:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(block.output.data, null, 2));
                    }}
                    className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg shadow-xl"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortableBlock;
