import React from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
