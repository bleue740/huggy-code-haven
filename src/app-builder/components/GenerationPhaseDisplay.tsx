import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, ListChecks, Hammer, Eye, CheckCircle2, AlertCircle,
  FileSearch, Check, Loader2, ChevronDown, ChevronRight, Pencil, Sparkles,
} from 'lucide-react';
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
  path?: string;
  priority?: 'critical' | 'normal' | 'optional';
}

export interface BuildLog {
  id: string;
  text: string;
  done: boolean;
  type?: 'read' | 'build';
  linesCount?: number;
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

// ── Priority badge ─────────────────────────────────────────────────

const PriorityBadge: React.FC<{ priority?: PlanItem['priority'] }> = ({ priority }) => {
  if (!priority || priority === 'normal') return null;
  const styles = {
    critical: 'bg-destructive/10 text-destructive border-destructive/20',
    optional: 'bg-muted text-muted-foreground border-border',
  } as const;
  const labels = { critical: 'critical', optional: 'optional' } as const;
  const style = styles[priority as keyof typeof styles];
  if (!style) return null;
  return (
    <span className={`ml-2 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${style}`}>
      {labels[priority as keyof typeof labels]}
    </span>
  );
};

// ── Read files section (collapsible) ──────────────────────────────

const ReadFilesSection: React.FC<{ readLogs: BuildLog[]; collapsed?: boolean }> = ({ readLogs, collapsed = false }) => {
  const [isOpen, setIsOpen] = useState(!collapsed);
  if (readLogs.length === 0) return null;

  return (
    <div className="rounded-lg border border-blue-500/10 bg-blue-500/[0.03] overflow-hidden">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-semibold text-blue-400/70 uppercase tracking-widest hover:text-blue-400 transition-colors"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <FileSearch size={10} />
        <span>Files read ({readLogs.length})</span>
      </button>
      {isOpen && (
        <div className="px-3 pb-2.5 space-y-1 animate-in fade-in duration-200">
          {readLogs.map(log => (
            <div key={log.id} className="flex items-center gap-2 text-[11px]">
              <FileSearch size={10} className="text-blue-400/60 shrink-0" />
              <span className="font-mono text-blue-400/70">{log.text.replace('Reading ', '').replace('…', '')}</span>
              <Check size={9} className="text-emerald-400/70 ml-auto shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Written files section in preview_ready ─────────────────────────

const WrittenFilesSection: React.FC<{ buildLogs: BuildLog[] }> = ({ buildLogs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const doneLogs = buildLogs.filter(l => l.type === 'build' && l.done);
  if (doneLogs.length === 0) return null;

  return (
    <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.03] overflow-hidden mt-3">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-semibold text-emerald-400/70 uppercase tracking-widest hover:text-emerald-400 transition-colors"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <CheckCircle2 size={10} />
        <span>{doneLogs.length} file(s) written</span>
      </button>
      {isOpen && (
        <div className="px-3 pb-2.5 space-y-1 animate-in fade-in duration-200">
          {doneLogs.map(log => (
            <div key={log.id} className="flex items-center gap-2 text-[11px]">
              <CheckCircle2 size={10} className="text-emerald-400/60 shrink-0" />
              <span className="font-mono text-muted-foreground">{log.text.replace('Writing ', '').replace('…', '')}</span>
              {log.linesCount && (
                <span className="text-[9px] font-mono text-emerald-400/70 ml-auto shrink-0">{log.linesCount}L</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Write indicator with mini progress bar ─────────────────────────

const WriteIndicator: React.FC<{ log: BuildLog; isActive: boolean }> = ({ log, isActive }) => {
  const linesText = log.linesCount ? ` (${log.linesCount} lines)` : '';
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-[11px]">
        {log.done ? (
          <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
        ) : isActive ? (
          <Pencil size={11} className="text-primary shrink-0 animate-pulse" />
        ) : (
          <div className="w-2.5 h-2.5 rounded-full border border-muted-foreground/30 shrink-0" />
        )}
        <span className={`font-mono truncate ${log.done ? 'text-muted-foreground' : isActive ? 'text-foreground' : 'text-muted-foreground/40'}`}>
          {log.text}{linesText}
        </span>
        {log.done && log.linesCount && (
          <span className="text-[9px] text-emerald-400/70 ml-auto font-mono shrink-0">{log.linesCount}L</span>
        )}
      </div>
      {isActive && !log.done && (
        <div className="ml-4 h-[2px] bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary/60 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────

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
  const allBuildLogs = buildLogs ?? [];

  // First "active" (not-done) build log index
  const firstActiveIdx = buildOnlyLogs.findIndex(l => !l.done);

  const buildProgress = buildOnlyLogs.length > 0
    ? (buildOnlyLogs.filter(l => l.done).length / buildOnlyLogs.length) * 100
    : 0;

  // Phase badge config
  const phaseConfig: Record<PhaseType, { icon: React.ReactNode; label: string; color: string }> = {
    thinking: { icon: <Brain size={13} className="text-primary animate-pulse" />, label: 'Thinking', color: 'text-primary' },
    reading: { icon: <FileSearch size={13} className="text-blue-400 animate-pulse" />, label: 'Reading files', color: 'text-blue-400' },
    planning: { icon: <ListChecks size={13} className="text-emerald-500" />, label: 'Planning', color: 'text-emerald-500' },
    building: { icon: <Hammer size={13} className="text-orange-500 animate-pulse" />, label: 'Building', color: 'text-orange-500' },
    fixing: { icon: <Loader2 size={13} className="text-yellow-500 animate-spin" />, label: 'Auto-fixing', color: 'text-yellow-500' },
    preview_ready: { icon: <Sparkles size={13} className="text-emerald-500" />, label: 'Ready', color: 'text-emerald-500' },
    error: { icon: <AlertCircle size={13} className="text-destructive" />, label: 'Error', color: 'text-destructive' },
  };

  const cfg = phaseConfig[phase] || phaseConfig.thinking;

  // Thinking text accumulated
  const thinkingText = thinkingLines?.join('') || '';

  // Plan chain-of-thought steps
  const planCotSteps = (planItems ?? []).map(item => ({
    icon: item.done ? CheckCircle2 : ListChecks,
    label: item.label,
    status: (item.done ? 'complete' : phase === 'planning' ? 'active' : 'complete') as 'complete' | 'active' | 'pending',
    priority: item.priority,
  }));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-3">
      {/* Phase badge */}
      <div className="flex items-center gap-2">
        {cfg.icon}
        <span className={`text-[10px] font-extrabold uppercase tracking-[0.12em] ${cfg.color}`}>
          {cfg.label}
        </span>
        <span className="text-[9px] font-mono text-muted-foreground/50 ml-auto">{elapsedSeconds}s</span>
      </div>

      {/* ─── THINKING PHASE ───
          Reasoning handles duration + auto-collapse natively via its built-in timer */}
      {(phase === 'thinking' || (thinkingText && phase === 'planning')) && (
        <Reasoning
          isStreaming={phase === 'thinking'}
          defaultOpen={true}
        >
          <ReasoningTrigger />
          <ReasoningContent>
            {thinkingText || 'Analyzing your request…'}
          </ReasoningContent>
        </Reasoning>
      )}

      {/* ─── READING PHASE ─── */}
      {phase === 'reading' && (
        <div className="space-y-2 animate-in fade-in duration-300">
          {readLogs.length > 0 ? (
            <div className="space-y-1.5">
              {readLogs.map(log => (
                <div key={log.id} className="flex items-center gap-2 text-[11px] animate-in fade-in slide-in-from-left-2 duration-300">
                  <FileSearch size={11} className="text-blue-400 shrink-0" />
                  <span className="font-mono text-blue-400/80">{log.text}</span>
                  <Check size={9} className="text-emerald-400 ml-auto shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <Shimmer className="text-[11px] font-mono" duration={1.2}>Reading project files…</Shimmer>
          )}
        </div>
      )}

      {/* ─── PLANNING PHASE ─── */}
      {phase === 'planning' && planItems && planItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-2"
        >
          <p className="text-[11px] text-muted-foreground">Here's how your app will be built</p>
          <ChainOfThought defaultOpen>
            <ChainOfThoughtHeader>Application plan</ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {planCotSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-0">
                  <ChainOfThoughtStep
                    icon={step.icon}
                    label={
                      <span className="flex items-center gap-1 flex-wrap">
                        <span>{step.label}</span>
                        <PriorityBadge priority={step.priority} />
                      </span>
                    }
                    status={step.status}
                  />
                </div>
              ))}
            </ChainOfThoughtContent>
          </ChainOfThought>
        </motion.div>
      )}

      {/* ─── BUILDING PHASE ─── */}
      {phase === 'building' && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {/* Read files — collapsed subsection */}
          {readLogs.length > 0 && (
            <ReadFilesSection readLogs={readLogs} collapsed={true} />
          )}

          {/* Write indicators with per-file mini progress */}
          {buildOnlyLogs.length > 0 ? (
            <div className="space-y-2">
              {buildOnlyLogs.map((log, i) => (
                <WriteIndicator
                  key={log.id}
                  log={log}
                  isActive={i === firstActiveIdx}
                />
              ))}
            </div>
          ) : (
            <Shimmer className="text-[11px] font-mono" duration={1.2}>Generating files…</Shimmer>
          )}

          {/* Global progress bar */}
          <div className="w-full h-[2px] bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(5, Math.min(buildProgress, 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── FIXING PHASE ─── */}
      {phase === 'fixing' && (
        <div className="space-y-2 animate-in fade-in duration-300">
          <p className="text-[11px] text-muted-foreground">Reviewing and correcting generated code…</p>
          <div className="w-full h-[2px] bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500/70 transition-all duration-700 ease-out animate-pulse" style={{ width: '70%' }} />
          </div>
        </div>
      )}

      {/* ─── PREVIEW READY — framer-motion celebration ─── */}
      {phase === 'preview_ready' && (
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-1">
                {/* Sparkles burst animation */}
                <motion.div
                  className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center"
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 18, delay: 0.1 }}
                >
                  <Sparkles size={18} className="text-emerald-500" />
                </motion.div>
                <div>
                  <motion.p
                    className="text-[14px] text-foreground font-semibold"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    Your app is ready.
                  </motion.p>
                  <motion.p
                    className="text-[11px] text-muted-foreground"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                  >
                    Preview it live, share the link, or ask me to iterate.
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Written files — collapsible, shown below the celebration block */}
            <WrittenFilesSection buildLogs={allBuildLogs} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* ─── ERROR ─── */}
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
