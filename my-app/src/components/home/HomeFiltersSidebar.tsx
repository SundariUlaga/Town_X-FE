import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";

import { propertyAPI } from "@/services/api";
import { useLocationContext } from "@/context/LocationContext";
import { getLocationFilterParams } from "@/lib/locationUtils";
import { cn } from "@/lib/utils";
import { LocationCascadeFilter } from "@/components/shared/LocationCascadeFilter";

export type HomeFilterValues = {
  minPrice: string;
  maxPrice: string;
  bhkType: string;
  propertyType: string;
  apartmentType: string;
  furnishing: string;
  amenities: string[];
  postedBy: string;
  propertyFor: string;
};

const BHK_OPTIONS = ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK"];
const PROPERTY_KINDS = [
  { label: "Apartment", value: "Apartment" },
  { label: "Villa", value: "Villa" },
  { label: "Plot", value: "Plot/Land" },
  { label: "Commercial", value: "Commercial" },
];
const FURNISHING = ["Furnished", "Semi-Furnished", "Unfurnished"];
const AMENITIES = ["Lift", "Parking", "Gym", "Swimming Pool", "Power Backup", "Security"];
const POSTED_BY = ["Owner", "Broker", "Builder"];

const PRICE_MIN = 0;
const PRICE_MAX = 5_00_00_000;

