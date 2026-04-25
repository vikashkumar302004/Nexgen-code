import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Landing.css';

// --- Framer Motion Variants ---
const V = {
  up: {
    hidden:  { opacity:0, y:40 },
    show:    { opacity:1, y:0, transition:{ duration:0.75, ease:[0.16,1,0.3,1] } }
  },
  upFast: {
    hidden:  { opacity:0, y:24 },
    show:    { opacity:1, y:0, transition:{ duration:0.5, ease:[0.16,1,0.3,1] } }
  },
  left: {
    hidden:  { opacity:0, x:-44 },
    show:    { opacity:1, x:0, transition:{ duration:0.75, ease:[0.16,1,0.3,1] } }
  },
  right: {
    hidden:  { opacity:0, x:44 },
    show:    { opacity:1, x:0, transition:{ duration:0.75, ease:[0.16,1,0.3,1] } }
  },
  pop: {
    hidden:  { opacity:0, scale:0.82 },
    show:    { opacity:1, scale:1, transition:{ duration:0.55, ease:[0.34,1.56,0.64,1] } }
  },
  stagger: {
    hidden: {},
    show:   { transition:{ staggerChildren:0.1, delayChildren:0.05 } }
  },
  staggerFast: {
    hidden: {},
    show:   { transition:{ staggerChildren:0.07 } }
  }
};
const VP = { once:true, margin:"-80px" };

// --- Sub-Components ---

