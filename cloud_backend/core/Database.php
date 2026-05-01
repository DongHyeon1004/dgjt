<?php
declare(strict_types=1);

function getDb(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    // $host = getenv('DB_HOST') ?: '127.0.0.1';
    // $port = getenv('DB_PORT') ?: '3306';
    // $name = getenv('DB_NAME') ?: 'secondhand_platform';
    // $user = getenv('DB_USER') ?: 'root';
    // $pass = getenv('DB_PASS') ?: '1234';

    $db  = config('db');
    $dsn = "mysql:host={$db['host']};port={$db['port']};dbname={$db['name']};charset=utf8mb4";
    
    $pdo = new PDO($dsn, $db['user'], $db['pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => true,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
    ]);

    return $pdo;
}
