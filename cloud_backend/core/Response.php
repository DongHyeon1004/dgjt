<?php
declare(strict_types=1);

class Response
{
    /**
     * JSON 응답 후 종료.
     */
    public static function json($data, int $status = 200): void
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * 에러 응답 (FastAPI 스타일: {"detail": "..."}).
     */
    public static function error(string $detail, int $status = 400): void
    {
        self::json(['detail' => $detail], $status);
    }

    /**
     * 바이너리 응답 (이미지 등).
     */
    public static function binary(string $data, string $mime = 'image/jpeg'): void
    {
        if (!headers_sent()) {
            http_response_code(200);
            header('Content-Type: ' . $mime);
            header('Content-Length: ' . strlen($data));
        }
        echo $data;
        exit;
    }
}
