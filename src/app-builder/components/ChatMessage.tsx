import React from 'react';
import { CheckCircle2, FileCode2 } from 'lucide-react';
import { Message } from '../types';
import { PlanMessage } from './PlanMessage';

interface ChatMessageProps {
  message: Message;
  onApprovePlan?: (plan: string) => void;
}

/** Strip fenced code blocks (```lang ... ```) from text */
function stripCodeBlocks(text: string): string {
  return text.replace(/```[\w]*\s*\n[\s\S]*?```/g, '').trim();
}

/** Very lightweight markdown-ish renderer — no dependencies */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (!line.trim()) {
      nodes.push(<br key={`br-${i}`} />);
      return;
    }

    // Headings
    if (line.startsWith('### ')) {
      nodes.push(<h4 key={i} className="text-sm font-bold text-white mt-3 mb-1">{renderInline(line.slice(4))}</h4>);
      return;
    }
    if (line.startsWith('## ')) {
      nodes.push(<h3 key={i} className="text-sm font-bold text-white mt-3 mb-1">{renderInline(line.slice(3))}</h3>);
      return;
    }

    // Unordered list
    const listMatch = line.match(/^[-*]\s+(.*)/);
    if (listMatch) {
      nodes.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-blue-400 mt-[2px]">•</span>
          <span>{renderInline(listMatch[1])}</span>
        </div>
      );
      return;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      nodes.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-blue-400 font-mono text-xs mt-[2px]">{numMatch[1]}.</span>
          <span>{renderInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Regular paragraph
    nodes.push(<p key={i} className="mb-0.5">{renderInline(line)}</p>);
  });

  return nodes;
}

/** Inline formatting: **bold**, `code`, *italic* */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(`(.+?)`)|(\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={key++} className="text-white font-semibold">{match[2]}</strong>);
    } else if (match[4]) {
      parts.push(<code key={key++} className="px-1.5 py-0.5 bg-white/10 rounded text-[12px] font-mono text-blue-300">{match[4]}</code>);
    } else if (match[6]) {
      parts.push(<em key={key++} className="italic text-neutral-300">{match[6]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onApprovePlan }) => {
  const displayText = stripCodeBlocks(message.content);
  const showCodeIndicator = message.codeApplied;

  // Detect plan markers [PLAN_START]...[PLAN_END]
  const planMatch = displayText.match(/\[PLAN_START\]([\s\S]*?)\[PLAN_END\]/);
  const planContent = planMatch ? planMatch[1].trim() : null;
  const textWithoutPlan = planContent
    ? displayText.replace(/\[PLAN_START\][\s\S]*?\[PLAN_END\]/, '').trim()
    : displayText;

  return (
    <div className="space-y-2">
      {textWithoutPlan && (
        <div className="text-[13px] leading-relaxed text-neutral-200">
          {renderMarkdown(textWithoutPlan)}
        </div>
      )}
      {planContent && onApprovePlan && (
        <PlanMessage planContent={planContent} onApprove={onApprovePlan} />
      )}
      {planContent && !onApprovePlan && (
        <div className="text-[13px] leading-relaxed text-neutral-200">
          {renderMarkdown(planContent)}
        </div>
      )}
      {showCodeIndicator && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mt-2">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <FileCode2 size={14} className="text-emerald-400 shrink-0" />
          <span className="text-[12px] font-medium text-emerald-300">
            Code appliqué à la preview
            {message.codeLineCount ? ` — ${message.codeLineCount} lignes` : ''}
          </span>
        </div>
      )}
    </div>
  );
};
