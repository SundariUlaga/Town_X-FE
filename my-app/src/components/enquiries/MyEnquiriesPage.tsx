import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

import { enquiryAPI } from "@/services/api";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import TownLoader from "@/components/shared/TownLoader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MyEnquiriesPage() {
  const query = useQuery({
    queryKey: ["my-enquiries"],
    queryFn: () => enquiryAPI.mine(),
  });

  return (
    <DashboardShell title="My enquiries" subtitle="Messages you sent to property owners">
      {query.isLoading ? (
        <TownLoader size="md" label="Loading enquiries" minHeight="40vh" />
      ) : query.isError ? (
        <Card className="p-8 text-center text-sm text-destructive">Could not load your enquiries.</Card>
      ) : (query.data || []).length === 0 ? (
        <Card className="p-10 text-center">
          <Mail className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="font-medium text-foreground">No enquiries yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse listings and use Send enquiry on a property detail page.
          </p>
          <Link to="/property-feed" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
            Browse properties →
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {(query.data || []).map((enquiry: { id: number; property_id: number; message: string; status: string; created_at: string }) => (
            <Card key={enquiry.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link to={`/property/${enquiry.property_id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                    Property #{enquiry.property_id}
                  </Link>
                  <p className="mt-2 text-sm text-muted-foreground">{enquiry.message}</p>
                </div>
                <Badge className={enquiry.status === "NEW" ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-700"}>
                  {enquiry.status}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{new Date(enquiry.created_at).toLocaleString("en-IN")}</p>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
