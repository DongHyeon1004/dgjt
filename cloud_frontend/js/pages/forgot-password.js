import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { authApi } from '../api/auth.js';

async function init() {
  await bootstrapLayout();
  renderIcons();

  const form = document.getElementById('fp-form');
  const errorEl = document.getElementById('fp-error');
  const successEl = document.getElementById('fp-success');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    const fd = new FormData(form);
    const submitBtn = document.getElementById('fp-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '처리 중...';

    try {
      await authApi.resetPassword({
        user_id: fd.get('user_id'),
        email: fd.get('email'),
        new_pwd: fd.get('new_pwd'),
      });
      successEl.textContent = '비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.';
      successEl.classList.remove('hidden');
      form.reset();
    } catch (err) {
      errorEl.textContent = err.response?.data?.message || '비밀번호 재설정 중 오류가 발생했습니다.';
      errorEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '비밀번호 재설정';
    }
  });
}

init();
