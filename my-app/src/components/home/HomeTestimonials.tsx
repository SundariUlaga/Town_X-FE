import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  testimonialsAPI,
  type HomeTestimonial,
  type TestimonialsPayload,
} from "@/services/testimonialsAPI";

const CACHE_KEY = "townx.home.testimonials.v2";

const FALLBACK: TestimonialsPayload = {
  stats: {
    listings_live: 12400,
    listings_live_label: "12,400+",
    enquiries_48h: 4,
    enquiries_48h_label: "4",
    verified_listings: 98,
    verified_listings_label: "98%",
  },
  items: [
    {
      id: -1,
      name: "Priya S.",
      role: "Buyer",
      location: "Chennai",
      quote:
        "Found a 2BHK in Neelankarai within a week — the locality filters and fresh listings made it easy.",
      rating: 5,
      category: "buyer",
      outcome: "Found a home",
      avatar_url: null,
      is_verified: true,
      display_order: 1,
    },
    {
      id: -2,
      name: "Arjun M.",
      role: "Owner",
      location: "Bengaluru",
      quote:
        "Listed my flat and got serious enquiries the same day. The process felt clearer than the big portals.",
      rating: 5,
      category: "owner",
      outcome: "Listed a property",
      avatar_url: null,
      is_verified: true,
      display_order: 2,
    },
    {
      id: -3,
      name: "Kavitha R.",
      role: "First-time buyer",
      location: null,
      quote:
        "EMI estimate on the listing page helped us budget before we even called the broker.",
      rating: 5,
      category: "buyer",
      outcome: "Used EMI calculator",
      avatar_url: null,
      is_verified: false,
      display_order: 3,
    },
  ],
};

function readSessionCache(): TestimonialsPayload | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TestimonialsPayload;
    if (!Array.isArray(parsed?.items) || !parsed.stats) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(payload: TestimonialsPayload) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function StarRow({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating || 5)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3",
            i < filled ? "fill-amber-400 text-amber-400" : "text-gray-300"
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

function TestimonialCard({ item }: { item: HomeTestimonial }) {
  const byline = [item.role, item.location].filter(Boolean).join(" · ");
  return (
    <figure className="flex h-full flex-col border-l-[3px] border-brand-500 bg-white/90 px-3.5 py-3 shadow-soft-sm">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        {item.outcome ? (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800">
            {item.outcome}
          </span>
        ) : (
          <span />
        )}
        <StarRow rating={item.rating} />
      </div>
      <Quote className="mb-1 size-3 text-brand-400/80" aria-hidden />
      <blockquote className="flex-1 text-[13px] leading-relaxed text-gray-700">
        “{item.quote}”
      </blockquote>
      <figcaption className="mt-2 flex items-center gap-2 border-t border-gray-100 pt-2">
        {item.avatar_url ? (
          <img
            src={item.avatar_url}
            alt=""
            className="size-9 shrink-0 rounded-full object-cover ring-1 ring-brand-100"
          />
        ) : (
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-800">
            {initials(item.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {item.name}
            {byline ? <span className="font-normal text-gray-500"> · {byline}</span> : null}
          </p>
          {item.is_verified ? (
            <p className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-trust-700">
              <BadgeCheck className="size-3.5" />
              Verified transaction
            </p>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}

type HomeTestimonialsProps = {
  className?: string;
};

export function HomeTestimonials({ className }: HomeTestimonialsProps) {
  const cached = useMemo(() => readSessionCache(), []);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: ["home-testimonials", "all"],
    queryFn: async () => {
      const data = await testimonialsAPI.listPublic(50);
      writeSessionCache(data);
      return data;
    },
    initialData: cached ?? undefined,
    staleTime: 60_000,
    retry: 1,
  });

  const useFallback = query.isError && !cached && !query.data;
  const items = useFallback
    ? FALLBACK.items
    : (query.data?.items ?? cached?.items ?? FALLBACK.items);
  const stats = useFallback ? FALLBACK.stats : (query.data?.stats ?? cached?.stats);
  const showCarouselNav = items.length > 2;

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-testimonial-card]");
    const width = card ? card.offsetWidth + 12 : 280;
    el.scrollBy({ left: dir * width, behavior: "smooth" });
  };

  const metricCards = [
    { label: "Listings live", value: stats?.listings_live_label },
    { label: "Enquiries · 48 hrs", value: stats?.enquiries_48h_label },
    { label: "Verified listings", value: stats?.verified_listings_label },
  ];

  return (
    <section
      className={cn("rounded-control border border-gray-200/80 bg-gradient-to-b from-[#eef4f8] to-white", className)}
      aria-label="Trusted by people finding their next home"
    >
      <div className="px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-gray-900 sm:text-lg">
            Trusted by people finding their next home
          </h2>
          <p className="text-[11px] font-medium text-gray-400">
            {items.length} {items.length === 1 ? "note" : "notes"}
          </p>
        </div>

        <div className="mb-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y border-gray-200/70 py-2">
          {metricCards.map((metric) => (
            <p key={metric.label} className="text-xs text-gray-500">
              <span className="font-display text-sm font-semibold tabular-nums text-gray-900">
                {metric.value ?? "—"}
              </span>{" "}
              {metric.label}
            </p>
          ))}
        </div>

        <div className="relative">
          {showCarouselNav ? (
            <>
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                className="absolute -left-2 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-soft-sm hover:bg-brand-50 lg:flex"
                aria-label="Previous testimonials"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                className="absolute -right-2 top-1/2 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-soft-sm hover:bg-brand-50 lg:flex"
                aria-label="Next testimonials"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          ) : null}

          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-0 scrollbar-hide"
          >
            {items.map((item) => (
              <div
                key={item.id}
                data-testimonial-card
                className="w-[min(86vw,20rem)] shrink-0 snap-start sm:w-[min(48%,20rem)] lg:w-[calc((100%-0.75rem)/2)]"
              >
                <TestimonialCard item={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeTestimonials;
