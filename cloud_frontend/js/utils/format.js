export function formatPrice(price) {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

export function classNames(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
