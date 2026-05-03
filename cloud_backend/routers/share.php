<?php
declare(strict_types=1);

/** @var Router $router */

// ===== 헬퍼 =====

if (!function_exists('fetchShareThumbnail')) {
    function fetchShareThumbnail(int $shareId): string
    {
        return "/api/shares/{$shareId}/thumbnail";
    }
}

// ===== 라우트 =====

// 나눔 목록
$router->get('/api/shares', function () {
    $search = Request::query('search');
    $skip   = (int)(Request::query('skip', 0));
    $limit  = (int)(Request::query('limit', 20));
    if ($skip < 0) $skip = 0;
    if ($limit < 1) $limit = 1;
    if ($limit > 100) $limit = 100;

    $sql    = "SELECT s.*, u.region AS seller_region FROM share s LEFT JOIN users u ON s.user_id = u.user_id WHERE 1=1";
    $params = [];
    if ($search !== null && $search !== '') {
        $sql .= " AND (share_title LIKE ? OR share_body LIKE ?)";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
    }
    $sql .= " LIMIT {$limit} OFFSET {$skip}";

    $db = getDb();
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $shares = $stmt->fetchAll();
    foreach ($shares as &$s) {
        $s['thumbnail_url'] = fetchShareThumbnail((int)$s['share_id']);
    }
    Response::json($shares);
});

// 나눔 등록
$router->post('/api/shares', function () {
    $current = Auth::user();
    $body = Request::jsonBody();

    $title   = (string)($body['share_title'] ?? '');
    $bodyTxt = (string)($body['share_body']  ?? '');

    if ($title === '') {
        Response::error('제목은 필수입니다.', 400);
    }

    $db = getDb();
    $stmt = $db->prepare(
        "INSERT INTO share (user_id, share_title, share_body) VALUES (?, ?, ?)"
    );
    $stmt->execute([$current['user_id'], $title, $bodyTxt]);
    $shareId = (int)$db->lastInsertId();

    $share = $db->query("SELECT * FROM share WHERE share_id = {$shareId}")->fetch();
    $share['thumbnail_url'] = fetchShareThumbnail($shareId);
    Response::json($share, 201);
});

// 내 나눔 목록
$router->get('/api/shares/me', function () {
    $current = Auth::user();
    $db = getDb();
    $stmt = $db->prepare("SELECT * FROM share WHERE user_id = ?");
    $stmt->execute([$current['user_id']]);
    $shares = $stmt->fetchAll();
    foreach ($shares as &$s) {
        $s['thumbnail_url'] = fetchShareThumbnail((int)$s['share_id']);
    }
    Response::json($shares);
});

// 나눔 상세
$router->get('/api/shares/{share_id}', function (string $shareId) {
    $sid = (int)$shareId;
    $db = getDb();
    $share = $db->query("SELECT * FROM share WHERE share_id = {$sid}")->fetch();
    if (!$share) {
        Response::error('나눔을 찾을 수 없습니다.', 404);
    }

    $images = $db->query(
        "SELECT image_order FROM share_image WHERE share_id = {$sid} ORDER BY image_order"
    )->fetchAll();

    $stmt = $db->prepare("SELECT nickname, region FROM users WHERE user_id = ?");
    $stmt->execute([$share['user_id']]);
    $seller = $stmt->fetch();

    $orders = array_column($images, 'image_order');

    $share['thumbnail_url']   = fetchShareThumbnail($sid);
    $share['seller_nickname'] = $seller['nickname'] ?? '';
    $share['seller_region']   = $seller['region']   ?? '';
    $share['image_urls']      = array_map(fn($o) => "/api/shares/{$sid}/images/{$o}", $orders);

    Response::json($share);
});

// 이미지 목록
$router->get('/api/shares/{share_id}/images', function (string $shareId) {
    $sid = (int)$shareId;
    $db = getDb();
    $share = $db->query("SELECT share_id FROM share WHERE share_id = {$sid}")->fetch();
    if (!$share) {
        Response::error('나눔을 찾을 수 없습니다.', 404);
    }
    $images = $db->query(
        "SELECT image_order FROM share_image WHERE share_id = {$sid} ORDER BY image_order"
    )->fetchAll();

    $orders = array_column($images, 'image_order');
    Response::json([
        'share_id'     => $sid,
        'image_orders' => $orders,
        'image_urls'   => array_map(fn($o) => "/api/shares/{$sid}/images/{$o}", $orders),
    ]);
});

