import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { getPostAuthRoute, KYC_ROUTE, useAuth } from "@/context/AuthContext";
import { useAuthDrawer, type AuthDrawerMode } from "@/context/AuthDrawerContext";
import TownLoader from "@/components/shared/TownLoader";
import type { UserRole } from "@/types/user";
import { redirectToAdminConsole } from "@/lib/adminApp";

type AuthLocationState = {
  from?: string;
  defaultRole?: UserRole;
  feedState?: unknown;
};

/**
 * /login and /signup — guests get the auth drawer on the marketing page;
 * authenticated users go to their dashboard.
 *
 * Do not keep a full-screen "Opening sign in" loader on /login — that used to
 * stick forever after logout → ProtectedRoute → /login races.
 */
export function AuthRouteRedirect({ mode }: { mode: AuthDrawerMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { openAuthDrawer } = useAuthDrawer();

  useEffect(() => {
    if (isLoading) return;

    const state = location.state as AuthLocationState | null;
    const fromQuery = params.get("from") || undefined;
    const from = state?.from || fromQuery;

    if (isAuthenticated && user) {
      if (user.role === "admin") {
        redirectToAdminConsole("/dashboard");
        return;
      }
      const redirectTo = getPostAuthRoute(user, from);
      navigate(redirectTo, {
        replace: true,
        state:
          redirectTo === KYC_ROUTE
            ? { from, feedState: state?.feedState }
            : { feedState: state?.feedState },
      });
      return;
    }

    openAuthDrawer(mode, {
      from,
      defaultRole: state?.defaultRole,
      feedState: state?.feedState,
    });
    // Land on marketing with drawer open — never park on /login loader.
    navigate("/", { replace: true });
  }, [
    isAuthenticated,
    isLoading,
    location.state,
    mode,
    navigate,
    openAuthDrawer,
    params,
    user,
  ]);

  if (isLoading) {
    return <TownLoader fullScreen size="md" label="Checking session" />;
  }

  if (isAuthenticated) {
    return <TownLoader fullScreen size="md" label="Opening your home" />;
  }

  return null;
}

/** Protected route while logged out → open login drawer on marketing home. */
export function AuthRequiredRedirect({
  from,
  feedState,
}: {
  from: string;
  feedState?: unknown;
}) {
  const navigate = useNavigate();
  const { openAuthDrawer } = useAuthDrawer();

  useEffect(() => {
    openAuthDrawer("login", { from, feedState });
    navigate("/", { replace: true });
  }, [from, feedState, navigate, openAuthDrawer]);

  return null;
}

export default AuthRouteRedirect;
