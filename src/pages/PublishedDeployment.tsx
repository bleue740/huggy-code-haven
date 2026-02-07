import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type DeploymentRow = {
  id: string;
  slug: string;
  schema_snapshot: any;
};

export default function PublishedDeploymentPage() {
  const { deploymentId } = useParams();
  const [row, setRow] = useState<DeploymentRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!deploymentId) throw new Error("Missing deployment id");
        const { data, error } = await supabase
          .from("deployments")
          .select("id, slug, schema_snapshot")
          .eq("id", deploymentId)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Not found");
        if (mounted) setRow(data as any);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Not found");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [deploymentId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-sm text-neutral-500">Loading…</div>
      </main>
    );
  }

  if (error || !row) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-black">Deployment introuvable</h1>
          <p className="text-sm text-neutral-500 mt-2">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="dark h-screen">
      <div className="flex h-screen bg-[#050505] overflow-hidden select-none relative">
        <div className="flex-1 flex items-center justify-center text-white">
          <div className="text-center">
            <h1 className="text-3xl font-black mb-2">Published: {row.slug}</h1>
            <p className="text-neutral-500">Deployment ID: {row.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
