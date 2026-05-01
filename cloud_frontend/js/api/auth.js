import { apiClient } from './client.js';

export const authApi = {
  register: async (data) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
  login: async (data) => {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },
  logout: async (refreshToken) => {
    const res = await apiClient.post('/auth/logout', { refresh_token: refreshToken });
    return res.data;
  },
  refresh: async (refreshToken) => {
    const res = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    return res.data;
  },
  changePassword: async (data) => {
    const res = await apiClient.put('/auth/password/change', data);
    return res.data;
  },
  resetPassword: async (data) => {
    const res = await apiClient.post('/auth/password/reset', data);
    return res.data;
  },
};