function AnnounceBar() {
  const [on, setOn] = useState(true);
  return (
    <AnimatePresence>
      {on && (
        <motion.div className="abar"
          initial={{ height:42, opacity:1 }}
          exit={{ height:0, opacity:0, transition:{ duration:0.35 } }}
        >
          <span className="abar-dot" />
          <span className="abar-txt">
            NexCode v2.0 is live — Animated Flowcharts, System Design & Multi-language explanations
          </span>
          <a href="#features" className="abar-link">Explore features →</a>
          <button className="abar-x" onClick={() => setOn(false)}>✕</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', fn, { passive:true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.header className={`nb ${scrolled ? 'nb-s' : ''}`}
      initial={{ y:-72, opacity:0 }}
      animate={{ y:0, opacity:1 }}
      transition={{ duration:0.8, ease:[0.16,1,0.3,1] }}
    >
      <div className="container nb-in">
        <motion.div className="nb-logo" onClick={() => navigate('/')}
          whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
        >
          <div className="nb-ico">&lt;/&gt;</div>
          <span className="nb-name">NexCode</span>
          <span className="nb-ver">v2.0</span>
        </motion.div>

        <nav className="nb-nav">
          {[['Features','#features'],['How it Works','#how'],['Languages','#langs']].map(([l,h]) => (
            <a key={l} href={h} className="nb-a">{l}</a>
          ))}
        </nav>

        <div className="nb-act">
          <motion.button className="nb-viz" onClick={() => window.location.href = '/expert.html'}
            whileHover={{ scale:1.04, boxShadow:'0 0 24px rgba(124,58,237,0.45)' }}
            whileTap={{ scale:0.96 }}
          >
            ⚡ Launch Visualizer
          </motion.button>
          <motion.button className="nb-app" onClick={() => navigate('/app')}
            whileHover={{ scale:1.04, y:-1, filter:'brightness(1.12)' }}
            whileTap={{ scale:0.96 }}
          >
            Open App →
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}

function LiveFlowchartCard() {
  const [step, setStep] = useState(-1);
  const N = 7; // nodes
  const A = 7; // arrows

  useEffect(() => {
    let tid;
    const tick = s => {
      setStep(s);
      if (s < N + A - 1) {
        tid = setTimeout(() => tick(s+1), s < N ? 400 : 280);
      } else {
        tid = setTimeout(() => tick(-1), 3000);
      }
    };
    tid = setTimeout(() => tick(0), 600);
    return () => clearTimeout(tid);
  }, []);

  const nodes = [
    { x:120, y:16,  w:160, h:34, rx:17, bg:'rgba(34,197,94,0.1)',   br:'#22c55e', label:'Start',                 tc:'#4ade80' },
    { x:80,  y:74,  w:240, h:34, rx:8,  bg:'rgba(124,58,237,0.1)',  br:'#7c3aed', label:'n = len(arr)',           tc:'#a78bfa' },
    { x:80,  y:132, w:240, h:34, rx:8,  bg:'rgba(124,58,237,0.1)',  br:'#7c3aed', label:'i = 0',                  tc:'#a78bfa' },
    { x:88,  y:190, w:224, h:36, rx:18, bg:'rgba(234,179,8,0.1)',   br:'#eab308', label:'i < n - 1 ?',            tc:'#fbbf24' },
    { x:88,  y:254, w:224, h:36, rx:18, bg:'rgba(234,179,8,0.1)',   br:'#eab308', label:'arr[j] > arr[j+1] ?',    tc:'#fbbf24' },
    { x:80,  y:318, w:240, h:34, rx:8,  bg:'rgba(59,130,246,0.1)',  br:'#3b82f6', label:'Swap elements',          tc:'#60a5fa' },
    { x:120, y:378, w:160, h:34, rx:17, bg:'rgba(34,197,94,0.1)',   br:'#22c55e', label:'Return sorted array',    tc:'#4ade80' },
  ];

  const arrows = [
    { x1:200, y1:50,  x2:200, y2:74  },
    { x1:200, y1:108, x2:200, y2:132 },
    { x1:200, y1:166, x2:200, y2:190 },
    { x1:200, y1:226, x2:200, y2:254 },
    { x1:200, y1:290, x2:200, y2:318 },
    { x1:200, y1:352, x2:200, y2:378 },
    { x1:312, y1:207, x2:348, y2:207, x3:348, y3:149, x4:320, y4:149, curved:true },
  ];

  return (
    <>
      <div className="chrome">
        <span className="cd" style={{background:'#ef4444'}} />
        <span className="cd" style={{background:'#eab308'}} />
        <span className="cd" style={{background:'#22c55e'}} />
        <span className="ct">bubble_sort.py — NexCode Visualizer</span>
        <span className="cb-tag">Python</span>
      </div>

      <div className="card-split">
        <div className="code-panel">
          {[
            ['kw','def '],['fn','bubble_sort'],['tx','(arr):'],
            ['cm','  # Sort array in-place'],
            ['kw','  n '],['op','= '],['fn','len'],['tx','(arr)'],
            ['kw','  for '],['tx','i '],['kw','in '],['fn','range'],['tx','(n):'],
            ['kw','    for '],['tx','j '],['kw','in '],['fn','range'],['tx','(n'],['op','-'],['tx','i'],['op','-'],['nm','1'],['tx','):'],
            ['kw','      if '],['tx','arr[j] '],['op','> '],['tx','arr[j+'],['nm','1'],['tx',']:'],
            ['tx','        arr[j], arr[j+'],['nm','1'],['tx',']'],
            ['op','        = '],['tx','arr[j+'],['nm','1'],['tx','], arr[j]'],
            ['kw','  return '],['tx','arr'],
          ].reduce((acc, [cls, txt], i, arr) => {
            if (i === 0) acc.push([]);
            if (txt.startsWith('\n') || [3,5,8,13,18,21,24].includes(i)) acc.push([]);
            acc[acc.length-1].push(<span key={i} className={`c-${cls}`}>{txt}</span>);
            return acc;
          }, []).map((line, i) => (
            <div key={i} className="code-ln">
              <span className="ln-num">{i+1}</span>
              <span className="ln-code">{line}</span>
            </div>
          ))}
          <div className="cp-bar">
            <motion.div className="cp-fill"
              animate={{ width:`${Math.max(0,(step/(N+A))*100)}%` }}
              transition={{ duration:0.3 }}
            />
          </div>
        </div>

        <div className="flow-panel">
          <div className="fp-label">Live Flowchart</div>
          <svg viewBox="0 0 400 424" style={{width:'100%',height:'100%',minHeight:300}}>
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#7c3aed" opacity="0.8" />
              </marker>
              <marker id="arrowhead-loop" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#eab308" opacity="0.8" />
              </marker>
            </defs>

            {arrows.slice(0,6).map((a,i) => (
              step >= N + i && (
                <motion.line key={i}
                  x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                  stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.7"
                  markerEnd="url(#arrowhead)"
                  initial={{ pathLength:0, opacity:0 }}
                  animate={{ pathLength:1, opacity:1 }}
                  transition={{ duration:0.35, ease:"easeOut" }}
                />
              )
            ))}

            {step >= N + 6 && (
              <motion.path
                d="M 312 207 Q 355 207 355 149 Q 355 91 320 91"
                stroke="#eab308" strokeWidth="1.5" fill="none" strokeOpacity="0.7"
                markerEnd="url(#arrowhead-loop)"
                initial={{ pathLength:0, opacity:0 }}
                animate={{ pathLength:1, opacity:1 }}
                transition={{ duration:0.5 }}
              />
            )}

            {nodes.map((n,i) => (
              step >= i && (
                <motion.g key={i}
                  initial={{ opacity:0, scale:0.2 }}
                  animate={{ opacity:1, scale:1 }}
                  transition={{ duration:0.4, ease:[0.34,1.56,0.64,1] }}
                  style={{
                    transformBox:'fill-box',
                    transformOrigin:`${n.x+n.w/2}px ${n.y+n.h/2}px`
                  }}
                >
                  <rect
                    x={n.x} y={n.y} width={n.w} height={n.h} rx={n.rx}
                    fill={n.bg} stroke={n.br} strokeWidth="1.5"
                  />
                  <text
                    x={n.x+n.w/2} y={n.y+n.h/2+0.5}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={n.tc} fontSize="11.5"
                    fontFamily="Inter" fontWeight="500"
                  >
                    {n.label}
                  </text>
                </motion.g>
              )
            ))}
            {step >= N+3 && <text x="210" y="247" fontSize="10" fill="#fbbf24" fontFamily="Inter">Yes</text>}
            {step >= N+6 && <text x="320" y="170" fontSize="10" fill="#eab308" fontFamily="Inter">No</text>}
          </svg>
        </div>
      </div>
    </>
  );
}

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero" id="home">
      <div className="hero-bg-grid" />
      <div className="hero-bg-ring" />
      <div className="hero-orb o1" />
      <div className="hero-orb o2" />
      <div className="hero-orb o3" />

      <motion.div className="hero-copy"
        variants={V.stagger} initial="hidden" animate="show"
      >
        <motion.div className="hero-badge" variants={V.up}>
          <span className="hb-dot" />
          Free forever · No signup · Works in your browser
        </motion.div>

        <motion.h1 className="hero-h1" variants={V.up}>
          Understand any code<br />
          <span className="gt">in seconds.</span>
        </motion.h1>

        <motion.p className="hero-p" variants={V.up}>
          Paste any code — get an animated flowchart, full documentation,
          tech stack analysis, system design breakdown, and complexity report.
          One click. Zero setup.
        </motion.p>

        <motion.div className="hero-btns" variants={V.up}>
          <motion.button className="hb-primary"
            onClick={() => window.location.href = '/expert.html'}
            whileHover={{ scale:1.04, y:-3 }}
            whileTap={{ scale:0.96 }}
          >
            <span className="hbp-shine" />
            <span>📊</span>
            <span>Launch Visualizer</span>
            <motion.span
              animate={{ x:[0,5,0] }}
              transition={{ repeat:Infinity, duration:1.6, ease:"easeInOut" }}
            >→</motion.span>
          </motion.button>

          <motion.button className="hb-secondary"
            onClick={() => navigate('/app')}
            whileHover={{ scale:1.03, y:-2 }}
            whileTap={{ scale:0.97 }}
          >
            <span>💻</span>
            <span>Open Main App</span>
          </motion.button>
        </motion.div>

        <motion.div className="hero-trust" variants={V.up}>
          {[
            { dot:'var(--green)', text:'Free Gemini API' },
            { dot:'var(--pl)',    text:'No login needed' },
            { dot:'var(--blue)', text:'All languages' },
            { dot:'var(--cyan)', text:'PDF export' },
          ].map((t,i) => (
            <span key={i} className="ht-item">
              <span className="ht-dot" style={{background:t.dot}} />
              {t.text}
              {i < 3 && <span className="ht-sep" />}
            </span>
          ))}
        </motion.div>
      </motion.div>

      <motion.div className="hero-visual"
        initial={{ opacity:0, y:90, scale:0.94 }}
        animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:1.1, delay:0.5, ease:[0.16,1,0.3,1] }}
      >
        <LiveFlowchartCard />
      </motion.div>
    </section>
  );
}

