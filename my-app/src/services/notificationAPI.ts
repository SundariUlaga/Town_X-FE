import api from "./api";
import type {
  NotificationListResponse,
  SavedSearch,
  SavedSearchCriteria,
} from "@/types/notification";

export const notificationAPI = {
  list: async (params?: { skip?: number; limit?: number; unreadOnly?: boolean }) => {
    const response = await api.get<NotificationListResponse>("/api/notifications", {
      params: {
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 30,
        unread_only: params?.unreadOnly ?? false,
      },
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get<{ unread_count: number }>("/api/notifications/unread-count");
    return response.data.unread_count;
  },

  markRead: async (id: number) => {
    const response = await api.patch(`/api/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.post("/api/notifications/read-all");
    return response.data;
  },

  listSavedSearches: async () => {
    const response = await api.get<SavedSearch[]>("/api/notifications/saved-searches");
    return response.data;
  },

  saveSearch: async (criteria: SavedSearchCriteria, label?: string) => {
    const response = await api.post<SavedSearch>("/api/notifications/saved-searches", {
      criteria,
      label,
      is_active: true,
    });
    return response.data;
  },

  deleteSavedSearch: async (id: number) => {
    await api.delete(`/api/notifications/saved-searches/${id}`);
  },
};

export default notificationAPI;
