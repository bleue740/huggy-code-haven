import React from 'react';
import { Brain, ListChecks, Hammer, Eye, CheckCircle2, AlertCircle, FileSearch, Check, Loader2 } from 'lucide-react';
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Shimmer } from '@/components/ai-elements/shimmer';
import {
  StackTrace,
  StackTraceHeader,
  StackTraceError,
  StackTraceContent,
  StackTraceFrames,
  StackTraceCopyButton,
} from '@/components/ai-elements/stack-trace';

export type PhaseType = 'thinking' | 'reading' | 'planning' | 'building' | 'fixing' | 'preview_ready' | 'error';

export interface PlanItem {
  label: string;
  done?: boolean;
}

export interface BuildLog {
  id: string;
  text: string;
  done: boolean;
  type?: 'read' | 'build';
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

const isStackTrace = (msg: string) =>
  msg.includes('\n    at ') || /^\w+Error:/.test(msg);

export const GenerationPhaseDisplay: React.FC<PhaseDisplayProps> = ({
  phase,
  thinkingLines,
  planItems,
  buildLogs,
  errorMessage,
  elapsedSeconds,
}) => {
  const buildOnlyLogs = buildLogs?.filter(l => l.type !== 'read') ?? [];
  const readLogs = buildLogs?.filter(l => l.type === 'read') ?? [];

  const buildProgress = buildOnlyLogs.length > 0
    ? (buildOnlyLogs.filter(l => l.done).length / buildOnlyLogs.length) * 100
    : 0;

  /* Build chain-of-thought steps from current state */
  const cotSteps: Array<{ icon?: any; label: string; status: 'complete' | 'active' | 'pending' }> = [];

  if (planItems && planItems.length > 0) {
    planItems.forEach(item => {
      cotSteps.push({
        icon: item.done ? CheckCircle2 : ListChecks,
        label: item.label,
        status: item.done ? 'complete' : phase === 'planning' ? 'active' : 'pending',
      });
    });
  }

  if (buildOnlyLogs.length > 0) {
    buildOnlyLogs.forEach(log => {
      cotSteps.push({
        icon: log.done ? CheckCircle2 : Loader2,
        label: log.text,
        status: log.done ? 'complete' : 'active',
      });
    });
  }

  const showChainOfThought = cotSteps.length > 0 && (phase === 'planning' || phase === 'building' || phase === 'reading' || phase === 'fixing');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-3">
      {/* Phase badge */}
      <div className="flex items-center gap-2">
        {phase === 'thinking' && <Brain size={14} className="text-primary animate-pulse" />}
        {phase === 'reading' && <FileSearch size={14} className="text-blue-400 animate-pulse" />}
        {phase === 'planning' && <ListChecks size={14} className="text-emerald-500" />}
        {phase === 'building' && <Hammer size={14} className="text-orange-500 animate-pulse" />}
        {phase === 'fixing' && <Loader2 size={14} className="text-yellow-500 animate-spin" />}
        {phase === 'preview_ready' && <Eye size={14} className="text-emerald-500" />}
        {phase === 'error' && <AlertCircle size={14} className="text-destructive" />}

        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
          {phase === 'thinking' && 'Thinking'}
          {phase === 'reading' && 'Reading Files'}
          {phase === 'planning' && 'Planning'}
          {phase === 'building' && 'Building'}
          {phase === 'fixing' && 'Auto-fixing'}
          {phase === 'preview_ready' && 'Preview Ready'}
          {phase === 'error' && 'Error'}
        </span>

        <span className="text-[9px] font-mono text-muted-foreground/60 ml-auto">{elapsedSeconds}s</span>
      </div>

      {/* Reasoning — shown during thinking phase with real streamed content */}
      {phase === 'thinking' && (
        <Reasoning isStreaming={true} defaultOpen>
          <ReasoningTrigger />
          <ReasoningContent>
            {thinkingLines?.join('') || 'Analyzing your request…'}
          </ReasoningContent>
        </Reasoning>
      )}

      {/* Reading files — animated file list */}
      {phase === 'reading' && readLogs.length > 0 && (
        <div className="space-y-1.5 animate-in fade-in duration-300">
          {readLogs.map(log => (
            <div key={log.id} className="flex items-center gap-2 text-[11px]">
              <FileSearch size={11} className="text-blue-400 shrink-0" />
              <span className="font-mono text-blue-400/80">{log.text}</span>
              <Check size={9} className="text-emerald-400 ml-auto shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Reading phase with no logs yet — shimmer placeholder */}
      {phase === 'reading' && readLogs.length === 0 && (
        <div className="space-y-1.5">
          <Shimmer className="text-[11px] font-mono" duration={1.2}>Reading project files…</Shimmer>
        </div>
      )}

      {/* Chain of Thought — shown during planning/building/reading/fixing */}
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

      {/* Progress bar during building/fixing */}
      {(phase === 'building' || phase === 'fixing') && (
        <div className="w-full h-[2px] bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(buildProgress, 100)}%` }}
          />
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

      {/* Error — with StackTrace if applicable */}
      {phase === 'error' && errorMessage && isStackTrace(errorMessage) && (
        <StackTrace trace={errorMessage} defaultOpen>
          <StackTraceHeader>Runtime Error</StackTraceHeader>
          <StackTraceError />
          <StackTraceContent>
            <StackTraceFrames showInternalFrames={false} />
            <div className="flex justify-end mt-2">
              <StackTraceCopyButton />
            </div>
          </StackTraceContent>
        </StackTrace>
      )}

      {phase === 'error' && (!errorMessage || !isStackTrace(errorMessage)) && (
        <div className="bg-destructive/5 border border-destructive/15 rounded-xl p-5">
          <p className="text-[13px] text-destructive font-medium">{errorMessage || 'Something went wrong.'}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Try rephrasing your request or simplify the scope.</p>
        </div>
      )}
    </div>
  );
};
