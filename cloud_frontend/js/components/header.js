import { isLoggedIn, isAdmin, getRefreshToken, clearSession } from '../auth/session.js';
import { onAuthChanged } from '../auth/session.js';
import { authApi } from '../api/auth.js';

async function loadHeaderHtml(targetEl) {
  const res = await fetch('/components/header.html');
  const html = await res.text();
  targetEl.innerHTML = html;
}

function bindSearch() {
  const form = document.getElementById('header-search');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = new FormData(form).get('search');
    if (q) location.href = `/search.html?q=${encodeURIComponent(q)}`;
  });
}

async function handleLogout() {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) await authApi.logout(refreshToken);
  } catch (err) {
    console.warn('logout API failed (continuing with local clear)', err);
  }
  clearSession();
  alert('로그아웃 되었습니다.');
  location.href = '/';
}

function bindLogout() {
  const btn = document.getElementById('header-logout-btn');
  if (!btn) return;
  btn.addEventListener('click', handleLogout);
}

function reflectAuthState() {
  const loginLink = document.getElementById('header-login-link');
  const logoutBtn = document.getElementById('header-logout-btn');
  const adminLink = document.getElementById('header-admin-link');
  if (!loginLink || !logoutBtn || !adminLink) return;

  if (isLoggedIn()) {
    loginLink.classList.add('hidden');
    loginLink.classList.remove('sm:flex');
    logoutBtn.classList.remove('hidden');
    logoutBtn.classList.add('sm:flex');
  } else {
    logoutBtn.classList.add('hidden');
    logoutBtn.classList.remove('sm:flex');
    loginLink.classList.remove('hidden');
    loginLink.classList.add('sm:flex');
  }

  if (isAdmin()) {
    adminLink.classList.remove('hidden');
    adminLink.classList.add('flex');
  } else {
    adminLink.classList.add('hidden');
    adminLink.classList.remove('flex');
  }
}

export async function mountHeader(selector = '#header') {
  const target = document.querySelector(selector);
  if (!target) return;
  await loadHeaderHtml(target);
  bindSearch();
  bindLogout();
  reflectAuthState();
  if (window.lucide) window.lucide.createIcons();
  onAuthChanged(reflectAuthState);
}
