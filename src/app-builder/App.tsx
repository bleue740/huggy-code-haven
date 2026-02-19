import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { CodePreview } from "./components/CodePreview";
import { LandingPage } from "./components/LandingPage";
import { VersionHistory } from "./components/VersionHistory";
import { CollaborationPanel } from "./components/CollaborationPanel";
import { ConsolePanel } from "./components/ConsolePanel";
import { UpgradeModal } from "./components/UpgradeModal";
import { SecurityModal } from "./components/SecurityModal";
import { HistoryModal } from "./components/HistoryModal";
import { SupabaseConnectModal } from "./components/SupabaseConnectModal";
import { FirecrawlConnectCard } from "./components/FirecrawlConnectCard";
import { GitHubSyncModal } from "./components/GitHubSyncModal";
import { CollabIndicator } from "./components/CollabIndicator";

import { useConsoleCapture } from "./hooks/useConsoleCapture";
import { useCredits } from "./hooks/useCredits";
import { useAIChat, extractCodeFromResponse, extractMultiFileFromResponse } from "./hooks/useAIChat";
import { useOrchestrator } from "./hooks/useOrchestrator";
import { useYjsCollaboration } from "./hooks/useYjsCollaboration";
import { useProject, DEFAULT_FILES, serializeFiles } from "./hooks/useProject";
import { useFileHistory } from "./hooks/useFileHistory";
import { usePublish } from "./hooks/usePublish";
import { useDevServer } from "./hooks/useDevServer";
import { useBuildLogs } from "./hooks/useBuildLogs";

import { VirtualFS } from "./engine/VirtualFS";
import { ProjectContext } from "./engine/ProjectContext";
import { getPhaseLabel, isConversationActive } from "./engine/ConversationStateMachine";
import { analyzeCodeSecurity } from "./utils/securityAnalyzer";
import { exportProjectAsZip } from "./utils/exportZip";

import { AppState, Message, AISuggestion, SecurityResult, BackendNeed, GenerationStep, BuildLog, PlanItem } from "./types";
import type { ProjectTemplate } from "./data/templates";

import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function buildConcatenatedCode(files: Record<string, string>): string {
  const entries = Object.entries(files);
  const app = entries.find(([n]) => n === "App.tsx");
  const others = entries.filter(([n]) => n !== "App.tsx").sort(([a], [b]) => a.localeCompare(b));
  return [...others.map(([, c]) => c), app?.[1] ?? ""].join("\n\n");
}

