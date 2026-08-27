import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { motion } from "motion/react";

import { isNetworkError, isServerError } from "@/lib/apiErrors";
import { statusErrorBg, statusErrorBorder, statusErrorText } from "@/lib/statusStyles";

type LoadErrorStateProps = {
  title?: string;
  message: string;
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
};

export function LoadErrorState({
  title = "Something went wrong",
  message,
  error,
  onRetry,
  retryLabel = "Try again",
}: LoadErrorStateProps) {
  const Icon = isNetworkError(error) ? WifiOff : AlertCircle;
  const hint = isNetworkError(error)
    ? "Make sure the backend is running on port 8024."
    : isServerError(error)
      ? "Our servers hit a snag — retrying usually fixes this."
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-auto max-w-md rounded-card border ${statusErrorBorder} ${statusErrorBg}/80 px-6 py-10 text-center shadow-soft-sm`}
    >
      <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${statusErrorBg} ${statusErrorText}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold text-gray-900">{title}</h3>
      <p className={`mt-2 text-sm ${statusErrorText}`}>{message}</p>
      {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-control bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft-md transition-colors hover:bg-brand-700 hover:shadow-brand-glow"
        >
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </button>
      )}
    </motion.div>
  );
}

export default LoadErrorState;
