import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { propertyAPI } from "@/services/api";
import { PropertyCard } from "@/components/PropertyCard";
import { useCompare } from "@/context/CompareContext";
import type { Property } from "@/types/property";
import { cn } from "@/lib/utils";

type SimilarPropertiesRailProps = {
  property: Property;
  className?: string;
};

export function SimilarPropertiesRail({ property, className }: SimilarPropertiesRailProps) {
  const navigate = useNavigate();
  const { toggle, isComparing } = useCompare();

  const query = useQuery({
    queryKey: [
      "similar-properties",
      property.id,
      property.city,
      property.locality,
      property.bhk_type,
      property.property_for,
    ],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: 12 };
      if (property.city) params.city = property.city;
      if (property.property_for) params.property_for = property.property_for;
      if (property.bhk_type && property.property_type !== "Commercial") {
        params.bhk_type = property.bhk_type;
      }
      if (property.property_type === "Commercial") {
        params.property_type = "Commercial";
      }
      const rows = await propertyAPI.getProperties(params);
      const list = (Array.isArray(rows) ? rows : []) as Property[];
      return list
        .filter((p) => p.id !== property.id)
        .sort((a, b) => {
          const aLocal = a.locality === property.locality ? 0 : 1;
          const bLocal = b.locality === property.locality ? 0 : 1;
          if (aLocal !== bLocal) return aLocal - bLocal;
          return Math.abs((a.expected_price || 0) - property.expected_price) -
            Math.abs((b.expected_price || 0) - property.expected_price);
        })
        .slice(0, 6);
    },
    staleTime: 60_000,
  });

  const items = query.data || [];
  if (query.isPending || items.length === 0) return null;

  const place = property.locality || property.city || "your area";

  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-gray-900">
            Similar properties in {place}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">Based on location, type, and price</p>
        </div>
        <button
          type="button"
          onClick={() =>
            navigate("/property-feed", {
              state: {
                query: property.locality || property.city,
                propertyFor: property.property_for,
                bhkType: property.property_type === "Commercial" ? undefined : property.bhk_type,
              },
            })
          }
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          See all
        </button>
      </div>
      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-hide">
        {items.map((p) => (
          <div key={p.id} className="w-[min(72vw,260px)] max-w-[260px] shrink-0">
            <PropertyCard
              property={p}
              className="w-full"
              onOpenDetails={(pid) =>
                navigate(`/property/${pid}`, { state: { from: `/property/${property.id}` } })
              }
              onCompareToggle={toggle}
              isComparing={isComparing(p.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default SimilarPropertiesRail;