function SocialProof() {
  const colleges = ['IIT Delhi','BITS Pilani','NIT Trichy','VIT Vellore','Amity','DTU','SRM Chennai','Manipal','IIIT Hyderabad','IIT Bombay','Thapar','NSIT','LPU','Pune University','IIIT Bangalore'];
  const d = [...colleges,...colleges];
  return (
    <section className="social">
      <p className="social-lbl">USED BY DEVELOPERS AT</p>
      <div className="mq-wrap">
        <div className="mq-track mq-fwd" style={{animationDuration:'32s'}}>
          {d.map((c,i) => <span key={i} className="mq-pill">{c}</span>)}
        </div>
      </div>
    </section>
  );
}

function WhatYouGet() {
  const outputs = [
    { icon:'📊', label:'Flowchart',     color:'var(--pl)',     border:'rgba(124,58,237,0.3)', desc:'Animated, color-coded node diagrams of your code logic' },
    { icon:'📚', label:'Documentation', color:'var(--blue)',   border:'rgba(59,130,246,0.3)', desc:'Auto-generated docs for every function, class, and variable' },
    { icon:'🔧', label:'Tech Stack',    color:'var(--cyan)',   border:'rgba(6,182,212,0.3)',  desc:'Detected languages, concepts, patterns, and browser support' },
    { icon:'🏗️', label:'System Design', color:'var(--yellow)', border:'rgba(234,179,8,0.3)',  desc:'Architecture, components, data flow, and bottleneck analysis' },
    { icon:'📈', label:'Complexity',    color:'var(--green)',  border:'rgba(34,197,94,0.3)',  desc:'Time & space complexity, cyclomatic score, and optimization tips' },
  ];
  return (
    <section className="wyg section-pad" id="features">
      <div className="container">
        <motion.div className="s-header center"
          variants={V.stagger} initial="hidden" whileInView="show" viewport={VP}
        >
          <motion.span className="s-tag" variants={V.up}>5 INSTANT OUTPUTS</motion.span>
          <motion.h2 className="s-title" variants={V.up}>One paste.<br/>Five insights.</motion.h2>
          <motion.p className="s-sub" variants={V.up}>
            Paste any code and NexCode generates all five simultaneously using Gemini AI.
          </motion.p>
        </motion.div>

        <motion.div className="wyg-grid"
          variants={V.stagger} initial="hidden" whileInView="show" viewport={VP}
        >
          {outputs.map((o,i) => (
            <motion.div key={i} className="wyg-card" variants={V.pop}
              style={{'--card-border': o.border, '--card-color': o.color}}
              whileHover={{ y:-8, scale:1.02, borderColor:o.border }}
            >
              <span className="wyg-icon">{o.icon}</span>
              <h4 className="wyg-label" style={{color:o.color}}>{o.label}</h4>
              <p className="wyg-desc">{o.desc}</p>
              <div className="wyg-bar" style={{background:o.border}} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function VisualizerMini() {
  return (
    <div className="mini-visual">
      <div className="mv-pro-card">
        <div className="mv-scanner-wrap">
          <div className="mv-grid-bg" />
          <svg viewBox="0 0 300 240" className="mv-neural-svg">
            {/* Neural Connections */}
            <g opacity="0.1">
              <path d="M 50 120 L 120 60 L 200 60 L 250 120 L 200 180 L 120 180 Z" fill="none" stroke="var(--pl)" strokeWidth="1" />
              <path d="M 120 60 L 120 180 M 200 60 L 200 180 M 50 120 L 250 120" stroke="var(--pl)" strokeWidth="0.5" />
            </g>

            {/* Active Data Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.circle key={i} r="1.5" fill="var(--blue)"
                animate={{ cx: [50, 120, 200, 250], cy: [120, 60, 180, 120], opacity: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "linear" }}
              />
            ))}

            {/* Nodes - Optimized for Performance */}
            {[
              { x:50, y:120, c:'var(--pl)' }, { x:120, y:60, c:'var(--blue)' },
              { x:120, y:180, c:'var(--cyan)' }, { x:200, y:60, c:'var(--blue)' },
              { x:200, y:180, c:'var(--cyan)' }, { x:250, y:120, c:'var(--green)' }
            ].map((n, i) => (
              <g key={i}>
                <motion.circle cx={n.x} cy={n.y} r="12" fill={n.c} opacity="0.1"
                  animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
                <circle cx={n.x} cy={n.y} r="4" fill={n.c} />
              </g>
            ))}
          </svg>
        </div>
        <div className="mv-overlay-text">
          <div className="mv-tag">TRACE_MODE: READY</div>
          <div className="mv-filename">logic_graph_v4.diag</div>
        </div>
      </div>
    </div>
  );
}

function Typewriter({ text, color }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let current = "";
    let i = 0;
    setDisplayed("");
    
    const interval = setInterval(() => {
      if (i < text.length) {
        current += text[i];
        setDisplayed(current);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="ls-code-line">
      <span style={{ color, textShadow: `0 0 15px ${color}66` }}>{displayed}</span>
      <motion.span className="ls-cursor-pro" 
        animate={{ opacity: [1, 0] }} 
        transition={{ duration: 0.5, repeat: Infinity }}
        style={{ background: color, boxShadow: `0 0 10px ${color}` }}
      />
    </div>
  );
}

function LanguageSwitcherMini() {
  const [langIdx, setLangIdx] = useState(0);
  
  const langs = [
    { name: 'English',  code: 'main.js', color: '#60a5fa', text: 'const data = await fetch(url);' },
    { name: 'Hindi',    code: 'main.js', color: '#f472b6', text: 'const data = mangao(url);' },
    { name: 'Japanese', code: 'main.js', color: '#4ade80', text: 'const data = url.toru();' },
    { name: 'Spanish',  code: 'main.js', color: '#fbbf24', text: 'traer_datos(url);' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLangIdx(prev => (prev + 1) % langs.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ls-obsidian-ide">
      {/* Sidebar */}
      <div className="ls-side-obs">
        <div className="ls-win-controls">
          <span className="ls-dot red" />
          <span className="ls-dot yellow" />
          <span className="ls-dot green" />
        </div>
        <div className="ls-side-label">EXPLORER</div>
        {['EN', 'HI', 'JP', 'ES'].map((code, i) => (
          <div key={i} className={`ls-side-row ${langIdx === i ? 'active' : ''}`}
            style={{ '--active-c': langs[i].color }}
          >
            <div className="ls-row-inner">
              <span className="ls-file-ico">JS</span>
              {code}
            </div>
            {langIdx === i && <motion.div layoutId="ls-active-pill" className="ls-active-pill" style={{ background: langs[i].color }} />}
          </div>
        ))}
      </div>

      {/* Main Body */}
      <div className="ls-body-obs">
        <div className="ls-header-obs">
          <div className="ls-tab active">
            <span className="ls-tab-ico">⚡</span>
            index.js
          </div>
          <div className="ls-tab">package.json</div>
          <div className="ls-header-empty" />
        </div>
        
        <div className="ls-editor-obs">
          {/* Subtle Radar Sweep */}
          <div className="ls-radar-sweep" />
          
          <div className="ls-gutter-obs">
            {[1, 2, 3, 4, 5].map(n => <div key={n} className="ls-line-n">{n}</div>)}
          </div>
          
          <div className="ls-main-code">
            <div className="ls-comment-obs">// AI_POLYGLOT_TRANSFORMATION_ACTIVE</div>
            <AnimatePresence mode="wait">
              <motion.div key={langIdx}
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
                transition={{ duration: 0.4 }}
              >
                <Typewriter text={langs[langIdx].text} color={langs[langIdx].color} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="ls-footer-obs">
          <div className="ls-foot-left">
            <span className="ls-f-item"> main</span>
            <span className="ls-f-item"> synced</span>
          </div>
          <div className="ls-foot-right">
            <span className="ls-f-item" style={{ color: langs[langIdx].color }}>
              {langs[langIdx].name.toUpperCase()}
            </span>
            <span className="ls-f-item">UTF-8</span>
            <span className="ls-f-badge">v2.4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemDesignMini() {
  const [visible, setVisible] = useState(0);
  const [arrowVisible, setArrowVisible] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    const timers = [];
    timers.push(setTimeout(() => setVisible(1), 400));
    timers.push(setTimeout(() => setVisible(2), 900));
    timers.push(setTimeout(() => setVisible(3), 1400));
    timers.push(setTimeout(() => setArrowVisible(true), 1800));
    timers.push(setTimeout(() => setPulseActive(true), 2200));
    return () => timers.forEach(clearTimeout);
  }, []);

  const components = [
    {
      icon:'🖥️', label:'Frontend',
      sublabel:'React + Vite',
      bg:'rgba(59,130,246,0.06)',
      border:'rgba(59,130,246,0.2)',
      tc:'#60a5fa',
      badge:'PORT 3000',
      badgeColor:'rgba(59,130,246,0.15)',
    },
    {
      icon:'⚙️', label:'Backend API',
      sublabel:'Node.js + Express',
      bg:'rgba(124,58,237,0.06)',
      border:'rgba(124,58,237,0.2)',
      tc:'#a78bfa',
      badge:'PORT 8080',
      badgeColor:'rgba(124,58,237,0.15)',
    },
    {
      icon:'🗄️', label:'Database',
      sublabel:'PostgreSQL',
      bg:'rgba(234,179,8,0.06)',
      border:'rgba(234,179,8,0.2)',
      tc:'#fbbf24',
      badge:'PORT 5432',
      badgeColor:'rgba(234,179,8,0.15)',
    },
  ];

  return (
    <div style={{
      background:'rgba(5,5,10,0.4)', border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:24, padding:24, width:'100%', minHeight:340,
      backdropFilter:'blur(12px)', position:'relative', overflow:'hidden'
    }}>
      {/* Scanner Effect */}
      <motion.div 
        style={{
          position:'absolute', top:0, left:0, right:0, height:'2px',
          background:'linear-gradient(90deg, transparent, var(--pl), transparent)',
          zIndex:10, pointerEvents:'none'
        }}
        animate={{ top: ['-5%', '105%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />

      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom:20, paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.05)'
      }}>
        <span style={{fontFamily:'var(--f-mono)', fontSize:11, color:'var(--t3)', letterSpacing:'0.1em'}}>
          ARCHITECTURE_ENGINE_v4
        </span>
        <span style={{
          fontSize:10, background:'rgba(34,197,94,0.1)',
          border:'1px solid rgba(34,197,94,0.25)',
          color:'#4ade80', padding:'2px 8px', borderRadius:4,
          fontFamily:'var(--f-mono)', display:'flex', alignItems:'center', gap:5
        }}>
          <span style={{
            width:5, height:5, borderRadius:'50%',
            background:'#22c55e', display:'inline-block',
            boxShadow: '0 0 8px #22c55e'
          }}/>
          ONLINE
        </span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {components.map((c, i) => (
          <div key={i}>
            <motion.div
              initial={{ opacity:0, x:-20 }}
              animate={visible > i ? { opacity:1, x:0 } : { opacity:0, x:-20 }}
              transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
              whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.02)' }}
              style={{
                background:c.bg, border:`1px solid ${c.border}`,
                borderRadius:12, padding:'12px 16px',
                display:'flex', alignItems:'center', gap:12,
                cursor: 'default'
              }}
            >
              <div style={{
                fontSize:20, width:36, height:36, background:'rgba(255,255,255,0.03)',
                borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>{c.icon}</div>
              <div style={{flex:1}}>
                <div style={{
                  fontSize:13, fontWeight:700,
                  color:c.tc, marginBottom:2, letterSpacing:'-0.01em'
                }}>{c.label}</div>
                <div style={{
                  fontSize:11, color:'var(--t3)',
                  fontFamily:'var(--f-mono)'
                }}>{c.sublabel}</div>
              </div>
              <span style={{
                fontSize:9, fontWeight:800, letterSpacing:'0.05em',
                background:c.badgeColor, color:c.tc,
                padding:'3px 8px', borderRadius:5,
                fontFamily:'var(--f-mono)', border: `1px solid ${c.border}`
              }}>{c.badge}</span>
            </motion.div>

            {i < components.length - 1 && (
              <div style={{
                display:'flex', flexDirection:'column',
                alignItems:'flex-start', gap:2,
                margin:'4px 0 4px 34px',
                position: 'relative'
              }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={arrowVisible ? { height: 20 } : { height: 0 }}
                  style={{
                    width:1.5,
                    background:`linear-gradient(to bottom, ${components[i].tc}, ${components[i+1].tc})`,
                    opacity: 0.3
                  }}
                />
                {pulseActive && (
                  <motion.div
                    style={{
                      position: 'absolute', left: -2, top: 0,
                      width: 5, height: 5, borderRadius: '50%',
                      background: components[i].tc, boxShadow: `0 0 10px ${components[i].tc}`
                    }}
                    animate={{ top: [0, 20], opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity:0, y:10 }}
        animate={pulseActive ? { opacity:1, y:0 } : {}}
        transition={{ duration:0.4 }}
        style={{
          display:'flex', gap:8, marginTop:16,
          paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.05)'
        }}
      >
        {[
          { label:'Bottlenecks', val:'1 detected', color:'#f87171' },
          { label:'Data flows',  val:'2 active', color:'#a78bfa' },
          { label:'Health',      val:'98.2%',    color:'#4ade80' },
        ].map((s,i) => (
          <div key={i} style={{
            flex:1, textAlign:'center',
            background:'rgba(255,255,255,0.02)', borderRadius:10, padding:'10px 6px',
            border: '1px solid rgba(255,255,255,0.03)'
          }}>
            <div style={{fontSize:12, fontWeight:800, color:s.color}}>{s.val}</div>
            <div style={{fontSize:9, color:'var(--t3)', marginTop:4, fontFamily:'var(--f-mono)', textTransform:'uppercase', letterSpacing:'0.05em'}}>{s.label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function FeatureRows() {
  return (
    <section className="feat-rows section-pad" id="how">
      <div className="container">
        <div className="fr">
          <motion.div className="fr-text" variants={V.left} initial="hidden" whileInView="show" viewport={VP}>
            <span className="s-tag">VISUALIZE</span>
            <h2 className="fr-h2">Code becomes<br/>a living diagram</h2>
            <p className="fr-p">Every function call, every loop, every branch — mapped into a beautiful animated flowchart. Color-coded nodes so you instantly know what's a process, a decision, or an endpoint.</p>
            <ul className="fr-list">
              {['Green nodes = start & end points','Purple nodes = process steps','Yellow nodes = decisions & conditions','Blue nodes = sub-processes','Auto-replay animation — always running'].map((pt,i) => (
                <li key={i}><span className="fr-dot" style={{background:'var(--pl)'}} />{pt}</li>
              ))}
            </ul>
          </motion.div>
          <motion.div className="fr-visual" variants={V.right} initial="hidden" whileInView="show" viewport={VP}>
            <VisualizerMini />
          </motion.div>
        </div>

        <div className="fr fr-rev">
          <motion.div className="fr-text" variants={V.right} initial="hidden" whileInView="show" viewport={VP}>
            <span className="s-tag">LANGUAGE MODE</span>
            <h2 className="fr-h2">Multi-language.<br/>Global clarity.</h2>
            <p className="fr-p">Switch between 5+ languages with one click. Every explanation, every documentation comment — re-generated instantly in your chosen language.</p>
            <ul className="fr-list">
              {['English — precise, technical','Hindi — Devanagari script, clear','Hinglish — casual, easy to read','Spanish & Japanese — global reach','One-click language switch'].map((pt,i) => (
                <li key={i}><span className="fr-dot" style={{background:'var(--orange)'}} />{pt}</li>
              ))}
            </ul>
          </motion.div>
          <motion.div className="fr-visual" variants={V.left} initial="hidden" whileInView="show" viewport={VP}>
            <LanguageSwitcherMini />
          </motion.div>
        </div>

        <div className="fr">
          <motion.div className="fr-text" variants={V.left} initial="hidden" whileInView="show" viewport={VP}>
            <span className="s-tag">SYSTEM DESIGN</span>
            <h2 className="fr-h2">Architecture<br/>at a glance.</h2>
            <p className="fr-p">NexCode reads your code and maps out the full system — every component, every data flow, every potential bottleneck — with ranked improvement suggestions.</p>
            <ul className="fr-list">
              {['Auto-detect Frontend/Backend/DB','Data flow arrows between components','Scalability notes','Bottleneck warnings','Priority-ranked improvements'].map((pt,i) => (
                <li key={i}><span className="fr-dot" style={{background:'var(--blue)'}} />{pt}</li>
              ))}
            </ul>
          </motion.div>
          <motion.div className="fr-visual" variants={V.right} initial="hidden" whileInView="show" viewport={VP}>
            <SystemDesignMini />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n:'01', icon:'📁', title:'Paste or Upload', desc:'Drop any code file or paste directly. Supports JS, Python, Java, C++, TypeScript, Go, Rust, PHP and more — any language Gemini understands.' },
    { n:'02', icon:'⚡', title:'AI Analyzes',    desc:'Gemini 1.5 Flash reads every line in parallel and generates all five outputs simultaneously. Usually done in under 10 seconds.' },
    { n:'03', icon:'📊', title:'Understand & Export', desc:'Read in English, Hindi, or Hinglish. Switch languages instantly. Download your full analysis as a formatted PDF.' },
  ];
  return (
    <section className="how section-pad" id="how">
      <div className="container">
        <motion.div className="s-header center" variants={V.stagger} initial="hidden" whileInView="show" viewport={VP}>
          <motion.span className="s-tag" variants={V.up}>HOW IT WORKS</motion.span>
          <motion.h2 className="s-title" variants={V.up}>From code to clarity<br/>in three steps.</motion.h2>
        </motion.div>
        <motion.div className="how-grid" variants={V.stagger} initial="hidden" whileInView="show" viewport={VP}>
          {steps.map((s,i) => (
            <motion.div key={i} className="how-card" variants={V.up}
              whileHover={{ y:-10, boxShadow:'0 28px 64px rgba(0,0,0,0.5)', borderColor:'rgba(124,58,237,0.35)' }}
            >
              <div className="how-top">
                <span className="how-num">{s.n}</span>
                <div className="how-ico">{s.icon}</div>
              </div>
              <h4 className="how-title">{s.title}</h4>
              <p className="how-desc">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ToolsMarquee() {
  const R1 = ['JavaScript','TypeScript','Python','Java','C++','Go','Rust','PHP','Ruby','Swift','Kotlin','SQL','Dart','Scala'];
  const R2 = ['Flowchart','Documentation','Tech Stack','System Design','Complexity Analysis','PDF Export','File Upload','Hindi Mode','Hinglish Mode'];
  const R3 = ['Gemini 1.5 Flash','Free API','Zero Setup','Dark Theme','Mobile Ready','Any Framework','Open Source'];
  return (
    <section className="tools section-pad" id="langs">
      <div className="container">
        <motion.div className="s-header center" variants={V.stagger} initial="hidden" whileInView="show" viewport={VP}>
          <motion.span className="s-tag" variants={V.up}>WORKS WITH</motion.span>
          <motion.h2 className="s-title" variants={V.up}>Supports every language<br/>you already write.</motion.h2>
        </motion.div>
      </div>
      {[
        { row:R1, dir:'fwd', speed:30 },
        { row:R2, dir:'rev', speed:25 },
        { row:R3, dir:'fwd', speed:36 },
      ].map(({row,dir,speed},i) => (
        <div key={i} className="mq-wrap" style={{margin:'10px 0'}}>
          <div className={`mq-track mq-${dir}`} style={{animationDuration:`${speed}s`}}>
            {[...row,...row].map((item,j) => (
              <span key={j} className="mq-pill">{item}</span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function Testimonials() {
  const testi = [
    { init:'AS', name:'Arjun Sharma',   role:'Final Year CSE, IIT Delhi',   q:'NexCode explained my DSA assignments better than my professor ever did. The animated flowcharts for recursion are genuinely mind-opening.' },
    { init:'PN', name:'Priya Nair',     role:'Backend Developer, Bangalore', q:'I paste any unfamiliar codebase into NexCode and get a full system design in seconds. What used to take an hour now takes ten seconds.' },
    { init:'RG', name:'Rahul Gupta',    role:'CS Student, BITS Pilani',     q:'The fact that it is completely free and needs no account is insane. I use it every single day for understanding open-source code.' },
  ];
  return (
    <section className="testi testi-pad section-pad">
      <div className="container">
        <motion.div className="s-header center" variants={V.stagger} initial="hidden" whileInView="show" viewport={VP}>
          <motion.span className="s-tag" variants={V.up}>TESTIMONIALS</motion.span>
          <motion.h2 className="s-title" variants={V.up}>Developers trust NexCode.</motion.h2>
        </motion.div>
        <motion.div className="testi-grid" variants={V.stagger} initial="hidden" whileInView="show" viewport={VP}>
          {testi.map((t,i) => (
            <motion.div key={i} className="testi-card" variants={V.up}
              whileHover={{ y:-7, borderColor:'rgba(124,58,237,0.3)' }}
            >
              <div className="testi-stars">{'★'.repeat(5)}</div>
              <p className="testi-q">"{t.q}"</p>
              <div className="testi-author">
                <div className="testi-av">{t.init}</div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-role">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function BottomCTA() {
  const navigate = useNavigate();
  return (
    <section className="bcta section-pad">
      <div className="bcta-bg" />
      <div className="bcta-grid" />
      <motion.div className="bcta-inner"
        variants={V.stagger} initial="hidden" whileInView="show" viewport={VP}
      >
        <motion.h2 className="bcta-h2" variants={V.up}>
          Visualize your first code<br/>
          <span className="gt">today — it's free.</span>
        </motion.h2>
        <motion.p className="bcta-sub" variants={V.up}>
          No account. No credit card. Paste your code and get an animated flowchart in 10 seconds.
        </motion.p>
        <div className="hero-btns">
          <motion.button className="hb-primary" onClick={() => window.location.href = 'expert.html'}
            variants={V.up} whileHover={{ scale:1.04, y:-3 }} whileTap={{ scale:0.96 }}>
            <span className="hbp-shine" />
            <span>📊</span><span>Launch Visualizer</span>
            <motion.span animate={{x:[0,5,0]}} transition={{repeat:Infinity,duration:1.6,ease:"easeInOut"}}>→</motion.span>
          </motion.button>
          <motion.button className="hb-secondary" onClick={() => navigate('/app')}
            variants={V.up} whileHover={{ scale:1.03, y:-2 }} whileTap={{ scale:0.97 }}>
            <span>💻</span><span>Open Main App</span>
          </motion.button>
        </div>
        <motion.p className="bcta-note" variants={V.up}>
          Powered by Gemini 1.5 Flash · Works on all browsers · Open Source · MIT License
        </motion.p>
      </motion.div>
    </section>
  );
}

function Footer() {
  const navigate = useNavigate();
  const cols = {
    Product:   ['Main App','Code Visualizer','Features','Changelog'],
    Resources: ['Documentation','GitHub','Report a Bug','Roadmap'],
    Community: ['Discord','Twitter / X','YouTube','Newsletter'],
  };
  return (
    <footer className="footer">
      <div className="container">
        <div className="ft-top">
          <div className="ft-brand">
            <div className="ft-logo" onClick={() => navigate('/')}>
              <div className="nb-ico">&lt;/&gt;</div>
              <span className="nb-name">NexCode</span>
            </div>
            <p className="ft-desc">AI Code Assistant built for developers who want to understand code, not just run it.</p>
            <div className="ft-socials">
              {['GitHub','Twitter','Discord'].map(s => (
                <a key={s} href="#" className="ft-social">{s}</a>
              ))}
            </div>
          </div>
          {Object.entries(cols).map(([col,links]) => (
            <div key={col}>
              <p className="ft-col-title">{col}</p>
              {links.map(l => <a key={l} href="#" className="ft-link">{l}</a>)}
            </div>
          ))}
        </div>
        <div className="ft-bottom">
          <span>© 2025 NexCode. Built with ❤️ for developers.</span>
          <span>Made in India 🇮🇳</span>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page">
      <AnnounceBar />
      <Navbar />
      <Hero />
      <SocialProof />
      <WhatYouGet />
      <FeatureRows />
      <HowItWorks />
      <ToolsMarquee />
      <Testimonials />
      <BottomCTA />
      <Footer />
    </div>
  );
}
