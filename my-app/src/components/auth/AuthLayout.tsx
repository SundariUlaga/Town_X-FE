import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { TownExchangeLogo } from "@/components/brand/TownExchangeLogo";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-6 flex items-center justify-center">
          <TownExchangeLogo size={88} variant="full" className="rounded-xl shadow-soft-md" />
        </Link>

        <div className="rounded-card border border-border bg-card p-6 shadow-soft-lg">
          <h1 className="font-display text-xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}

export default AuthLayout;
