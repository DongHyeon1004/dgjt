import { apiClient } from './client.js';

export const userApi = {
  getMyProfile: async () => {
    const res = await apiClient.get('/users/me');
    return res.data;
  },
  updateMyProfile: async (data) => {
    const res = await apiClient.patch('/users/me', data);
    return res.data;
  },
  deleteMyAccount: async () => {
    const res = await apiClient.delete('/users/me');
    return res.data;
  },
  getUserProfile: async (userId) => {
    const res = await apiClient.get(`/users/${userId}`);
    return res.data;
  },
  getUserProducts: async (userId) => {
    const res = await apiClient.get(`/users/${userId}/products`);
    return res.data;
  },
  getUserReviews: async (userId) => {
    const res = await apiClient.get(`/users/${userId}/reviews`);
    return res.data;
  },
  checkNickname: async (nickname) => {
    const res = await apiClient.get(`/users/check-nickname?nickname=${encodeURIComponent(nickname)}`);
    return res.data;
  },
  listUsers: async () => {
    const res = await apiClient.get('/users');
    return res.data;
  },
  toggleAdminStatus: async (userId) => {
    const res = await apiClient.patch(`/users/${userId}/admin`);
    return res.data;
  },
};
