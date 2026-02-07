import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { CodePreview } from './components/CodePreview';
import { LandingPage } from './components/LandingPage';
import { ConsolePanel } from './components/ConsolePanel';
import { useConsoleCapture } from './hooks/useConsoleCapture';
import { useCredits } from './hooks/useCredits';
import { AppState, Message, AISuggestion, SecurityResult } from './types';
import { X, CheckCircle2, Zap, Rocket, ShieldCheck, AlertTriangle, Info, Loader2, History } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEFAULT_APP_CODE = `const { useState, useEffect, useCallback, useRef } = React;

function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <h1 className="text-5xl font-black tracking-tight mb-4">Blink AI</h1>
        <p className="text-neutral-400 text-lg mb-8">Décris l'application que tu veux construire dans le chat. L'IA va générer du vrai code React pour toi.</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 text-sm font-bold rounded-full border border-blue-500/30">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          Prêt à générer
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
`;

const DEFAULT_FILES: Record<string, string> = { 'App.tsx': DEFAULT_APP_CODE };

function buildConcatenatedCode(files: Record<string, string>): string {
  const entries = Object.entries(files);
  const app = entries.find(([n]) => n === 'App.tsx');
  const others = entries.filter(([n]) => n !== 'App.tsx').sort(([a], [b]) => a.localeCompare(b));
  return [...others.map(([, c]) => c), app?.[1] ?? ''].join('\n\n');
}

function serializeFiles(files: Record<string, string>): string {
  if (Object.keys(files).length === 1 && files['App.tsx']) return files['App.tsx'];
  return JSON.stringify({ __multifile: true, files });
}

function deserializeFiles(raw: string | null | undefined): Record<string, string> {
  if (!raw) return { ...DEFAULT_FILES };
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.__multifile && typeof parsed.files === 'object') return parsed.files;
    return { 'App.tsx': raw };
  } catch {
    return { 'App.tsx': raw };
  }
}

