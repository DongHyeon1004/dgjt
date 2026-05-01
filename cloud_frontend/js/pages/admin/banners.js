import { mountAdminLayout, setAdminPageContent } from '../../components/adminLayout.js';
import { requireAdmin } from '../../auth/guard.js';
import { bannerApi } from '../../api/banner.js';

const state = { banners: [] };

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderBannerRows() {
  if (!state.banners.length) {
    return `<tr><td colspan="5"><div class="p-20 text-center text-gray-500 font-medium">등록된 배너가 없습니다.</div></td></tr>`;
  }
  return state.banners.map((b) => `
    <tr class="hover:bg-gray-50/50 transition-colors">
      <td class="px-6 py-4">
        <div class="w-28 h-16 rounded-xl overflow-hidden bg-gray-100">
          <img src="${escapeHtml(b.image_url)}" alt="${escapeHtml(b.title)}" class="w-full h-full object-cover" />
        </div>
      </td>
      <td class="px-6 py-4 text-sm font-medium text-gray-900">${escapeHtml(b.title)}</td>
      <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${escapeHtml(b.link_url || '-')}</td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${b.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}">
          ${b.is_active ? '활성' : '비활성'}
        </span>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <button data-toggle="${b.id}" class="text-xs font-bold ${b.is_active ? 'text-gray-400 hover:text-gray-600' : 'text-emerald-500 hover:text-emerald-700'} transition-colors underline underline-offset-4">
            ${b.is_active ? '비활성화' : '활성화'}
          </button>
          <button data-delete="${b.id}" class="text-xs font-bold text-red-400 hover:text-red-600 transition-colors underline underline-offset-4">삭제</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderPage() {
  setAdminPageContent(`
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">배너 관리</h1>
          <p class="text-gray-500 mt-1">메인 페이지에 표시될 배너를 관리하세요.</p>
        </div>
        <button id="btn-add-banner" class="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors shadow-sm">
          <i data-lucide="plus" width="16" height="16"></i>
          배너 등록
        </button>
      </div>

      <div id="banner-form-wrap" class="hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">새 배너 등록</h2>
        <form id="banner-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이미지 <span class="text-red-500">*</span></label>
            <input id="banner-image" type="file" accept="image/*" required
              class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-50 file:text-red-600 file:font-medium hover:file:bg-red-100 transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">제목 <span class="text-red-500">*</span></label>
            <input id="banner-title" type="text" placeholder="배너 제목을 입력하세요" required
              class="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-200 outline-none text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">링크 URL</label>
            <input id="banner-link" type="text" placeholder="https://..."
              class="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-200 outline-none text-sm" />
          </div>
          <div class="flex items-center gap-2">
            <input id="banner-active" type="checkbox" checked class="w-4 h-4 accent-red-500 rounded" />
            <label for="banner-active" class="text-sm font-medium text-gray-700">활성화</label>
          </div>
          <div id="banner-error" class="hidden text-sm text-red-500 font-medium"></div>
          <div class="flex gap-3 pt-2">
            <button type="submit" id="banner-submit"
              class="px-6 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors">
              등록
            </button>
            <button type="button" id="btn-cancel-banner"
              class="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors">
              취소
            </button>
          </div>
        </form>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">이미지</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">제목</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">링크</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              ${renderBannerRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `);
  bindEvents();
}

async function fetchBanners() {
  try {
    state.banners = await bannerApi.getAllBanners();
  } catch (err) {
    console.error('Failed to fetch banners', err);
    state.banners = [];
  }
  renderPage();
}

async function handleSubmit(e) {
  e.preventDefault();
  const errorBox = document.getElementById('banner-error');
  errorBox.classList.add('hidden');

  const imageFile = document.getElementById('banner-image').files[0];
  const title = document.getElementById('banner-title').value.trim();
  const linkUrl = document.getElementById('banner-link').value.trim();
  const isActive = document.getElementById('banner-active').checked ? '1' : '0';
  const submitBtn = document.getElementById('banner-submit');

  if (!imageFile) {
    errorBox.textContent = '이미지를 선택해주세요.';
    errorBox.classList.remove('hidden');
    return;
  }

  const fd = new FormData();
  fd.append('image', imageFile);
  fd.append('title', title);
  fd.append('link_url', linkUrl);
  fd.append('is_active', isActive);

  submitBtn.disabled = true;
  submitBtn.textContent = '등록 중...';

  try {
    await bannerApi.createBanner(fd);
    alert('배너가 등록되었습니다.');
    fetchBanners();
  } catch (err) {
    errorBox.textContent = err.response?.data?.message || '배너 등록 중 오류가 발생했습니다.';
    errorBox.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = '등록';
  }
}

async function handleToggle(bannerId) {
  try {
    await bannerApi.toggleBanner(bannerId);
    fetchBanners();
  } catch (err) {
    alert(err.response?.data?.message || '상태 변경 중 오류가 발생했습니다.');
  }
}

async function handleDelete(bannerId) {
  if (!confirm('이 배너를 삭제하시겠습니까?')) return;
  try {
    await bannerApi.deleteBanner(bannerId);
    fetchBanners();
  } catch (err) {
    alert(err.response?.data?.message || '배너 삭제 중 오류가 발생했습니다.');
  }
}

function bindEvents() {
  document.getElementById('btn-add-banner')?.addEventListener('click', () => {
    document.getElementById('banner-form-wrap').classList.toggle('hidden');
  });
  document.getElementById('btn-cancel-banner')?.addEventListener('click', () => {
    document.getElementById('banner-form-wrap').classList.add('hidden');
  });
  document.getElementById('banner-form')?.addEventListener('submit', handleSubmit);
  document.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => handleToggle(btn.dataset.toggle));
  });
  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => handleDelete(btn.dataset.delete));
  });
}

async function init() {
  if (!requireAdmin('/')) return;
  await mountAdminLayout({ activePath: '/admin/banners.html' });
  fetchBanners();
}

init();
