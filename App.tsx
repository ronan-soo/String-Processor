
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
  Hash,
  CheckCircle2,
  ArrowUp
} from 'lucide-react';
import { BlockType, BlockInstance, SavedOperation, HistoryItem } from './types';
import { transform } from './utils/transformers';
import SortableBlock from './components/SortableBlock';
import Header from './layouts/Header';
import Sidebar from './layouts/Sidebar';
import Terminal from './components/Terminal';
import ConfirmationModal from './components/ConfirmationModal';
import SaveModal from './components/SaveModal';

const LOCAL_STORAGE_KEY = 'textflow_saved_ops';

const App: React.FC = () => {
  const [initialInput, setInitialInput] = useState<string>('{\n  "user": {\n    "name": "John Doe",\n    "bio": "Developer &amp; Explorer",\n    "tags": ["tech", "adventure"]\n  }\n}');
  const [blocks, setBlocks] = useState<BlockInstance[]>([]);
  const [savedOps, setSavedOps] = useState<SavedOperation[]>([]);
  const [activeOpId, setActiveOpId] = useState<string | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const mainRef = useRef<HTMLElement>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoingRedoing = useRef(false);

  // UI States for Modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [tempName, setTempName] = useState('');

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

  // Scroll detection logic on the pipeline container
  useEffect(() => {
    const container = mainRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 300);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [mainRef.current]);

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const recordHistory = useCallback((input: string, currentBlocks: BlockInstance[]) => {
    if (isUndoingRedoing.current) {
      isUndoingRedoing.current = false;
      return;
    }

    const snapBlocks = currentBlocks.map(({ id, type, config }) => ({ id, type, config }));
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      
      if (newHistory.length > 0) {
        const last = newHistory[newHistory.length - 1];
        if (last.initialInput === input && JSON.stringify(last.blocks) === JSON.stringify(snapBlocks)) {
          return prev;
        }
      }
      
      const snap: HistoryItem = { 
        initialInput: input, 
        blocks: JSON.parse(JSON.stringify(snapBlocks)) 
      };
      const updated = [...newHistory, snap];
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const item = history[prevIndex];
      isUndoingRedoing.current = true;
      setInitialInput(item.initialInput);
      setBlocks(item.blocks.map(b => ({ ...b, output: { data: null, type: 'null' } })));
      setHistoryIndex(prevIndex);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const item = history[nextIndex];
      isUndoingRedoing.current = true;
      setInitialInput(item.initialInput);
      setBlocks(item.blocks.map(b => ({ ...b, output: { data: null, type: 'null' } })));
      setHistoryIndex(nextIndex);
    }
  }, [history, historyIndex]);

  useEffect(() => {
    if (history.length === 0) {
      recordHistory(initialInput, blocks);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) redo(); else undo();
        e.preventDefault();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        redo();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

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

  const blockDepsJson = JSON.stringify(blocks.map(b => ({ id: b.id, type: b.type, config: b.config })));

  useEffect(() => {
    const timeout = setTimeout(() => {
      runPipeline(initialInput, blocks);
    }, 150);
    return () => clearTimeout(timeout);
  }, [initialInput, blockDepsJson, runPipeline]);

  const inputTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (inputTimeoutRef.current) window.clearTimeout(inputTimeoutRef.current);
    inputTimeoutRef.current = window.setTimeout(() => {
      recordHistory(initialInput, blocks);
    }, 500);
    return () => {
      if (inputTimeoutRef.current) window.clearTimeout(inputTimeoutRef.current);
    };
  }, [initialInput]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const result = arrayMove(items, oldIndex, newIndex);
        recordHistory(initialInput, result);
        return result;
      });
    }
  };

  const addBlock = (type: BlockType) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const defaultConfig: any = {};
    if (type === BlockType.SELECT_FIELD) defaultConfig.path = '';
    if (type === BlockType.SPLIT) defaultConfig.separator = '';
    if (type === BlockType.ESCAPE || type === BlockType.UNESCAPE) defaultConfig.mode = 'html';

    const newBlock: BlockInstance = {
      id: newId,
      type,
      config: defaultConfig,
      output: { data: null, type: 'null' }
    };

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    recordHistory(initialInput, newBlocks);
  };

  const removeBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    setBlocks(newBlocks);
    recordHistory(initialInput, newBlocks);
  };

  const updateBlockConfig = (id: string, config: any) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, config } : b);
    setBlocks(newBlocks);
    recordHistory(initialInput, newBlocks);
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
      blocks: JSON.parse(JSON.stringify(blocks.map(({ id, type, config }) => ({ id, type, config })))),
      // Fixed: Added missing createdAt property
      createdAt: Date.now()
    };

    let updatedOps: SavedOperation[];
    if (idToUpdate) {
      updatedOps = savedOps.map(o => o.id === idToUpdate ? newOp : o);
    } else {
      updatedOps = [newOp, ...savedOps];
    }

    setSavedOps(updatedOps);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedOps));
    setActiveOpId(finalId);
    setIsSaveModalOpen(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const loadOp = (op: SavedOperation) => {
    setInitialInput(op.initialInput);
    setBlocks(op.blocks.map(b => ({ ...b, output: { data: null, type: 'null' } })));
    setActiveOpId(op.id);
    recordHistory(op.initialInput, op.blocks);
  };

  const deleteOp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Workflow?',
      message: 'This will permanently remove this saved operation. This action cannot be undone.',
      isDestructive: true,
      onConfirm: () => {
        const updated = savedOps.filter(o => o.id !== id);
        setSavedOps(updated);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        if (activeOpId === id) setActiveOpId(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const exportPipeline = () => {
    const data = {
      initialInput,
      blocks: blocks.map(({ type, config }) => ({ type, config })),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `textflow-pipeline-${new Date().getTime()}.json`;
    a.click();
  };

  const clearWorkspace = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear Workspace?',
      message: 'This will remove all blocks and reset the input. You will lose any unsaved changes.',
      isDestructive: true,
      onConfirm: () => {
        setBlocks([]);
        setActiveOpId(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        recordHistory(initialInput, []);
      }
    });
  };

  // Fixed: Ensure component returns JSX.Element (fixing React.FC assignment error)
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Header 
        activeOpName={savedOps.find(o => o.id === activeOpId)?.name}
        activeOpId={activeOpId}
        onSave={openSaveModal}
        onExport={exportPipeline}
        onClear={clearWorkspace}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          onAddBlock={addBlock}
          savedOps={savedOps}
          activeOpId={activeOpId}
          onLoadOp={loadOp}
          onDeleteOp={deleteOp}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main 
          ref={mainRef}
          className="flex-1 overflow-y-auto p-8 relative flex flex-col items-center"
        >
          <div className="w-full max-w-4xl space-y-8">
            {/* Input Section */}
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden group focus-within:border-indigo-300 transition-colors">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Hash className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Source Input</span>
                </div>
              </div>
              <textarea 
                value={initialInput}
                onChange={(e) => setInitialInput(e.target.value)}
                className="w-full h-48 p-6 text-sm code-font bg-transparent outline-none resize-none scrollbar-thin scrollbar-thumb-slate-200"
                placeholder="Paste your source text, JSON, or XML here..."
              />
            </section>

            {/* Pipeline Section */}
            <div className="space-y-4">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={blocks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {blocks.map((block) => (
                    <SortableBlock 
                      key={block.id} 
                      block={block} 
                      onRemove={() => removeBlock(block.id)}
                      onUpdateConfig={(config) => updateBlockConfig(block.id, config)}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {blocks.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                    <Plus className="w-8 h-8" />
                  </div>
                  <h3 className="text-slate-900 font-bold mb-1">Pipeline is empty</h3>
                  <p className="text-sm text-slate-400">Add a block from the sidebar to start transforming</p>
                </div>
              )}
            </div>

            {/* Final Output */}
            <div className="pt-8 border-t border-slate-200 flex flex-col items-center">
               <Terminal 
                data={blocks.length > 0 ? blocks[blocks.length - 1].output.data : initialInput} 
                label="Final Pipeline Output"
               />
            </div>
          </div>

          {/* Toast / Status messages */}
          {showSavedToast && (
            <div className="fixed bottom-10 right-10 flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right-10">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold">Operation saved successfully!</span>
            </div>
          )}

          {/* Scroll to Top */}
          {showScrollTop && (
            <button 
              onClick={scrollToTop}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 p-4 bg-white border border-slate-200 text-slate-600 rounded-full shadow-xl hover:text-indigo-600 hover:border-indigo-100 hover:-translate-y-1 transition-all z-40"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}
        </main>
      </div>

      <SaveModal 
        isOpen={isSaveModalOpen}
        tempName={tempName}
        setTempName={setTempName}
        onSave={(name) => performSave(name)}
        onClose={() => setIsSaveModalOpen(false)}
      />

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

// Fixed: Ensure default export
export default App;
