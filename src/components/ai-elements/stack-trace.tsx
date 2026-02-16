import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  AlertTriangleIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { createContext, memo, useContext, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types & Parsing                                                    */
/* ------------------------------------------------------------------ */

const STACK_FRAME_WITH_PARENS =
  /^at\s+(.+?)\s+\((.+):(\d+):(\d+)\)$/;
const STACK_FRAME_WITHOUT_FN = /^at\s+(.+):(\d+):(\d+)$/;
const ERROR_TYPE_REGEX = /^(\w+Error|Error):\s*(.*)$/;
const AT_PREFIX = /^at\s+/;

interface StackFrame {
  raw: string;
  functionName: string | null;
  filePath: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
  isInternal: boolean;
}

interface ParsedStackTrace {
  errorType: string | null;
  errorMessage: string;
  frames: StackFrame[];
  raw: string;
}

const parseStackFrame = (line: string): StackFrame => {
  const trimmed = line.trim();

  const wp = trimmed.match(STACK_FRAME_WITH_PARENS);
  if (wp) {
    const [, fn, fp, ln, cn] = wp;
    return {
      raw: trimmed,
      functionName: fn ?? null,
      filePath: fp ?? null,
      lineNumber: ln ? parseInt(ln, 10) : null,
      columnNumber: cn ? parseInt(cn, 10) : null,
      isInternal:
        (fp?.includes("node_modules") ?? false) ||
        (fp?.startsWith("node:") ?? false) ||
        (fp?.includes("internal/") ?? false),
    };
  }

  const wf = trimmed.match(STACK_FRAME_WITHOUT_FN);
  if (wf) {
    const [, fp, ln, cn] = wf;
    return {
      raw: trimmed,
      functionName: null,
      filePath: fp ?? null,
      lineNumber: ln ? parseInt(ln, 10) : null,
      columnNumber: cn ? parseInt(cn, 10) : null,
      isInternal:
        (fp?.includes("node_modules") ?? false) ||
        (fp?.startsWith("node:") ?? false) ||
        (fp?.includes("internal/") ?? false),
    };
  }

  return {
    raw: trimmed,
    functionName: null,
    filePath: null,
    lineNumber: null,
    columnNumber: null,
    isInternal:
      trimmed.includes("node_modules") || trimmed.includes("node:"),
  };
};

const parseStackTrace = (trace: string): ParsedStackTrace => {
  const lines = trace.split("\n").filter((l) => l.trim());
  if (lines.length === 0)
    return { errorType: null, errorMessage: trace, frames: [], raw: trace };

  const first = lines[0].trim();
  let errorType: string | null = null;
  let errorMessage = first;

  const em = first.match(ERROR_TYPE_REGEX);
  if (em) {
    errorType = em[1];
    errorMessage = em[2] || "";
  }

  const frames = lines
    .slice(1)
    .filter((l) => l.trim().startsWith("at "))
    .map(parseStackFrame);

  return { errorType, errorMessage, frames, raw: trace };
};

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface StackTraceContextValue {
  trace: ParsedStackTrace;
  raw: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onFilePathClick?: (
    filePath: string,
    line?: number,
    column?: number
  ) => void;
}

const StackTraceContext = createContext<StackTraceContextValue | null>(
  null
);

const useStackTrace = () => {
  const context = useContext(StackTraceContext);
  if (!context) {
    throw new Error(
      "StackTrace components must be used within StackTrace"
    );
  }
  return context;
};

/* ------------------------------------------------------------------ */
/*  StackTrace (root)                                                  */
/* ------------------------------------------------------------------ */

export type StackTraceProps = ComponentProps<"div"> & {
  trace: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onFilePathClick?: (
    filePath: string,
    line?: number,
    column?: number
  ) => void;
};

export const StackTrace = memo(
  ({
    trace,
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    onFilePathClick,
    children,
    ...props
  }: StackTraceProps) => {
    const [isOpen = false, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    const parsedTrace = useMemo(() => parseStackTrace(trace), [trace]);

    const ctx = useMemo(
      () => ({
        trace: parsedTrace,
        raw: trace,
        isOpen,
        setIsOpen,
        onFilePathClick,
      }),
      [parsedTrace, trace, isOpen, setIsOpen, onFilePathClick]
    );

    return (
      <StackTraceContext.Provider value={ctx}>
        <div
          className={cn(
            "rounded-lg border border-destructive/20 bg-destructive/5 text-sm",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </StackTraceContext.Provider>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  StackTraceHeader                                                   */
/* ------------------------------------------------------------------ */

export type StackTraceHeaderProps = ComponentProps<typeof CollapsibleTrigger>;

export const StackTraceHeader = memo(
  ({ className, children, ...props }: StackTraceHeaderProps) => {
    const { isOpen, setIsOpen } = useStackTrace();

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 cursor-pointer select-none",
            "text-destructive hover:bg-destructive/10 rounded-t-lg transition-colors",
            className
          )}
          {...props}
        >
          <AlertTriangleIcon className="size-4 shrink-0" />
          <span className="flex-1 text-left text-xs font-semibold">
            {children ?? "Stack Trace"}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
      </Collapsible>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  StackTraceError                                                    */
/* ------------------------------------------------------------------ */

export type StackTraceErrorProps = ComponentProps<"div">;

export const StackTraceError = memo(
  ({ className, children, ...props }: StackTraceErrorProps) => {
    const { trace } = useStackTrace();
    return (
      <div className={cn("px-3 py-2", className)} {...props}>
        {children ?? (
          <p className="text-xs font-medium text-destructive">
            {trace.errorType && (
              <span className="font-bold">{trace.errorType}: </span>
            )}
            {trace.errorMessage}
          </p>
        )}
      </div>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  StackTraceContent                                                  */
/* ------------------------------------------------------------------ */

export type StackTraceContentProps = ComponentProps<typeof CollapsibleContent>;

export const StackTraceContent = memo(
  ({ className, children, ...props }: StackTraceContentProps) => {
    const { isOpen, setIsOpen } = useStackTrace();
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent
          className={cn("px-3 pb-3", className)}
          {...props}
        >
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  StackTraceFrames                                                   */
/* ------------------------------------------------------------------ */

export type StackTraceFramesProps = ComponentProps<"div"> & {
  showInternalFrames?: boolean;
};

export const StackTraceFrames = memo(
  ({
    className,
    showInternalFrames = true,
    ...props
  }: StackTraceFramesProps) => {
    const { trace, onFilePathClick } = useStackTrace();
    const framesToShow = showInternalFrames
      ? trace.frames
      : trace.frames.filter((f) => !f.isInternal);

    return (
      <div
        className={cn(
          "font-mono text-[11px] space-y-0.5 text-muted-foreground",
          className
        )}
        {...props}
      >
        {framesToShow.map((frame, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-1 flex-wrap",
              frame.isInternal && "opacity-50"
            )}
          >
            <span className="text-muted-foreground/60">at </span>
            {frame.functionName && (
              <span className="text-foreground/80">
                {frame.functionName}{" "}
              </span>
            )}
            {frame.filePath && (
              <>
                <span>(</span>
                <button
                  className="text-primary hover:underline cursor-pointer"
                  onClick={() =>
                    frame.filePath &&
                    onFilePathClick?.(
                      frame.filePath,
                      frame.lineNumber ?? undefined,
                      frame.columnNumber ?? undefined
                    )
                  }
                  type="button"
                >
                  {frame.filePath}
                  {frame.lineNumber !== null && `:${frame.lineNumber}`}
                  {frame.columnNumber !== null &&
                    `:${frame.columnNumber}`}
                </button>
                <span>)</span>
              </>
            )}
            {!frame.filePath && !frame.functionName && (
              <span>{frame.raw.replace(AT_PREFIX, "")}</span>
            )}
          </div>
        ))}
        {framesToShow.length === 0 && (
          <p className="italic text-muted-foreground/60">
            No stack frames
          </p>
        )}
      </div>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  StackTraceCopyButton                                               */
/* ------------------------------------------------------------------ */

export type StackTraceCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const StackTraceCopyButton = memo(
  ({
    onCopy,
    onError,
    timeout = 2000,
    className,
    children,
    ...props
  }: StackTraceCopyButtonProps) => {
    const [isCopied, setIsCopied] = useState(false);
    const { raw } = useStackTrace();

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(raw);
        setIsCopied(true);
        onCopy?.();
        setTimeout(() => setIsCopied(false), timeout);
      } catch (error) {
        onError?.(error as Error);
      }
    };

    const Icon = isCopied ? CheckIcon : CopyIcon;

    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-7", className)}
        onClick={copyToClipboard}
        {...props}
      >
        {children ?? <Icon className="size-3.5" />}
      </Button>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  Display names                                                      */
/* ------------------------------------------------------------------ */

StackTrace.displayName = "StackTrace";
StackTraceHeader.displayName = "StackTraceHeader";
StackTraceError.displayName = "StackTraceError";
StackTraceContent.displayName = "StackTraceContent";
StackTraceFrames.displayName = "StackTraceFrames";
StackTraceCopyButton.displayName = "StackTraceCopyButton";
