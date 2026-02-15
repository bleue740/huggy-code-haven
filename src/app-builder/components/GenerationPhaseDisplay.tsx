import React, { useState, useEffect } from 'react';
import { Brain, ListChecks, Hammer, Eye, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export type PhaseType = 'thinking' | 'planning' | 'building' | 'preview_ready' | 'error';

export interface PlanItem {
  label: string;
  done?: boolean;
}

export interface BuildLog {
  id: string;
  text: string;
  done: boolean;
}

export interface PhaseDisplayProps {
  phase: PhaseType;
  thinkingLines?: string[];
  planItems?: PlanItem[];
  buildLogs?: BuildLog[];
  errorMessage?: string;
  elapsedSeconds: number;
  onStop?: () => void;
}

/* Rotating subtle text for the thinking phase */
const THINKING_ROTATION = [
  'Analyzing requirements…',
  'Identifying core features…',
  'Designing a scalable structure…',
  'Selecting the right stack…',
  'Defining architecture…',
];

const TypingDots = () => (
  <span className="inline-flex gap-[3px] ml-1">
    <span className="w-1 h-1 rounded-full bg-blue-400 animate-[bounce_1.2s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
    <span className="w-1 h-1 rounded-full bg-blue-400 animate-[bounce_1.2s_ease-in-out_infinite]" style={{ animationDelay: '180ms' }} />
    <span className="w-1 h-1 rounded-full bg-blue-400 animate-[bounce_1.2s_ease-in-out_infinite]" style={{ animationDelay: '360ms' }} />
  </span>
);

/* Thin animated progress bar */
const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden mt-3">
    <div
      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700 ease-out"
      style={{ width: `${Math.min(progress, 100)}%` }}
    />
  </div>
);

export const GenerationPhaseDisplay: React.FC<PhaseDisplayProps> = ({
  phase,
  thinkingLines,
  planItems,
  buildLogs,
  errorMessage,
  elapsedSeconds,
}) => {
  const [rotationIndex, setRotationIndex] = useState(0);

  useEffect(() => {
    if (phase !== 'thinking') return;
    const interval = setInterval(() => {
      setRotationIndex(i => (i + 1) % THINKING_ROTATION.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [phase]);

  /* Build progress as a percentage */
  const buildProgress = buildLogs
    ? (buildLogs.filter(l => l.done).length / Math.max(buildLogs.length, 1)) * 100
    : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* ── Phase badge ───────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        {phase === 'thinking' && <Brain size={14} className="text-blue-400 animate-pulse" />}
        {phase === 'planning' && <ListChecks size={14} className="text-emerald-400" />}
        {phase === 'building' && <Hammer size={14} className="text-orange-400 animate-pulse" />}
        {phase === 'preview_ready' && <Eye size={14} className="text-emerald-400" />}
        {phase === 'error' && <AlertCircle size={14} className="text-red-400" />}

        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-neutral-400">
          {phase === 'thinking' && 'Thinking'}
          {phase === 'planning' && 'Planning'}
          {phase === 'building' && 'Building'}
          {phase === 'preview_ready' && 'Preview Ready'}
          {phase === 'error' && 'Error'}
        </span>

        <span className="text-[9px] font-mono text-neutral-600 ml-auto">{elapsedSeconds}s</span>
      </div>

      {/* ── THINKING ──────────────────────────────────── */}
      {phase === 'thinking' && (
        <div className="relative bg-gradient-to-br from-[#12141c] to-[#0f1017] border border-blue-500/10 rounded-xl p-5 overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <Loader2 size={16} className="text-blue-400 animate-spin shrink-0" />
            <p className="text-[13px] text-neutral-200 font-medium transition-all duration-500">
              {thinkingLines?.[0] || THINKING_ROTATION[rotationIndex]}
            </p>
          </div>

          {(thinkingLines && thinkingLines.length > 1) && (
            <div className="mt-3 space-y-1.5 pl-7">
              {thinkingLines.slice(1).map((line, i) => (
                <p key={i} className="text-[11px] text-neutral-500 animate-in fade-in duration-300" style={{ animationDelay: `${i * 200}ms` }}>
                  {line}
                </p>
              ))}
            </div>
          )}

          <ProgressBar progress={Math.min(elapsedSeconds * 30, 80)} />
        </div>
      )}

      {/* ── PLANNING ──────────────────────────────────── */}
      {phase === 'planning' && (
        <div className="bg-gradient-to-br from-[#101714] to-[#0f1017] border border-emerald-500/10 rounded-xl p-5">
          <p className="text-[13px] text-neutral-200 font-medium mb-3">
            Project plan
          </p>
          <div className="space-y-2">
            {(planItems || []).map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span className="text-[12px] text-neutral-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BUILDING ──────────────────────────────────── */}
      {phase === 'building' && (
        <div className="bg-gradient-to-br from-[#171210] to-[#0f1017] border border-orange-500/10 rounded-xl p-5">
          <p className="text-[13px] text-neutral-200 font-medium mb-3">
            Building your application <TypingDots />
          </p>
          <div className="space-y-1.5">
            {(buildLogs || []).map((log) => (
              <div key={log.id} className="flex items-center gap-2.5 animate-in fade-in duration-200">
                {log.done ? (
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                ) : (
                  <Loader2 size={12} className="text-orange-400 animate-spin shrink-0" />
                )}
                <span className={`text-[11px] font-mono ${log.done ? 'text-neutral-500' : 'text-neutral-300'}`}>
                  {log.text}
                </span>
              </div>
            ))}
          </div>
          <ProgressBar progress={buildProgress} />
        </div>
      )}

      {/* ── PREVIEW READY ─────────────────────────────── */}
      {phase === 'preview_ready' && (
        <div className="bg-gradient-to-br from-[#101714] to-[#0f1017] border border-emerald-500/15 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[14px] text-white font-semibold">Your app is ready.</p>
              <p className="text-[11px] text-neutral-500">Preview it live, share the link, or ask me to iterate.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ──────────────────────────────────────── */}
      {phase === 'error' && (
        <div className="bg-gradient-to-br from-[#1a1010] to-[#0f1017] border border-red-500/15 rounded-xl p-5">
          <p className="text-[13px] text-red-300 font-medium">{errorMessage || 'Something went wrong.'}</p>
          <p className="text-[11px] text-neutral-500 mt-1">Try rephrasing your request or simplify the scope.</p>
        </div>
      )}
    </div>
  );
};
