import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { CodePreview } from './components/CodePreview';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ConsolePanel } from './components/ConsolePanel';
import { useConsoleCapture } from './hooks/useConsoleCapture';
import { useCredits } from './hooks/useCredits';
import { useAIChat, extractCodeFromResponse } from './hooks/useAIChat';
import { AppState, Message, AISuggestion, SecurityResult, BackendNeed } from './types';
import { analyzeCodeSecurity } from './utils/securityAnalyzer';
import { exportProjectAsZip } from './utils/exportZip';
import { X, CheckCircle2, Zap, Rocket, ShieldCheck, AlertTriangle, Info, Loader2, History } from 'lucide-react';
import { SupabaseConnectModal } from './components/SupabaseConnectModal';
import { FirecrawlConnectCard } from './components/FirecrawlConnectCard';
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
  const [showLanding, setShowLanding] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const streamingTextRef = useRef('');

  const { logs: consoleLogs, clearLogs: clearConsoleLogs } = useConsoleCapture();
  const { credits, isLoading: creditsLoading, refetch: refetchCredits } = useCredits();
  const { sendMessage: sendAIMessage, stopStreaming, isStreaming } = useAIChat();

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
    supabaseUrl: null,
    supabaseAnonKey: null,
    firecrawlEnabled: false,
    backendHints: [],
    showSupabaseModal: false,
  });

  const [showFirecrawlModal, setShowFirecrawlModal] = useState(false);

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
      setUserEmail(data.user?.email ?? undefined);
      if (!userId) {
        setShowLanding(true);
        setAuthChecked(true);
        return;
      }

      const { data: existing, error } = await supabase
        .from("projects")
        .select("id, name, schema, code, updated_at, supabase_url, supabase_anon_key, firecrawl_enabled")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!mounted) return;
      if (error) {
        setShowDashboard(true);
        setAuthChecked(true);
        return;
      }

      if (existing && existing.length > 0) {
        const proj = existing[0] as any;
        const files = deserializeFiles(proj.code);
        setState(prev => ({
          ...prev,
          projectId: proj.id,
          projectName: proj.name || 'New Project',
          files,
          activeFile: 'App.tsx',
          supabaseUrl: proj.supabase_url || null,
          supabaseAnonKey: proj.supabase_anon_key || null,
          firecrawlEnabled: proj.firecrawl_enabled || false,
        }));
        setShowDashboard(true);
        setAuthChecked(true);

        // Check for pending prompt from pre-login landing page
        const pendingPrompt = sessionStorage.getItem('blink_pending_prompt');
        if (pendingPrompt) {
          sessionStorage.removeItem('blink_pending_prompt');
          // Defer to next tick so state is settled
          setTimeout(() => {
            setShowDashboard(false);
            setShowLanding(false);
          }, 100);
          setTimeout(() => {
            const input = pendingPrompt.trim();
            if (input) {
              // Trigger the message send via a custom event workaround
              setState(prev => ({ ...prev, currentInput: input }));
            }
          }, 200);
        }
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
      setShowDashboard(true);
      setAuthChecked(true);
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
    stopStreaming();
    setState(prev => ({ ...prev, isGenerating: false, aiStatusText: null }));
  }, [stopStreaming]);

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

    streamingTextRef.current = '';

    // Build conversation messages for AI
    const chatMessages = [...state.history, userMessage]
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Current project code as context
    const projectContext = buildConcatenatedCode(state.files);

    const currentMode = state.chatMode || 'agent';

    await sendAIMessage(chatMessages, {
      onDelta: (chunk) => {
        streamingTextRef.current += chunk;
        const currentText = streamingTextRef.current;
        setState(prev => {
          const last = prev.history[prev.history.length - 1];
          if (last?.role === 'assistant' && last.id.startsWith('stream_')) {
            return {
              ...prev,
              history: prev.history.map((m, i) =>
                i === prev.history.length - 1 ? { ...m, content: currentText } : m
              ),
            };
          }
          return {
            ...prev,
            history: [
              ...prev.history,
              { id: `stream_${Date.now()}`, role: 'assistant', content: currentText, timestamp: Date.now() },
            ],
          };
        });
      },
      onDone: (fullText) => {
        if (currentMode === 'plan') {
          // Plan mode: no code extraction, just render full markdown
          setState(prev => ({
            ...prev,
            isGenerating: false,
            aiStatusText: null,
            history: prev.history.map((m) =>
              m.id.startsWith('stream_')
                ? { ...m, content: fullText }
                : m
            ),
          }));
          refetchCredits();
          return;
        }

        // Agent mode: extract code and apply
        const extractedCode = extractCodeFromResponse(fullText);
        const codeApplied = !!extractedCode;
        const codeLineCount = extractedCode ? extractedCode.split('\n').length : 0;

        if (extractedCode) {
          setState(prev => ({
            ...prev,
            files: { ...prev.files, 'App.tsx': extractedCode },
            activeFile: 'App.tsx',
          }));
          toast.success('✨ Code généré et injecté dans la preview !');
        }

        // Strip code blocks from the chat message, keep only explanation
        const explanationOnly = fullText.replace(/```[\w]*\s*\n[\s\S]*?```/g, '').trim();

        setState(prev => ({
          ...prev,
          isGenerating: false,
          aiStatusText: null,
          history: prev.history.map((m) =>
            m.id.startsWith('stream_')
              ? { ...m, content: explanationOnly || fullText, codeApplied, codeLineCount }
              : m
          ),
        }));

        // Refresh credits after generation
        refetchCredits();
        fetchSuggestions();
      },
      onError: (error, code) => {
        const errorMessage: Message = {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${error}`,
          timestamp: Date.now(),
        };
        setState(prev => ({
          ...prev,
          isGenerating: false,
          aiStatusText: null,
          history: [...prev.history, errorMessage],
        }));

        if (code === 401) {
          toast.info("Redirection vers la connexion…");
          setTimeout(() => navigate("/auth", { state: { from: "/app" } }), 1000);
          return;
        }

        if (code === 402) {
          setState(prev => ({ ...prev, showUpgradeModal: true }));
        }

        toast.error(error);
      },
      onStatusChange: (status) => {
        setState(prev => ({ ...prev, aiStatusText: status }));
      },
      onBackendHint: (needs) => {
        setState(prev => ({ ...prev, backendHints: needs as BackendNeed[] }));
      },
    }, projectContext, {
      supabaseUrl: state.supabaseUrl,
      supabaseAnonKey: state.supabaseAnonKey,
      firecrawlEnabled: state.firecrawlEnabled,
    }, currentMode);
  }, [state.currentInput, state.isGenerating, state.history, state.files, state.chatMode, state.supabaseUrl, state.supabaseAnonKey, state.firecrawlEnabled, showLanding, sendAIMessage, refetchCredits, fetchSuggestions]);

  const handlePublish = useCallback(async () => {
    if (!state.projectId) {
      toast.error('Aucun projet à déployer.');
      return;
    }

    setState(prev => ({ ...prev, isDeploying: true, deploymentProgress: 0 }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 12;
      if (progress < 85) {
        setState(prev => ({ ...prev, deploymentProgress: Math.min(progress, 85) }));
      }
    }, 300);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Non authentifié');

      const code = serializeFiles(state.files);
      const slug = `blink-${state.projectId.slice(0, 8)}`;

      // Upsert deployment with the current code
      const { data: deployment, error } = await supabase
        .from('deployments')
        .upsert(
          {
            user_id: userId,
            project_id: state.projectId,
            slug,
            schema_snapshot: { code, files: state.files } as any,
            url: `/published/${slug}`,
          } as any,
          { onConflict: 'project_id' }
        )
        .select('id, slug, url')
        .single();

      if (error) throw error;

      clearInterval(interval);
      const deployUrl = `/published/${(deployment as any).id}`;
      setState(prev => ({
        ...prev,
        isDeploying: false,
        deploymentProgress: 100,
        deployedUrl: deployUrl,
      }));
      toast.success('🚀 Projet déployé !', {
        description: 'Votre app est maintenant en ligne.',
        action: {
          label: 'Ouvrir',
          onClick: () => window.open(deployUrl, '_blank'),
        },
      });
    } catch (e: any) {
      clearInterval(interval);
      console.error('Publish error:', e);
      setState(prev => ({ ...prev, isDeploying: false, deploymentProgress: 0 }));
      toast.error('Erreur de déploiement', { description: e?.message });
    }
  }, [state.projectId, state.files]);

  const handleUpgrade = useCallback(() => navigate('/pricing'), [navigate]);

  const handleRunSecurity = useCallback(() => {
    setState(prev => ({ ...prev, showSecurityModal: true, isRunningSecurity: true, securityScore: 0, securityResults: [] }));
    // Run real static analysis on project files
    requestAnimationFrame(() => {
      const { results, score } = analyzeCodeSecurity(state.files);
      setState(prev => ({ ...prev, isRunningSecurity: false, securityScore: score, securityResults: results }));
    });
  }, [state.files]);

  const handleExportZip = useCallback(async () => {
    try {
      toast.info('📦 Génération du ZIP…');
      await exportProjectAsZip(state.files, state.projectName || 'blink-project');
      toast.success('✅ ZIP téléchargé !');
    } catch (e: any) {
      console.error('Export ZIP error:', e);
      toast.error('Erreur lors de l\'export ZIP');
    }
  }, [state.files, state.projectName]);

  const handleConnectSupabase = useCallback((url: string, anonKey: string) => {
    setState(prev => ({ ...prev, supabaseUrl: url, supabaseAnonKey: anonKey, backendHints: [] }));
    // Persist to project
    if (state.projectId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.id) {
          supabase.from('projects').update({ supabase_url: url, supabase_anon_key: anonKey } as any).eq('id', state.projectId!).eq('user_id', data.user.id);
        }
      });
    }
    toast.success('🔗 Supabase connecté ! L\'IA va maintenant générer du code full-stack.');
  }, [state.projectId]);

  const handleEnableFirecrawl = useCallback(() => {
    setState(prev => ({ ...prev, firecrawlEnabled: true, backendHints: [] }));
    if (state.projectId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.id) {
          supabase.from('projects').update({ firecrawl_enabled: true } as any).eq('id', state.projectId!).eq('user_id', data.user.id);
        }
      });
    }
    toast.success('🔥 Firecrawl activé ! Le scraping web est disponible.');
  }, [state.projectId]);

  const handleDismissBackendHints = useCallback(() => {
    setState(prev => ({ ...prev, backendHints: [] }));
  }, []);

  const handleNewChat = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: [{ id: Date.now().toString(), role: 'assistant', content: "Nouvelle conversation. Votre code est conservé. Comment puis-je vous aider ?", timestamp: Date.now() }],
      currentInput: '',
    }));
  }, []);

  const handleNewProject = useCallback(() => {
    if (confirm("Créer un nouveau projet ? Les changements actuels seront perdus.")) {
      setState(prev => ({
        ...prev,
        files: { ...DEFAULT_FILES },
        activeFile: 'App.tsx',
        projectName: 'New Project',
        history: [{ id: Date.now().toString(), role: 'assistant', content: "Projet réinitialisé. Comment puis-je vous aider ?", timestamp: Date.now() }],
        selectedWidgetId: undefined,
      }));
    }
  }, []);

  const handleRenameProject = useCallback(async (name: string) => {
    setState(prev => ({ ...prev, projectName: name }));
    try {
      if (state.projectId) {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (userId) {
          await supabase.from("projects").update({ name } as any).eq("id", state.projectId).eq("user_id", userId);
        }
      }
      toast.success(`Projet renommé : ${name}`);
    } catch {
      /* ignore */
    }
  }, [state.projectId]);

  const handleStartFromLanding = (prompt: string) => {
    // If not authenticated, store prompt and redirect to auth
    if (!userEmail) {
      if (prompt.trim()) {
        sessionStorage.setItem('blink_pending_prompt', prompt);
      }
      navigate("/auth", { state: { from: "/app" } });
      return;
    }
    setState(prev => ({ ...prev, currentInput: prompt }));
    handleSendMessage(prompt);
  };

  const handleBackToDashboard = useCallback(() => {
    setShowDashboard(true);
    setShowLanding(false);
  }, []);

  const handleOpenProject = useCallback(async (projectId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const { data: proj, error } = await supabase
      .from('projects')
      .select('id, name, code, schema, updated_at, supabase_url, supabase_anon_key, firecrawl_enabled')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !proj) {
      toast.error('Impossible de charger le projet.');
      return;
    }

    const files = deserializeFiles((proj as any).code);
    setState(prev => ({
      ...prev,
      projectId: proj.id,
      projectName: proj.name || 'New Project',
      files,
      activeFile: 'App.tsx',
      supabaseUrl: (proj as any).supabase_url || null,
      supabaseAnonKey: (proj as any).supabase_anon_key || null,
      firecrawlEnabled: (proj as any).firecrawl_enabled || false,
      history: [{ id: Date.now().toString(), role: 'assistant', content: `Projet "${proj.name}" chargé. Comment puis-je vous aider ?`, timestamp: Date.now() }],
    }));
    setShowDashboard(false);
    setShowLanding(false);
  }, []);

  const handleCreateNewFromDashboard = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const defaultSchema = { version: '3.0.0', app_name: 'New Project', components: [] };
    const { data: inserted } = await supabase
      .from('projects')
      .insert({ user_id: userId, name: 'New Project', schema: defaultSchema, code: serializeFiles(DEFAULT_FILES) } as any)
      .select('id')
      .single();

    if (inserted) {
      setState(prev => ({
        ...prev,
        projectId: (inserted as any).id,
        projectName: 'New Project',
        files: { ...DEFAULT_FILES },
        activeFile: 'App.tsx',
        history: [{ id: Date.now().toString(), role: 'assistant', content: "Nouveau projet créé. Décrivez votre application !", timestamp: Date.now() }],
      }));
    }
    setShowDashboard(false);
    setShowLanding(false);
  }, []);

  const handleToggleVisualEdit = useCallback(() => {
    setState(prev => ({ ...prev, isVisualEditMode: !prev.isVisualEditMode }));
  }, []);

  const handleScreenshotRequest = useCallback(() => {
    toast.info('📸 Capturing screenshot...');
  }, []);

  const handleShowHistory = useCallback(() => {
    setState(prev => ({ ...prev, showHistoryModal: true }));
  }, []);

  if (!authChecked) {
    return (
      <div className="dark">
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (showLanding) {
    return (
      <div className="dark">
        <LandingPage onStart={handleStartFromLanding} isAuthenticated={!!userEmail} />
      </div>
    );
  }

  if (showDashboard) {
    return (
      <div className="dark">
        <Dashboard onOpenProject={handleOpenProject} onCreateNewProject={handleCreateNewFromDashboard} userEmail={userEmail} />
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
          onToggleVisualEdit={handleToggleVisualEdit}
          onShowHistory={handleShowHistory}
          onNewChat={handleNewChat}
          onNewProject={handleNewProject}
          onRenameProject={handleRenameProject}
          onBackToLanding={handleBackToDashboard}
          onConnectSupabase={() => setState(prev => ({ ...prev, showSupabaseModal: true }))}
          onEnableFirecrawl={() => setShowFirecrawlModal(true)}
          onDismissBackendHints={handleDismissBackendHints}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            onPublish={handlePublish}
            onUpgrade={handleUpgrade}
            onRunSecurity={handleRunSecurity}
            onExportZip={handleExportZip}
            onToggleCodeView={() => setState(prev => ({ ...prev, isCodeView: !prev.isCodeView }))}
            isCodeView={state.isCodeView}
            isGenerating={state.isGenerating}
            projectName={state.projectName}
          />
          <CodePreview
            code={concatenatedCode}
            isGenerating={state.isGenerating}
            generationStatus={state.aiStatusText ?? undefined}
            supabaseUrl={state.supabaseUrl}
            supabaseAnonKey={state.supabaseAnonKey}
            firecrawlEnabled={state.firecrawlEnabled}
          />
          <ConsolePanel logs={consoleLogs} onClear={clearConsoleLogs} isOpen={consoleOpen} onToggle={() => setConsoleOpen(!consoleOpen)} />
        </div>

        {/* Upgrade Modal */}
        {state.showUpgradeModal && (
          <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-[#111] border border-[#1a1a1a] w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="relative p-12">
                <button onClick={() => setState(prev => ({ ...prev, showUpgradeModal: false }))} className="absolute top-8 right-8 text-neutral-500 hover:text-white transition-colors"><X size={24} /></button>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-8"><Zap size={40} className="text-white" /></div>
                  <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Upgrade to Blink Pro</h2>
                  <p className="text-neutral-400 font-medium text-lg max-w-md mb-12">Libérez toute la puissance de l'IA avec des builds illimités.</p>
                  <div className="grid grid-cols-2 gap-6 w-full mb-12">
                    <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-[#333] text-left">
                      <div className="flex items-center gap-2 text-blue-500 mb-2 font-black text-xs uppercase tracking-widest"><CheckCircle2 size={14} /> Performance</div>
                      <p className="text-white font-bold">Modèles Ultra-rapides</p>
                      <p className="text-neutral-500 text-sm mt-1">Accès prioritaire aux GPU H100.</p>
                    </div>
                    <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-[#333] text-left">
                      <div className="flex items-center gap-2 text-blue-500 mb-2 font-black text-xs uppercase tracking-widest"><CheckCircle2 size={14} /> Privacy</div>
                      <p className="text-white font-bold">Mode Privé</p>
                      <p className="text-neutral-500 text-sm mt-1">Vos données ne sont pas entraînées.</p>
                    </div>
                  </div>
                  <button onClick={() => setState(prev => ({ ...prev, credits: prev.credits + 50, showUpgradeModal: false }))} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2">
                    Passer Pro - $29/mois <Rocket size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Supabase Connect Modal */}
        <SupabaseConnectModal
          isOpen={state.showSupabaseModal ?? false}
          onClose={() => setState(prev => ({ ...prev, showSupabaseModal: false }))}
          onConnect={handleConnectSupabase}
        />

        {/* Firecrawl Connect Modal */}
        <FirecrawlConnectCard
          isOpen={showFirecrawlModal}
          onClose={() => setShowFirecrawlModal(false)}
          onEnable={handleEnableFirecrawl}
        />
      </div>
    </div>
  );
};

export default App;
