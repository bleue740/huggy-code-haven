import {
  BrainIcon,
  ChevronDownIcon,
  DotIcon,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { createContext, memo, useContext, useMemo } from "react";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface ChainOfThoughtContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ChainOfThoughtContext =
  createContext<ChainOfThoughtContextValue | null>(null);

const useChainOfThought = () => {
  const context = useContext(ChainOfThoughtContext);
  if (!context) {
    throw new Error(
      "ChainOfThought components must be used within ChainOfThought"
    );
  }
  return context;
};

/* ------------------------------------------------------------------ */
/*  ChainOfThought (root)                                              */
/* ------------------------------------------------------------------ */

export type ChainOfThoughtProps = ComponentProps<"div"> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ChainOfThought = memo(
  ({
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }: ChainOfThoughtProps) => {
    const [isOpen = false, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    const ctx = useMemo(
      () => ({ isOpen, setIsOpen }),
      [isOpen, setIsOpen]
    );

    return (
      <ChainOfThoughtContext.Provider value={ctx}>
        <div className={cn("relative", className)} {...props}>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            {children}
          </Collapsible>
        </div>
      </ChainOfThoughtContext.Provider>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  ChainOfThoughtHeader                                               */
/* ------------------------------------------------------------------ */

export type ChainOfThoughtHeaderProps = ComponentProps<"div">;

export const ChainOfThoughtHeader = memo(
  ({ className, children, ...props }: ChainOfThoughtHeaderProps) => {
    const { isOpen } = useChainOfThought();

    return (
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 cursor-pointer select-none",
            "rounded-lg px-3 py-2 text-sm font-medium",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            "transition-colors",
            className
          )}
          {...props}
        >
          <BrainIcon className="size-4 shrink-0" />
          <span className="flex-1 text-xs font-semibold">
            {children ?? "Chain of Thought"}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </CollapsibleTrigger>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  ChainOfThoughtContent                                              */
/* ------------------------------------------------------------------ */

export type ChainOfThoughtContentProps = ComponentProps<"div">;

export const ChainOfThoughtContent = memo(
  ({ className, children, ...props }: ChainOfThoughtContentProps) => {
    return (
      <CollapsibleContent>
        <div
          className={cn(
            "ml-2 border-l border-border pl-4 py-2 space-y-3",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </CollapsibleContent>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  ChainOfThoughtStep                                                 */
/* ------------------------------------------------------------------ */

export type ChainOfThoughtStepProps = ComponentProps<"div"> & {
  icon?: LucideIcon;
  iconClassName?: string;
  label: ReactNode;
  description?: ReactNode;
  status?: "complete" | "active" | "pending";
};

export const ChainOfThoughtStep = memo(
  ({
    className,
    icon: Icon = DotIcon,
    iconClassName,
    label,
    description,
    status = "complete",
    children,
    ...props
  }: ChainOfThoughtStepProps) => {
    const statusStyles = {
      complete: "text-muted-foreground",
      active: "text-foreground",
      pending: "text-muted-foreground/50",
    };

    return (
      <div className={cn("flex gap-3", statusStyles[status], className)} {...props}>
        <div className="flex flex-col items-center pt-0.5">
          <Icon className={cn("size-4 shrink-0", iconClassName)} />
          <div className="flex-1 w-px bg-border mt-1" />
        </div>
        <div className="flex-1 min-w-0 pb-3">
          <p className="text-xs font-medium leading-snug">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
          {children}
        </div>
      </div>
    );
  }
);

/* ------------------------------------------------------------------ */
/*  ChainOfThoughtSearchResults                                        */
/* ------------------------------------------------------------------ */

export type ChainOfThoughtSearchResultsProps = ComponentProps<"div">;

export const ChainOfThoughtSearchResults = memo(
  ({ className, ...props }: ChainOfThoughtSearchResultsProps) => (
    <div
      className={cn("flex flex-wrap gap-1.5 mt-2", className)}
      {...props}
    />
  )
);

/* ------------------------------------------------------------------ */
/*  ChainOfThoughtSearchResult                                         */
/* ------------------------------------------------------------------ */

export type ChainOfThoughtSearchResultProps = ComponentProps<typeof Badge>;

export const ChainOfThoughtSearchResult = memo(
  ({ className, children, ...props }: ChainOfThoughtSearchResultProps) => (
    <Badge
      variant="secondary"
      className={cn("text-[10px] font-normal", className)}
      {...props}
    >
      {children}
    </Badge>
  )
);

/* ------------------------------------------------------------------ */
/*  ChainOfThoughtImage                                                */
/* ------------------------------------------------------------------ */

export type ChainOfThoughtImageProps = ComponentProps<"div"> & {
  caption?: string;
};

export const ChainOfThoughtImage = memo(
  ({ className, children, caption, ...props }: ChainOfThoughtImageProps) => (
    <div className={cn("mt-2 space-y-1.5", className)} {...props}>
      <div className="rounded-lg overflow-hidden inline-block">{children}</div>
      {caption && (
        <p className="text-[11px] text-muted-foreground italic">{caption}</p>
      )}
    </div>
  )
);

/* ------------------------------------------------------------------ */
/*  Display names                                                      */
/* ------------------------------------------------------------------ */

ChainOfThought.displayName = "ChainOfThought";
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader";
ChainOfThoughtStep.displayName = "ChainOfThoughtStep";
ChainOfThoughtSearchResults.displayName = "ChainOfThoughtSearchResults";
ChainOfThoughtSearchResult.displayName = "ChainOfThoughtSearchResult";
ChainOfThoughtContent.displayName = "ChainOfThoughtContent";
ChainOfThoughtImage.displayName = "ChainOfThoughtImage";
