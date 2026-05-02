<?php
declare(strict_types=1);

// Apache SetEnv(클라우드)가 없을 때 .env 파일에서 환경변수 로드
(function () {
    $envFile = __DIR__ . '/.env';
    if (!is_file($envFile)) return;
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;
        [$key, $value] = [trim($parts[0]), trim($parts[1])];
        if ($key !== '' && getenv($key) === false) {
            putenv("{$key}={$value}");
        }
    }
})();

function config(?string $key = null)
{
    static $cfg = null;
    if ($cfg === null) {
        $cfg = [
            'cors_origins' => [
                'http://dgjt.duckdns.org',
                'https://dgjt.duckdns.org',
            ],
            'jwt' => [
                'secret'         => getenv('JWT_SECRET'),
                'access_expire'  => 1800,   // 30분
                'refresh_expire' => 604800, // 7일
            ],
            'db' => [
                'host' => getenv('DB_HOST'),
                'port' => getenv('DB_PORT') ?: '3306',
                'name' => getenv('DB_NAME'),
                'user' => getenv('DB_USER'),
                'pass' => getenv('DB_PASS'),
            ],
            'upload_dirs' => [
                'banners'  => __DIR__ . '/uploads/banners',
                'products' => __DIR__ . '/uploads/products',
                'shares'   => __DIR__ . '/uploads/shares',
            ],
        ];
    }
    if ($key === null) return $cfg;
    return $cfg[$key] ?? null;
}
