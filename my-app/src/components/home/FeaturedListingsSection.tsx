import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Megaphone, Sparkles } from "lucide-react";

import { propertyAPI } from "@/services/api";
import { useLocationContext } from "@/context/LocationContext";
import { getLocationCityFilter } from "@/lib/locationUtils";
import { formatInr } from "@/lib/finance";
import { cn } from "@/lib/utils";
import type { Property } from "@/types/property";
import { WithTooltip } from "@/components/ui/WithTooltip";

export type FeaturedProperty = Property & {
  feature_reason?: string | null;
};

type FeaturedListingsSectionProps = {
  title?: string;
  subtitle?: string;
  onPostProperty?: () => void;
};

function FeaturedListingCard({
  property,
  highlight,
  onOpen,
}: {
  property: FeaturedProperty;
  highlight?: boolean;
  onOpen: (id: number) => void;
}) {
  const [isFavourite, setIsFavourite] = useState(Boolean(property.is_favourite));
  const favouriteMutation = useMutation({
    mutationFn: () => propertyAPI.toggleFavourite(property.id),
    onMutate: () => {
      const previous = isFavourite;
      setIsFavourite(!previous);
      return { previous };
    },
    onSuccess: (data) => setIsFavourite(data.is_favourite),
    onError: (_e, _v, ctx) => {
      if (ctx) setIsFavourite(ctx.previous);
    },
  });

  const title = `${property.bhk_type} ${property.apartment_type}`;
  const image = property.images?.[0]?.url;
  const reason =
    property.feature_reason ||
    (property.user_type === "Owner" ? "Direct owner" : `In ${property.locality}`);

  return (
    <article
      className={cn(
        "group relative w-[min(78vw,280px)] shrink-0 snap-start overflow-hidden rounded-card bg-white shadow-soft-md transition-transform duration-300 sm:w-[300px]",
        highlight
          ? "scale-[1.02] border-2 border-secondary-400 shadow-soft-lg ring-2 ring-secondary-200/60"
          : "border border-brand-100/80 hover:-translate-y-0.5 hover:shadow-soft-lg"
      )}
    >
      <button type="button" className="block w-full text-left" onClick={() => onOpen(property.id)}>
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-200">
          {image ? (
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">No photo</div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />

          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded bg-secondary-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-soft-sm">
            <Sparkles className="size-3" />
            Featured
          </span>

          <span className="absolute bottom-2.5 left-2.5 rounded bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
            For {property.property_for}
          </span>
        </div>

        <div className="space-y-1.5 p-3.5">
          <p className="font-display text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {formatInr(property.expected_price)}
          </p>
          <p className="truncate text-sm font-semibold text-gray-800">{title}</p>
          <p className="flex items-center gap-1 truncate text-xs text-gray-500">
            <MapPin className="size-3 shrink-0" />
            {property.locality}, {property.city}
          </p>
          <p className="text-xs font-medium text-brand-700">{reason}</p>
        </div>
      </button>

      <div className="absolute right-2.5 top-2.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <WithTooltip label={isFavourite ? "Remove favourite" : "Save"}>
          <button
            type="button"
            aria-label={isFavourite ? "Remove favourite" : "Save listing"}
            onClick={(e) => {
              e.stopPropagation();
              favouriteMutation.mutate();
            }}
            className={cn(
              "flex size-8 items-center justify-center rounded-full bg-white/95 shadow-soft-sm backdrop-blur-sm",
              isFavourite ? "text-rose-500" : "text-gray-600 hover:text-rose-500"
            )}
          >
            <Heart className={cn("size-4", isFavourite && "fill-current")} />
          </button>
        </WithTooltip>
      </div>
    </article>
  );
}

function FeatureYourListingCta({ onPostProperty }: { onPostProperty?: () => void }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => (onPostProperty ? onPostProperty() : navigate("/advertise/submit"))}
      className="flex w-[min(78vw,280px)] shrink-0 snap-start flex-col justify-center gap-2 border border-secondary-200 bg-secondary-50 px-4 py-5 text-left transition-colors hover:bg-secondary-100/80 sm:w-[300px]"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-secondary-500 text-white">
        <Megaphone className="size-5" />
      </span>
      <span className="font-display text-base font-semibold text-gray-900">Feature your listing</span>
      <span className="text-xs leading-relaxed text-secondary-900">
        Get 3× more views on the homepage showcase — get started.
      </span>
    </button>
  );
}

export function FeaturedListingsSection({
  title = "Featured listings",
  subtitle = "Handpicked homes getting premium placement",
  onPostProperty,
}: FeaturedListingsSectionProps) {
  const navigate = useNavigate();
  const { selectedLocation } = useLocationContext();
  const city = getLocationCityFilter(selectedLocation);

  const query = useQuery({
    queryKey: ["featured-properties", city || "all"],
    queryFn: () => propertyAPI.getFeaturedProperties({ city: city || undefined, limit: 12 }),
    staleTime: 60_000,
  });

  const items = (query.data || []) as FeaturedProperty[];

  if (query.isPending) {
    return (
      <section className="border-b border-gray-200/80 bg-white">
        <div className="mx-auto max-w-[90rem] px-4 py-5">
          <h2 className="font-display text-xl font-semibold text-gray-900">{title}</h2>
          <div className="mt-4 flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-56 w-[280px] shrink-0 animate-pulse rounded-card bg-gray-100 sm:w-[300px]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (query.isError) {
    return null;
  }

  if (items.length === 0) {
    return (
      <section className="border-b border-gray-200/80 bg-white">
        <div className="mx-auto max-w-[90rem] px-4 py-5">
          <button
            type="button"
            onClick={() => (onPostProperty ? onPostProperty() : navigate("/advertise/submit"))}
            className="flex w-full items-center gap-3 border border-secondary-200 bg-secondary-50 px-4 py-4 text-left transition-colors hover:bg-secondary-100/70"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-white">
              <Megaphone className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900">
                Feature your listing to get 3× more views
              </span>
              <span className="mt-0.5 block text-xs text-secondary-800">
                Premium placement on the homepage — get started.
              </span>
            </span>
          </button>
        </div>
      </section>
    );
  }

  const highlightIndex = items.length >= 3 ? 1 : 0;

  return (
    <section className="border-b border-gray-200/80 bg-gradient-to-b from-white to-[#f7f9fb]">
      <div className="mx-auto max-w-[90rem] px-4 py-5 sm:py-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-gray-900 sm:text-2xl">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {items.map((property, index) => (
            <FeaturedListingCard
              key={property.id}
              property={property}
              highlight={index === highlightIndex}
              onOpen={(id) => navigate(`/property/${id}`, { state: { from: "/home" } })}
            />
          ))}
          <FeatureYourListingCta onPostProperty={onPostProperty} />
        </div>
      </div>
    </section>
  );
}

export default FeaturedListingsSection;
