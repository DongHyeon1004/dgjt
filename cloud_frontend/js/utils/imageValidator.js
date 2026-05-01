// 일반 영역(상품) 이미지 업로드용 클라이언트측 검증
// Kill Chain 시나리오상 "다층 검증으로 차단되는 정상 영역" — 강한 검증 유지
// 참고: 진짜 다층 방어는 백엔드에서 (확장자 + MIME + 매직바이트 + 콘텐츠 검증)

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function validateProductImage(file) {
  if (!file) return { ok: false, reason: '파일이 없습니다.' };

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, reason: `허용되지 않는 확장자입니다: .${ext}` };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { ok: false, reason: `허용되지 않는 파일 형식입니다: ${file.type || '알 수 없음'}` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, reason: `파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다.` };
  }
  return { ok: true };
}

export function validateProductImages(files) {
  for (const f of files) {
    const r = validateProductImage(f);
    if (!r.ok) return { ok: false, reason: `${f.name}: ${r.reason}` };
  }
  return { ok: true };
}