// 나눔 수정
$router->patch('/api/shares/{share_id}', function (string $shareId) {
    $current = Auth::user();
    $body = Request::jsonBody();
    $sid = (int)$shareId;

    $db = getDb();
    $share = $db->query("SELECT * FROM share WHERE share_id = {$sid}")->fetch();
    if (!$share) {
        Response::error('나눔을 찾을 수 없습니다.', 404);
    }
    if ($share['user_id'] !== $current['user_id']) {
        Response::error('수정 권한이 없습니다.', 403);
    }

    $allowed = ['share_title', 'share_body'];
    $sets    = [];
    $params  = [];
    foreach ($allowed as $key) {
        if (array_key_exists($key, $body)) {
            $sets[]   = "{$key} = ?";
            $params[] = (string)$body[$key];
        }
    }
    if (!empty($sets)) {
        $clause   = implode(', ', $sets);
        $params[] = $sid;
        $stmt = $db->prepare("UPDATE share SET {$clause} WHERE share_id = ?");
        $stmt->execute($params);
    }

    $updated = $db->query("SELECT * FROM share WHERE share_id = {$sid}")->fetch();
    $updated['thumbnail_url'] = fetchShareThumbnail($sid);
    Response::json($updated);
});

// 나눔 삭제
$router->delete('/api/shares/{share_id}', function (string $shareId) {
    $current = Auth::user();
    $sid = (int)$shareId;

    $db = getDb();
    $share = $db->query("SELECT * FROM share WHERE share_id = {$sid}")->fetch();
    if (!$share) {
        Response::error('나눔을 찾을 수 없습니다.', 404);
    }
    if ($share['user_id'] !== $current['user_id'] && empty($current['is_admin'])) {
        Response::error('삭제 권한이 없습니다.', 403);
    }

    $db->exec("DELETE FROM share WHERE share_id = {$sid}");
    Response::json(['message' => '나눔이 삭제되었습니다.']);
});

// 이미지 업로드
$router->post('/api/shares/{share_id}/images', function (string $shareId) {
    $current = Auth::user();
    $sid = (int)$shareId;

    $db = getDb();
    $share = $db->query("SELECT * FROM share WHERE share_id = {$sid}")->fetch();
    if (!$share) {
        Response::error('나눔을 찾을 수 없습니다.', 404);
    }
    if ($share['user_id'] !== $current['user_id']) {
        Response::error('권한이 없습니다.', 403);
    }

    $files = Request::files('files');
    if (empty($files)) {
        Response::error('업로드할 파일이 없습니다.', 400);
    }

    $uploadDir = config('upload_dirs')['shares'];

    foreach ($files as $idx => $file) {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            Response::error('파일 업로드 실패', 400);
        }
        $content = file_get_contents($file['tmp_name']);
        if ($content === false) {
            Response::error('파일을 읽을 수 없습니다.', 400);
        }
        if (!isValidProductImage($content, (string)($file['type'] ?? ''), (string)($file['name'] ?? ''))) {
            Response::error('이미지 파일만 업로드할 수 있습니다.', 400);
        }

        $ext      = strtolower(pathinfo((string)$file['name'], PATHINFO_EXTENSION));
        $filename = uuid4() . '.' . $ext;
        move_uploaded_file($file['tmp_name'], $uploadDir . '/' . $filename);

        $imageUrl = '/uploads/shares/' . $filename;
        $stmt = $db->prepare(
            "INSERT INTO share_image (share_id, image_url, image_order) VALUES (?, ?, ?)"
        );
        $stmt->execute([$sid, $imageUrl, $idx]);
    }

    Response::json(['message' => count($files) . '개의 이미지가 업로드되었습니다.']);
});

// 나눔 썸네일 서빙
$router->get('/api/shares/{share_id}/thumbnail', function (string $shareId) {
    $sid = (int)$shareId;
    $db = getDb();
    $img = $db->query(
        "SELECT image_url FROM share_image WHERE share_id = {$sid} ORDER BY image_order LIMIT 1"
    )->fetch();
    $path = $img
        ? __DIR__ . '/../' . ltrim($img['image_url'], '/')
        : __DIR__ . '/../uploads/basic_image.png';
    serveFile($path);
});

