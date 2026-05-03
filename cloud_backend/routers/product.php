<?php
declare(strict_types=1);

/** @var Router $router */

// ===== 헬퍼 =====

if (!function_exists('fetchThumbnail')) {
    function fetchThumbnail(int $productId): string
    {
        return "/api/products/{$productId}/thumbnail";
    }
}

if (!function_exists('isValidProductImage')) {
    function isValidProductImage(string $content, string $contentType, string $filename): bool
    {
        $allowedExt  = ['jpg', 'jpeg', 'png'];
        $allowedMime = ['image/jpeg', 'image/png'];

        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExt, true)) return false;
        if (!in_array($contentType, $allowedMime, true)) return false;

        // magic bytes 검사
        if (substr($content, 0, 3) === "\xFF\xD8\xFF") return true; // JPEG
        if (substr($content, 0, 8) === "\x89PNG\r\n\x1A\n") return true; // PNG

        return false;
    }
}

// ===== 라우트 =====

// 상품 목록
$router->get('/api/products', function () {
    $search   = Request::query('search');
    $minPrice = Request::query('min_price');
    $maxPrice = Request::query('max_price');
    $skip     = (int)(Request::query('skip', 0));
    $limit    = (int)(Request::query('limit', 20));
    if ($skip < 0) $skip = 0;
    if ($limit < 1) $limit = 1;
    if ($limit > 100) $limit = 100;

    $sql    = "SELECT p.*, u.region AS seller_region FROM product p LEFT JOIN users u ON p.user_id = u.user_id WHERE 1=1";
    $params = [];
    if ($search !== null && $search !== '') {
        $sql .= " AND (product_title LIKE ? OR product_body LIKE ?)";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
    }
    if ($minPrice !== null && $minPrice !== '') {
        $sql .= " AND product_price >= ?";
        $params[] = (int)$minPrice;
    }
    if ($maxPrice !== null && $maxPrice !== '') {
        $sql .= " AND product_price <= ?";
        $params[] = (int)$maxPrice;
    }
    $sql .= " LIMIT {$limit} OFFSET {$skip}";

    $db = getDb();
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();
    foreach ($products as &$p) {
        $p['thumbnail_url'] = fetchThumbnail((int)$p['product_id']);
    }
    Response::json($products);
});

