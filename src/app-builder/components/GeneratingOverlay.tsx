import React, { useState, useEffect, useMemo } from 'react';

interface GeneratingOverlayProps {
  isVisible: boolean;
  statusText?: string;
}

const PHASES = [
  { text: 'Analyzing requirements…', icon: '🔍' },
  { text: 'Designing architecture…', icon: '🧠' },
  { text: 'Generating code…', icon: '⚡' },
  { text: 'Optimizing & validating…', icon: '✨' },
];

/* ── Code Rain Characters ── */
const CODE_CHARS = '{}[]()<>=;:./\\|+-*&!?#@$%^~01αβγδ';
const RAIN_COLUMNS = 18;

const CodeRainColumn: React.FC<{ index: number }> = ({ index }) => {
  const chars = useMemo(() => {
    const len = 8 + Math.floor(Math.random() * 12);
    return Array.from({ length: len }, () =>
      CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    ).join('\n');
  }, []);

  const left = `${(index / RAIN_COLUMNS) * 100}%`;
  const delay = `${(index * 0.3) % 4}s`;
  const duration = `${3 + Math.random() * 4}s`;
  const opacity = 0.06 + Math.random() * 0.08;

  return (
    <pre
      className="absolute top-0 text-[10px] font-mono leading-tight pointer-events-none select-none"
      style={{
        left,
        opacity,
        color: '#60a5fa',
        animation: `code-rain ${duration} linear infinite`,
        animationDelay: delay,
      }}
    >
      {chars}
    </pre>
  );
};

/* ── Progress Ring (SVG) ── */
const ProgressRing: React.FC<{ progress: number }> = ({ progress }) => {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width="72" height="72" className="absolute -inset-1">
      <circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke="hsl(220 15% 15%)"
        strokeWidth="3"
      />
      <circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke="url(#ring-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <defs>
        <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const GeneratingOverlay: React.FC<GeneratingOverlayProps> = ({
  isVisible,
  statusText,
}) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setPhaseIndex(0);
      setProgress(0);
      return;
    }
    const timer = setInterval(() => {
      setPhaseIndex(prev => Math.min(prev + 1, PHASES.length - 1));
    }, 3500);
    return () => clearInterval(timer);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 8 + 2, 95));
    }, 400);
    return () => clearInterval(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  const currentPhase = PHASES[phaseIndex];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#030308]/92 backdrop-blur-xl" />

      {/* Particle Grid */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(220 60% 50% / 0.3) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            animation: 'grid-pulse 4s ease-in-out infinite',
          }}
        />
      </div>

      {/* Code Rain */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: RAIN_COLUMNS }).map((_, i) => (
          <CodeRainColumn key={i} index={i} />
        ))}
      </div>

      {/* Radial Glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(220 80% 55% / 0.12) 0%, transparent 70%)',
          animation: 'breathe 4s ease-in-out infinite',
        }}
      />

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Morphing Orb with Progress Ring */}
        <div className="relative mb-8 w-[72px] h-[72px] flex items-center justify-center">
          <ProgressRing progress={progress} />
          <div
            className="w-12 h-12 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #3b82f6)',
              backgroundSize: '200% 200%',
              animation: 'blob 6s ease-in-out infinite, orb-gradient 3s ease infinite',
              boxShadow: '0 0 40px hsl(220 80% 55% / 0.4), 0 0 80px hsl(260 60% 55% / 0.2)',
            }}
          />
        </div>

        {/* Glassmorphic Status Card */}
        <div
          className="px-8 py-6 rounded-2xl border border-white/[0.08] max-w-xs"
          style={{
            background: 'linear-gradient(135deg, hsl(220 20% 12% / 0.6), hsl(260 20% 10% / 0.4))',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px hsl(220 50% 5% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.05)',
          }}
        >
          <span className="text-2xl mb-2 block">{currentPhase.icon}</span>
          <h3
            className="text-white/90 font-bold text-sm tracking-wide mb-1 transition-opacity duration-500"
            key={statusText || currentPhase.text}
          >
            {statusText || currentPhase.text}
          </h3>
          <p className="text-white/30 text-xs font-medium">
            {Math.round(progress)}% complete
          </p>

          {/* Phase Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {PHASES.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-500 ${
                  i <= phaseIndex
                    ? 'w-6 h-1.5 bg-blue-500'
                    : 'w-3 h-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { border-radius: 50%; transform: scale(1); }
          25% { border-radius: 42% 58% 60% 40% / 50% 45% 55% 50%; transform: scale(1.05); }
          50% { border-radius: 55% 45% 40% 60% / 45% 55% 50% 50%; transform: scale(0.97); }
          75% { border-radius: 45% 55% 55% 45% / 55% 40% 60% 45%; transform: scale(1.03); }
        }
        @keyframes orb-gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes code-rain {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(calc(100vh + 100%)); opacity: 0; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};
