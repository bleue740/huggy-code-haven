import React, { useState, useEffect } from 'react';

interface GeneratingOverlayProps {
  isVisible: boolean;
  statusText?: string;
}

const CODE_SNIPPETS = [
  `function App() {\n  const [count, setCount] = useState(0);\n  return <div>{count}</div>;\n}`,
  `<div className="grid grid-cols-3 gap-4">\n  {items.map(item => (\n    <Card key={item.id} {...item} />\n  ))}\n</div>`,
  `const fetchData = async () => {\n  const res = await fetch('/api/data');\n  const json = await res.json();\n  setData(json);\n};`,
  `<nav className="flex items-center">\n  <Logo />\n  <ul className="flex gap-6">\n    {links.map(l => <NavLink />)}\n  </ul>\n</nav>`,
  `const theme = {\n  primary: '#2563eb',\n  background: '#050505',\n  card: '#111111',\n  border: '#1a1a1a'\n};`,
  `<motion.div\n  initial={{ opacity: 0, y: 20 }}\n  animate={{ opacity: 1, y: 0 }}\n  className="hero-section"\n/>`,
];

const PHASES = [
  { text: 'Analyse de la demande…', icon: '🔍', duration: 2000 },
  { text: 'Génération du code…', icon: '⚡', duration: 0 },
  { text: 'Optimisation…', icon: '✨', duration: 3000 },
  { text: 'Finalisation…', icon: '🚀', duration: 2000 },
];

const CodeCard: React.FC<{ code: string; index: number }> = ({ code, index }) => {
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    setVisibleChars(0);
    const interval = setInterval(() => {
      setVisibleChars((prev) => {
        if (prev >= code.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.floor(Math.random() * 3) + 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [code]);

  return (
    <div
      className="absolute bg-[#0a0a0a]/80 border border-[#1a1a1a] rounded-xl p-4 backdrop-blur-sm shadow-2xl"
      style={{
        top: `${15 + (index % 3) * 30}%`,
        left: `${5 + (index % 2) * 50}%`,
        maxWidth: '320px',
        animation: `float-card ${4 + index}s ease-in-out infinite`,
        animationDelay: `${index * 0.8}s`,
        opacity: 0.6,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">
          generating
        </span>
      </div>
      <pre className="text-[10px] text-neutral-500 font-mono leading-relaxed whitespace-pre-wrap overflow-hidden">
        <span className="text-emerald-400/70">{code.slice(0, visibleChars)}</span>
        <span className="text-neutral-700">{code.slice(visibleChars)}</span>
        {visibleChars < code.length && (
          <span className="inline-block w-[6px] h-[13px] bg-blue-500 animate-pulse ml-[1px] align-middle" />
        )}
      </pre>
    </div>
  );
};

export const GeneratingOverlay: React.FC<GeneratingOverlayProps> = ({
  isVisible,
  statusText,
}) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [snippetIndices, setSnippetIndices] = useState<number[]>([0, 2, 4]);

  useEffect(() => {
    if (!isVisible) {
      setPhaseIndex(0);
      return;
    }
    // Auto-advance phases
    const timer = setInterval(() => {
      setPhaseIndex((prev) => Math.min(prev + 1, PHASES.length - 1));
    }, 3000);
    return () => clearInterval(timer);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      setSnippetIndices((prev) =>
        prev.map(() => Math.floor(Math.random() * CODE_SNIPPETS.length))
      );
    }, 6000);
    return () => clearInterval(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  const currentPhase = PHASES[phaseIndex];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#050505]/90 backdrop-blur-md" />

      {/* Floating code cards */}
      {snippetIndices.map((idx, i) => (
        <CodeCard key={`${i}-${idx}`} code={CODE_SNIPPETS[idx]} index={i} />
      ))}

      {/* Center status */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Animated orb */}
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center animate-pulse">
            <div className="w-12 h-12 rounded-full bg-blue-600/40 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-blue-600 shadow-lg shadow-blue-500/50" />
            </div>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" />
        </div>

        <span className="text-3xl mb-3">{currentPhase.icon}</span>
        <h3 className="text-white font-black text-lg tracking-tight mb-2">
          {statusText || currentPhase.text}
        </h3>

        {/* Phase dots */}
        <div className="flex items-center gap-2 mt-4">
          {PHASES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= phaseIndex
                  ? 'w-8 bg-blue-500'
                  : 'w-4 bg-neutral-700'
              }`}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float-card {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(0.5deg); }
          50% { transform: translateY(-5px) rotate(-0.5deg); }
          75% { transform: translateY(-12px) rotate(0.3deg); }
        }
      `}</style>
    </div>
  );
};
