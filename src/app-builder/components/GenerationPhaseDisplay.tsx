import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, ListChecks, Hammer, CheckCircle2, AlertCircle,
  FileSearch, Check, Loader2, ChevronDown, ChevronRight, Sparkles, Pencil,
} from 'lucide-react';
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Shimmer } from '@/components/ai-elements/shimmer';

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
    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <FileSearch size={10} />
        <span>Files read ({readLogs.length})</span>
      </button>
      {isOpen && (
        <div className="px-3 pb-2.5 space-y-1 animate-in fade-in duration-200">
          {readLogs.map(log => (
            <div key={log.id} className="flex items-center gap-2 text-[11px]">
              <FileSearch size={10} className="text-primary/50 shrink-0" />
              <span className="font-mono text-muted-foreground">{log.text.replace('Reading ', '').replace('…', '')}</span>
              <Check size={9} className="text-emerald-500/70 ml-auto shrink-0" />
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
    <div className="rounded-lg border border-border bg-muted/10 overflow-hidden mt-2">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
      >
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <CheckCircle2 size={10} />
        <span>{doneLogs.length} file(s) written</span>
      </button>
      {isOpen && (
        <div className="px-3 pb-2.5 space-y-1 animate-in fade-in duration-200">
          {doneLogs.map(log => (
            <div key={log.id} className="flex items-center gap-2 text-[11px]">
              <CheckCircle2 size={10} className="text-emerald-500/60 shrink-0" />
              <span className="font-mono text-muted-foreground">{log.text.replace('Writing ', '').replace('…', '')}</span>
              {log.linesCount && (
                <span className="text-[9px] font-mono text-muted-foreground/60 ml-auto shrink-0">{log.linesCount}L</span>
              )}
            </div>
          ))}
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
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 space-y-2">

      {/* ─── THINKING — "Thought for Xs" + inline text, no badge ─── */}
      {(phase === 'thinking' || (thinkingText && (phase === 'planning' || phase === 'building'))) && (
        <Reasoning isStreaming={phase === 'thinking'} defaultOpen>
          <ReasoningTrigger />
          <ReasoningContent>
            {thinkingText || 'Analyzing your request…'}
          </ReasoningContent>
        </Reasoning>
      )}

      {/* ─── READING — shimmer or file list ─── */}
      {phase === 'reading' && (
        <div className="space-y-1.5 animate-in fade-in duration-300">
          {readLogs.length > 0 ? readLogs.map(log => (
            <div key={log.id} className="flex items-center gap-2 text-xs animate-in fade-in slide-in-from-left-2 duration-300">
              <FileSearch size={11} className="text-primary/60 shrink-0" />
              <span className="font-mono text-muted-foreground">{log.text.replace('Reading ', '').replace('…', '')}</span>
              <Check size={9} className="text-emerald-500 ml-auto shrink-0" />
            </div>
          )) : (
            <Shimmer className="text-xs font-mono" duration={1.2}>Reading project files…</Shimmer>
          )}
        </div>
      )}

      {/* ─── PLANNING — "Editing [file]" ChainOfThought like Lovable ─── */}
      {phase === 'planning' && planItems && planItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <ChainOfThought defaultOpen>
            {/* Header: "Editing" + first critical file as badge */}
            <ChainOfThoughtHeader>
              {(() => {
                const criticalItem = planItems.find(p => p.priority === 'critical') || planItems[0];
                const filePath = criticalItem?.path || null;
                return (
                  <span className="flex items-center gap-2">
                    <Pencil size={13} className="text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium text-muted-foreground">Planning</span>
                    {filePath && (
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-foreground/80 border border-border">
                        {filePath}
                      </span>
                    )}
                    <PriorityBadge priority={criticalItem?.priority} />
                  </span>
                );
              })()}
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {planItems.map((item, i) => {
                const isActive = !item.done && i === planItems.findIndex(p => !p.done);
                const status = item.done ? 'complete' : isActive ? 'active' : 'pending';
                return (
                  <ChainOfThoughtStep
                    key={i}
                    icon={item.done ? CheckCircle2 : isActive ? Loader2 : ListChecks}
                    iconClassName={isActive && !item.done ? 'animate-spin' : undefined}
                    label={
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span>{item.label}</span>
                        <PriorityBadge priority={item.priority} />
                      </span>
                    }
                    status={status}
                  />
                );
              })}
            </ChainOfThoughtContent>
          </ChainOfThought>
        </motion.div>
      )}

      {/* ─── BUILDING — "Editing [file]" + checklist like Lovable ─── */}
      {phase === 'building' && (
        <div className="space-y-2 animate-in fade-in duration-300">
          {/* Collapsed files read */}
          {readLogs.length > 0 && <ReadFilesSection readLogs={readLogs} collapsed />}

          {/* Lovable-style: ChainOfThought with "Editing [activeFile]" header */}
          {buildOnlyLogs.length > 0 ? (
            <ChainOfThought defaultOpen>
              <ChainOfThoughtHeader>
                {(() => {
                  const activeLog = buildOnlyLogs[firstActiveIdx] || buildOnlyLogs[buildOnlyLogs.length - 1];
                  const filePath = activeLog?.text.replace('Writing ', '').replace('…', '').trim();
                  return (
                    <span className="flex items-center gap-2">
                      <Pencil size={13} className="text-muted-foreground shrink-0 animate-pulse" />
                      <span className="text-xs font-medium text-muted-foreground">Editing</span>
                      {filePath && (
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-foreground/80 border border-border">
                          {filePath}
                        </span>
                      )}
                    </span>
                  );
                })()}
              </ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                {buildOnlyLogs.map((log, i) => {
                  const isActive = i === firstActiveIdx;
                  return (
                    <ChainOfThoughtStep
                      key={log.id}
                      icon={log.done ? CheckCircle2 : isActive ? Loader2 : ListChecks}
                      iconClassName={isActive && !log.done ? 'animate-spin' : undefined}
                      label={
                        <span className="font-mono text-[11px]">
                          {log.text.replace('Writing ', '').replace('…', '')}
                        </span>
                      }
                      description={log.linesCount ? `${log.linesCount} lines` : undefined}
                      status={log.done ? 'complete' : isActive ? 'active' : 'pending'}
                    />
                  );
                })}
              </ChainOfThoughtContent>
            </ChainOfThought>
          ) : (
            <Shimmer className="text-xs font-mono" duration={1.2}>Generating files…</Shimmer>
          )}

          {/* Global progress bar */}
          <div className="w-full h-[2px] bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60"
              animate={{ width: `${Math.max(5, Math.min(buildProgress, 100))}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* ─── FIXING ─── */}
      {phase === 'fixing' && (
        <div className="space-y-2 animate-in fade-in duration-300">
          <p className="text-xs text-muted-foreground">Reviewing and correcting generated code…</p>
          <div className="w-full h-[2px] bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500/70 animate-pulse" style={{ width: '70%' }} />
          </div>
        </div>
      )}

      {/* ─── PREVIEW READY ─── */}
      {phase === 'preview_ready' && (
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="space-y-2"
          >
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <motion.div
                className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0"
                initial={{ rotate: -15, scale: 0.7 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.08 }}
              >
                <Sparkles size={16} className="text-emerald-500" />
              </motion.div>
              <div>
                <motion.p
                  className="text-sm text-foreground font-semibold"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12, duration: 0.25 }}
                >
                  Your app is ready.
                </motion.p>
                <motion.p
                  className="text-[11px] text-muted-foreground"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22, duration: 0.25 }}
                >
                  Preview it live, share the link, or ask me to iterate.
                </motion.p>
              </div>
            </div>
            <WrittenFilesSection buildLogs={allBuildLogs} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* ─── ERROR ─── */}
      {phase === 'error' && (
        <div className="bg-destructive/5 border border-destructive/15 rounded-xl px-4 py-3">
          <p className="text-xs text-destructive font-medium">{errorMessage || 'Something went wrong.'}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Try rephrasing your request or simplify the scope.</p>
        </div>
      )}
    </div>
  );
};
