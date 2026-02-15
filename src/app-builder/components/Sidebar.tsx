import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Extension } from '@codemirror/state';
import {
  ChevronDown, Layout, Plus, ArrowUp, ArrowDown,
  Code2, MessageSquare, Sparkles, Terminal, User, Bot,
  PanelLeftClose, PanelLeftOpen, MessageSquarePlus,
  Table, CircleDashed, Square, Undo2, Redo2, FileCode2,
  History as HistoryIcon, Mic, MicOff, Image as ImageIcon,
  FileUp, Camera, Link, X, Pencil, FolderPlus, Settings, LayoutDashboard,
  MessageCirclePlus,
} from 'lucide-react';
import { AppState, AISuggestion } from '../types';
import { BackendConnectCard } from './BackendConnectCard';
import { ChatMessage } from './ChatMessage';
import { FileTree } from './FileTree';
import { CodeEditor } from './CodeEditor';
import { GenerationSteps } from './GenerationSteps';
import { GenerationPhaseDisplay, type PhaseType, type PlanItem, type BuildLog } from './GenerationPhaseDisplay';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onSend: (prompt?: string) => void;
  onStop?: () => void;
  onScreenshotRequest?: () => void;
  onToggleVisualEdit?: () => void;
  onShowHistory?: () => void;
  onNewChat?: () => void;
  onNewProject?: () => void;
  onRenameProject?: (name: string) => void;
  onBackToLanding?: () => void;
  onConnectSupabase?: () => void;
  onEnableFirecrawl?: () => void;
  onDismissBackendHints?: () => void;
  onApprovePlan?: (plan: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  collabExtension?: Extension[];
}

const MAX_CHARS = 10000;

const getSuggestionIcon = (icon: string) => {
  switch (icon) {
    case 'form': return <Square size={14} className="text-blue-400" />;
    case 'table': return <Table size={14} className="text-emerald-400" />;
    case 'chart': return <HistoryIcon size={14} className="text-purple-400" />;
    case 'button': return <CircleDashed size={14} className="text-orange-400" />;
    default: return <Layout size={14} className="text-neutral-400" />;
  }
};

const TypingDots = () => (
  <span className="inline-flex gap-[2px]">
    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDelay: '150ms' }} />
    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ animationDelay: '300ms' }} />
  </span>
);

