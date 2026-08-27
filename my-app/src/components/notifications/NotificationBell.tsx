import {
  Bell,
  Building2,
  CheckCheck,
  MessageSquare,
  Search,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import { formatNotificationTime, getNotificationPath } from "@/lib/notificationUtils";
import { cn } from "@/lib/utils";
import TownLoader from "@/components/shared/TownLoader";
import type { AppNotification, NotificationType } from "@/types/notification";

const TYPE_META: Record<
  NotificationType,
  { icon: typeof Bell; className: string }
> = {
  search_match: { icon: Search, className: "bg-brand-50 text-brand-700" },
  new_property: { icon: Building2, className: "bg-brand-50 text-brand-700" },
  listing_live: { icon: Sparkles, className: "bg-secondary-50 text-secondary-800" },
  question_answered: { icon: MessageSquare, className: "bg-status-success-bg text-status-success" },
  ad_submitted: { icon: Megaphone, className: "bg-amber-50 text-amber-800" },
  ad_approved: { icon: Sparkles, className: "bg-blue-50 text-blue-800" },
  ad_rejected: { icon: MessageSquare, className: "bg-red-50 text-red-700" },
  ad_changes_requested: { icon: MessageSquare, className: "bg-orange-50 text-orange-800" },
  ad_published: { icon: Megaphone, className: "bg-green-50 text-green-800" },
};

function NotificationRow({
  item,
  onOpen,
}: {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
}) {
  const meta = TYPE_META[item.type] ?? TYPE_META.new_property;
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        "flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-gray-50",
        !item.is_read && "bg-brand-50/40"
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full",
          meta.className
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</span>
          {!item.is_read ? (
            <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
          ) : null}
        </span>
        <span className="mt-0.5 block text-xs text-gray-600 line-clamp-2">{item.body}</span>
        <span className="mt-1 block text-[11px] text-gray-400">
          {formatNotificationTime(item.created_at)}
        </span>
      </span>
    </button>
  );
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const canUse = isAuthenticated && user?.kyc_status === "verified";
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data, isLoading, isError, refetch } = useNotifications(false);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

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

  if (!canUse) {
    return (
      <button
        type="button"
        className="inline-flex shrink-0 items-center justify-center p-1.5 sm:p-2 text-gray-400 rounded-control"
        aria-label="Notifications"
        title="Log in and verify to get alerts"
        disabled
      >
        <Bell className="size-[18px] sm:size-5" strokeWidth={1.75} />
      </button>
    );
  }

  const handleOpenItem = async (item: AppNotification) => {
    if (!item.is_read) {
      await markRead.mutateAsync(item.id);
    }
    setOpen(false);
    navigate(getNotificationPath(item));
  };

  const items = data?.items ?? [];

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) refetch();
        }}
        className="relative inline-flex shrink-0 items-center justify-center p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-control transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell className="size-[18px] sm:size-5" strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-secondary-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-[min(92vw,22rem)] overflow-hidden rounded-card border border-gray-200 bg-white shadow-soft-lg"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[min(60vh,24rem)] overflow-y-auto divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-6">
                <TownLoader size="sm" label="Loading alerts" />
              </div>
            ) : isError ? (
              <div className="p-4 text-center text-sm text-gray-600">
                Could not load notifications.
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-2 block w-full text-brand-700 hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto size-8 text-gray-300" />
                <p className="mt-2 text-sm font-medium text-gray-900">No notifications yet</p>
                <p className="mt-1 text-xs text-gray-500">
                  Search for properties to get alerts when new listings match.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <NotificationRow key={item.id} item={item} onOpen={handleOpenItem} />
              ))
            )}
          </div>

          <div className="border-t border-gray-100 px-3 py-2">
            <Link
              to="/account/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-medium text-brand-700 hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
