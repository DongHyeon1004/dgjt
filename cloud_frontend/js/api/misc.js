import { apiClient } from './client.js';

export const miscApi = {
  getLikedProducts: async () => {
    const res = await apiClient.get('/products/liked');
    return res.data;
  },
};
