import { BookmarkIcon, type LucideProps } from "lucide-react";
import type { ComponentProps, HTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Checkpoint                                                         */
/* ------------------------------------------------------------------ */

export type CheckpointProps = HTMLAttributes<HTMLDivElement>;

export const Checkpoint = ({
  className,
  children,
  ...props
}: CheckpointProps) => (
  <div
    className={cn(
      "flex items-center gap-3 py-2 text-muted-foreground",
      className
    )}
    {...props}
  >
    <Separator className="flex-1" />
    {children}
    <Separator className="flex-1" />
  </div>
);

/* ------------------------------------------------------------------ */
/*  CheckpointIcon                                                     */
/* ------------------------------------------------------------------ */

export type CheckpointIconProps = LucideProps;

export const CheckpointIcon = ({
  className,
  children,
  ...props
}: CheckpointIconProps) =>
  children ? (
    <>{children}</>
  ) : (
    <BookmarkIcon className={cn("size-3.5 shrink-0", className)} {...props} />
  );

/* ------------------------------------------------------------------ */
/*  CheckpointTrigger                                                  */
/* ------------------------------------------------------------------ */

export type CheckpointTriggerProps = ComponentProps<typeof Button> & {
  tooltip?: string;
};

export const CheckpointTrigger = ({
  children,
  className,
  variant = "ghost",
  size = "sm",
  tooltip,
  ...props
}: CheckpointTriggerProps) =>
  tooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground",
            className
          )}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  ) : (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
