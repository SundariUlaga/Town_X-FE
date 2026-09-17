import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Building2, Plus } from "lucide-react";

import { propertyAPI } from "@/services/api";
import { formatInr } from "@/lib/finance";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/property";

function statusBadgeClass(status?: string) {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-100 text-emerald-800";
    case "PENDING_REVIEW":
      return "bg-amber-100 text-amber-800";
    case "CHANGES_REQUESTED":
      return "bg-orange-100 text-orange-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function statusLabel(status?: string) {
  return (status || "PUBLISHED").replace(/_/g, " ");
}

type YourListingsSectionProps = {
  onPostProperty?: () => void;
};

export function YourListingsSection({ onPostProperty }: YourListingsSectionProps) {
  const navigate = useNavigate();
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["my-properties"],
    queryFn: () => propertyAPI.getMyProperties(),
  });

  const listings = (Array.isArray(properties) ? properties : []) as Property[];

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-gray-900">
            Your listings
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">Status, review notes, and what buyers can see</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/owner/dashboard")}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          See all
        </button>
      </div>

      {isLoading ? (
        <p className="py-8 text-sm text-gray-500">Loading your listings…</p>
      ) : listings.length === 0 ? (
        <button
          type="button"
          onClick={onPostProperty}
          className="flex w-full items-center gap-3 rounded-card border border-dashed border-secondary-300 bg-secondary-50/70 px-4 py-4 text-left transition-colors hover:bg-secondary-50"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-white">
            <Plus className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-gray-900">Post your first listing</span>
            <span className="mt-0.5 block text-xs text-secondary-800">
              Track pending, published, and requested changes here.
            </span>
          </span>
        </button>
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-hide">
          {listings.slice(0, 8).map((property) => {
            const title =
              property.property_type === "Commercial"
                ? property.commercial_subtype || property.apartment_type || "Commercial"
                : `${property.bhk_type || ""} ${property.apartment_type || "Property"}`.trim();
            const image = property.images?.[0]?.url;
            return (
              <button
                key={property.id}
                type="button"
                onClick={() => navigate(`/property/${property.id}`, { state: { from: "/home" } })}
                className="w-[min(72vw,240px)] max-w-[240px] shrink-0 overflow-hidden rounded-card border border-gray-200 bg-white text-left shadow-soft-sm transition-shadow hover:shadow-soft-md"
              >
                <div className="relative h-28 bg-gray-100">
                  {image ? (
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <Building2 className="size-8" />
                    </div>
                  )}
                  <span
                    className={cn(
                      "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                      statusBadgeClass(property.status)
                    )}
                  >
                    {statusLabel(property.status)}
                  </span>
                </div>
                <div className="space-y-1 p-3">
                  <p className="line-clamp-1 text-sm font-semibold text-gray-900">{title}</p>
                  <p className="line-clamp-1 text-xs text-gray-500">
                    {property.locality}, {property.city}
                  </p>
                  <p className="font-display text-base font-semibold text-brand-700">
                    {formatInr(property.expected_price, { compact: true })}
                  </p>
                  {property.admin_notes ? (
                    <p className="line-clamp-2 text-[11px] text-orange-800">
                      {property.admin_notes}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default YourListingsSection;
