import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { shareApi } from '../api/share.js';
import { getUserId, isAdmin } from '../auth/session.js';
import { mountComments } from '../components/comments.js';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getShareId() {
  return new URLSearchParams(location.search).get('id');
}

function renderState(html) {
  document.getElementById('share-container').innerHTML = html;
  renderIcons();
}

function renderLoading() {
  renderState(`<div class="h-[60vh] flex items-center justify-center text-gray-400">Loading...</div>`);
}

function renderNotFound() {
  renderState(`<div class="h-[60vh] flex items-center justify-center text-gray-400">나눔 글을 찾을 수 없습니다.</div>`);
}

function renderDetail(share) {
  const isOwner = !!(getUserId() && String(getUserId()) === String(share.userId));
  const canDelete = isAdmin() || isOwner;
  const isDone = share.status === 'completed';

  const ownerActions = canDelete ? `
    <button data-action="delete" class="p-3 rounded-full bg-white shadow-md text-gray-400 hover:text-red-500 hover:shadow-lg transition-all" title="삭제">
      <i data-lucide="trash-2" width="22" height="22"></i>
    </button>
  ` : '';

  const thumbnails = share.images.map((img, idx) => `
    <div class="aspect-square rounded-2xl overflow-hidden bg-white shadow-md border border-gray-100 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
      <img src="${escapeHtml(img)}" alt="${escapeHtml(share.title)} ${idx}" class="w-full h-full object-cover" />
    </div>
  `).join('');

  const statusBadge = isDone
    ? `<span class="px-4 py-1.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">나눔 완료</span>`
    : `<span class="px-4 py-1.5 bg-green-50 text-green-600 text-xs font-bold rounded-full">나눔 가능</span>`;

  renderState(`
    <button data-action="back" class="md:hidden flex items-center gap-1 mb-4 text-gray-600">
      <i data-lucide="chevron-left" width="20" height="20"></i>
      <span>뒤로가기</span>
    </button>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div class="space-y-6">
        <div class="aspect-square rounded-[2.5rem] overflow-hidden bg-white shadow-2xl shadow-gray-200 border border-gray-100">
          <img src="${escapeHtml(share.thumbnail)}" alt="${escapeHtml(share.title)}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
        </div>
        <div class="grid grid-cols-4 gap-4">${thumbnails}</div>
      </div>

      <div class="flex flex-col h-full py-4">
        <div class="pb-8 border-b border-gray-100">
          <div class="flex justify-between items-start mb-6">
            <div class="flex items-center gap-2">
              <span class="px-4 py-1.5 bg-rose-50 text-primary text-xs font-bold rounded-full tracking-wider uppercase">나눔</span>
              ${statusBadge}
            </div>
            <div class="flex gap-3">
              ${ownerActions}
              <button class="p-3 rounded-full bg-white shadow-md text-gray-400 hover:text-gray-600 hover:shadow-lg transition-all"><i data-lucide="share-2" width="22" height="22"></i></button>
            </div>
          </div>

          <h1 class="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">${escapeHtml(share.title)}</h1>
          <p class="text-5xl font-black text-green-500 mb-8 tracking-tighter">무료나눔</p>

          <div class="flex gap-8 text-sm font-medium text-gray-400">
            <div class="flex items-center gap-2"><i data-lucide="clock" width="18" height="18"></i> <span class="text-gray-600">${escapeHtml(share.time)}</span></div>
          </div>
        </div>

        <div class="py-8 space-y-8 flex-1">
          <div class="flex items-center gap-2.5 text-gray-600 font-medium">
            <i data-lucide="map-pin" width="20" height="20" class="text-primary"></i>
            <span>${escapeHtml(share.location)}</span>
          </div>

          <div class="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100 backdrop-blur-sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="relative">
                  <img src="${escapeHtml(share.seller.avatar)}" alt="${escapeHtml(share.seller.name)}" class="w-14 h-14 rounded-full border-2 border-white shadow-sm" />
                  <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h4 class="font-bold text-gray-900 text-lg">${escapeHtml(share.seller.name)}</h4>
                  <p class="text-xs text-gray-500 font-medium">상점온도: <span class="text-primary font-bold">${share.seller.rating}★</span></p>
                </div>
              </div>
              <button data-action="store" class="text-sm font-bold text-gray-700 bg-white border border-gray-200 px-5 py-2 rounded-xl hover:bg-gray-50 shadow-sm transition-all">상점보기</button>
            </div>
          </div>

          <div class="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">${escapeHtml(share.description)}</div>
        </div>

        ${!isOwner && !isDone ? `
        <div class="pt-8 border-t border-gray-100 sticky bottom-0 bg-gray-50/80 backdrop-blur-md py-4 -mx-4 px-4 lg:relative lg:bg-transparent lg:p-0 lg:m-0">
          <button data-action="chat" class="w-full py-5 px-16 rounded-2xl bg-primary font-bold text-white shadow-xl shadow-primary/25 hover:brightness-110 transition-all transform active:scale-95">채팅하기</button>
        </div>` : ''}
      </div>
    </div>

    <div id="comments-section"></div>
  `);
}

function bindActions(share) {
  const container = document.getElementById('share-container');
  if (!container) return;
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'back') history.back();
    else if (action === 'store') location.href = `/store.html?userId=${encodeURIComponent(share.userId)}`;
    else if (action === 'chat') location.href = '/chat.html';
    else if (action === 'delete') {
      if (!confirm('정말 이 나눔 글을 삭제하시겠습니까?')) return;
      try {
        await shareApi.deleteShare(share.id);
        alert('나눔 글이 삭제되었습니다.');
        location.href = '/board-share.html';
      } catch (err) {
        console.error(err);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  });
}

async function init() {
  await bootstrapLayout();
  const id = getShareId();
  if (!id) { renderNotFound(); return; }

  renderLoading();
  try {
    const share = await shareApi.getShareById(id);
    if (!share) { renderNotFound(); return; }
    const isOwner = !!(getUserId() && String(getUserId()) === String(share.userId));
    renderDetail(share);
    bindActions(share);
    mountComments(String(share.id), isOwner, 'shares');
  } catch (err) {
    console.error('Failed to fetch share:', err);
    renderNotFound();
  }
}

init();
