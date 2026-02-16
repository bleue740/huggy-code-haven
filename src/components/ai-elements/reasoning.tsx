import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { createContext, memo, useContext, useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Shimmer } from "@/components/ai-elements/shimmer";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface ReasoningContextValue {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  duration: number | undefined;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
};

/* ------------------------------------------------------------------ */
/*  Reasoning (root)                                                   */
/* ------------------------------------------------------------------ */

export type ReasoningProps = ComponentProps<"div"> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
};

const AUTO_CLOSE_DELAY = 1000;
const MS_IN_S = 1000;

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen = true,
    onOpenChange,
    duration: durationProp,
    children,
    ...props
  }: ReasoningProps) => {
    const [isOpen = true, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });
    const [duration, setDuration] = useControllableState({
      prop: durationProp,
      defaultProp: undefined,
    });

    const [hasAutoClosed, setHasAutoClosed] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);

    // Track duration when streaming starts and ends
    useEffect(() => {
      if (isStreaming) {
        if (startTime === null) {
          setStartTime(Date.now());
        }
      } else if (startTime !== null) {
        setDuration(Math.ceil((Date.now() - startTime) / MS_IN_S));
        setStartTime(null);
      }
    }, [isStreaming, startTime, setDuration]);

    // Auto-close when streaming ends (once only)
    useEffect(() => {
      if (defaultOpen && !isStreaming && isOpen && !hasAutoClosed) {
        const timer = setTimeout(() => {
          setIsOpen(false);
          setHasAutoClosed(true);
        }, AUTO_CLOSE_DELAY);
        return () => clearTimeout(timer);
      }
    }, [isStreaming, isOpen, defaultOpen, setIsOpen, hasAutoClosed]);

    return (
      <ReasoningContext.Provider
        value={{ isStreaming, isOpen, setIsOpen, duration }}
      >
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className={cn("", className)}
          {...props}
        >
          {children}
        </Collapsible>
      </ReasoningContext.Provider>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  ReasoningTrigger                                                   */
/* ------------------------------------------------------------------ */

export type ReasoningTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => ReactNode;
};

const defaultGetThinkingMessage = (
  isStreaming: boolean,
  duration?: number
) => {
  if (isStreaming || duration === 0) {
    return <Shimmer duration={1.5}>Thinking...</Shimmer>;
  }
  if (duration === undefined) {
    return <p className="text-xs text-muted-foreground">Thought for a few seconds</p>;
  }
  return (
    <p className="text-xs text-muted-foreground">
      Thought for {duration} seconds
    </p>
  );
};

export const ReasoningTrigger = memo(
  ({
    className,
    children,
    getThinkingMessage = defaultGetThinkingMessage,
    ...props
  }: ReasoningTriggerProps) => {
    const { isStreaming, isOpen, duration } = useReasoning();

    return (
      <CollapsibleTrigger
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
          "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          "transition-colors cursor-pointer select-none w-full",
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <BrainIcon className="size-4 shrink-0" />
            {getThinkingMessage(isStreaming, duration)}
            <ChevronDownIcon
              className={cn(
                "size-4 shrink-0 ml-auto transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </>
        )}
      </CollapsibleTrigger>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  ReasoningContent                                                   */
/* ------------------------------------------------------------------ */

export type ReasoningContentProps = ComponentProps<typeof CollapsibleContent> & {
  children: string;
};

export const ReasoningContent = memo(
  ({ className, children, ...props }: ReasoningContentProps) => (
    <CollapsibleContent
      className={cn(
        "ml-6 border-l border-border pl-4 py-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap",
        className
      )}
      {...props}
    >
      {children}
    </CollapsibleContent>
  )
);

Reasoning.displayName = "Reasoning";
ReasoningTrigger.displayName = "ReasoningTrigger";
ReasoningContent.displayName = "ReasoningContent";
