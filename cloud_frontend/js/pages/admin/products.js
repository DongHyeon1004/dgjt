import { mountAdminLayout, setAdminPageContent } from '../../components/adminLayout.js';
import { requireAdmin } from '../../auth/guard.js';
import { productApi } from '../../api/product.js';
import { formatPrice } from '../../utils/format.js';

const state = {
  products: [],
  searchTerm: '',
};

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function statusBadge(status) {
  if (status === 'sale') return ['bg-emerald-100 text-emerald-800', '판매중'];
  if (status === 'reserved') return ['bg-amber-100 text-amber-800', '예약중'];
  return ['bg-gray-100 text-gray-800', '판매완료'];
}

function getFilteredProducts() {
  const term = state.searchTerm.toLowerCase();
  if (!term) return state.products;
  return state.products.filter((p) =>
    (p.title || '').toLowerCase().includes(term) ||
    (p.seller?.name || '').toLowerCase().includes(term)
  );
}

function renderRows(products) {
  return products.map((p) => {
    const [statusCls, statusLabel] = statusBadge(p.status);
    return `
      <tr class="hover:bg-gray-50/50 transition-colors">
        <td class="px-6 py-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
              <img src="${escapeHtml(p.thumbnail)}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover" />
            </div>
            <div>
              <a href="/product.html?id=${encodeURIComponent(p.id)}" class="text-sm font-bold text-gray-900 hover:text-primary transition-colors flex items-center gap-1">
                ${escapeHtml(p.title)}
                <i data-lucide="external-link" width="12" height="12" class="text-gray-400"></i>
              </a>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-bold uppercase">${escapeHtml(p.category || '')}</span>
                <span class="text-[10px] text-gray-400 flex items-center gap-1"><i data-lucide="calendar" width="10" height="10"></i>${escapeHtml(p.time)}</span>
              </div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <img src="${escapeHtml(p.seller.avatar)}" alt="${escapeHtml(p.seller.name)}" class="w-6 h-6 rounded-full" />
            ${escapeHtml(p.seller.name)}
          </div>
        </td>
        <td class="px-6 py-4"><span class="text-sm font-bold text-gray-900">${escapeHtml(formatPrice(p.price))}</span></td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusCls}">${statusLabel}</span>
        </td>
        <td class="px-6 py-4">
          <div class="flex gap-2">
            <button data-delete="${escapeHtml(p.id)}" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="상품 삭제">
              <i data-lucide="trash-2" width="18" height="18"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTable() {
  const filtered = getFilteredProducts();
  const tbody = filtered.length
    ? `<tbody class="divide-y divide-gray-50">${renderRows(filtered)}</tbody>`
    : `<tbody><tr><td colspan="5"><div class="p-20 text-center text-gray-500 font-medium">상품이 없습니다.</div></td></tr></tbody>`;

  setAdminPageContent(`
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">상품 관리</h1>
          <p class="text-gray-500 mt-1">등록된 상품 목록을 관리하고 부적절한 게시물을 삭제하세요.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold border border-amber-100">
            총 ${state.products.length}개 상품
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <i data-lucide="search" width="18" height="18" class="absolute left-3 top-3 text-gray-400"></i>
          <input id="products-search" type="text" placeholder="상품명, 판매자 이름으로 검색..." value="${escapeHtml(state.searchTerm)}" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all" />
        </div>
        <select class="px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm cursor-pointer">
          <option>모든 카테고리</option>
          <option>전자기기</option>
          <option>의류</option>
          <option>가구/인테리어</option>
        </select>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">상품 정보</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">판매자</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">가격</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            ${tbody}
          </table>
        </div>
      </div>
    </div>
  `);

  bindEvents();
}

async function fetchProducts() {
  try {
    state.products = await productApi.getProducts();
  } catch (err) {
    console.error('Failed to fetch products', err);
    state.products = [];
  }
  renderTable();
}

async function handleDelete(id) {
  if (!confirm('정말 이 상품을 삭제하시겠습니까?')) return;
  try {
    await productApi.deleteProduct(id);
    alert('상품이 삭제되었습니다.');
    fetchProducts();
  } catch (err) {
    console.error(err);
    alert('삭제 중 오류가 발생했습니다.');
  }
}

function bindEvents() {
  const search = document.getElementById('products-search');
  if (search) {
    search.addEventListener('input', (e) => {
      state.searchTerm = e.target.value;
      renderTable();
      const restored = document.getElementById('products-search');
      if (restored) {
        restored.focus();
        restored.setSelectionRange(restored.value.length, restored.value.length);
      }
    });
  }
  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.delete));
  });
}

async function init() {
  if (!requireAdmin('/')) return;
  await mountAdminLayout({ activePath: '/admin/products.html' });
  renderTable();
  fetchProducts();
}

init();
