import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { requireAuth } from '../auth/guard.js';
import { productApi } from '../api/product.js';
import { getUserId, isAdmin } from '../auth/session.js';

function getProductId() {
  return new URLSearchParams(location.search).get('id');
}

function showLoadFailed(message) {
  const stateEl = document.getElementById('edit-state');
  stateEl.textContent = message;
  stateEl.classList.remove('hidden');
  document.getElementById('edit-form').classList.add('hidden');
}

function fillForm(product) {
  const form = document.getElementById('edit-form');
  form.elements.product_title.value = product.title;
  form.elements.product_body.value = product.description;
  form.elements.product_price.value = product.price;
  form.elements.category.value = product.category;

  document.getElementById('edit-state').classList.add('hidden');
  form.classList.remove('hidden');
}

async function handleSubmit(e, productId) {
  e.preventDefault();
  const saveBtn = document.getElementById('edit-save');
  const fd = new FormData(e.currentTarget);
  const payload = {
    product_title: fd.get('product_title'),
    product_body: fd.get('product_body'),
    product_price: Number(fd.get('product_price')),
    category: fd.get('category'),
  };

  saveBtn.disabled = true;
  saveBtn.textContent = '수정 중...';

  try {
    await productApi.updateProduct(productId, payload);
    alert('상품 정보가 수정되었습니다!');
    location.href = `/product.html?id=${encodeURIComponent(productId)}`;
  } catch (err) {
    console.error(err);
    alert('상품 수정 중 오류가 발생했습니다.');
    saveBtn.disabled = false;
    saveBtn.textContent = '수정 완료';
  }
}

async function init() {
  const productId = getProductId();
  if (!productId) {
    showLoadFailed('잘못된 접근입니다.');
    return;
  }
  const redirect = `/login.html?redirect=${encodeURIComponent('/edit-product.html?id=' + productId)}`;
  if (!requireAuth(redirect)) return;
  await bootstrapLayout();

  try {
    const product = await productApi.getProductById(productId);
    if (!product) { showLoadFailed('상품을 찾을 수 없습니다.'); return; }

    if (!isAdmin() && product.userId !== getUserId()) {
      alert('수정 권한이 없습니다.');
      location.replace('/');
      return;
    }
    fillForm(product);
    document.getElementById('edit-form').addEventListener('submit', (e) => handleSubmit(e, productId));
    document.getElementById('edit-cancel').addEventListener('click', () => history.back());
    renderIcons();
  } catch (err) {
    console.error(err);
    showLoadFailed('상품을 불러올 수 없습니다.');
  }
}

init();
