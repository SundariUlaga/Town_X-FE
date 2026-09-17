import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Heart,
  Home,
  LogOut,
  MessageSquarePlus,
  Bell,
  Megaphone,
  Mail,
  Plus,
  Settings,
  UserRound,
} from "lucide-react";

import { TownExchangeBrand } from "@/components/brand/TownExchangeLogo";
import NavbarLocationPicker from "@/components/shared/NavbarLocationPicker";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth, ROLE_HOME_ROUTE } from "@/context/AuthContext";
import { useAuthDrawer, useLogout } from "@/context/AuthDrawerContext";
import { useSmartBack } from "@/lib/useSmartBack";
import { cn } from "@/lib/utils";
import { activeTabClass, inactiveTabClass } from "@/lib/tabStyles";
import { WithTooltip } from "@/components/ui/WithTooltip";
import type { UserRole } from "@/types/user";
import { useFocusTrap } from "@/lib/useFocusTrap";
import CreatePostModal from "@/components/CreatePostModal.jsx";

function displayName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}`;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function NavDivider() {
  return <span className="hidden md:block h-6 w-px bg-gray-200 shrink-0" aria-hidden />;
}

const postButtonClass =
  "inline-flex items-center gap-1.5 rounded-control bg-secondary-500 px-3 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-secondary-600 hover:shadow-secondary-glow transition-colors";

const postButtonCompactClass =
  "inline-flex items-center gap-1 rounded-control bg-secondary-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-soft-sm hover:bg-secondary-600 transition-colors";

function ProfileDropdown() {
  const { user } = useAuth();
  const logoutToHome = useLogout();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const items = [
    { label: "Profile", icon: UserRound, to: "/account/profile" },
    { label: "Q&A", icon: MessageSquarePlus, to: "/account/questions" },
    { label: "FAQ", icon: CircleHelp, to: "/account/faq" },
    { label: "Settings", icon: Settings, to: "/account/settings" },
  ];

  return (
    <div ref={rootRef} className="relative shrink-0">
      <WithTooltip label="Account menu">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-control px-1 py-1 sm:px-1.5 hover:bg-gray-100 transition-colors"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Account menu"
        >
          <span className="inline-flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-[10px] sm:text-xs font-semibold text-gray-600">
            {initials(user.name)}
          </span>
          <span className="hidden md:inline text-sm font-medium text-gray-700 truncate max-w-[7rem]">
            {displayName(user.name)}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-gray-400 shrink-0 hidden md:block transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </WithTooltip>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-[13.5rem] rounded-card border border-gray-200 bg-white py-1 shadow-soft-lg"
        >
          <div className="px-3 py-2 border-b border-gray-100 md:hidden">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
          {items.map(({ label, icon: Icon, to }) => (
            <button
              key={to}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate(to);
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Icon className="size-4 text-gray-500" />
              {label}
            </button>
          ))}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logoutToHome();
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

type AppMenuDrawerProps = {
  open: boolean;
  onClose: () => void;
  onPostProperty?: () => void;
};

function AppMenuDrawer({ open, onClose, onPostProperty }: AppMenuDrawerProps) {
  const { user } = useAuth();
  const logoutToHome = useLogout();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const homeRoute = user ? ROLE_HOME_ROUTE[user.role as UserRole] : "/home";
  const panelRef = useFocusTrap(open, onClose);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === homeRoute) return pathname === homeRoute || pathname === "/home";
    if (path === "/property-feed") {
      return pathname.startsWith("/property-feed") || pathname.startsWith("/property/");
    }
    if (path === "/favourites") return pathname.startsWith("/favourites");
    if (path === "/enquiries") return pathname.startsWith("/enquiries");
    if (path.startsWith("/account")) return pathname.startsWith("/account");
    return pathname.startsWith(path);
  };

  const linkClass = (path: string) =>
    cn(
      "flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-all",
      isActive(path) ? activeTabClass : inactiveTabClass
    );

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        ref={panelRef as RefObject<HTMLElement>}
        className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-white shadow-soft-lg safe-top safe-bottom"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-gray-900">Menu</p>
            {user ? (
              <p className="truncate text-xs text-gray-500">
                {user.name}
                <span className="capitalize"> · {user.role}</span>
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-control p-2 text-gray-500 hover:bg-gray-100 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Explore
          </p>
          <button type="button" className={linkClass(homeRoute)} onClick={() => go(homeRoute)}>
            <Home className="size-4" />
            Home
          </button>
          <button
            type="button"
            className={linkClass("/property-feed")}
            onClick={() => go("/property-feed")}
          >
            <Building2 className="size-4" />
            Browse listings
          </button>
          {user?.role === "buyer" && (
            <button
              type="button"
              className={linkClass("/favourites")}
              onClick={() => go("/favourites")}
            >
              <Heart className="size-4" />
              Favourites
            </button>
          )}
          {user?.role === "buyer" && (
            <button
              type="button"
              className={linkClass("/enquiries")}
              onClick={() => go("/enquiries")}
            >
              <Mail className="size-4" />
              My enquiries
            </button>
          )}
          {user?.role === "owner" && (
            <button
              type="button"
              className={linkClass(ROLE_HOME_ROUTE[user.role as UserRole])}
              onClick={() => go(ROLE_HOME_ROUTE[user.role as UserRole])}
            >
              <Building2 className="size-4" />
              Dashboard
            </button>
          )}
          <button
            type="button"
            className={linkClass("/advertise/my")}
            onClick={() => go("/advertise/my")}
          >
            <Megaphone className="size-4" />
            Advertise
          </button>

          {onPostProperty ? (
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-control bg-secondary-500 px-3 py-3 text-sm font-semibold text-white hover:bg-secondary-600"
              onClick={() => {
                onClose();
                onPostProperty();
              }}
            >
              <Plus className="size-4" />
              Post free property
            </button>
          ) : null}

          <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Account
          </p>
          <Link to="/account/profile" className={linkClass("/account/profile")} onClick={onClose}>
            <UserRound className="size-4" />
            Profile
          </Link>
          <Link
            to="/account/notifications"
            className={linkClass("/account/notifications")}
            onClick={onClose}
          >
            <Bell className="size-4" />
            Notifications
          </Link>
          <Link
            to="/account/questions"
            className={linkClass("/account/questions")}
            onClick={onClose}
          >
            <MessageSquarePlus className="size-4" />
            Q&A
          </Link>
          <Link to="/account/settings" className={linkClass("/account/settings")} onClick={onClose}>
            <Settings className="size-4" />
            Settings
          </Link>
          <Link to="/account/faq" className={linkClass("/account/faq")} onClick={onClose}>
            <CircleHelp className="size-4" />
            FAQ
          </Link>
        </nav>

        <div className="border-t border-gray-200 p-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            onClick={() => {
              onClose();
              logoutToHome();
            }}
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>
    </div>
  );
}

type DesktopNavProps = {
  onPostProperty?: () => void;
};

/**
 * Portal-style nav (99acres / NoBroker):
 * Browse tools + always-on Advertise + Post free property CTA for everyone.
 * Buyer extras (Favourites / Enquiries) and Owner Dashboard stay role-aware.
 */
function DesktopNavLinks({ onPostProperty }: DesktopNavProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const homeRoute = user ? ROLE_HOME_ROUTE[user.role as UserRole] : "/home";

  const isActive = (path: string) => {
    if (path === homeRoute) {
      return pathname === homeRoute || pathname === "/home";
    }
    if (path === "/property-feed") {
      return pathname.startsWith("/property-feed") || pathname.startsWith("/property/");
    }
    if (path === "/favourites") {
      return pathname.startsWith("/favourites");
    }
    if (path === "/enquiries") {
      return pathname.startsWith("/enquiries");
    }
    if (path === "/advertise/my") {
      return pathname.startsWith("/advertise");
    }
    return pathname.startsWith(path);
  };

  const linkClass = (path: string) =>
    cn(
      "hidden md:inline-flex items-center rounded-t-control px-2.5 py-2 text-xs font-medium transition-all whitespace-nowrap",
      isActive(path) ? activeTabClass : inactiveTabClass
    );

  return (
    <>
      <button type="button" className={linkClass(homeRoute)} onClick={() => navigate(homeRoute)}>
        Home
      </button>
      <button
        type="button"
        className={linkClass("/property-feed")}
        onClick={() => navigate("/property-feed")}
      >
        Browse
      </button>
      {user?.role === "buyer" && (
        <button
          type="button"
          className={linkClass("/favourites")}
          onClick={() => navigate("/favourites")}
        >
          Favourites
        </button>
      )}
      {user?.role === "buyer" && (
        <button
          type="button"
          className={linkClass("/enquiries")}
          onClick={() => navigate("/enquiries")}
        >
          My enquiries
        </button>
      )}
      {user?.role === "owner" && (
        <button
          type="button"
          className={linkClass(ROLE_HOME_ROUTE[user.role as UserRole])}
          onClick={() => navigate(ROLE_HOME_ROUTE[user.role as UserRole])}
        >
          Dashboard
        </button>
      )}
      <button
        type="button"
        className={linkClass("/advertise/my")}
        onClick={() => navigate("/advertise/my")}
      >
        Advertise
      </button>
      {onPostProperty ? (
        <button
          type="button"
          onClick={onPostProperty}
          className={cn("hidden lg:inline-flex", postButtonClass)}
          aria-label="Post free property"
        >
          <Plus className="size-3.5 shrink-0" />
          Post free property
        </button>
      ) : null}
    </>
  );
}

export type AppNavbarProps = {
  variant?: "home" | "inner";
  backTo?: string;
  backLabel?: string;
  /**
   * Location picker next to the logo. Default true — keep chrome consistent
   * across browse/home/account surfaces. Page titles belong in the page body (h1),
   * not beside the logo.
   */
  showLocation?: boolean;
  /** @deprecated Prefer page-level h1. Ignored for branding consistency. */
  logoTagline?: string;
  maxWidth?: "6xl" | "7xl" | "full";
  onPostProperty?: () => void;
  extraActions?: ReactNode;
};

export function AppNavbar({
  variant = "home",
  backTo = "/home",
  backLabel = "Back",
  showLocation = true,
  logoTagline: _logoTagline,
  maxWidth = "6xl",
  onPostProperty,
  extraActions,
}: AppNavbarProps) {
  const { user, isAuthenticated } = useAuth();
  const { openAuthDrawer } = useAuthDrawer();
  const navigate = useNavigate();
  const goBack = useSmartBack(backTo);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const homeRoute = user ? ROLE_HOME_ROUTE[user.role as UserRole] : "/home";

  const maxWidthClass =
    maxWidth === "full" ? "max-w-[90rem]" : maxWidth === "7xl" ? "max-w-7xl" : "max-w-6xl";

  const openPostFlow = () => {
    if (!isAuthenticated) {
      openAuthDrawer("signup", {
        defaultRole: "owner",
        from: "/owner/dashboard",
      });
      return;
    }
    if (onPostProperty) {
      onPostProperty();
      return;
    }
    setShowPostModal(true);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-soft-sm safe-top">
        <div className={cn("mx-auto px-2.5 sm:px-4 py-2 sm:py-2.5", maxWidthClass)}>
          <div className="flex items-center justify-between gap-1.5 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
              {variant === "inner" && (
                <WithTooltip label={backLabel}>
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex shrink-0 items-center justify-center p-1.5 sm:p-2 rounded-control hover:bg-gray-100 transition-colors"
                    aria-label={backLabel}
                  >
                    <ChevronLeft className="size-5 sm:size-6 text-gray-700" />
                  </button>
                </WithTooltip>
              )}

              <TownExchangeBrand
                asButton
                logoSize={variant === "home" ? 40 : 36}
                showTagline={false}
                onClick={() => navigate(homeRoute)}
                className="min-w-0"
              />

              {showLocation ? <NavbarLocationPicker /> : null}
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 shrink-0">
              {/* Desktop / tablet nav — hidden on mobile (lives in drawer) */}
              <DesktopNavLinks onPostProperty={openPostFlow} />

              {/* Compact Post: tablet only (desktop has full label; mobile has drawer CTA) */}
              <WithTooltip label="Post free property">
                <button
                  type="button"
                  onClick={openPostFlow}
                  className={cn("hidden md:inline-flex lg:hidden", postButtonCompactClass)}
                  aria-label="Post free property"
                >
                  <Plus className="size-3.5 shrink-0" />
                  Post
                </button>
              </WithTooltip>

              {/* Profile dropdown: desktop/tablet only — mobile uses drawer account section */}
              <div className="hidden md:block">
                <ProfileDropdown />
              </div>

              {extraActions}

              <NavDivider />

              <NotificationBell />

              {/* Mobile menu trigger */}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="md:hidden inline-flex size-9 shrink-0 items-center justify-center rounded-control text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                <span className="flex flex-col gap-[3px] w-[16px]" aria-hidden>
                  <span className="block h-[2px] w-full rounded-full bg-gray-700" />
                  <span className="block h-[2px] w-full rounded-full bg-gray-700" />
                  <span className="block h-[2px] w-full rounded-full bg-gray-700" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <AppMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onPostProperty={openPostFlow}
      />

      <CreatePostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSuccess={() => {
          setShowPostModal(false);
          if (user?.role === "owner") {
            navigate("/owner/dashboard");
          }
        }}
      />
    </>
  );
}

export default AppNavbar;
