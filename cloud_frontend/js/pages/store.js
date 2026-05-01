import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { userApi } from '../api/user.js';
import { mapToProduct } from '../api/product.js';
import { renderProductCard } from '../components/productCard.js';

const TABS = ['상품', '후기', '상점정보'];

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getUserIdParam() {
  return new URLSearchParams(location.search).get('userId');
}

function renderTabs(active) {
  return TABS.map((tab) => `
    <button data-tab="${tab}" class="pb-4 text-lg font-bold transition-all relative ${active === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}">
      ${tab}
      ${active === tab ? '<div class="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"></div>' : ''}
    </button>
  `).join('');
}

function renderStars() {
  return Array.from({ length: 5 }).map(() => `<i data-lucide="star" width="18" height="18" fill="currentColor"></i>`).join('');
}

function renderTabContent(activeTab, products) {
  if (activeTab === '상품') {
    if (!products.length) {
      return `<div class="py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200"><p class="text-gray-400 font-bold">등록된 상품이 없습니다.</p></div>`;
    }
    return `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">${products.map(renderProductCard).join('')}</div>`;
  }
  return `<div class="py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200"><p class="text-gray-400 font-bold">아직 내역이 없습니다.</p></div>`;
}

function render(profile, products, activeTab) {
  const container = document.getElementById('store-container');
  container.innerHTML = `
    <div class="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-gray-100 border border-gray-100 mb-12">
      <div class="flex flex-col md:flex-row items-center gap-10">
        <div class="relative">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.user_id || '')}" alt="Profile" class="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] shadow-xl border-4 border-white" />
        </div>
        <div class="flex-1 text-center md:text-left space-y-4">
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <h1 class="text-4xl font-black text-gray-900 tracking-tight">${escapeHtml(profile?.nickname)}</h1>
            <div class="flex gap-2 justify-center md:justify-start">
              <button class="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"><i data-lucide="share-2" width="20" height="20"></i></button>
            </div>
          </div>
          <div class="flex flex-wrap justify-center md:justify-start gap-6 text-sm font-bold text-gray-500">
            <div class="flex items-center gap-2">지역 <span class="text-gray-900">${escapeHtml(profile?.region)}</span></div>
            <div class="flex items-center gap-2">아이디 <span class="text-gray-900">${escapeHtml(profile?.user_id)}</span></div>
            <div class="flex items-center gap-2">상품판매 <span class="text-gray-900">${products.length}</span></div>
          </div>
          <div class="flex items-center justify-center md:justify-start gap-1 text-orange-400">
            ${renderStars()}
            <span class="text-gray-400 text-sm font-bold ml-2">5.0 (0개 후기)</span>
          </div>
        </div>
      </div>
    </div>

    <div id="store-tabs" class="flex gap-8 border-b border-gray-100 mb-10 overflow-x-auto">${renderTabs(activeTab)}</div>
    <div id="store-tab-content">${renderTabContent(activeTab, products)}</div>
  `;
  renderIcons();
}

function bindTabs(profile, products, current) {
  const tabs = document.getElementById('store-tabs');
  if (!tabs) return;
  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    const next = btn.dataset.tab;
    if (next === current) return;
    render(profile, products, next);
    bindTabs(profile, products, next);
  });
}

async function init() {
  await bootstrapLayout();
  const userId = getUserIdParam();
  if (!userId) {
    document.getElementById('store-container').innerHTML =
      `<div class="h-[60vh] flex items-center justify-center font-bold text-gray-400">잘못된 접근입니다.</div>`;
    return;
  }
  try {
    const [profile, userProducts] = await Promise.all([
      userApi.getUserProfile(userId),
      userApi.getUserProducts(userId),
    ]);
    const products = userProducts.map(mapToProduct);
    render(profile, products, '상품');
    bindTabs(profile, products, '상품');
  } catch (err) {
    console.error(err);
    document.getElementById('store-container').innerHTML =
      `<div class="h-[60vh] flex items-center justify-center font-bold text-red-400">상점을 불러오지 못했습니다.</div>`;
  }
}

init();