// 상품 등록
$router->post('/api/products', function () {
    $current = Auth::user();
    $body = Request::jsonBody();

    $title   = (string)($body['product_title'] ?? '');
    $bodyTxt = (string)($body['product_body']  ?? '');
    $price   = (int)($body['product_price']    ?? 0);

    if ($title === '') {
        Response::error('상품명은 필수입니다.', 400);
    }

    $db = getDb();
    $stmt = $db->prepare(
        "INSERT INTO product (user_id, product_title, product_body, product_price) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([$current['user_id'], $title, $bodyTxt, $price]);
    $productId = (int)$db->lastInsertId();

    $product = $db->query("SELECT * FROM product WHERE product_id = {$productId}")->fetch();
    $product['thumbnail_url'] = fetchThumbnail($productId);
    Response::json($product, 201);
});

// 내 상품 목록
$router->get('/api/products/me', function () {
    $current = Auth::user();
    $db = getDb();
    $stmt = $db->prepare("SELECT * FROM product WHERE user_id = ?");
    $stmt->execute([$current['user_id']]);
    $products = $stmt->fetchAll();
    foreach ($products as &$p) {
        $p['thumbnail_url'] = fetchThumbnail((int)$p['product_id']);
    }
    Response::json($products);
});

// 통합 검색
$router->get('/api/search', function () {
    $q = (string)(Request::query('q', ''));
    if ($q === '') {
        Response::error('검색어가 필요합니다.', 400);
    }

    $likeQ = "%{$q}%";
    $db = getDb();

    $stmt = $db->prepare(
        "SELECT * FROM product WHERE product_title LIKE ? OR product_body LIKE ? LIMIT 10"
    );
    $stmt->execute([$likeQ, $likeQ]);
    $products = $stmt->fetchAll();
    foreach ($products as &$p) {
        $p['thumbnail_url'] = fetchThumbnail((int)$p['product_id']);
    }

    $stmt = $db->prepare(
        "SELECT * FROM users WHERE nickname LIKE ? OR user_id LIKE ? LIMIT 10"
    );
    $stmt->execute([$likeQ, $likeQ]);
    $users = $stmt->fetchAll();
    foreach ($users as &$u) {
        if (isset($u['is_admin'])) {
            $u['is_admin'] = (bool)$u['is_admin'];
        }
    }

    Response::json([
        'products' => $products,
        'users'    => $users,
    ]);
});

// 상품 상세
$router->get('/api/products/{product_id}', function (string $productId) {
    $pid = (int)$productId;
    $db = getDb();
    $product = $db->query("SELECT * FROM product WHERE product_id = {$pid}")->fetch();
    if (!$product) {
        Response::error('상품을 찾을 수 없습니다.', 404);
    }

    $images = $db->query(
        "SELECT image_order FROM product_image WHERE product_id = {$pid} ORDER BY image_order"
    )->fetchAll();

    $stmt = $db->prepare("SELECT nickname, region FROM users WHERE user_id = ?");
    $stmt->execute([$product['user_id']]);
    $seller = $stmt->fetch();

    $orders = array_column($images, 'image_order');

    $product['thumbnail_url']   = fetchThumbnail($pid);
    $product['seller_nickname'] = $seller['nickname'] ?? '';
    $product['seller_region']   = $seller['region']   ?? '';
    $product['image_urls']      = array_map(fn($o) => "/api/products/{$pid}/images/{$o}", $orders);

    Response::json($product);
});

// 이미지 목록
$router->get('/api/products/{product_id}/images', function (string $productId) {
    $pid = (int)$productId;
    $db = getDb();
    $product = $db->query("SELECT product_id FROM product WHERE product_id = {$pid}")->fetch();
    if (!$product) {
        Response::error('상품을 찾을 수 없습니다.', 404);
    }
    $images = $db->query(
        "SELECT image_order FROM product_image WHERE product_id = {$pid} ORDER BY image_order"
    )->fetchAll();

    $orders = array_column($images, 'image_order');
    Response::json([
        'product_id'   => $pid,
        'image_orders' => $orders,
        'image_urls'   => array_map(fn($o) => "/api/products/{$pid}/images/{$o}", $orders),
    ]);
});

// 상품 수정
$router->patch('/api/products/{product_id}', function (string $productId) {
    $current = Auth::user();
    $body = Request::jsonBody();
    $pid = (int)$productId;

    $db = getDb();
    $product = $db->query("SELECT * FROM product WHERE product_id = {$pid}")->fetch();
    if (!$product) {
        Response::error('상품을 찾을 수 없습니다.', 404);
    }
    if ($product['user_id'] !== $current['user_id']) {
        Response::error('수정 권한이 없습니다.', 403);
    }

    $allowed = ['product_title', 'product_body', 'product_price'];
    $sets    = [];
    $params  = [];
    foreach ($allowed as $key) {
        if (array_key_exists($key, $body)) {
            $val = $body[$key];
            $sets[]   = "{$key} = ?";
            $params[] = ($key === 'product_price') ? (int)$val : (string)$val;
        }
    }
    if (!empty($sets)) {
        $clause   = implode(', ', $sets);
        $params[] = $pid;
        $stmt = $db->prepare("UPDATE product SET {$clause} WHERE product_id = ?");
        $stmt->execute($params);
    }

    $updated = $db->query("SELECT * FROM product WHERE product_id = {$pid}")->fetch();
    $updated['thumbnail_url'] = fetchThumbnail($pid);
    Response::json($updated);
});

// 상품 삭제
$router->delete('/api/products/{product_id}', function (string $productId) {
    $current = Auth::user();
    $pid = (int)$productId;

    $db = getDb();
    $product = $db->query("SELECT * FROM product WHERE product_id = {$pid}")->fetch();
    if (!$product) {
        Response::error('상품을 찾을 수 없습니다.', 404);
    }
    if ($product['user_id'] !== $current['user_id'] && empty($current['is_admin'])) {
        Response::error('삭제 권한이 없습니다.', 403);
    }

    $db->exec("DELETE FROM product WHERE product_id = {$pid}");
    Response::json(['message' => '상품이 삭제되었습니다.']);
});

// 이미지 업로드 (multipart files[])
$router->post('/api/products/{product_id}/images', function (string $productId) {
    $current = Auth::user();
    $pid = (int)$productId;

    $db = getDb();
    $product = $db->query("SELECT * FROM product WHERE product_id = {$pid}")->fetch();
    if (!$product) {
        Response::error('상품을 찾을 수 없습니다.', 404);
    }
    if ($product['user_id'] !== $current['user_id']) {
        Response::error('권한이 없습니다.', 403);
    }

    $files = Request::files('files');
    if (empty($files)) {
        Response::error('업로드할 파일이 없습니다.', 400);
    }

    $uploadDir = config('upload_dirs')['products'];

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

        $imageUrl = '/uploads/products/' . $filename;
        $stmt = $db->prepare(
            "INSERT INTO product_image (product_id, image_url, image_order) VALUES (?, ?, ?)"
        );
        $stmt->execute([$pid, $imageUrl, $idx]);
    }

    Response::json(['message' => count($files) . '개의 이미지가 업로드되었습니다.']);
});

