import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { LayoutGroup, motion } from "motion/react";

import { cn } from "@/lib/utils";
import type { Advertisement } from "@/types/advertisement";
import { advertisementAPI } from "@/services/advertisementAPI";
import { TrendingLocalities } from "@/components/home/TrendingLocalities";
import { SponsoredAdDetail } from "@/components/home/SponsoredAdDetail";

type SponsoredCarouselProps = {
  ads: Advertisement[];
  loading?: boolean;
  className?: string;
};

function SponsoredCard({
  ad,
  onOpen,
}: {
  ad: Advertisement;
  onOpen: (ad: Advertisement) => void;
}) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        advertisementAPI.track(ad.id, "click").catch(() => {});
        onOpen(ad);
      }}
      className="group flex w-[min(78vw,240px)] shrink-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition-shadow hover:border-brand-200 hover:shadow-soft-sm"
    >
      <div className="relative h-32 bg-gray-100">
        <motion.div layoutId={`sponsored-banner-${ad.id}`} className="absolute inset-0">
          {ad.banner_url ? (
            <img
              src={ad.banner_url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-brand-900 text-white/70">
              <Building2 className="size-6" />
            </div>
          )}
        </motion.div>
        <span className="absolute left-1.5 top-1.5 rounded bg-gray-900/75 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
          Ad
        </span>
      </div>
      <div className="space-y-0.5 px-2.5 py-2.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 group-hover:text-brand-700">
          {ad.title}
        </p>
        {ad.location ? <p className="truncate text-xs text-gray-500">{ad.location}</p> : null}
        {ad.price_text ? (
          <p className="text-xs font-semibold text-brand-800">{ad.price_text}</p>
        ) : null}
      </div>
    </motion.button>
  );
}

export function SponsoredCarousel({ ads, loading, className }: SponsoredCarouselProps) {
  const inventory = ads.slice(0, 8);
  const [detailAd, setDetailAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    if (loading || inventory.length === 0) return;
    inventory.forEach((ad) => {
      advertisementAPI.track(ad.id, "impression").catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, inventory.map((a) => a.id).join(",")]);

  return (
    <LayoutGroup id="sponsored-ads">
    <div className={cn("space-y-3", className)}>
      {loading ? (
        <section className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Sponsored</h2>
          </div>
          <div className="flex gap-2.5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[11rem] w-[240px] shrink-0 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        </section>
      ) : inventory.length > 0 ? (
        <section className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Sponsored</h2>
            <Link to="/advertise/submit" className="text-xs font-medium text-brand-700 hover:underline">
              Advertise
            </Link>
          </div>
          <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 scrollbar-hide">
            {inventory.map((ad) => (
              <SponsoredCard key={ad.id} ad={ad} onOpen={setDetailAd} />
            ))}
          </div>
        </section>
      ) : (
        <section className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Sponsored</h2>
          </div>
          <Link
            to="/advertise/submit"
            className="block rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-3 py-3 text-center text-xs text-brand-800 hover:bg-brand-50"
          >
            Promote your project here →
          </Link>
        </section>
      )}

      <TrendingLocalities />

      <SponsoredAdDetail ad={detailAd} onClose={() => setDetailAd(null)} />
    </div>
    </LayoutGroup>
  );
}

export default SponsoredCarousel;
