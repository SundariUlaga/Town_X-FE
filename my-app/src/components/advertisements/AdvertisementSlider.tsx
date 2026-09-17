import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Megaphone, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import advertisementAPI from "@/services/advertisementAPI";
import TownLoader from "@/components/shared/TownLoader";
import MarkdownContent from "@/components/shared/MarkdownContent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WithTooltip } from "@/components/ui/WithTooltip";
import { useAuth } from "@/context/AuthContext";
import { useAuthDrawer } from "@/context/AuthDrawerContext";
import type { Advertisement } from "@/types/advertisement";

export function AdvertisementSlider() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openAuthDrawer } = useAuthDrawer();
  const [index, setIndex] = useState(0);
  const [tracked, setTracked] = useState<Set<number>>(new Set());
  const [detailAd, setDetailAd] = useState<Advertisement | null>(null);

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["ad-slider"],
    queryFn: advertisementAPI.getSlider,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!ads.length) return;
    const current = ads[index];
    if (current && !tracked.has(current.id)) {
      advertisementAPI.track(current.id, "impression").catch(() => {});
      setTracked((prev) => new Set(prev).add(current.id));
    }
  }, [ads, index, tracked]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [ads.length]);

  if (isLoading) {
    return (
      <div className="rounded-card border border-gray-200 bg-white p-8">
        <TownLoader size="sm" label="Loading featured projects" />
      </div>
    );
  }

  if (!ads.length) {
    return (
      <section
        aria-label="Featured projects"
        className="rounded-card border border-dashed border-brand-200 bg-gradient-to-br from-brand-50/80 to-white p-5 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <Megaphone className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-gray-900">Featured projects</h2>
              <p className="mt-1 text-sm text-gray-600">
                Promote your property on the homepage slider. Submit an ad for admin review.
              </p>
            </div>
          </div>
          {isAuthenticated ? (
            <Button asChild className="shrink-0 bg-brand-500 hover:bg-brand-700 text-white">
              <Link to="/advertise/submit">Advertise your property</Link>
            </Button>
          ) : (
            <Button
              type="button"
              className="shrink-0 bg-brand-500 hover:bg-brand-700 text-white"
              onClick={() => openAuthDrawer("login", { from: "/advertise/submit" })}
            >
              Advertise your property
            </Button>
          )}
        </div>
      </section>
    );
  }

  const ad = ads[index];

  const handleExplore = (item: Advertisement) => {
    advertisementAPI.track(item.id, "click").catch(() => {});
    if (item.property_id) {
      navigate(`/property/${item.property_id}`);
      return;
    }
    advertisementAPI.track(item.id, "view").catch(() => {});
    setDetailAd(item);
  };

  const handleEnquiry = (item: Advertisement) => {
    advertisementAPI.track(item.id, "enquiry").catch(() => {});
    if (item.contact_phone) {
      window.location.href = `tel:${item.contact_phone}`;
    }
  };

  return (
    <section aria-label="Featured projects" className="relative overflow-hidden rounded-card border border-gray-200 bg-gray-900 shadow-soft-md">
      <div className="grid md:grid-cols-[1.1fr_1fr] min-h-[220px] sm:min-h-[260px]">
        <div className="relative z-10 flex flex-col justify-center p-5 sm:p-8 text-white">
          <span className="mb-2 inline-flex w-fit rounded-full bg-secondary-500/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            {ad.badge_text || "Featured project"}
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-semibold leading-tight">{ad.title}</h2>
          {ad.selling_point ? (
            <p className="mt-1 text-sm text-white/85">{ad.selling_point}</p>
          ) : null}
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
            <MapPin className="size-4 shrink-0" />
            {ad.location}
          </p>
          {ad.price_text ? (
            <p className="mt-2 text-base sm:text-lg font-semibold text-brand-100">{ad.price_text}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-brand-500 hover:bg-brand-700 text-white"
              onClick={() => handleExplore(ad)}
            >
              {ad.button_text || "Learn more"}
            </Button>
            {ad.contact_phone ? (
              <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => handleEnquiry(ad)}>
                Enquire
              </Button>
            ) : null}
          </div>
        </div>

        <div className="relative min-h-[180px] md:min-h-full">
          {ad.banner_url ? (
            <img
              src={ad.banner_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-700 to-brand-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/30 to-transparent md:bg-gradient-to-l md:from-transparent md:via-gray-900/20 md:to-gray-900/70" />
        </div>
      </div>

      {ads.length > 1 ? (
        <>
          <WithTooltip label="Previous promotion" side="right">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => setIndex((i) => (i - 1 + ads.length) % ads.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
            >
              <ChevronLeft className="size-5" />
            </button>
          </WithTooltip>
          <WithTooltip label="Next promotion" side="left">
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => setIndex((i) => (i + 1) % ads.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
            >
              <ChevronRight className="size-5" />
            </button>
          </WithTooltip>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {ads.map((item, i) => (
              <WithTooltip key={item.id} label={`Go to slide ${i + 1}`}>
                <button
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
                />
              </WithTooltip>
            ))}
          </div>
        </>
      ) : null}

      <Dialog open={Boolean(detailAd)} onOpenChange={(open) => !open && setDetailAd(null)}>
        <DialogContent className="max-w-lg">
          {detailAd ? (
            <>
              <DialogHeader>
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                  {detailAd.badge_text || "Featured project"}
                </p>
                <DialogTitle>{detailAd.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {detailAd.location}
                </DialogDescription>
              </DialogHeader>

              {detailAd.banner_url ? (
                <img
                  src={detailAd.banner_url}
                  alt=""
                  className="h-40 w-full rounded-control object-cover"
                />
              ) : null}

              {detailAd.selling_point ? (
                <p className="text-sm font-medium text-gray-800">{detailAd.selling_point}</p>
              ) : null}

              {detailAd.price_text ? (
                <p className="text-base font-semibold text-brand-700">{detailAd.price_text}</p>
              ) : null}

              <MarkdownContent content={detailAd.description} emptyFallback="More details coming soon." />

              <DialogFooter>
                {detailAd.contact_phone ? (
                  <Button
                    type="button"
                    className="bg-brand-500 hover:bg-brand-700 text-white"
                    onClick={() => handleEnquiry(detailAd)}
                  >
                    <Phone className="mr-1.5 size-4" />
                    Call / Enquire
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={() => setDetailAd(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default AdvertisementSlider;
