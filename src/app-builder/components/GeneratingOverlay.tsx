import React, { useState, useEffect, useMemo } from 'react';

interface GeneratingOverlayProps {
  isVisible: boolean;
  statusText?: string;
  /** Real pipeline progress 0-100, driven by SSE events */
  progress?: number;
}

const PHASES = [
  { text: 'Analyzing requirements…', icon: '🔍' },
  { text: 'Designing architecture…', icon: '🧠' },
  { text: 'Generating code…', icon: '⚡' },
  { text: 'Optimizing & validating…', icon: '✨' },
];

const CODE_CHARS = '{}[]()<>=;:./\\|+-*&!?#@αβγδλ→⟨⟩∞≡∂';
const RAIN_COLUMNS = 22;

const CodeRainColumn: React.FC<{ index: number }> = ({ index }) => {
  const chars = useMemo(() => {
    const len = 6 + Math.floor(Math.random() * 16);
    return Array.from({ length: len }, () =>
      CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    ).join('\n');
  }, []);

  const left = `${(index / RAIN_COLUMNS) * 100}%`;
  const delay = `${(index * 0.4) % 6}s`;
  const duration = `${5 + Math.random() * 7}s`;
  const opacity = 0.04 + Math.random() * 0.06;

  return (
    <pre
      className="absolute top-0 text-[9px] font-mono leading-tight pointer-events-none select-none"
      style={{
        left,
        opacity,
        color: '#a78bfa',
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
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width="76" height="76" className="absolute -inset-[2px]">
      <circle cx="38" cy="38" r={r} fill="none" stroke="hsl(260 20% 12%)" strokeWidth="2.5" />
      <circle
        cx="38" cy="38" r={r}
        fill="none"
        stroke="url(#ring-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/* ── Sparkle Particle ── */
interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

const SPARKLE_COLORS = ['#a78bfa', '#c084fc', '#e879f9', '#f9a8d4', '#fbbf24', '#60a5fa', '#34d399'];

const SparkleEffect: React.FC<{ active: boolean }> = ({ active }) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    if (!active) { setSparkles([]); return; }
    const particles: Sparkle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 80,
      y: 50 + (Math.random() - 0.5) * 80,
      size: 2 + Math.random() * 5,
      delay: Math.random() * 0.6,
      duration: 0.8 + Math.random() * 1.2,
      color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
    }));
    setSparkles(particles);
    const timer = setTimeout(() => setSparkles([]), 2500);
    return () => clearTimeout(timer);
  }, [active]);

  if (sparkles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {sparkles.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            boxShadow: `0 0 ${s.size * 3}px ${s.color}`,
            animation: `sparkle-burst ${s.duration}s ease-out ${s.delay}s both`,
          }}
        />
      ))}
    </div>
  );
};

/** Map real progress to phase index */
function progressToPhaseIndex(progress: number): number {
  if (progress < 15) return 0; // Analyzing
  if (progress < 40) return 1; // Designing
  if (progress < 80) return 2; // Generating
  return 3; // Optimizing
}

export const GeneratingOverlay: React.FC<GeneratingOverlayProps> = ({
  isVisible,
  statusText,
  progress: externalProgress,
}) => {
  const [showSparkles, setShowSparkles] = useState(false);

  // Use real progress from props (0-100), default to 5 when visible but no data yet
  const progress = externalProgress ?? (isVisible ? 5 : 0);
  const phaseIndex = progressToPhaseIndex(progress);

  useEffect(() => {
    if (!isVisible) {
      setShowSparkles(false);
      return;
    }
    if (progress >= 95 && !showSparkles) {
      setShowSparkles(true);
    }
  }, [isVisible, progress, showSparkles]);

  if (!isVisible) return null;

  const currentPhase = PHASES[phaseIndex];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#020010]/93 backdrop-blur-xl" />

      {/* Particle Grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(270 60% 50% / 0.25) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            animation: 'grid-pulse 5s ease-in-out infinite',
          }}
        />
      </div>

      {/* Code Rain */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: RAIN_COLUMNS }).map((_, i) => (
          <CodeRainColumn key={i} index={i} />
        ))}
      </div>

      {/* Dual Radial Glow */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(270 70% 50% / 0.10) 0%, hsl(220 70% 50% / 0.05) 40%, transparent 70%)',
          animation: 'breathe 5s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(300 60% 55% / 0.08) 0%, transparent 60%)',
          animation: 'breathe 3.5s ease-in-out infinite reverse',
        }}
      />

      {/* Sparkle Confetti on completion */}
      <SparkleEffect active={showSparkles} />

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Morphing Orb + Progress Ring */}
        <div className="relative mb-8 w-[76px] h-[76px] flex items-center justify-center">
          <ProgressRing progress={progress} />
          <div
            className="w-12 h-12 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899, #6366f1)',
              backgroundSize: '300% 300%',
              animation: 'blob 8s ease-in-out infinite, orb-gradient 4s ease infinite',
              boxShadow: '0 0 30px hsl(270 70% 55% / 0.5), 0 0 60px hsl(300 60% 50% / 0.25), 0 0 100px hsl(270 50% 50% / 0.1)',
            }}
          />
        </div>

        {/* Glassmorphic Status Card */}
        <div
          className="px-8 py-6 rounded-2xl border border-white/[0.06] max-w-xs"
          style={{
            background: 'linear-gradient(135deg, hsl(260 25% 10% / 0.7), hsl(280 20% 8% / 0.5))',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 8px 40px hsl(270 40% 5% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.04)',
          }}
        >
          <span className="text-2xl mb-2 block">{currentPhase.icon}</span>
          <h3
            className="text-white/90 font-bold text-sm tracking-wide mb-1 transition-opacity duration-700"
            key={statusText || currentPhase.text}
          >
            {statusText || currentPhase.text}
          </h3>
          <p className="text-white/25 text-xs font-medium">
            {Math.round(progress)}%
          </p>

          {/* Phase Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {PHASES.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-700 ${
                  i <= phaseIndex
                    ? 'w-6 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500'
                    : 'w-3 h-1.5 bg-white/8'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { border-radius: 50%; transform: scale(1); }
          20% { border-radius: 42% 58% 62% 38% / 48% 42% 58% 52%; transform: scale(1.06); }
          40% { border-radius: 58% 42% 38% 62% / 55% 48% 52% 45%; transform: scale(0.95); }
          60% { border-radius: 38% 62% 55% 45% / 42% 58% 42% 58%; transform: scale(1.04); }
          80% { border-radius: 52% 48% 45% 55% / 58% 38% 62% 42%; transform: scale(0.98); }
        }
        @keyframes orb-gradient {
          0%, 100% { background-position: 0% 50%; }
          33% { background-position: 100% 0%; }
          66% { background-position: 50% 100%; }
        }
        @keyframes code-rain {
          0% { transform: translateY(-120%); opacity: 0; }
          8% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(calc(100vh + 120%)); opacity: 0; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
        @keyframes sparkle-burst {
          0% { transform: scale(0) translate(0, 0); opacity: 1; }
          30% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
