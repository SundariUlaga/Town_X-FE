import api from "./api";
import type { Advertisement, ApproveAdvertisementPayload } from "@/types/advertisement";

export const advertisementAPI = {
  getSlider: async () => {
    const response = await api.get<Advertisement[]>("/api/advertisements/slider");
    return response.data;
  },

  track: async (id: number, event: "impression" | "view" | "click" | "enquiry") => {
    await api.post(`/api/advertisements/${id}/track`, { event });
  },

  getMine: async () => {
    const response = await api.get<Advertisement[]>("/api/advertisements/mine");
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Advertisement>(`/api/advertisements/${id}`);
    return response.data;
  },

  submit: async (formData: FormData) => {
    const response = await api.post<Advertisement>("/api/advertisements", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  update: async (id: number, formData: FormData) => {
    const response = await api.patch<Advertisement>(`/api/advertisements/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  adminList: async (status?: string) => {
    const response = await api.get<Advertisement[]>("/api/advertisements/admin/all", {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  adminCreate: async (formData: FormData) => {
    const response = await api.post<Advertisement>("/api/advertisements/admin/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  adminApprove: async (id: number, payload: ApproveAdvertisementPayload) => {
    const response = await api.post<Advertisement>(`/api/advertisements/admin/${id}/approve`, payload);
    return response.data;
  },

  adminReject: async (id: number, reason: string) => {
    const response = await api.post<Advertisement>(`/api/advertisements/admin/${id}/reject`, { reason });
    return response.data;
  },

  adminRequestChanges: async (id: number, notes: string) => {
    const response = await api.post<Advertisement>(
      `/api/advertisements/admin/${id}/request-changes`,
      { notes }
    );
    return response.data;
  },

  adminUpdatePriority: async (id: number, display_position: number) => {
    const formData = new FormData();
    formData.append("display_position", String(display_position));
    const response = await api.patch<Advertisement>(
      `/api/advertisements/admin/${id}/priority`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },
};

export default advertisementAPI;
