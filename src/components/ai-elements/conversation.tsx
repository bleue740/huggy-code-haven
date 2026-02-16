import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface ConversationCtx {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottom: () => void;
  showScrollBtn: boolean;
}

const Ctx = createContext<ConversationCtx>({
  scrollRef: { current: null },
  scrollToBottom: () => {},
  showScrollBtn: false,
});

const useConversation = () => useContext(Ctx);

/* ------------------------------------------------------------------ */
/*  Conversation (root wrapper)                                        */
/* ------------------------------------------------------------------ */

export interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Conversation: React.FC<ConversationProps> = ({
  className,
  children,
  ...props
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop > el.clientHeight + 100);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <Ctx.Provider value={{ scrollRef, scrollToBottom, showScrollBtn }}>
      <div
        className={cn("flex flex-col relative", className)}
        {...props}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  ConversationContent – scrollable area                              */
/* ------------------------------------------------------------------ */

export interface ConversationContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ConversationContent: React.FC<ConversationContentProps> = ({
  className,
  children,
  ...props
}) => {
  const { scrollRef } = useConversation();
  const bottomRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll when children change */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [children]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin",
        className
      )}
      {...props}
    >
      {children}
      <div ref={bottomRef} />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  ConversationEmptyState                                             */
/* ------------------------------------------------------------------ */

export interface ConversationEmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const ConversationEmptyState: React.FC<ConversationEmptyStateProps> = ({
  icon,
  title = "Start a conversation",
  description,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center h-full py-20 text-center gap-3",
      className
    )}
  >
    {icon && (
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
    )}
    <h3 className="text-foreground font-bold text-sm">{title}</h3>
    {description && (
      <p className="text-xs text-muted-foreground max-w-[260px]">
        {description}
      </p>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/*  ConversationScrollButton                                           */
/* ------------------------------------------------------------------ */

export interface ConversationScrollButtonProps {
  className?: string;
}

export const ConversationScrollButton: React.FC<
  ConversationScrollButtonProps
> = ({ className }) => {
  const { scrollToBottom, showScrollBtn } = useConversation();

  if (!showScrollBtn) return null;

  return (
    <button
      onClick={scrollToBottom}
      className={cn(
        "absolute bottom-20 left-1/2 -translate-x-1/2 z-50",
        "bg-primary text-primary-foreground p-2 rounded-full shadow-xl",
        "hover:opacity-90 transition-all animate-bounce border border-primary-foreground/20",
        className
      )}
    >
      <ArrowDown size={16} />
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  ConversationDownload                                               */
/* ------------------------------------------------------------------ */

export interface ConversationDownloadProps {
  messages: Array<{ content: string; role: string }>;
  className?: string;
}

export const ConversationDownload: React.FC<ConversationDownloadProps> = ({
  messages,
  className,
}) => {
  const download = useCallback(() => {
    const text = messages
      .map((m) => `[${m.role.toUpperCase()}]\n${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conversation.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <button
      onClick={download}
      className={cn(
        "absolute top-3 right-3 z-40",
        "p-2 rounded-lg bg-muted/80 backdrop-blur-sm text-muted-foreground",
        "hover:bg-muted hover:text-foreground transition-colors",
        className
      )}
      title="Download conversation"
    >
      <Download size={14} />
    </button>
  );
};
