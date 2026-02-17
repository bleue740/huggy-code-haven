import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AppState } from "../types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export function usePublish(
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>,
) {
  const [isSharingPreview, setIsSharingPreview] = useState(false);

  const handlePublish = useCallback(async () => {
    if (!state.projectId) {
      toast.error("Aucun projet à déployer.");
      return;
    }

    setState((prev) => ({ ...prev, isDeploying: true, deploymentProgress: 5, deployStatusText: "Initialisation…" }));

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Non authentifié");

      setState((prev) => ({ ...prev, deploymentProgress: 10, deployStatusText: "Transpilation Vite…" }));

      let buildUrl: string;

      if (BACKEND_URL) {
        // ── Use real Vite build server ──
        setState((prev) => ({ ...prev, deploymentProgress: 15, deployStatusText: "Build en cours (Vite + esbuild)…" }));

        const resp = await fetch(`${BACKEND_URL}/build`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: state.files,
            projectId: state.projectId,
            projectName: state.projectName || "Blink App",
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Build failed" }));
          throw new Error(err.error || "Build failed");
        }

        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        buildUrl = data.buildUrl;

        setState((prev) => ({ ...prev, deploymentProgress: 85, deployStatusText: "Upload terminé…" }));
      } else {
        // ── Fallback: use edge function build ──
        setState((prev) => ({ ...prev, deploymentProgress: 15, deployStatusText: "Transpilation en cours…" }));

        const { data, error } = await supabase.functions.invoke("build-project", {
          body: {
            files: state.files,
            projectId: state.projectId,
            projectName: state.projectName || "Blink App",
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        buildUrl = data.buildUrl;
      }

      setState((prev) => ({ ...prev, deploymentProgress: 90, deployStatusText: "Mise à jour du déploiement…" }));

      // Update deployment record
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        await supabase.from("deployments").upsert(
          {
            user_id: userId,
            project_id: state.projectId,
            slug: `blink-${state.projectId!.slice(0, 8)}`,
            build_url: buildUrl,
            url: buildUrl,
            schema_snapshot: { code: "", files: state.files },
          } as any,
          { onConflict: "project_id" }
        );
      }

      setState((prev) => ({
        ...prev,
        isDeploying: false,
        deploymentProgress: 100,
        deployedUrl: buildUrl,
        deployStatusText: null,
      }));

      toast.success("🚀 Projet déployé !", {
        description: BACKEND_URL ? "Build Vite complet avec code splitting et tree shaking." : "Build pré-transpilé déployé.",
        action: { label: "Ouvrir", onClick: () => window.open(buildUrl, "_blank") },
      });
    } catch (e: any) {
      console.error("Publish error:", e);
      setState((prev) => ({ ...prev, isDeploying: false, deploymentProgress: 0, deployStatusText: null }));
      toast.error("Erreur de déploiement", { description: e?.message });
    }
  }, [state.projectId, state.files, state.projectName, setState]);

  const handleSharePreview = useCallback(async () => {
    if (!state.projectId) {
      toast.error("Créez un projet d'abord.");
      return;
    }
    setIsSharingPreview(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Non authentifié");

      let buildUrl: string;

      if (BACKEND_URL) {
        const resp = await fetch(`${BACKEND_URL}/build`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: state.files,
            projectId: state.projectId,
            projectName: state.projectName || "Blink App",
          }),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Build failed" }));
          throw new Error(err.error || "Build failed");
        }
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        buildUrl = data.buildUrl;
      } else {
        const { data, error } = await supabase.functions.invoke("build-project", {
          body: {
            files: state.files,
            projectId: state.projectId,
            projectName: state.projectName || "Blink App",
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        buildUrl = data.buildUrl;
      }

      setState((prev) => ({ ...prev, deployedUrl: buildUrl }));
      await navigator.clipboard.writeText(buildUrl);
      toast.success("🔗 Lien public généré et copié !", {
        description: buildUrl,
        action: { label: "Ouvrir", onClick: () => window.open(buildUrl, "_blank") },
      });
    } catch (e: any) {
      toast.error("Erreur lors de la génération du lien", { description: e?.message });
    } finally {
      setIsSharingPreview(false);
    }
  }, [state.projectId, state.files, state.projectName, setState]);

  return { handlePublish, handleSharePreview, isSharingPreview };
}
