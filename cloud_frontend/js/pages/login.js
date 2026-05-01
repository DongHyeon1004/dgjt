import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { authApi } from '../api/auth.js';
import { setSession } from '../auth/session.js';

function showError(message) {
  const box = document.getElementById('login-error');
  if (!box) return;
  box.textContent = message;
  box.classList.remove('hidden');
}

function clearError() {
  const box = document.getElementById('login-error');
  if (!box) return;
  box.textContent = '';
  box.classList.add('hidden');
}

function getRedirectUrl() {
  const params = new URLSearchParams(location.search);
  return params.get('redirect') || '/';
}

async function handleSubmit(e) {
  e.preventDefault();
  clearError();

  const form = e.currentTarget;
  const submitBtn = document.getElementById('login-submit');
  const formData = new FormData(form);
  const payload = {
    user_id: formData.get('user_id'),
    user_pwd: formData.get('user_pwd'),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = '로그인 중...';

  try {
    const res = await authApi.login(payload);
    setSession({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      userId: payload.user_id,
    });
    alert('로그인에 성공했습니다!');
    location.replace(getRedirectUrl());
  } catch (err) {
    const detail = err.response?.data?.detail || err.response?.data?.message;
    showError(detail || '로그인 정보가 올바르지 않습니다.');
    submitBtn.disabled = false;
    submitBtn.textContent = '로그인';
  }
}

async function init() {
  await bootstrapLayout();
  const form = document.getElementById('login-form');
  if (form) form.addEventListener('submit', handleSubmit);
  renderIcons();
}

init();
