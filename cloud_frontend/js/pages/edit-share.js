import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { requireAuth } from '../auth/guard.js';
import { shareApi } from '../api/share.js';
import { getUserId, isAdmin } from '../auth/session.js';

function getShareId() {
  return new URLSearchParams(location.search).get('id');
}

function showLoadFailed(message) {
  const stateEl = document.getElementById('edit-state');
  stateEl.textContent = message;
  stateEl.classList.remove('hidden');
  document.getElementById('edit-form').classList.add('hidden');
}

function fillForm(share) {
  const form = document.getElementById('edit-form');
  form.elements.share_title.value = share.title;
  form.elements.share_body.value = share.description;

  document.getElementById('edit-state').classList.add('hidden');
  form.classList.remove('hidden');
}

async function handleSubmit(e, shareId) {
  e.preventDefault();
  const saveBtn = document.getElementById('edit-save');
  const fd = new FormData(e.currentTarget);
  const payload = {
    share_title: fd.get('share_title'),
    share_body: fd.get('share_body'),
  };

  saveBtn.disabled = true;
  saveBtn.textContent = '수정 중...';

  try {
    await shareApi.updateShare(shareId, payload);
    alert('나눔 글이 수정되었습니다!');
    location.href = `/share.html?id=${encodeURIComponent(shareId)}`;
  } catch (err) {
    console.error(err);
    alert('나눔 수정 중 오류가 발생했습니다.');
    saveBtn.disabled = false;
    saveBtn.textContent = '수정 완료';
  }
}

async function init() {
  const shareId = getShareId();
  if (!shareId) {
    showLoadFailed('잘못된 접근입니다.');
    return;
  }
  const redirect = `/login.html?redirect=${encodeURIComponent('/edit-share.html?id=' + shareId)}`;
  if (!requireAuth(redirect)) return;
  await bootstrapLayout();

  try {
    const share = await shareApi.getShareById(shareId);
    if (!share) { showLoadFailed('나눔 글을 찾을 수 없습니다.'); return; }

    if (!isAdmin() && share.userId !== getUserId()) {
      alert('수정 권한이 없습니다.');
      location.replace('/');
      return;
    }
    fillForm(share);
    document.getElementById('edit-form').addEventListener('submit', (e) => handleSubmit(e, shareId));
    document.getElementById('edit-cancel').addEventListener('click', () => history.back());
    renderIcons();
  } catch (err) {
    console.error(err);
    showLoadFailed('나눔 글을 불러올 수 없습니다.');
  }
}

init();
