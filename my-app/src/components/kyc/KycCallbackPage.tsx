import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { getPostAuthRoute, useAuth } from "@/context/AuthContext";
import TownLoader from "@/components/shared/TownLoader";
import kycAPI from "@/services/kycAPI";

/** Handles return from Cashfree DigiLocker sandbox redirect. */
export default function KycCallbackPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await kycAPI.getStatus();
      const user = await refreshUser();
      if (cancelled) return;
      navigate(user ? getPostAuthRoute(user) : "/kyc", { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshUser]);

  return <TownLoader fullScreen label="Completing verification" />;
}
