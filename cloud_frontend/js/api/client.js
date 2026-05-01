import { config } from '../config.js';
import { getAccessToken, getRefreshToken, setAccessToken, clearSession } from '../auth/session.js';

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
});

apiClient.interceptors.request.use(
  (cfg) => {
    const token = getAccessToken();
    if (token) {
      cfg.headers.Authorization = `Bearer ${token}`;
    }
    return cfg;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const res = await axios.post(`${config.apiBaseUrl}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const newAccessToken = res.data.access_token;
          setAccessToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          clearSession();
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);
