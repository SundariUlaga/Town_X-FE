export const AD_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  PENDING_REVIEW: { label: "Pending review", className: "bg-amber-100 text-amber-800" },
  CHANGES_REQUESTED: { label: "Changes requested", className: "bg-orange-100 text-orange-800" },
  APPROVED: { label: "Approved", className: "bg-blue-100 text-blue-800" },
  PUBLISHED: { label: "Live", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
  EXPIRED: { label: "Expired", className: "bg-gray-100 text-gray-600" },
};

export function formatAdDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
