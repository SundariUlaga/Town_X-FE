import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MessageSquareWarning, Plus, X } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import TownLoader from "@/components/shared/TownLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import advertisementAPI from "@/services/advertisementAPI";
import { AD_STATUS_LABELS, formatAdDate } from "@/lib/adUtils";
import { getApiErrorMessage } from "@/lib/apiErrors";
import type { Advertisement } from "@/types/advertisement";

function ApproveDialog({
  ad,
  open,
  onClose,
}: {
  ad: Advertisement | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [position, setPosition] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showHomepage, setShowHomepage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: () =>
      advertisementAPI.adminApprove(ad!.id, {
        display_position: position,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        show_on_homepage: showHomepage,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["ad-slider"] });
      onClose();
    },
    onError: (err) => setError(getApiErrorMessage(err, "Approval failed")),
  });

  if (!ad) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve & publish — {ad.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Display position</Label>
            <Input type="number" min={1} value={position} onChange={(e) => setPosition(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date</Label>
              <Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showHomepage} onChange={(e) => setShowHomepage(e.target.checked)} />
            Show in homepage slider
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!startDate || !endDate || approveMutation.isPending}
            onClick={() => approveMutation.mutate()}
          >
            Approve & publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminAdRow({
  ad,
  onApprove,
  onReject,
  onChanges,
}: {
  ad: Advertisement;
  onApprove: (ad: Advertisement) => void;
  onReject: (ad: Advertisement) => void;
  onChanges: (ad: Advertisement) => void;
}) {
  const status = AD_STATUS_LABELS[ad.status] ?? AD_STATUS_LABELS.DRAFT;

  return (
    <div className="rounded-card border border-border bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        {ad.banner_url ? (
          <img src={ad.banner_url} alt="" className="h-24 w-full rounded-control object-cover lg:w-40" />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">{ad.title}</h3>
              <p className="text-xs text-muted-foreground">
                {ad.submitter_name ? `Submitted by ${ad.submitter_name}` : "Admin created"} · {ad.location}
              </p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
              {status.label}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{ad.description}</p>
          {ad.status === "PUBLISHED" || ad.status === "EXPIRED" ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {ad.impressions} impressions · {ad.views} views · {ad.clicks} clicks · {ad.enquiries} enquiries
            </p>
          ) : null}
          {(ad.status === "PENDING_REVIEW" || ad.status === "CHANGES_REQUESTED") && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onApprove(ad)}>
                <Check className="size-4" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => onChanges(ad)}>
                <MessageSquareWarning className="size-4" /> Request changes
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => onReject(ad)}>
                <X className="size-4" /> Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminAdvertisementsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("PENDING_REVIEW");
  const [approveAd, setApproveAd] = useState<Advertisement | null>(null);
  const [notesAd, setNotesAd] = useState<Advertisement | null>(null);
  const [notes, setNotes] = useState("");
  const [rejectAd, setRejectAd] = useState<Advertisement | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["admin-advertisements", filter],
    queryFn: () => advertisementAPI.adminList(filter || undefined),
  });

  const rejectMutation = useMutation({
    mutationFn: () => advertisementAPI.adminReject(rejectAd!.id, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] });
      setRejectAd(null);
      setRejectReason("");
    },
  });

  const changesMutation = useMutation({
    mutationFn: () => advertisementAPI.adminRequestChanges(notesAd!.id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] });
      setNotesAd(null);
      setNotes("");
    },
  });

  return (
    <DashboardShell
      title="Advertisement management"
      subtitle="Review user submissions, approve schedules, and manage homepage slider"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {["PENDING_REVIEW", "PUBLISHED", "APPROVED", "CHANGES_REQUESTED", "REJECTED", ""].map((s) => (
          <Button
            key={s || "all"}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
          >
            {s ? AD_STATUS_LABELS[s]?.label ?? s : "All"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <TownLoader label="Loading advertisements" minHeight="30vh" />
      ) : ads.length === 0 ? (
        <p className="text-sm text-muted-foreground">No advertisements in this filter.</p>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <AdminAdRow
              key={ad.id}
              ad={ad}
              onApprove={setApproveAd}
              onReject={setRejectAd}
              onChanges={setNotesAd}
            />
          ))}
        </div>
      )}

      <ApproveDialog ad={approveAd} open={!!approveAd} onClose={() => setApproveAd(null)} />

      <Dialog open={!!rejectAd} onOpenChange={(v) => !v && setRejectAd(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject advertisement</DialogTitle></DialogHeader>
          <textarea
            className="w-full rounded-control border border-input px-3 py-2 text-sm min-h-[100px]"
            placeholder="Reason for rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="destructive" disabled={rejectReason.length < 3 || rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!notesAd} onOpenChange={(v) => !v && setNotesAd(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request changes</DialogTitle></DialogHeader>
          <textarea
            className="w-full rounded-control border border-input px-3 py-2 text-sm min-h-[100px]"
            placeholder="What should the user update?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <DialogFooter>
            <Button disabled={notes.length < 3 || changesMutation.isPending} onClick={() => changesMutation.mutate()}>
              Send to user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
