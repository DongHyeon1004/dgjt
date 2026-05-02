import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { productApi } from '../api/product.js';
import { bannerApi } from '../api/banner.js';
import { renderProductCard } from '../components/productCard.js';

const SKELETON_COUNT = 10;

const FALLBACK_BANNER = `
  <div class="rounded-xl overflow-hidden relative mx-auto" style="background-color:#b3e8ff; height:340px; max-width:1280px">
    <div class="absolute inset-0 flex items-center justify-between" style="padding-inline:95px">
      <div class="max-w-xl" style="color:#0c4a6e">
        <h2 class="leading-tight" style="font-size:36px; letter-spacing:0.06em; font-weight:750; margin-bottom:16px">
          내 근처의 모든 중고<br />
          <span style="color:#f97316; font-weight:930; font-size:55px">당근장터</span>에서 만나보세요
        </h2>
        <p class="opacity-80" style="font-size:23px">매일 다양한 상품이 업데이트됩니다.</p>
      </div>
      <img src="/assets/image.png" alt="당근" style="height:260px; opacity:0.9; object-fit:contain; margin-right:15px" />
    </div>
  </div>
`;

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function initBannerSlider() {
  const wrap = document.getElementById('banner-slider');
  if (!wrap) return;

  let banners = [];
  try { banners = await bannerApi.getBanners(); } catch (_) {}

  if (!banners.length) {
    wrap.innerHTML = FALLBACK_BANNER;
    return;
  }

  const total = banners.length;
  let current = 0;

  wrap.innerHTML = `
    <div class="relative rounded-xl overflow-hidden mx-auto" style="height:340px; max-width:1280px">
      <div id="sl-track" style="display:flex; height:100%; transition:transform 0.4s ease">
        ${banners.map(b => `
          <div class="sl-slide" data-href="${esc(b.link_url || '')}" style="min-width:100%; height:100%; cursor:${b.link_url ? 'pointer' : 'default'}">
            <img src="${esc(b.image_url)}" alt="${esc(b.title)}" style="width:100%; height:100%; object-fit:cover" />
          </div>
        `).join('')}
      </div>
      ${total > 1 ? `
        <button id="sl-prev" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:none;background:rgba(0,0,0,0.35);color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center">‹</button>
        <button id="sl-next" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:none;background:rgba(0,0,0,0.35);color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center">›</button>
        <div style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:7px">
          ${banners.map((_, i) => `<div class="sl-dot" data-i="${i}" style="width:8px;height:8px;border-radius:50%;background:${i === 0 ? '#fff' : 'rgba(255,255,255,0.45)'};cursor:pointer;transition:background 0.2s"></div>`).join('')}
        </div>
      ` : ''}
    </div>
  `;

  const track = document.getElementById('sl-track');

  function goTo(idx) {
    current = ((idx % total) + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    wrap.querySelectorAll('.sl-dot').forEach((d, i) => {
      d.style.background = i === current ? '#fff' : 'rgba(255,255,255,0.45)';
    });
  }

  wrap.querySelectorAll('.sl-slide').forEach(s => {
    s.addEventListener('click', () => { if (s.dataset.href) window.location.href = s.dataset.href; });
  });

  if (total > 1) {
    document.getElementById('sl-prev').addEventListener('click', () => goTo(current - 1));
    document.getElementById('sl-next').addEventListener('click', () => goTo(current + 1));
    wrap.querySelectorAll('.sl-dot').forEach(d => d.addEventListener('click', () => goTo(+d.dataset.i)));

    let timer = setInterval(() => goTo(current + 1), 5000);
    wrap.addEventListener('mouseenter', () => clearInterval(timer));
    wrap.addEventListener('mouseleave', () => { timer = setInterval(() => goTo(current + 1), 5000); });
  }
}

function renderSkeleton(grid) {
  grid.innerHTML = Array.from({ length: SKELETON_COUNT }).map(() => `
    <div class="animate-pulse">
      <div class="aspect-square bg-gray-200 rounded-2xl mb-4"></div>
      <div class="h-5 bg-gray-200 rounded-lg w-3/4 mb-2"></div>
      <div class="h-5 bg-gray-200 rounded-lg w-1/2"></div>
    </div>
  `).join('');
}

function renderProducts(grid, products) {
  if (!products.length) {
    grid.innerHTML = `<div class="col-span-full text-center text-gray-400 py-20">상품이 없습니다.</div>`;
    return;
  }
  grid.innerHTML = products.map(renderProductCard).join('');
  renderIcons();
}

async function init() {
  await bootstrapLayout();
  initBannerSlider();
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  renderSkeleton(grid);
  try {
    const products = await productApi.getProducts();
    renderProducts(grid, products);
  } catch (err) {
    console.error(err);
    grid.innerHTML = `<div class="col-span-full text-center text-red-400 py-20">상품을 불러오지 못했습니다.</div>`;
  }
}

init();
