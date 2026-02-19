import { useMemo } from "react";
import type { BuildLogEntry } from "./useBuildLogs";

export type BuildStageId = "scaffold" | "install" | "compile" | "upload" | "done";

export interface BuildStage {
  id: BuildStageId;
  label: string;
  icon: string;
  description: string;
  status: "pending" | "active" | "done" | "error";
  startedAt?: number;
  completedAt?: number;
  progress: number; // 0-100 for this stage
}

const STAGE_PATTERNS: Record<BuildStageId, RegExp[]> = {
  scaffold: [
    /scaffold/i,
    /copying template/i,
    /project directory/i,
    /writing.*files/i,
    /base modules/i,
    /node_modules.*ready/i,
  ],
  install: [
    /installing.*packages/i,
    /npm install/i,
    /extra packages/i,
    /added \d+ packages/i,
    /installing base/i,
  ],
  compile: [
    /vite.*build/i,
    /building.*project/i,
    /transforming/i,
    /modules transformed/i,
    /rollup/i,
    /chunk/i,
    /dist\//i,
    /✓ \d+/i,
    /\d+\.\d+s/,
    /gzip/i,
    /dev server ready/i,
    /ready in/i,
    /local:/i,
  ],
  upload: [
    /uploading/i,
    /uploaded/i,
    /✓ uploaded/i,
    /storage.*upload/i,
    /build.*complete/i,
    /deploy/i,
  ],
  done: [
    /build complete/i,
    /✅.*build/i,
    /build.*✅/i,
  ],
};

function detectStage(text: string): BuildStageId | null {
  for (const [stage, patterns] of Object.entries(STAGE_PATTERNS) as [BuildStageId, RegExp[]][]) {
    if (patterns.some((p) => p.test(text))) return stage;
  }
  return null;
}

const STAGE_ORDER: BuildStageId[] = ["scaffold", "install", "compile", "upload"];
const STAGE_WEIGHTS = { scaffold: 10, install: 25, compile: 45, upload: 20 };

export interface BuildPipelineState {
  stages: BuildStage[];
  /** Overall 0-100 progress across all stages */
  overallProgress: number;
  currentStageId: BuildStageId | null;
  isDone: boolean;
  hasError: boolean;
}

const STAGE_LABELS: Record<BuildStageId, { label: string; icon: string; description: string }> = {
  scaffold: { label: "Scaffold", icon: "🏗️", description: "Creating project structure" },
  install:  { label: "Install",  icon: "📦", description: "Installing dependencies" },
  compile:  { label: "Compile",  icon: "⚡", description: "Building with Vite" },
  upload:   { label: "Upload",   icon: "🚀", description: "Deploying to CDN" },
  done:     { label: "Done",     icon: "✅", description: "Build complete" },
};

export function useBuildPipeline(logs: BuildLogEntry[]): BuildPipelineState {
  return useMemo(() => {
    const stageTimestamps: Partial<Record<BuildStageId, { start: number; end?: number }>> = {};
    let hasError = false;
    let highestReachedIdx = -1;

    for (const log of logs) {
      if (log.level === "error") hasError = true;

      const detected = detectStage(log.text);
      if (!detected || detected === "done") {
        if (detected === "done") {
          // Mark upload as done if not already
          if (!stageTimestamps["upload"]?.end) {
            if (!stageTimestamps["upload"]) stageTimestamps["upload"] = { start: log.ts };
            stageTimestamps["upload"].end = log.ts;
          }
        }
        continue;
      }

      const idx = STAGE_ORDER.indexOf(detected);
      if (idx === -1) continue;

      if (!stageTimestamps[detected]) {
        stageTimestamps[detected] = { start: log.ts };
        // Close previous stage
        if (idx > 0) {
          const prevStage = STAGE_ORDER[idx - 1];
          if (stageTimestamps[prevStage] && !stageTimestamps[prevStage]!.end) {
            stageTimestamps[prevStage]!.end = log.ts;
          }
        }
      }

      if (idx > highestReachedIdx) highestReachedIdx = idx;
    }

    // Determine current active stage
    const currentStageIdx = highestReachedIdx;
    const isDone = !!(stageTimestamps["upload"]?.end) || logs.some(l => /✅.*build|build complete/i.test(l.text));

    // Build stage objects
    const stages: BuildStage[] = STAGE_ORDER.map((id, idx) => {
      const meta = STAGE_LABELS[id];
      const timing = stageTimestamps[id];

      let status: BuildStage["status"] = "pending";
      if (isDone && idx <= currentStageIdx) status = "done";
      else if (timing?.end) status = "done";
      else if (timing?.start && !timing.end) status = idx === currentStageIdx ? "active" : "done";
      else if (idx < currentStageIdx) status = "done";

      if (hasError && status === "active") status = "error";

      return {
        id,
        label: meta.label,
        icon: meta.icon,
        description: meta.description,
        status,
        startedAt: timing?.start,
        completedAt: timing?.end,
        progress: status === "done" ? 100 : status === "active" ? 60 : 0,
      };
    });

    // Overall progress
    let overallProgress = 0;
    if (isDone) {
      overallProgress = 100;
    } else {
      let accumulated = 0;
      for (const [id, weight] of Object.entries(STAGE_WEIGHTS) as [BuildStageId, number][]) {
        const stage = stages.find(s => s.id === id);
        if (!stage) continue;
        if (stage.status === "done") {
          accumulated += weight;
        } else if (stage.status === "active") {
          accumulated += weight * 0.5;
        }
      }
      overallProgress = Math.min(99, accumulated);
    }

    return {
      stages,
      overallProgress,
      currentStageId: currentStageIdx >= 0 ? STAGE_ORDER[currentStageIdx] : null,
      isDone,
      hasError,
    };
  }, [logs]);
}
