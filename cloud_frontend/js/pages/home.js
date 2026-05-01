import { bootstrapLayout, renderIcons } from '../bootstrap.js';
import { productApi } from '../api/product.js';
import { renderProductCard } from '../components/productCard.js';

const SKELETON_COUNT = 10;

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
