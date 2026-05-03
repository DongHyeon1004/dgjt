<?php
declare(strict_types=1);

// ===== CORS =====
// ===== 설정 로드 =====
require_once __DIR__ . '/config.php';

// ===== CORS =====
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, config('cors_origins'), true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 3600');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ===== 보안 헤더 =====
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');

// ===== uploads 디렉토리 보장 =====
foreach (config('upload_dirs') as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// ===== 의존성 로드 =====
require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/core/Router.php';
require_once __DIR__ . '/core/Request.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/core/Jwt.php';
require_once __DIR__ . '/core/Auth.php';

// ===== 헬퍼 =====
function uuid4(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function serveFile(string $absPath): void {
    if (!is_file($absPath)) {
        http_response_code(404);
        exit;
    }
    $ext  = strtolower(pathinfo($absPath, PATHINFO_EXTENSION));
    $mime = match($ext) {
        'jpg', 'jpeg' => 'image/jpeg',
        'png'         => 'image/png',
        default       => 'application/octet-stream',
    };
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($absPath));
    readfile($absPath);
    exit;
}

// ===== 라우터 인스턴스 =====
$router = new Router();

// 헬스체크
$router->get('/api', function () {
    Response::json(['status' => 'ok', 'message' => '서버가 정상 실행 중입니다.']);
});

// 라우트 등록 (순서 중요)
require_once __DIR__ . '/routers/auth.php';
require_once __DIR__ . '/routers/users.php';
require_once __DIR__ . '/routers/product.php';
require_once __DIR__ . '/routers/banners.php';
require_once __DIR__ . '/routers/share.php';
require_once __DIR__ . '/routers/download.php';

// ===== 디스패치 =====
try {
    $router->dispatch();
} catch (Throwable $e) {
    error_log('[ERROR] ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    if (!headers_sent()) {
        Response::error('오류가 발생했습니다.', 500);
    }
}
