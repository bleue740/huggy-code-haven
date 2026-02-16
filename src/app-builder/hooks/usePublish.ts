import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { serializeFiles } from "./useProject";
import type { AppState } from "../types";

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

    setState((prev) => ({ ...prev, isDeploying: true, deploymentProgress: 10 }));

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Non authentifié");
      setState((prev) => ({ ...prev, deploymentProgress: 30 }));

      const code = serializeFiles(state.files);
      const slug = `blink-${state.projectId!.slice(0, 8)}`;
      setState((prev) => ({ ...prev, deploymentProgress: 50 }));

      const { data: deployment, error } = await supabase
        .from("deployments")
        .upsert(
          {
            user_id: userId,
            project_id: state.projectId,
            slug,
            schema_snapshot: { code, files: state.files } as any,
            url: `/published/${slug}`,
          } as any,
          { onConflict: "project_id" },
        )
        .select("id, slug, url")
        .single();

      if (error) throw error;
      setState((prev) => ({ ...prev, deploymentProgress: 90 }));

      const deployUrl = `/p/${(deployment as any).id}`;
      setState((prev) => ({
        ...prev,
        isDeploying: false,
        deploymentProgress: 100,
        deployedUrl: deployUrl,
      }));
      toast.success("🚀 Projet déployé !", {
        description: "Votre app est maintenant en ligne.",
        action: { label: "Ouvrir", onClick: () => window.open(deployUrl, "_blank") },
      });
    } catch (e: any) {
      console.error("Publish error:", e);
      setState((prev) => ({ ...prev, isDeploying: false, deploymentProgress: 0 }));
      toast.error("Erreur de déploiement", { description: e?.message });
    }
  }, [state.projectId, state.files, setState]);

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

      const slug = `blink-${state.projectId!.slice(0, 8)}`;
      const { data: deployment, error } = await supabase
        .from("deployments")
        .upsert(
          {
            user_id: userId,
            project_id: state.projectId,
            slug,
            schema_snapshot: { code: serializeFiles(state.files), files: state.files } as any,
            url: `/p/preview`,
          } as any,
          { onConflict: "project_id" },
        )
        .select("id")
        .single();

      if (error) throw error;
      const deployUrl = `/p/${(deployment as any).id}`;
      setState((prev) => ({ ...prev, deployedUrl: deployUrl }));

      const fullUrl = `${window.location.origin}${deployUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success("🔗 Lien public généré et copié !", {
        description: fullUrl,
        action: { label: "Ouvrir", onClick: () => window.open(deployUrl, "_blank") },
      });
    } catch (e: any) {
      toast.error("Erreur lors de la génération du lien", { description: e?.message });
    } finally {
      setIsSharingPreview(false);
    }
  }, [state.projectId, state.files, setState]);

  return { handlePublish, handleSharePreview, isSharingPreview };
}
