/**
 * ConversationStateMachine — deterministic state transitions for the AI pipeline.
 * Replaces ad-hoc isGenerating / aiStatusText flags.
 */

export type ConversationPhase =
  | "idle"
  | "planning"
  | "generating"
  | "validating"
  | "fixing"
  | "previewing"
  | "error";

export interface ConversationState {
  phase: ConversationPhase;
  message: string | null;
  errors: Array<{ type: string; file: string; message: string }>;
  warnings: Array<{ type: string; file: string; message: string }>;
  planSteps: Array<{ id: number; action: string; target: string; description: string }>;
  generatedFiles: string[];
  startedAt: number | null;
}

const INITIAL_STATE: ConversationState = {
  phase: "idle",
  message: null,
  errors: [],
  warnings: [],
  planSteps: [],
  generatedFiles: [],
  startedAt: null,
};

export type ConversationAction =
  | { type: "START" }
  | { type: "SET_PHASE"; phase: ConversationPhase; message?: string }
  | { type: "SET_PLAN"; steps: ConversationState["planSteps"] }
  | { type: "FILE_GENERATED"; path: string }
  | { type: "SET_VALIDATION"; errors: ConversationState["errors"]; warnings: ConversationState["warnings"] }
  | { type: "COMPLETE" }
  | { type: "ERROR"; message: string }
  | { type: "RESET" };

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case "START":
      return {
        ...INITIAL_STATE,
        phase: "planning",
        message: "Analyse de la demande…",
        startedAt: Date.now(),
      };

    case "SET_PHASE":
      return {
        ...state,
        phase: action.phase,
        message: action.message ?? state.message,
      };

    case "SET_PLAN":
      return {
        ...state,
        planSteps: action.steps,
      };

    case "FILE_GENERATED":
      return {
        ...state,
        generatedFiles: [...state.generatedFiles, action.path],
      };

    case "SET_VALIDATION":
      return {
        ...state,
        errors: action.errors,
        warnings: action.warnings,
      };

    case "COMPLETE":
      return {
        ...state,
        phase: "idle",
        message: null,
      };

    case "ERROR":
      return {
        ...state,
        phase: "error",
        message: action.message,
      };

    case "RESET":
      return { ...INITIAL_STATE };

    default:
      return state;
  }
}

export const INITIAL_CONVERSATION_STATE = INITIAL_STATE;

/** Helper to check if the conversation is in an active (non-idle) state */
export function isConversationActive(state: ConversationState): boolean {
  return state.phase !== "idle" && state.phase !== "error";
}

/** Get a human-readable status for the current phase */
export function getPhaseLabel(phase: ConversationPhase): string {
  switch (phase) {
    case "idle": return "";
    case "planning": return "🧠 Planification…";
    case "generating": return "⚡ Génération du code…";
    case "validating": return "🔍 Validation…";
    case "fixing": return "🔧 Correction…";
    case "previewing": return "👁️ Preview…";
    case "error": return "❌ Erreur";
  }
}
