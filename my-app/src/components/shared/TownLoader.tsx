import { motion, useReducedMotion } from "motion/react";

import { TownExchangeLogo } from "@/components/brand/TownExchangeLogo";
import { cn } from "@/lib/utils";

const SIZE_PX = {
  xs: 20,
  sm: 32,
  md: 48,
  lg: 64,
} as const;

export type TownLoaderSize = keyof typeof SIZE_PX;

type TownLoaderProps = {
  size?: TownLoaderSize;
  label?: string;
  className?: string;
  /** Centers loader in a full viewport shell */
  fullScreen?: boolean;
  /** Minimum height wrapper for section loads; omit for inline use */
  minHeight?: string;
};

/** Branded loader using the TOWN-X logo. */
export function TownLoader({
  size = "md",
  label,
  className,
  fullScreen = false,
  minHeight,
}: TownLoaderProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const px = SIZE_PX[size];
  const showLabel = Boolean(label) && size !== "xs";

  const loader = (
    <div
      className={cn("relative inline-flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <div className="relative" style={{ width: px, height: px }}>
        <motion.div
          className="absolute inset-0 rounded-full bg-brand-500/15 blur-md"
          animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute inset-0 rounded-full border border-dashed border-brand-400/50"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={reduceMotion ? undefined : { scale: [0.96, 1.04, 0.96], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <TownExchangeLogo size={Math.round(px * 0.72)} variant="mark" />
        </motion.div>
      </div>

      {showLabel && (
        <motion.p
          className="text-xs font-medium tracking-wide text-muted-foreground"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {label}
          <motion.span
            className="inline-block"
            animate={reduceMotion ? undefined : { opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            …
          </motion.span>
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">{loader}</div>
    );
  }

  if (minHeight) {
    return (
      <div className="flex w-full items-center justify-center" style={{ minHeight }}>
        {loader}
      </div>
    );
  }

  return loader;
}

export default TownLoader;
