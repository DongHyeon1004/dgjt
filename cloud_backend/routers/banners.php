<?php
declare(strict_types=1);

/** @var Router $router */

// 활성 배너 목록
$router->get('/api/banners', function () {
    $db = getDb();
    $banners = $db->query("SELECT * FROM banners WHERE is_active = 1")->fetchAll();
    foreach ($banners as &$b) {
        if (isset($b['is_active'])) {
            $b['is_active'] = (bool)$b['is_active'];
        }
    }
    Response::json($banners);
});

// 전체 배너 목록 (관리자)
$router->get('/api/banners/all', function () {
    Auth::admin();
    $db = getDb();
    $banners = $db->query("SELECT * FROM banners ORDER BY id DESC")->fetchAll();
    foreach ($banners as &$b) {
        $b['is_active'] = (bool)$b['is_active'];
    }
    Response::json($banners);
});

// 배너 등록 (관리자, multipart)
$router->post('/api/banners', function () {
    Auth::admin();

    $title    = (string)(Request::form('title', ''));
    $linkUrl  = (string)(Request::form('link_url', ''));
    $isActive = filter_var(Request::form('is_active', '1'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
    $image    = Request::file('image');

    if (!$image || ($image['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        Response::error('이미지 파일이 필요합니다.', 400);
    }

    $ext = strtolower(pathinfo((string)$image['name'], PATHINFO_EXTENSION));
    if ($ext === '') $ext = 'jpg';

    $basename  = pathinfo((string)$image['name'], PATHINFO_FILENAME);
    $filename  = date('Ymd') . '_' . md5($basename) . '.' . $ext;
    $bannerDir = config('upload_dirs')['banners'];
    $savePath  = $bannerDir . '/' . $filename;

    if (!move_uploaded_file($image['tmp_name'], $savePath)) {
        Response::error('파일 저장 실패', 500);
    }

    $imageUrl = "/uploads/banners/{$filename}";

    $db = getDb();
    $db->exec(
        "INSERT INTO banners (title, link_url, is_active, image_url) "
        . "VALUES ('{$title}', '{$linkUrl}', {$isActive}, '{$imageUrl}')"
    );
    $bannerId = (int)$db->lastInsertId();

    $banner = $db->query("SELECT * FROM banners WHERE id = {$bannerId}")->fetch();
    if ($banner && isset($banner['is_active'])) {
        $banner['is_active'] = (bool)$banner['is_active'];
    }
    Response::json($banner);
});

// 배너 활성화 토글 (관리자)
$router->patch('/api/banners/{banner_id}', function (string $bannerId) {
    Auth::admin();
    $bid = (int)$bannerId;
    $db = getDb();
    $banner = $db->query("SELECT * FROM banners WHERE id = {$bid}")->fetch();
    if (!$banner) {
        Response::error('배너를 찾을 수 없습니다.', 404);
    }
    $newStatus = $banner['is_active'] ? 0 : 1;
    $db->exec("UPDATE banners SET is_active = {$newStatus} WHERE id = {$bid}");
    $updated = $db->query("SELECT * FROM banners WHERE id = {$bid}")->fetch();
    $updated['is_active'] = (bool)$updated['is_active'];
    Response::json($updated);
});

// 배너 삭제 (관리자)
$router->delete('/api/banners/{banner_id}', function (string $bannerId) {
    Auth::admin();
    $bid = (int)$bannerId;

    $db = getDb();
    $banner = $db->query("SELECT * FROM banners WHERE id = {$bid}")->fetch();
    if (!$banner) {
        Response::error('배너를 찾을 수 없습니다.', 404);
    }

    // 디스크 파일 삭제
    if (!empty($banner['image_url'])) {
        $imgUrl = (string)$banner['image_url'];
        // /uploads/banners/xxx.jpg 형태만 처리 (외부 URL은 무시)
        if (strpos($imgUrl, '/uploads/banners/') === 0) {
            $relative = ltrim($imgUrl, '/');
            $abs = __DIR__ . '/../' . $relative;
            if (is_file($abs)) {
                @unlink($abs);
            }
        }
    }

    $db->exec("DELETE FROM banners WHERE id = {$bid}");
    Response::json(['message' => '배너가 삭제되었습니다.']);
});
