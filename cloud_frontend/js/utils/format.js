export function formatPrice(price) {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`;
  return `${Math.floor(diff / 2592000)}달 전`;
}

export function classNames(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
