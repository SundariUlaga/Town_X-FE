import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import {
  Heart,
  Share2,
  Scale,
  Eye,
  Phone,
  MessageCircle,
  CalendarClock,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Check,
} from "lucide-react";

import { propertyAPI } from "@/services/api";
import { formatInr } from "@/lib/finance";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { statusBadgeClass } from "@/lib/statusStyles";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { Property, PropertyEnrichment } from "@/types/property";

export interface PropertyCardProps {
  property: Property;
  enrichment?: PropertyEnrichment;
  onOpenDetails?: (id: number) => void;
  onFavouriteChange?: (id: number, isFavourite: boolean) => void;
  onCompareToggle?: (id: number) => void;
  isComparing?: boolean;
  onScheduleVisit?: (id: number) => void;
  onWhatsApp?: (id: number) => void;
  onCall?: (id: number) => void;
  className?: string;
}

function ActionIconButton({
  label,
  onClick,
  active,
  activeClassName,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  activeClassName?: string;
  children: React.ReactNode;
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
            active && activeClassName
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
  onScheduleVisit,
  onWhatsApp,
  onCall,
  className,
}: PropertyCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isFavourite, setIsFavourite] = useState(property.is_favourite);
  const [justCopied, setJustCopied] = useState(false);
  const [comingSoon, setComingSoon] = useState<string | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

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

  const title = `${property.bhk_type} ${property.apartment_type}${
    property.apartment_name ? ` in ${property.apartment_name}` : ""
  }`;
  const heroImage = property.images?.[0]?.url;
  const galleryCount = property.images?.length ?? 0;

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

  const flagComingSoon = (label: string) => {
    setComingSoon(label);
    setTimeout(() => setComingSoon(null), 2000);
  };

  return (
    <>
      <motion.div
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-card border border-border bg-card shadow-soft-sm transition-shadow",
          className
        )}
        whileHover={shouldReduceMotion ? undefined : { y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="relative h-44 overflow-hidden cursor-pointer" onClick={() => onOpenDetails?.(property.id)}>
          {heroImage ? (
            <img
              src={heroImage}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground text-sm">
              No image available
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent" />

          {/* Type / status badges — real data */}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            <Badge className="bg-brand-500 text-white border-transparent shadow-soft-sm">
              For {property.property_for}
            </Badge>
            {enrichment?.isFeatured && (
              <Badge variant="accent" className="bg-accent text-white border-transparent shadow-soft-sm">
                <Star className="size-3" /> Featured
              </Badge>
            )}
            {enrichment?.isPremium && (
              <Badge className="bg-brand-700 text-white border-transparent shadow-soft-sm">
                <Sparkles className="size-3" /> Premium
              </Badge>
            )}
            {property.user_type === "Owner" && (
              <span className={statusBadgeClass("success")}>
                <ShieldCheck className="size-3" /> Direct owner
              </span>
            )}
            {property.verification_tier === "verified" && (
              <Badge variant="success" className="bg-white/95 border-transparent shadow-soft-sm">
                <ShieldCheck className="size-3" /> Verified docs
              </Badge>
            )}
            {property.verification_tier === "pending" && (
              <Badge className="bg-amber-100 text-amber-800 border-transparent shadow-soft-sm">
                Verification pending
              </Badge>
            )}
            {enrichment?.isVerified && (
              <Badge variant="success" className="bg-white/95 border-transparent shadow-soft-sm">
                <ShieldCheck className="size-3" /> Verified
              </Badge>
            )}
          </div>

          {galleryCount > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
              1 / {galleryCount}
            </span>
          )}

          {/* Quick actions */}
          <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
            <ActionIconButton
              label={isFavourite ? "Remove from favourites" : "Save to favourites"}
              active={isFavourite}
              activeClassName="text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                favouriteMutation.mutate();
              }}
            >
              <Heart className={cn("size-4", isFavourite && "fill-red-500")} />
            </ActionIconButton>
            <ActionIconButton
              label={isComparing ? "Remove from compare" : "Add to compare"}
              active={isComparing}
              activeClassName="text-brand-600"
              onClick={(e) => {
                e.stopPropagation();
                onCompareToggle?.(property.id);
              }}
            >
              {isComparing ? <Check className="size-4" /> : <Scale className="size-4" />}
            </ActionIconButton>
            <ActionIconButton label={justCopied ? "Link copied!" : "Share"} onClick={handleShare}>
              <Share2 className="size-4" />
            </ActionIconButton>
            <ActionIconButton
              label="Quick view"
              onClick={(e) => {
                e.stopPropagation();
                setQuickViewOpen(true);
              }}
            >
              <Eye className="size-4" />
            </ActionIconButton>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">{title}</h3>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-xl font-semibold text-primary">
              {formatInr(property.expected_price, { compact: true })}
            </span>
            {property.property_for === "Rent/Lease" && (
              <span className="text-xs text-muted-foreground">/month</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 flex-shrink-0" />
            <span className="line-clamp-1">
              {property.locality}, {property.city}
            </span>
            {enrichment?.nearbyMetroKm != null && (
              <span className="ml-1 flex-shrink-0 text-[11px]">· {enrichment.nearbyMetroKm} km to metro</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {property.created_at ? (
              <span>{formatRelativeTime(property.created_at)}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {property.bhk_type && property.bhk_type.split(" ")[0] !== "Studio" && (
              <span className="flex items-center gap-1">
                <Bed className="size-3.5" /> {property.bhk_type.split(" ")[0]}
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bath className="size-3.5" /> {property.bathrooms}
              </span>
            )}
            {property.carpet_area > 0 && (
              <span className="flex items-center gap-1">
                <Maximize className="size-3.5" /> {property.carpet_area} sqft
              </span>
            )}
            <span>{property.furnishing_status}</span>
          </div>

          {(enrichment?.propertyScore != null || enrichment?.investmentScore != null) && (
            <div className="flex flex-wrap gap-3 border-t border-border pt-2 text-[11px]">
              {enrichment.propertyScore != null && (
                <span className="flex items-center gap-1 text-brand-600 font-medium">
                  <Star className="size-3" /> Property score {enrichment.propertyScore}/100
                </span>
              )}
              {enrichment.investmentScore != null && (
                <span className="flex items-center gap-1 text-brand-600 font-medium">
                  <TrendingUp className="size-3" /> Investment score {enrichment.investmentScore}/100
                </span>
              )}
            </div>
          )}

          <div className="mt-auto grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <Button
              size="sm"
              className="col-span-2 sm:col-span-2 min-h-9"
              onClick={() => onOpenDetails?.(property.id)}
            >
              View Details
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onScheduleVisit ? onScheduleVisit(property.id) : flagComingSoon("Schedule visit")
              }
              aria-label="Schedule a visit"
            >
              <CalendarClock className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => (onWhatsApp ? onWhatsApp(property.id) : flagComingSoon("WhatsApp"))}
              aria-label="Contact via WhatsApp"
            >
              <MessageCircle className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => (onCall ? onCall(property.id) : flagComingSoon("Call"))}
              aria-label="Call owner"
            >
              <Phone className="size-4" />
            </Button>
          </div>
          {comingSoon && (
            <p className="text-center text-[11px] text-muted-foreground">{comingSoon} coming soon</p>
          )}
        </div>
      </motion.div>

      <Dialog open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {property.locality}, {property.city}
            </DialogDescription>
          </DialogHeader>
          {heroImage && (
            <img src={heroImage} alt={title} className="h-48 w-full rounded-control object-cover" />
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-semibold text-primary">
              {formatInr(property.expected_price)}
            </span>
            {property.property_for === "Rent/Lease" && (
              <span className="text-sm text-muted-foreground">/month</span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="size-4" /> {property.bhk_type}
            </span>
            <span className="flex items-center gap-1">
              <Maximize className="size-4" /> {property.carpet_area} sqft
            </span>
            <span>{property.furnishing_status}</span>
            <span>Floor {property.floor}/{property.total_floors}</span>
          </div>
          <Button
            onClick={() => {
              setQuickViewOpen(false);
              onOpenDetails?.(property.id);
            }}
          >
            View full details
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PropertyCard;
