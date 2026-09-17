import axios from 'axios';
import { getApiBaseUrl } from '@/lib/apiBase';

const API_BASE_URL = getApiBaseUrl();

/**
 * Configuration API Service
 * Handles all landing page configuration related API calls
 */
export const configAPI = {
  /**
   * Get landing page configuration
   * @returns {Promise<Object>} Landing page configuration object
   */
  getLandingConfig: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/landing-config`, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching landing config:', error);
      
      // Handle specific error cases
      if (error.response) {
        // Server responded with error status
        console.error('Server Error:', error.response.status, error.response.data);
        throw new Error(`Failed to fetch config: ${error.response.data.detail || error.response.statusText}`);
      } else if (error.request) {
        // Request was made but no response received
        console.error('Network Error: No response received');
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else {
        // Something else happened
        console.error('Error:', error.message);
        throw error;
      }
    }
  },

  /**
   * Update landing page configuration (admin only)
   * @param {Object} config - The configuration object to update
   * @returns {Promise<Object>} Update response
   */
  updateLandingConfig: async (config) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/landing-config`,
        config,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating landing config:', error);
      
      // Handle specific error cases
      if (error.response) {
        console.error('Server Error:', error.response.status, error.response.data);
        throw new Error(`Failed to update config: ${error.response.data.detail || error.response.statusText}`);
      } else if (error.request) {
        console.error('Network Error: No response received');
        throw new Error('Unable to connect to server. Please check your internet connection.');
      } else {
        console.error('Error:', error.message);
        throw error;
      }
    }
  },

  /**
   * Get configuration with cache support
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Object>} Landing page configuration
   */
  getLandingConfigCached: async (forceRefresh = false) => {
    const CACHE_KEY = 'landing_config_cache';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    // Check if we should use cache
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          
          // Return cached data if still valid
          if (now - timestamp < CACHE_DURATION) {
            console.log('✓ Using cached configuration');
            return data;
          }
        } catch (e) {
          console.error('Error parsing cached config:', e);
          localStorage.removeItem(CACHE_KEY);
        }
      }
    }
    
    // Fetch fresh data
    try {
      const data = await configAPI.getLandingConfig();
      
      // Cache the response
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      console.log('✓ Configuration fetched and cached');
      return data;
    } catch (error) {
      // If fetch fails, try to use expired cache as fallback
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        console.warn('⚠ Using expired cache due to fetch error');
        const { data } = JSON.parse(cachedData);
        return data;
      }
      throw error;
    }
  },

  /**
   * Clear configuration cache
   */
  clearCache: () => {
    localStorage.removeItem('landing_config_cache');
    console.log('✓ Configuration cache cleared');
  }
};

// Export individual functions for named imports
export const {
  getLandingConfig,
  updateLandingConfig,
  getLandingConfigCached,
  clearCache
} = configAPI;

// Default export
export default configAPI;
