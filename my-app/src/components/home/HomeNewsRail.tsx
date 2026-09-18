import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Newspaper } from "lucide-react";

import { newsAPI } from "@/services/newsAPI";
import { cn } from "@/lib/utils";

function plainSummary(value?: string | null) {
  if (!value) return null;
  const text = value
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

function formatWhen(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

type HomeNewsRailProps = {
  className?: string;
};

export function HomeNewsRail({ className }: HomeNewsRailProps) {
  const query = useQuery({
    queryKey: ["news-headlines", 4],
    queryFn: () => newsAPI.list(4),
    staleTime: 5 * 60_000,
  });

  const items = query.data || [];

  return (
    <section className={cn("space-y-2", className)}>
      <h2 className="flex items-center gap-2 font-display text-base font-semibold text-gray-900">
        <Newspaper className="size-4 text-brand-600" />
        Market news
      </h2>
      <p className="text-[11px] leading-snug text-gray-500">
        Cached daily · Chennai / TN / RERA
      </p>

      {query.isPending ? (
        <p className="text-xs text-gray-500">Loading headlines…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-500">No headlines yet. Check back after the daily refresh.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const when = formatWhen(item.published_at);
            const summary = plainSummary(item.summary);
            return (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-control border border-border bg-card px-3 py-2 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <p className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-brand-800">
                    {item.title}
                  </p>
                  {item.category ? (
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                      {item.category}
                    </p>
                  ) : null}
                  {summary ? (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">{summary}</p>
                  ) : null}
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-gray-400">
                    <span>{item.source_name || "Source"}</span>
                    {when ? <span>· {when}</span> : null}
                    <ExternalLink className="ml-auto size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </p>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default HomeNewsRail;
