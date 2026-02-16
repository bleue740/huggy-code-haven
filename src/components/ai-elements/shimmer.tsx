import { motion } from "framer-motion";
import { type CSSProperties, type ElementType, memo, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface ShimmerProps {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

const ShimmerComponent = ({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
}: ShimmerProps) => {
  const MotionComponent = motion(Component);
  const dynamicSpread = useMemo(() => (children?.length ?? 0) * spread, [children, spread]);

  return (
    <MotionComponent
      className={cn(
        "relative inline-block bg-clip-text text-transparent",
        "bg-[length:250%_100%] bg-[linear-gradient(90deg,hsl(var(--muted-foreground))_40%,hsl(var(--foreground)),hsl(var(--muted-foreground))_60%)]",
        className
      )}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
      }}
      style={
        {
          "--spread": dynamicSpread,
        } as CSSProperties
      }
    >
      {children}
    </MotionComponent>
  );
};

export const Shimmer = memo(ShimmerComponent);
Shimmer.displayName = "Shimmer";
