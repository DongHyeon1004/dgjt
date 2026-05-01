import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { productApi } from '../api/product.js';
import { renderProductCard } from '../components/productCard.js';
import { config } from '../config.js';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mapSearchItem(p) {
  const thumb = p.thumbnail_url
    ? `${config.uploadsBaseUrl}${p.thumbnail_url}`
    : 'https://via.placeholder.com/800';
  return {
    id: String(p.product_id),
    title: p.product_title,
    price: p.product_price,
    location: '검색된 지역',
    thumbnail: thumb,
    category: p.category,
    time: '방금 전',
    seller: { name: p.user_id, rating: 5, avatar: '' },
    images: [],
    likes: 0,
    views: 0,
    status: 'sale',
    userId: p.user_id,
  };
}

function renderResults(query, products) {
  const container = document.getElementById('search-results');
  document.getElementById('search-count').textContent = products.length;

  if (!products.length) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 space-y-4">
        <div class="p-6 bg-gray-50 rounded-full">
          <i data-lucide="search" width="48" height="48" class="text-gray-300"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-900">검색 결과가 없습니다</h3>
        <p class="text-gray-500">다른 검색어로 다시 시도해 보세요.</p>
        <a href="/" class="mt-4 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all">홈으로 돌아가기</a>
      </div>
    `;
    renderIcons();
    return;
  }

  container.innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
      ${products.map(renderProductCard).join('')}
    </div>
  `;
  renderIcons();
}

async function init() {
  await bootstrapLayout();
  const query = new URLSearchParams(location.search).get('q') || '';
  document.getElementById('search-query').textContent = query;

  if (!query) {
    document.getElementById('search-results').innerHTML =
      `<div class="text-center py-20 font-bold text-gray-400">검색어를 입력해주세요.</div>`;
    return;
  }

  try {
    const data = await productApi.search(query);
    const products = (data.products || []).map(mapSearchItem);
    renderResults(query, products);
  } catch (err) {
    console.error(err);
    document.getElementById('search-results').innerHTML =
      `<div class="text-center py-20 font-bold text-red-400">검색 중 오류가 발생했습니다.</div>`;
  }
}

init();