// 나눔 이미지 서빙
$router->get('/api/shares/{share_id}/images/{order}', function (string $shareId, string $order) {
    $sid = (int)$shareId;
    $ord = (int)$order;
    $db = getDb();
    $img = $db->query(
        "SELECT image_url FROM share_image WHERE share_id = {$sid} AND image_order = {$ord}"
    )->fetch();
    if (!$img) {
        http_response_code(404);
        exit;
    }
    serveFile(__DIR__ . '/../' . ltrim($img['image_url'], '/'));
});

// 댓글 목록
$router->get('/api/shares/{share_id}/comments', function (string $shareId) {
    $sid = (int)$shareId;
    $db = getDb();

    if (!$db->query("SELECT share_id FROM share WHERE share_id = {$sid}")->fetch()) {
        Response::error('나눔을 찾을 수 없습니다.', 404);
    }

    $rows = $db->query(
        "SELECT c.*, u.nickname FROM share_comment c "
        . "JOIN users u ON c.user_id = u.user_id "
        . "WHERE c.share_id = {$sid} ORDER BY c.created_at ASC"
    )->fetchAll();

    $map = [];
    foreach ($rows as $r) {
        $r['replies'] = [];
        $map[(int)$r['comment_id']] = $r;
    }
    $result = [];
    foreach ($map as $cid => $comment) {
        $pid = $comment['parent_id'];
        if ($pid === null) {
            $result[] = &$map[$cid];
        } else {
            $map[(int)$pid]['replies'][] = &$map[$cid];
        }
    }

    Response::json(array_values($result));
});

// 댓글 작성
$router->post('/api/shares/{share_id}/comments', function (string $shareId) {
    $current = Auth::user();
    $sid = (int)$shareId;
    $body = Request::jsonBody();
    $content  = (string)($body['content'] ?? '');
    $parentId = isset($body['parent_comment_id']) ? (int)$body['parent_comment_id'] : null;

    if ($content === '') {
        Response::error('댓글 내용은 필수입니다.', 400);
    }

    $db = getDb();

    if (!$db->query("SELECT share_id FROM share WHERE share_id = {$sid}")->fetch()) {
        Response::error('나눔을 찾을 수 없습니다.', 404);
    }

    if ($parentId !== null) {
        $parent = $db->query(
            "SELECT comment_id, parent_id FROM share_comment WHERE comment_id = {$parentId} AND share_id = {$sid}"
        )->fetch();
        if (!$parent) {
            Response::error('부모 댓글을 찾을 수 없습니다.', 404);
        }
        if ($parent['parent_id'] !== null) {
            Response::error('대댓글에는 답글을 달 수 없습니다.', 400);
        }
    }

    $uid = $current['user_id'];
    $stmt = $db->prepare(
        "INSERT INTO share_comment (share_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([$sid, $uid, $parentId, $content]);
    $cid = (int)$db->lastInsertId();

    $comment = $db->query(
        "SELECT c.*, u.nickname FROM share_comment c "
        . "JOIN users u ON c.user_id = u.user_id "
        . "WHERE c.comment_id = {$cid}"
    )->fetch();
    $comment['replies'] = [];
    Response::json($comment, 201);
});

// 댓글 삭제
$router->delete('/api/shares/{share_id}/comments/{comment_id}', function (string $shareId, string $commentId) {
    $current = Auth::user();
    $sid = (int)$shareId;
    $cid = (int)$commentId;

    $db = getDb();
    $comment = $db->query(
        "SELECT * FROM share_comment WHERE comment_id = {$cid} AND share_id = {$sid}"
    )->fetch();
    if (!$comment) {
        Response::error('댓글을 찾을 수 없습니다.', 404);
    }
    if ($comment['user_id'] !== $current['user_id'] && empty($current['is_admin'])) {
        Response::error('삭제 권한이 없습니다.', 403);
    }

    $db->exec("DELETE FROM share_comment WHERE comment_id = {$cid}");
    Response::json(['message' => '댓글이 삭제되었습니다.']);
});

