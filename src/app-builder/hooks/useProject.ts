import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AppState, Message } from "../types";
import type { ProjectTemplate } from "../data/templates";

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

export const DEFAULT_FILES: Record<string, string> = { "App.tsx": DEFAULT_APP_CODE };

export function serializeFiles(files: Record<string, string>): string {
  if (Object.keys(files).length === 1 && files["App.tsx"]) return files["App.tsx"];
  return JSON.stringify({ __multifile: true, files });
}

export function deserializeFiles(raw: string | null | undefined): Record<string, string> {
  if (!raw) return { ...DEFAULT_FILES };
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.__multifile && typeof parsed.files === "object") return parsed.files;
    return { "App.tsx": raw };
  } catch {
    return { "App.tsx": raw };
  }
}

const initialMessage = (text: string): Message => ({
  id: Date.now().toString(),
  role: "assistant",
  content: text,
  timestamp: Date.now(),
});

interface UseProjectReturn {
  authChecked: boolean;
  showLanding: boolean;
  setShowLanding: (v: boolean) => void;
  userEmail: string | undefined;
  handleNewProject: () => Promise<void>;
  handleOpenProject: (projectId: string) => Promise<void>;
  handleRenameProject: (name: string) => Promise<void>;
  handleCreateNewFromDashboard: () => Promise<void>;
  handleStartWithPrompt: (prompt: string, sendMessage: (prompt: string) => void) => Promise<void>;
  handleStartFromLanding: (prompt: string, sendMessage: (prompt: string) => void) => void;
  handleStartFromTemplate: (template: ProjectTemplate) => Promise<void>;
  autoSaveFiles: (files: Record<string, string>, projectId: string | undefined, isDeploying: boolean) => void;
  loadInitialProject: (setState: React.Dispatch<React.SetStateAction<AppState>>) => void;
}

