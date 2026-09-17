import axios from 'axios';
import { getToken, notifyUnauthorized } from '@/lib/authStorage';
import { getApiBaseUrl } from '@/lib/apiBase';

// Empty baseURL → relative /api via Vite proxy (cookie session works).
const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
  withCredentials: true,
});

// Attach cached Bearer when present (cookie is primary; Bearer helps tab sync / tools).
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      // Avoid clearing on auth bootstrap / OTP endpoints that legitimately 401.
      const url = String(error.config?.url || '');
      const isAuthProbe =
        url.includes('/api/auth/me') ||
        url.includes('/api/auth/send-otp') ||
        url.includes('/api/auth/verify-otp') ||
        url.includes('/api/auth/logout');
      if (!isAuthProbe) {
        notifyUnauthorized();
      }
    }
    return Promise.reject(error);
  }
);

// Properties API
export const propertyAPI = {
  // Get all properties with filters
  getProperties: async (params = {}) => {
    try {
      const response = await api.get('/api/properties', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  // Get single property by ID
  getPropertyById: async (id) => {
    try {
      const response = await api.get(`/api/properties/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  },

  // Search properties (optional AbortSignal cancels in-flight request on new keystrokes)
  searchProperties: async (query, limit = 20, signal) => {
    try {
      const response = await api.get('/api/properties/search', {
        params: { q: query, limit },
        signal,
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      console.error('Error searching properties:', error);
      throw error;
    }
  },

  // Create new property
  createProperty: async (formData) => {
    try {
      const response = await api.post('/api/properties', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  },

  updateProperty: async (id, formData) => {
    try {
      const response = await api.patch(`/api/properties/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  },

  // Delete property
  deleteProperty: async (id) => {
    try {
      const response = await api.delete(`/api/properties/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  },

  // Get statistics
  getStats: async () => {
    try {
      const response = await api.get('/api/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // Get category statistics
  getCategoryStats: async () => {
    try {
      const response = await api.get('/api/categories/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching category stats:', error);
      throw error;
    }
  },

  getMarketInsights: async (params = {}) => {
    const response = await api.get('/api/market/insights', { params });
    return response.data;
  },

  getFeaturedProperties: async (params = {}) => {
    const response = await api.get('/api/properties/featured', { params });
    return response.data;
  },

  // Get properties listed by the logged-in user (owner dashboard)
  getMyProperties: async (skip = 0, limit = 100) => {
    try {
      const response = await api.get('/api/properties/mine', { params: { skip, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching my properties:', error);
      throw error;
    }
  },

  // NEW FAVOURITE METHODS

  // Toggle favourite status of a property
  toggleFavourite: async (propertyId) => {
    try {
      const response = await api.post(`/api/properties/${propertyId}/favourite`);
      return response.data;
    } catch (error) {
      console.error('Error toggling favourite:', error);
      throw error;
    }
  },

  /** Builder/owner self-service inventory — does not re-trigger property moderation. */
  upsertProjectDetails: async (propertyId, payload) => {
    const response = await api.post(`/api/properties/${propertyId}/project-details`, payload);
    return response.data;
  },

  // Get all favourite properties
  getFavourites: async (skip = 0, limit = 100) => {
    try {
      const response = await api.get('/api/favourites', {
        params: { skip, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching favourites:', error);
      throw error;
    }
  },

  // Get count of favourite properties
  getFavouritesCount: async () => {
    try {
      const response = await api.get('/api/favourites/count');
      return response.data;
    } catch (error) {
      console.error('Error fetching favourites count:', error);
      throw error;
    }
  },
};

export const enquiryAPI = {
  create: async (payload) => {
    const { data } = await api.post('/api/enquiries', payload);
    return data;
  },
  mine: async () => {
    const { data } = await api.get('/api/enquiries/mine');
    return data;
  },
  received: async () => {
    const { data } = await api.get('/api/enquiries/received');
    return data;
  },
};

export const reportAPI = {
  reportProperty: async (payload) => {
    const { data } = await api.post('/api/reports/properties', payload);
    return data;
  },
};

export const activityAPI = {
  trackSearch: async (params = {}) => {
    const { data } = await api.post('/api/activity/search', null, { params });
    return data;
  },
};

export const recommendationsAPI = {
  getHome: async () => {
    const { data } = await api.get('/api/recommendations/home');
    return data;
  },
};

// Tamil Nadu location hierarchy (District → Taluk → Village)
export const locationAPI = {
  getDistricts: async () => {
    const response = await api.get('/api/locations/districts');
    return response.data;
  },

  getTaluks: async (districtId) => {
    const response = await api.get(`/api/locations/taluks/${districtId}`);
    return response.data;
  },

  getVillages: async (talukId, q) => {
    const response = await api.get(`/api/locations/villages/${talukId}`, {
      params: q ? { q } : undefined,
    });
    return response.data;
  },

  search: async (query, limit = 20, signal) => {
    const response = await api.get('/api/locations/search', {
      params: { q: query, limit },
      signal,
    });
    return response.data;
  },
};

export default api;