const App: React.FC = () => {
  const navigate = useNavigate();
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const streamingTextRef = useRef("");
  const thinkingTextRef = useRef("");

  const { logs: consoleLogs, clearLogs: clearConsoleLogs } = useConsoleCapture();
  const { credits, isLoading: creditsLoading, refetch: refetchCredits } = useCredits();
  const { sendMessage: sendAIMessage, stopStreaming, isStreaming } = useAIChat();
  const { send: sendOrchestrator, stop: stopOrchestrator, convState, isActive: isOrchestratorActive } = useOrchestrator();

  // Engine instances
  const vfsRef = useRef<VirtualFS>(new VirtualFS(DEFAULT_FILES));
  const ctxRef = useRef<ProjectContext>(new ProjectContext());

  const [state, setState] = useState<AppState>({
    credits: 0,
    currentInput: "",
    isGenerating: false,
    aiStatusText: null,
    aiEvents: [],
    isCodeView: false,
    history: [{
      id: "1", role: "assistant",
      content: "Describe the application you want to build. I'll design, plan, and generate production-ready code for you.",
      timestamp: Date.now(),
    }],
    suggestions: [],
    files: { ...DEFAULT_FILES },
    activeFile: "App.tsx",
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
    generationSteps: [],
    // Pipeline UI state
    _generationPhase: undefined,
    _pipelineProgress: 0,
    _buildLogs: [],
    _planItems: [],
    _thinkingLines: [],
    _totalExpectedFiles: 0,
    _filesGeneratedCount: 0,
  });

  // Extracted hooks
  const project = useProject(state, setState);
  const fileHistory = useFileHistory(DEFAULT_FILES);
  const { handlePublish, handleSharePreview, isSharingPreview } = usePublish(state, setState);
  const {
    devUrl, isStarting: isDevServerStarting, isConnected: isDevServerConnected,
    startDevServer, isAvailable: isDevServerAvailable,
  } = useDevServer(state.projectId, state.files);

  // Build logs streamed from Railway server via SSE
  const {
    logs: buildLogs,
    isConnected: buildLogsConnected,
    clearLogs: clearBuildLogs,
    isAvailable: buildLogsAvailable,
  } = useBuildLogs(state.projectId);

  // Modal visibility state
  const [showFirecrawlModal, setShowFirecrawlModal] = useState(false);
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCollabPanel, setShowCollabPanel] = useState(false);

  // Yjs collaboration
  const {
    isConnected: collabConnected,
    connectedUsers: collabUsers,
    collabExtension,
    syncInitialContent,
    observeFile,
  } = useYjsCollaboration(state.projectId, state.activeFile);

  // Sync file content into Yjs when files change
  useEffect(() => {
    if (!state.projectId) return;
    Object.entries(state.files).forEach(([name, content]) => {
      syncInitialContent(name, content);
    });
  }, [state.projectId, syncInitialContent]);

  // Observe Yjs changes and sync back to state
  useEffect(() => {
    if (!state.projectId || !state.activeFile) return;
    const unsub = observeFile(state.activeFile, (content) => {
      setState((prev) => {
        if (prev.files[prev.activeFile] === content) return prev;
        return { ...prev, files: { ...prev.files, [prev.activeFile]: content } };
      });
    });
    return unsub;
  }, [state.projectId, state.activeFile, observeFile]);

  // Sync credits
  useEffect(() => {
    if (!creditsLoading) setState((prev) => ({ ...prev, credits }));
  }, [credits, creditsLoading]);

  const concatenatedCode = useMemo(() => buildConcatenatedCode(state.files), [state.files]);
  const filesRef = useRef(state.files);
  useEffect(() => {
    filesRef.current = state.files;
    vfsRef.current = new VirtualFS(state.files);
  }, [state.files]);

  // Auto-save
  useEffect(() => {
    project.autoSaveFiles(state.files, state.projectId, state.isDeploying ?? false);
  }, [state.files, state.projectId, state.isDeploying, project.autoSaveFiles]);

  // Persist message helper
  const persistMessage = useCallback(async (projectId: string | undefined, role: string, content: string, codeApplied: boolean, codeLineCount: number, chatMode: string) => {
    if (!projectId) return;
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user?.id) return;
      await supabase.from("chat_messages").insert({
        project_id: projectId, user_id: data.user.id, role,
        content: content.slice(0, 50000),
        code_applied: codeApplied, code_line_count: codeLineCount, chat_mode: chatMode,
      } as any);
    } catch { /* ignore */ }
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (code?: string) => {
    try {
      const codeToSend = code || buildConcatenatedCode(state.files);
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ code: codeToSend.slice(0, 4000) }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.suggestions && Array.isArray(data.suggestions)) {
          const mapped = data.suggestions.slice(0, 4).map((s: any, i: number) => ({
            id: `sug_${i}`, label: s.title || s.label || "Suggestion",
            description: s.prompt || s.description || "",
            prompt: s.prompt || s.description || s.title || "",
            icon: (s.icon || "layout").toLowerCase() as any,
          }));
          setState((prev) => ({ ...prev, suggestions: mapped }));
          return;
        }
      }
    } catch { /* fallback */ }
    setState((prev) => ({
      ...prev,
      suggestions: [
        { id: "sug_1", label: "Ajouter une page pricing", description: "Crée une section Pricing avec 3 plans et CTA.", prompt: "Ajoute une section pricing moderne avec 3 plans et un CTA.", icon: "layout" },
        { id: "sug_2", label: "Dashboard analytics", description: "Ajoute une page dashboard avec tableaux + graphiques.", prompt: "Ajoute un dashboard analytics avec 2 charts et une table.", icon: "chart" },
        { id: "sug_3", label: "Formulaire onboarding", description: "Collecte le nom, entreprise, objectifs.", prompt: "Ajoute un formulaire onboarding (nom, entreprise, objectifs).", icon: "form" },
      ],
    }));
  }, [state.files]);

  // Runtime error auto-fix
  useEffect(() => {
    const MAX_RETRIES = 3;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "runtime_error" && !state.isGenerating) {
        const errorMsg = event.data.error;
        if (retryCount >= MAX_RETRIES) {
          setState((prev) => ({
            ...prev,
            history: [...prev.history, {
              id: `err_max_${Date.now()}`, role: "assistant",
              content: `⚠️ L'auto-correction a échoué après ${MAX_RETRIES} tentatives. Erreur : \`${errorMsg}\`\n\nEssayez de reformuler votre demande ou de simplifier le code.`,
              timestamp: Date.now(),
            }],
          }));
          setRetryCount(0);
          return;
        }
        setRetryCount((prev) => prev + 1);
        const fixPrompt = `Le code que tu as généré produit cette erreur runtime:\n\`${errorMsg}\`\n\nCorrige le code pour éliminer cette erreur. Garde la même fonctionnalité.`;
        handleSendMessage(fixPrompt);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [state.isGenerating, retryCount]);

  // Plan approval
  const handleApprovePlan = useCallback((planContent: string) => {
    setState((prev) => ({ ...prev, chatMode: "agent" }));
    const implementPrompt = `Implémente exactement ce plan :\n\n${planContent}`;
    setTimeout(() => handleSendMessage(implementPrompt), 100);
  }, []);

  const handleStopGenerating = useCallback(() => {
    stopStreaming();
    stopOrchestrator();
    setState((prev) => ({
      ...prev, isGenerating: false, aiStatusText: null,
      _generationPhase: undefined, _pipelineProgress: 0, _planItems: [], _buildLogs: [], _thinkingLines: [],
    }));
  }, [stopStreaming, stopOrchestrator]);

  const handleSendMessage = useCallback(async (customPrompt?: string) => {
    const input = (customPrompt ?? state.currentInput).trim();
    if (!input || state.isGenerating) return;
    if (project.showLanding) project.setShowLanding(false);

    const now = Date.now();
    const userMessage: Message = { id: now.toString(), role: "user", content: input, timestamp: now };

    setState((prev) => ({
      ...prev,
      isGenerating: true, aiStatusText: null,
      history: [
        ...prev.history,
        userMessage,
        // Typing indicator — removed on first SSE event
        { id: `typing_${now}`, role: "assistant" as const, content: "", timestamp: now, isTyping: true },
      ],
      currentInput: customPrompt ? prev.currentInput : "",
      generationSteps: [],
      _generationPhase: undefined, _pipelineProgress: 0, _thinkingLines: [], _planItems: [], _buildLogs: [],
    }));

    thinkingTextRef.current = "";

    const currentMode = state.chatMode || "agent";
    persistMessage(state.projectId, "user", input, false, 0, currentMode);

    const chatMessages = [...state.history, userMessage]
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-20)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    if (currentMode === "plan") {
      streamingTextRef.current = "";
      const projectContext = vfsRef.current.buildPreviewCode();
      await sendAIMessage(chatMessages, {
        onDelta: (chunk) => {
          streamingTextRef.current += chunk;
          const currentText = streamingTextRef.current;
          setState((prev) => {
            const last = prev.history[prev.history.length - 1];
            if (last?.role === "assistant" && last.id.startsWith("stream_")) {
              return { ...prev, history: prev.history.map((m, i) => i === prev.history.length - 1 ? { ...m, content: currentText } : m) };
            }
            return { ...prev, history: [...prev.history, { id: `stream_${Date.now()}`, role: "assistant", content: currentText, timestamp: Date.now() }] };
          });
        },
        onDone: (fullText) => {
          setState((prev) => ({
            ...prev, isGenerating: false, aiStatusText: null, generationSteps: [],
            history: prev.history.map((m) => m.id.startsWith("stream_") ? { ...m, content: fullText } : m),
          }));
          persistMessage(state.projectId, "assistant", fullText, false, 0, "plan");
          refetchCredits();
        },
        onError: (error, code) => {
          setState((prev) => ({
            ...prev, isGenerating: false, aiStatusText: null,
            history: [...prev.history, { id: `err_${Date.now()}`, role: "assistant", content: `⚠️ ${error}`, timestamp: Date.now() }],
          }));
          if (code === 402) setState((prev) => ({ ...prev, showUpgradeModal: true }));
          toast.error(error);
        },
        onStatusChange: (status) => setState((prev) => ({ ...prev, aiStatusText: status })),
      }, projectContext, {
        supabaseUrl: state.supabaseUrl, supabaseAnonKey: state.supabaseAnonKey, firecrawlEnabled: state.firecrawlEnabled,
      }, "plan");
      return;
    }

    // AGENT MODE
    await sendOrchestrator(chatMessages, vfsRef.current, ctxRef.current, {
      onPhase: (phase, message) => {
        const phaseMap: Record<string, { uiPhase: AppState['_generationPhase']; progress: number }> = {
          planning:   { uiPhase: "thinking", progress: 10 },
          generating: { uiPhase: "building", progress: 30 },
          validating: { uiPhase: "building", progress: 85 },
          fixing:     { uiPhase: "fixing",   progress: 88 },
          complete:   { uiPhase: "preview_ready", progress: 100 },
          error:      { uiPhase: "error",    progress: 0 },
        };
        const mapped = phaseMap[phase] || { uiPhase: undefined, progress: 0 };
        setState((prev) => ({
          ...prev,
          // Remove typing indicator on first real SSE event
          history: prev.history.filter((m) => !m.id.startsWith("typing_")),
          _generationPhase: mapped.uiPhase,
          _pipelineProgress: mapped.progress,
          aiStatusText: message || null,
        }));
      },

      onThinkingDelta: (delta) => {
        thinkingTextRef.current += delta;
        const text = thinkingTextRef.current;
        setState((prev) => ({ ...prev, _thinkingLines: [text] }));
      },

      onFileRead: (path) => {
        setState((prev) => ({
          ...prev,
          _generationPhase: "reading",
          _buildLogs: [
            ...(prev._buildLogs || []).filter(l => l.type === "read"),
            { id: `read_${path}_${Date.now()}`, text: `Reading ${path}…`, done: true, type: "read" as const },
          ],
        }));
      },

      onPlanReady: (intent, steps) => {
        setState((prev) => ({
          ...prev,
          _generationPhase: "planning",
          _pipelineProgress: 20,
          _thinkingLines: prev._thinkingLines, // keep thinking text visible in Reasoning
          _planItems: steps.map((s) => ({
            label: s.path ? `${s.path}: ${s.description}` : `${s.target}: ${s.description}`,
            done: false,
            path: s.path || s.target,
            priority: (s.priority as 'critical' | 'normal' | 'optional') || 'normal',
          })),
          _totalExpectedFiles: steps.filter((s) => s.action !== "delete").length,
          _filesGeneratedCount: 0,
        }));

        setTimeout(() => {
          setState((prev) => {
            // Don't override reading phase — it transitions to building on first file_generated
            if (prev._generationPhase === "reading") return prev;
            const nonDeleteSteps = steps.filter(s => s.action !== "delete");
            return {
              ...prev,
              _generationPhase: "building",
              _pipelineProgress: 30,
              _buildLogs: [
                // Keep read logs so the "Files read" collapsed section stays visible
                ...(prev._buildLogs || []).filter(l => l.type === "read"),
                ...nonDeleteSteps.map((s, i) => ({
                  id: `build_${i}`,
                  // Use real path if available, fallback to target
                  text: `Writing ${s.path || s.target}…`,
                  done: false,
                  type: "build" as const,
                })),
              ],
            };
          });
        }, 1200);
      },

      onFileGenerated: (path, linesCount) => {
        setState((prev) => {
          const logs: BuildLog[] = (prev._buildLogs || []).map((l) => {
            if (!l.done && l.text.toLowerCase().includes(path.toLowerCase().replace(".tsx", "").replace(".ts", ""))) {
              return { ...l, done: true, linesCount };
            }
            return l;
          });
          const anyMarked = logs.some((l, i) => l.done && !(prev._buildLogs || [])[i]?.done);
          if (!anyMarked) {
            const firstUndone = logs.findIndex((l) => !l.done);
            if (firstUndone >= 0) logs[firstUndone] = { ...logs[firstUndone], done: true, linesCount };
          }
          const newCount = (prev._filesGeneratedCount || 0) + 1;
          const total = prev._totalExpectedFiles || 1;
          const fileProgress = 30 + Math.round((newCount / total) * 50);

          // Transition from reading → building when first file arrives
          const newPhase: AppState['_generationPhase'] =
            prev._generationPhase === 'reading' ? 'building' : prev._generationPhase;

          return {
            ...prev,
            _buildLogs: logs,
            _filesGeneratedCount: newCount,
            _pipelineProgress: Math.min(fileProgress, 80),
            _generationPhase: newPhase,
          };
        });
      },

      onFilesGenerated: (files, deletedFiles) => {
        setRetryCount(0);
        const totalLines = files.reduce((sum, f) => sum + f.content.split("\n").length, 0);

        setState((prev) => {
          const newFiles = { ...prev.files };
          for (const f of files) newFiles[f.path] = f.content;
          for (const d of deletedFiles) { if (d !== "App.tsx") delete newFiles[d]; }

          const doneLogs: BuildLog[] = (prev._buildLogs || []).map((l) => ({ ...l, done: true }));

          return {
            ...prev,
            files: newFiles,
            activeFile: files.find((f) => f.path === "App.tsx") ? "App.tsx" : files[0]?.path || prev.activeFile,
            isGenerating: false,
            aiStatusText: null,
            generationSteps: [],
            _generationPhase: "preview_ready",
            _pipelineProgress: 100,
            _buildLogs: doneLogs,
            // Remove any leftover typing indicators
            history: [...prev.history.filter((m) => !m.id.startsWith("typing_")), {
              id: `orch_${Date.now()}`, role: "assistant" as const,
              content: `Your application is ready.\n\n${files.length} file(s) generated and validated: ${files.map((f) => "`" + f.path + "`").join(", ")}`,
              timestamp: Date.now(), codeApplied: true, codeLineCount: totalLines,
            }],
          };
        });

        toast.success(`Your app is ready — ${files.length} file(s) applied.`);

        // Save snapshot and link to message
        (async () => {
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user?.id && state.projectId) {
              const newFiles: Record<string, string> = { ...state.files };
              for (const f of files) newFiles[f.path] = f.content;
              for (const d of deletedFiles) { if (d !== "App.tsx") delete newFiles[d]; }

              const { data: snapshot } = await supabase.from("project_snapshots").insert({
                project_id: state.projectId, user_id: userData.user.id,
                label: `Agent: ${files.map((f) => f.path).join(", ")}`,
                files_snapshot: newFiles,
              } as any).select('id').single();

              if (snapshot?.id) {
                setState((prev) => {
                  const lastMsg = prev.history[prev.history.length - 1];
                  if (lastMsg?.codeApplied && !lastMsg.snapshotId) {
                    return {
                      ...prev,
                      history: prev.history.map((m, i) =>
                        i === prev.history.length - 1 ? { ...m, snapshotId: snapshot.id } : m
                      ),
                    };
                  }
                  return prev;
                });

                persistMessage(state.projectId, "assistant",
                  `Agent pipeline: ${files.map((f) => f.path).join(", ")}`,
                  true, totalLines, "agent"
                );
              }
            }
          } catch { /* ignore */ }
        })();

        fileHistory.pushSnapshot(state.files);
        refetchCredits();
        fetchSuggestions();

        setTimeout(() => setState((prev) => ({
          ...prev,
          generationSteps: [],
          _generationPhase: undefined,
          _pipelineProgress: 0,
          _planItems: [],
          _buildLogs: [],
          _thinkingLines: [],
        })), 4000);
      },

      onConversationalDelta: (delta) => {
        // Token-by-token streaming: build message progressively
        streamingTextRef.current = delta === "" ? "" : streamingTextRef.current + delta;
        const currentText = streamingTextRef.current;
        setState((prev) => {
          const last = prev.history[prev.history.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("conv_stream_")) {
            return { ...prev, history: prev.history.map((m, i) => i === prev.history.length - 1 ? { ...m, content: currentText } : m) };
          }
          if (delta === "") {
            // conv_start signal — remove typing indicator, add streaming placeholder
            const withoutTyping = prev.history.filter((m) => !m.id.startsWith("typing_"));
            return { ...prev, history: [...withoutTyping, { id: `conv_stream_${Date.now()}`, role: "assistant" as const, content: "", timestamp: Date.now() }] };
          }
          return { ...prev, history: prev.history.map((m, i) => i === prev.history.length - 1 ? { ...m, content: currentText } : m) };
        });
      },

      onConversationalReply: (reply) => {
        setRetryCount(0);
        streamingTextRef.current = "";
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          aiStatusText: null,
          generationSteps: [],
          _generationPhase: undefined,
          _pipelineProgress: 0,
          _planItems: [],
          _buildLogs: [],
          _thinkingLines: [],
          // Replace streaming placeholder with final reply
          history: prev.history.map((m) =>
            m.id.startsWith("conv_stream_") ? { ...m, id: `conv_${Date.now()}`, content: reply } : m
          ),
        }));
        persistMessage(state.projectId, "assistant", reply, false, 0, "agent");
        refetchCredits();
      },

      onError: (error, code) => {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          aiStatusText: null,
          _generationPhase: "error",
          history: [...prev.history, { id: `err_${Date.now()}`, role: "assistant", content: `⚠️ ${error}`, timestamp: Date.now() }],
        }));
        if (code === 401) {
          toast.info("Redirection vers la connexion…");
          setTimeout(() => navigate("/auth", { state: { from: "/app" } }), 1000);
        }
        if (code === 402) setState((prev) => ({ ...prev, showUpgradeModal: true }));
        toast.error(error);
      },
    });
  }, [state.currentInput, state.isGenerating, state.history, state.files, state.chatMode, state.supabaseUrl, state.supabaseAnonKey, state.firecrawlEnabled, project.showLanding, sendAIMessage, sendOrchestrator, refetchCredits, fetchSuggestions]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    const snapshot = fileHistory.undo();
    if (snapshot) setState((prev) => ({ ...prev, files: snapshot, activeFile: "App.tsx" }));
  }, [fileHistory]);

  const handleRedo = useCallback(() => {
    const snapshot = fileHistory.redo();
    if (snapshot) setState((prev) => ({ ...prev, files: snapshot, activeFile: "App.tsx" }));
  }, [fileHistory]);

  // Actions
  const handleUpgrade = useCallback(() => navigate("/pricing"), [navigate]);

  const handleRunSecurity = useCallback(() => {
    setState((prev) => ({ ...prev, showSecurityModal: true, isRunningSecurity: true, securityScore: 0, securityResults: [] }));
    requestAnimationFrame(() => {
      const { results, score } = analyzeCodeSecurity(state.files);
      setState((prev) => ({ ...prev, isRunningSecurity: false, securityScore: score, securityResults: results }));
    });
  }, [state.files]);

  const handleExportZip = useCallback(async () => {
    try {
      toast.info("📦 Génération du ZIP…");
      await exportProjectAsZip(state.files, state.projectName || "blink-project");
      toast.success("✅ ZIP téléchargé !");
    } catch (e: any) {
      console.error("Export ZIP error:", e);
      toast.error("Erreur lors de l'export ZIP");
    }
  }, [state.files, state.projectName]);

  const handleConnectSupabase = useCallback((url: string, anonKey: string) => {
    setState((prev) => ({ ...prev, supabaseUrl: url, supabaseAnonKey: anonKey, backendHints: [] }));
    if (state.projectId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.id) {
          supabase.from("projects").update({ supabase_url: url, supabase_anon_key: anonKey } as any).eq("id", state.projectId!).eq("user_id", data.user.id);
        }
      });
    }
    toast.success("🔗 Supabase connecté ! L'IA va maintenant générer du code full-stack.");
  }, [state.projectId]);

  const handleEnableFirecrawl = useCallback(() => {
    setState((prev) => ({ ...prev, firecrawlEnabled: true, backendHints: [] }));
    if (state.projectId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.id) {
          supabase.from("projects").update({ firecrawl_enabled: true } as any).eq("id", state.projectId!).eq("user_id", data.user.id);
        }
      });
    }
    toast.success("🔥 Firecrawl activé ! Le scraping web est disponible.");
  }, [state.projectId]);

  const handleNewChat = useCallback(() => {
    setState((prev) => ({
      ...prev,
      history: [{ id: Date.now().toString(), role: "assistant", content: "Nouvelle conversation. Votre code est conservé. Comment puis-je vous aider ?", timestamp: Date.now() }],
      currentInput: "",
    }));
  }, []);

  const handleRestoreSnapshot = useCallback((files: Record<string, string>) => {
    setState((prev) => ({ ...prev, files, activeFile: "App.tsx" }));
    fileHistory.pushSnapshot(files);
  }, [fileHistory]);

  const handleToggleVisualEdit = useCallback(() => {
    setState((prev) => ({ ...prev, isVisualEditMode: !prev.isVisualEditMode }));
  }, []);

  const handleScreenshotRequest = useCallback(() => {
    toast.info("📸 Capturing screenshot...");
  }, []);

  // Loading state
  if (!project.authChecked) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Landing page
  if (project.showLanding) {
    return (
      <LandingPage
        onStart={(prompt) => project.handleStartFromLanding(prompt, handleSendMessage)}
        isAuthenticated={!!project.userEmail}
      />
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#050505] overflow-hidden select-none relative transition-colors">
      <Sidebar
        state={state}
        setState={setState}
        onSend={handleSendMessage}
        onStop={handleStopGenerating}
        onScreenshotRequest={handleScreenshotRequest}
        onToggleVisualEdit={handleToggleVisualEdit}
        onShowHistory={() => setState((prev) => ({ ...prev, showHistoryModal: true }))}
        onNewChat={handleNewChat}
        onNewProject={project.handleNewProject}
        onRenameProject={project.handleRenameProject}
        onBackToLanding={() => project.setShowLanding(true)}
        onConnectSupabase={() => setState((prev) => ({ ...prev, showSupabaseModal: true }))}
        onEnableFirecrawl={() => setShowFirecrawlModal(true)}
        onDismissBackendHints={() => setState((prev) => ({ ...prev, backendHints: [] }))}
        onApprovePlan={handleApprovePlan}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={fileHistory.canUndo}
        canRedo={fileHistory.canRedo}
        collabExtension={collabExtension}
        onRestoreSnapshot={handleRestoreSnapshot}
        buildLogs={buildLogsAvailable ? buildLogs : []}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center">
          <TopNav
            onPublish={handlePublish}
            onUpgrade={handleUpgrade}
            onRunSecurity={handleRunSecurity}
            onExportZip={handleExportZip}
            onToggleCodeView={() => setState((prev) => ({ ...prev, isCodeView: !prev.isCodeView }))}
            onShowVersionHistory={() => setShowVersionHistory(true)}
            onShowCollaboration={() => setShowCollabPanel(true)}
            onGitHubSync={() => setShowGitHubModal(true)}
            onSharePreview={handleSharePreview}
            onRenameProject={project.handleRenameProject}
            isCodeView={state.isCodeView}
            isGenerating={state.isGenerating}
            isDeploying={state.isDeploying}
            deploymentProgress={state.deploymentProgress}
            deployStatusText={state.deployStatusText}
            isSharingPreview={isSharingPreview}
            projectName={state.projectName}
            deployedUrl={state.deployedUrl}
          />
          <div className="pr-3">
            <CollabIndicator isConnected={collabConnected} connectedUsers={collabUsers} />
          </div>
        </div>
        <CodePreview
          code={concatenatedCode}
          files={state.files}
          isGenerating={state.isGenerating}
          isBuilding={
            state.isGenerating &&
            (state._generationPhase === "building" || state._generationPhase === "fixing") &&
            !state.history.some((m) => m.id.startsWith("conv_stream_"))
          }
          pipelineProgress={state._pipelineProgress || 0}
          generationStatus={state.aiStatusText ?? undefined}
          supabaseUrl={state.supabaseUrl}
          supabaseAnonKey={state.supabaseAnonKey}
          firecrawlEnabled={state.firecrawlEnabled}
          devServerUrl={devUrl}
          isDevServerStarting={isDevServerStarting}
          onStartDevServer={isDevServerAvailable ? () => startDevServer(state.projectName) : undefined}
        />
        <ConsolePanel
          logs={[
            ...consoleLogs,
            ...(buildLogsAvailable ? buildLogs.map(l => ({
              id: l.id,
              type: (l.level === "error" ? "error" : l.level === "warn" ? "warn" : l.level === "info" ? "info" : "log") as "log" | "warn" | "error" | "info",
              message: l.text,
              timestamp: l.ts,
            })) : []),
          ].sort((a, b) => a.timestamp - b.timestamp)}
          onClear={() => { clearConsoleLogs(); clearBuildLogs(); }}
          isOpen={consoleOpen}
          onToggle={() => setConsoleOpen(!consoleOpen)}
        />
      </div>

      {/* Modals */}
      <UpgradeModal
        isOpen={state.showUpgradeModal ?? false}
        onClose={() => setState((prev) => ({ ...prev, showUpgradeModal: false }))}
        onUpgrade={handleUpgrade}
      />
      <SecurityModal
        isOpen={state.showSecurityModal ?? false}
        onClose={() => setState((prev) => ({ ...prev, showSecurityModal: false }))}
        isRunning={state.isRunningSecurity ?? false}
        score={state.securityScore ?? 0}
        results={state.securityResults ?? []}
      />
      <HistoryModal
        isOpen={state.showHistoryModal ?? false}
        onClose={() => setState((prev) => ({ ...prev, showHistoryModal: false }))}
        messages={state.history}
      />
      <SupabaseConnectModal
        isOpen={state.showSupabaseModal ?? false}
        onClose={() => setState((prev) => ({ ...prev, showSupabaseModal: false }))}
        onConnect={handleConnectSupabase}
      />
      <FirecrawlConnectCard
        isOpen={showFirecrawlModal}
        onClose={() => setShowFirecrawlModal(false)}
        onEnable={handleEnableFirecrawl}
      />
      <VersionHistory
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        projectId={state.projectId}
        onRestore={handleRestoreSnapshot}
      />
      <CollaborationPanel
        isOpen={showCollabPanel}
        onClose={() => setShowCollabPanel(false)}
        projectId={state.projectId}
      />
      <GitHubSyncModal
        isOpen={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
        files={state.files}
        onFilesImported={(imported) => {
          setState((prev) => ({ ...prev, files: { ...prev.files, ...imported }, activeFile: "App.tsx" }));
          toast.success("Fichiers importés depuis GitHub !");
        }}
        projectName={state.projectName}
      />
    </div>
  );
};

export default App;
