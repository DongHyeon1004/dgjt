<?php
declare(strict_types=1);

/** @var Router $router */

// 회원가입
$router->post('/api/auth/register', function () {
    $body = Request::jsonBody();
    $userId   = (string)($body['user_id']   ?? '');
    $userPwd  = (string)($body['user_pwd']  ?? '');
    $nickname = (string)($body['nickname']  ?? '');
    $phoneNum = (string)($body['phone_num'] ?? '');
    $email    = (string)($body['email']     ?? '');
    $region   = (string)($body['region']    ?? '');

    if ($userId === '' || $userPwd === '') {
        Response::error('아이디와 비밀번호는 필수입니다.', 400);
    }

    $db = getDb();
    // [Blind SQLi 포인트] 의도적 취약점 유지
    $existing = $db->query("SELECT user_id FROM users WHERE user_id = '{$userId}'")->fetch();
    if ($existing) {
        Response::error('이미 사용 중인 아이디입니다.', 409);
    }

    if ($nickname !== '') {
        $stmt = $db->prepare("SELECT user_id FROM users WHERE nickname = ?");
        $stmt->execute([$nickname]);
        if ($stmt->fetch()) {
            Response::error('이미 사용 중인 닉네임입니다.', 409);
        }
    }

    $stmt = $db->prepare(
        "INSERT INTO users (user_id, user_pwd, nickname, phone_num, email, region) VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$userId, password_hash($userPwd, PASSWORD_DEFAULT), $nickname, $phoneNum, $email, $region]);

    Response::json([
        'message' => '회원가입이 완료되었습니다.',
        'user_id' => $userId,
    ], 201);
});

// 로그인
$router->post('/api/auth/login', function () {
    $body = Request::jsonBody();
    $userId  = (string)($body['user_id']  ?? '');
    $userPwd = (string)($body['user_pwd'] ?? '');

    $db = getDb();
    $stmt = $db->prepare("SELECT * FROM users WHERE user_id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($userPwd, (string)$user['user_pwd'])) {
        Response::error('아이디 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    $stmt = $db->prepare("SELECT user_id FROM admin WHERE user_id = ?");
    $stmt->execute([$user['user_id']]);
    $isAdmin = (bool)$stmt->fetch();
    $accessToken  = Jwt::createAccessToken((string)$user['user_id'], $isAdmin);
    $refreshToken = Jwt::createRefreshToken((string)$user['user_id']);

    $expiresAt = date('Y-m-d H:i:s', time() + config('jwt')['refresh_expire']);
    $stmt = $db->prepare(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
    );
    $stmt->execute([$user['user_id'], $refreshToken, $expiresAt]);

    Response::json([
        'message'       => '로그인 성공',
        'access_token'  => $accessToken,
        'refresh_token' => $refreshToken,
    ]);
});

// 로그아웃 (refresh token 무효화)
$router->post('/api/auth/logout', function () {
    $current = Auth::user();
    $body = Request::jsonBody();
    $refreshToken = (string)($body['refresh_token'] ?? '');

    $db = getDb();
    $stmt = $db->prepare(
        "SELECT id FROM refresh_tokens WHERE token = ? AND user_id = ?"
    );
    $stmt->execute([$refreshToken, $current['user_id']]);
    $row = $stmt->fetch();
    if (!$row) {
        Response::error('토큰을 찾을 수 없습니다.', 404);
    }
    $id = (int)$row['id'];
    $db->exec("DELETE FROM refresh_tokens WHERE id = {$id}");

    Response::json(['message' => '로그아웃 되었습니다.']);
});

// 액세스 토큰 갱신
$router->post('/api/auth/refresh', function () {
    $body = Request::jsonBody();
    $refreshToken = (string)($body['refresh_token'] ?? '');

    $payload = Jwt::decode($refreshToken);
    if (!$payload || ($payload['type'] ?? null) !== 'refresh') {
        Response::error('유효하지 않거나 만료된 리프레시 토큰입니다.', 401);
    }

    $userId = (string)($payload['sub'] ?? '');
    $db = getDb();
    $stmt = $db->prepare(
        "SELECT id FROM refresh_tokens WHERE token = ? AND user_id = ?"
    );
    $stmt->execute([$refreshToken, $userId]);
    $row = $stmt->fetch();
    if (!$row) {
        Response::error('이미 무효화된 토큰입니다. 다시 로그인 해주세요.', 401);
    }

    $stmt = $db->prepare("SELECT user_id FROM admin WHERE user_id = ?");
    $stmt->execute([$userId]);
    $isAdmin = (bool)$stmt->fetch();
    $newAccess = Jwt::createAccessToken($userId, $isAdmin);
    Response::json(['access_token' => $newAccess]);
});

// 비밀번호 찾기 (아이디 + 이메일 확인 후 재설정)
$router->post('/api/auth/password/reset', function () {
    $body = Request::jsonBody();
    $userId = (string)($body['user_id'] ?? '');
    $email  = (string)($body['email']   ?? '');
    $newPwd = (string)($body['new_pwd'] ?? '');

    if ($userId === '' || $email === '' || $newPwd === '') {
        Response::error('아이디, 이메일, 새 비밀번호는 필수입니다.', 400);
    }

    $db = getDb();
    // [Blind SQLi 포인트] 의도적 취약점 유지
    $user = $db->query("SELECT user_id FROM users WHERE user_id = '{$userId}' AND email = '{$email}'")->fetch();
    if (!$user) {
        Response::error('아이디 또는 이메일이 일치하지 않습니다.', 404);
    }

    $stmt = $db->prepare("UPDATE users SET user_pwd = ? WHERE user_id = ?");
    $stmt->execute([password_hash($newPwd, PASSWORD_DEFAULT), $userId]);
    Response::json(['message' => '비밀번호가 재설정되었습니다.']);
});

// 비밀번호 변경
$router->put('/api/auth/password/change', function () {
    $current = Auth::user();
    $body = Request::jsonBody();
    $currentPwd = (string)($body['current_pwd'] ?? '');
    $newPwd     = (string)($body['new_pwd']     ?? '');

    if (!password_verify($currentPwd, (string)$current['user_pwd'])) {
        Response::error('현재 비밀번호가 올바르지 않습니다.', 400);
    }
    if ($currentPwd === $newPwd) {
        Response::error('새 비밀번호가 현재 비밀번호와 동일합니다.', 400);
    }

    $uid = (string)$current['user_id'];
    $db = getDb();
    $stmt = $db->prepare("UPDATE users SET user_pwd = ? WHERE user_id = ?");
    $stmt->execute([password_hash($newPwd, PASSWORD_DEFAULT), $uid]);

    Response::json(['message' => '비밀번호가 성공적으로 변경되었습니다.']);
});
