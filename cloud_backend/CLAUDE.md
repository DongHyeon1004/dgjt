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
                   curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
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

## SQL Injection 취약점 상세

### Blind SQLi 포인트

#### 1. `/api/users/check-nickname?nickname=` — Boolean-based (최적)
- **파일**: `routers/users.php:27`
- **인증**: 불필요
- **응답**: `{"available": true}` / `{"available": false}` — 참/거짓 직접 반영
- **주입 예시**:
  ```
  ?nickname=' OR (SELECT SUBSTRING(user_pwd,1,1) FROM users WHERE user_id='admin')='a'-- -
  → available: false  (조건 참 = 첫 글자가 'a')
  → available: true   (조건 거짓)
  ```
- sqlmap: `sqlmap -u "http://HOST/api/users/check-nickname?nickname=test" --dbms=mysql --level=3`

#### 2. `POST /api/auth/register` — Boolean-based (user_id 필드)
- **파일**: `routers/auth.php:21`
- **인증**: 불필요
- **응답**: `409` (user_id 존재) / `201` (없음) — HTTP 상태코드로 참/거짓 구분
- **주입 예시**:
  ```json
  {"user_id": "' UNION SELECT 1 FROM users WHERE user_pwd LIKE 'a%'-- -", ...}
  → 409: 비밀번호 첫 글자가 'a'
  → 201: 불일치
  ```

#### 3. `POST /api/auth/password/reset` — Boolean-based (user_id / email 필드)
- **파일**: `routers/auth.php:124`
- **인증**: 불필요
- **응답**: `404` (조건 거짓) / `200` (조건 참)
- 파라미터 두 개(`user_id`, `email`) 모두 주입 가능

### Union-based / Error-based SQLi 포인트 (결과가 응답에 직접 반영)
~~- `GET /api/products?search=` — `routers/product.php:59`~~
~~- `GET /api/shares?search=` — `routers/share.php:32`~~
~~- `GET /api/search?q=` — `routers/product.php:124` (products + users 동시 반환)~~
> **수정 완료**: 위 3개 엔드포인트는 prepared statement로 패치됨 (아래 패치 현황 참고)

### Prepared Statement 패치 현황

Blind SQLi 포인트 3개를 제외하고 나머지 SQLi는 모두 prepared statement로 수정 완료.

**패치된 파일**: `auth.php`, `users.php`, `product.php`, `share.php`
**패치 제외 (의도적 유지)**: `banners.php`

| 파일 | 패치된 포인트 |
|------|--------------|
| `auth.php` | 로그인 쿼리, admin 조회, refresh_token INSERT/SELECT, 비밀번호 UPDATE |
| `users.php` | 프로필 수정 동적 UPDATE, DELETE, 유저 조회, 상품 목록 조회 |
| `product.php` | 검색 LIKE, 상품 INSERT, 내 상품 SELECT, 통합검색, seller 조회, PATCH 동적 UPDATE, 이미지 INSERT, 댓글 INSERT, 상태 UPDATE |
| `share.php` | product.php와 동일한 패턴 전체 |

**패치 방식 참고사항**
- LIKE 검색: `%?%` 대신 값에 `%` 포함 → `$params[] = "%{$search}%"` 후 `?` 바인딩
- 동적 SET 절: 컬럼명은 `$allowed` 화이트리스트로 안전, 값만 `?` 바인딩
- `parent_id` NULL: PDO가 PHP `null`을 SQL `NULL`로 자동 처리
- int 캐스팅된 ID(`$pid`, `$sid`, `$cid` 등): 문자열 주입 위험 없으므로 `query()` 유지

---

## 작업 현황

### 완료
- 백엔드 PHP 라우터 골격 — `auth`, `users`, `product`, `banners`, `share`, `download`
- 의도적 SQL Injection 취약점 — Blind SQLi 포인트 3개만 유지, 나머지는 prepared statement로 패치 완료
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
- **비밀번호 bcrypt 해싱** (`2026-05-02`)
  - `auth.php` 4곳 수정: 회원가입 INSERT, 로그인 verify, 비밀번호 재설정/변경 UPDATE
  - `password_hash(PASSWORD_DEFAULT)` / `password_verify()` 적용
- **보안 헤더 추가** (`2026-05-02`) — `index.php`에 일괄 적용
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **로컬 개발 환경 세팅** (`2026-05-02`)
  - `config.php` DB fallback 추가 (127.0.0.1 / secondhand_platform / root / 1234)
  - `config.php` CORS에 localhost / localhost:8080 / 127.0.0.1 추가
  - Laragon VirtualHost 파일 생성 (`C:\laragon\etc\apache2\sites-enabled\dgjt.conf`)
  - hosts 파일에 `127.0.0.1 dgjt.local` 추가
  - `product.php` / `share.php` LIMIT/OFFSET PDO 바인딩 → 직접 삽입으로 변경 (클라우드 배포 시 원복 필요)

