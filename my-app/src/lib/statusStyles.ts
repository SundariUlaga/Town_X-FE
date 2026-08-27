/** Semantic status tokens — use instead of ad-hoc red/green/yellow in status contexts. */

export const statusSuccessText = "text-status-success";
export const statusSuccessBg = "bg-status-success-bg";
export const statusSuccessBorder = "border-status-success/30";

export const statusWarningText = "text-status-warning";
export const statusWarningBg = "bg-status-warning-bg";

export const statusErrorText = "text-status-error";
export const statusErrorBg = "bg-status-error-bg";
export const statusErrorBorder = "border-status-error/25";

export const statusPendingText = "text-status-pending";
export const statusPendingBg = "bg-status-pending-bg";

export const requiredMark = "text-status-error";

export function statusBadgeClass(
  tone: "success" | "warning" | "error" | "pending"
): string {
  const map = {
    success: `${statusSuccessBg} ${statusSuccessText}`,
    warning: `${statusWarningBg} ${statusWarningText}`,
    error: `${statusErrorBg} ${statusErrorText}`,
    pending: `${statusPendingBg} ${statusPendingText}`,
  };
  return `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${map[tone]}`;
}
