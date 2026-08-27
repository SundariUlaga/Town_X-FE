import type { ReactNode } from "react";
import { motion } from "motion/react";

type ContextualEmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
};

export function ContextualEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = "",
}: ContextualEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-auto max-w-md rounded-card border border-border bg-card px-6 py-10 text-center shadow-soft-sm ${className}`}
    >
      {icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-control bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft-md transition-colors hover:bg-brand-700"
        >
          {actionLabel}
        </button>
      ) : null}
    </motion.div>
  );
}

export default ContextualEmptyState;
