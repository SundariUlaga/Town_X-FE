import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth, KYC_ROUTE } from "@/context/AuthContext";
import { AuthRequiredRedirect } from "@/components/auth/AuthRouteRedirect";
import TownLoader from "@/components/shared/TownLoader";
import type { UserRole } from "@/types/user";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  /** Omit to allow any authenticated user regardless of role. */
  allowedRoles?: UserRole[];
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <TownLoader fullScreen label="Checking session" />;
  }

  if (!isAuthenticated) {
    return (
      <AuthRequiredRedirect
        from={location.pathname}
        feedState={location.state}
      />
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  const isKycExempt = location.pathname.startsWith(KYC_ROUTE);
  if (user && user.kyc_status !== "verified" && !isKycExempt) {
    return (
      <Navigate
        to={KYC_ROUTE}
        replace
        state={{ from: location.pathname, feedState: location.state }}
      />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
