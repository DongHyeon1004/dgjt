import { apiClient } from './client.js';
import { config } from '../config.js';
import { timeAgo } from '../utils/format.js';

export function mapToProduct(item) {
  const thumbUrl = item.thumbnail_url
    ? `${config.uploadsBaseUrl}${item.thumbnail_url}`
    : 'https://via.placeholder.com/800';

  return {
    id: String(item.product_id),
    title: item.product_title,
    price: item.product_price,
    location: item.seller_region || '지역 정보 없음',
    thumbnail: thumbUrl,
    category: item.category,
    time: timeAgo(item.created_at),
    seller: {
      name: item.seller_nickname || item.user_id || '알 수 없음',
      rating: 5.0,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`,
    },
    description: item.product_body || '',
    images: item.image_urls
      ? item.image_urls.map((url) => `${config.uploadsBaseUrl}${url}`)
      : [],
    likes: 0,
    views: 0,
    userId: item.user_id,
  };
}

export const productApi = {
  getProducts: async (params) => {
    const res = await apiClient.get('/products', { params });
    return res.data.map(mapToProduct);
  },
  getProductById: async (id) => {
    const res = await apiClient.get(`/products/${id}`);
    return mapToProduct(res.data);
  },
  getMyProducts: async () => {
    const res = await apiClient.get('/products/me');
    return res.data.map(mapToProduct);
  },
  createProduct: async (data) => {
    const res = await apiClient.post('/products', data);
    return res.data;
  },
  updateProduct: async (id, data) => {
    const res = await apiClient.patch(`/products/${id}`, data);
    return res.data;
  },
  deleteProduct: async (id) => {
    const res = await apiClient.delete(`/products/${id}`);
    return res.data;
  },
  uploadProductImages: async (id, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const res = await apiClient.post(`/products/${id}/images`, formData);
    return res.data;
  },
  getRelatedProducts: async (id) => {
    const res = await apiClient.get(`/products/${id}/related`);
    return res.data.map(mapToProduct);
  },
  search: async (q) => {
    const res = await apiClient.get('/search', { params: { q } });
    return res.data;
  },
};
