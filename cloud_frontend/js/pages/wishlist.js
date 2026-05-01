import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { requireAuth } from '../auth/guard.js';
import { miscApi } from '../api/misc.js';
import { mapToProduct } from '../api/product.js';
import { renderProductCard } from '../components/productCard.js';

function renderSkeleton(grid) {
  grid.innerHTML = Array.from({ length: 4 }).map(() => `
    <div class="animate-pulse">
      <div class="aspect-square bg-gray-200 rounded-2xl mb-4"></div>
      <div class="h-5 bg-gray-200 rounded-lg w-3/4 mb-2"></div>
      <div class="h-5 bg-gray-200 rounded-lg w-1/2"></div>
    </div>
  `).join('');
}

function renderEmpty(grid) {
  grid.innerHTML = `
    <div class="col-span-full py-32 text-center">
      <i data-lucide="heart" width="64" height="64" class="mx-auto text-gray-200 mb-6"></i>
      <h3 class="text-xl font-bold text-gray-400">찜한 상품이 없습니다.</h3>
      <p class="text-gray-400 mt-2">마음에 드는 상품을 찜해보세요!</p>
    </div>
  `;
  renderIcons();
}

function renderProducts(grid, products) {
  if (!products.length) return renderEmpty(grid);
  grid.innerHTML = products.map(renderProductCard).join('');
  renderIcons();
}

async function init() {
  if (!requireAuth('/login.html?redirect=/wishlist.html')) return;
  await bootstrapLayout();
  const grid = document.getElementById('wishlist-grid');
  renderSkeleton(grid);
  try {
    const data = await miscApi.getLikedProducts();
    const products = (data || []).map(mapToProduct);
    renderProducts(grid, products);
  } catch (err) {
    console.error(err);
    renderEmpty(grid);
  }
}

init();
