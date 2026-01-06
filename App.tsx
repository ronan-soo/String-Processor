
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { 
  Plus, 
  Zap, 
  Trash2, 
  Code, 
  Brackets, 
  Scissors, 
  ArrowRightLeft, 
  Hash,
  Save,
  FolderOpen,
  X,
  Download,
  CheckCircle2,
  ChevronRight,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { BlockType, BlockInstance, TransformResult, SavedOperation } from './types';
import { transform } from './utils/transformers';
import SortableBlock from './components/SortableBlock';

const LOCAL_STORAGE_KEY = 'textflow_saved_ops';

const App: React.FC = () => {
  const [initialInput, setInitialInput] = useState<string>('{\n  "user": {\n    "name": "John Doe",\n    "bio": "Developer &amp; Explorer",\n    "tags": ["tech", "adventure"]\n  }\n}');
  const [blocks, setBlocks] = useState<BlockInstance[]>([]);
  const [savedOps, setSavedOps] = useState<SavedOperation[]>([]);
  const [activeOpId, setActiveOpId] = useState<string | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);
  
  // UI States for Modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [tempName, setTempName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load saved ops from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setSavedOps(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved operations", e);
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isSaveModalOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isSaveModalOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const runPipeline = useCallback((startInput: string, currentBlocks: BlockInstance[]) => {
    let currentInput: any = startInput;
    let changed = false;
    
    const newBlocks = currentBlocks.map(b => {
      const block = { ...b };
      const newOutput = transform(block.type, currentInput, block.config);

      if (JSON.stringify(newOutput) !== JSON.stringify(block.output)) {
        block.output = newOutput;
        changed = true;
      }

      currentInput = block.output.data;
      return block;
    });

    if (changed) {
      setBlocks(newBlocks);
    }
  }, []);

  const blockDefinitionsJson = JSON.stringify(blocks.map(b => ({ id: b.id, type: b.type, config: b.config })));

  useEffect(() => {
    const timeout = setTimeout(() => {
      runPipeline(initialInput, blocks);
    }, 150);
    return () => clearTimeout(timeout);
  }, [initialInput, blockDefinitionsJson, runPipeline]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addBlock = (type: BlockType) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const defaultConfig: any = {};
    if (type === BlockType.SELECT_FIELD) defaultConfig.path = '';
    if (type === BlockType.SPLIT) defaultConfig.separator = '';
    if (type === BlockType.ESCAPE || type === BlockType.UNESCAPE) defaultConfig.mode = 'html';
    if (type === BlockType.TRANSFORM_CASE) defaultConfig.mode = 'upper';

    const newBlock: BlockInstance = {
      id: newId,
      type,
      config: defaultConfig,
      output: { data: null, type: 'null' }
    };

    setBlocks(prev => [...prev, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const updateBlockConfig = (id: string, config: any) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, config } : b));
  };

  const openSaveModal = (forceNew: boolean = false) => {
    if (!activeOpId || forceNew) {
      setTempName(`Flow ${new Date().toLocaleTimeString()}`);
      setIsSaveModalOpen(true);
    } else {
      const current = savedOps.find(o => o.id === activeOpId);
      if (current) performSave(current.name, activeOpId);
    }
  };

  const performSave = (name: string, idToUpdate: string | null = null) => {
    const finalId = idToUpdate || Math.random().toString(36).substr(2, 9);
    
    const newOp: SavedOperation = {
      id: finalId,
      name,
      initialInput,
      blocks: JSON.parse(JSON.stringify(blocks.map(({ id, type, config }) => ({ 
        id, 
        type, 
        config, 
        output: { data: null, type: 'null' as const } 
      })))),
      createdAt: Date.now()
    };

    let updated: SavedOperation[];
    if (savedOps.some(op => op.id === finalId)) {
      updated = savedOps.map(op => op.id === finalId ? newOp : op);
    } else {
      updated = [newOp, ...savedOps];
    }

    setSavedOps(updated);
    setActiveOpId(finalId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    
    setIsSaveModalOpen(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const executeLoadOp = (op: SavedOperation) => {
    const clonedBlocks = JSON.parse(JSON.stringify(op.blocks));
    setInitialInput(op.initialInput);
    setBlocks(clonedBlocks);
    setActiveOpId(op.id);
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const loadOp = (op: SavedOperation) => {
    if (blocks.length > 0) {
      setConfirmModal({
        isOpen: true,
        title: 'Overwrite Pipeline?',
        message: 'Loading this operation will replace all blocks in your current workspace. This cannot be undone.',
        onConfirm: () => executeLoadOp(op),
      });
    } else {
      executeLoadOp(op);
    }
  };

  const executeDeleteOp = (id: string) => {
    const updated = savedOps.filter(op => op.id !== id);
    setSavedOps(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    if (activeOpId === id) setActiveOpId(null);
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const deleteOp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Operation?',
      message: 'Are you sure you want to permanently remove this saved operation from your library?',
      onConfirm: () => executeDeleteOp(id),
      isDestructive: true
    });
  };

  const clearWorkspace = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear Workspace?',
      message: 'This will remove all blocks from your current pipeline. Saved operations will not be affected.',
      onConfirm: () => {
        setBlocks([]);
        setActiveOpId(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      isDestructive: true
    });
  };

  const exportOp = () => {
    const data = {
      name: savedOps.find(o => o.id === activeOpId)?.name || 'exported-flow',
      initialInput,
      blocks: blocks.map(b => ({ type: b.type, config: b.config }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeOpName = savedOps.find(o => o.id === activeOpId)?.name;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Toast Notification */}
      {showSavedToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold tracking-wide">Operation Saved Successfully!</span>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${confirmModal.isDestructive ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex border-t border-slate-100 p-4 gap-3 bg-slate-50/50">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-4 py-3 text-sm font-bold text-white rounded-xl transition-all shadow-lg ${
                  confirmModal.isDestructive 
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-100' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Save Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Save className="w-4 h-4 text-indigo-600" /> Save Operation
              </h3>
              <button onClick={() => setIsSaveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                  onKeyDown={(e) => e.key === 'Enter' && tempName.trim() && performSave(tempName.trim())}
                  placeholder="My Data Pipeline"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsSaveModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => tempName.trim() && performSave(tempName.trim())}
                  disabled={!tempName.trim()}
                  className="flex-1 px-4 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
                >
                  Confirm Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => openSaveModal(false)}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all shadow-sm"
              >
                <Save className="w-4 h-4" /> Update
              </button>
              <button 
                onClick={() => openSaveModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                Save as New
              </button>
            </div>
          ) : (
            <button 
              onClick={() => openSaveModal(false)}
              className="flex items-center gap-2 px-6 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Save className="w-4 h-4" /> Save Operation
            </button>
          )}
          
          <div className="w-px h-10 bg-slate-200 mx-1" />
          
          <button 
            onClick={exportOp}
            title="Export as JSON"
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <button 
            onClick={clearWorkspace}
            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-10">
            <div>
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Pipeline Blocks</h2>
              <div className="grid grid-cols-1 gap-2">
                <SidebarButton onClick={() => addBlock(BlockType.ESCAPE)} icon={<Code className="w-4 h-4" />} label="Escape" />
                <SidebarButton onClick={() => addBlock(BlockType.UNESCAPE)} icon={<ArrowRightLeft className="w-4 h-4" />} label="Unescape" />
                <SidebarButton onClick={() => addBlock(BlockType.PARSE_JSON)} icon={<Brackets className="w-4 h-4" />} label="Parse JSON" />
                <SidebarButton onClick={() => addBlock(BlockType.SELECT_FIELD)} icon={<Hash className="w-4 h-4" />} label="Select Field" />
                <SidebarButton onClick={() => addBlock(BlockType.SPLIT)} icon={<Scissors className="w-4 h-4" />} label="Split String" />
                <SidebarButton onClick={() => addBlock(BlockType.TRANSFORM_CASE)} icon={<ArrowRightLeft className="w-4 h-4" />} label="Case Switch" />
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
                      onClick={() => loadOp(op)}
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
                          onClick={(e) => deleteOp(op.id, e)}
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

        <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center gap-8 bg-slate-50/50">
          <section className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all hover:shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" /> Input Data Source
              </span>
            </div>
            <textarea
              value={initialInput}
              onChange={(e) => setInitialInput(e.target.value)}
              className="w-full h-40 p-6 code-font text-sm text-slate-700 focus:outline-none resize-none bg-white placeholder:text-slate-300"
              placeholder="Paste your source text here..."
            />
          </section>

          {blocks.length > 0 && <div className="h-10 w-1 bg-indigo-100 rounded-full" />}

          <div className="w-full max-w-4xl flex flex-col items-center gap-8">
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map((block, index) => (
                  <React.Fragment key={block.id}>
                    <SortableBlock 
                      block={block} 
                      onRemove={() => removeBlock(block.id)}
                      onUpdateConfig={(config) => updateBlockConfig(block.id, config)}
                    />
                    {index < blocks.length - 1 && (
                      <div className="h-10 w-1 bg-indigo-100 rounded-full" />
                    )}
                  </React.Fragment>
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {blocks.length > 0 && (
            <>
              <div className="h-10 w-1 bg-indigo-100 rounded-full" />
              <section className="w-full max-w-4xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden mb-16 ring-1 ring-white/10">
                <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" /> Pipeline Terminal
                  </span>
                  <button 
                    onClick={() => {
                      const final = blocks[blocks.length - 1]?.output?.data;
                      navigator.clipboard.writeText(typeof final === 'string' ? final : JSON.stringify(final, null, 2));
                    }}
                    className="text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg"
                  >
                    Copy Output
                  </button>
                </div>
                <pre className="p-8 overflow-auto max-h-[600px] code-font text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(blocks[blocks.length - 1]?.output?.data, null, 2)}
                </pre>
              </section>
            </>
          )}

          {blocks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-300">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-6 ring-1 ring-slate-100">
                <Plus className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-xl font-bold text-slate-400">Pipeline Empty</p>
              <p className="text-sm font-medium text-slate-400 mt-2">Add a processor block from the sidebar to begin.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

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

export default App;
