import React, { useState, useEffect, useCallback } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { BlockType, BlockInstance, SavedOperation } from './types';
import { transform } from './utils/transformers';
import SortableBlock from './components/SortableBlock';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
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

      {/* Modals */}
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDestructive={confirmModal.isDestructive}
      />

      <SaveModal 
        isOpen={isSaveModalOpen}
        tempName={tempName}
        setTempName={setTempName}
        onSave={performSave}
        onClose={() => setIsSaveModalOpen(false)}
      />

      <Header 
        activeOpName={activeOpName}
        activeOpId={activeOpId}
        onSave={openSaveModal}
        onExport={exportOp}
        onClear={clearWorkspace}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          onAddBlock={addBlock}
          savedOps={savedOps}
          activeOpId={activeOpId}
          onLoadOp={loadOp}
          onDeleteOp={deleteOp}
        />

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
              <Terminal data={blocks[blocks.length - 1]?.output?.data} />
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

export default App;