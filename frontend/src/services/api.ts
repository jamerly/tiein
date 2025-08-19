import axios from 'axios';
import type { AxiosRequestConfig, AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Assuming the backend always returns a standardized ApiResponse structure
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        return response.data.data; // Return the actual data payload
      } else {
        // If success is false, treat it as an error and reject the promise
        const error = new Error(response.data.message || 'Unknown API error');
        // You might want to attach more details from response.data to the error object
        return Promise.reject(error);
      }
    }
    return response; // If not a standardized ApiResponse, return as is
  },
  (error: AxiosError) => {
    // Handle HTTP errors (e.g., 404, 500)
    if (error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
      // If the error response itself is a standardized ApiResponse
      const apiError = error.response.data as { message: string };
      return Promise.reject(new Error(apiError.message));
    }
    return Promise.reject(error); // Re-throw other errors
  }
);

export default api;
