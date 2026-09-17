import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Images } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PropertyImage } from "@/types/property";

type PropertyCardGalleryProps = {
  images?: PropertyImage[] | null;
  alt: string;
  propertyFor?: string | null;
  isFavourite?: boolean;
  onToggleFavourite?: (e: React.MouseEvent) => void;
  className?: string;
};

function listingBadge(propertyFor?: string | null) {
  if (propertyFor === "Rent/Lease") return { label: "FOR RENT", tone: "bg-trust-600" };
  if (propertyFor === "Sell") return { label: "FOR SALE", tone: "bg-emerald-500" };
  if (propertyFor) return { label: `FOR ${propertyFor.toUpperCase()}`, tone: "bg-emerald-500" };
  return null;
}

/** In-card marketplace gallery: one hero image, overlays, and in-place arrows. */
export function PropertyCardGallery({
  images,
  alt,
  propertyFor,
  isFavourite = false,
  onToggleFavourite,
  className,
}: PropertyCardGalleryProps) {
  const urls = (images ?? []).map((img) => img.url).filter(Boolean);
  const count = urls.length;
  const [index, setIndex] = useState(0);
  const safeIndex = count ? Math.min(index, count - 1) : 0;
  const src = count ? urls[safeIndex] : null;
  const badge = listingBadge(propertyFor);
  const canNavigate = count > 1;

  const step = (direction: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canNavigate) return;
    setIndex((current) => (current + direction + count) % count);
  };

  return (
    <div className={cn("relative aspect-[16/9] w-full overflow-hidden bg-muted", className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          No image available
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/40 to-transparent" />

      {badge ? (
        <span
          className={cn(
            "absolute left-2.5 top-2.5 z-[1] rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-soft-sm",
            badge.tone
          )}
        >
          {badge.label}
        </span>
      ) : null}

      {onToggleFavourite ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavourite(event);
          }}
          aria-label={isFavourite ? "Remove from favourites" : "Save to favourites"}
          aria-pressed={isFavourite}
          className="absolute right-2.5 top-2.5 z-[1] inline-flex size-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-md transition-colors hover:bg-white"
        >
          <Heart className={cn("size-4", isFavourite && "fill-rose-500 text-rose-500")} />
        </button>
      ) : null}

      {canNavigate ? (
        <>
          <button
            type="button"
            onClick={(event) => step(-1, event)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-[1] inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-soft-md backdrop-blur-[2px] transition-colors hover:bg-black/75"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={(event) => step(1, event)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-[1] inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-soft-md backdrop-blur-[2px] transition-colors hover:bg-black/75"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      ) : null}

      {count > 0 ? (
        <span className="absolute bottom-2.5 right-2.5 z-[1] inline-flex items-center gap-1 rounded-md bg-black/65 px-2 py-1 text-[11px] font-medium text-white shadow-soft-sm backdrop-blur-[2px]">
          <Images className="size-3.5" />
          {count} {count === 1 ? "Photo" : "Photos"}
        </span>
      ) : null}
    </div>
  );
}

export default PropertyCardGallery;
