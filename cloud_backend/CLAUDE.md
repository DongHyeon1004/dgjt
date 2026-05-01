## 작업 지침 (반드시 준수)
1. **대규모 코드 변경 시 사전 허가 필요** - 많은 양의 코드를 한번에 바꿔야 하는 상황이면 사용자 허가 후 진행
2. **더 나은 방향 제안 시 고지 후 승인** - 잘못된 방향이 있다면 "이러이러한 이유로 이런 방향이 더 좋다"고 고지하고 승인받고 진행
3. **기능별 모듈화** - 코드를 하나에 몰아넣지 말고 기능별로 모듈화

## 프로젝트 목적
- 시나리오 기반 모의해킹 실습 환경 구축

## 인프라 아키텍처
- **WEB** (public): nginx, 리버스 프록시 용도로만 사용
- **WAS** (private):
  - frontend: HTML + JS (폴더 별도 존재)
  - backend: PHP + Apache (폴더 별도 존재)
- **RDS** (private)

## 네트워크 접근 제어
- WAS → RDS: **3306 포트로만 접근 가능**
- WEB → WAS: 리버스 프록시 경유
- 외부 → WEB: public

## 공격 시나리오 (Kill Chain)

### 1단계: 정찰 및 일반 사용자 행위
1. **회원가입 / 로그인** — 일반 사용자 계정 생성 및 인증
2. **이미지 업로드 시도 (일반 영역)** — 다층 검증으로 차단되는 것 확인 (정상 보안 동작)

### 2단계: 취약 영역 발견
3. **잔재 페이지 탐색** — 사용 중단된 레거시 페이지 3개가량 노출되어 있음을 확인
4. **다운로드 API 경로 발견 및 동작 검증** — 잔재 페이지 중 1곳을 `curl`로 분석해 다운로드 API 경로를 알아내고, 해당 API를 직접 테스트해 실제로 다운로드가 되는 것을 확인

### 3단계: 인증 우회 (JWT 위조)
5. **임의 파일 다운로드 (LFD)** — 취약한 다운로드 API를 통해 JWT secret key가 포함된 PHP 파일 다운로드
6. **JWT 위조** — 탈취한 secret key로 admin 권한이 담긴 JWT를 `HS256`으로 정상 서명하여 **admin 페이지 접근**

### 4단계: 코드 실행 / 초기 침투
7. **웹쉘 업로드** — admin의 배너 업로드 기능을 악용해 웹쉘 업로드
8. **리버스 쉘 획득** — 웹쉘 통해 WAS에 리버스 쉘 연결

### 5단계: 클라우드 피벗
9. **IMDS 탈취** — WAS에서 AWS 메타데이터 서비스(`169.254.169.254`)에서 IAM 자격증명 탈취
10. **프록시/터널링 구성** — 탈취한 정보 기반으로 터널링 도구를 사용해 RDS 접근 경로 확보

### 6단계: 목적 달성
11. **민감 정보 유출** — RDS 접근을 통해 데이터 탈취 (Exfiltration)

---

## 파일 구조

```
dgjt_backend/
├── config.php              # 전역 설정 — config() 헬퍼 (CORS, JWT, DB, upload_dirs)
├── index.php               # 진입점 — config 로드, CORS, uploads 디렉토리 보장, 라우터 등록
├── .htaccess               # PHP upload 크기 제한만 (rewrite 규칙은 Apache 설정으로 이동)
├── core/
│   ├── Auth.php            # Auth::user() / Auth::admin()
│   ├── Database.php        # getDb() — PDO 연결 (static 캐싱)
│   ├── Jwt.php             # JWT 생성/검증 (HS256)
│   ├── Request.php
│   ├── Response.php
│   └── Router.php          # base path 자동 제거 로직 삭제 — Alias 환경에서 오작동하므로
├── routers/
│   ├── auth.php            # 회원가입/로그인/로그아웃/토큰갱신/비밀번호변경
│   ├── banners.php         # 배너 목록/등록(admin)/삭제
│   ├── download.php        # GET /api/download?file= — Path Traversal 취약점 (의도적)
│   ├── product.php         # 상품 CRUD + 이미지 업로드
│   ├── share.php           # 나눔 CRUD + 이미지 업로드
│   └── users.php           # 유저 프로필/관리자 기능
└── uploads/
    ├── banners/            # PHP 실행 허용 (웹쉘 진입점, 의도적)
    ├── products/
    │   └── .htaccess       # PHP 실행 차단
    └── shares/
        └── .htaccess       # PHP 실행 차단
```

