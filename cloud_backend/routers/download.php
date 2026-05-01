<?php
declare(strict_types=1);

/** @var Router $router */

$router->get('/api/download', function () {
    $file = (string)(Request::query('file', ''));

    $basePath = __DIR__ . '/../files/';
    $fullPath = $basePath . $file;

    if (!is_file($fullPath)) {
        Response::error('파일을 찾을 수 없습니다.', 404);
    }

    $content = file_get_contents($fullPath);
    if ($content === false) {
        Response::error('파일을 읽을 수 없습니다.', 500);
    }

    $downloadName = basename($file);
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $downloadName . '"');
    header('Content-Length: ' . strlen($content));
    echo $content;
    exit;
});
