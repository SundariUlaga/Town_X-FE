import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  X,
  Tag,
  MessageSquare,
} from "lucide-react";

import type { Advertisement } from "@/types/advertisement";
import { advertisementAPI } from "@/services/advertisementAPI";
import { Button } from "@/components/ui/button";
import MarkdownContent from "@/components/shared/MarkdownContent";
import { cn } from "@/lib/utils";
import { AdEnquirePanel } from "@/components/home/AdEnquirePanel";

type SponsoredAdDetailProps = {
  ad: Advertisement | null;
  onClose: () => void;
};

export function SponsoredAdDetail({ ad, onClose }: SponsoredAdDetailProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [showEnquire, setShowEnquire] = useState(false);

  useEffect(() => {
    setShowEnquire(false);
  }, [ad?.id]);

  useEffect(() => {
    if (!ad) return;
    advertisementAPI.track(ad.id, "view").catch(() => {});
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [ad, onClose]);

  const handleCall = () => {
    if (!ad?.contact_phone) return;
    window.location.href = `tel:${ad.contact_phone}`;
  };

  const content = (
    <AnimatePresence>
      {ad ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Close advertisement"
            className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`sponsored-ad-title-${ad.id}`}
            className={cn(
              "relative z-[1] flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden",
              "rounded-t-3xl bg-white shadow-soft-lg sm:rounded-3xl"
            )}
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 48, scale: 0.94, rotateX: 6 }
            }
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, y: 32, scale: 0.96, transition: { duration: 0.18 } }
            }
            transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.85 }}
            style={{ transformPerspective: 1200 }}
          >
            <div className="relative h-52 shrink-0 overflow-hidden sm:h-60">
              <motion.div
                layoutId={`sponsored-banner-${ad.id}`}
                className="absolute inset-0"
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
              >
                {ad.banner_url ? (
                  <img
                    src={ad.banner_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-800 via-brand-700 to-trust-800">
                    <Building2 className="size-14 text-white/50" />
                  </div>
                )}
              </motion.div>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

              <motion.div
                className="absolute left-4 top-4 flex flex-wrap gap-1.5"
                initial={reduceMotion ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.3 }}
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-800 shadow-soft-sm">
                  <Sparkles className="size-3 text-brand-600" />
                  {ad.badge_text || "Sponsored"}
                </span>
                <span className="rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Ad
                </span>
              </motion.div>

              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 rounded-full bg-black/45 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/65"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>

              <div className="absolute inset-x-0 bottom-0 p-4 pt-10">
                <motion.h2
                  id={`sponsored-ad-title-${ad.id}`}
                  className="font-display text-xl font-semibold leading-snug text-white sm:text-2xl"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.35 }}
                >
                  {ad.title}
                </motion.h2>
                {ad.location ? (
                  <motion.p
                    className="mt-1.5 flex items-center gap-1.5 text-sm text-white/85"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22, duration: 0.3 }}
                  >
                    <MapPin className="size-3.5 shrink-0" />
                    {ad.location}
                  </motion.p>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <motion.div
                className="flex flex-wrap gap-2"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {ad.price_text ? (
                  <span className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800">
                    {ad.price_text}
                  </span>
                ) : null}
                {ad.property_type ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                    <Tag className="size-3" />
                    {ad.property_type}
                  </span>
                ) : null}
                {ad.ad_type ? (
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium capitalize text-gray-600">
                    {ad.ad_type}
                  </span>
                ) : null}
              </motion.div>

              {ad.selling_point ? (
                <motion.p
                  className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white px-3.5 py-3 text-sm font-medium leading-relaxed text-brand-900"
                  initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.26, type: "spring", stiffness: 300, damping: 28 }}
                >
                  {ad.selling_point}
                </motion.p>
              ) : null}

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <MarkdownContent
                  content={ad.description}
                  className="text-sm"
                  emptyFallback="Tap below to explore this promotion."
                />
              </motion.div>

              {(ad.contact_phone || ad.contact_email) && (
                <motion.div
                  className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-sm"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.34 }}
                >
                  {ad.contact_phone ? (
                    <a
                      href={`tel:${ad.contact_phone}`}
                      className="inline-flex items-center gap-2 font-medium text-gray-800 hover:text-brand-700"
                    >
                      <Phone className="size-3.5 text-brand-600" />
                      {ad.contact_phone}
                    </a>
                  ) : null}
                  {ad.contact_email ? (
                    <a
                      href={`mailto:${ad.contact_email}`}
                      className="inline-flex items-center gap-2 font-medium text-gray-800 hover:text-brand-700"
                    >
                      <Mail className="size-3.5 text-brand-600" />
                      {ad.contact_email}
                    </a>
                  ) : null}
                </motion.div>
              )}
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 sm:px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {showEnquire ? (
                <AdEnquirePanel ad={ad} onBack={() => setShowEnquire(false)} />
              ) : (
                <div className="flex gap-2">
                  {ad.contact_phone ? (
                    <Button type="button" variant="outline" className="flex-1" onClick={handleCall}>
                      <Phone className="size-4" />
                      Call
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    className="flex-1 bg-brand-600 hover:bg-brand-700"
                    onClick={() => setShowEnquire(true)}
                  >
                    <MessageSquare className="size-4" />
                    Enquire
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

export default SponsoredAdDetail;
