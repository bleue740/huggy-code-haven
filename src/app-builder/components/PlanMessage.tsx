import React from 'react';
import { Rocket } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanContent,
  PlanFooter,
  PlanTrigger,
} from '@/components/ai-elements/plan';

interface PlanMessageProps {
  planContent: string;
  onApprove: (plan: string) => void;
}

/** Parse plan content into title + body */
function parsePlan(text: string): { title: string; body: string } {
  const lines = text.split('\n').filter(l => l.trim());
  const firstLine = lines[0] || 'Plan structuré';
  const title = firstLine.replace(/^#+\s*/, '');
  const body = lines.slice(1).join('\n');
  return { title, body };
}

/** Very lightweight markdown-ish renderer for plan body */
function renderPlanMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (!line.trim()) {
      nodes.push(<br key={`br-${i}`} />);
      return;
    }
    if (line.startsWith('### ')) {
      nodes.push(<h4 key={i} className="text-sm font-bold text-foreground mt-3 mb-1">{line.slice(4)}</h4>);
      return;
    }
    if (line.startsWith('## ')) {
      nodes.push(<h3 key={i} className="text-base font-bold text-foreground mt-4 mb-2">{line.slice(3)}</h3>);
      return;
    }
    const listMatch = line.match(/^[-*]\s+(.*)/);
    if (listMatch) {
      nodes.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-primary mt-[2px]">•</span>
          <span className="text-sm text-muted-foreground">{listMatch[1]}</span>
        </div>
      );
      return;
    }
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      nodes.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-primary font-mono text-xs mt-[2px]">{numMatch[1]}.</span>
          <span className="text-sm text-muted-foreground">{numMatch[2]}</span>
        </div>
      );
      return;
    }
    nodes.push(<p key={i} className="text-sm text-muted-foreground mb-0.5">{line}</p>);
  });

  return nodes;
}

export const PlanMessage: React.FC<PlanMessageProps> = ({ planContent, onApprove }) => {
  const { title, body } = parsePlan(planContent);

  return (
    <Card className="border-primary/20 shadow-lg">
      <Plan>
        <PlanHeader className="flex items-center justify-between">
          <div>
            <PlanTitle>{title}</PlanTitle>
            <PlanDescription>Plan structuré par l'IA</PlanDescription>
          </div>
          <PlanTrigger />
        </PlanHeader>
        <PlanContent className="pt-0">
          <div className="text-[13px] leading-relaxed">
            {renderPlanMarkdown(body)}
          </div>
        </PlanContent>
        <PlanFooter className="pt-3 border-t border-border">
          <button
            onClick={() => onApprove(planContent)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Rocket size={14} />
            Approuver et implémenter
          </button>
        </PlanFooter>
      </Plan>
    </Card>
  );
};
