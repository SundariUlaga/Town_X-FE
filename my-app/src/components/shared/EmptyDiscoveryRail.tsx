import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { propertyAPI } from "@/services/api";
import { PropertyCard } from "@/components/PropertyCard";
import { useLocationContext } from "@/context/LocationContext";
import { getLocationCityFilter } from "@/lib/locationUtils";
import { useCompare } from "@/context/CompareContext";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/property";

type EmptyDiscoveryRailProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  fromPath?: string;
};

/** Turns empty Favourites / Enquiries into continued browsing. */
export function EmptyDiscoveryRail({
  title = "Recommended for you",
  subtitle = "Fresh listings to explore while you build your list",
  className,
  fromPath = "/home",
}: EmptyDiscoveryRailProps) {
  const navigate = useNavigate();
  const { selectedLocation } = useLocationContext();
  const city = getLocationCityFilter(selectedLocation);
  const { toggle, isComparing } = useCompare();

  const query = useQuery({
    queryKey: ["empty-discovery", city || "all"],
    queryFn: async () => {
      const rows = await propertyAPI.getProperties({
        limit: 8,
        ...(city ? { city } : {}),
      });
      return (Array.isArray(rows) ? rows : []) as Property[];
    },
    staleTime: 60_000,
  });

  const items = query.data || [];
  if (query.isPending || items.length === 0) return null;

  return (
    <section className={cn("mt-10 min-w-0", className)}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-gray-900">
            <Sparkles className="size-5 text-brand-600" />
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/property-feed")}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          See all
        </button>
      </div>
      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-hide">
        {items.slice(0, 6).map((property) => (
          <div key={property.id} className="w-[min(72vw,260px)] max-w-[260px] shrink-0">
            <PropertyCard
              property={property}
              className="w-full"
              onOpenDetails={(id) => navigate(`/property/${id}`, { state: { from: fromPath } })}
              onCompareToggle={toggle}
              isComparing={isComparing(property.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default EmptyDiscoveryRail;
