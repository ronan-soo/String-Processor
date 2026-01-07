import React from 'react';
import { Zap } from 'lucide-react';

interface TerminalProps {
  data: any;
}

const Terminal: React.FC<TerminalProps> = ({ data }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  };

  return (
    <section className="w-full max-w-4xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden mb-16 ring-1 ring-white/10">
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-indigo-400" /> Pipeline Terminal
        </span>
        <button 
          onClick={copyToClipboard}
          className="text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg"
        >
          Copy Output
        </button>
      </div>
      <pre className="p-8 overflow-auto max-h-[600px] code-font text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </section>
  );
};

export default Terminal;