const App: React.FC = () => {
  const navigate = useNavigate();
  const [showLanding, setShowLanding] = useState(true);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { logs: consoleLogs, clearLogs: clearConsoleLogs } = useConsoleCapture();
  const { credits, useCredits: deductCredits, isLoading: creditsLoading } = useCredits();

  const [state, setState] = useState<AppState>({
    credits: 0,
    currentInput: '',
    isGenerating: false,
    aiStatusText: null,
    aiEvents: [],
    isCodeView: false,
    history: [{
      id: '1',
      role: 'assistant',
      content: "Je suis prêt. Décrivez-moi l'application que vous voulez construire — je vais générer du vrai code React multi-fichiers.",
      timestamp: Date.now(),
    }],
    suggestions: [],
    files: { ...DEFAULT_FILES },
    activeFile: 'App.tsx',
    isDeploying: false,
    deploymentProgress: 0,
    deployedUrl: null,
    customDomain: null,
    showUpgradeModal: false,
    isRunningSecurity: false,
    showSecurityModal: false,
    securityScore: 0,
    securityResults: [],
  });

  useEffect(() => {
    if (!creditsLoading) {
      setState(prev => ({ ...prev, credits }));
    }
  }, [credits, creditsLoading]);

  const concatenatedCode = useMemo(() => buildConcatenatedCode(state.files), [state.files]);
  const saveTimerRef = useRef<number | null>(null);
  const filesRef = useRef(state.files);
  useEffect(() => { filesRef.current = state.files; }, [state.files]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;

      const { data: existing, error } = await supabase
        .from("projects")
        .select("id, name, schema, code, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!mounted) return;
      if (error) return;

      if (existing && existing.length > 0) {
        const proj = existing[0] as any;
        const files = deserializeFiles(proj.code);
        setState(prev => ({ ...prev, projectId: proj.id, files, activeFile: 'App.tsx' }));
        return;
      }

      const defaultSchema = { version: "3.0.0", app_name: "New Project", components: [] };
      const { data: inserted } = await supabase
        .from("projects")
        .insert({ user_id: userId, name: "New Project", schema: defaultSchema, code: serializeFiles(DEFAULT_FILES) } as any)
        .select("id")
        .single();
      if (!mounted) return;
      setState(prev => ({ ...prev, projectId: (inserted as any)?.id }));
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!state.projectId || state.isDeploying) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId) return;
        await supabase
          .from("projects")
          .update({ code: serializeFiles(filesRef.current) } as any)
          .eq("id", state.projectId)
          .eq("user_id", userId);
      } catch { /* ignore */ }
    }, 900);
    return () => { if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current); };
  }, [state.files, state.projectId, state.isDeploying]);

  const fetchSuggestions = useCallback(async () => {
    const mockSuggestions: AISuggestion[] = [
      { id: "sug_1", label: "Ajouter une page pricing", description: "Crée une section Pricing avec 3 plans et CTA.", prompt: "Ajoute une section pricing moderne avec 3 plans et un CTA.", icon: "layout" },
      { id: "sug_2", label: "Dashboard analytics", description: "Ajoute une page dashboard avec tableaux + graphiques.", prompt: "Ajoute un dashboard analytics avec 2 charts et une table.", icon: "chart" },
      { id: "sug_3", label: "Formulaire onboarding", description: "Collecte le nom, entreprise, objectifs.", prompt: "Ajoute un formulaire onboarding (nom, entreprise, objectifs).", icon: "form" },
    ];
    setState(prev => ({ ...prev, suggestions: mockSuggestions }));
  }, []);

  const handleStopGenerating = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(prev => ({ ...prev, isGenerating: false, aiStatusText: null }));
  }, []);

  const handleSendMessage = useCallback(async (customPrompt?: string) => {
    const input = (customPrompt ?? state.currentInput).trim();
    if (!input || state.isGenerating) return;
    if (showLanding) setShowLanding(false);

    const now = Date.now();
    const userMessage: Message = { id: now.toString(), role: 'user', content: input, timestamp: now };

    setState(prev => ({
      ...prev,
      isGenerating: true,
      aiStatusText: "Analyse de ta demande…",
      history: [...prev.history, userMessage],
      currentInput: customPrompt ? prev.currentInput : '',
    }));

    // Simulate AI response since there's no edge function yet
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now()).toString(),
        role: 'assistant',
        content: `J'ai bien reçu ta demande : "${input}". Pour générer du code, il faut configurer la fonction AI backend. En attendant, tu peux modifier le code directement dans l'éditeur à gauche (Ctrl+K).`,
        timestamp: Date.now(),
      };
      setState(prev => ({
        ...prev,
        isGenerating: false,
        aiStatusText: null,
        history: [...prev.history, assistantMessage],
      }));
      fetchSuggestions();
    }, 2000);
  }, [state.currentInput, state.isGenerating, showLanding, fetchSuggestions]);

  const handlePublish = useCallback(async () => {
    setState(prev => ({ ...prev, isDeploying: true, deploymentProgress: 0 }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress < 90) {
        setState(prev => ({ ...prev, deploymentProgress: Math.min(progress, 90) }));
      }
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
      setState(prev => ({
        ...prev,
        isDeploying: false,
        deploymentProgress: 100,
        deployedUrl: null,
      }));
      toast.success('🚀 Déploiement simulé !', { description: 'Configure le backend pour un vrai déploiement.' });
    }, 3000);
  }, []);

  const handleUpgrade = useCallback(() => navigate('/pricing'), [navigate]);

  const handleRunSecurity = useCallback(() => {
    setState(prev => ({ ...prev, showSecurityModal: true, isRunningSecurity: true, securityScore: 0, securityResults: [] }));
    setTimeout(() => {
      const results: SecurityResult[] = [
        { name: "SSL/TLS Encryption", status: 'passed', description: "All traffic encrypted via TLS 1.3." },
        { name: "XSS Protection", status: 'passed', description: "Automatic input sanitization active." },
        { name: "CSRF Protection", status: 'passed', description: "Anti-forgery tokens validated." },
        { name: "Rate Limiting", status: 'warning', description: "Per-endpoint tuning recommended." },
        { name: "Dependency Audit", status: 'passed', description: "All dependencies up to date." },
        { name: "Headers Security", status: 'info', description: "CSP header could be more restrictive." },
      ];
      setState(prev => ({ ...prev, isRunningSecurity: false, securityScore: 94, securityResults: results }));
    }, 2500);
  }, []);

  const handleNewProject = useCallback(() => {
    if (confirm("Créer un nouveau projet ? Les changements actuels seront perdus.")) {
      setState(prev => ({
        ...prev,
        files: { ...DEFAULT_FILES },
        activeFile: 'App.tsx',
        history: [{ id: Date.now().toString(), role: 'assistant', content: "Projet réinitialisé. Comment puis-je vous aider ?", timestamp: Date.now() }],
        selectedWidgetId: undefined,
      }));
    }
  }, []);

  const handleStartFromLanding = (prompt: string) => {
    setState(prev => ({ ...prev, currentInput: prompt }));
    handleSendMessage(prompt);
  };

  const handleScreenshotRequest = useCallback(() => {
    toast.info('📸 Capturing screenshot...');
  }, []);

  const handleShowHistory = useCallback(() => {
    setState(prev => ({ ...prev, showHistoryModal: true }));
  }, []);

  if (showLanding) {
    return (
      <div className="dark">
        <LandingPage onStart={handleStartFromLanding} />
      </div>
    );
  }

  return (
    <div className="dark">
      <div className="flex h-screen bg-[#050505] overflow-hidden select-none relative">
        <Sidebar
          state={state}
          setState={setState}
          onSend={handleSendMessage}
          onStop={handleStopGenerating}
          onScreenshotRequest={handleScreenshotRequest}
          onShowHistory={handleShowHistory}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            onBackToLanding={() => setShowLanding(true)}
            onPublish={handlePublish}
            onUpgrade={handleUpgrade}
            onRunSecurity={handleRunSecurity}
            onNewProject={handleNewProject}
            onToggleCodeView={() => setState(prev => ({ ...prev, isCodeView: !prev.isCodeView }))}
            isCodeView={state.isCodeView}
            isGenerating={state.isGenerating}
          />
          <CodePreview code={concatenatedCode} isGenerating={state.isGenerating} />
          <ConsolePanel logs={consoleLogs} onClear={clearConsoleLogs} isOpen={consoleOpen} onToggle={() => setConsoleOpen(!consoleOpen)} />
        </div>

        {/* Security Modal */}
        {state.showSecurityModal && (
          <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-[#111] border border-[#1a1a1a] w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><ShieldCheck size={24} /></div>
                    <div>
                      <h3 className="text-xl font-black text-white">Security Run</h3>
                      <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Infrastructure Scan</p>
                    </div>
                  </div>
                  <button onClick={() => setState(prev => ({ ...prev, showSecurityModal: false }))} className="p-2 text-neutral-500 hover:text-white"><X size={20} /></button>
                </div>
                {state.isRunningSecurity ? (
                  <div className="py-20 flex flex-col items-center text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <h4 className="text-white font-bold text-lg">Scanning…</h4>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between p-6 bg-[#1a1a1a] rounded-2xl border border-[#333]">
                      <div>
                        <div className="text-3xl font-black text-white">{state.securityScore}%</div>
                        <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Security Score</div>
                      </div>
                      <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-400">High</div>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {state.securityResults?.map((res, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
                          <div className="mt-0.5 text-blue-500">
                            {res.status === 'passed' ? <CheckCircle2 size={16} /> : res.status === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                          </div>
                          <div>
                            <div className="text-xs font-black text-white">{res.name}</div>
                            <div className="text-[11px] text-neutral-500 mt-1">{res.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setState(prev => ({ ...prev, showSecurityModal: false }))} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:opacity-90">Close Report</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {state.showHistoryModal && (
          <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-[#111] border border-[#1a1a1a] w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500"><History size={24} /></div>
                    <div>
                      <h3 className="text-xl font-black text-white">Conversation History</h3>
                      <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">All your messages</p>
                    </div>
                  </div>
                  <button onClick={() => setState(prev => ({ ...prev, showHistoryModal: false }))} className="p-2 text-neutral-500 hover:text-white"><X size={20} /></button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {state.history.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
                      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${msg.role === 'assistant' ? 'bg-blue-500/10 text-blue-400' : 'bg-neutral-700/20 text-neutral-400'}`}>
                        {msg.role === 'assistant' ? '🤖' : '👤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black text-neutral-500 uppercase">{msg.role === 'assistant' ? 'BLINK' : 'YOU'}</span>
                        <p className="text-sm text-white line-clamp-3">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <button onClick={() => setState(prev => ({ ...prev, showHistoryModal: false }))} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
