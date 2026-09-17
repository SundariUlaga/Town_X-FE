import { Bell, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useSavedSearches,
} from "@/hooks/useNotifications";
import notificationAPI from "@/services/notificationAPI";
import { formatNotificationTime, getNotificationPath } from "@/lib/notificationUtils";
import { cn } from "@/lib/utils";
import TownLoader from "@/components/shared/TownLoader";
import { Button } from "@/components/ui/button";
import { WithTooltip } from "@/components/ui/WithTooltip";
import type { AppNotification } from "@/types/notification";
import { useQueryClient } from "@tanstack/react-query";
import { notificationQueryKeys } from "@/hooks/useNotifications";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useNotifications(false);
  const { data: savedSearches = [] } = useSavedSearches();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleOpen = async (item: AppNotification) => {
    if (!item.is_read) {
      await markRead.mutateAsync(item.id);
    }
    navigate(getNotificationPath(item));
  };

  const handleDeleteSearch = async (id: number) => {
    await notificationAPI.deleteSavedSearch(id);
    queryClient.invalidateQueries({ queryKey: notificationQueryKeys.savedSearches });
  };

  if (isLoading) {
    return <TownLoader label="Loading notifications" minHeight="16rem" />;
  }

  if (isError) {
    return (
      <div className="rounded-card border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-600">Could not load notifications.</p>
        <Button variant="outline" className="mt-3" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All notifications</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {data?.unread_count ?? 0} unread · {data?.total ?? 0} total
            </p>
          </div>
          {(data?.unread_count ?? 0) > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Mark all read
            </Button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="mx-auto size-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">You&apos;re all caught up</p>
            <p className="mt-1 text-xs text-gray-500">
              New listing alerts appear here when properties match your saved searches.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleOpen(item)}
                  className={cn(
                    "flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                    !item.is_read && "bg-brand-50/30"
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">{item.title}</span>
                    {!item.is_read ? (
                      <span className="size-2 rounded-full bg-brand-500 shrink-0" />
                    ) : null}
                  </span>
                  <span className="text-sm text-gray-600">{item.body}</span>
                  <span className="text-xs text-gray-400">
                    {formatNotificationTime(item.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-card border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">Saved search alerts</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            We notify you when a new listing matches these searches.
          </p>
        </div>

        {savedSearches.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Search on Home or Browse and tap &quot;Get alerts&quot; to save a search.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {savedSearches.map((search) => (
              <li
                key={search.id}
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{search.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {Object.entries(search.criteria)
                      .filter(([, value]) => value !== null && value !== "")
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" · ") || "Any criteria"}
                  </p>
                </div>
                <WithTooltip label={`Remove alert for ${search.label}`}>
                  <button
                    type="button"
                    onClick={() => handleDeleteSearch(search.id)}
                    className="shrink-0 rounded-control p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove alert for ${search.label}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </WithTooltip>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