function formatLakhs(value: number) {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(value % 1_00_00_000 === 0 ? 0 : 1)} Cr`;
  if (value >= 1_00_000) return `₹${Math.round(value / 1_00_000)} L`;
  if (value <= 0) return "₹0";
  return `₹${value.toLocaleString("en-IN")}`;
}

const emptyFilters: HomeFilterValues = {
  minPrice: "",
  maxPrice: "",
  bhkType: "",
  propertyType: "",
  apartmentType: "",
  furnishing: "",
  amenities: [],
  postedBy: "",
  propertyFor: "",
};

type HomeFiltersSidebarProps = {
  className?: string;
  defaultPropertyFor?: string;
  showHeader?: boolean;
};

export function HomeFiltersSidebar({
  className,
  defaultPropertyFor = "",
  showHeader = true,
}: HomeFiltersSidebarProps) {
  const navigate = useNavigate();
  const { selectedLocation } = useLocationContext();
  const locationParams = getLocationFilterParams(selectedLocation);
  const [filters, setFilters] = useState<HomeFilterValues>({
    ...emptyFilters,
    propertyFor: defaultPropertyFor,
  });
  const [priceMax, setPriceMax] = useState(PRICE_MAX);
  const [debounced, setDebounced] = useState(filters);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(filters), 280);
    return () => window.clearTimeout(t);
  }, [filters]);

  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.bhkType) n += 1;
    if (filters.apartmentType || filters.propertyType) n += 1;
    if (filters.furnishing) n += 1;
    if (filters.amenities.length) n += 1;
    if (filters.postedBy) n += 1;
    if (filters.minPrice || filters.maxPrice || priceMax < PRICE_MAX) n += 1;
    if (filters.propertyFor) n += 1;
    return n;
  }, [filters, priceMax]);

  const countQuery = useQuery({
    queryKey: ["home-filter-count", locationParams, debounced, priceMax],
    queryFn: async () => {
      const kind = debounced.apartmentType;
      const params: Record<string, string | number> = { limit: 100, skip: 0, ...locationParams };
      if (debounced.propertyFor) params.property_for = debounced.propertyFor;
      if (kind === "Commercial") params.property_type = "Commercial";
      else if (debounced.propertyType) params.property_type = debounced.propertyType;
      if (kind && kind !== "Commercial") params.apartment_type = kind;
      if (debounced.bhkType) params.bhk_type = debounced.bhkType;
      if (debounced.minPrice) params.min_price = Number(debounced.minPrice);
      const max = debounced.maxPrice || (priceMax < PRICE_MAX ? String(priceMax) : "");
      if (max) params.max_price = Number(max);
      if (debounced.furnishing) params.furnishing_status = debounced.furnishing;
      const rows = await propertyAPI.getProperties(params);
      let list = Array.isArray(rows) ? rows : [];
      if (debounced.postedBy) {
        list = list.filter((p) => p.user_type === debounced.postedBy);
      }
      if (debounced.amenities.length) {
        list = list.filter((p) =>
          debounced.amenities.every((a) =>
            (p.amenities || []).some((x: string) => x.toLowerCase().includes(a.toLowerCase()))
          )
        );
      }
      return list.length;
    },
    staleTime: 20_000,
  });

  const resultCount = countQuery.data;
  const countLabel =
    resultCount == null
      ? "…"
      : resultCount >= 100
        ? "100+"
        : String(resultCount);

  const toggleAmenity = (amenity: string) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const applyFilters = () => {
    const kind = filters.apartmentType;
    navigate("/property-feed", {
      state: {
        propertyFor: filters.propertyFor || undefined,
        propertyType: kind === "Commercial" ? "Commercial" : filters.propertyType || undefined,
        apartmentType: kind && kind !== "Commercial" ? kind : undefined,
        bhkType: filters.bhkType || undefined,
        minPrice: filters.minPrice || (priceMax < PRICE_MAX ? "0" : undefined),
        maxPrice: filters.maxPrice || (priceMax < PRICE_MAX ? String(priceMax) : undefined),
        furnishing: filters.furnishing || undefined,
        amenities: filters.amenities,
        postedBy: filters.postedBy || undefined,
      },
    });
  };

  const clearFilters = () => {
    setFilters({ ...emptyFilters, propertyFor: defaultPropertyFor });
    setPriceMax(PRICE_MAX);
  };

  const chipClass = (selected: boolean) =>
    cn(
      "rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors",
      selected
        ? "border-brand-600 bg-brand-50 text-brand-800"
        : "border-border bg-card text-gray-700 hover:border-brand-300"
    );

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col rounded-none border-0 bg-transparent lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]",
        className
      )}
    >
      {showHeader ? (
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-gray-900">
          <SlidersHorizontal className="size-4 text-brand-600" />
          Filters
        </h2>
        {activeCount > 0 ? (
          <button type="button" onClick={clearFilters} className="text-xs font-medium text-brand-700 hover:underline">
            Clear ({activeCount})
          </button>
        ) : null}
      </div>
      ) : activeCount > 0 ? (
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={clearFilters} className="text-xs font-medium text-brand-700 hover:underline">
            Clear ({activeCount})
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-3 text-sm lg:pr-1">
        <LocationCascadeFilter />

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Price range</p>
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={50_000}
            value={priceMax}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPriceMax(next);
              setFilters((prev) => ({ ...prev, maxPrice: next < PRICE_MAX ? String(next) : "" }));
            }}
            className="w-full accent-brand-600"
            aria-label="Maximum price"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-600">
            <span>{formatLakhs(PRICE_MIN)}</span>
            <span>Up to {formatLakhs(priceMax)}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
              className="w-full rounded-control border border-border bg-card px-2.5 py-2 text-xs outline-none focus:border-brand-500"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
              className="w-full rounded-control border border-border bg-card px-2.5 py-2 text-xs outline-none focus:border-brand-500"
            />
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">BHK</p>
          <div className="flex flex-wrap gap-1.5">
            {BHK_OPTIONS.map((bhk) => {
              const selected = filters.bhkType === bhk;
              const short = bhk === "5 BHK" ? "4+" : bhk.replace(" BHK", "");
              return (
                <button
                  key={bhk}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      bhkType: prev.bhkType === bhk ? "" : bhk,
                    }))
                  }
                  className={chipClass(selected)}
                >
                  {short}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Property type</p>
          <div className="flex flex-wrap gap-1.5">
            {PROPERTY_KINDS.map((kind) => {
              const selected = filters.apartmentType === kind.value;
              return (
                <button
                  key={kind.value}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      apartmentType: prev.apartmentType === kind.value ? "" : kind.value,
                      propertyType: kind.value === "Commercial" ? "Commercial" : "Residential",
                    }))
                  }
                  className={chipClass(selected)}
                >
                  {kind.label}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Furnishing</p>
          <div className="flex flex-wrap gap-1.5">
            {FURNISHING.map((item) => {
              const selected = filters.furnishing === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, furnishing: prev.furnishing === item ? "" : item }))
                  }
                  className={chipClass(selected)}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Amenities</p>
          <div className="flex flex-wrap gap-1.5">
            {AMENITIES.map((amenity) => {
              const checked = filters.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={chipClass(checked)}
                >
                  {amenity}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Posted by</p>
          <div className="flex flex-wrap gap-1.5">
            {POSTED_BY.map((role) => {
              const selected = filters.postedBy === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, postedBy: prev.postedBy === role ? "" : role }))
                  }
                  className={chipClass(selected)}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-[color:var(--bg-page)] pt-3 lg:bg-[color:var(--bg-page)]">
        <button
          type="button"
          onClick={applyFilters}
          className="w-full rounded-control bg-secondary-500 px-4 py-3 text-sm font-semibold text-white shadow-soft-sm hover:bg-secondary-600"
        >
          Apply filters ({countLabel})
        </button>
        <p className="mt-1.5 text-center text-[11px] text-gray-500">
          {countQuery.isFetching ? "Updating count…" : "Results update as you filter"}
        </p>
      </div>
    </aside>
  );
}

export default HomeFiltersSidebar;
