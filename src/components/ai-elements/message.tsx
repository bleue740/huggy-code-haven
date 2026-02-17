import React, { useState, useEffect } from "react";
import { Bot, User, Copy, RefreshCw, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* ------------------------------------------------------------------ */
/*  Message                                                            */
/* ------------------------------------------------------------------ */

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: "user" | "assistant";
  children: React.ReactNode;
}

export const Message: React.FC<MessageProps> = ({
  from,
  className,
  children,
  ...props
}) => {
  const isAssistant = from === "assistant";

  return (
    <div
      className={cn(
        "group flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300",
        className
      )}
      {...props}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center",
          isAssistant
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isAssistant ? <Bot size={15} /> : <User size={15} />}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
          {isAssistant ? "BLINK" : "YOU"}
        </span>
        {children}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  MessageContent                                                     */
/* ------------------------------------------------------------------ */

export interface MessageContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      "text-[13px] leading-relaxed text-foreground/80",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/*  MessageActions                                                     */
/* ------------------------------------------------------------------ */

export interface MessageActionsProps {
  content: string;
  messageId?: string;
  projectId?: string;
  onRegenerate?: () => void;
  onFeedback?: (type: "up" | "down") => void;
  className?: string;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  content,
  messageId,
  projectId,
  onRegenerate,
  onFeedback,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  // Load existing feedback from DB on mount
  useEffect(() => {
    if (!messageId) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('message_feedback')
        .select('feedback_type')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.feedback_type) {
        setFeedback(data.feedback_type as "up" | "down");
      }
    };
    load();
  }, [messageId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleFeedback = async (type: "up" | "down") => {
    const newType = feedback === type ? null : type;
    setFeedback(newType);
    onFeedback?.(type);

    if (!messageId || !projectId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (newType === null) {
        // Remove feedback
        await supabase
          .from('message_feedback')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);
      } else {
        // Upsert feedback
        await supabase
          .from('message_feedback')
          .upsert(
            { user_id: user.id, message_id: messageId, project_id: projectId, feedback_type: newType },
            { onConflict: 'user_id,message_id' }
          );
      }
    } catch { /* silent */ }
  };

  const actions = [
    {
      key: "copy",
      tooltip: copied ? "Copied!" : "Copy",
      icon: copied ? <Check size={13} /> : <Copy size={13} />,
      onClick: handleCopy,
      active: copied,
    },
    ...(onRegenerate
      ? [{ key: "regen", tooltip: "Regenerate", icon: <RefreshCw size={13} />, onClick: onRegenerate, active: false }]
      : []),
    {
      key: "up",
      tooltip: "Helpful",
      icon: <ThumbsUp size={13} />,
      onClick: () => handleFeedback("up"),
      active: feedback === "up",
    },
    {
      key: "down",
      tooltip: "Not helpful",
      icon: <ThumbsDown size={13} />,
      onClick: () => handleFeedback("down"),
      active: feedback === "down",
    },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          className
        )}
      >
        {actions.map((a) => (
          <Tooltip key={a.key}>
            <TooltipTrigger asChild>
              <button
                onClick={a.onClick}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  a.active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {a.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {a.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
