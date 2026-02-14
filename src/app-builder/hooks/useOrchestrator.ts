import { useState, useCallback, useReducer, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  conversationReducer,
  INITIAL_CONVERSATION_STATE,
  isConversationActive,
  type ConversationState,
  type ConversationPhase,
} from "../engine/ConversationStateMachine";
import type { VirtualFS } from "../engine/VirtualFS";
import type { ProjectContext } from "../engine/ProjectContext";

const ORCHESTRATOR_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api/orchestrator`
  : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-orchestrator`;

interface OrchestratorCallbacks {
  onFilesGenerated: (files: Array<{ path: string; content: string }>, deletedFiles: string[]) => void;
  onConversationalReply: (reply: string) => void;
  onError: (error: string, code?: number) => void;
  onPlanReady: (intent: string, steps: Array<{ id: number; action: string; target: string; description: string }>) => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useOrchestrator() {
  const [convState, dispatch] = useReducer(conversationReducer, INITIAL_CONVERSATION_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const isActive = isConversationActive(convState);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  const send = useCallback(
    async (
      messages: ChatMessage[],
      vfs: VirtualFS,
      ctx: ProjectContext,
      callbacks: OrchestratorCallbacks,
    ) => {
      const controller = new AbortController();
      abortRef.current = controller;
      dispatch({ type: "START" });

      try {
        // Auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          callbacks.onError("Connectez-vous pour utiliser Blink AI.", 401);
          dispatch({ type: "RESET" });
          return;
        }

        const resp = await fetch(ORCHESTRATOR_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages,
            projectContext: vfs.buildPreviewCode(),
            fileTree: vfs.getFileTree(),
          }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({ error: "Unknown error" }));
          callbacks.onError(errData.message || errData.error || "Erreur serveur", resp.status);
          dispatch({ type: "ERROR", message: errData.error || "Erreur" });
          return;
        }

        if (!resp.body) {
          callbacks.onError("Pas de réponse du serveur.");
          dispatch({ type: "ERROR", message: "No response body" });
          return;
        }

        // Read SSE stream
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const event = JSON.parse(jsonStr);

              switch (event.type) {
                case "phase":
                  dispatch({
                    type: "SET_PHASE",
                    phase: event.phase as ConversationPhase,
                    message: event.message,
                  });
                  break;

                case "plan":
                  if (event.plan?.steps) {
                    dispatch({ type: "SET_PLAN", steps: event.plan.steps });
                    callbacks.onPlanReady(event.plan.intent, event.plan.steps);
                  }
                  break;

                case "file_generated":
                  dispatch({ type: "FILE_GENERATED", path: event.path });
                  break;

                case "validation":
                  dispatch({
                    type: "SET_VALIDATION",
                    errors: event.errors || [],
                    warnings: event.warnings || [],
                  });
                  break;

                case "result":
                  if (event.conversational) {
                    callbacks.onConversationalReply(event.reply || "");
                  } else {
                    callbacks.onFilesGenerated(
                      event.files || [],
                      event.deletedFiles || [],
                    );
                    // Update project context
                    if (event.intent) {
                      ctx.updateFromPlan(event.intent);
                    }
                  }
                  dispatch({ type: "COMPLETE" });
                  break;
              }
            } catch {
              // Incomplete JSON, put back
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      } catch (e: any) {
        if (e.name === "AbortError") {
          dispatch({ type: "RESET" });
        } else {
          console.error("Orchestrator error:", e);
          callbacks.onError(e.message || "Erreur de connexion.");
          dispatch({ type: "ERROR", message: e.message });
        }
      } finally {
        abortRef.current = null;
      }
    },
    [],
  );

  return {
    send,
    stop,
    convState,
    isActive,
    dispatch,
  };
}
