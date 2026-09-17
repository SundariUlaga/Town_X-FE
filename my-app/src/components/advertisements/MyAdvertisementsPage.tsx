import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, Eye, Megaphone, MousePointerClick, Phone, Plus } from "lucide-react";

import AppNavbar from "@/components/shared/AppNavbar";
import TownLoader from "@/components/shared/TownLoader";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Pagination } from "@/components/ui/pagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { advertisementAPI } from "@/services/advertisementAPI";
import { AD_STATUS_LABELS, formatAdDate } from "@/lib/adUtils";
import type { Advertisement } from "@/types/advertisement";
import { useAuth, ROLE_HOME_ROUTE } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type SortKey = "recent" | "views" | "clicks" | "enquiries";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Most recent" },
  { value: "views", label: "Most views" },
  { value: "clicks", label: "Most clicks" },
  { value: "enquiries", label: "Most enquiries" },
];

function AdCard({ ad }: { ad: Advertisement }) {
  const status = AD_STATUS_LABELS[ad.status] ?? AD_STATUS_LABELS.DRAFT;

  return (
    <div className="overflow-hidden rounded-card border border-gray-200 bg-white shadow-soft-sm">
      <div className="grid sm:grid-cols-[140px_1fr]">
        <div className="h-32 sm:h-full min-h-[7rem] bg-gray-100">
          {ad.banner_url ? (
            <img src={ad.banner_url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 line-clamp-2">{ad.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Submitted {formatAdDate(ad.created_at)}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.className}`}>
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
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" /> {ad.views} views
              </span>
              <span className="inline-flex items-center gap-1">
                <MousePointerClick className="size-3.5" /> {ad.clicks} clicks
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" /> {ad.enquiries} enquiries
              </span>
              <span className="inline-flex items-center gap-1">
                <Megaphone className="size-3.5" /> {ad.impressions} impressions
              </span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
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
  const { user } = useAuth();
  const backTo = user ? ROLE_HOME_ROUTE[user.role] : "/home";
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["my-advertisements"],
    queryFn: advertisementAPI.getMine,
  });

  const sorted = useMemo(() => {
    let list = [...ads];
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }
    list.sort((a, b) => {
      if (sortBy === "views") return (b.views || 0) - (a.views || 0);
      if (sortBy === "clicks") return (b.clicks || 0) - (a.clicks || 0);
      if (sortBy === "enquiries") return (b.enquiries || 0) - (a.enquiries || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [ads, sortBy, statusFilter]);

  const { page, setPage, pageCount, pageItems, pageSize, totalItems } = useClientPagination(
    sorted,
    6
  );

  const statuses = useMemo(() => {
    const set = new Set(ads.map((a) => a.status));
    return ["all", ...Array.from(set)];
  }, [ads]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar variant="inner" backTo={backTo} />

      <main className="mx-auto max-w-3xl px-3 sm:px-4 py-5 sm:py-6 pb-20 safe-bottom">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-gray-900">
              My advertisements
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isLoading
                ? "Loading…"
                : `${ads.length} campaign${ads.length === 1 ? "" : "s"} · track review & performance`}
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/advertise/submit">
              <Plus className="size-4" />
              New advertisement
            </Link>
          </Button>
        </div>

        {!isLoading && ads.length > 0 ? (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    statusFilter === status
                      ? "border-brand-500 bg-brand-50 text-brand-800"
                      : "border-gray-200 bg-white text-gray-600 hover:border-brand-200"
                  )}
                >
                  {status === "all" ? "All" : AD_STATUS_LABELS[status]?.label || status}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <ArrowDownUp className="size-3.5 shrink-0 text-gray-500" aria-hidden />
              <Dropdown
                value={sortBy}
                onChange={(v) => setSortBy(v as SortKey)}
                options={SORT_OPTIONS}
                aria-label="Sort advertisements"
                size="sm"
                className="min-w-[11rem] flex-1 sm:flex-none"
              />
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <TownLoader label="Loading advertisements" minHeight="30vh" />
        ) : ads.length === 0 ? (
          <div className="rounded-card border border-gray-200 bg-white p-8 sm:p-10 text-center">
            <Megaphone className="mx-auto size-10 text-gray-300" />
            <p className="mt-3 font-medium text-gray-900">No advertisements yet</p>
            <p className="mt-1 text-sm text-gray-500">Promote your property on the homepage slider.</p>
            <Button asChild className="mt-4">
              <Link to="/advertise/submit">Submit advertisement</Link>
            </Button>
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No ads match this status filter.</p>
        ) : (
          <div className="space-y-4">
            {pageItems.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </div>
        )}
      </main>
    </div>
  );
}
