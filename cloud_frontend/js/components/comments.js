import { getUserId } from '../auth/session.js';
import { apiClient } from '../api/client.js';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function timeStr(iso) {
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function myNickname() {
  return localStorage.getItem('user_nickname') || '익명';
}

function isMine(authorUserId) {
  const me = getUserId();
  return !!me && String(me) === String(authorUserId);
}

async function fetchComments(entityType, entityId) {
  const res = await apiClient.get(`/${entityType}/${entityId}/comments`);
  return res.data;
}

async function postComment(entityType, entityId, content, parentCommentId = null) {
  const body = { content };
  if (parentCommentId !== null) body.parent_comment_id = parentCommentId;
  const res = await apiClient.post(`/${entityType}/${entityId}/comments`, body);
  return res.data;
}

async function deleteComment(entityType, entityId, commentId) {
  await apiClient.delete(`/${entityType}/${entityId}/comments/${commentId}`);
}

function renderReply(reply, parentCommentId) {
  return `
    <div class="flex gap-3 py-3 border-b border-gray-50 last:border-0">
      <div class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
        ${escapeHtml((reply.nickname || '?')[0])}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <span class="text-sm font-bold text-gray-900">${escapeHtml(reply.nickname)}</span>
          <span class="text-xs text-gray-400">${timeStr(reply.created_at)}</span>
          ${isMine(reply.user_id) ? `
            <button class="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
              data-action="delete-comment"
              data-comment-id="${escapeHtml(String(reply.comment_id))}">삭제</button>
          ` : ''}
        </div>
        <p class="text-sm text-gray-700 leading-relaxed">${escapeHtml(reply.content)}</p>
      </div>
    </div>
  `;
}

function renderComment(comment, loggedIn) {
  const replies = comment.replies || [];
  const repliesHtml = replies.length ? `
    <div class="mt-3 pl-4 border-l-2 border-gray-100">
      ${replies.map(r => renderReply(r, comment.comment_id)).join('')}
    </div>
  ` : '';

  const replyForm = loggedIn ? `
    <div class="reply-form hidden mt-3" data-reply-form="${escapeHtml(String(comment.comment_id))}">
      <div class="flex gap-2">
        <input type="text" placeholder="답글을 입력하세요..." maxlength="300"
          class="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all" />
        <button data-action="submit-reply" data-comment-id="${escapeHtml(String(comment.comment_id))}"
          class="px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all">등록</button>
      </div>
    </div>
  ` : '';

  return `
    <div class="py-5 border-b border-gray-100 last:border-0">
      <div class="flex gap-3">
        <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
          ${escapeHtml((comment.nickname || '?')[0])}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span class="font-bold text-gray-900">${escapeHtml(comment.nickname)}</span>
            <span class="text-xs text-gray-400">${timeStr(comment.created_at)}</span>
            ${isMine(comment.user_id) ? `
              <button class="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                data-action="delete-comment"
                data-comment-id="${escapeHtml(String(comment.comment_id))}">삭제</button>
            ` : ''}
          </div>
          <p class="text-gray-700 leading-relaxed mb-3">${escapeHtml(comment.content)}</p>
          ${loggedIn ? `
            <button class="text-xs font-bold text-gray-400 hover:text-primary transition-colors"
              data-action="toggle-reply"
              data-comment-id="${escapeHtml(String(comment.comment_id))}">답글 달기</button>
          ` : ''}
          ${repliesHtml}
          ${replyForm}
        </div>
      </div>
    </div>
  `;
}

async function renderAll(section, entityType, entityId, isOwner) {
  const loggedIn = !!getUserId();
  let comments = [];
  try {
    comments = await fetchComments(entityType, entityId);
  } catch (err) {
    console.error('댓글 로드 실패', err);
  }

  const total = comments.reduce((s, c) => s + 1 + (c.replies?.length || 0), 0);

  const inputArea = loggedIn
    ? `
      <div class="flex gap-3 mb-8">
        <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
          ${escapeHtml(myNickname()[0])}
        </div>
        <div class="flex-1 flex gap-2">
          <input id="comment-input" type="text" placeholder="댓글을 입력하세요..." maxlength="500"
            class="flex-1 px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all" />
          <button id="comment-submit"
            class="px-5 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all">등록</button>
        </div>
      </div>
    `
    : `<p class="text-sm text-center text-gray-400 py-4 mb-6">
        댓글을 작성하려면 <a href="/login.html" class="text-primary font-bold hover:underline">로그인</a>이 필요합니다.
      </p>`;

  section.innerHTML = `
    <div class="mt-16 pt-10 border-t border-gray-100 max-w-3xl">
      <h3 class="text-xl font-extrabold text-gray-900 mb-6">
        댓글 <span class="text-primary">${total}</span>
      </h3>
      ${inputArea}
      <div id="comment-list">
        ${comments.length === 0
          ? '<p class="text-center text-gray-400 py-12">첫 번째 댓글을 남겨보세요!</p>'
          : comments.map(c => renderComment(c, loggedIn)).join('')
        }
      </div>
    </div>
  `;

  const submitBtn = section.querySelector('#comment-submit');
  const inputEl = section.querySelector('#comment-input');
  if (submitBtn && inputEl) {
    const submit = async () => {
      const content = inputEl.value.trim();
      if (!content) return;
      submitBtn.disabled = true;
      try {
        await postComment(entityType, entityId, content);
        await renderAll(section, entityType, entityId, isOwner);
      } catch (err) {
        alert(err.response?.data?.message || '댓글 등록에 실패했습니다.');
        submitBtn.disabled = false;
      }
    };
    submitBtn.addEventListener('click', submit);
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });
  }
}

export function mountComments(entityId, isOwner, entityType = 'products') {
  const section = document.getElementById('comments-section');
  if (!section) return;

  renderAll(section, entityType, entityId, isOwner);

  section.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'toggle-reply') {
      const form = section.querySelector(`[data-reply-form="${btn.dataset.commentId}"]`);
      form?.classList.toggle('hidden');
    }

    else if (action === 'submit-reply') {
      const { commentId } = btn.dataset;
      const form = section.querySelector(`[data-reply-form="${commentId}"]`);
      const input = form?.querySelector('input');
      const content = input?.value.trim();
      if (!content) return;
      btn.disabled = true;
      try {
        await postComment(entityType, entityId, content, Number(commentId));
        await renderAll(section, entityType, entityId, isOwner);
      } catch (err) {
        alert(err.response?.data?.message || '답글 등록에 실패했습니다.');
        btn.disabled = false;
      }
    }

    else if (action === 'delete-comment') {
      if (!confirm('댓글을 삭제하시겠습니까?')) return;
      btn.disabled = true;
      try {
        await deleteComment(entityType, entityId, btn.dataset.commentId);
        await renderAll(section, entityType, entityId, isOwner);
      } catch (err) {
        alert(err.response?.data?.message || '댓글 삭제에 실패했습니다.');
        btn.disabled = false;
      }
    }
  });
}