export function useProject(
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>,
): UseProjectReturn {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const saveTimerRef = useRef<number | null>(null);

  // Auth check & initial project load
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

      const pendingPrompt = sessionStorage.getItem("blink_pending_prompt");
      // Priority: explicit project opened from Dashboard via sessionStorage
      const targetProjectId = sessionStorage.getItem("blink_open_project_id");
      if (targetProjectId) sessionStorage.removeItem("blink_open_project_id");

      const { data: existing } = await supabase
        .from("projects")
        .select("id, name, schema, code, updated_at, supabase_url, supabase_anon_key, firecrawl_enabled")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (!mounted) return;

      if (pendingPrompt) {
        sessionStorage.removeItem("blink_pending_prompt");
        setShowLanding(false);
        setAuthChecked(true);
        return;
      }

      // Find target project (from Dashboard) or fall back to most recently modified
      const allProjects = (existing || []) as any[];
      const proj = targetProjectId
        ? (allProjects.find((p: any) => p.id === targetProjectId) ?? allProjects[0])
        : allProjects[0];

      if (proj) {
        const files = deserializeFiles(proj.code);

        let loadedHistory: Message[] = [initialMessage("Describe the application you want to build. I'll design, plan, and generate production-ready code for you.")];
        try {
          const { data: msgs } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("project_id", proj.id)
            .order("created_at", { ascending: true })
            .limit(50);
          if (msgs && msgs.length > 0) {
            loadedHistory = (msgs as any[]).map((m: any) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: new Date(m.created_at).getTime(),
              codeApplied: m.code_applied,
              codeLineCount: m.code_line_count,
            }));
          }
        } catch { /* ignore */ }

        setState((prev) => ({
          ...prev,
          projectId: proj.id,
          projectName: proj.name || "New Project",
          files,
          activeFile: "App.tsx",
          history: loadedHistory,
          supabaseUrl: proj.supabase_url || null,
          supabaseAnonKey: proj.supabase_anon_key || null,
          firecrawlEnabled: proj.firecrawl_enabled || false,
        }));
        setShowLanding(false);
      } else {
        setShowLanding(true);
      }

      setAuthChecked(true);
    })();
    return () => { mounted = false; };
  }, [setState]);

  // Auto-save
  const autoSaveFiles = useCallback((files: Record<string, string>, projectId: string | undefined, isDeploying: boolean) => {
    if (!projectId || isDeploying) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId) return;
        await supabase
          .from("projects")
          .update({ code: serializeFiles(files) } as any)
          .eq("id", projectId)
          .eq("user_id", userId);
      } catch { /* ignore */ }
    }, 900);
  }, []);

  const handleNewProject = useCallback(async () => {
    if (!confirm("Créer un nouveau projet ? Les changements actuels seront perdus.")) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const defaultSchema = { version: "3.0.0", app_name: "New Project", components: [] };
    const { data: inserted } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: "New Project", schema: defaultSchema, code: serializeFiles(DEFAULT_FILES) } as any)
      .select("id")
      .single();

    if (inserted) {
      setState((prev) => ({
        ...prev,
        projectId: (inserted as any).id,
        projectName: "New Project",
        files: { ...DEFAULT_FILES },
        activeFile: "App.tsx",
        history: [initialMessage("Nouveau projet créé. Comment puis-je vous aider ?")],
        selectedWidgetId: undefined,
      }));
      toast.success("Nouveau projet créé !");
    }
  }, [setState]);

  const handleOpenProject = useCallback(async (projectId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const { data: proj, error } = await supabase
      .from("projects")
      .select("id, name, code, schema, updated_at, supabase_url, supabase_anon_key, firecrawl_enabled")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (error || !proj) {
      toast.error("Impossible de charger le projet.");
      return;
    }

    const files = deserializeFiles((proj as any).code);
    setState((prev) => ({
      ...prev,
      projectId: proj.id,
      projectName: proj.name || "New Project",
      files,
      activeFile: "App.tsx",
      supabaseUrl: (proj as any).supabase_url || null,
      supabaseAnonKey: (proj as any).supabase_anon_key || null,
      firecrawlEnabled: (proj as any).firecrawl_enabled || false,
      history: [initialMessage(`Projet "${proj.name}" chargé. Comment puis-je vous aider ?`)],
    }));
    setShowLanding(false);
  }, [setState]);

  const handleRenameProject = useCallback(async (name: string) => {
    setState((prev) => ({ ...prev, projectName: name }));
    try {
      if (state.projectId) {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (userId) {
          await supabase.from("projects").update({ name } as any).eq("id", state.projectId).eq("user_id", userId);
        }
      }
      toast.success(`Projet renommé : ${name}`);
    } catch { /* ignore */ }
  }, [state.projectId, setState]);

  const handleCreateNewFromDashboard = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const defaultSchema = { version: "3.0.0", app_name: "New Project", components: [] };
    const { data: inserted } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: "New Project", schema: defaultSchema, code: serializeFiles(DEFAULT_FILES) } as any)
      .select("id")
      .single();

    if (inserted) {
      setState((prev) => ({
        ...prev,
        projectId: (inserted as any).id,
        projectName: "New Project",
        files: { ...DEFAULT_FILES },
        activeFile: "App.tsx",
        history: [initialMessage("Nouveau projet créé. Décrivez votre application !")],
      }));
    }
    setShowLanding(false);
  }, [setState]);

  const handleStartWithPrompt = useCallback(async (prompt: string, sendMessage: (prompt: string) => void) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const defaultSchema = { version: "3.0.0", app_name: "New Project", components: [] };
    const { data: inserted } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: "New Project", schema: defaultSchema, code: serializeFiles(DEFAULT_FILES) } as any)
      .select("id")
      .single();

    if (!inserted) return;

    setState((prev) => ({
      ...prev,
      projectId: (inserted as any).id,
      projectName: "New Project",
      files: { ...DEFAULT_FILES },
      activeFile: "App.tsx",
      history: [initialMessage("Nouveau projet créé. Génération en cours…")],
    }));
    setShowLanding(false);

    setTimeout(() => sendMessage(prompt), 200);
  }, [setState]);

  const handleStartFromLanding = useCallback((prompt: string, sendMessage: (prompt: string) => void) => {
    if (!userEmail) {
      if (prompt.trim()) {
        sessionStorage.setItem("blink_pending_prompt", prompt);
      }
      navigate("/auth", { state: { from: "/" } });
      return;
    }
    setShowLanding(false);
    if (prompt.trim()) {
      handleStartWithPrompt(prompt, sendMessage);
    } else {
      handleCreateNewFromDashboard();
    }
  }, [userEmail, navigate, handleStartWithPrompt, handleCreateNewFromDashboard]);

  const handleStartFromTemplate = useCallback(async (template: ProjectTemplate) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const { data: inserted } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: template.name,
        schema: { version: "3.0.0", app_name: template.name, components: [] },
        code: serializeFiles(template.files),
      } as any)
      .select("id")
      .single();

    if (inserted) {
      setState((prev) => ({
        ...prev,
        projectId: (inserted as any).id,
        projectName: template.name,
        files: { ...template.files },
        activeFile: "App.tsx",
        history: [initialMessage(`Template "${template.name}" chargé ! Personnalisez-le via le chat.`)],
      }));
    }
    setShowLanding(false);
  }, [setState]);

  const loadInitialProject = useCallback((_setState: React.Dispatch<React.SetStateAction<AppState>>) => {
    // handled in useEffect above
  }, []);

  return {
    authChecked,
    showLanding,
    setShowLanding,
    userEmail,
    handleNewProject,
    handleOpenProject,
    handleRenameProject,
    handleCreateNewFromDashboard,
    handleStartWithPrompt,
    handleStartFromLanding,
    handleStartFromTemplate,
    autoSaveFiles,
    loadInitialProject,
  };
}
