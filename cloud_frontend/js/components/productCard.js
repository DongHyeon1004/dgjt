import { formatPrice } from '../utils/format.js';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderProductCard(product, href) {
  href = typeof href === 'string' ? href : `/product.html?id=${encodeURIComponent(product.id)}`;
  const statusLabel =
    product.status === 'sold' ? '판매완료' :
    product.status === 'reserved' ? '예약중' : null;

  const overlay = statusLabel
    ? `<div class="absolute inset-0 bg-black/40 flex items-center justify-center">
         <span class="text-white font-bold text-lg border-2 border-white px-4 py-1 rounded">${statusLabel}</span>
       </div>`
    : '';

  return `
    <div class="group">
      <a href="${escapeHtml(href)}" class="block">
        <div class="relative aspect-square overflow-hidden rounded-xl bg-gray-100 mb-3">
          <img
            src="${escapeHtml(product.thumbnail)}"
            alt="${escapeHtml(product.title)}"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div class="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-colors">
            <i data-lucide="heart" width="18" height="18"></i>
          </div>
          ${overlay}
        </div>
        <div class="space-y-1">
          <h3 class="text-[15px] font-medium text-gray-800 line-clamp-2 min-h-[44px] group-hover:text-primary transition-colors">
            ${escapeHtml(product.title)}
          </h3>
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold ${product.category === '나눔' ? 'text-primary' : 'text-gray-900'}">
              ${product.category === '나눔' ? '무료나눔' : escapeHtml(formatPrice(product.price))}
            </span>
            <span class="text-xs text-gray-400">${escapeHtml(product.time)}</span>
          </div>
          <div class="text-xs text-gray-500 truncate">${escapeHtml(product.location)}</div>
        </div>
      </a>
    </div>
  `;
}
