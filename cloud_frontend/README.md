# DGJT Frontend

당근장터 클론 프로젝트의 프론트엔드입니다.

## 기술 스택

- HTML5 / Vanilla JS (ES Modules)
- Tailwind CSS
- Axios
- Lucide Icons

## 프로젝트 구조

```
dgjt/
├── index.html              # 메인 홈
├── board-sell.html         # 번당판매 게시판
├── board-share.html        # 번당나눔 게시판
├── product.html            # 상품 상세
├── sell.html               # 상품 등록
├── edit-product.html       # 상품 수정
├── search.html             # 검색
├── store.html              # 판매자 스토어
├── mystore.html            # 내 스토어
├── checkout.html           # 구매
├── wishlist.html           # 찜 목록
├── login.html              # 로그인
├── signup.html             # 회원가입
├── profile-edit.html       # 프로필 수정
├── admin/                  # 관리자 페이지
│   ├── index.html
│   ├── products.html
│   ├── users.html
│   └── settings.html
├── components/             # 공통 컴포넌트 HTML
│   ├── header.html
│   ├── footer.html
│   └── admin-layout.html
├── js/
│   ├── api/                # 백엔드 API 모듈
│   │   ├── client.js       # Axios 인스턴스 (JWT 자동 갱신)
│   │   ├── auth.js
│   │   ├── product.js
│   │   ├── user.js
│   │   ├── banner.js
│   │   └── misc.js
│   ├── auth/               # 인증 관련
│   │   ├── session.js      # localStorage 토큰 관리
│   │   └── guard.js        # 페이지 접근 권한
│   ├── components/         # JS 컴포넌트
│   │   ├── comments.js
│   │   └── productCard.js
│   ├── pages/              # 페이지별 JS
│   └── utils/              # 유틸 함수
├── css/
│   └── tailwind.css
└── assets/
```

## 백엔드 연동

- 백엔드: PHP REST API (`/api/*`)
- 인증: JWT (Access Token 30분 / Refresh Token 7일)
- 토큰 저장: localStorage
- 토큰 만료 시 자동 갱신 후 요청 재시도

## 로컬 실행

XAMPP Apache 서버 기준으로 실행합니다.

1. XAMPP Apache 시작
2. 브라우저에서 `localhost/dgjt` 접속
