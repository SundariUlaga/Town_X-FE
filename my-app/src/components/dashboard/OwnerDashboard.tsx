import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, IndianRupee, Mail, Plus, Trash2, Pencil } from "lucide-react";

import { propertyAPI, enquiryAPI } from "@/services/api";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import TownLoader from "@/components/shared/TownLoader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatInr } from "@/lib/finance";
import { activeTabClass, inactiveTabClass } from "@/lib/tabStyles";
import CreatePostModal from "@/components/CreatePostModal.jsx";
import type { Property } from "@/types/property";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "PENDING_REVIEW", label: "Pending" },
  { key: "PUBLISHED", label: "Published" },
  { key: "CHANGES_REQUESTED", label: "Changes requested" },
  { key: "REJECTED", label: "Rejected" },
];

const DASHBOARD_TABS = [
  { key: "listings", label: "Listings" },
  { key: "enquiries", label: "Enquiries received" },
];

function statusBadgeClass(status?: string) {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-100 text-emerald-800";
    case "PENDING_REVIEW":
      return "bg-amber-100 text-amber-800";
    case "CHANGES_REQUESTED":
      return "bg-orange-100 text-orange-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dashboardTab, setDashboardTab] = useState("listings");

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["my-properties"],
    queryFn: () => propertyAPI.getMyProperties(),
  });

  const enquiriesQuery = useQuery({
    queryKey: ["enquiries-received"],
    queryFn: () => enquiryAPI.received(),
    enabled: dashboardTab === "enquiries",
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => propertyAPI.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-properties"] });
      setPendingDeleteId(null);
    },
  });

  const filteredProperties = useMemo(() => {
    if (statusFilter === "all") return properties;
    return properties.filter((p: Property) => p.status === statusFilter);
  }, [properties, statusFilter]);

  const totalValue = properties.reduce((sum: number, p: Property) => sum + (p.expected_price || 0), 0);
  const forRentCount = properties.filter((p: Property) => p.property_for === "Rent/Lease").length;

  const openEditModal = (property: Property) => {
    setEditProperty(property);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditProperty(null);
  };

  return (
    <DashboardShell
      title="Your listings"
      subtitle="Manage properties and buyer enquiries"
      actions={
        <Button
          onClick={() => {
            setEditProperty(null);
            setShowCreateModal(true);
          }}
        >
          <Plus className="size-4" />
          Add property
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {DASHBOARD_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setDashboardTab(tab.key)}
            className={dashboardTab === tab.key ? activeTabClass : inactiveTabClass}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {dashboardTab === "enquiries" ? (
        <div className="space-y-4">
          {enquiriesQuery.isLoading ? (
            <TownLoader size="md" label="Loading enquiries" minHeight="30vh" />
          ) : enquiriesQuery.isError ? (
            <Card className="p-8 text-center text-sm text-destructive">Could not load enquiries.</Card>
          ) : (enquiriesQuery.data || []).length === 0 ? (
            <Card className="p-10 text-center">
              <Mail className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="font-medium text-foreground">No enquiries yet</p>
              <p className="mt-1 text-sm text-muted-foreground">When buyers contact you, messages appear here.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {(enquiriesQuery.data || []).map((enquiry: { id: number; property_id: number; message: string; status: string; created_at: string }) => (
                <Card key={enquiry.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Property #{enquiry.property_id}</p>
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
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Total listings" value={properties.length} icon={Building2} />
            <MetricCard label="Listed for rent" value={forRentCount} icon={Building2} />
            <MetricCard label="Combined asking value" value={formatInr(totalValue, { compact: true })} icon={IndianRupee} />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={statusFilter === tab.key ? activeTabClass : inactiveTabClass}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <TownLoader size="md" label="Loading listings" minHeight="40vh" />
          ) : filteredProperties.length === 0 ? (
            <Card className="p-10 text-center">
              <Building2 className="mx-auto mb-3 size-10 text-muted-foreground" />
              <p className="font-medium text-foreground">No listings in this view</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {properties.length === 0
                  ? "Post your first listing to start reaching buyers and renters."
                  : "Try another status filter or add a new property."}
              </p>
              {properties.length === 0 ? (
                <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                  <Plus className="size-4" />
                  Add property
                </Button>
              ) : null}
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map((property: Property) => (
                <Card key={property.id} className="overflow-hidden">
                  <div className="h-36 bg-secondary">
                    {property.images?.[0]?.url && (
                      <img src={property.images[0].url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">
                        {property.bhk_type} {property.apartment_type}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(property.status)}`}>
                        {(property.status || "PUBLISHED").replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {property.locality}, {property.city}
                    </p>
                    <p className="font-display text-lg font-semibold text-primary">
                      {formatInr(property.expected_price, { compact: true })}
                    </p>
                    {property.admin_notes ? (
                      <div className="rounded-md border border-orange-200 bg-orange-50 p-2 text-xs text-orange-900">
                        <span className="font-medium">Admin feedback:</span> {property.admin_notes}
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/property/${property.id}`)}>
                        View
                      </Button>
                      {["CHANGES_REQUESTED", "REJECTED"].includes(property.status || "") ? (
                        <Button size="sm" variant="outline" onClick={() => openEditModal(property)}>
                          <Pencil className="size-4" />
                          Edit & resubmit
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/40 hover:bg-destructive/10"
                        onClick={() => setPendingDeleteId(property.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={closeModal}
        editProperty={editProperty}
        onSuccess={() => {
          closeModal();
          queryClient.invalidateQueries({ queryKey: ["my-properties"] });
        }}
      />

      <Dialog open={pendingDeleteId !== null} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>
              This removes the listing and its photos permanently. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => pendingDeleteId && deleteMutation.mutate(pendingDeleteId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
