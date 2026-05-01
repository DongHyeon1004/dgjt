<?php
declare(strict_types=1);

class Request
{
    /**
     * JSON body 파싱. 파싱 실패 또는 비어있으면 빈 배열.
     */
    public static function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            return [];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    /**
     * 쿼리 스트링 값 가져오기.
     */
    public static function query(string $key, $default = null)
    {
        return $_GET[$key] ?? $default;
    }

    /**
     * multipart/form-data 의 form 필드.
     */
    public static function form(string $key, $default = null)
    {
        return $_POST[$key] ?? $default;
    }

    /**
     * 단일 파일 ($_FILES[$key]).
     * @return array<string,mixed>|null
     */
    public static function file(string $key): ?array
    {
        if (!isset($_FILES[$key])) return null;
        $f = $_FILES[$key];
        // 다중 파일이면 첫번째만
        if (is_array($f['name'])) {
            if (count($f['name']) === 0) return null;
            return [
                'name'     => $f['name'][0],
                'type'     => $f['type'][0],
                'tmp_name' => $f['tmp_name'][0],
                'error'    => $f['error'][0],
                'size'     => $f['size'][0],
            ];
        }
        return $f;
    }

    /**
     * 다중 파일 정규화 ($_FILES[$key]). HTML <input name="files[]" multiple> 형태.
     * @return array<int, array<string,mixed>>
     */
    public static function files(string $key): array
    {
        if (!isset($_FILES[$key])) return [];
        $f = $_FILES[$key];

        // 단일 파일
        if (!is_array($f['name'])) {
            return [$f];
        }

        $result = [];
        $count = count($f['name']);
        for ($i = 0; $i < $count; $i++) {
            $result[] = [
                'name'     => $f['name'][$i],
                'type'     => $f['type'][$i],
                'tmp_name' => $f['tmp_name'][$i],
                'error'    => $f['error'][$i],
                'size'     => $f['size'][$i],
            ];
        }
        return $result;
    }

    /**
     * 헤더 값 가져오기 (대소문자 무시).
     */
    public static function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (!empty($_SERVER[$key])) {
            return $_SERVER[$key];
        }
        // Apache가 mod_rewrite로 리다이렉트했을 때
        $redirectKey = 'REDIRECT_' . $key;
        if (!empty($_SERVER[$redirectKey])) {
            return $_SERVER[$redirectKey];
        }
        // getallheaders fallback
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if ($headers) {
                foreach ($headers as $k => $v) {
                    if (strcasecmp($k, $name) === 0) {
                        return (string)$v;
                    }
                }
            }
        }
        return null;
    }
}
