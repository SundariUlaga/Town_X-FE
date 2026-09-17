import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Building2,
  CalendarClock,
  Heart,
  MapPin,
  BadgeCheck,
  Layers,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatInr } from "@/lib/finance";
import type { Advertisement } from "@/types/advertisement";
import type { Property } from "@/types/property";
import { advertisementAPI } from "@/services/advertisementAPI";
import { propertyAPI } from "@/services/api";

export type ProjectCarouselItem =
  | { kind: "property"; property: Property }
  | { kind: "ad"; ad: Advertisement };

type NewProjectsCarouselProps = {
  items: ProjectCarouselItem[];
  loading?: boolean;
  className?: string;
};

function formatPossession(availableFrom?: string | null) {
  if (!availableFrom) return null;
  const d = new Date(availableFrom);
  if (Number.isNaN(d.getTime())) return availableFrom;
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function possessionProgress(status?: string | null) {
  const s = (status || "").toLowerCase();
  if (s.includes("ready")) return "w-full";
  if (s.includes("nearing")) return "w-3/4";
  if (s.includes("under")) return "w-2/5";
  if (s.includes("launch")) return "w-1/5";
  return "w-2/5";
}

function ProjectPropertyCard({ property }: { property: Property }) {
  const navigate = useNavigate();
  const [isFavourite, setIsFavourite] = useState(Boolean(property.is_favourite));
  const favouriteMutation = useMutation({
    mutationFn: () => propertyAPI.toggleFavourite(property.id),
    onMutate: () => {
      const prev = isFavourite;
      setIsFavourite(!prev);
      return { prev };
    },
    onSuccess: (data) => setIsFavourite(data.is_favourite),
    onError: (_e, _v, ctx) => {
      if (ctx) setIsFavourite(ctx.prev);
    },
  });

  const project = property.project_details;
  const hero = property.images?.[0]?.url;
  const possession =
    formatPossession(project?.possession_date) || formatPossession(property.available_from);
  const builderLabel =
    project?.builder_name ||
    (property.user_type === "Builder"
      ? property.apartment_name || "Builder"
      : property.apartment_name || property.user_type);
  const isVerified = property.verification_tier === "verified";
  const hasRera = Boolean(project?.rera_id);
  const startingPrice = project?.price_starting_from ?? property.expected_price;
  const unitsLeft =
    project?.available_units != null
      ? `${project.available_units} unit${project.available_units === 1 ? "" : "s"} left`
      : null;
  const floorsHint =
    project?.total_floors != null
      ? `${project.total_floors} floors`
      : property.total_floors > 0
        ? `${property.total_floors} floors`
        : null;
  const statusLabel = project?.project_status || property.property_age;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-brand-200/80 bg-gradient-to-b from-brand-50/50 to-card shadow-soft-sm">
      <div
        className="relative aspect-[4/3] cursor-pointer bg-muted"
        onClick={() => navigate(`/property/${property.id}`, { state: { from: "/home" } })}
      >
        {hero ? (
          <img
            src={hero}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-900 text-white/80">
            <Building2 className="size-8" />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <span className="rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            New project
          </span>
          {hasRera ? (
            <span className="inline-flex items-center gap-0.5 rounded bg-trust-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              <BadgeCheck className="size-3" /> RERA
            </span>
          ) : isVerified ? (
            <span className="inline-flex items-center gap-0.5 rounded bg-trust-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              <BadgeCheck className="size-3" /> Verified
            </span>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={isFavourite ? "Remove favourite" : "Save project"}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-soft-sm"
          onClick={(e) => {
            e.stopPropagation();
            favouriteMutation.mutate();
          }}
        >
          <Heart className={cn("size-4", isFavourite && "fill-rose-600 text-rose-600")} />
        </button>
        {builderLabel ? (
          <span className="absolute bottom-2 left-2 flex max-w-[75%] items-center gap-1.5 truncate rounded bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white">
            {project?.builder_logo_url ? (
              <img src={project.builder_logo_url} alt="" className="size-4 rounded-sm object-cover" />
            ) : null}
            {builderLabel}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
          {property.bhk_type} {property.apartment_type}
          {property.apartment_name ? ` · ${property.apartment_name}` : ""}
        </h3>
        <p className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="size-3.5 shrink-0" />
          <span className="line-clamp-1">
            {property.locality}, {property.city}
          </span>
        </p>
        <p className="font-display text-lg font-semibold text-brand-700">
          {formatInr(startingPrice, { compact: true })}
          <span className="ml-1 text-xs font-sans font-medium text-gray-500">onwards</span>
        </p>
        {project?.price_per_sqft_range_min != null ? (
          <p className="text-[11px] text-gray-500">
            ₹{Math.round(project.price_per_sqft_range_min).toLocaleString("en-IN")}
            {project.price_per_sqft_range_max != null
              ? `–₹${Math.round(project.price_per_sqft_range_max).toLocaleString("en-IN")}`
              : ""}
            /sqft
          </p>
        ) : null}

        <div className="mt-auto space-y-2 border-t border-brand-100 pt-2">
          {possession ? (
            <div className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Possession
                </p>
                <p className="text-xs font-medium text-gray-800">{possession}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-100">
                  <div
                    className={cn(
                      "h-full rounded-full bg-brand-500",
                      possessionProgress(project?.project_status)
                    )}
                  />
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {unitsLeft ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-secondary-200 bg-secondary-50 px-2 py-0.5 text-[11px] font-medium text-secondary-800">
                {unitsLeft}
              </span>
            ) : null}
            {floorsHint ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-gray-700">
                <Layers className="size-3" /> {floorsHint}
              </span>
            ) : null}
            {statusLabel ? (
              <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-gray-700">
                {statusLabel}
              </span>
            ) : null}
            {project?.rera_id ? (
              <span className="rounded-full border border-trust-200 bg-trust-50 px-2 py-0.5 text-[11px] text-trust-800">
                {project.rera_id}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function ProjectAdCard({ ad }: { ad: Advertisement }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => {
        advertisementAPI.track(ad.id, "click").catch(() => {});
        if (ad.property_id) navigate(`/property/${ad.property_id}`);
        else navigate("/advertise/submit");
      }}
      className="group flex h-full w-full flex-col overflow-hidden rounded-card border border-dashed border-gray-300 bg-muted/30 text-left transition-shadow hover:shadow-soft-sm"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {ad.banner_url ? (
          <img
            src={ad.banner_url}
            alt=""
            className="h-full w-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-900 text-white/80">
            <Building2 className="size-8" />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-gray-800/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {ad.badge_text || "Sponsored project"}
        </span>
        <span className="absolute right-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
          Ad
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-brand-700">
          {ad.title}
        </p>
        <p className="text-xs text-gray-500">{ad.location}</p>
        {ad.price_text ? (
          <p className="mt-auto pt-1 text-sm font-semibold text-brand-800">{ad.price_text}</p>
        ) : null}
      </div>
    </button>
  );
}

export function NewProjectsCarousel({ items, loading, className }: NewProjectsCarouselProps) {
  const navigate = useNavigate();

  if (!loading && items.length === 0) return null;

  return (
    <section className={cn("min-w-0", className)}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-gray-900">New projects</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Builder launches with possession timeline — distinct from resale
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/property-feed", { state: { category: "New Project" } })}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          See all
        </button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-sm text-gray-500">Loading projects…</div>
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-hide">
          {items.slice(0, 8).map((item) => (
            <div
              key={item.kind === "property" ? `p-${item.property.id}` : `ad-${item.ad.id}`}
              className="w-[min(72vw,280px)] max-w-[280px] shrink-0"
            >
              {item.kind === "property" ? (
                <ProjectPropertyCard property={item.property} />
              ) : (
                <ProjectAdCard ad={item.ad} />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default NewProjectsCarousel;
