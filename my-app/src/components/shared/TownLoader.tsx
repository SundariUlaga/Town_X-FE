import { motion, useReducedMotion } from "motion/react";

import { TownExchangeLogo } from "@/components/brand/TownExchangeLogo";
import { cn } from "@/lib/utils";

const SIZE_PX = {
  xs: 28,
  sm: 40,
  md: 64,
  lg: 88,
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

const SKYLINE = [0.35, 0.55, 0.8, 0.45, 0.95, 0.6, 0.75, 0.4, 0.7];

/** Creative branded loader — orbiting rings + living skyline around the TOWN-X mark. */
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
  const showSkyline = size === "md" || size === "lg";
  const orbitPad = showSkyline ? Math.round(px * 0.22) : Math.round(px * 0.12);

  const loader = (
    <div
      className={cn("relative inline-flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <div
        className="relative"
        style={{ width: px + orbitPad * 2, height: px + orbitPad * 2 }}
      >
        {/* Soft ambient glow */}
        <motion.div
          className="absolute inset-[12%] rounded-full bg-brand-500/20 blur-xl"
          animate={reduceMotion ? undefined : { scale: [1, 1.2, 1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Outer dashed orbit */}
        <motion.div
          className="absolute inset-0 rounded-full border border-dashed border-brand-400/45"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner counter-orbit */}
        <motion.div
          className="absolute inset-[10%] rounded-full border border-brand-300/35"
          animate={reduceMotion ? undefined : { rotate: -360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        {/* Orbiting pin dots */}
        {!reduceMotion &&
          [0, 120, 240].map((deg) => (
            <motion.span
              key={deg}
              className="absolute left-1/2 top-1/2 size-1.5 -ml-0.5 -mt-0.5 rounded-full bg-brand-500 shadow-soft-sm"
              style={{ transformOrigin: `0 ${px / 2 + orbitPad * 0.55}px` }}
              animate={{ rotate: [deg, deg + 360] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
            />
          ))}

        {/* Living skyline under the mark */}
        {showSkyline ? (
          <div
            className="absolute bottom-[14%] left-1/2 flex -translate-x-1/2 items-end gap-0.5"
            aria-hidden
          >
            {SKYLINE.map((h, i) => (
              <motion.span
                key={i}
                className="w-1 rounded-t-sm bg-gradient-to-t from-brand-600 to-brand-300"
                style={{ height: Math.max(6, Math.round(px * 0.22 * h)) }}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        scaleY: [0.55, 1, 0.7, 1],
                        opacity: [0.55, 1, 0.75, 1],
                      }
                }
                transition={{
                  duration: 1.35,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.08,
                }}
              />
            ))}
          </div>
        ) : null}

        {/* Brand mark */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ paddingBottom: showSkyline ? px * 0.12 : 0 }}
          animate={reduceMotion ? undefined : { scale: [0.96, 1.04, 0.96] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <TownExchangeLogo size={Math.round(px * (showSkyline ? 0.58 : 0.72))} variant="mark" />
        </motion.div>
      </div>

      {showLabel && (
        <motion.p
          className="max-w-[16rem] text-center text-xs font-medium tracking-wide text-muted-foreground sm:text-sm"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {label}
          <motion.span
            className="inline-block"
            animate={reduceMotion ? undefined : { opacity: [0.15, 1, 0.15] }}
            transition={{ duration: 1.3, repeat: Infinity }}
          >
            …
          </motion.span>
        </motion.p>
      )}
    </div>
  );

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
