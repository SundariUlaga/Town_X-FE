import api from "./api";

export type TestimonialCategory = "buyer" | "owner" | "renter";

export type HomeTestimonial = {
  id: number;
  name: string;
  role: string;
  location?: string | null;
  quote: string;
  rating: number;
  category: TestimonialCategory;
  outcome?: string | null;
  avatar_url?: string | null;
  is_verified: boolean;
  display_order: number;
};

export type TestimonialStats = {
  listings_live: number;
  listings_live_label: string;
  enquiries_48h: number;
  enquiries_48h_label: string;
  verified_listings: number;
  verified_listings_label: string;
};

export type TestimonialsPayload = {
  items: HomeTestimonial[];
  stats: TestimonialStats;
};

export const testimonialsAPI = {
  listPublic: async (limit = 50): Promise<TestimonialsPayload> => {
    const response = await api.get("/api/testimonials", {
      params: { featured: false, limit },
    });
    return response.data;
  },
  listFeatured: async (limit = 50): Promise<TestimonialsPayload> => {
    const response = await api.get("/api/testimonials", {
      params: { featured: false, limit },
    });
    return response.data;
  },
  submitFromEnquiry: async (payload: {
    source: "property" | "advertisement";
    enquiry_id: number;
    quote: string;
    rating: number;
    outcome?: string;
  }) => {
    const response = await api.post("/api/testimonials/from-enquiry", payload);
    return response.data as { id: number; status: string; message: string };
  },
};

export default testimonialsAPI;
