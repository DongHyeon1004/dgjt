import { apiClient } from './client.js';
import { config } from '../config.js';

export function mapToShare(item) {
  const thumbUrl = item.thumbnail_url
    ? `${config.uploadsBaseUrl}${item.thumbnail_url}`
    : 'https://via.placeholder.com/800';

  return {
    id: String(item.share_id),
    title: item.share_title,
    price: 0,
    location: item.seller_region || '지역 정보 없음',
    thumbnail: thumbUrl,
    time: '방금 전',
    seller: {
      name: item.seller_nickname || item.user_id || '알 수 없음',
      rating: 5.0,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`,
    },
    description: item.share_body || '',
    images: item.image_urls
      ? item.image_urls.map((url) => `${config.uploadsBaseUrl}${url}`)
      : [],
    likes: 0,
    views: 0,
    status: item.share_status || 'available',
    userId: item.user_id,
  };
}

export const shareApi = {
  getShares: async (params) => {
    const res = await apiClient.get('/shares', { params });
    return res.data.map(mapToShare);
  },
  getShareById: async (id) => {
    const res = await apiClient.get(`/shares/${id}`);
    return mapToShare(res.data);
  },
  getMyShares: async () => {
    const res = await apiClient.get('/shares/me');
    return res.data.map(mapToShare);
  },
  createShare: async (data) => {
    const res = await apiClient.post('/shares', data);
    return res.data;
  },
  updateShare: async (id, data) => {
    const res = await apiClient.patch(`/shares/${id}`, data);
    return res.data;
  },
  deleteShare: async (id) => {
    const res = await apiClient.delete(`/shares/${id}`);
    return res.data;
  },
  uploadShareImages: async (id, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const res = await apiClient.post(`/shares/${id}/images`, formData);
    return res.data;
  },
  updateShareStatus: async (id, status) => {
    const res = await apiClient.patch(`/shares/${id}/status`, { status });
    return res.data;
  },
};
