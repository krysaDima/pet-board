@echo off
chcp 65001 >nul
title Передержка — запуск
cd /d "%~dp0"

echo.
echo Папка проекта: %cd%
echo.

where npm >nul 2>nul
if errorlevel 1 (
    echo [ОШИБКА] Команда npm не найдена.
    echo Установите Node.js с сайта https://nodejs.org/ ^(кнопка LTS^)
    echo После установки закройте это окно и запустите этот файл снова.
    echo.
    pause
    exit /b 1
)

echo Шаг 1: установка библиотек ^(первый раз может занять 1–2 минуты^)...
call npm install
if errorlevel 1 (
    echo Установка не удалась. Скопируйте текст выше и отправьте в чат.
    pause
    exit /b 1
)

echo.
echo Шаг 2: запуск сайта...
echo На ПК: http://localhost:5173  ^(в конце порта 5173, не 517^)
echo С телефона ^(та же Wi-Fi^): в окне Vite будет строка Network — откройте http://ВАШ-IP:5173
echo Если с телефона не открывается: разрешите Node.js в брандмауэре Windows при первом запуске.
echo Остановить сервер: Ctrl+C
echo.
call npm run dev
pause
