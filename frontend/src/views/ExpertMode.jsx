import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, ArrowLeft, Code2, RotateCw, Maximize, Zap, RefreshCw, 
  Share2, Sparkles, Download, Search, ChevronRight, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import mermaid from 'mermaid';

// PREMIUM COLOR SYSTEM
const THEME = {
  bg: '#000000',
  surface: '#0a0a0a',
  border: '#1a1a1a',
  accent: '#7c3aed',
  text: '#ffffff',
  textMuted: '#666666'
};

// SIMPLIFIED MERMAID COMPONENT
const MermaidDiagram = ({ chart }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!chart || !ref.current) return;
    
    const renderDiagram = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'Inter',
          themeVariables: {
            primaryColor: '#7c3aed',
            lineColor: '#333333'
          }
        });
        
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (ref.current) {
          ref.current.innerHTML = svg;
          const svgEl = ref.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.width = '100%';
            svgEl.style.height = 'auto';
          }
        }
      } catch (err) {
        console.error("Mermaid Render Fail:", err);
        if (ref.current) ref.current.innerHTML = `<div class="p-6 border border-red-900/50 bg-red-950/20 rounded-xl text-red-500 text-sm">Failed to render architectural map. Please refine your request.</div>`;
      }
    };

    renderDiagram();
  }, [chart]);

  return <div ref={ref} className="w-full flex justify-center" />;
};

