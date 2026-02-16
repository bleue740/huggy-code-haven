import React, { useState, useEffect } from 'react';
import { Brain, ListChecks, Hammer, Eye, CheckCircle2, Loader2, AlertCircle, SearchIcon } from 'lucide-react';
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';

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

const THINKING_ROTATION = [
  'Analyzing requirements…',
  'Identifying core features…',
  'Designing a scalable structure…',
  'Selecting the right stack…',
  'Defining architecture…',
];

const TypingDots = () => (
  <span className="inline-flex gap-[3px] ml-1">
    <span className="w-1 h-1 rounded-full bg-primary animate-[bounce_1.2s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
    <span className="w-1 h-1 rounded-full bg-primary animate-[bounce_1.2s_ease-in-out_infinite]" style={{ animationDelay: '180ms' }} />
    <span className="w-1 h-1 rounded-full bg-primary animate-[bounce_1.2s_ease-in-out_infinite]" style={{ animationDelay: '360ms' }} />
  </span>
);

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full h-[2px] bg-muted rounded-full overflow-hidden mt-3">
    <div
      className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
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

  const buildProgress = buildLogs
    ? (buildLogs.filter(l => l.done).length / Math.max(buildLogs.length, 1)) * 100
    : 0;

  /* Build chain-of-thought steps from current state */
  const cotSteps: Array<{ icon?: any; label: string; status: 'complete' | 'active' | 'pending' }> = [];

  // Thinking step
  if (phase === 'thinking' || phase === 'planning' || phase === 'building' || phase === 'preview_ready') {
    cotSteps.push({
      icon: Brain,
      label: thinkingLines?.[0] || THINKING_ROTATION[rotationIndex],
      status: phase === 'thinking' ? 'active' : 'complete',
    });
  }

  // Planning steps
  if (planItems && planItems.length > 0) {
    planItems.forEach(item => {
      cotSteps.push({
        icon: ListChecks,
        label: item.label,
        status: item.done ? 'complete' : phase === 'planning' ? 'active' : 'pending',
      });
    });
  }

  // Building steps
  if (buildLogs && buildLogs.length > 0) {
    buildLogs.forEach(log => {
      cotSteps.push({
        icon: Hammer,
        label: log.text,
        status: log.done ? 'complete' : 'active',
      });
    });
  }

  const showChainOfThought = cotSteps.length > 0 && (phase === 'thinking' || phase === 'planning' || phase === 'building');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Phase badge */}
      <div className="flex items-center gap-2 mb-3">
        {phase === 'thinking' && <Brain size={14} className="text-primary animate-pulse" />}
        {phase === 'planning' && <ListChecks size={14} className="text-emerald-500" />}
        {phase === 'building' && <Hammer size={14} className="text-orange-500 animate-pulse" />}
        {phase === 'preview_ready' && <Eye size={14} className="text-emerald-500" />}
        {phase === 'error' && <AlertCircle size={14} className="text-destructive" />}

        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
          {phase === 'thinking' && 'Thinking'}
          {phase === 'planning' && 'Planning'}
          {phase === 'building' && 'Building'}
          {phase === 'preview_ready' && 'Preview Ready'}
          {phase === 'error' && 'Error'}
        </span>

        <span className="text-[9px] font-mono text-muted-foreground/60 ml-auto">{elapsedSeconds}s</span>
      </div>

      {/* Chain of Thought — shown during active phases */}
      {showChainOfThought && (
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader>Reasoning</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            {cotSteps.map((step, i) => (
              <ChainOfThoughtStep
                key={i}
                icon={step.icon}
                label={step.label}
                status={step.status}
              />
            ))}
          </ChainOfThoughtContent>
        </ChainOfThought>
      )}

      {/* Progress bar during building */}
      {phase === 'building' && <ProgressBar progress={buildProgress} />}

      {/* Thinking — rotating text when no CoT steps yet */}
      {phase === 'thinking' && cotSteps.length <= 1 && (
        <div className="relative bg-muted/50 border border-primary/10 rounded-xl p-5 overflow-hidden mt-2">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <Loader2 size={16} className="text-primary animate-spin shrink-0" />
            <p className="text-[13px] text-foreground/80 font-medium transition-all duration-500">
              {thinkingLines?.[0] || THINKING_ROTATION[rotationIndex]}
            </p>
          </div>
          <ProgressBar progress={Math.min(elapsedSeconds * 30, 80)} />
        </div>
      )}

      {/* Preview Ready */}
      {phase === 'preview_ready' && (
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[14px] text-foreground font-semibold">Your app is ready.</p>
              <p className="text-[11px] text-muted-foreground">Preview it live, share the link, or ask me to iterate.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div className="bg-destructive/5 border border-destructive/15 rounded-xl p-5">
          <p className="text-[13px] text-destructive font-medium">{errorMessage || 'Something went wrong.'}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Try rephrasing your request or simplify the scope.</p>
        </div>
      )}
    </div>
  );
};
