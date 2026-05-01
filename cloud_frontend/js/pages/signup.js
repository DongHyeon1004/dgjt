import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { authApi } from '../api/auth.js';

function showError(message) {
  const box = document.getElementById('signup-error');
  if (!box) return;
  box.textContent = message;
  box.classList.remove('hidden');
}

function clearError() {
  const box = document.getElementById('signup-error');
  if (!box) return;
  box.textContent = '';
  box.classList.add('hidden');
}

async function handleSubmit(e) {
  e.preventDefault();
  clearError();

  const form = e.currentTarget;
  const submitBtn = document.getElementById('signup-submit');
  const fd = new FormData(form);
  const payload = {
    user_id: fd.get('user_id'),
    user_pwd: fd.get('user_pwd'),
    nickname: fd.get('nickname'),
    email: fd.get('email') || '',
    phone_num: fd.get('phone_num'),
    region: fd.get('region'),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = '가입 중...';

  try {
    await authApi.register(payload);
    alert('회원가입이 완료되었습니다! 로그인해주세요.');
    location.href = '/login.html';
  } catch (err) {
    const detail = err.response?.data?.detail || err.response?.data?.message;
    showError(detail || '회원가입 중 오류가 발생했습니다.');
    submitBtn.disabled = false;
    submitBtn.textContent = '가입하기';
  }
}

async function init() {
  await bootstrapLayout();
  const form = document.getElementById('signup-form');
  if (form) form.addEventListener('submit', handleSubmit);
  renderIcons();
}

init();
