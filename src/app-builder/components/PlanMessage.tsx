import React from 'react';
import { CheckCircle2, Rocket } from 'lucide-react';

interface PlanMessageProps {
  planContent: string;
  onApprove: (plan: string) => void;
}

/** Very lightweight markdown-ish renderer for plan content */
function renderPlanMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (!line.trim()) {
      nodes.push(<br key={`br-${i}`} />);
      return;
    }
    if (line.startsWith('### ')) {
      nodes.push(<h4 key={i} className="text-sm font-bold text-white mt-3 mb-1">{renderInline(line.slice(4))}</h4>);
      return;
    }
    if (line.startsWith('## ')) {
      nodes.push(<h3 key={i} className="text-base font-bold text-white mt-4 mb-2">{renderInline(line.slice(3))}</h3>);
      return;
    }
    if (line.startsWith('# ')) {
      nodes.push(<h2 key={i} className="text-lg font-black text-white mt-4 mb-2">{renderInline(line.slice(2))}</h2>);
      return;
    }
    const listMatch = line.match(/^[-*]\s+(.*)/);
    if (listMatch) {
      nodes.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-purple-400 mt-[2px]">•</span>
          <span>{renderInline(listMatch[1])}</span>
        </div>
      );
      return;
    }
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      nodes.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-purple-400 font-mono text-xs mt-[2px]">{numMatch[1]}.</span>
          <span>{renderInline(numMatch[2])}</span>
        </div>
      );
      return;
    }
    nodes.push(<p key={i} className="mb-0.5">{renderInline(line)}</p>);
  });

  return nodes;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)|(\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) parts.push(<strong key={key++} className="text-white font-semibold">{match[2]}</strong>);
    else if (match[4]) parts.push(<code key={key++} className="px-1.5 py-0.5 bg-white/10 rounded text-[12px] font-mono text-purple-300">{match[4]}</code>);
    else if (match[6]) parts.push(<em key={key++} className="italic text-neutral-300">{match[6]}</em>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export const PlanMessage: React.FC<PlanMessageProps> = ({ planContent, onApprove }) => {
  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 border border-purple-500/20 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-purple-500/20 flex items-center justify-center">
            <CheckCircle2 size={12} className="text-purple-400" />
          </div>
          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Plan structuré</span>
        </div>
        <div className="text-[13px] leading-relaxed text-neutral-200">
          {renderPlanMarkdown(planContent)}
        </div>
        <div className="mt-4 pt-3 border-t border-purple-500/10">
          <button
            onClick={() => onApprove(planContent)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-purple-500/20"
          >
            <Rocket size={14} />
            Approuver et implémenter
          </button>
        </div>
      </div>
    </div>
  );
};
