import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Users2 } from "lucide-react";

import { TownExchangeLogo, APP_NAME, APP_LOCATION } from "@/components/brand/TownExchangeLogo";
import { FooterLinks, LEGAL_ROUTES } from "@/components/legal/FooterLinks";
import { getPostAuthRoute, useAuth } from "@/context/AuthContext";

const STACK_RACK_TAG = "A Stack Rack product";
const LEGAL_PATHS = new Set<string>(Object.values(LEGAL_ROUTES));

function useLegalReturnPath(): { path: string; label: string } {
  const { user } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from?.trim();

  if (from && !LEGAL_PATHS.has(from)) {
    const label =
      from.includes("dashboard") || from.startsWith("/owner") || from.startsWith("/admin")
        ? "Back to dashboard"
        : from.startsWith("/account")
          ? "Back to account"
          : "Back to app";
    return { path: from, label };
  }

  if (user) {
    const path = getPostAuthRoute(user);
    const label =
      user.role === "owner" || user.role === "admin" ? "Back to dashboard" : "Back to home";
    return { path, label };
  }

  return { path: "/", label: "Back to home" };
}

export function LegalPageLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { path: returnPath, label: backLabel } = useLegalReturnPath();

  const goBack = () => {
    navigate(returnPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-xl safe-top">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={goBack}
            className="flex min-w-0 items-center gap-2.5 hover:opacity-85 transition-opacity"
            aria-label={backLabel}
          >
            <TownExchangeLogo size={36} variant="full" />
          </button>
          <button
            type="button"
            onClick={goBack}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-control px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            {backLabel}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[10px] font-medium tracking-wide text-gray-500 sm:text-xs">
            {STACK_RACK_TAG}
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
              {subtitle}
            </p>
          )}
          {lastUpdated && (
            <p className="mt-2 text-xs text-gray-400">Last updated: {lastUpdated}</p>
          )}
        </div>

        <article className="rounded-card border border-gray-100 bg-white p-5 shadow-soft-sm sm:p-8 md:p-10 legal-prose">
          {children}
        </article>
      </main>

      <footer className="border-t border-gray-200 bg-white/80">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
              aria-label={backLabel}
            >
              <TownExchangeLogo size={32} variant="full" />
            </button>
            <FooterLinks />
          </div>
          <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-gray-200 pt-6 text-xs text-gray-500">
            <Users2 className="size-3.5" />
            <span>
              &copy; {new Date().getFullYear()} {APP_NAME}. Built for {APP_LOCATION}, by {APP_LOCATION}.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LegalPageLayout;
