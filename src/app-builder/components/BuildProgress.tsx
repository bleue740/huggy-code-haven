import React, { useEffect, useRef } from "react";
import { CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import type { BuildStage } from "../hooks/useBuildPipeline";
import type { BuildPipelineState } from "../hooks/useBuildPipeline";

interface BuildProgressProps {
  pipeline: BuildPipelineState;
  isVisible: boolean;
}

function StageElapsed({ startedAt, completedAt }: { startedAt?: number; completedAt?: number }) {
  const [now, setNow] = React.useState(Date.now());
  useEffect(() => {
    if (completedAt) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [completedAt]);

  if (!startedAt) return null;
  const ms = (completedAt ?? now) - startedAt;
  const s = (ms / 1000).toFixed(1);
  return (
    <span className="text-[9px] font-mono tabular-nums" style={{ color: "hsl(220 10% 45%)" }}>
      {s}s
    </span>
  );
}

function StageIcon({ status }: { status: BuildStage["status"] }) {
  if (status === "done")
    return <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />;
  if (status === "error")
    return <AlertCircle size={13} className="text-red-400 shrink-0" />;
  if (status === "active")
    return <Loader2 size={13} className="shrink-0 animate-spin" style={{ color: "#a78bfa" }} />;
  return (
    <div
      className="w-3.5 h-3.5 rounded-full border shrink-0"
      style={{ borderColor: "hsl(220 10% 25%)" }}
    />
  );
}

function StageRow({ stage, isLast }: { stage: BuildStage; isLast: boolean }) {
  const isActive = stage.status === "active";
  const isDone = stage.status === "done";
  const isPending = stage.status === "pending";

  return (
    <div className="flex gap-3 items-stretch">
      {/* Timeline spine */}
      <div className="flex flex-col items-center w-5 shrink-0">
        <StageIcon status={stage.status} />
        {!isLast && (
          <div
            className="w-px flex-1 mt-1.5 rounded-full transition-all duration-700"
            style={{
              background: isDone
                ? "linear-gradient(to bottom, #34d399, #059669)"
                : "hsl(220 10% 15%)",
              minHeight: 16,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div
        className={`flex-1 pb-4 transition-opacity duration-500 ${isPending ? "opacity-30" : "opacity-100"}`}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm">{stage.icon}</span>
          <span
            className={`text-xs font-bold tracking-wide transition-colors duration-300 ${
              isActive
                ? "text-white"
                : isDone
                ? "text-emerald-300"
                : "text-neutral-500"
            }`}
          >
            {stage.label}
          </span>
          <StageElapsed startedAt={stage.startedAt} completedAt={stage.completedAt} />
        </div>

        <p
          className={`text-[10px] leading-relaxed transition-colors duration-300 ${
            isActive ? "text-neutral-400" : isDone ? "text-neutral-600" : "text-neutral-700"
          }`}
        >
          {stage.description}
        </p>

        {/* Active stage mini progress bar */}
        {isActive && (
          <div
            className="mt-2 h-0.5 rounded-full overflow-hidden"
            style={{ background: "hsl(220 10% 14%)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: "40%",
                background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
                animation: "build-scan 1.8s ease-in-out infinite",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const BuildProgress: React.FC<BuildProgressProps> = ({ pipeline, isVisible }) => {
  const { stages, overallProgress, isDone, hasError } = pipeline;
  const hasAnyStage = stages.some((s) => s.status !== "pending");

  if (!isVisible || !hasAnyStage) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(240 15% 7% / 0.95), hsl(260 12% 6% / 0.95))",
        border: "1px solid hsl(220 10% 12%)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 4px 30px hsl(260 40% 5% / 0.8), inset 0 1px 0 hsl(0 0% 100% / 0.03)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "hsl(220 10% 10%)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: hasError
                ? "#ef4444"
                : isDone
                ? "#34d399"
                : "#a78bfa",
              boxShadow: hasError
                ? "0 0 6px #ef4444"
                : isDone
                ? "0 0 6px #34d399"
                : "0 0 6px #a78bfa",
              animation: isDone || hasError ? "none" : "pulse 1.5s ease-in-out infinite",
            }}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {hasError ? "Build failed" : isDone ? "Build complete" : "Building…"}
          </span>
        </div>
        <span
          className="text-[11px] font-black tabular-nums"
          style={{
            color: isDone ? "#34d399" : "#a78bfa",
          }}
        >
          {Math.round(overallProgress)}%
        </span>
      </div>

      {/* Overall progress track */}
      <div
        className="mx-4 mt-3 h-[3px] rounded-full overflow-hidden"
        style={{ background: "hsl(220 10% 10%)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${overallProgress}%`,
            background: hasError
              ? "linear-gradient(90deg, #ef4444, #dc2626)"
              : isDone
              ? "linear-gradient(90deg, #34d399, #10b981)"
              : "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
          }}
        />
      </div>

      {/* Stage list */}
      <div className="px-4 pt-4 pb-1">
        {stages.map((stage, i) => (
          <StageRow key={stage.id} stage={stage} isLast={i === stages.length - 1} />
        ))}
      </div>

      <style>{`
        @keyframes build-scan {
          0%   { transform: translateX(-100%); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateX(350%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
