import { useEffect, useRef, useState, useCallback } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export interface BuildLogEntry {
  id: string;
  text: string;
  level: "log" | "warn" | "error" | "info";
  ts: number;
}

/**
 * Hook to stream real-time build/dev logs from the Railway server via SSE.
 */
export function useBuildLogs(projectId: string | undefined) {
  const [logs, setLogs] = useState<BuildLogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const counterRef = useRef(0);

  const connect = useCallback(() => {
    if (!projectId || !BACKEND_URL) return;
    if (esRef.current) {
      esRef.current.close();
    }

    const url = `${BACKEND_URL}/logs/${projectId}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setIsConnected(true);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const entry: BuildLogEntry = {
          id: `log_${counterRef.current++}`,
          text: data.text ?? e.data,
          level: data.level ?? "log",
          ts: data.ts ?? Date.now(),
        };
        setLogs((prev) => {
          const next = [...prev, entry];
          return next.length > 500 ? next.slice(-500) : next;
        });
      } catch {
        // ignore malformed
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      // Reconnect after 3s
      setTimeout(() => {
        if (esRef.current === es) connect();
      }, 3000);
    };
  }, [projectId]);

  const disconnect = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setIsConnected(false);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  // Auto-connect when projectId is available
  useEffect(() => {
    if (projectId && BACKEND_URL) {
      connect();
    }
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [projectId, connect]);

  return {
    logs,
    isConnected,
    clearLogs,
    connect,
    disconnect,
    isAvailable: !!BACKEND_URL,
  };
}
