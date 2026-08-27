import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import notificationAPI from "@/services/notificationAPI";
import type { SavedSearchCriteria } from "@/types/notification";
import { useAuth } from "@/context/AuthContext";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
  savedSearches: ["notifications", "saved-searches"] as const,
};

export function useNotifications(unreadOnly = false) {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && user?.kyc_status === "verified";

  return useQuery({
    queryKey: [...notificationQueryKeys.all, { unreadOnly }],
    queryFn: () => notificationAPI.list({ unreadOnly }),
    enabled,
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && user?.kyc_status === "verified";

  return useQuery({
    queryKey: notificationQueryKeys.unreadCount,
    queryFn: notificationAPI.getUnreadCount,
    enabled,
    refetchInterval: 60_000,
    staleTime: 15_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAPI.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAPI.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount });
    },
  });
}

export function useSaveSearchAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ criteria, label }: { criteria: SavedSearchCriteria; label?: string }) =>
      notificationAPI.saveSearch(criteria, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.savedSearches });
    },
  });
}

export function useSavedSearches() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && user?.kyc_status === "verified";

  return useQuery({
    queryKey: notificationQueryKeys.savedSearches,
    queryFn: notificationAPI.listSavedSearches,
    enabled,
  });
}
