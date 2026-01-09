
import React, { useState, useEffect } from 'react';
import { Zap, Maximize2, Minimize2, Copy } from 'lucide-react';

interface TerminalProps {
  data: any;
  label?: string;
}

const Terminal: React.FC<TerminalProps> = ({ data, label }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const displayContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  return (
    <section 
      className={`w-full transition-all duration-300 ease-in-out bg-slate-900 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/10 ${
        isExpanded 
          ? 'fixed inset-6 z-[200] max-w-none mb-0' 
          : 'max-w-4xl mb-16'
      }`}
    >
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-indigo-400" /> {label || 'Pipeline Terminal'}
          </span>
          {isExpanded && (
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase tracking-widest">
              Focus Mode
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-transparent hover:border-white/10"
          >
            <Copy className="w-3 h-3" /> Copy Output
          </button>
          
          <button 
            onClick={toggleExpand}
            title={isExpanded ? "Collapse" : "Enlarge"}
            className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      <div className={`overflow-auto scrollbar-thin scrollbar-thumb-white/10 ${
        isExpanded ? 'h-[calc(100vh-120px)]' : 'max-h-[600px]'
      }`}>
        <pre className="p-8 code-font text-sm text-slate-300 whitespace-pre m-0">
          {displayContent}
        </pre>
      </div>
      
      {isExpanded && (
        <div className="px-6 py-3 bg-indigo-600 flex justify-center">
           <p className="text-[10px] text-white/80 font-medium uppercase tracking-[0.1em]">
             Press the collapse icon or ESC to exit focus mode
           </p>
        </div>
      )}
    </section>
  );
};

export default Terminal;
