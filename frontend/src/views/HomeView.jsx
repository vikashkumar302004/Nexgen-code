import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Plus, Upload, Menu, X, FileCode, Check, ChevronDown, 
  Send, Terminal, Monitor, Activity, Copy, Globe, Folder, 
  ChevronRight, Download, FilePlus, FolderPlus, Info, 
  AlertCircle, Sparkles, Bug, Zap, FileText, TestTube2, Minimize2,
  RefreshCw, BarChart3, LayoutDashboard, Share2, Layout, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiffEditor } from '@monaco-editor/react';
import mermaid from 'mermaid';

const API_URL = window.location.hostname.includes('vercel.app') 
  ? 'https://nexgen-code.onrender.com/api/analyze' 
  : '/api/analyze';

// Helper for API with retry
const fetchWithRetry = async (url, options, retries = 3, backoff = 500) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
  
  try {
    for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(url, { ...options, signal: controller.signal });
          if (res.status === 429) {
            await new Promise(r => setTimeout(r, backoff));
            backoff *= 1.5;
            continue;
          }
          if (!res.ok) {
            let errText = `HTTP ${res.status}`;
            try { 
              const errData = await res.json();
              if (errData.text) errText = errData.text;
            } catch(e) {}
            throw new Error(errText);
          }
          clearTimeout(timeoutId);
          return await res.json();
        } catch (err) {
          if (err.name === 'AbortError') throw new Error("Request timed out. Please try again.");
          if (i === retries - 1) throw err;
          await new Promise(r => setTimeout(r, backoff));
        }
      }
  } finally {
    clearTimeout(timeoutId);
  }
};

const MermaidChart = ({ chart, id }) => {
  const ref = useRef(null);
  const [svgContent, setSvgContent] = useState('');

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
            lineColor: '#4f46e5',
            nodeBorder: '#7c3aed',
            mainBkg: '#0d1117',
            textColor: '#fff'
          }
        });
        
        const renderId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(renderId, chart);
        setSvgContent(svg);
      } catch (err) {
        console.error("Mermaid Render Error:", err);
      }
    };

    renderDiagram();
  }, [chart]);

  useEffect(() => {
    if (svgContent && ref.current) {
      ref.current.innerHTML = svgContent;
      const svgEl = ref.current.querySelector('svg');
      if (svgEl) {
        svgEl.style.width = '100%';
        svgEl.style.height = 'auto';
      }
    }
  }, [svgContent]);

  return (
    <div className="relative w-full overflow-hidden">
      <div ref={ref} className="w-full flex items-center justify-center min-h-[300px]" />
      <style>{`
        .node:hover rect, .node:hover circle, .node:hover polygon {
          fill: #7c3aed33 !important;
          stroke: #fff !important;
          stroke-width: 3px !important;
        }
      `}</style>
    </div>
  );
};

const LANGUAGES = [
  { name: 'JavaScript', value: 'javascript', color: '#f7df1e' },
  { name: 'TypeScript', value: 'typescript', color: '#3178c6' },
  { name: 'Python', value: 'python', color: '#3572a5' },
  { name: 'Rust', value: 'rust', color: '#dea584' },
  { name: 'Go', value: 'go', color: '#00add8' },
  { name: 'C++', value: 'cpp', color: '#00599c' },
  { name: 'Java', value: 'java', color: '#b07219' },
  { name: 'Ruby', value: 'ruby', color: '#701516' },
  { name: 'PHP', value: 'php', color: '#4f5d95' },
  { name: 'Swift', value: 'swift', color: '#f05138' },
  { name: 'Kotlin', value: 'kotlin', color: '#a97bff' },
  { name: 'SQL', value: 'sql', color: '#e38c00' }
];

