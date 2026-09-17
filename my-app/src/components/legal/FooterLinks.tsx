import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

export const LEGAL_ROUTES = {
  about: "/about",
  terms: "/terms",
  privacy: "/privacy",
  faqs: "/faqs",
} as const;

const LEGAL_PATHS = new Set<string>(Object.values(LEGAL_ROUTES));

/** Preserve the in-app page the user came from across legal-page hops. */
export function useLegalLinkState(): { from: string } | undefined {
  const location = useLocation();

  return useMemo(() => {
    const existing = (location.state as { from?: string } | null)?.from?.trim();
    if (existing && !LEGAL_PATHS.has(existing)) {
      return { from: existing };
    }
    if (!LEGAL_PATHS.has(location.pathname) && location.pathname !== "/") {
      return { from: location.pathname };
    }
    return undefined;
  }, [location.pathname, location.state]);
}

export function FooterLinks({ className }: { className?: string }) {
  const linkState = useLegalLinkState();
  const linkClass =
    "hover:text-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm";

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-500",
        className
      )}
      aria-label="Legal and help links"
    >
      <Link to={LEGAL_ROUTES.about} state={linkState} className={linkClass}>
        About Us
      </Link>
      <Link to={LEGAL_ROUTES.terms} state={linkState} className={linkClass}>
        Terms &amp; Conditions
      </Link>
      <Link to={LEGAL_ROUTES.privacy} state={linkState} className={linkClass}>
        Privacy Policy
      </Link>
      <Link to={LEGAL_ROUTES.faqs} state={linkState} className={linkClass}>
        FAQs
      </Link>
    </nav>
  );
}

export default FooterLinks;
