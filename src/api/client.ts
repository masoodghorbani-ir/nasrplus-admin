import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: inject JWT Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('nasrplus_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle token expiration and standard errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Avoid looping if we are already attempting to login or on public landing/register pages
      const currentPath = window.location.pathname;
      const isPublicRoute =
        currentPath === '/' ||
        currentPath === '/login' ||
        currentPath === '/admin/login' ||
        currentPath.startsWith('/profile') ||
        currentPath.startsWith('/register') ||
        currentPath.startsWith('/landing') ||
        currentPath.startsWith('/portal') ||
        currentPath.startsWith('/join');

      if (!isPublicRoute) {
        localStorage.removeItem('nasrplus_token');
        localStorage.removeItem('nasrplus_user');
        window.location.href = `/admin/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