const HomeView = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('welcome.js');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [code, setCode] = useState(`const Codify = {\n  version: '2.0-platinum',\n  status: 'operational',\n  welcome: () => console.log("Hello, I'm Codify")\n};`);
  const [isUnsaved, setIsUnsaved] = useState(false);
  
  // RECURSIVE FILE SYSTEM
  const [fileSystem, setFileSystem] = useState([]);
  const [folders, setFolders] = useState([
    { id: 'root', name: 'Files', isOpen: true, children: [], parentId: null }
  ]);
  const [newFolderInput, setNewFolderInput] = useState({ parentId: null, value: '' });

  // RESIZER STATE
  const [assistantWidth, setAssistantWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: { text: "Hello! I'm Codify Intelligence. How can I help you today?" }, time: '08:00 pm' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [chatEndRef, setChatEndRef] = useState(null); // Ref replacement for better hydration
  const chatScrollRef = useRef(null);
  const editorRef = useRef(null);
  const textareaRef = useRef(null);

  // NEW: ADVANCED FEATURES STATES
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([
    { type: 'info', message: 'Codify Intelligence System v2.0-Expert Initialized', time: '17:29:47' }
  ]);
  const [showDiff, setShowDiff] = useState(false);
  const [originalCode, setOriginalCode] = useState('');
  const [modifiedCode, setModifiedCode] = useState('');
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [mermaidChart, setMermaidChart] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  // LOAD PERSISTENCE
  useEffect(() => {
    const savedFileSystem = localStorage.getItem('suryax_filesystem');
    const savedFolders = localStorage.getItem('suryax_folders');
    const savedCode = localStorage.getItem('suryax_code');
    const savedTab = localStorage.getItem('suryax_activeTab');

    if (savedFileSystem) setFileSystem(JSON.parse(savedFileSystem));
    if (savedFolders) setFolders(JSON.parse(savedFolders));
    if (savedCode) setCode(savedCode);
    if (savedTab) setActiveTab(savedTab);
  }, []);

  // SAVE PERSISTENCE
  useEffect(() => {
    localStorage.setItem('suryax_filesystem', JSON.stringify(fileSystem));
    localStorage.setItem('suryax_folders', JSON.stringify(folders));
    localStorage.setItem('suryax_code', code);
    localStorage.setItem('suryax_activeTab', activeTab);
  }, [fileSystem, folders, code, activeTab]);

  const [dashboardMetrics, setDashboardMetrics] = useState({
    score: 85,
    complexity: 'medium',
    security: 'high',
    optimizations: 3
  });

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // INITIALIZE MERMAID
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter',
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }, []);

  // TRIGGER MERMAID RENDER
  useEffect(() => {
    if (showVisualizer && mermaidChart) {
      // Use a small delay to ensure DOM is ready
      const timeout = setTimeout(() => {
        try {
          const container = document.querySelector('.mermaid');
          if (!container) return;
          
          // Simple validation: must start with graph/flowchart
          if (!mermaidChart.trim().match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|quadrantChart|xychart|requirementDiagram)/i)) {
             console.error("Invalid Mermaid Syntax Detected");
             return;
          }

          mermaid.run({
            nodes: [container],
            suppressErrors: true
          });
        } catch (e) {
          console.error("Mermaid Render Error:", e);
          // Fallback for older versions if needed
          try { mermaid.init(undefined, '.mermaid'); } catch(e2) {}
        }
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [showVisualizer, mermaidChart]);

  // LANGUAGE SYNC & BOILERPLATE
  const BOILERPLATES = {
    javascript: `const Codify = {\n  version: '2.0-platinum',\n  status: 'operational',\n  welcome: () => console.log("Hello, I'm Codify")\n};`,
    python: `def codify_intelligence():\n    print("Welcome to Codify AI")\n    status = "Active"\n    version = "2.0-Expert"\n\ncodify_intelligence()`,
    typescript: `interface System {\n  version: string;\n  status: string;\n}\n\nconst codify: System = {\n  version: '2.0',\n  status: 'online'\n};`,
    cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, Codify Intelligence!" << std::endl;\n    return 0;\n}`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Codify World!");\n    }\n}`,
    rust: `fn main() {\n    println!("Hello, Codify Expert Intelligence!");\n}`,
    go: `package main\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Codify Engine Operational")\n}`,
    php: `<?php\necho "Hello from Codify AI Dashboard";\n?>`
  };

  useEffect(() => {
    // Only auto-rename if it's a "welcome" file (don't overwrite user work unexpectedly)
    if (activeTab.startsWith('welcome.')) {
      const extMap = { 
        javascript: 'js', python: 'py', typescript: 'ts', cpp: 'cpp', 
        java: 'java', rust: 'rs', go: 'go', php: 'php', ruby: 'rb',
        swift: 'swift', kotlin: 'kt', sql: 'sql'
      };
      const newExt = extMap[language.value] || 'txt';
      const newName = `welcome.${newExt}`;
      
      setActiveTab(newName);
      // Only set boilerplate if the code is currently "default-looking"
      if (code === "" || code.includes("Codify")) {
         setCode(BOILERPLATES[language.value] || `// Welcome to Codify ${language.name}\n`);
      }
    }
  }, [language]);

  const handleDownloadPDF = () => { window.print(); };

  const handleDownloadDocs = (data) => {
    const win = window.open('', '_blank');
    const fnRows = data?.functions?.map(f => `
      <div style="margin-bottom:24px; padding:20px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
        <code style="display:block;background:#1e293b;color:#7dd3fc;padding:12px;border-radius:8px;font-size:13px;margin-bottom:12px;">${f?.signature || ''}</code>
        <p style="color:#334155;font-size:13px;margin-bottom:12px;">${f?.description || ''}</p>
        ${f?.params?.length ? `
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr style="background:#f1f5f9;"><th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Parameter</th><th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Type</th><th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Complexity</th></tr></thead>
            <tbody>${f.params.map(p => `<tr><td style="padding:8px;border:1px solid #e2e8f0;color:#0f172a;font-family:monospace">${p.name||''}</td><td style="padding:8px;border:1px solid #e2e8f0;color:#7c3aed;">${p.type||''}</td><td style="padding:8px;border:1px solid #e2e8f0;color:#0369a1;font-family:monospace">${f.complexity||'O(1)'}</td></tr>`).join('')}</tbody>
          </table>` : ''}
        ${f.example ? `<div style="margin-top:12px;"><strong style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Usage Example</strong><pre style="margin-top:4px;background:#1e293b;color:#94a3b8;padding:12px;border-radius:8px;font-size:11px;overflow:auto;">${f.example}</pre></div>` : ''}
      </div>`).join('') || '';

    const html = `<html><head><title>Codify Documentation - ${activeTab}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; background: white; color: #0f172a; }
        .report-header { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 40px; }
        .report-header h1 { font-size: 28px; margin: 0 0 6px 0; font-weight: 800; }
        .report-header p { margin: 0; opacity: 0.8; font-size: 13px; }
        .badge { display:inline-block; background:rgba(255,255,255,0.2); padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:0.05em; margin-top:16px; }
        .content { padding: 40px; }
        h2 { font-size: 18px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px; }
        .overview { background: #f0f9ff; border-left: 4px solid #7c3aed; padding: 16px 20px; border-radius: 0 8px 8px 0; font-size: 13px; color: #334155; margin-bottom: 24px; line-height: 1.6; }
        .guide  { background:#fdf4ff; border:1px solid #e9d5ff; padding:16px 20px; border-radius:8px; font-size:13px; color:#334155; line-height:1.6; margin-bottom:16px; }
        .roadmap { background:#f0fdf4; border:1px solid #bbf7d0; padding:16px 20px; border-radius:8px; font-size:13px; color:#166534; line-height:1.6; }
        .footer { text-align:center; padding:20px; color:#94a3b8; font-size:11px; border-top:1px solid #e2e8f0; margin-top:40px; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style></head><body>
      <div class="report-header">
        <h1>📋 Technical Documentation</h1>
        <p>File: ${activeTab} · Generated by Codify Intelligence v2.0 Expert</p>
        ${data.architecture_pattern ? `<div class="badge">${data.architecture_pattern}</div>` : ''}
      </div>
      <div class="content">
        ${data.overview ? `<div class="overview">${data.overview}</div>` : ''}
        <h2>Function Reference</h2>
        ${fnRows}
        ${data.usage_instructions?.length ? `<h2>Deployment & Integration</h2><ul style="font-size:13px;color:#334155;line-height:2;">${data.usage_instructions.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}
        ${data.maintenance_guide ? `<h2>Maintenance Guide</h2><div class="guide">${data.maintenance_guide}</div>` : ''}
        ${data.roadmap ? `<h2>Future Roadmap</h2><div class="roadmap">${data.roadmap}</div>` : ''}
        <div class="footer">Codify AI Code Intelligence · Expert Analysis Report · ${new Date().toLocaleString()}</div>
      </div>
      <script>window.onload = () => { window.print(); }</script>
    </body></html>`;
    win.document.write(html);
    win.document.close();
  };

  useEffect(() => {
    if (editorRef.current) setTimeout(() => editorRef.current.layout(), 100);
  }, [isSidebarOpen, assistantWidth]);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 250 && newWidth < 800) {
        setAssistantWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing]);

  // FOLDER HANDLERS
  const handleCreateFolder = (parentId) => {
    if (!newFolderInput.value.trim()) return;
    const id = Date.now().toString();
    setFolders(prev => [...prev, { id, name: newFolderInput.value, isOpen: true, children: [], parentId }]);
    setNewFolderInput({ parentId: null, value: '' });
  };

  const toggleFolder = (id) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  };

  // DRAG AND DROP
  const onDragStart = (e, fileId) => e.dataTransfer.setData('fileId', fileId);
  const onDrop = (e, folderId) => {
    const fileId = e.dataTransfer.getData('fileId');
    if (!fileId) return;
    setFileSystem(prev => prev.map(f => f.id === fileId ? { ...f, parentId: folderId } : f));
  };

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    let newFolders = [];
    let folderSet = new Set();
    
    const filePromises = files.map(file => {
      const pathParts = (file.webkitRelativePath || file.name).split('/');
      let currentParentId = 'root';
      
      // Create folders if needed
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        const folderId = pathParts.slice(0, i + 1).join('/');
        
        if (!folderSet.has(folderId)) {
          folderSet.add(folderId);
          newFolders.push({ id: folderId, name: folderName, isOpen: true, children: [], parentId: currentParentId });
        }
        currentParentId = folderId;
      }
      
      return new Promise((resolve) => {
         const reader = new FileReader();
         reader.onload = (ev) => {
           resolve({
             id: file.webkitRelativePath || file.name,
             name: file.name,
             type: 'file',
             content: ev.target.result,
             extension: file.name.split('.').pop(),
             parentId: currentParentId
           });
         };
         reader.readAsText(file);
      });
    });

    Promise.all(filePromises).then(resolvedFiles => {
      setFolders(prev => {
        const rootFolder = prev.find(f => f.id === 'root') || { id: 'root', name: 'Uploads', isOpen: true, children: [], parentId: null };
        const otherFolders = prev.filter(f => f.id !== 'root');
        return [rootFolder, ...otherFolders, ...newFolders];
      });
      setFileSystem(prev => [...prev.filter(f => !resolvedFiles.find(rf => rf.id === f.id)), ...resolvedFiles]);
      if (resolvedFiles.length > 0) {
        setActiveTab(resolvedFiles[0].name);
        setCode(resolvedFiles[0].content || '');
      }
    });
  };

  const handleNewChat = () => {
    if (window.confirm("Are you sure? This will reset your workspace.")) {
        setMessages([{ role: 'assistant', content: { text: "Workspace reset. I'm ready for a new session. How can I help?" }, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase() }]);
        setFileSystem([]);
        setFolders([{ id: 'root', name: 'Files', isOpen: true, children: [], parentId: null }]);
        setCode(`const Codify = {\n  version: '2.0-platinum',\n  status: 'operational',\n  welcome: () => console.log("Hello, I'm Codify")\n};`);
        setActiveTab('welcome.js');
        setIsUnsaved(false);
        setInputValue('');
        localStorage.removeItem('suryax_filesystem');
        localStorage.removeItem('suryax_folders');
        localStorage.removeItem('suryax_code');
        localStorage.removeItem('suryax_activeTab');
    }
  };

  const handleApplyCode = (newCode) => {
    if (!newCode) return;
    setOriginalCode(code);
    setCode(newCode);
    setModifiedCode(newCode);
    setShowDiff(true);
    // Auto exit diff after 2s if needed, or let user decide
  };



  const handleSend = async (type = 'custom', customPrompt = null) => {
    const prompt = customPrompt || inputValue;
    if (!prompt.trim() && type === 'custom') return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
    const userMsg = type === 'custom' ? prompt : `${type.charAt(0).toUpperCase() + (type.slice(1) || '')} this code.`;
    
    setMessages(prev => [...prev, { role: 'user', content: { text: userMsg || "..." }, time }]);
    setInputValue('');
    setIsTyping(true);

    try {
      const chatHistory = messages.map(m => ({ 
        role: m.role, 
        content: typeof m.content === 'object' ? (m.content.text || m.content.overview || JSON.stringify(m.content)) : String(m.content)
      }));

      const res = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type, history: chatHistory, custom_prompt: customPrompt || prompt })
      });

      // Update Diff View if optimized
      if (type === 'optimize' && res.fixedCode?.after) {
        setOriginalCode(res.fixedCode.before || code);
        setModifiedCode(res.fixedCode.after);
        setShowDiff(true);
      }

      // Update Intelligence Dashboard
      if (['explain', 'optimize', 'debug'].includes(type) && res.overview) {
        setDashboardMetrics({
          score: Math.floor(Math.random() * 20) + 75,
          complexity: res.complexity?.time || 'O(n)',
          security: res.insights?.some(i => i.toLowerCase().includes('security')) ? 'Low' : 'High',
          optimizations: res.insights?.length || 0
        });
      }

      setMessages(prev => [...prev, { role: 'assistant', content: res, time }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: { text: "❌ Connection error." }, time }]);
    } finally {
      setIsTyping(false);
    }
  };

  // PREMIUM INTELLIGENCE CARD RENDERERS
  const renderExplainCard = (data) => (
    <div className="rounded-[10px] p-4 border border-[rgba(31,111,235,0.15)] bg-[rgba(31,111,235,0.06)] border-t-[2px] border-t-[#1f6feb] space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-2 mb-2">
        <h4 className="text-[13px] font-semibold text-[#e6edf3]">📄 Code Explanation</h4>
        <button onClick={() => navigator.clipboard.writeText(data.overview)} className="text-[11px] text-[#6e7681] hover:text-[#e6edf3] flex items-center gap-1"><Copy size={12}/> Copy Explanation</button>
      </div>
      
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-bold text-[#6e7681] uppercase tracking-widest block mb-1">Overview</span>
          <p className="text-[13px] text-[#c9d1d9] leading-relaxed">{data.overview}</p>
        </div>

        <div className="overflow-hidden">
          <span className="text-[10px] font-bold text-[#6e7681] uppercase tracking-widest block mb-2">Line by Line</span>
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[11px] text-[#4b5563] border-b border-[rgba(255,255,255,0.05)]">
                <th className="py-2 text-left font-bold uppercase">Line</th>
                <th className="py-2 text-left font-bold uppercase pl-4">Explanation</th>
              </tr>
            </thead>
            <tbody className="text-[12px]">
              {data.line_by_line?.map((item, i) => (
                <tr key={i} className="border-b border-[rgba(255,255,255,0.05)] last:border-0">
                  <td className="py-3 pr-2">
                    <code className="bg-[#161b22] px-2 py-1 rounded-[4px] text-[#79c0ff] font-mono whitespace-nowrap">{item.line}</code>
                  </td>
                  <td className="py-3 pl-4 text-[#8b949e] leading-relaxed">
                    {item.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2">
          <span className="text-[10px] font-bold text-[#6e7681] uppercase tracking-widest block mb-2">Key Concepts</span>
          <div className="flex flex-wrap gap-2">
            {data.concepts?.map(c => (
              <span key={c} className="px-[12px] py-[4px] bg-[rgba(124,58,237,0.12)] border border-[rgba(124,58,237,0.25)] text-[#a78bfa] text-[11px] rounded-[20px] font-medium uppercase tracking-tight">{c}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDebugCard = (data) => (
    <div className="rounded-[10px] p-4 border border-[rgba(218,54,51,0.15)] bg-[rgba(218,54,51,0.06)] border-t-[2px] border-t-[#da3633] space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-2 mb-2">
        <h4 className="text-[13px] font-semibold text-[#e6edf3]">🐛 Debug Report</h4>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-bold text-[#6e7681] uppercase tracking-widest block mb-3">Issues Found</span>
          <div className="space-y-3">
            {data.issues?.map((issue, i) => (
              <div key={i} className="bg-[#0d1117]/40 rounded-xl border border-white/5 p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#da3633] text-white flex items-center justify-center text-[10px] font-bold">{i+1}</div>
                    <h5 className="text-[13px] font-semibold text-[#f85149]">{issue.title}</h5>
                  </div>
                  <span className={`px-[7px] py-[1px] rounded-[20px] text-[9px] font-bold uppercase border ${
                    issue.severity === 'CRITICAL' ? 'bg-[rgba(218,54,51,0.2)] text-[#f85149] border-[rgba(218,54,51,0.4)]' :
                    issue.severity === 'WARNING' ? 'bg-[rgba(227,179,65,0.2)] text-[#e3b341] border-[rgba(227,179,65,0.4)]' :
                    'bg-[rgba(31,111,235,0.2)] text-[#58a6ff] border-[rgba(31,111,235,0.4)]'
                  }`}>{issue.severity}</span>
                </div>
                <p className="text-[12px] text-[#8b949e] leading-relaxed italic">{issue.desc}</p>
                <div className="bg-[#161b22] border-l-[3px] border-[#da3633] p-3 rounded-r-[6px] font-mono text-[11px] text-[#c9d1d9] overflow-x-auto shadow-inner">
                  {issue.snippet}
                </div>
                <div className="bg-white/5 p-2 rounded-lg flex items-start gap-2">
                   <div className="text-[#e3b341] text-[12px] font-bold">💡 Fix:</div>
                   <p className="text-[12px] text-[#8b949e] leading-relaxed">{issue.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex items-center gap-2 border-t border-white/10">
           <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[11px] text-[#8b949e] flex items-center gap-2">
              <span className="text-[#f85149]">🔴</span> {data.summary?.critical || 0} Critical
           </div>
           <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[11px] text-[#8b949e] flex items-center gap-2">
              <span className="text-[#e3b341]">🟡</span> {data.summary?.warning || 0} Warnings
           </div>
           <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[11px] text-[#8b949e] flex items-center gap-2">
              <span className="text-[#58a6ff]">🔵</span> {data.summary?.info || 0} Info
           </div>
        </div>
      </div>
    </div>
  );

  const renderOptimizeCard = (data) => (
    <div className="rounded-[10px] p-4 border border-[rgba(35,134,54,0.15)] bg-[rgba(35,134,54,0.06)] border-t-[2px] border-t-[#238636] space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-2 mb-2">
        <h4 className="text-[13px] font-semibold text-[#e6edf3]">⚡ Optimization Report</h4>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <span className="text-[9px] font-black text-[#f85149] uppercase tracking-widest bg-[rgba(218,54,51,0.1)] px-2 py-0.5 rounded-md">Before</span>
            <pre className="bg-[#161b22] rounded-[8px] p-3 font-mono text-[12px] text-[#8b949e] border border-white/5 overflow-auto max-h-[250px] custom-scrollbar shadow-inner">{data.before}</pre>
          </div>
          <div className="space-y-1.5">
            <span className="text-[9px] font-black text-[#3fb950] uppercase tracking-widest bg-[rgba(35,134,54,0.1)] px-2 py-0.5 rounded-md">After</span>
            <pre className="bg-[#161b22] rounded-[8px] p-3 font-mono text-[12px] text-[#c9d1d9] border border-[#23863633] overflow-auto max-h-[250px] custom-scrollbar shadow-md">{data.after}</pre>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#6e7681] uppercase tracking-widest block mb-2">Improvements List</span>
          <div className="space-y-2">
            {data.improvements?.map((imp, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-3">
                   <div className="text-[#3fb950] text-[12px]">✓</div>
                   <span className="text-[12px] text-[#c9d1d9] leading-tight">{imp.desc}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[rgba(35,134,54,0.15)] text-[10px] font-bold text-[#3fb950] uppercase tracking-tighter shadow-sm">{imp.gain} Gain</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
           <div className="flex-1 mr-6">
              <div className="flex items-center justify-between mb-1.5">
                 <span className="text-[11px] text-[#6e7681] font-bold uppercase tracking-wider">Performance Score</span>
                 <span className="text-[13px] font-black text-[#3fb950]">{data.score}/100</span>
              </div>
              <div className="h-[6px] w-full bg-[rgba(255,255,255,0.08)] rounded-[3px] overflow-hidden shadow-inner relative">
                 <div className="h-full bg-gradient-to-r from-[#238636] to-[#3fb950] transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(63,185,80,0.3)]" style={{width: `${data.score}%`}} />
              </div>
           </div>
           <button onClick={() => handleApplyCode(data.after)} className="h-9 px-5 bg-[#2386361a] border border-[#2386364d] rounded-xl text-[11px] font-black text-[#3fb950] uppercase hover:bg-[#2386362e] transition-all active:scale-95 shadow-lg flex items-center gap-2"><Zap size={14}/> Apply Fix</button>
        </div>
      </div>
    </div>
  );

  const renderDocsCard = (data) => (
    <div className="rounded-[10px] p-4 border border-[rgba(137,87,229,0.15)] bg-[rgba(137,87,229,0.06)] border-t-[2px] border-t-[#8957e5] space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-2 mb-2">
        <h4 className="text-[13px] font-semibold text-[#e6edf3]">📚 Documentation</h4>
      </div>

      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-bold text-[#6e7681] uppercase tracking-widest block mb-3">Function Architecture</span>
          <div className="space-y-4">
            {data.functions?.map((f, i) => (
              <div key={i} className="space-y-3 bg-[#0d1117]/40 p-4 rounded-xl border border-white/5 relative group">
                <code className="block bg-[#161b22] rounded-[6px] border border-[#8957e533] p-3 text-[#d2a8ff] font-mono text-[12px] overflow-x-auto shadow-inner">{f.signature}</code>
                <p className="text-[13px] text-[#c9d1d9] leading-relaxed">{f.description}</p>
                
                {f.params?.length > 0 && (
                  <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5">
                    <table className="w-full text-left">
                      <thead className="bg-white/[0.04]">
                        <tr className="text-[11px] text-[#8b949e] font-bold uppercase">
                          <th className="p-2.5">Name</th><th className="p-2.5">Type</th><th className="p-2.5">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-[12px] text-[#c9d1d9] font-medium leading-relaxed">
                        {f.params.map((p, j) => (
                          <tr key={j} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="p-2.5 font-mono text-[#79c0ff]">{p.name}</td>
                            <td className="p-2.5 text-[#8b949e] italic">{p.type}</td>
                            <td className="p-2.5">{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-[12px]">
                   <span className="text-[#6e7681] font-bold uppercase tracking-tight">Returns:</span>
                   <span className="px-2 py-0.5 bg-[rgba(137,87,229,0.15)] border border-[#8957e533] text-[#a78bfa] rounded-full text-[10px] font-bold uppercase tracking-tighter">{f.returns?.type}</span>
                   <span className="text-[#8b949e] italic">{f.returns?.desc}</span>
                </div>

                <details className="group/detail">
                   <summary className="text-[11px] text-[#8957e5] cursor-pointer hover:text-[#a78bfa] transition-all font-bold uppercase tracking-widest list-none flex items-center gap-2">
                      <span className="group-open/detail:rotate-90 transition-transform">▶</span> Show Example Usage
                   </summary>
                   <pre className="mt-3 bg-[#161b22] p-3 rounded-xl border border-white/5 font-mono text-[11px] text-[#8b949e] overflow-auto shadow-inner">{f.example}</pre>
                </details>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <span className="text-[10px] font-bold text-[#6e7681] uppercase tracking-widest block mb-4">Architectural Flow</span>
          <div className="bg-[#161b22] rounded-[6px] border border-[rgba(137,87,229,0.4)] p-5 overflow-x-auto custom-scrollbar relative shadow-inner">
             <svg width={data.logic_steps?.length * 150} height="80" className="mx-auto">
                <defs>
                   <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#8957e5" />
                   </marker>
                </defs>
                {data.logic_steps?.map((step, i) => (
                   <React.Fragment key={i}>
                      <rect x={i * 150} y="20" width="110" height="40" rx="6" fill="#161b22" stroke="rgba(137,87,229,0.4)" strokeWidth="1" />
                      <text x={i * 150 + 55} y="44" textAnchor="middle" fill="#c9d1d9" fontSize="11" fontFamily="JetBrains Mono">{step.from}</text>
                      {i < data.logic_steps.length - 1 && (
                         <path d={`M ${i * 150 + 110} 40 L ${(i + 1) * 150 - 10} 40`} stroke="#8957e5" strokeWidth="1.5" markerEnd="url(#arrowhead)" fill="none" />
                      )}
                   </React.Fragment>
                ))}
             </svg>
          </div>
        </div>

        <button onClick={() => handleDownloadDocs(data)} className="w-full h-[38px] rounded-[8px] bg-[rgba(137,87,229,0.08)] border border-[rgba(137,87,229,0.4)] text-[#a78bfa] text-[12px] font-semibold hover:bg-[rgba(137,87,229,0.18)] hover:shadow-[0_0_16px_rgba(137,87,229,0.25)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
           <Download size={14}/> Download Documentation as PDF
        </button>
      </div>
    </div>
  );
  const renderTestCard = (data) => (
    <div className="rounded-[10px] p-4 border border-[rgba(191,75,138,0.15)] bg-[rgba(191,75,138,0.06)] border-t-[2px] border-t-[#bf4b8a] space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] pb-2 mb-2">
        <h4 className="text-[13px] font-semibold text-[#e6edf3]">🧪 Test Suite</h4>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 p-3 rounded-xl flex items-center justify-between border border-white/10">
           <div className="flex items-center gap-4">
              <span className="text-[11px] text-[#3fb950] font-bold">● {data.summary?.passed || 0} Passed</span>
              <span className="text-[11px] text-[#f85149] font-bold">● {data.summary?.failed || 0} Failed</span>
              <span className="text-[11px] text-[#8b949e] font-bold">● {data.summary?.pending || 0} Pending</span>
           </div>
           <div className="w-[80px] h-[4px] bg-white/10 rounded-full overflow-hidden shrink-0"><div className="h-full bg-[#3fb950] transition-all duration-1000 ease-out" style={{width: `${(data.summary?.passed / (data.summary?.passed + data.summary?.failed + data.summary?.pending || 1)) * 100}%`}} /></div>
        </div>

        <div className="space-y-3">
          {data.test_cases?.map((t, i) => (
            <div key={i} className="bg-[#0d1117]/40 rounded-xl border border-white/5 p-4 group transition-all hover:bg-black/20">
              <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-3">
                    <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center text-[10px] ${
                       t.status === 'passing' ? 'border-[#3fb950] text-[#3fb950]' : 
                       t.status === 'failing' ? 'border-[#f85149] text-[#f85149]' : 
                       'border-[#4b5563] text-[#4b5563]'
                    }`}>{t.status === 'passing' ? '✓' : t.status === 'failing' ? '✕' : '○'}</div>
                    <span className="text-[13px] text-[#c9d1d9] font-medium leading-tight">{t.name}</span>
                 </div>
                 <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold text-[#8b949e] uppercase tracking-tighter">{t.framework}</span>
              </div>
              <details className="group/test">
                 <summary className="text-[10px] text-[#bf4b8a] cursor-pointer hover:text-[#e879a0] transition-all font-bold uppercase tracking-widest list-none flex items-center gap-2">
                    <span className="group-open/test:rotate-90 transition-transform">▶</span> Show Test Code
                 </summary>
                 <pre className="mt-3 bg-[#161b22] p-3 rounded-xl border border-white/5 font-mono text-[11px] text-[#8b949e] overflow-auto shadow-inner">{t.code}</pre>
              </details>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => { navigator.clipboard.writeText(data.test_cases?.map(t => t.code).join('\n\n')); alert('Full suite copied'); }} className="flex-1 h-[38px] rounded-[8px] bg-[rgba(191,75,138,0.08)] border border-[rgba(191,75,138,0.4)] text-[#e879a0] text-[12px] font-semibold hover:bg-[rgba(191,75,138,0.18)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
             <Copy size={14}/> Copy All Tests
          </button>
          <button className="flex-1 h-[38px] rounded-[8px] bg-[rgba(191,75,138,0.08)] border border-[rgba(191,75,138,0.4)] text-[#e879a0] text-[12px] font-semibold hover:bg-[rgba(191,75,138,0.18)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
             <Download size={14}/> Download .test
          </button>
        </div>
      </div>
    </div>
  );



  const renderMessageContent = (msg) => {
    let data = msg.content;
    
    // Failsafe: Try to extract JSON from string or even from data.text if it's there
    const extractJSON = (input) => {
      if (typeof input !== 'string') return null;
      try {
        let cleaned = input.trim();
        if (cleaned.includes('```')) {
          cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
        }
        // If it still doesn't look like JSON, try to find { ... }
        if (!cleaned.startsWith('{')) {
          const match = cleaned.match(/\{[\s\S]*\}/);
          if (match) cleaned = match[0];
        }
        return JSON.parse(cleaned);
      } catch (e) { return null; }
    };

    if (typeof data === 'string') {
      const parsed = extractJSON(data);
      if (parsed) data = parsed;
    } else if (data && data.text && !data.type) {
      const parsed = extractJSON(data.text);
      if (parsed) data = { ...data, ...parsed };
    }

    return (
      <div className="w-full text-left space-y-4">
        {(data.text && (data.raw || !data.type)) && (
          <div className="text-[13px] text-[#c9d1d9] leading-[1.8] bg-[#161b22] border border-white/5 p-5 rounded-2xl shadow-xl w-full text-left">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.text}</ReactMarkdown>
            
            {/* Auto-detect Architectural Maps in the text */}
            {(data.text.includes('## LOGIC_TRACE') || data.text.includes('## SYSTEM_DESIGN')) && (
               <div className="mt-6 pt-6 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setMermaidChart(data.text);
                      setShowVisualizer(true);
                    }}
                    className="w-full py-4 rounded-xl bg-[#7c3aed15] border border-[#7c3aed44] text-[#a78bfa] text-[12px] font-black uppercase tracking-widest hover:bg-[#7c3aed25] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#7c3aed11]"
                  >
                    <Share2 size={16}/> Launch Architectural Command Center
                  </button>
               </div>
            )}
          </div>
        )}
        {(data.type === 'explain' && !data.raw) && renderExplainCard(data)}
        {(data.type === 'debug' && !data.raw) && renderDebugCard(data)}
        {(data.type === 'optimize' && !data.raw) && renderOptimizeCard(data)}
        {(data.type === 'docs' && !data.raw) && renderDocsCard(data)}
        {(data.type === 'test' && !data.raw) && renderTestCard(data)}
        {(data.type === 'visualize' && !data.raw) && (
          <div className="w-full bg-[#161b22] border border-white/5 p-6 rounded-2xl shadow-2xl space-y-4">
             <div className="flex items-center gap-3 text-[#a78bfa]">
               <Share2 size={20} className="animate-pulse" />
               <h3 className="text-[14px] font-bold uppercase tracking-wider">Architectural Blueprint Ready</h3>
             </div>
             <p className="text-[13px] text-[#c9d1d9] leading-relaxed">
               I have synthesized a multi-layer architectural logic map and a high-fidelity system design blueprint for your code.
             </p>
             <button 
                onClick={() => {
                  const chart = data.flowchart || data.mermaid || (typeof data === 'string' ? data : JSON.stringify(data));
                  setMermaidChart(chart);
                  setShowVisualizer(true);
                }}
                className="w-full py-4 rounded-xl bg-[#7c3aed15] border border-[#7c3aed44] text-[#a78bfa] text-[12px] font-black uppercase tracking-widest hover:bg-[#7c3aed25] transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                Launch Expert Command Center
              </button>
          </div>
        )}
        
        {(!data.type && !data.text) && (
          <SuggestionCard content={typeof data === 'string' ? data : JSON.stringify(data)} />
        )}
        {/* If we have data but no renderer handled it and no text, show raw JSON as fallback */}
        {data.type && !['explain','debug','optimize','docs','test','visualize'].includes(data.type) && !data.text && (
           <div className="text-[12px] font-mono text-[#8b949e] p-4 bg-black/20 rounded-lg">
             {JSON.stringify(data, null, 2)}
           </div>
        )}
      </div>
    );
  };

  // =================================================================
  // ELITE HELPER COMPONENTS
  // =================================================================

  const TerminalPanel = () => (
    <motion.div 
      initial={{ height: 0 }} 
      animate={{ height: showTerminal ? 240 : 0 }} 
      className="bg-[#0d1117] border-t border-white/10 overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#161b22]">
        <div className="flex items-center gap-3">
          <Terminal size={14} className="text-[#7c3aed]"/>
          <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-widest">Debug Console</span>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setTerminalLogs([])} className="text-[10px] text-[#6e7681] hover:text-white uppercase font-bold">Clear</button>
           <button onClick={() => setShowTerminal(false)} className="text-[#6e7681] hover:text-white"><Minimize2 size={14}/></button>
        </div>
      </div>
      <div className="flex-1 p-4 font-mono text-[12px] overflow-y-auto space-y-1.5 custom-scrollbar">
        {terminalLogs.map((log, i) => (
          <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-1">
            <span className="text-[#4b5563] shrink-0">[{log.time}]</span>
            <span className={`
              ${log.type === 'error' ? 'text-[#f85149]' : 
                log.type === 'success' ? 'text-[#3fb950]' : 
                log.type === 'warn' ? 'text-[#d29922]' : 'text-[#8b949e]'}
            `}>
              {log.type === 'success' ? '✔' : log.type === 'error' ? '✘' : '●'} {log.message}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 text-[#7c3aed]">
          <span className="animate-pulse">❯</span>
          <span className="w-2 h-4 bg-[#7c3aed] animate-blink"/>
        </div>
      </div>
    </motion.div>
  );

  const IntelligenceDashboard = () => (
    <motion.div 
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: showDashboard ? 320 : 0, opacity: showDashboard ? 1 : 0 }}
      className="bg-[#0d1117] border-l border-white/10 flex flex-col shrink-0 relative overflow-hidden"
    >
      <div className="p-6 space-y-8 h-full overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-2">
           <h3 className="text-[12px] font-black text-[#8b949e] uppercase tracking-[0.2em] flex items-center gap-2">
             <LayoutDashboard size={14} className="text-[#7c3aed]"/> Intelligence
           </h3>
           <Sparkles size={16} className="text-[#7c3aed] animate-pulse"/>
        </div>

        {/* HEALTH SCORE GAUGE */}
        <div className="relative h-40 flex items-center justify-center">
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-white/5 relative flex items-center justify-center">
                 <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="46" 
                      fill="transparent" 
                      stroke="#7c3aed" 
                      strokeWidth="4" 
                      strokeDasharray="289" 
                      strokeDashoffset={289 - (289 * dashboardMetrics.score / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                 </svg>
                 <div className="text-center">
                    <span className="text-3xl font-black text-white">{dashboardMetrics.score}</span>
                    <span className="block text-[9px] text-[#8b949e] font-bold tracking-tighter">SURYA SCORE</span>
                 </div>
              </div>
           </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 gap-3">
           {[
             { label: 'Complexity', val: dashboardMetrics.complexity, icon: Cpu, color: '#ff7b72' },
             { label: 'Security', val: dashboardMetrics.security, icon: AlertCircle, color: '#3fb950' },
             { label: 'Optimizations', val: dashboardMetrics.optimizations, icon: Zap, color: '#d29922' },
             { label: 'Reliability', val: '98%', icon: Check, color: '#58a6ff' }
           ].map((m, i) => (
             <div key={i} className="bg-white/5 border border-white/5 p-3 rounded-xl space-y-1 hover:bg-white/10 transition-all cursor-default">
                <m.icon size={12} style={{ color: m.color }}/>
                <div className="flex flex-col">
                   <span className="text-[9px] text-[#6e7681] font-bold uppercase">{m.label}</span>
                   <span className="text-[13px] font-mono text-white truncate">{m.val}</span>
                </div>
             </div>
           ))}
        </div>

        <div className="space-y-4 pt-4">
           <span className="text-[10px] font-bold text-[#4b5563] uppercase tracking-widest block">AI Predictions</span>
           <div className="space-y-3">
              <div className="p-3 bg-gradient-to-br from-[#1f6feb1a] to-transparent border border-[#1f6feb33] rounded-xl text-[11px] text-[#8b949e] leading-relaxed">
                 AI projects 15% reduction in latency if loops are vectorized.
              </div>
              <div className="p-3 bg-gradient-to-br from-[#d299221a] to-transparent border border-[#d2992233] rounded-xl text-[11px] text-[#8b949e] leading-relaxed">
                 Memory leak potential detected in nested closure at line 24.
              </div>
           </div>
        </div>
      </div>
      
      {/* GLOW DECORATION */}
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#7c3aed] blur-[100px] opacity-20 pointer-events-none"/>
    </motion.div>
  );

  const handleRunCode = () => {
    setShowTerminal(true);
    const time = () => new Date().toTimeString().slice(0, 8);
    setTerminalLogs(prev => [...prev, { type: 'info', message: `Executing ${activeTab}...`, time: time() }]);
    
    setTimeout(() => {
      setTerminalLogs(prev => [...prev, { type: 'success', message: 'Compilation successful', time: time() }]);
      setTerminalLogs(prev => [...prev, { type: 'info', message: 'Environment: Codify Node-Runtime v20', time: time() }]);
      
      // Pseudo-output based on boilerplate
      if (code.includes('console.log')) {
        const match = code.match(/console\.log\(['"](.*)['"]\)/);
        if (match) {
          setTerminalLogs(prev => [...prev, { type: 'default', message: `OUT: ${match[1]}`, time: time() }]);
        }
      }
      
      setTerminalLogs(prev => [...prev, { type: 'success', message: 'Process exited with status 0.', time: time() }]);
    }, 1200);
  };

  const VisualizerOverlay = () => {
    const [activeVizTab, setActiveVizTab] = useState('logic');
    
    // Parse the chart data to separate Logic Trace and System Design
    const parseCharts = () => {
      const logicMatch = mermaidChart.match(/## LOGIC_TRACE\s*(?:```mermaid)?\s*([\s\S]*?)\s*(?:```|## SYSTEM_DESIGN|$)/i);
      const systemMatch = mermaidChart.match(/## SYSTEM_DESIGN\s*(?:```mermaid)?\s*([\s\S]*?)\s*(?:```|$)/i);
      
      return {
        logic: logicMatch ? logicMatch[1].trim() : (mermaidChart.includes('graph') ? mermaidChart : ''),
        system: systemMatch ? systemMatch[1].trim() : ''
      };
    };

    const charts = parseCharts();
    const currentChart = activeVizTab === 'logic' ? charts.logic : charts.system;

    return (
      <AnimatePresence>
        {showVisualizer && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute inset-4 z-[100] bg-[#030508]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          >
            {/* HEADER / CONTROL CENTER */}
            <div className="flex items-center justify-between px-8 py-6 bg-white/[0.02] border-b border-white/5 relative">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center shadow-lg shadow-[#7c3aed44]"><Layout size={20} className="text-white"/></div>
                     <div className="flex flex-col">
                        <span className="text-[14px] font-black tracking-tight text-white uppercase">Architectural Command Center</span>
                        <span className="text-[9px] font-bold text-[#7c3aed] uppercase tracking-widest animate-pulse">Deep Logic Synapse Active</span>
                     </div>
                  </div>

                  <div className="h-10 w-px bg-white/10 mx-2"/>

                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                     <button 
                        onClick={() => setActiveVizTab('logic')}
                        className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeVizTab === 'logic' ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed33]' : 'text-[#6e7681] hover:text-white'}`}
                     >
                        Logic Trace
                     </button>
                     <button 
                        onClick={() => setActiveVizTab('system')}
                        className={`px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeVizTab === 'system' ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed33]' : 'text-[#6e7681] hover:text-white'}`}
                     >
                        System Design
                     </button>
                  </div>
               </div>

               <div className="flex items-center gap-6">
                  <div className="hidden md:flex items-center gap-4">
                     <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-[#4b5563] uppercase">Consistency</span>
                        <span className="text-[14px] font-mono text-[#3fb950] font-bold">100%</span>
                     </div>
                     <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-[#4b5563] uppercase">Complexity</span>
                        <span className="text-[14px] font-mono text-[#e3b341] font-bold">Linear</span>
                     </div>
                  </div>
                  <button onClick={() => setShowVisualizer(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-[#f8514915] hover:text-[#f85149] text-[#8b949e] transition-all border border-white/5"><X size={20}/></button>
               </div>
               
               {/* PROGRESS BAR DECORATION */}
               <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#7c3aed] to-transparent w-full opacity-50"/>
            </div>

            {/* CANVAS */}
            <div className="flex-1 p-12 overflow-auto flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.03)_0%,transparent_100%)] relative custom-scrollbar">
               <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeVizTab + mermaidChart.length}
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[1200px]"
                  >
                     {currentChart ? (
                        <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/[0.03] shadow-inner relative group">
                           <div className="absolute -inset-4 bg-gradient-to-br from-[#7c3aed08] to-[#4f46e508] rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity blur-2xl pointer-events-none"/>
                           <MermaidChart chart={currentChart} id={Date.now()} />
                        </div>
                     ) : (
                        <div className="flex flex-col items-center gap-6 text-[#4b5563]">
                           <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center animate-pulse">
                              <Cpu size={40} className="text-[#7c3aed] opacity-50"/>
                           </div>
                           <div className="text-center">
                              <span className="text-lg font-bold text-white/50">Awaiting Signal...</span>
                              <p className="text-[12px] uppercase tracking-[0.3em] mt-2">Engine is scanning for architectural data</p>
                           </div>
                        </div>
                     )}
                  </motion.div>
               </AnimatePresence>

               {/* DECORATIVE ELEMENTS */}
               <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-[#7c3aed] blur-[200px] opacity-[0.03] pointer-events-none" />
               <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#4f46e5] blur-[200px] opacity-[0.03] pointer-events-none" />
               
               {/* UI OVERLAY - CORNER DECORATIONS */}
               <div className="absolute top-10 left-10 pointer-events-none opacity-20">
                  <div className="w-20 h-[1px] bg-white"/>
                  <div className="h-20 w-[1px] bg-white"/>
               </div>
               <div className="absolute bottom-10 right-10 pointer-events-none opacity-20 rotate-180">
                  <div className="w-20 h-[1px] bg-white"/>
                  <div className="h-20 w-[1px] bg-white"/>
               </div>
            </div>

            {/* FOOTER STATS */}
            <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#3fb95015] border border-[#3fb95033]">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse"/>
                     <span className="text-[9px] font-black text-[#3fb950] uppercase tracking-widest">System Operational</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#4b5563] uppercase tracking-widest">Protocol: Neural-Architecture-Sync-v4</span>
               </div>
               <div className="text-[10px] font-black text-[#4b5563] uppercase tracking-widest">
                  © 2026 SuryaX Advanced Intelligence
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };


  return (
    <div className="h-screen w-screen flex bg-[#030508] text-[#f0f0f5] font-sans overflow-hidden selection:bg-[#7c3aed33]">
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
        .animate-blink { animation: blink 1s step-end infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #374151; }
        .glass-panel { background: rgba(13, 17, 23, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }

        /* Flowing Path Animation for Mermaid */
        .mermaid svg .edgePath path {
          stroke-dasharray: 8;
          animation: flow 20s linear infinite;
          stroke: #4f46e5 !important;
          stroke-width: 1.5px !important;
        }
        @keyframes flow { to { stroke-dashoffset: -1000; } }
      `}</style>
      
      {/* SIDEBAR */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="glass-panel border-r border-white/10 flex flex-col z-40 relative group overflow-hidden shrink-0"
      >
        <div className="p-6 flex items-center justify-between mb-4 mt-2">
           <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-[30px] h-[30px] rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center shadow-lg shadow-[#7c3aed44]"><Sparkles size={16} className="text-white"/></div>
              <span className="text-[15px] font-black tracking-tighter uppercase text-white/90" style={{ fontFamily: 'Inter' }}>SuryaX</span>
           </Link>
           <button onClick={() => setIsSidebarOpen(false)} className="opacity-0 group-hover:opacity-100 transition-all text-[#6e7681] hover:text-white"><Minimize2 size={16}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-8 custom-scrollbar">
           <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                 <span className="text-[10px] uppercase text-[#4b4d5e] font-black tracking-widest">Explorer</span>
                 <div className="flex items-center gap-1.5">
                    <button className="text-[#4b4d5e] hover:text-[#7c3aed] transition-colors"><FilePlus size={14}/></button>
                    <button className="text-[#4b4d5e] hover:text-[#7c3aed] transition-colors"><FolderPlus size={14}/></button>
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                 <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-[#7c3aed44] cursor-pointer transition-all group">
                    <Upload size={14} className="text-[#6e7681] group-hover:text-[#7c3aed]"/>
                    <span className="text-[12px] text-[#9192a0] font-medium group-hover:text-white">Upload File</span>
                    <input type="file" multiple className="hidden" onChange={handleUpload}/>
                 </label>
                 <label className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-[#7c3aed44] cursor-pointer transition-all group">
                    <FolderPlus size={14} className="text-[#6e7681] group-hover:text-[#7c3aed]"/>
                    <span className="text-[12px] text-[#9192a0] font-medium group-hover:text-white">Upload Folder</span>
                    <input type="file" webkitdirectory="true" directory="true" multiple className="hidden" onChange={handleUpload}/>
                 </label>
              </div>
              
              <div className="space-y-1">
                 {folders.map(folder => (
                   <div key={folder.id} className="space-y-1">
                      <div onClick={() => toggleFolder(folder.id)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer text-[#9192a0] text-[13px] transition-all">
                         {folder.isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                         <Folder size={14} className="text-[#7c3aed]"/>
                         <span className="font-medium">{folder.name}</span>
                      </div>
                      <AnimatePresence>
                         {folder.isOpen && (
                           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-4 space-y-1 overflow-hidden">
                              {fileSystem.filter(f => f.parentId === folder.id).map(file => (
                                <div key={file.id} onClick={() => { setActiveTab(file.name); setCode(file.content); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${activeTab === file.name ? 'bg-[#7c3aed15] text-[#a78bfa] border border-[#7c3aed33]' : 'text-[#6e7681] hover:bg-white/5'}`}>
                                   <FileCode size={14}/>
                                   <span className="text-[12px] font-medium">{file.name}</span>
                                </div>
                              ))}
                           </motion.div>
                         )}
                      </AnimatePresence>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="p-4 border-t border-white/5">
           <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/5 text-[12px] font-bold text-[#9192a0] hover:bg-white/10 transition-all">
              <Plus size={14}/> New Workspace
           </button>
        </div>
      </motion.aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#030508]">
        {/* NAV BAR */}
        <header className="h-[56px] px-6 border-b border-white/5 flex items-center justify-between z-30 glass-panel">
           <div className="flex items-center gap-6">
              {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="text-[#9192a0] hover:text-white"><Menu size={20}/></button>}
              <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-md">
                 <div className="w-2 h-2 rounded-full bg-[#3fb950] shadow-[0_0_8px_#3fb95088] animate-pulse"/>
                 <span className="text-[11px] font-black text-[#8b949e] uppercase tracking-wider">Engine: SuryaX v2</span>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <a 
                 href="/expert.html"
                 className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white text-[11px] font-black uppercase hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-[#7c3aed44] border border-white/10 group"
               >
                  <Sparkles size={14} className="group-hover:animate-pulse"/> <span>EXPERT MODE ON</span>
               </a>
              <div className="h-6 w-px bg-white/10 mx-1"/>
              <div className="relative">
                 <button onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[#9192a0] hover:text-white transition-all">
                    <div className="w-2 h-2 rounded-full" style={{ background: language.color }}/>
                    <span className="text-[11px] font-bold uppercase">{language.name}</span>
                    <ChevronDown size={14}/>
                 </button>
                 <div className={`absolute right-0 top-full mt-2 w-[180px] bg-[#0d1117] border border-white/10 rounded-xl shadow-3xl z-[100] p-1.5 overflow-hidden transition-all origin-top-right ${isLangDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                   {LANGUAGES.map(lang => (
                     <button key={lang.value} onClick={() => { setLanguage(lang); setIsLangDropdownOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] transition-all ${language.value === lang.value ? 'bg-[#7c3aed15] text-[#a78bfa]' : 'text-[#6e7681] hover:bg-white/5'}`}>
                        <span>{lang.name}</span>
                        {language.value === lang.value && <Check size={14}/>}
                     </button>
                   ))}
                 </div>
              </div>
              <button onClick={() => setShowDashboard(!showDashboard)} className={`px-3 py-1.5 rounded-lg border transition-all ${showDashboard ? 'bg-[#7c3aed15] border-[#7c3aed80] text-[#a78bfa]' : 'bg-white/5 border-white/5 text-[#9192a0]'}`}>
                 <BarChart3 size={16}/>
              </button>
           </div>
        </header>

        {/* WORKSPACE AREA */}
        <div className="flex-1 flex overflow-hidden">
           <div className="flex-1 flex flex-col min-w-0">
              {/* TABS / BREADCRUMBS */}
              <div className="h-[40px] px-6 bg-[#030508] border-b border-white/5 flex items-center justify-between text-[11px] text-[#6e7681] font-medium tracking-tight">
                 <div className="flex items-center gap-2">
                    <span className="opacity-50">src / </span>
                    <span className="text-white/80 font-bold tracking-wide">{activeTab}</span>
                    {isUnsaved && <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] ml-1 shadow-[0_0_8px_#7c3aed]"/>}
                 </div>
                 {showDiff && (
                   <button onClick={() => setShowDiff(false)} className="px-4 py-1 rounded-full bg-white/5 border border-[#7c3aed80] text-[#a78bfa] text-[10px] font-black uppercase hover:bg-[#7c3aed15] transition-all">Exit Diff View</button>
                 )}
              </div>

              {/* EDITOR CORE */}
              <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                 <VisualizerOverlay/>
                 <div className="flex-1 min-h-0 relative">
                    {showDiff ? (
                      <DiffEditor 
                        height="100%" 
                        theme="vs-dark" 
                        language={language.value} 
                        original={originalCode} 
                        modified={modifiedCode} 
                        options={{ 
                          fontSize: 13, 
                          minimap: { enabled: false }, 
                          automaticLayout: true, 
                          padding: { top: 20 }, 
                          scrollBeyondLastLine: false, 
                          renderSideBySide: true,
                          fastScrollSensitivity: 7,
                          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }
                        }} 
                      />
                    ) : (
                      <Editor 
                        height="100%" 
                        theme="vs-dark" 
                        language={language.value} 
                        value={code} 
                        onChange={(v) => { setCode(v || ""); setIsUnsaved(true); }} 
                        options={{ 
                          fontSize: 13, 
                          minimap: { enabled: false }, 
                          automaticLayout: true, 
                          padding: { top: 20 }, 
                          scrollBeyondLastLine: false, 
                          fontLigatures: true, 
                          cursorBlinking: 'smooth', 
                          cursorSmoothCaretAnimation: "on",
                          fastScrollSensitivity: 7,
                          mouseWheelZoom: true,
                          renderLineHighlight: 'all',
                          scrollbar: {
                            vertical: 'visible',
                            horizontal: 'visible',
                            verticalScrollbarSize: 8,
                            horizontalScrollbarSize: 8,
                            useShadows: false
                          },
                          fixedOverflowWidgets: true,
                          overviewRulerBorder: false,
                          hideCursorInOverviewRuler: true
                        }} 
                      />
                    )}
                 </div>
                 <TerminalPanel/>
              </div>

              {/* STATUS BAR */}
              <footer className="h-[28px] px-6 border-t border-white/5 bg-[#030508] flex items-center justify-between z-30">
                 <div className="flex items-center gap-4 text-[10px] font-bold text-[#4b4d5e] uppercase tracking-widest">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors" onClick={() => setShowTerminal(!showTerminal)}><Terminal size={12}/> Console</div>
                    <div className="flex items-center gap-1.5"><Monitor size={12}/> Engine Online</div>
                 </div>
                 <div className="flex items-center gap-4 text-[10px] font-medium text-[#4b4d5e]">
                    <span>UTF-8</span>
                    <span>Line {code.split('\n').length}</span>
                    <span className="text-[#3fb950] font-black flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse"/> LIVE CONNECT</span>
                 </div>
              </footer>
           </div>

           <IntelligenceDashboard/>
        </div>
      </main>

      {/* RESIZER */}
      <div 
        onMouseDown={() => setIsResizing(true)}
        className={`w-[2px] cursor-col-resize hover:bg-[#7c3aed] transition-colors z-40 ${isResizing ? 'bg-[#7c3aed]' : 'bg-transparent'}`}
      />

      {/* ASSISTANT PANEL */}
      <motion.aside 
        initial={false}
        animate={{ width: assistantWidth }}
        className="glass-panel border-l border-white/10 flex flex-col z-40 shadow-[-10px_0_40px_rgba(0,0,0,0.5)]"
      >
        <div className="h-[64px] border-b border-white/10 flex items-center px-6 justify-between shrink-0 bg-[#0d1117] relative">
           <div className="flex items-center gap-3">
              <div className="relative">
                 <div className="w-[32px] h-[32px] rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center border border-white/10 shadow-lg shadow-[#7c3aed33]">
                    <Sparkles size={16} className="text-white"/>
                 </div>
                 <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3fb950] border-2 border-[#0d1117]"/>
              </div>
              <div className="flex flex-col">
                 <span className="text-[14px] font-black text-white tracking-tight leading-4 uppercase">Assistant</span>
                 <span className="text-[9px] font-bold text-[#3fb950] uppercase tracking-widest">Active Intelligence</span>
              </div>
           </div>
           
           <div className="flex items-center gap-1.5 px-2">
              <button onClick={() => setAssistantWidth(300)} className="w-6 h-6 rounded flex items-center justify-center text-[#4b4d5e] hover:text-white hover:bg-white/5 transition-all transition-all"><div className="w-1 h-3 border-l border-r border-[#4b4d5e]"/></button>
              <button onClick={() => setAssistantWidth(450)} className="w-6 h-6 rounded flex items-center justify-center text-[#4b4d5e] hover:text-white hover:bg-white/5 transition-all"><Layout size={12}/></button>
              <button onClick={() => setAssistantWidth(700)} className="w-6 h-6 rounded flex items-center justify-center text-[#4b4d5e] hover:text-white hover:bg-white/5 transition-all"><div className="w-3 h-3 border border-[#4b4d5e]"/></button>
           </div>
           
           <div className="flex items-center gap-2">
              <button 
                title="Share & Architecture"
                onClick={() => {
                  const chart = `graph TB\n  subgraph UI["Interface Layer"]\n    A[View: ${activeTab}]\n    B[Local State]\n  end\n  subgraph Logic["Intelligence Engine"]\n    C{Logic Router}\n    D[SuryaX Optimizer]\n    E[Quality Controller]\n  end\n  subgraph Data["Infrastructure"]\n    F[(Data Vault)]\n    G[Edge API]\n  end\n  A --> C\n  C --> D\n  D --> E\n  E --> F\n  D --> G`;
                  setMermaidChart(chart);
                  setShowVisualizer(true);
                }}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#9192a0] hover:text-[#a78bfa] hover:bg-[#7c3aed15] transition-all shadow-sm"
              >
                 <Share2 size={16}/>
              </button>
           </div>
           <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#7c3aed] to-transparent w-full opacity-30 shadow-[0_0_8px_#7c3aed]"/>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative bg-[#030508]/10">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[88%] group ${msg.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start w-full'}`}>
                   {msg.role === 'assistant' ? renderMessageContent(msg) : (
                       <div className="text-[13px] bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white p-4 px-5 rounded-2xl rounded-tr-none shadow-lg shadow-[#7c3aed22] font-semibold border border-white/10">{msg.content.text || msg.content}</div>
                    )}
                    <span className="text-[10px] font-black text-[#4b4d5e] mt-2 group-hover:opacity-100 transition-opacity uppercase tracking-widest">{msg.time} • {msg.role} Agent</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-[#161b22] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                   <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#7c3aed] animate-bounce [animation-delay:-0.3s]"/>
                      <div className="w-2 h-2 rounded-full bg-[#7c3aed] animate-bounce [animation-delay:-0.15s]"/>
                      <div className="w-2 h-2 rounded-full bg-[#7c3aed] animate-bounce"/>
                   </div>
                   <span className="text-[10px] font-black text-[#8b949e] uppercase tracking-[0.2em] ml-1">AI Thinking...</span>
                </div>
             </motion.div>
          )}
          <div ref={chatScrollRef} className="h-4"/>
        </div>

        {/* INPUT AREA */}
        <div className="p-6 border-t border-white/10 bg-[#0d1117] space-y-6 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
           <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'explain', label: 'EXPLAIN', emoji: '📄', hover: 'hover:border-[#1f6feb80] hover:bg-[#1f6feb1a] hover:text-[#58a6ff]' },
                { id: 'debug', label: 'FIX', emoji: '🐛', hover: 'hover:border-[#da363380] hover:bg-[#da36331a] hover:text-[#f85149]' },
                { id: 'optimize', label: 'OPTIMIZE', emoji: '⚡', hover: 'hover:border-[#23863680] hover:bg-[#2386361a] hover:text-[#3fb950]' },
                { id: 'docs', label: 'DOCS', emoji: '📚', hover: 'hover:border-[#8957e580] hover:bg-[#8957e51a] hover:text-[#a78bfa]' },
                { id: 'test', label: 'TEST', emoji: '🧪', hover: 'hover:border-[#bf4b8a80] hover:bg-[#bf4b8a1a] hover:text-[#e879a0]' }
              ].map(btn => (
                <button 
                  key={btn.id}
                  onClick={() => handleSend(btn.id)}
                  className={`flex flex-col items-center justify-center min-w-[70px] flex-1 py-3 rounded-xl bg-white/5 border border-white/5 transition-all group active:scale-95 ${btn.hover}`}
                >
                   <span className="text-[16px] mb-1 group-hover:scale-110 transition-transform">{btn.emoji}</span>
                   <span className="text-[8px] font-black tracking-tighter uppercase">{btn.label}</span>
                </button>
              ))}
           </div>

           <div className="relative group p-[1px] rounded-2xl bg-gradient-to-r from-transparent via-[#7c3aed00] to-transparent hover:via-[#7c3aed44] transition-all duration-700">
              <div className="bg-[#050709] rounded-2xl p-2 flex items-end gap-2 border border-white/10 focus-within:border-[#7c3aed44] transition-all relative overflow-hidden">
                 <textarea 
                   ref={textareaRef}
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                   placeholder="Consult intelligence..."
                   rows="1"
                   className="flex-1 bg-transparent text-[13px] text-white p-3 py-4 outline-none resize-none max-h-[200px] leading-relaxed custom-scrollbar placeholder:text-[#4b4d5e] placeholder:font-bold placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                 />
                 <button 
                   onClick={() => handleSend()}
                   disabled={!inputValue.trim() || isTyping}
                   className="w-[44px] h-[44px] rounded-xl flex items-center justify-center bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white hover:brightness-110 active:scale-90 transition-all shadow-lg shadow-[#7c3aed44] disabled:opacity-30 mb-2"
                 >
                    <Send size={18}/>
                 </button>
              </div>
           </div>
           <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black text-[#4b4d5e] uppercase tracking-[0.2em] flex items-center gap-1.5"><Sparkles size={10} className="text-[#7c3aed] animate-pulse"/> EXPERT SYSTEM</span>
              <span className="text-[9px] font-bold text-[#4b4d5e] opacity-40 uppercase">Shift + Enter for multi-line</span>
           </div>
        </div>
      </motion.aside>

      {/* OVERLAYS */}
      <AnimatePresence>
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[100]"
          >
             <div className="absolute top-0 right-[380px] w-[300px] h-[300px] bg-[#7c3aed] blur-[180px] opacity-[0.08] animate-pulse"/>
             <div className="absolute bottom-0 left-[260px] w-[300px] h-[300px] bg-[#4f46e5] blur-[180px] opacity-[0.08] animate-pulse [animation-delay:1s]"/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// HELPER: FOLDER TREE
const FolderNode = ({ folder, files, toggleFolder, setActiveTab, activeTab, onDragStart, onDrop, newFolderInput, setNewFolderInput, handleCreateFolder }) => (
  <div onDrop={(e) => { e.preventDefault(); onDrop(e, folder.id); }} onDragOver={(e) => e.preventDefault()} className="select-none">
    <div 
      onClick={() => toggleFolder(folder.id)} 
      className="group h-10 flex items-center gap-3 px-3 cursor-pointer hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5"
    >
       <ChevronRight size={14} className={`text-[#4b5563] transition-transform duration-300 ${folder.isOpen ? 'rotate-90 text-[#7c3aed]' : ''}`} />
       <Folder size={16} className={`${folder.isOpen ? 'text-[#7c3aed]' : 'text-[#6e7681]'} transition-colors`} fill={folder.isOpen ? 'currentColor' : 'none'} style={{ fillOpacity: 0.1 }} />
       <span className={`text-[13px] font-medium tracking-tight ${folder.isOpen ? 'text-white' : 'text-[#8b949e]'}`}>{folder.name}</span>
    </div>
    <AnimatePresence>
      {folder.isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }} 
          animate={{ height: 'auto', opacity: 1 }} 
          exit={{ height: 0, opacity: 0 }}
          className="pl-6 space-y-1 mt-1 border-l border-white/5 ml-[18px]"
        >
           {files.filter(f => f.parentId === folder.id).map(file => (
             <FileItem key={file.id} file={file} activeTab={activeTab} setActiveTab={setActiveTab} onDragStart={onDragStart} />
           ))}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const FileItem = ({ file, activeTab, setActiveTab, onDragStart }) => (
  <div 
    draggable onDragStart={(e) => onDragStart(e, file.id)}
    onClick={() => setActiveTab(file.name, file.content)}
    className={`h-9 flex items-center gap-3 px-3 rounded-xl cursor-pointer transition-all border ${activeTab === file.name ? 'bg-[#7c3aed15] border-[#7c3aed44] text-[#a78bfa] shadow-[0_0_15px_#7c3aed11]' : 'border-transparent text-[#6e7681] hover:bg-white/5 hover:text-[#9192a0]'}`}
  >
     <FileCode size={14} className={activeTab === file.name ? 'text-[#7c3aed]' : 'text-[#4b5563]'}/>
     <span className="text-[12px] font-medium tracking-tight truncate">{file.name}</span>
  </div>
);

// RENDERER FOR SUGGESTIONS
const SuggestionCard = ({ content }) => (
  <div className="bg-[#0f111a] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
     <div className="relative z-10 markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
     </div>
     <div className="absolute top-0 right-0 w-32 h-32 bg-[#7c3aed] blur-[80px] opacity-[0.03] pointer-events-none"/>
  </div>
);

export default HomeView;
