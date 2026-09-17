import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";

import { useAuth, ROLE_HOME_ROUTE } from "@/context/AuthContext";
import { TownExchangeLogo, APP_NAME } from "@/components/brand/TownExchangeLogo";
import { Button } from "@/components/ui/button";

/** Friendly 404 — unknown routes no longer silently reset to marketing. */
export default function NotFoundPage() {
  const { user, isAuthenticated } = useAuth();
  const home = isAuthenticated && user ? ROLE_HOME_ROUTE[user.role] : "/";

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 py-16 text-center">
      <TownExchangeLogo size={48} variant="full" className="mb-8" />
      <p className="text-sm font-medium text-brand-600 tracking-wide uppercase">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        That link doesn&apos;t match anything in {APP_NAME}. It may have moved or been mistyped.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to={home}>
            <Home className="size-4" />
            {isAuthenticated ? "Back to app" : "Go to home"}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/property-feed">
            <ArrowLeft className="size-4" />
            Browse listings
          </Link>
        </Button>
      </div>
    </div>
  );
}
