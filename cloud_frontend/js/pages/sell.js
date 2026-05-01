import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { productApi } from '../api/product.js';
import { shareApi } from '../api/share.js';
import { isLoggedIn } from '../auth/session.js';
import { validateProductImages } from '../utils/imageValidator.js';

const MAX_IMAGES = 10;
const postType = new URLSearchParams(location.search).get('type') === 'share' ? 'share' : 'sell';
const state = {
  files: [],
  previews: [],
};

function showError(message) {
  const box = document.getElementById('sell-error');
  if (!box) return;
  box.textContent = message;
  box.classList.remove('hidden');
}

function clearError() {
  const box = document.getElementById('sell-error');
  if (!box) return;
  box.textContent = '';
  box.classList.add('hidden');
}

function refreshImageRow() {
  const row = document.getElementById('image-row');
  document.getElementById('image-count').textContent = state.files.length;

  // 첫 번째 자식(파일 input label)만 남기고 나머지 제거
  while (row.children.length > 1) {
    row.removeChild(row.lastChild);
  }

  state.previews.forEach((preview, idx) => {
    const div = document.createElement('div');
    div.className = 'relative flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden group';
    div.innerHTML = `
      <img src="${preview}" alt="preview" class="w-full h-full object-cover" />
      <button type="button" data-remove="${idx}" class="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <i data-lucide="x" width="14" height="14"></i>
      </button>
    `;
    row.appendChild(div);
  });
  renderIcons();
}

function handleImageInput(e) {
  clearError();
  const newFiles = Array.from(e.target.files || []);
  if (state.files.length + newFiles.length > MAX_IMAGES) {
    showError(`이미지는 최대 ${MAX_IMAGES}장까지 업로드 가능합니다.`);
    e.target.value = '';
    return;
  }
  const validation = validateProductImages(newFiles);
  if (!validation.ok) {
    showError(validation.reason);
    e.target.value = '';
    return;
  }
  for (const f of newFiles) {
    state.files.push(f);
    state.previews.push(URL.createObjectURL(f));
  }
  e.target.value = '';
  refreshImageRow();
}

function bindRemoveButtons() {
  const row = document.getElementById('image-row');
  row.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    const idx = Number(btn.dataset.remove);
    URL.revokeObjectURL(state.previews[idx]);
    state.files.splice(idx, 1);
    state.previews.splice(idx, 1);
    refreshImageRow();
  });
}

async function handleSubmit(e) {
  e.preventDefault();
  clearError();

  if (!isLoggedIn()) {
    alert('로그인이 필요한 서비스입니다.');
    location.href = '/login.html?redirect=/sell.html';
    return;
  }

  const submitBtn = document.getElementById('sell-submit');
  const fd = new FormData(e.currentTarget);

  submitBtn.disabled = true;
  submitBtn.textContent = '등록 중...';

  try {
    if (postType === 'share') {
      const sharePayload = {
        share_title: fd.get('product_title'),
        share_body: fd.get('product_body'),
      };
      const res = await shareApi.createShare(sharePayload);
      const shareId = res.share_id;
      if (state.files.length > 0) {
        await shareApi.uploadShareImages(String(shareId), state.files);
      }
      alert('나눔 글이 등록되었습니다!');
      location.href = '/board-share.html';
    } else {
      const productPayload = {
        product_title: fd.get('product_title'),
        product_body: fd.get('product_body'),
        product_price: Number(fd.get('product_price')),
        category: '판매',
      };
      const res = await productApi.createProduct(productPayload);
      const productId = res.product_id;
      if (state.files.length > 0) {
        await productApi.uploadProductImages(String(productId), state.files);
      }
      alert('상품이 등록되었습니다!');
      location.href = `/product.html?id=${encodeURIComponent(productId)}`;
    }
  } catch (err) {
    console.error(err);
    const detail = err.response?.data?.detail || err.response?.data?.message;
    showError(detail || '상품 등록 중 오류가 발생했습니다.');
    submitBtn.disabled = false;
    submitBtn.textContent = '등록하기';
  }
}

async function init() {
  await bootstrapLayout();
  if (!isLoggedIn()) {
    alert('로그인이 필요한 서비스입니다.');
    location.replace('/login.html?redirect=/sell.html');
    return;
  }
  if (postType === 'share') {
    document.getElementById('sell-title').textContent = '나눔 글작성';
    document.getElementById('sell-desc').textContent = '나눔하실 물건의 정보를 입력해주세요.';
    document.getElementById('price-section').classList.add('hidden');
  } else {
    document.getElementById('sell-title').textContent = '판매 글작성';
    document.getElementById('sell-desc').textContent = '판매하실 상품의 정보를 입력해주세요.';
  }

  document.getElementById('image-input').addEventListener('change', handleImageInput);
  document.getElementById('sell-form').addEventListener('submit', handleSubmit);
  bindRemoveButtons();
  renderIcons();
}

init();
