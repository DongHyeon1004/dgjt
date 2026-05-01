import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { requireAuth } from '../auth/guard.js';
import { userApi } from '../api/user.js';
import { productApi } from '../api/product.js';
import { authApi } from '../api/auth.js';
import { renderProductCard } from '../components/productCard.js';
import { getRefreshToken, clearSession } from '../auth/session.js';

const TABS = ['상품', '찜', '후기', '상점정보'];

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderStars() {
  return Array.from({ length: 5 }).map(() => `<i data-lucide="star" width="18" height="18" fill="currentColor"></i>`).join('');
}

function renderTabs(active) {
  return TABS.map((tab) => `
    <button data-tab="${tab}" class="pb-4 text-lg font-bold transition-all relative ${active === tab ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}">
      ${tab}
      ${active === tab ? '<div class="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"></div>' : ''}
    </button>
  `).join('');
}

function renderTabContent(active, products) {
  if (active === '상품') {
    const cards = products.map(renderProductCard).join('');
    const addBtn = `
      <a href="/write.html" class="aspect-square rounded-3xl border-4 border-dashed border-gray-100 flex flex-col items-center justify-center gap-4 text-gray-300 hover:border-primary/30 hover:text-primary transition-all group">
        <div class="p-5 bg-gray-50 rounded-full group-hover:bg-rose-50 transition-colors">
          <i data-lucide="box" width="32" height="32"></i>
        </div>
        <span class="font-bold text-lg">상품 등록하기</span>
      </a>
    `;
    return `<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">${cards}${addBtn}</div>`;
  }
  return `<div class="py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200"><p class="text-gray-400 font-bold">아직 내역이 없습니다.</p></div>`;
}

function render(profile, products, activeTab) {
  const container = document.getElementById('mystore-container');
  container.innerHTML = `
    <div class="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-gray-100 border border-gray-100 mb-12">
      <div class="flex flex-col md:flex-row items-center gap-10">
        <div class="relative">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.user_id || '')}" alt="Profile" class="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] shadow-xl border-4 border-white" />
          <a href="/profile-edit.html" class="absolute -bottom-2 -right-2 p-3 bg-white shadow-lg rounded-2xl text-gray-600 hover:text-primary transition-colors border border-gray-100">
            <i data-lucide="edit-3" width="20" height="20"></i>
          </a>
        </div>
        <div class="flex-1 text-center md:text-left space-y-4">
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <h1 class="text-4xl font-black text-gray-900 tracking-tight">${escapeHtml(profile?.nickname)}</h1>
            <div class="flex gap-2 justify-center md:justify-start">
              <button class="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-primary transition-colors"><i data-lucide="settings" width="20" height="20"></i></button>
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
        <div class="w-full md:w-auto flex flex-col gap-3">
          <button id="mystore-logout" class="w-full md:w-48 py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-lg hover:brightness-110 transition-all">로그아웃</button>
          <a href="/profile-edit.html" class="w-full md:w-48 py-4 bg-white border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all text-center">내 정보 수정</a>
        </div>
      </div>
    </div>
    <div id="mystore-tabs" class="flex gap-8 border-b border-gray-100 mb-10 overflow-x-auto">${renderTabs(activeTab)}</div>
    <div id="mystore-tab-content">${renderTabContent(activeTab, products)}</div>
  `;
  renderIcons();
}

async function handleLogout() {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) await authApi.logout(refreshToken);
  } catch (err) {
    console.warn('logout failed', err);
  }
  clearSession();
  alert('로그아웃 되었습니다.');
  location.href = '/';
}

function bind(profile, products, current) {
  document.getElementById('mystore-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn || btn.dataset.tab === current) return;
    const next = btn.dataset.tab;
    render(profile, products, next);
    bind(profile, products, next);
  });
  const logoutBtn = document.getElementById('mystore-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

async function init() {
  if (!requireAuth('/login.html?redirect=/mystore.html')) return;
  await bootstrapLayout();
  try {
    const [profile, myProducts] = await Promise.all([
      userApi.getMyProfile(),
      productApi.getMyProducts(),
    ]);
    render(profile, myProducts, '상품');
    bind(profile, myProducts, '상품');
  } catch (err) {
    console.error(err);
    document.getElementById('mystore-container').innerHTML =
      `<div class="h-[60vh] flex items-center justify-center font-bold text-red-400">상점을 불러오지 못했습니다.</div>`;
  }
}

init();
