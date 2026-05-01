export async function mountFooter(selector = '#footer') {
  const target = document.querySelector(selector);
  if (!target) return;
  const res = await fetch('/components/footer.html');
  target.innerHTML = await res.text();
}
