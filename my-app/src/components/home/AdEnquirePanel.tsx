import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Phone } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type { Advertisement } from "@/types/advertisement";
import { enquiryAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import { useAuth, KYC_ROUTE } from "@/context/AuthContext";
import { useAuthDrawer } from "@/context/AuthDrawerContext";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/apiErrors";

const DEFAULT_ENQUIRY =
  "Hi, I'm interested in this project. Please share more details.";

type AdEnquirePanelProps = {
  ad: Advertisement;
  onBack?: () => void;
  variant?: "full" | "compact";
};

export function AdEnquirePanel({ ad, onBack, variant = "full" }: AdEnquirePanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { openAuthDrawer } = useAuthDrawer();
  const { toast } = useToast();
  const [message, setMessage] = useState(DEFAULT_ENQUIRY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const isOwnAd = Boolean(user && ad.user_id && ad.user_id === user.id);

  const ensureCanEnquire = () => {
    if (!user) {
      openAuthDrawer("login", { from: "/home" });
      return false;
    }
    if (user.kyc_status !== "verified") {
      navigate(KYC_ROUTE, { state: { from: "/home" } });
      return false;
    }
    if (isOwnAd) {
      setError("You cannot enquire on your own advertisement.");
      return false;
    }
    return true;
  };

  const handleSend = async () => {
    if (!ensureCanEnquire()) return;
    const body = message.trim() || DEFAULT_ENQUIRY;
    setSubmitting(true);
    setError(null);
    try {
      await enquiryAPI.createAd({
        advertisement_id: ad.id,
        message: body,
        contact_method: "phone",
      });
      setSent(true);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["my-enquiries"] });
      queryClient.invalidateQueries({ queryKey: ["enquiries-received"] });
      toast("Enquiry sent to the advertiser", "success");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send enquiry. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-emerald-700">
          Enquiry sent. The advertiser will see your message in their inbox.
        </p>
        <div className="flex flex-wrap gap-2">
          {onBack ? (
            <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
              Back
            </Button>
          ) : null}
          {ad.contact_phone ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                window.location.href = `tel:${ad.contact_phone}`;
              }}
            >
              <Phone className="size-4" />
              Call
            </Button>
          ) : null}
          <Button
            type="button"
            className="flex-1 bg-brand-600 hover:bg-brand-700"
            onClick={() => navigate("/enquiries")}
          >
            View my enquiries
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isOwnAd ? (
        <p className="text-sm text-gray-600">This is your advertisement — buyers will send enquiries here.</p>
      ) : (
        <>
          <label htmlFor={`ad-enquiry-${ad.id}`} className={variant === "compact" ? "sr-only" : "text-xs font-medium text-gray-700"}>
            Short message
          </label>
          <textarea
            id={`ad-enquiry-${ad.id}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            disabled={submitting}
            className="w-full rounded-control border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500 disabled:bg-gray-50"
            placeholder={DEFAULT_ENQUIRY}
          />
        </>
      )}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {onBack ? (
          <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
            Back
          </Button>
        ) : null}
        {ad.contact_phone ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => {
              window.location.href = `tel:${ad.contact_phone}`;
            }}
          >
            <Phone className="size-4" />
            Call
          </Button>
        ) : null}
        <Button
          type="button"
          className="flex-1 bg-brand-600 hover:bg-brand-700"
          onClick={handleSend}
          disabled={submitting || isOwnAd}
        >
          <MessageSquare className="size-4" />
          {submitting ? "Sending..." : "Send enquiry"}
        </Button>
      </div>
    </div>
  );
}

export default AdEnquirePanel;
