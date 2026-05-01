import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { requireAuth } from '../auth/guard.js';
import { userApi } from '../api/user.js';
import { authApi } from '../api/auth.js';

let originalNickname = '';
let nicknameChecked = false;  // 중복확인 통과 여부

function setFormValues(profile) {
  const form = document.getElementById('profile-form');
  originalNickname = profile.nickname || '';
  form.elements.nickname.value = originalNickname;
  form.elements.phone_num.value = profile.phone_num || '';
  form.elements.region.value = profile.region || '';
  document.getElementById('profile-avatar').src =
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.nickname || profile.user_id || '')}`;
}

function setNicknameMsg(text, isOk) {
  const msg = document.getElementById('nickname-check-msg');
  msg.textContent = text;
  msg.className = 'text-xs font-semibold ml-1';
  msg.style.color = isOk ? '' : '#ef4444';
  if (isOk) msg.classList.add('text-primary');
  msg.classList.remove('hidden');
}

function bindNicknameCheck() {
  const input = document.getElementById('nickname-input');
  const btn   = document.getElementById('nickname-check-btn');

  input.addEventListener('input', () => {
    nicknameChecked = false;
    document.getElementById('nickname-check-msg').classList.add('hidden');
  });

  btn.addEventListener('click', async () => {
    const nickname = input.value.trim();
    if (!nickname) {
      setNicknameMsg('닉네임을 입력해주세요.', false);
      return;
    }
    if (nickname === originalNickname) {
      nicknameChecked = true;
      setNicknameMsg('현재 사용 중인 닉네임입니다.', true);
      return;
    }

    btn.disabled = true;
    btn.textContent = '확인 중...';
    try {
      await userApi.checkNickname(nickname);
      nicknameChecked = true;
      setNicknameMsg('사용 가능한 닉네임입니다.', true);
    } catch (err) {
      nicknameChecked = false;
      const detail = err.response?.data?.detail || err.response?.data?.message;
      setNicknameMsg(detail || '이미 사용 중인 닉네임입니다.', false);
    } finally {
      btn.disabled = false;
      btn.textContent = '중복확인';
    }
  });
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const saveBtn = document.getElementById('profile-save');
  const fd = new FormData(form);
  const nickname = fd.get('nickname');

  if (nickname !== originalNickname && !nicknameChecked) {
    setNicknameMsg('닉네임 중복확인을 해주세요.', false);
    return;
  }

  const payload = {
    nickname,
    phone_num: fd.get('phone_num'),
    region: fd.get('region'),
  };

  saveBtn.disabled = true;
  saveBtn.textContent = '저장 중...';

  try {
    await userApi.updateMyProfile(payload);
    alert('프로필이 수정되었습니다.');
    location.href = '/mystore.html';
  } catch (err) {
    console.error(err);
    alert('수정 중 오류가 발생했습니다.');
    saveBtn.disabled = false;
    saveBtn.textContent = '저장하기';
  }
}

function mountPasswordSection() {
  const tpl = document.getElementById('pw-section-tpl');
  if (!tpl) return;
  document.querySelector('main').appendChild(tpl.content.cloneNode(true));

  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl  = document.getElementById('pw-error');
    const successEl = document.getElementById('pw-success');
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    const next    = document.getElementById('pw-new').value;
    const confirm = document.getElementById('pw-confirm').value;

    if (next.length < 8) {
      errorEl.textContent = '새 비밀번호는 8자 이상이어야 합니다.';
      errorEl.classList.remove('hidden');
      return;
    }
    if (next !== confirm) {
      errorEl.textContent = '새 비밀번호가 일치하지 않습니다.';
      errorEl.classList.remove('hidden');
      return;
    }

    const submitBtn = document.getElementById('pw-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = '변경 중...';

    try {
      const current = document.getElementById('pw-current').value;
      await authApi.changePassword({ current_pwd: current, new_pwd: next });
      successEl.textContent = '비밀번호가 변경되었습니다.';
      successEl.classList.remove('hidden');
      e.target.reset();
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.message;
      errorEl.textContent = detail || '비밀번호 변경 중 오류가 발생했습니다.';
      errorEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '비밀번호 변경';
    }
  });
}

async function init() {
  if (!requireAuth('/login.html?redirect=/profile-edit.html')) return;
  await bootstrapLayout();

  mountPasswordSection();
  bindNicknameCheck();
  document.getElementById('profile-back').addEventListener('click', () => history.back());
  document.getElementById('profile-cancel').addEventListener('click', () => history.back());
  document.getElementById('profile-form').addEventListener('submit', handleSubmit);

  try {
    const profile = await userApi.getMyProfile();
    setFormValues(profile);
  } catch (err) {
    console.error(err);
    alert('프로필을 불러올 수 없습니다.');
  }
  renderIcons();
}

init();
