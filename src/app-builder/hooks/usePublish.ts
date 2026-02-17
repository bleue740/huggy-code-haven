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

    setState((prev) => ({ ...prev, isDeploying: true, deploymentProgress: 5 }));

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Non authentifié");

      setState((prev) => ({ ...prev, deploymentProgress: 15, deployStatusText: "Transpilation en cours..." }));

      // Call the build-project edge function
      const { data, error } = await supabase.functions.invoke("build-project", {
        body: {
          files: state.files,
          projectId: state.projectId,
          projectName: state.projectName || "Blink App",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setState((prev) => ({ ...prev, deploymentProgress: 90, deployStatusText: "Finalisation..." }));

      const buildUrl = data.buildUrl;
      setState((prev) => ({
        ...prev,
        isDeploying: false,
        deploymentProgress: 100,
        deployedUrl: buildUrl,
        deployStatusText: null,
      }));

      toast.success("🚀 Projet déployé !", {
        description: "Votre app est maintenant en ligne.",
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

      // Use the build edge function for share too
      const { data, error } = await supabase.functions.invoke("build-project", {
        body: {
          files: state.files,
          projectId: state.projectId,
          projectName: state.projectName || "Blink App",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const buildUrl = data.buildUrl;
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
