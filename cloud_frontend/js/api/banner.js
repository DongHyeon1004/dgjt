import { apiClient } from './client.js';

export const bannerApi = {
  getBanners: async () => {
    const res = await apiClient.get('/banners');
    return res.data;
  },
  getAllBanners: async () => {
    const res = await apiClient.get('/banners/all');
    return res.data;
  },
  createBanner: async (data) => {
    const res = await apiClient.post('/banners', data);
    return res.data;
  },
  toggleBanner: async (id) => {
    const res = await apiClient.patch(`/banners/${id}`);
    return res.data;
  },
  deleteBanner: async (id) => {
    const res = await apiClient.delete(`/banners/${id}`);
    return res.data;
  },
};
