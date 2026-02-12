import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, FileCode2, Brain, Sparkles } from 'lucide-react';
import { GenerationStep } from '../types';

interface GenerationStepsProps {
  steps: GenerationStep[];
  elapsedSeconds: number;
}

export const GenerationSteps: React.FC<GenerationStepsProps> = ({ steps, elapsedSeconds }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  const getStepIcon = (step: GenerationStep) => {
    if (step.status === 'error') return <AlertCircle size={14} className="text-red-400" />;
    if (step.status === 'done') return <CheckCircle2 size={14} className="text-emerald-400" />;
    if (step.type === 'thinking') return <Brain size={14} className="text-blue-400 animate-pulse" />;
    if (step.type === 'editing') return <Loader2 size={14} className="text-orange-400 animate-spin" />;
    if (step.type === 'edited') return <Sparkles size={14} className="text-emerald-400" />;
    return <Loader2 size={14} className="text-blue-400 animate-spin" />;
  };

  const getBorderColor = (step: GenerationStep) => {
    if (step.status === 'error') return 'border-l-red-500';
    if (step.status === 'done') return 'border-l-emerald-500';
    if (step.type === 'thinking') return 'border-l-blue-500';
    if (step.type === 'editing') return 'border-l-orange-500';
    return 'border-l-blue-500';
  };

  const getElapsed = (step: GenerationStep) => {
    if (step.completedAt) return `${Math.round((step.completedAt - step.startedAt) / 1000)}s`;
    return `${Math.round((now - step.startedAt) / 1000)}s`;
  };

  if (steps.length === 0) return null;

  return (
    <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {steps.map((step) => (
        <div
          key={step.id}
          className={`flex items-center gap-3 px-3 py-2 bg-[#151515] border border-[#222] border-l-2 ${getBorderColor(step)} rounded-lg transition-all duration-300 ${
            step.status === 'active' ? 'opacity-100' : 'opacity-70'
          }`}
        >
          {getStepIcon(step)}
          <div className="flex-1 min-w-0">
            <span className="text-[12px] text-neutral-300 font-medium truncate block">
              {step.label}
            </span>
            {step.fileName && (
              <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                <FileCode2 size={10} /> {step.fileName}
              </span>
            )}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono shrink-0">
            {getElapsed(step)}
          </span>
        </div>
      ))}
    </div>
  );
};