## 인프라 배포 현황

### WAS (Ubuntu, Apache)
- 경로: `/var/www/html/`
  - `frontend/` — 정적 파일 (HTML/JS/CSS)
  - `backend/` — PHP 백엔드
- Apache 설정: `/etc/apache2/sites-available/dgjt.conf`
  - `DocumentRoot /var/www/html/frontend`
  - `Alias /api /var/www/html/backend` — API 요청 라우팅
  - `Alias /uploads /var/www/html/backend/uploads`
  - DB 접속 정보는 `SetEnv`로 주입 (dgjt.conf 내)
  - RewriteRule은 `.htaccess`가 아닌 `<Directory>` 블록 안에 정의
    - `.htaccess`의 RewriteEngine이 모든 요청을 가로채는 문제 때문에 이동
- 포트: Apache 8080, nginx(WEB)가 리버스 프록시로 전달

### WEB (nginx)
- 도메인: `dgjt.duckdns.org`
- 모든 요청을 WAS `10.11.10.82:8080`으로 프록시

### RDS
- 엔드포인트: `db-ksj16.cfa620y6u0rh.ap-northeast-2.rds.amazonaws.com`
- DB명: `secondhand_platform`

## 작업 현황

### 완료
- 백엔드 PHP 라우터 골격 — `auth`, `users`, `product`, `banners`, `share`, `download`
- 의도적 SQL Injection 취약점 — 모든 라우터 (PDO prepared statement 미사용, 문자열 결합)
- JWT 하드코딩 secret — `config.php`의 `jwt.secret` fallback 값
- 배너 업로드 (admin) — 확장자 검증 없음, `uploads/banners/`에 저장 → 웹쉘 진입점
- Path Traversal 다운로드 API — `routers/download.php` (`GET /api/download?file=...`)
  - 공격: `?file=../config.php` → JWT secret 탈취 (secret 위치: config.php)
- 이미지 업로드 다층 검증 — `isValidProductImage()` (확장자 + MIME + magic bytes)
- 상품 이미지 DB(BLOB) → 파일시스템 전환
  - RDS: `image_data` DROP, `image_url VARCHAR(255)` ADD 완료
  - 이미지 파일명: `날짜_원본파일명MD5.확장자` (예: `20260430_abc123.jpg`)
  - `uploads/products/.htaccess` PHP 실행 차단
- 설정 통합 — `config.php`에 CORS/JWT/DB/upload_dirs 집결 (localhost CORS 제거 완료)
- `core/Database.php`로 `getDb()` 분리
  - `Pdo\Mysql::ATTR_INIT_COMMAND` → `PDO::MYSQL_ATTR_INIT_COMMAND` 수정 (PHP 버전 호환)
- admin 권한 체계 개편
  - RDS: `users.is_admin` 컬럼 DROP, `admin` 테이블(user_id PK) 별도 운영
  - 로그인 시 `admin` 테이블 조회 → JWT payload에 `is_admin` 포함
  - `Auth::admin()` — DB 조회 없이 JWT payload의 `is_admin` 확인
  - 공격 시나리오: secret 탈취 후 `is_admin: true`로 JWT 위조 → admin 접근
- `share` 기능 추가 — `routers/share.php`, `uploads/shares/`, RDS 테이블 생성
- AWS 클라우드 배포 완료
  - Router.php base path 자동 제거 로직 삭제 (Alias 환경에서 `/api` prefix를 잘못 제거하던 버그)
  - 헬스체크 라우트: `'/'` → `'/api'`로 변경
  - Apache RewriteRule을 `.htaccess`에서 `dgjt.conf <Directory>` 블록으로 이동