// 상품 썸네일 서빙
$router->get('/api/products/{product_id}/thumbnail', function (string $productId) {
    $pid = (int)$productId;
    $db = getDb();
    $img = $db->query(
        "SELECT image_url FROM product_image WHERE product_id = {$pid} ORDER BY image_order LIMIT 1"
    )->fetch();
    $path = $img
        ? __DIR__ . '/../' . ltrim($img['image_url'], '/')
        : __DIR__ . '/../uploads/basic_image.png';
    serveFile($path);
});

// 상품 이미지 서빙
$router->get('/api/products/{product_id}/images/{order}', function (string $productId, string $order) {
    $pid = (int)$productId;
    $ord = (int)$order;
    $db = getDb();
    $img = $db->query(
        "SELECT image_url FROM product_image WHERE product_id = {$pid} AND image_order = {$ord}"
    )->fetch();
    if (!$img) {
        http_response_code(404);
        exit;
    }
    serveFile(__DIR__ . '/../' . ltrim($img['image_url'], '/'));
});

// 댓글 목록
$router->get('/api/products/{product_id}/comments', function (string $productId) {
    $pid = (int)$productId;
    $db = getDb();

    if (!$db->query("SELECT product_id FROM product WHERE product_id = {$pid}")->fetch()) {
        Response::error('상품을 찾을 수 없습니다.', 404);
    }

    $rows = $db->query(
        "SELECT c.*, u.nickname FROM product_comment c "
        . "JOIN users u ON c.user_id = u.user_id "
        . "WHERE c.product_id = {$pid} ORDER BY c.created_at ASC"
    )->fetchAll();

    $map = [];
    foreach ($rows as $r) {
        $r['replies'] = [];
        $map[(int)$r['comment_id']] = $r;
    }
    $result = [];
    foreach ($map as $cid => $comment) {
        $pid2 = $comment['parent_id'];
        if ($pid2 === null) {
            $result[] = &$map[$cid];
        } else {
            $map[(int)$pid2]['replies'][] = &$map[$cid];
        }
    }

    Response::json(array_values($result));
});

// 댓글 작성
$router->post('/api/products/{product_id}/comments', function (string $productId) {
    $current = Auth::user();
    $pid = (int)$productId;
    $body = Request::jsonBody();
    $content  = (string)($body['content'] ?? '');
    $parentId = isset($body['parent_comment_id']) ? (int)$body['parent_comment_id'] : null;

    if ($content === '') {
        Response::error('댓글 내용은 필수입니다.', 400);
    }

    $db = getDb();

    if (!$db->query("SELECT product_id FROM product WHERE product_id = {$pid}")->fetch()) {
        Response::error('상품을 찾을 수 없습니다.', 404);
    }

    if ($parentId !== null) {
        $parent = $db->query(
            "SELECT comment_id, parent_id FROM product_comment WHERE comment_id = {$parentId} AND product_id = {$pid}"
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
        "INSERT INTO product_comment (product_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([$pid, $uid, $parentId, $content]);
    $cid = (int)$db->lastInsertId();

    $comment = $db->query(
        "SELECT c.*, u.nickname FROM product_comment c "
        . "JOIN users u ON c.user_id = u.user_id "
        . "WHERE c.comment_id = {$cid}"
    )->fetch();
    $comment['replies'] = [];
    Response::json($comment, 201);
});

// 댓글 삭제
$router->delete('/api/products/{product_id}/comments/{comment_id}', function (string $productId, string $commentId) {
    $current = Auth::user();
    $pid = (int)$productId;
    $cid = (int)$commentId;

    $db = getDb();
    $comment = $db->query(
        "SELECT * FROM product_comment WHERE comment_id = {$cid} AND product_id = {$pid}"
    )->fetch();
    if (!$comment) {
        Response::error('댓글을 찾을 수 없습니다.', 404);
    }
    if ($comment['user_id'] !== $current['user_id'] && empty($current['is_admin'])) {
        Response::error('삭제 권한이 없습니다.', 403);
    }

    $db->exec("DELETE FROM product_comment WHERE comment_id = {$cid}");
    Response::json(['message' => '댓글이 삭제되었습니다.']);
});

