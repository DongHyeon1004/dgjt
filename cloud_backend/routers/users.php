<?php
declare(strict_types=1);

/** @var Router $router */

// 전체 유저 목록 (관리자)
$router->get('/api/users', function () {
    Auth::admin();
    $db = getDb();
    $users = $db->query("SELECT * FROM users")->fetchAll();
    Response::json($users);
});

// 내 프로필
$router->get('/api/users/me', function () {
    $user = Auth::user();
    Response::json($user);
});

// 닉네임 중복 검사
$router->get('/api/users/check-nickname', function () {
    $nickname = (string)(Request::query('nickname', ''));
    if ($nickname === '') {
        Response::error('닉네임을 입력해주세요.', 400);
    }
    $db = getDb();
    $exists = $db->query("SELECT user_id FROM users WHERE nickname = '{$nickname}'")->fetch();
    Response::json(['available' => !$exists]);
});

// 내 프로필 수정
$router->patch('/api/users/me', function () {
    $current = Auth::user();
    $body = Request::jsonBody();

    $allowed = ['nickname', 'phone_num', 'email', 'region'];
    $sets = [];
    foreach ($allowed as $key) {
        if (array_key_exists($key, $body)) {
            $val = (string)$body[$key];
            $sets[] = "{$key} = '{$val}'";
        }
    }

    $db = getDb();
    if (!empty($sets)) {
        $clause = implode(', ', $sets);
        $db->exec("UPDATE users SET {$clause} WHERE user_id = '{$current['user_id']}'");
    }

    $updated = $db->query("SELECT * FROM users WHERE user_id = '{$current['user_id']}'")->fetch();
    Response::json($updated);
});

// 회원 탈퇴
$router->delete('/api/users/me', function () {
    $current = Auth::user();
    $db = getDb();
    $db->exec("DELETE FROM users WHERE user_id = '{$current['user_id']}'");
    Response::json(['message' => '회원 탈퇴가 완료되었습니다.']);
});

// 타 유저 공개 프로필
$router->get('/api/users/{user_id}', function (string $userId) {
    $db = getDb();
    $user = $db->query("SELECT * FROM users WHERE user_id = '{$userId}'")->fetch();
    if (!$user) {
        Response::error('유저를 찾을 수 없습니다.', 404);
    }
    Response::json($user);
});

// 유저별 상품 목록
$router->get('/api/users/{user_id}/products', function (string $userId) {
    $db = getDb();
    $products = $db->query("SELECT * FROM product WHERE user_id = '{$userId}'")->fetchAll();
    foreach ($products as &$p) {
        $p['thumbnail_url'] = fetchThumbnail($db, (int)$p['product_id']);
    }
    Response::json($products);
});

// 유저 리뷰 (Mock)
$router->get('/api/users/{user_id}/reviews', function (string $userId) {
    Response::json([
        'user_id' => $userId,
        'reviews' => [
            ['id' => 1, 'content' => '친절해요',     'rating' => 5],
            ['id' => 2, 'content' => '응답이 빨라요', 'rating' => 4],
        ],
    ]);
});
