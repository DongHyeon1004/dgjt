<?php
declare(strict_types=1);

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
                'secret'         => getenv('JWT_SECRET') ?: 'change-this-jwt-secret-in-production-please-use-long-random-string',
                'access_expire'  => 1800,   // 30분
                'refresh_expire' => 604800, // 7일
                // amdin ID : 
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
