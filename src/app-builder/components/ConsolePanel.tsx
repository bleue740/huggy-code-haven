import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export interface ConsoleLog {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
  stack?: string;
}

interface ConsolePanelProps {
  logs: ConsoleLog[];
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const getLogIcon = (type: ConsoleLog['type']) => {
  switch (type) {
    case 'error':
      return <AlertCircle size={12} className="text-red-500 shrink-0" />;
    case 'warn':
      return <AlertTriangle size={12} className="text-yellow-500 shrink-0" />;
    case 'info':
      return <Info size={12} className="text-blue-500 shrink-0" />;
    default:
      return <Terminal size={12} className="text-neutral-500 shrink-0" />;
  }
};

const getLogStyles = (type: ConsoleLog['type']) => {
  switch (type) {
    case 'error':
      return 'bg-red-500/10 border-l-2 border-red-500 text-red-300';
    case 'warn':
      return 'bg-yellow-500/10 border-l-2 border-yellow-500 text-yellow-300';
    case 'info':
      return 'bg-blue-500/10 border-l-2 border-blue-500 text-blue-300';
    default:
      return 'bg-transparent text-neutral-300';
  }
};

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  logs,
  onClear,
  isOpen,
  onToggle,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'log'>('all');

  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const errorCount = logs.filter((l) => l.type === 'error').length;
  const warnCount = logs.filter((l) => l.type === 'warn').length;

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#1a1a1a] rounded-lg shadow-xl hover:bg-[#1a1a1a] transition-all group"
      >
        <Terminal size={16} className="text-neutral-500 group-hover:text-white" />
        <span className="text-xs font-medium text-neutral-500 group-hover:text-white">Console</span>
        {errorCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full">
            {errorCount}
          </span>
        )}
        {warnCount > 0 && errorCount === 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-yellow-500 text-black rounded-full">
            {warnCount}
          </span>
        )}
        <ChevronUp size={14} className="text-neutral-500" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#1a1a1a] shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] bg-[#111]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-blue-500" />
            <span className="text-xs font-bold text-white uppercase tracking-wide">Console</span>
          </div>

          <div className="flex items-center gap-1 bg-[#0a0a0a] rounded-lg p-0.5">
            {(['all', 'error', 'warn', 'log'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'error' && errorCount > 0 && (
                  <span className="ml-1 text-[9px]">({errorCount})</span>
                )}
                {f === 'warn' && warnCount > 0 && (
                  <span className="ml-1 text-[9px]">({warnCount})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
            title="Clear console"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
            title="Close console"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-48 overflow-y-auto scrollbar-thin font-mono text-[11px]"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-500 text-xs">
            No logs to display
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]/50">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`flex items-start gap-2 px-4 py-1.5 ${getLogStyles(log.type)}`}
              >
                <span className="text-[9px] text-neutral-600 shrink-0 font-mono mt-0.5">
                  {formatTime(log.timestamp)}
                </span>
                {getLogIcon(log.type)}
                <div className="flex-1 min-w-0">
                  <pre className="whitespace-pre-wrap break-words">{log.message}</pre>
                  {log.stack && (
                    <pre className="mt-1 text-[10px] text-neutral-600 whitespace-pre-wrap break-words opacity-70">
                      {log.stack}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
