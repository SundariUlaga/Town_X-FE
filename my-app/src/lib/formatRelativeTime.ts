export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "Posted just now";
  if (diffMin < 60) return `Posted ${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHour < 24) return `Posted ${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  if (diffDay < 7) return `Posted ${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  if (diffWeek < 5) return `Posted ${diffWeek} week${diffWeek === 1 ? "" : "s"} ago`;
  if (diffMonth < 12) return `Posted ${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;
  return `Posted ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
}
