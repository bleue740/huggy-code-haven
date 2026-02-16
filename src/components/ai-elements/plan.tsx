import { ChevronsUpDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface PlanContextValue {
  isStreaming: boolean;
}

const PlanContext = createContext<PlanContextValue | null>(null);

const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("Plan components must be used within Plan");
  }
  return context;
};

/* ------------------------------------------------------------------ */
/*  Plan (root)                                                        */
/* ------------------------------------------------------------------ */

export type PlanProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
};

export const Plan = ({
  className,
  isStreaming = false,
  children,
  ...props
}: PlanProps) => (
  <PlanContext.Provider value={{ isStreaming }}>
    <Collapsible defaultOpen className={cn("", className)} {...props}>
      {children}
    </Collapsible>
  </PlanContext.Provider>
);

/* ------------------------------------------------------------------ */
/*  PlanHeader                                                         */
/* ------------------------------------------------------------------ */

export type PlanHeaderProps = ComponentProps<typeof CardHeader>;

export const PlanHeader = ({ className, ...props }: PlanHeaderProps) => (
  <CardHeader className={cn("pb-2", className)} {...props} />
);

/* ------------------------------------------------------------------ */
/*  PlanTitle                                                          */
/* ------------------------------------------------------------------ */

export type PlanTitleProps = Omit<ComponentProps<typeof CardTitle>, "children"> & {
  children: string;
};

export const PlanTitle = ({ children, ...props }: PlanTitleProps) => {
  const { isStreaming } = usePlan();
  return (
    <CardTitle className="text-sm" {...props}>
      {isStreaming ? <Shimmer>{children}</Shimmer> : children}
    </CardTitle>
  );
};

/* ------------------------------------------------------------------ */
/*  PlanDescription                                                    */
/* ------------------------------------------------------------------ */

export type PlanDescriptionProps = Omit<
  ComponentProps<typeof CardDescription>,
  "children"
> & {
  children: string;
};

export const PlanDescription = ({
  className,
  children,
  ...props
}: PlanDescriptionProps) => {
  const { isStreaming } = usePlan();
  return (
    <CardDescription
      className={cn("text-xs", className)}
      {...props}
    >
      {isStreaming ? <Shimmer>{children}</Shimmer> : children}
    </CardDescription>
  );
};

/* ------------------------------------------------------------------ */
/*  PlanContent                                                        */
/* ------------------------------------------------------------------ */

export type PlanContentProps = ComponentProps<typeof CardContent>;

export const PlanContent = (props: PlanContentProps) => (
  <CollapsibleContent>
    <CardContent {...props} />
  </CollapsibleContent>
);

/* ------------------------------------------------------------------ */
/*  PlanFooter                                                         */
/* ------------------------------------------------------------------ */

export type PlanFooterProps = ComponentProps<typeof CardFooter>;

export const PlanFooter = (props: PlanFooterProps) => (
  <CardFooter {...props} />
);

/* ------------------------------------------------------------------ */
/*  PlanTrigger                                                        */
/* ------------------------------------------------------------------ */

export type PlanTriggerProps = ComponentProps<typeof CollapsibleTrigger>;

export const PlanTrigger = ({ className, ...props }: PlanTriggerProps) => (
  <CollapsibleTrigger asChild>
    <Button variant="ghost" size="sm" className={cn("w-9 p-0", className)} {...props}>
      <ChevronsUpDownIcon className="size-4" />
      <span className="sr-only">Toggle plan</span>
    </Button>
  </CollapsibleTrigger>
);
