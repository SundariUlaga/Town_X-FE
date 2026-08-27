import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, Megaphone, MousePointerClick, Phone, Plus } from "lucide-react";

import AppNavbar from "@/components/shared/AppNavbar";
import TownLoader from "@/components/shared/TownLoader";
import { Button } from "@/components/ui/button";
import advertisementAPI from "@/services/advertisementAPI";
import { AD_STATUS_LABELS, formatAdDate } from "@/lib/adUtils";
import type { Advertisement } from "@/types/advertisement";

function AdCard({ ad }: { ad: Advertisement }) {
  const status = AD_STATUS_LABELS[ad.status] ?? AD_STATUS_LABELS.DRAFT;

  return (
    <div className="overflow-hidden rounded-card border border-gray-200 bg-white shadow-soft-sm">
      <div className="grid sm:grid-cols-[140px_1fr]">
        <div className="h-32 sm:h-full bg-gray-100">
          {ad.banner_url ? (
            <img src={ad.banner_url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold text-gray-900">{ad.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Submitted {formatAdDate(ad.created_at)}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}>
              {status.label}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{ad.location}</p>

          {ad.admin_notes && ad.status === "CHANGES_REQUESTED" ? (
            <p className="mt-2 rounded-control bg-orange-50 px-3 py-2 text-xs text-orange-800">
              Admin note: {ad.admin_notes}
            </p>
          ) : null}

          {ad.status === "REJECTED" && ad.admin_notes ? (
            <p className="mt-2 rounded-control bg-red-50 px-3 py-2 text-xs text-red-700">
              Reason: {ad.admin_notes}
            </p>
          ) : null}

          {(ad.status === "PUBLISHED" || ad.status === "EXPIRED") && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-4">
              <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {ad.views} views</span>
              <span className="inline-flex items-center gap-1"><MousePointerClick className="size-3.5" /> {ad.clicks} clicks</span>
              <span className="inline-flex items-center gap-1"><Phone className="size-3.5" /> {ad.enquiries} enquiries</span>
              <span className="inline-flex items-center gap-1"><Megaphone className="size-3.5" /> {ad.impressions} impressions</span>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {ad.status === "CHANGES_REQUESTED" ? (
              <Button asChild size="sm" variant="outline">
                <Link to={`/advertise/edit/${ad.id}`}>Edit & resubmit</Link>
              </Button>
            ) : null}
            {ad.property_id ? (
              <Button asChild size="sm" variant="outline">
                <Link to={`/property/${ad.property_id}`}>View listing</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyAdvertisementsPage() {
  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["my-advertisements"],
    queryFn: advertisementAPI.getMine,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar variant="inner" backTo="/home" logoTagline="My advertisements" />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-gray-900">My advertisements</h1>
            <p className="text-sm text-gray-600 mt-1">Track review status and performance.</p>
          </div>
          <Button asChild>
            <Link to="/advertise/submit">
              <Plus className="size-4" />
              New advertisement
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <TownLoader label="Loading advertisements" minHeight="30vh" />
        ) : ads.length === 0 ? (
          <div className="rounded-card border border-gray-200 bg-white p-10 text-center">
            <Megaphone className="mx-auto size-10 text-gray-300" />
            <p className="mt-3 font-medium text-gray-900">No advertisements yet</p>
            <p className="mt-1 text-sm text-gray-500">Promote your property on the homepage slider.</p>
            <Button asChild className="mt-4">
              <Link to="/advertise/submit">Submit advertisement</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
