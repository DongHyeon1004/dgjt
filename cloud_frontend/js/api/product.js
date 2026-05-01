import { apiClient } from './client.js';
import { config } from '../config.js';

const STATUS_MAP = {
  '예약중': 'reserved',
  '판매완료': 'sold',
};

export function mapToProduct(item) {
  const mappedStatus = STATUS_MAP[item.product_status] || 'sale';
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
    time: '방금 전',
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
    status: mappedStatus,
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
  updateProductStatus: async (id, status) => {
    const res = await apiClient.patch(`/products/${id}/status`, { status });
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
