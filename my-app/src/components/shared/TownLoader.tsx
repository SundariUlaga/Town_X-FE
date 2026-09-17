import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";

import { TownExchangeLogo } from "@/components/brand/TownExchangeLogo";
import { cn } from "@/lib/utils";

const DOT_PX = {
  xs: 7,
  sm: 9,
  md: 12,
  lg: 14,
} as const;

const DOT_GAP = {
  xs: 5,
  sm: 7,
  md: 9,
  lg: 11,
} as const;

const DOT_COLORS = ["bg-brand-500", "bg-secondary-500", "bg-brand-400"] as const;

export type TownLoaderSize = keyof typeof DOT_PX;

type TownLoaderProps = {
  size?: TownLoaderSize;
  label?: string;
  className?: string;
  /** Centers loader in a full viewport shell */
  fullScreen?: boolean;
  /** Minimum height wrapper for section loads; omit for inline use */
  minHeight?: string;
  /** Blocks the whole screen (use for uploads / submits) */
  overlay?: boolean;
};

function PoppingDots({ size }: { size: TownLoaderSize }) {
  const reduceMotion = useReducedMotion() ?? false;
  const px = DOT_PX[size];
  const lift = Math.round(px * 1.45);

  return (
    <div className="flex items-end" style={{ gap: DOT_GAP[size] }} aria-hidden>
      {DOT_COLORS.map((color, index) => (
        <motion.span
          key={color}
          className={cn("rounded-full shadow-soft-sm", color)}
          style={{ width: px, height: px }}
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, -lift, 0],
                  scale: [0.85, 1.28, 0.85],
                  opacity: [0.55, 1, 0.55],
                }
          }
          transition={{
            duration: 0.52,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.14,
          }}
        />
      ))}
    </div>
  );
}

/** Branded loader — popping dots, with an optional full-screen overlay. */
export function TownLoader({
  size = "md",
  label,
  className,
  fullScreen = false,
  minHeight,
  overlay = false,
}: TownLoaderProps) {
  const showLabel = Boolean(label) && (overlay || size !== "xs");
  const showMark = overlay || size === "md" || size === "lg";
  const dotsSize: TownLoaderSize = overlay ? "lg" : size;
  const markSize = overlay || size === "lg" ? 40 : 32;

  const loader = (
    <div
      className={cn("relative inline-flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label ?? "Loading"}
    >
      {showMark ? <TownExchangeLogo size={markSize} variant="mark" className="rounded-lg" /> : null}
      <PoppingDots size={dotsSize} />
      {showLabel ? (
        <p className="max-w-[16rem] text-center text-xs font-medium tracking-wide text-muted-foreground sm:text-sm">
          {label}
        </p>
      ) : null}
    </div>
  );

  if (overlay) {
    const node = (
      <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]">
        <div className="flex min-w-[12rem] flex-col items-center rounded-card bg-white px-8 py-7 shadow-soft-lg">
          {loader}
        </div>
      </div>
    );
    if (typeof document === "undefined") return node;
    return createPortal(node, document.body);
  }

  if (fullScreen) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        {loader}
      </div>
    );
  }

  if (minHeight) {
    return (
      <div className="flex w-full items-center justify-center px-4" style={{ minHeight }}>
        {loader}
      </div>
    );
  }

  return loader;
}

export default TownLoader;
