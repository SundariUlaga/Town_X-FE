import api from "./api";
import type { User } from "@/types/user";

export type QuestionStatus = "open" | "answered" | "closed";

export interface SupportQuestion {
  id: number;
  subject: string;
  message: string;
  status: QuestionStatus;
  admin_reply?: string | null;
  created_at: string;
  answered_at?: string | null;
}

export interface SubmitQuestionPayload {
  subject: string;
  message: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export const accountAPI = {
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>("/api/account/profile");
    return response.data;
  },

  updateProfile: async (name: string): Promise<User> => {
    const response = await api.patch<User>("/api/account/profile", { name });
    return response.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>("/api/account/change-password", payload);
    return response.data;
  },

  getQuestions: async (): Promise<SupportQuestion[]> => {
    const response = await api.get<SupportQuestion[]>("/api/account/questions");
    return response.data;
  },

  submitQuestion: async (payload: SubmitQuestionPayload): Promise<SupportQuestion> => {
    const response = await api.post<SupportQuestion>("/api/account/questions", payload);
    return response.data;
  },
};

export default accountAPI;
