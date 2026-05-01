// 관리자 대시보드 mock 데이터 — 백엔드 API 미구현, UI 확인용
export const DASHBOARD_STATS = [
  { title: '총 사용자', value: '1,284', change: '+12%', icon: 'users', color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: '총 거래액', value: '₩45,200,000', change: '+8%', icon: 'trending-up', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { title: '신규 매물', value: '342', change: '+24%', icon: 'shopping-bag', color: 'text-amber-600', bg: 'bg-amber-50' },
  { title: '신고 내역', value: '12', change: '-5%', icon: 'alert-circle', color: 'text-rose-600', bg: 'bg-rose-50' },
];

export const RECENT_ORDERS = [
  { id: '#ORD-7234', user: '김철수', product: '아이폰 15 프로', amount: '₩1,100,000', status: '완료', date: '2026.04.23' },
  { id: '#ORD-7233', user: '이영희', product: '나이키 에어포스 1', amount: '₩120,000', status: '진행중', date: '2026.04.23' },
  { id: '#ORD-7232', user: '박지성', product: '소니 노이즈캔슬링 헤드셋', amount: '₩350,000', status: '취소', date: '2026.04.22' },
  { id: '#ORD-7231', user: '최민지', product: '캠핑용 의자 세트', amount: '₩85,000', status: '완료', date: '2026.04.22' },
  { id: '#ORD-7230', user: '정우성', product: '맥북 에어 M2', amount: '₩1,450,000', status: '완료', date: '2026.04.21' },
];

export const ACTIVITY_ITEMS = [
  { title: '신규 회원 가입', desc: '홍길동님이 회원가입을 완료했습니다.', time: '2분 전', color: 'bg-blue-500' },
  { title: '신고 접수', desc: "'아이폰 15' 게시글에 대한 신고가 접수되었습니다.", time: '15분 전', color: 'bg-rose-500' },
  { title: '거래 취소 요청', desc: '#ORD-7232 주문에 대한 취소 요청이 있습니다.', time: '1시간 전', color: 'bg-amber-500' },
  { title: '시스템 점검 알림', desc: '내일 오전 02:00부터 시스템 점검이 예정되어 있습니다.', time: '3시간 전', color: 'bg-emerald-500' },
];