const ShimmerLine = ({ width = 'w-full', delay = 0 }: { width?: string; delay?: number }) => (
  <div
    className={`h-3 ${width} rounded bg-gradient-to-r from-[#1a1a1a] via-[#333] to-[#1a1a1a] bg-[length:200%_100%] animate-shimmer`}
    style={{ animationDelay: `${delay}ms` }}
  />
);

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ state, setState, onSend, onStop, onScreenshotRequest, onToggleVisualEdit, onShowHistory, onNewChat, onNewProject, onRenameProject, onBackToLanding, onConnectSupabase, onEnableFirecrawl, onDismissBackendHints, onApprovePlan, onUndo, onRedo, canUndo, canRedo, collabExtension }, ref) => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [inputHistory, setInputHistory] = useState<string[]>([]);
    const [inputHistoryIndex, setInputHistoryIndex] = useState(-1);
    const [stashedCurrentInput, setStashedCurrentInput] = useState('');
    const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showProjectMenu, setShowProjectMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const attachMenuRef = useRef<HTMLDivElement>(null);
    const projectMenuRef = useRef<HTMLDivElement>(null);
    const isCodeView = state.isCodeView;
    const isVisualEditMode = state.isVisualEditMode ?? false;
    const setIsCodeView = (val: boolean) => setState(prev => ({ ...prev, isCodeView: val }));

    const handleVoiceTranscript = useCallback((text: string) => {
      setState(prev => ({ ...prev, currentInput: text }));
    }, [setState]);

    const { isListening, toggleListening, error: voiceError } = useVoiceInput(handleVoiceTranscript);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
          setShowAttachMenu(false);
        }
        if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
          setShowProjectMenu(false);
          setIsRenaming(false);
        }
      };
      if (showAttachMenu || showProjectMenu) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [showAttachMenu, showProjectMenu]);

    useEffect(() => {
      if (state.isGenerating) {
        if (!generationStartTime) {
          setGenerationStartTime(Date.now());
          setElapsedSeconds(0);
        }
        const interval = setInterval(() => {
          setElapsedSeconds(Math.floor((Date.now() - (generationStartTime || Date.now())) / 1000));
        }, 1000);
        return () => clearInterval(interval);
      } else {
        setGenerationStartTime(null);
        setElapsedSeconds(0);
      }
    }, [state.isGenerating, generationStartTime]);

    useEffect(() => {
      if (!chatInputRef.current) return;
      chatInputRef.current.style.height = 'auto';
      chatInputRef.current.style.height = `${Math.min(chatInputRef.current.scrollHeight, 240)}px`;
    }, [state.currentInput, isCollapsed]);

    useEffect(() => {
      if (!isCodeView && !isCollapsed) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, [state.history, isCodeView, isCollapsed]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          setIsCodeView(!isCodeView);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCodeView]);

    const handleCreateFile = useCallback((name: string) => {
      const baseName = name.replace(/\.\w+$/, '');
      const template = `function ${baseName}() {\n  return (\n    <div className="p-4">\n      <h2 className="text-xl font-bold text-white">${baseName}</h2>\n    </div>\n  );\n}\n`;
      setState(prev => ({ ...prev, files: { ...prev.files, [name]: template }, activeFile: name }));
    }, [setState]);

    const handleDeleteFile = useCallback((name: string) => {
      if (name === 'App.tsx') return;
      setState(prev => {
        const newFiles = { ...prev.files };
        delete newFiles[name];
        return { ...prev, files: newFiles, activeFile: prev.activeFile === name ? 'App.tsx' : prev.activeFile };
      });
    }, [setState]);

    const handleSelectFile = useCallback((name: string) => {
      setState(prev => ({ ...prev, activeFile: name }));
    }, [setState]);

    const handleCodeChange = useCallback((value: string) => {
      setState(prev => ({ ...prev, files: { ...prev.files, [prev.activeFile]: value } }));
    }, [setState]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const t = e.currentTarget;
      setShowScrollBottom(t.scrollHeight - t.scrollTop > t.clientHeight + 100);
    };

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const handleSendClick = useCallback(() => {
      const trimmed = state.currentInput.trim();
      if (!trimmed) return;
      setInputHistory(prev => [trimmed, ...prev.filter(i => i !== trimmed)].slice(0, 50));
      setInputHistoryIndex(-1);
      setStashedCurrentInput('');
      onSend();
    }, [state.currentInput, onSend]);

    const handleSuggestionClick = (s: AISuggestion) => onSend(s.prompt);

    const navigateInputHistory = useCallback((dir: 'up' | 'down') => {
      if (inputHistory.length === 0) return;
      if (dir === 'up') {
        const next = inputHistoryIndex + 1;
        if (next < inputHistory.length) {
          if (inputHistoryIndex === -1) setStashedCurrentInput(state.currentInput);
          setInputHistoryIndex(next);
          setState(prev => ({ ...prev, currentInput: inputHistory[next] }));
        }
      } else {
        const next = inputHistoryIndex - 1;
        if (next >= -1) {
          setInputHistoryIndex(next);
          setState(prev => ({ ...prev, currentInput: next === -1 ? stashedCurrentInput : inputHistory[next] }));
        }
      }
    }, [inputHistory, inputHistoryIndex, state.currentInput, stashedCurrentInput, setState]);

    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <div
        ref={ref}
        className={`flex flex-col border-r border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#0a0a0a] text-gray-500 dark:text-neutral-400 text-sm h-full relative transition-all duration-300 ${isCollapsed ? 'w-[64px]' : 'w-[380px]'}`}
      >
        <div className={`p-4 flex items-center shrink-0 overflow-visible ${isCollapsed ? 'flex-col gap-4' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="relative" ref={projectMenuRef}>
              <button
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center gap-2 text-white font-medium p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
              >
                <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-md" />
                <span className="truncate max-w-[140px]">{state.projectName || 'Blink AI'}</span>
                <ChevronDown size={14} className={`text-neutral-500 transition-transform duration-200 ${showProjectMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProjectMenu && (
                <div className="absolute top-full left-0 mt-2 bg-[#1a1a1a] border border-[#333] rounded-2xl p-2 min-w-[220px] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                  {/* Project Name Header */}
                  <div className="px-3 py-2.5 border-b border-[#333] mb-2">
                    {isRenaming ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (renameValue.trim()) {
                            onRenameProject?.(renameValue.trim());
                            setIsRenaming(false);
                            setShowProjectMenu(false);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="flex-1 bg-[#111] border border-[#444] rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                          placeholder="Nom du projet"
                          onKeyDown={(e) => { if (e.key === 'Escape') { setIsRenaming(false); } }}
                        />
                        <button type="submit" className="text-blue-400 hover:text-blue-300 text-xs font-bold">OK</button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest truncate">{state.projectName || 'New Project'}</span>
                        <button
                          onClick={() => { setRenameValue(state.projectName || 'New Project'); setIsRenaming(true); }}
                          className="p-1 hover:bg-white/10 rounded-md transition-colors text-neutral-500 hover:text-white"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Menu Items */}
                  <button
                    onClick={() => { setShowProjectMenu(false); onNewChat?.(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 rounded-xl transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <MessageCirclePlus size={14} className="text-blue-400" />
                    </div>
                    <span>New Chat</span>
                  </button>

                  <button
                    onClick={() => { setShowProjectMenu(false); onNewProject?.(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 rounded-xl transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                      <FolderPlus size={14} className="text-emerald-400" />
                    </div>
                    <span>New Project</span>
                  </button>

                  <button
                    onClick={() => { setRenameValue(state.projectName || 'New Project'); setIsRenaming(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 rounded-xl transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <Pencil size={14} className="text-purple-400" />
                    </div>
                    <span>Rename Project</span>
                  </button>

                  <div className="h-[1px] bg-[#333] my-2" />

                  <button
                    onClick={() => { setShowProjectMenu(false); navigate('/settings'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 rounded-xl transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-neutral-500/10 flex items-center justify-center group-hover:bg-neutral-500/20 transition-colors">
                      <Settings size={14} className="text-neutral-400" />
                    </div>
                    <span>Project Settings</span>
                  </button>

                  <button
                    onClick={() => { setShowProjectMenu(false); onBackToLanding?.(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 rounded-xl transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                      <LayoutDashboard size={14} className="text-orange-400" />
                    </div>
                    <span>Dashboard</span>
                  </button>
                </div>
              )}
            </div>
          )}
          <div className={`flex items-center gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors">
              {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col relative">
          {isCollapsed ? (
            <div className="flex-1 flex flex-col items-center py-4 gap-6 text-neutral-500">
              <MessageSquare size={20} className={`cursor-pointer hover:text-white transition-colors ${!isCodeView ? 'text-blue-500' : ''}`} onClick={() => { setIsCodeView(false); setIsCollapsed(false); }} />
              <Code2 size={20} className={`cursor-pointer hover:text-white transition-colors ${isCodeView ? 'text-blue-500' : ''}`} onClick={() => { setIsCodeView(true); setIsCollapsed(false); }} />
              <div className="w-8 h-[1px] bg-neutral-800" />
              <FileCode2 size={20} className="cursor-pointer hover:text-white transition-colors" onClick={() => { setIsCodeView(true); setIsCollapsed(false); }} />
            </div>
          ) : isCodeView ? (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
              <div className="px-4 py-2 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0f0f0f] shrink-0">
                <div className="flex items-center gap-2 text-white font-medium">
                  <button onClick={() => setIsCodeView(false)} className="p-1 -ml-1 hover:bg-white/10 rounded-md transition-colors"><MessageSquare size={14} /></button>
                  <Terminal size={14} className="text-blue-500" />
                  <span className="text-[10px] font-bold tracking-tight uppercase">TSX Editor</span>
                </div>
                <span className="text-[10px] text-neutral-600 font-mono">{state.activeFile}</span>
              </div>
              <FileTree files={state.files} activeFile={state.activeFile} onSelectFile={handleSelectFile} onCreateFile={handleCreateFile} onDeleteFile={handleDeleteFile} />
              <div className="flex-1 overflow-hidden">
                <CodeEditor value={state.files[state.activeFile] ?? ''} onChange={handleCodeChange} collabExtension={collabExtension} />
              </div>
            </div>
          ) : (
            <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-thin animate-in fade-in duration-200 relative">
              {showScrollBottom && (
                <button onClick={scrollToBottom} className="fixed bottom-32 left-[190px] -translate-x-1/2 bg-blue-600 text-white p-2 rounded-full shadow-2xl hover:bg-blue-700 transition-all animate-bounce z-50 border border-white/20">
                  <ArrowDown size={16} />
                </button>
              )}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-600">Active Session</span>
                <div className="flex items-center gap-1">
                  {(canUndo || canRedo) && (
                    <div className="flex items-center bg-black/40 rounded-lg px-1 py-0.5 mr-1">
                      <button onClick={onUndo} disabled={!canUndo} className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 transition-colors" title="Undo (fichiers)">
                        <Undo2 size={11} />
                      </button>
                      <button onClick={onRedo} disabled={!canRedo} className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 transition-colors" title="Redo (fichiers)">
                        <Redo2 size={11} />
                      </button>
                    </div>
                  )}
                  <button onClick={() => setIsCodeView(true)} className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold transition-colors group">
                    <Code2 size={12} className="group-hover:scale-110 transition-transform" /> View Code
                  </button>
                </div>
              </div>

              {!state.isGenerating && state.suggestions.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={12} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Suggested</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {state.suggestions.map((s) => (
                      <button key={s.id} onClick={() => handleSuggestionClick(s)} className="shrink-0 w-36 bg-[#1a1a1a] border border-[#333] hover:border-blue-500/50 rounded-xl p-3 text-left transition-all hover:bg-[#222] group">
                        <div className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center mb-2">{getSuggestionIcon(s.icon)}</div>
                        <div className="text-[11px] font-bold text-white mb-1 truncate">{s.label}</div>
                        <div className="text-[9px] text-neutral-500 line-clamp-2 leading-tight">{s.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {state.history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-4 text-neutral-700">
                    <MessageSquarePlus size={32} />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">Start a new conversation!</h3>
                </div>
              ) : (
                state.history.map((msg) => (
                  <div key={msg.id} className="group animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${msg.role === 'assistant' ? 'bg-blue-600/20 text-blue-400' : 'bg-neutral-800 text-neutral-400'}`}>
                        {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tight">{msg.role === 'assistant' ? 'BLINK' : 'YOU'}</span>
                          <span className="text-[9px] text-neutral-600 font-mono">{formatTime(msg.timestamp)}</span>
                        </div>
                        {msg.role === 'assistant' ? (
                          <ChatMessage message={msg} onApprovePlan={onApprovePlan} />
                        ) : (
                          <div className="text-[13px] leading-relaxed text-neutral-400">{msg.content}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Backend Connect Card - shown when AI detects backend needs */}
              {(state.backendHints?.length ?? 0) > 0 && !state.isGenerating && (
                <BackendConnectCard
                  needs={state.backendHints!}
                  onConnectSupabase={() => onConnectSupabase?.()}
                  onEnableFirecrawl={() => onEnableFirecrawl?.()}
                  onDismiss={() => onDismissBackendHints?.()}
                  supabaseConnected={!!state.supabaseUrl}
                  firecrawlEnabled={state.firecrawlEnabled}
                />
              )}

              {state.isGenerating && (
                <div className="group animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20">
                      <Bot size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-tight text-blue-400">BLINK</span>
                      </div>

                      {/* New 4-phase display */}
                      <GenerationPhaseDisplay
                        phase={(state as any)._generationPhase || 'thinking'}
                        thinkingLines={(state as any)._thinkingLines}
                        planItems={(state as any)._planItems}
                        buildLogs={(state as any)._buildLogs}
                        errorMessage={undefined}
                        elapsedSeconds={elapsedSeconds}
                        onStop={onStop}
                      />

                      {onStop && (
                        <div className="flex justify-end mt-3">
                          <button onClick={onStop} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all hover:scale-[1.02]">
                            <Square size={12} /> Stop
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <div className={`p-4 bg-[#0a0a0a] border-t border-[#1a1a1a] transition-all duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'} shrink-0`}>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-[11px] text-neutral-400 font-medium">{state.credits.toFixed(2)} credits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-black/40 rounded-lg px-1.5 py-0.5 mr-2">
                  <button onClick={() => navigateInputHistory('up')} disabled={inputHistoryIndex >= inputHistory.length - 1} className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 transition-colors"><Undo2 size={12} /></button>
                  <button onClick={() => navigateInputHistory('down')} disabled={inputHistoryIndex <= -1} className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 transition-colors"><Redo2 size={12} /></button>
                </div>
                <span className={`text-[10px] font-mono ${state.currentInput.length > MAX_CHARS * 0.9 ? 'text-red-500 font-bold' : 'text-neutral-600'}`}>
                  {state.currentInput.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </span>
              </div>
            </div>

            {voiceError && (
              <div className="mb-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 flex items-center gap-2">
                <X size={12} />
                <span>Voice: {voiceError}</span>
              </div>
            )}

            <textarea
              ref={chatInputRef}
              className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-neutral-600 resize-none min-h-[40px] text-[14px] leading-relaxed mb-2 scrollbar-thin overflow-y-auto outline-none"
              placeholder="Ask Blink to build something..."
              maxLength={MAX_CHARS}
              rows={1}
              value={state.currentInput}
              onChange={(e) => {
                setState(prev => ({ ...prev, currentInput: e.target.value }));
                if (inputHistoryIndex === -1) setStashedCurrentInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendClick(); }
                if (e.key === 'ArrowUp' && chatInputRef.current?.selectionStart === 0) { e.preventDefault(); navigateInputHistory('up'); }
                if (e.key === 'ArrowDown' && chatInputRef.current?.selectionEnd === state.currentInput.length) { e.preventDefault(); navigateInputHistory('down'); }
              }}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="relative" ref={attachMenuRef}>
                  <button
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${showAttachMenu ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-neutral-400'}`}
                  >
                    <Plus size={18} className={showAttachMenu ? 'rotate-45' : ''} style={{ transition: 'transform 0.2s' }} />
                  </button>

                  {showAttachMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-[#1a1a1a] border border-[#333] rounded-2xl p-2 min-w-[180px] shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                      <button onClick={() => { setShowAttachMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 rounded-xl transition-colors group">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                          <ImageIcon size={14} className="text-blue-400" />
                        </div>
                        <span>Attach Image</span>
                      </button>
                      <button onClick={() => { setShowAttachMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 rounded-xl transition-colors group">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                          <FileUp size={14} className="text-emerald-400" />
                        </div>
                        <span>Attach File</span>
                      </button>
                      <div className="h-[1px] bg-[#333] my-2" />
                      <button onClick={() => { setShowAttachMenu(false); onScreenshotRequest?.(); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 rounded-xl transition-colors group">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                          <Camera size={14} className="text-purple-400" />
                        </div>
                        <span>Screenshot</span>
                      </button>
                      <button onClick={() => { setShowAttachMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 rounded-xl transition-colors group">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                          <Link size={14} className="text-orange-400" />
                        </div>
                        <span>Import URL</span>
                      </button>
                      <div className="h-[1px] bg-[#333] my-2" />
                      <button onClick={() => { setShowAttachMenu(false); onShowHistory?.(); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-300 hover:bg-white/5 rounded-xl transition-colors group">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                          <HistoryIcon size={14} className="text-amber-400" />
                        </div>
                        <span>History</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Visual Edit Mode Button */}
                <button
                  onClick={() => {
                    if (onToggleVisualEdit) onToggleVisualEdit();
                    else setState(prev => ({ ...prev, isVisualEditMode: !prev.isVisualEditMode }));
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    (state.isVisualEditMode ?? false)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-[#262626] text-neutral-300 hover:bg-[#333]'
                  }`}
                >
                  <Sparkles size={13} className={(state.isVisualEditMode ?? false) ? 'text-white' : 'text-blue-400'} />
                  Visual
                </button>

                {/* Voice Input Button */}
                <button
                  onClick={toggleListening}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'hover:bg-white/5 text-neutral-400'}`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const isPlan = (state.chatMode || 'agent') === 'plan';
                    if (isCodeView) {
                      // If in code view, switch to chat view + activate plan
                      setIsCodeView(false);
                      setState(prev => ({ ...prev, chatMode: 'plan' }));
                    } else {
                      // Toggle between plan and agent
                      setState(prev => ({ ...prev, chatMode: isPlan ? 'agent' : 'plan' }));
                    }
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    (state.chatMode || 'agent') === 'plan'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-[#262626] text-neutral-300 hover:bg-[#333]'
                  }`}
                  title={(state.chatMode || 'agent') === 'plan' ? 'Mode Plan actif — cliquez pour passer en Agent' : 'Passer en mode Plan (discussion sans code)'}
                >
                  <MessageSquare size={13} /> {(state.chatMode || 'agent') === 'plan' ? 'Plan' : 'Chat'}
                </button>
                {state.isGenerating ? (
                  <button type="button" onClick={onStop} disabled={!onStop} className="w-8 h-8 rounded-full flex items-center justify-center bg-[#262626] text-white hover:bg-[#333] transition-all">
                    <Square size={16} />
                  </button>
                ) : (
                  <button onClick={handleSendClick} disabled={!state.currentInput.trim()} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${state.currentInput.trim() ? 'bg-white text-black active:scale-90 shadow-lg' : 'bg-[#262626] text-neutral-600 cursor-not-allowed'}`}>
                    <ArrowUp size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

Sidebar.displayName = 'Sidebar';
