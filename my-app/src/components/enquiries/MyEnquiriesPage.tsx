import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

import { enquiryAPI } from "@/services/api";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import EmptyDiscoveryRail from "@/components/shared/EmptyDiscoveryRail";
import TownLoader from "@/components/shared/TownLoader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { useLocationContext } from "@/context/LocationContext";
import { EnquiryFeedbackActions, type EnquiryFeedbackRow } from "@/components/enquiries/EnquiryFeedbackActions";

type EnquiryRow = EnquiryFeedbackRow & {
  property_id?: number | null;
  advertisement_id?: number | null;
  title?: string | null;
  message: string;
  created_at: string;
};

export default function MyEnquiriesPage() {
  const { locationLabel } = useLocationContext();
  const query = useQuery({
    queryKey: ["my-enquiries"],
    queryFn: () => enquiryAPI.mine(),
  });

  const rows = useMemo(() => (query.data || []) as EnquiryRow[], [query.data]);
  const { page, setPage, pageCount, pageItems, pageSize, totalItems } = useClientPagination(rows, 8);

  const empty = !query.isLoading && !query.isError && rows.length === 0;

  return (
    <DashboardShell title="My enquiries" subtitle="Messages you sent to property owners and advertisers">
      {query.isLoading ? (
        <TownLoader size="md" label="Loading enquiries" minHeight="40vh" />
      ) : query.isError ? (
        <Card className="p-8 text-center text-sm text-destructive">Could not load your enquiries.</Card>
      ) : empty ? (
        <>
          <Card className="p-8 sm:p-10 text-center">
            <Mail className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="font-medium text-foreground">No enquiries yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse listings or sponsored projects and send a short message.
            </p>
            <Link to="/property-feed" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
              Browse properties →
            </Link>
          </Card>
          <EmptyDiscoveryRail
            title={locationLabel ? `Trending in ${locationLabel}` : "Recommended for you"}
            subtitle="Find a home worth asking about"
            fromPath="/enquiries"
          />
        </>
      ) : (
        <div className="space-y-3 pb-8">
          {pageItems.map((enquiry) => {
            const isAd = enquiry.source === "advertisement";
            const label =
              enquiry.title ||
              (isAd
                ? `Advertisement #${enquiry.advertisement_id}`
                : `Property #${enquiry.property_id}`);
            return (
              <Card key={`${enquiry.source || "property"}-${enquiry.id}`} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    {isAd || !enquiry.property_id ? (
                      <p className="text-sm font-semibold text-gray-900">{label}</p>
                    ) : (
                      <Link
                        to={`/property/${enquiry.property_id}`}
                        className="text-sm font-semibold text-brand-600 hover:underline"
                      >
                        {label}
                      </Link>
                    )}
                    {isAd ? (
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-brand-700">
                        Sponsored
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground break-words">{enquiry.message}</p>
                  </div>
                  <Badge
                    className={
                      enquiry.status === "NEW"
                        ? "bg-brand-100 text-brand-800"
                        : enquiry.status === "CLOSED"
                          ? "bg-trust-50 text-trust-800"
                          : "bg-slate-100 text-slate-700"
                    }
                  >
                    {enquiry.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(enquiry.created_at).toLocaleString("en-IN")}
                </p>
                <EnquiryFeedbackActions enquiry={enquiry} queryKey={["my-enquiries"]} />
              </Card>
            );
          })}
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            totalItems={totalItems}
            pageSize={pageSize}
            className="pt-2"
          />
        </div>
      )}
    </DashboardShell>
  );
}
