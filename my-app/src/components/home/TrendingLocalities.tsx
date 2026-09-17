import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";

import { propertyAPI } from "@/services/api";
import { useLocationContext } from "@/context/LocationContext";
import { getLocationCityFilter } from "@/lib/locationUtils";
import { cn } from "@/lib/utils";

type LocalityInsight = {
  locality: string;
  city?: string | null;
  listing_count: number;
  avg_price?: number | null;
};

type TrendingLocalitiesProps = {
  className?: string;
};

/** Compact locality tags — separate from Sponsored cards. */
export function TrendingLocalities({ className }: TrendingLocalitiesProps) {
  const navigate = useNavigate();
  const { selectedLocation, locationLabel } = useLocationContext();
  const city = getLocationCityFilter(selectedLocation);

  const query = useQuery({
    queryKey: ["trending-localities", city || "all"],
    queryFn: async () => {
      const data = await propertyAPI.getMarketInsights({
        ...(city ? { city } : {}),
        limit: 10,
      });
      return (data?.localities || []) as LocalityInsight[];
    },
    staleTime: 120_000,
  });

  const localities = query.data || [];

  if (query.isPending) {
    return (
      <section className={cn("min-w-0", className)}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Trending localities
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="h-7 w-20 animate-pulse rounded-full bg-gray-100" />
          ))}
        </div>
      </section>
    );
  }

  if (localities.length === 0) return null;

  return (
    <section className={cn("min-w-0", className)}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Trending localities{locationLabel ? ` · ${locationLabel}` : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {localities.map((row) => (
          <button
            key={`${row.city}-${row.locality}`}
            type="button"
            onClick={() =>
              navigate("/property-feed", {
                state: { query: row.locality },
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-soft-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
          >
            <MapPin className="size-3 text-brand-600" />
            {row.locality}
            <span className="text-[10px] font-semibold text-gray-400">{row.listing_count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default TrendingLocalities;
