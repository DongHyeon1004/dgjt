import { mountAdminLayout, setAdminPageContent } from '../../components/adminLayout.js';
import { requireAdmin } from '../../auth/guard.js';
import { DASHBOARD_STATS, RECENT_ORDERS, ACTIVITY_ITEMS } from '../../data/adminMock.js';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function statusClass(status) {
  if (status === '완료') return 'bg-emerald-100 text-emerald-800';
  if (status === '진행중') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
}

function renderStats() {
  return DASHBOARD_STATS.map((stat) => `
    <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div class="flex justify-between items-start">
        <div class="p-3 rounded-xl ${stat.bg} ${stat.color}">
          <i data-lucide="${stat.icon}" width="24" height="24"></i>
        </div>
        <span class="text-sm font-medium ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}">${escapeHtml(stat.change)}</span>
      </div>
      <div class="mt-4">
        <p class="text-sm font-medium text-gray-500">${escapeHtml(stat.title)}</p>
        <h3 class="text-2xl font-bold text-gray-900 mt-1">${escapeHtml(stat.value)}</h3>
      </div>
    </div>
  `).join('');
}

function renderOrdersTable() {
  return RECENT_ORDERS.map((o) => `
    <tr class="hover:bg-gray-50/50 transition-colors">
      <td class="px-6 py-4 text-sm font-medium text-gray-900">${escapeHtml(o.id)}</td>
      <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(o.user)}</td>
      <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(o.product)}</td>
      <td class="px-6 py-4 text-sm font-bold text-gray-900">${escapeHtml(o.amount)}</td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass(o.status)}">${escapeHtml(o.status)}</span>
      </td>
    </tr>
  `).join('');
}

function renderActivity() {
  return ACTIVITY_ITEMS.map((a) => `
    <div class="flex gap-4">
      <div class="relative">
        <div class="w-2.5 h-2.5 rounded-full ${a.color} mt-1.5"></div>
        <div class="absolute top-4 bottom-[-1.5rem] left-1 w-px bg-gray-100"></div>
      </div>
      <div class="flex-1">
        <div class="flex justify-between items-start">
          <h4 class="text-sm font-bold text-gray-900">${escapeHtml(a.title)}</h4>
          <span class="text-xs text-gray-400">${escapeHtml(a.time)}</span>
        </div>
        <p class="text-xs text-gray-500 mt-1 leading-relaxed">${escapeHtml(a.desc)}</p>
      </div>
    </div>
  `).join('');
}

function renderPage() {
  setAdminPageContent(`
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p class="text-gray-500 mt-1">오늘의 서비스 현황을 한눈에 확인해보세요.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">${renderStats()}</div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div class="p-6 border-b border-gray-50 flex items-center justify-between">
            <h3 class="font-bold text-gray-900">최근 거래 내역</h3>
            <button class="text-red-500 text-sm font-medium hover:underline flex items-center gap-1">
              전체보기 <i data-lucide="chevron-right" width="16" height="16"></i>
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="bg-gray-50/50">
                  <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">주문번호</th>
                  <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">사용자</th>
                  <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">상품명</th>
                  <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">금액</th>
                  <th class="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">${renderOrdersTable()}</tbody>
            </table>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 class="font-bold text-gray-900 mb-6">최근 알림</h3>
          <div class="space-y-6">${renderActivity()}</div>
          <button class="w-full mt-8 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">모든 알림 보기</button>
        </div>
      </div>
    </div>
  `);
}

async function init() {
  if (!requireAdmin('/')) return;
  await mountAdminLayout({ activePath: '/admin/' });
  renderPage();
}

init();
