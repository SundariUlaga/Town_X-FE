import api from "./api";

export type NewsItem = {
  id: number;
  title: string;
  summary?: string | null;
  source_name?: string | null;
  url: string;
  image_url?: string | null;
  published_at?: string | null;
  fetched_at?: string | null;
};

export const newsAPI = {
  list: async (limit = 8): Promise<NewsItem[]> => {
    const response = await api.get("/api/news", { params: { limit } });
    return response.data;
  },
};

export default newsAPI;
