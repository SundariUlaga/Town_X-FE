import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";

import { enquiryAPI } from "@/services/api";
import { testimonialsAPI } from "@/services/testimonialsAPI";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { cn } from "@/lib/utils";

export type EnquiryFeedbackRow = {
  id: number;
  source?: "property" | "advertisement";
  status: string;
  can_close?: boolean;
  can_feedback?: boolean;
  has_feedback?: boolean;
  feedback_status?: string | null;
  feedback_category?: string | null;
};

const BUYER_OUTCOMES = ["Found a home", "Found a rental", "Used EMI calculator"];
const OWNER_OUTCOMES = ["Listed a property", "Got serious enquiries"];

type EnquiryFeedbackActionsProps = {
  enquiry: EnquiryFeedbackRow;
  queryKey: string[];
};

export function EnquiryFeedbackActions({ enquiry, queryKey }: EnquiryFeedbackActionsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const source = enquiry.source === "advertisement" ? "advertisement" : "property";
  const isOwner = enquiry.feedback_category === "owner";
  const outcomes = isOwner ? OWNER_OUTCOMES : BUYER_OUTCOMES;
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [outcome, setOutcome] = useState(outcomes[0]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  const closeMutation = useMutation({
    mutationFn: () => enquiryAPI.close(enquiry.id, source),
    onSuccess: () => {
      toast("Enquiry closed. You can share a short note below.", "success");
      invalidate();
    },
    onError: (err) => toast(getApiErrorMessage(err, "Could not close this enquiry."), "error"),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      testimonialsAPI.submitFromEnquiry({
        source,
        enquiry_id: enquiry.id,
        quote: quote.trim(),
        rating,
        outcome,
      }),
    onSuccess: () => {
      toast("Thanks — we’ll review this before it appears on the homepage.", "success");
      setQuote("");
      invalidate();
    },
    onError: (err) => toast(getApiErrorMessage(err, "Could not submit feedback."), "error"),
  });

  const waitingReview = enquiry.has_feedback && enquiry.feedback_status === "pending";
  const approved = enquiry.has_feedback && enquiry.feedback_status === "approved";

  return (
    <div className="mt-3 space-y-3">
      {enquiry.can_close ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={closeMutation.isPending}
          onClick={() => closeMutation.mutate()}
        >
          {closeMutation.isPending ? "Closing…" : "Mark as closed"}
        </Button>
      ) : null}

      {waitingReview ? (
        <p className="rounded-control border border-brand-100 bg-brand-50/70 px-3 py-2 text-xs text-brand-800">
          Feedback received — waiting for Town-X to approve it for the homepage.
        </p>
      ) : null}

      {approved ? (
        <p className="text-xs text-muted-foreground">Thanks — your note is on file.</p>
      ) : null}

      {enquiry.can_feedback ? (
        <form
          className="space-y-2 rounded-control border border-brand-100 bg-brand-50/40 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (quote.trim().length < 10) {
              toast("Write at least 10 characters so others get a useful note.", "error");
              return;
            }
            submitMutation.mutate();
          }}
        >
          <p className="text-sm font-semibold text-gray-900">Share feedback</p>
          <p className="text-[11px] text-gray-500">
            Optional. Won’t go live until Town-X reviews it.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {outcomes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setOutcome(item)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium",
                  outcome === item
                    ? "bg-brand-600 text-white"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-brand-50"
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="rounded p-0.5 text-amber-400"
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
              >
                <Star className={cn("size-4", n <= rating ? "fill-amber-400" : "text-gray-300")} />
              </button>
            ))}
          </div>
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={3}
            maxLength={600}
            placeholder="What helped — locality filters, reply time, EMI estimate…"
            className="w-full rounded-control border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <Button type="submit" size="sm" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Sending…" : "Send feedback"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export default EnquiryFeedbackActions;
