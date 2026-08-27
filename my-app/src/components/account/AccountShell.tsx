import { NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  CircleHelp,
  MessageSquarePlus,
  Settings,
  UserRound,
} from "lucide-react";

import { useAuth, ROLE_HOME_ROUTE } from "@/context/AuthContext";
import AppNavbar from "@/components/shared/AppNavbar";
import { cn } from "@/lib/utils";
import { activeTabClass, inactiveTabClass } from "@/lib/tabStyles";

const NAV_ITEMS = [
  { to: "/account/profile", label: "Profile", icon: UserRound, end: false },
  { to: "/account/notifications", label: "Notifications", icon: Bell, end: false },
  { to: "/account/questions", label: "Q&A", icon: MessageSquarePlus, end: false },
  { to: "/account/faq", label: "FAQ", icon: CircleHelp, end: false },
  { to: "/account/settings", label: "Settings", icon: Settings, end: false },
] as const;

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    "flex items-center gap-2 rounded-t-control px-3 py-2.5 text-sm font-medium transition-all shrink-0",
    isActive ? activeTabClass : inactiveTabClass
  );
}

export function AccountShell() {
  const { user } = useAuth();
  const homeRoute = user ? ROLE_HOME_ROUTE[user.role] : "/home";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <AppNavbar variant="inner" backTo={homeRoute} backLabel="Back to app" />

      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-5 sm:py-6">
        <div className="mb-6">
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
            My Account
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile, ask questions, and account settings.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <nav className="lg:w-56 shrink-0">
            <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={navClass}>
                  <Icon className="size-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>

          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountShell;