const ExpertMode = () => {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("idle"); // idle, generating, ready, error
  const [result, setResult] = useState({ mermaid: null, overview: "" });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus('generating');
    setResult({ mermaid: null, overview: "" });

    // Use Render backend as default for production
    const API_BASE = window.localStorage.getItem('SURYA_BACKEND_URL') || 'https://nexgen-code.onrender.com';
    
    try {
      const resp = await fetch(`${API_BASE}/api/expert/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (dataStr === '[DONE]') {
              setStatus('ready');
              continue;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.mermaid) {
                setResult({ mermaid: data.mermaid, overview: data.overview });
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="h-screen w-screen bg-black text-white font-sans overflow-hidden flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .custom-scrollbar::-webkit-scrollbar { width: 0; }
        .canvas-grid { background-image: radial-gradient(#1a1a1a 1px, transparent 1px); background-size: 32px 32px; }
      `}</style>

      {/* ZEN HEADER */}
      <nav className="h-16 px-6 border-b border-[#1a1a1a] flex items-center justify-between shrink-0 bg-black/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-[#111] rounded-lg transition-colors"><ArrowLeft size={18} className="text-[#666]"/></Link>
          <div className="w-[1px] h-4 bg-[#1a1a1a]" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)]"><Code2 size={16}/></div>
            <span className="text-sm font-bold tracking-tight uppercase">SuryaX <span className="text-[#666] font-medium ml-1">Architect</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
            {status === 'ready' && (
                <button onClick={() => window.print()} className="px-4 py-1.5 rounded-lg border border-[#1a1a1a] text-[11px] font-bold text-[#666] hover:text-white hover:border-[#333] transition-all flex items-center gap-2 uppercase tracking-widest"><Download size={14}/> Export</button>
            )}
            <div className="px-3 py-1.5 rounded-lg bg-[#111] border border-[#1a1a1a] flex items-center gap-2.5">
               <div className={`w-1.5 h-1.5 rounded-full ${status === 'generating' ? 'bg-[#7c3aed] animate-pulse' : 'bg-[#3fb950]'}`} />
               <span className="text-[10px] font-bold text-[#666] uppercase tracking-wider">{status === 'generating' ? 'SYNTHESIZING' : 'ONLINE'}</span>
            </div>
        </div>
      </nav>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* CENTERED SEARCH BAR */}
        <AnimatePresence>
            {status === 'idle' && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-6 z-40 bg-black"
                >
                    <div className="w-full max-w-2xl space-y-8 text-center">
                        <div className="space-y-4">
                           <h1 className="text-4xl font-extrabold tracking-tight">System Reconnaissance.</h1>
                           <p className="text-[#666] text-lg">Describe your system architecture to visualize the blueprint.</p>
                        </div>
                        
                        <div className="relative group p-[1px] rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-transparent focus-within:from-[#7c3aed] transition-all">
                           <div className="bg-[#050505] rounded-2xl p-2 flex items-center gap-2">
                               <Search className="ml-4 text-[#444]" size={20}/>
                               <input 
                                  value={prompt}
                                  onChange={(e) => setPrompt(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                                  className="flex-1 h-14 bg-transparent border-none outline-none text-white text-lg placeholder:text-[#333]"
                                  placeholder="e.g. Architect a high-frequency trading engine..."
                               />
                               <button 
                                  onClick={handleGenerate}
                                  className="w-12 h-12 rounded-xl bg-[#7c3aed] flex items-center justify-center hover:brightness-110 active:scale-95 transition-all text-white"
                               >
                                  <ChevronRight size={24}/>
                               </button>
                           </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                           {['Fintech Gateway', 'Auth Microservice', 'Real-time Chat', 'Vector DB Pipeline'].map(tag => (
                               <button key={tag} onClick={() => setPrompt(tag)} className="px-4 py-2 rounded-full border border-[#1a1a1a] text-[11px] text-[#666] hover:text-white hover:border-[#333] transition-all font-bold transition-all uppercase tracking-widest">{tag}</button>
                           ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* BLUEPRINT CANVAS */}
        <div className="flex-1 relative canvas-grid overflow-hidden">
             {/* LOADING OVERLAY */}
             {status === 'generating' && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-30">
                     <div className="flex flex-col items-center gap-6">
                        <Activity className="text-[#7c3aed] animate-pulse" size={48}/>
                        <div className="text-center">
                           <h2 className="text-xl font-bold uppercase tracking-[0.3em]">Synthesizing</h2>
                           <p className="text-[#666] text-sm mt-2">Mapping neural logic structures...</p>
                        </div>
                     </div>
                 </div>
             )}

             {/* CANVAS CONTENT */}
             {result.mermaid && (
                 <div 
                    className={`w-full h-full flex flex-col items-center justify-center p-20 cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseMove={(e) => {
                        if (isDragging) setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
                    }}
                    onWheel={(e) => {
                        const delta = e.deltaY > 0 ? -0.1 : 0.1;
                        setScale(prev => Math.min(Math.max(0.5, prev + delta), 4));
                    }}
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ 
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0,0,0.2,1)'
                        }}
                        className="w-full max-w-5xl bg-[#030303] border border-[#1a1a1a] rounded-[32px] p-16 shadow-2xl relative"
                    >
                         <MermaidDiagram chart={result.mermaid} />
                         
                         {/* OVERVIEW PANEL */}
                         {result.overview && (
                            <div className="mt-12 p-8 border-t border-[#1a1a1a] space-y-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-1.5 h-4 bg-[#7c3aed] rounded-full"/>
                                   <span className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">Context Analysis</span>
                                </div>
                                <p className="text-sm text-[#888] leading-relaxed whitespace-pre-wrap font-medium">{result.overview}</p>
                            </div>
                         )}
                    </motion.div>
                 </div>
             )}

             {/* CONTROLS (FAB) */}
             {status === 'ready' && (
                 <div className="absolute bottom-8 right-8 flex items-center gap-2">
                    <button onClick={resetView} className="h-12 w-12 flex items-center justify-center bg-[#111] border border-[#1a1a1a] rounded-xl text-[#666] hover:text-white transition-all"><Maximize size={18}/></button>
                    <button onClick={() => setStatus('idle')} className="h-12 px-6 bg-[#7c3aed] rounded-xl text-white text-sm font-bold flex items-center gap-3 shadow-lg"><RotateCw size={18}/> New Recon</button>
                 </div>
             )}
        </div>
      </main>
    </div>
  );
};

export default ExpertMode;
