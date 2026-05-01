import { mountAdminLayout, setAdminPageContent } from '../../components/adminLayout.js';
import { requireAdmin } from '../../auth/guard.js';
import { userApi } from '../../api/user.js';

const state = {
  users: [],
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

function getFilteredUsers() {
  const term = state.searchTerm.toLowerCase();
  if (!term) return state.users;
  return state.users.filter((u) =>
    (u.nickname || '').toLowerCase().includes(term) ||
    (u.user_id || '').toLowerCase().includes(term)
  );
}

function renderUserRows(users) {
  return users.map((user) => `
    <tr class="hover:bg-gray-50/50 transition-colors">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.nickname || '')}" alt="${escapeHtml(user.nickname)}" class="w-full h-full object-cover" />
          </div>
          <div>
            <div class="text-sm font-bold text-gray-900">${escapeHtml(user.nickname)}</div>
            <div class="text-xs text-gray-400">@${escapeHtml(user.user_id)}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 text-sm text-gray-600">
        <div class="flex items-center gap-2"><i data-lucide="phone" width="14" height="14" class="text-gray-400"></i>${escapeHtml(user.phone_num)}</div>
      </td>
      <td class="px-6 py-4 text-sm text-gray-600">
        <div class="flex items-center gap-2"><i data-lucide="mail" width="14" height="14" class="text-gray-400"></i>${escapeHtml(user.email || '미등록')}</div>
      </td>
      <td class="px-6 py-4 text-sm text-gray-600">
        <div class="flex items-center gap-2"><i data-lucide="map-pin" width="14" height="14" class="text-gray-400"></i>${escapeHtml(user.region)}</div>
      </td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'}">${user.is_admin ? '관리자' : '일반회원'}</span>
      </td>
      <td class="px-6 py-4">
        <button data-toggle="${escapeHtml(user.user_id)}" class="text-xs font-bold text-gray-400 hover:text-primary transition-colors underline underline-offset-4">권한 변경</button>
      </td>
    </tr>
  `).join('');
}

function renderTable() {
  const filtered = getFilteredUsers();
  const tbody = filtered.length
    ? `<tbody class="divide-y divide-gray-50">${renderUserRows(filtered)}</tbody>`
    : `<tbody><tr><td colspan="6"><div class="p-20 text-center text-gray-500 font-medium">사용자가 없습니다.</div></td></tr></tbody>`;

  setAdminPageContent(`
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">사용자 관리</h1>
          <p class="text-gray-500 mt-1">회원 목록을 확인하고 권한을 관리하세요.</p>
        </div>
      </div>

      <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <i data-lucide="search" width="18" height="18" class="absolute left-3 top-3 text-gray-400"></i>
          <input id="users-search" type="text" placeholder="닉네임, 아이디로 검색..." value="${escapeHtml(state.searchTerm)}" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all" />
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-gray-50/50 border-b border-gray-100">
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">사용자</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">연락처</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">이메일</th>
                <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">지역</th>
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

async function fetchUsers() {
  try {
    state.users = await userApi.listUsers();
  } catch (err) {
    console.error('Failed to fetch users', err);
    state.users = [];
  }
  renderTable();
}

async function handleToggleAdmin(userId) {
  if (!confirm('이 사용자의 관리자 권한을 변경하시겠습니까?')) return;
  try {
    await userApi.toggleAdminStatus(userId);
    alert('권한이 변경되었습니다.');
    fetchUsers();
  } catch (err) {
    alert(err.response?.data?.detail || '권한 변경 중 오류가 발생했습니다.');
  }
}

function bindEvents() {
  const search = document.getElementById('users-search');
  if (search) {
    search.addEventListener('input', (e) => {
      state.searchTerm = e.target.value;
      renderTable();
      const restored = document.getElementById('users-search');
      if (restored) {
        restored.focus();
        restored.setSelectionRange(restored.value.length, restored.value.length);
      }
    });
  }
  document.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => handleToggleAdmin(btn.dataset.toggle));
  });
}

async function init() {
  if (!requireAdmin('/')) return;
  await mountAdminLayout({ activePath: '/admin/users.html' });
  renderTable();
  fetchUsers();
}

init();
