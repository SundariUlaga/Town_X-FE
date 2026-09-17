import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Share2,
  Scale,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Check,
  Sofa,
  BadgeCheck,
} from "lucide-react";

import { propertyAPI } from "@/services/api";
import { formatInr, formatPricePerSqft } from "@/lib/finance";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { PropertyCardGallery } from "@/components/property/PropertyCardGallery";
import type { Property, PropertyEnrichment } from "@/types/property";

export interface PropertyCardProps {
  property: Property;
  enrichment?: PropertyEnrichment;
  onOpenDetails?: (id: number) => void;
  onFavouriteChange?: (id: number, isFavourite: boolean) => void;
  onCompareToggle?: (id: number) => void;
  isComparing?: boolean;
  className?: string;
}

/** Short labels so meta row doesn’t clip mid-word on narrow cards. */
function shortFurnishing(status?: string | null) {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s.includes("semi")) return "Semi-fur.";
  if (s.includes("unfurn")) return "Unfur.";
  if (s.includes("fully") || s === "furnished") return "Furnished";
  return status;
}

function ActionIconButton({
  label,
  onClick,
  active,
  activeClassName,
  children,
  className,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  activeClassName?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-soft-sm backdrop-blur-sm transition-colors hover:bg-white",
            active && activeClassName,
            className
          )}
        >
          {children}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function PropertyCard({
  property,
  enrichment,
  onOpenDetails,
  onFavouriteChange,
  onCompareToggle,
  isComparing = false,
  className,
}: PropertyCardProps) {
  const [isFavourite, setIsFavourite] = useState(property.is_favourite);
  const [justCopied, setJustCopied] = useState(false);

  useEffect(() => {
    setIsFavourite(property.is_favourite);
  }, [property.is_favourite]);

  const favouriteMutation = useMutation({
    mutationFn: () => propertyAPI.toggleFavourite(property.id),
    onMutate: () => {
      const previous = isFavourite;
      setIsFavourite(!previous);
      return { previous };
    },
    onSuccess: (data) => {
      setIsFavourite(data.is_favourite);
      onFavouriteChange?.(property.id, data.is_favourite);
    },
    onError: (_err, _vars, context) => {
      if (context) setIsFavourite(context.previous);
    },
  });

  const isCommercial = property.property_type === "Commercial";
  const commercialLabel =
    property.commercial_subtype || property.apartment_type || "Commercial";
  const areaSqft =
    property.carpet_area > 0
      ? property.carpet_area
      : property.built_up_area && property.built_up_area > 0
        ? property.built_up_area
        : 0;
  const title = isCommercial
    ? `${commercialLabel}${property.apartment_name ? ` · ${property.apartment_name}` : ""}`
    : `${property.bhk_type} ${property.apartment_type}${
        property.apartment_name ? ` in ${property.apartment_name}` : ""
      }`;
  const galleryCount = property.images?.length ?? 0;
  const ppsLabel = formatPricePerSqft(
    property.expected_price,
    property.carpet_area,
    property.built_up_area
  );
  const isVerified =
    property.verification_tier === "verified" || Boolean(enrichment?.isVerified);
  const showVerifiedPhotos = isVerified && galleryCount >= 2;
  const postedBy = property.user_type || "";

  const openDetails = () => onOpenDetails?.(property.id);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/property/${property.id}`;
    const shareData = { title, text: `${title} — ${formatInr(property.expected_price)}`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setJustCopied(true);
        setTimeout(() => setJustCopied(false), 1800);
      }
    } catch {
      // user cancelled the native share sheet — not an error
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetails();
        }
      }}
      className={cn(
        "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-card border border-border bg-card shadow-soft-sm transition-shadow duration-200 hover:shadow-soft-md",
        className
      )}
    >
      <PropertyCardGallery
        images={property.images}
        alt={title}
        propertyFor={property.property_for}
        isFavourite={isFavourite}
        onToggleFavourite={() => favouriteMutation.mutate()}
      />

      <div className="flex flex-col gap-1.5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
            {title}
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            {onCompareToggle ? (
              <ActionIconButton
                label={isComparing ? "Remove from compare" : "Add to compare"}
                active={isComparing}
                activeClassName="text-brand-700"
                className="h-8 w-8 border border-border shadow-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onCompareToggle(property.id);
                }}
              >
                {isComparing ? <Check className="size-4" /> : <Scale className="size-4" />}
              </ActionIconButton>
            ) : null}
            <ActionIconButton
              label={justCopied ? "Link copied!" : "Share"}
              className="h-8 w-8 border border-border shadow-none"
              onClick={handleShare}
            >
              <Share2 className="size-4" />
            </ActionIconButton>
          </div>
        </div>

        {(isVerified ||
          property.verification_tier === "pending" ||
          postedBy ||
          enrichment?.isFeatured ||
          enrichment?.isPremium ||
          showVerifiedPhotos) ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {isVerified ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-trust-700">
                <BadgeCheck className="size-3.5" /> Verified Property
              </span>
            ) : property.verification_tier === "pending" ? (
              <Badge className="border-transparent bg-amber-100 text-amber-800">Pending</Badge>
            ) : null}
            {postedBy === "Owner" ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="size-3.5 text-trust-600" /> Owner Listed
              </span>
            ) : postedBy ? (
              <span className="text-[11px] font-medium text-muted-foreground">{postedBy}</span>
            ) : null}
            {enrichment?.isFeatured ? (
              <Badge variant="accent" className="border-transparent bg-accent text-white">
                <Star className="size-3" /> Featured
              </Badge>
            ) : null}
            {enrichment?.isPremium ? (
              <Badge className="border-transparent bg-brand-800 text-white">
                <Sparkles className="size-3" /> Premium
              </Badge>
            ) : null}
            {showVerifiedPhotos ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-trust-700">
                <Check className="size-3" /> Verified photos
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-display text-xl font-semibold text-brand-700">
            {formatInr(property.expected_price, { compact: true })}
          </span>
          {property.property_for === "Rent/Lease" ? (
            <span className="text-xs text-muted-foreground">/month</span>
          ) : null}
          {ppsLabel && property.property_for !== "Rent/Lease" ? (
            <span className="text-xs font-medium text-muted-foreground">{ppsLabel}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 flex-shrink-0" />
          <span className="line-clamp-1">
            {property.locality}, {property.city}
          </span>
          {enrichment?.nearbyMetroKm != null ? (
            <span className="ml-1 flex-shrink-0 text-[11px]">· {enrichment.nearbyMetroKm} km to metro</span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {isCommercial ? (
            <>
              {areaSqft > 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Maximize className="size-3.5 shrink-0" /> {areaSqft} ft²
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{areaSqft} sqft</TooltipContent>
                </Tooltip>
              ) : null}
              {property.frontage_ft ? (
                <span className="whitespace-nowrap">{property.frontage_ft} ft frontage</span>
              ) : null}
              {(property.floor_number ?? property.floor) != null ? (
                <span className="whitespace-nowrap">
                  Floor {property.floor_number ?? property.floor}
                </span>
              ) : null}
            </>
          ) : (
            <>
              {property.bhk_type && property.bhk_type.split(" ")[0] !== "Studio" ? (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Bed className="size-3.5 shrink-0" /> {property.bhk_type.split(" ")[0]}
                </span>
              ) : null}
              {property.bathrooms > 0 ? (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Bath className="size-3.5 shrink-0" /> {property.bathrooms}
                </span>
              ) : null}
              {property.carpet_area > 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Maximize className="size-3.5 shrink-0" /> {property.carpet_area} ft²
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{property.carpet_area} sqft carpet area</TooltipContent>
                </Tooltip>
              ) : null}
              {property.furnishing_status ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex max-w-[8rem] items-center gap-1 truncate rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground">
                      <Sofa className="size-3 shrink-0 text-brand-600" />
                      {shortFurnishing(property.furnishing_status)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{property.furnishing_status}</TooltipContent>
                </Tooltip>
              ) : null}
            </>
          )}
        </div>

        {property.created_at ? (
          <p className="text-[11px] text-muted-foreground">
            {formatRelativeTime(property.created_at)}
          </p>
        ) : null}

        {(enrichment?.propertyScore != null || enrichment?.investmentScore != null) && (
          <div className="flex flex-wrap gap-3 border-t border-border pt-2 text-[11px]">
            {enrichment.propertyScore != null && (
              <span className="flex items-center gap-1 font-medium text-brand-700">
                <Star className="size-3" /> Property score {enrichment.propertyScore}/100
              </span>
            )}
            {enrichment.investmentScore != null && (
              <span className="flex items-center gap-1 font-medium text-brand-700">
                <TrendingUp className="size-3" /> Investment score {enrichment.investmentScore}/100
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyCard;
