import { mountAdminLayout, setAdminPageContent } from '../../components/adminLayout.js';
import { requireAdmin } from '../../auth/guard.js';

const SETTING_TABS = [
  { icon: 'globe', label: '일반 설정', active: true },
  { icon: 'bell', label: '알림 설정' },
  { icon: 'shield', label: '보안 설정' },
  { icon: 'database', label: '데이터 관리' },
  { icon: 'smartphone', label: '앱 관리' },
];

function renderTab(tab) {
  const active = tab.active;
  return `
    <button class="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-all duration-200 ${active ? 'bg-white text-gray-900 shadow-sm border border-gray-100 font-bold' : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'}">
      <i data-lucide="${tab.icon}" width="20" height="20" class="${active ? 'text-primary' : 'text-gray-400'}"></i>
      <span class="text-sm">${tab.label}</span>
    </button>
  `;
}

function renderPage() {
  setAdminPageContent(`
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">시스템 설정</h1>
          <p class="text-gray-500 mt-1">사이트의 주요 설정을 관리하고 시스템을 구성합니다.</p>
        </div>
        <button class="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10">
          <i data-lucide="save" width="18" height="18"></i>
          설정 저장
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-1 space-y-2">
          ${SETTING_TABS.map(renderTab).join('')}
        </div>

        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
            <section class="space-y-4">
              <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                <i data-lucide="globe" width="20" height="20" class="text-primary"></i>
                기본 사이트 정보
              </h3>
              <div class="grid grid-cols-1 gap-4">
                <div class="space-y-1.5">
                  <label class="text-sm font-bold text-gray-700">사이트 명칭</label>
                  <input type="text" value="당근장터 클론" class="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-bold text-gray-700">사이트 설명 (SEO)</label>
                  <textarea rows="3" class="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none">최고의 중고거래 플랫폼, 당근장터 클론 코딩 프로젝트입니다.</textarea>
                </div>
              </div>
            </section>

            <hr class="border-gray-50" />

            <section class="space-y-4">
              <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                <i data-lucide="lock" width="20" height="20" class="text-amber-500"></i>
                접근 및 유지보수
              </h3>
              <div class="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                <div>
                  <h4 class="text-sm font-bold text-amber-900">점검 모드 활성화</h4>
                  <p class="text-xs text-amber-700 mt-0.5">활성화 시 관리자를 제외한 모든 사용자의 접근이 제한됩니다.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </section>

            <hr class="border-gray-50" />

            <section class="space-y-4">
              <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                <i data-lucide="database" width="20" height="20" class="text-blue-500"></i>
                API 및 외부 서비스 연동
              </h3>
              <div class="space-y-4">
                <div class="space-y-1.5">
                  <label class="text-sm font-bold text-gray-700">카카오 API 키</label>
                  <div class="relative">
                    <input type="password" value="••••••••••••••••" class="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    <button class="absolute right-3 top-3 text-xs font-bold text-primary hover:underline">수정</button>
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-bold text-gray-700">AWS S3 버킷 명칭</label>
                  <input type="text" value="boon-storage-prod" class="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  `);
}

async function init() {
  if (!requireAdmin('/')) return;
  await mountAdminLayout({ activePath: '/admin/settings.html' });
  renderPage();
}

init();
