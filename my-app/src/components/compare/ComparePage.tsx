import { useQueries } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, X } from "lucide-react";

import AppNavbar from "@/components/shared/AppNavbar";
import { useCompare } from "@/context/CompareContext";
import { propertyAPI } from "@/services/api";
import { formatInr, formatPricePerSqft } from "@/lib/finance";
import type { Property } from "@/types/property";
import TownLoader from "@/components/shared/TownLoader";
import { listingVerificationLabel, listingVerificationTier } from "@/lib/listingVerification";
import { cn } from "@/lib/utils";

const ROWS: { key: string; label: string; get: (p: Property) => string }[] = [
  {
    key: "price",
    label: "Price",
    get: (p) =>
      `${formatInr(p.expected_price, { compact: true })}${
        p.property_for === "Rent/Lease" ? "/mo" : ""
      }`,
  },
  {
    key: "pps",
    label: "₹ / sqft",
    get: (p) =>
      p.property_for === "Rent/Lease"
        ? "—"
        : formatPricePerSqft(p.expected_price, p.carpet_area, p.built_up_area) || "—",
  },
  { key: "for", label: "For", get: (p) => p.property_for || "—" },
  { key: "bhk", label: "BHK", get: (p) => p.bhk_type || "—" },
  { key: "type", label: "Type", get: (p) => p.apartment_type || "—" },
  { key: "area", label: "Carpet", get: (p) => (p.carpet_area ? `${p.carpet_area} sqft` : "—") },
  { key: "bath", label: "Baths", get: (p) => String(p.bathrooms ?? "—") },
  { key: "furnish", label: "Furnishing", get: (p) => p.furnishing_status || "—" },
  { key: "floor", label: "Floor", get: (p) => `${p.floor}/${p.total_floors}` },
  { key: "age", label: "Age", get: (p) => p.property_age || "—" },
  { key: "parking", label: "Parking", get: (p) => String(p.parking ?? 0) },
  {
    key: "loc",
    label: "Locality",
    get: (p) => [p.locality, p.city].filter(Boolean).join(", ") || "—",
  },
  { key: "posted", label: "Posted by", get: (p) => p.user_type || "—" },
  {
    key: "verify",
    label: "Listing verification",
    get: (p) => listingVerificationLabel(p.verification_tier),
  },
];

export default function ComparePage() {
  const navigate = useNavigate();
  const { ids, remove, clear } = useCompare();

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["property", id],
      queryFn: () => propertyAPI.getPropertyById(id) as Promise<Property>,
      staleTime: 0,
      refetchOnMount: "always" as const,
    })),
  });

  const loading = queries.some((q) => q.isPending);
  const properties = queries.map((q) => q.data).filter(Boolean) as Property[];

  return (
    <div className="min-h-screen bg-[color:var(--bg-page)] pb-16">
      <AppNavbar variant="inner" backTo="/property-feed" maxWidth="full" showLocation />

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-2 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-brand-700"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-gray-900">
              <Scale className="size-6 text-brand-600" />
              Compare properties
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Side-by-side view using your saved compare list (up to 3).
            </p>
          </div>
          {ids.length > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="text-sm font-medium text-gray-600 hover:text-rose-600"
            >
              Clear all
            </button>
          ) : null}
        </div>

        {ids.length === 0 ? (
          <div className="rounded-card border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="text-sm text-gray-700">No listings selected yet.</p>
            <p className="mt-1 text-xs text-gray-500">
              On Browse or Home, use the compare (scale) icon on a card.
            </p>
            <Link
              to="/property-feed"
              className="mt-4 inline-flex rounded-control bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Browse listings
            </Link>
          </div>
        ) : loading && properties.length === 0 ? (
          <TownLoader label="Loading comparison" />
        ) : (
          <div className="overflow-x-auto rounded-card border border-border bg-white shadow-soft-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="sticky left-0 z-[1] bg-muted/40 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Feature
                  </th>
                  {properties.map((p) => (
                    <th key={p.id} className="min-w-[11rem] px-3 py-3 text-left align-top">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/property/${p.id}`}
                          className="line-clamp-2 font-semibold text-gray-900 hover:text-brand-700"
                        >
                          {p.bhk_type} {p.apartment_type}
                        </Link>
                        <button
                          type="button"
                          aria-label="Remove from compare"
                          onClick={() => remove(p.id)}
                          className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                      {p.images?.[0]?.url ? (
                        <img
                          src={p.images[0].url}
                          alt=""
                          className="mt-2 h-24 w-full rounded-control object-cover"
                        />
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-border/70 last:border-0">
                    <th className="sticky left-0 bg-white px-3 py-2.5 text-left text-xs font-medium text-gray-500">
                      {row.label}
                    </th>
                    {properties.map((p) => {
                      const isVerifyRow = row.key === "verify";
                      const tone = isVerifyRow ? listingVerificationTier(p.verification_tier) : "none";
                      return (
                      <td
                        key={`${p.id}-${row.key}`}
                        className={cn(
                          "px-3 py-2.5",
                          isVerifyRow && tone === "verified" && "font-semibold text-emerald-700",
                          isVerifyRow && tone === "pending" && "font-medium text-amber-700",
                          isVerifyRow && tone === "none" && "text-gray-500",
                          !isVerifyRow && "text-gray-900"
                        )}
                      >
                        {row.get(p)}
                      </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
