<?php
declare(strict_types=1);

class Auth
{
    public static function user(): array
    {
        $header = Request::header('Authorization');
        if ($header === null || stripos($header, 'Bearer ') !== 0) {
            Response::error('인증이 필요합니다.', 401);
        }

        $token = trim(substr($header, 7));
        if ($token === '') {
            Response::error('인증이 필요합니다.', 401);
        }

        $payload = Jwt::decode($token);
        if (!$payload || ($payload['type'] ?? null) !== 'access') {
            Response::error('유효하지 않거나 만료된 토큰입니다.', 401);
        }

        $userId = $payload['sub'] ?? '';
        if (!is_string($userId) || $userId === '') {
            Response::error('유효하지 않은 토큰입니다.', 401);
        }

        $db = getDb();
        $row = $db->query("SELECT * FROM users WHERE user_id = '{$userId}'")->fetch();
        if (!$row) {
            Response::error('사용자를 찾을 수 없습니다.', 401);
        }
        $row['is_admin'] = !empty($payload['is_admin']);
        return $row;
    }

    public static function admin(): array
    {
        $header = Request::header('Authorization');
        if ($header === null || stripos($header, 'Bearer ') !== 0) {
            Response::error('인증이 필요합니다.', 401);
        }

        $token = trim(substr($header, 7));
        $payload = Jwt::decode($token);
        if (!$payload || ($payload['type'] ?? null) !== 'access') {
            Response::error('유효하지 않거나 만료된 토큰입니다.', 401);
        }
        if (empty($payload['is_admin'])) {
            Response::error('관리자 권한이 필요합니다.', 403);
        }
        return $payload;
    }
}
