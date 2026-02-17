import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

interface DevServerState {
  devUrl: string | null;
  isStarting: boolean;
  isConnected: boolean;
  error: string | null;
}

/**
 * Hook to manage a Vite dev server for live preview with HMR.
 * Communicates with the Railway build server.
 */
export function useDevServer(projectId: string | undefined, files: Record<string, string>) {
  const [state, setState] = useState<DevServerState>({
    devUrl: null,
    isStarting: false,
    isConnected: false,
    error: null,
  });

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncRef = useRef<string>("");
  const startedForRef = useRef<string | null>(null);

  // Start dev server when project is ready and BACKEND_URL is set
  const startDevServer = useCallback(async (projectName?: string) => {
    if (!projectId || !BACKEND_URL || Object.keys(files).length === 0) return;

    // Don't restart if already started for this project
    if (startedForRef.current === projectId && state.devUrl) return;

    setState(prev => ({ ...prev, isStarting: true, error: null }));

    try {
      const resp = await fetch(`${BACKEND_URL}/dev/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, files, projectName }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.error || "Failed to start dev server");
      }

      const data = await resp.json();
      startedForRef.current = projectId;
      setState({
        devUrl: data.devUrl,
        isStarting: false,
        isConnected: true,
        error: null,
      });

      toast.success("⚡ Vite dev server ready with HMR!");
    } catch (e: any) {
      console.error("Dev server start error:", e);
      setState(prev => ({
        ...prev,
        isStarting: false,
        error: e.message,
      }));
    }
  }, [projectId, files]);

  // Sync files to dev server (debounced)
  const syncToDevServer = useCallback(() => {
    if (!projectId || !BACKEND_URL || !state.isConnected) return;

    // Debounce: wait 500ms after last change
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      const filesHash = JSON.stringify(files);
      if (filesHash === lastSyncRef.current) return;
      lastSyncRef.current = filesHash;

      try {
        const resp = await fetch(`${BACKEND_URL}/dev/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, files }),
        });

        if (!resp.ok) {
          console.warn("File sync failed:", await resp.text());
        }
      } catch (e) {
        console.warn("File sync error:", e);
      }
    }, 500);
  }, [projectId, files, state.isConnected]);

  // Auto-sync when files change and dev server is connected
  useEffect(() => {
    if (state.isConnected) {
      syncToDevServer();
    }
  }, [files, state.isConnected, syncToDevServer]);

  // Stop dev server
  const stopDevServer = useCallback(async () => {
    if (!projectId || !BACKEND_URL) return;

    try {
      await fetch(`${BACKEND_URL}/dev/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
    } catch { /* ignore */ }

    startedForRef.current = null;
    setState({ devUrl: null, isStarting: false, isConnected: false, error: null });
  }, [projectId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const isAvailable = !!BACKEND_URL;

  return {
    devUrl: state.devUrl,
    isStarting: state.isStarting,
    isConnected: state.isConnected,
    devServerError: state.error,
    startDevServer,
    stopDevServer,
    isAvailable,
  };
}
