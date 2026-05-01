import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { requireAuth } from '../auth/guard.js';
import { productApi } from '../api/product.js';
import { formatPrice } from '../utils/format.js';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const METHOD_LABELS = {
  kakao: '카카오페이',
  toss: '토스페이',
  card: '신용/체크카드',
};

const state = {
  selectedMethod: null,
  product: null,
};

function getProductId() {
  return new URLSearchParams(location.search).get('productId');
}

function methodOption(method, iconHtml, label, active) {
  return `
    <button data-method="${method}" type="button" class="flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${active ? 'border-primary bg-rose-50/30' : 'border-gray-50 hover:border-gray-200'}">
      <div class="flex items-center gap-4">
        ${iconHtml}
        <span class="font-bold text-gray-800">${label}</span>
      </div>
      ${active ? '<i data-lucide="check-circle-2" width="24" height="24" class="text-primary"></i>' : ''}
    </button>
  `;
}

function render() {
  const product = state.product;
  document.getElementById('checkout-container').innerHTML = `
    <button id="checkout-back" type="button" class="flex items-center gap-2 text-gray-500 mb-8 hover:text-gray-900 transition-colors">
      <i data-lucide="chevron-left" width="20" height="20"></i>
      <span class="font-bold">뒤로가기</span>
    </button>

    <div class="grid grid-cols-1 md:grid-cols-5 gap-8">
      <div class="md:col-span-3 space-y-6">
        <section class="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100">
          <h2 class="text-xl font-black text-gray-900 mb-6">주문 상품 정보</h2>
          <div class="flex gap-4">
            <img src="${escapeHtml(product.thumbnail)}" alt="${escapeHtml(product.title)}" class="w-24 h-24 rounded-2xl object-cover" />
            <div class="flex-1 min-w-0">
              <p class="text-gray-500 text-xs font-bold mb-1">${escapeHtml(product.category || '')}</p>
              <h3 class="font-bold text-gray-900 truncate mb-2">${escapeHtml(product.title)}</h3>
              <p class="text-lg font-black text-gray-900">${escapeHtml(formatPrice(product.price))}</p>
            </div>
          </div>
        </section>

        <section class="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100">
          <h2 class="text-xl font-black text-gray-900 mb-6">결제 수단 선택</h2>
          <div id="payment-methods" class="grid grid-cols-1 gap-4">
            ${methodOption('kakao', '<div class="w-10 h-10 bg-[#FAE100] rounded-xl flex items-center justify-center font-black text-xs">TALK</div>', '카카오페이', state.selectedMethod === 'kakao')}
            ${methodOption('toss', '<div class="w-10 h-10 bg-[#0064FF] rounded-xl flex items-center justify-center text-white font-black italic">toss</div>', '토스페이', state.selectedMethod === 'toss')}
            ${methodOption('card', '<div class="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400"><i data-lucide="credit-card" width="20" height="20"></i></div>', '신용/체크카드', state.selectedMethod === 'card')}
          </div>
        </section>
      </div>

      <div class="md:col-span-2 space-y-6">
        <div class="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200 border border-gray-100 sticky top-24">
          <h2 class="text-xl font-black text-gray-900 mb-8">결제 금액</h2>
          <div class="space-y-4 mb-8">
            <div class="flex justify-between text-gray-500 font-medium">
              <span>상품 금액</span>
              <span>${escapeHtml(formatPrice(product.price))}</span>
            </div>
            <div class="flex justify-between text-gray-500 font-medium">
              <span>배송비</span>
              <span>0원</span>
            </div>
            <div class="pt-4 border-t border-gray-50 flex justify-between items-end">
              <span class="font-bold text-gray-900">최종 결제금액</span>
              <span class="text-3xl font-black text-primary">${escapeHtml(formatPrice(product.price))}</span>
            </div>
          </div>
          <div class="bg-gray-50 rounded-2xl p-4 mb-8 flex items-center gap-3">
            <i data-lucide="shield-check" width="20" height="20" class="text-emerald-500"></i>
            <p class="text-[11px] text-gray-500 font-medium leading-relaxed">당근장터는 안전결제 시스템을 통해<br />구매 확정 시까지 결제 대금을 보호합니다.</p>
          </div>
          <button id="checkout-pay" type="button" class="w-full py-5 bg-primary text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
            ${escapeHtml(formatPrice(product.price))} 결제하기
          </button>
        </div>
      </div>
    </div>
  `;
  renderIcons();

  document.getElementById('checkout-back').addEventListener('click', () => history.back());
  document.getElementById('payment-methods').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-method]');
    if (!btn) return;
    state.selectedMethod = btn.dataset.method;
    render();
  });
  document.getElementById('checkout-pay').addEventListener('click', handlePayment);
}

function handlePayment() {
  if (!state.selectedMethod) {
    alert('결제 수단을 선택해주세요.');
    return;
  }
  alert(`${METHOD_LABELS[state.selectedMethod]} 결제가 완료되었습니다! (데모)`);
  location.href = '/';
}

async function init() {
  const productId = getProductId();
  if (!productId) {
    document.getElementById('checkout-container').innerHTML =
      `<div class="text-center py-20 font-bold text-red-400">잘못된 접근입니다.</div>`;
    return;
  }
  const redirect = `/login.html?redirect=${encodeURIComponent('/checkout.html?productId=' + productId)}`;
  if (!requireAuth(redirect)) return;
  await bootstrapLayout();
  try {
    state.product = await productApi.getProductById(productId);
    if (!state.product) throw new Error('not found');
    render();
  } catch (err) {
    console.error(err);
    document.getElementById('checkout-container').innerHTML =
      `<div class="text-center py-20 font-bold text-red-400">상품 정보를 찾을 수 없습니다.</div>`;
  }
}

init();
