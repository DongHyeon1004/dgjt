import { getRefreshToken, clearSession } from '../auth/session.js';
import { authApi } from '../api/auth.js';

const ACTIVE_CLASSES = ['bg-red-50', 'text-red-600', 'shadow-sm', 'shadow-red-100'];
const INACTIVE_CLASSES = ['text-gray-500', 'hover:bg-gray-50', 'hover:text-gray-900'];

async function loadLayout(host) {
  const res = await fetch('/components/admin-layout.html');
  host.outerHTML = await res.text();
}

function highlightActiveNav(currentPath) {
  document.querySelectorAll('.admin-nav-item').forEach((el) => {
    const path = el.dataset.path;
    const isActive = path === currentPath || (path === '/admin/' && (currentPath === '/admin' || currentPath === '/admin/'));
    if (isActive) {
      el.classList.add(...ACTIVE_CLASSES);
      el.classList.remove(...INACTIVE_CLASSES);
      el.querySelectorAll('i').forEach((i) => i.classList.add('text-red-600'));
    } else {
      el.classList.add(...INACTIVE_CLASSES);
      el.classList.remove(...ACTIVE_CLASSES);
      el.querySelectorAll('i').forEach((i) => i.classList.add('text-gray-400'));
    }
  });
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

export async function mountAdminLayout({ activePath } = {}) {
  const host = document.getElementById('admin-shell');
  if (!host) return;
  await loadLayout(host);
  highlightActiveNav(activePath || location.pathname);
  const logoutBtn = document.getElementById('admin-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (window.lucide) window.lucide.createIcons();
}

export function setAdminPageContent(html) {
  const slot = document.getElementById('admin-page-content');
  if (slot) slot.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
}
