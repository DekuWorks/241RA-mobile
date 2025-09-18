import axios from "axios";
import { API_BASE } from "../config/api";
import { SecureTokenService } from "../services/secureTokens";

// Get JWT token from secure store
async function getJwt(): Promise<string | null> {
  try {
    return await SecureTokenService.getAccessToken();
  } catch (error) {
    console.warn('Failed to get JWT token:', error);
    return null;
  }
}

export const http = axios.create({ 
  baseURL: API_BASE, 
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to attach Bearer token
http.interceptors.request.use(async (cfg) => {
  const token = await getJwt();
  if (token && cfg.headers) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Response interceptor to handle token refresh and errors
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureTokenService.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE}/api/auth/refresh`, {
            refreshToken: refreshToken,
          });

          if (response.data.accessToken) {
            await SecureTokenService.setAccessToken(response.data.accessToken);
            if (response.data.refreshToken) {
              await SecureTokenService.setRefreshToken(response.data.refreshToken);
            }

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            }
            return http(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens
        await SecureTokenService.clearAll();
        console.warn('Token refresh failed, user needs to re-authenticate');
      }
    }

    return Promise.reject(error);
  }
);
