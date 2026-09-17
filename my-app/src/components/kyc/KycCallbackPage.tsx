import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { getPostAuthRoute, KYC_ROUTE, useAuth } from "@/context/AuthContext";
import TownLoader from "@/components/shared/TownLoader";
import { consumeKycReturnState } from "@/lib/authStorage";
import kycAPI from "@/services/kycAPI";

/** Handles return from Cashfree DigiLocker sandbox redirect. */
export default function KycCallbackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const saved = consumeKycReturnState();
      await kycAPI.getStatus();
      const user = await refreshUser();
      if (cancelled) return;
      if (!user) {
        navigate(KYC_ROUTE, { replace: true });
        return;
      }
      const dest = getPostAuthRoute(user, saved?.from);
      navigate(dest, {
        replace: true,
        state: saved?.feedState != null ? { feedState: saved.feedState } : undefined,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshUser]);

  return <TownLoader fullScreen label="Completing verification" />;
}
