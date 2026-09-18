import { useEffect } from "react";

import { useToast } from "@/components/ui/toast";
import { peekSessionNotice } from "@/lib/authStorage";

/** Surfaces a timed-out session as a toast (login drawer also shows the same copy). */
export function SessionExpiryNotice() {
  const { toast } = useToast();

  useEffect(() => {
    const show = () => {
      const message = peekSessionNotice();
      if (message) toast(message, "error");
    };
    show();
    window.addEventListener("townx:session-expired", show);
    return () => window.removeEventListener("townx:session-expired", show);
  }, [toast]);

  return null;
}

export default SessionExpiryNotice;
