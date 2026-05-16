@echo off
chcp 65001 >nul
title pet-board: dev + интернет-туннель
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
    echo Установите Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo Откроется окно 1: Vite (npm run dev). Не закрывайте его.
echo Через несколько секунд откроется окно 2: туннель — там будет ссылка https://....loca.lt
echo.
start "pet-board Vite" cmd /k "cd /d "%~dp0" && npm run dev"
timeout /t 10 /nobreak >nul
start "pet-board tunnel" cmd /k "cd /d "%~dp0" && npm run tunnel"
echo.
echo Окна запущены. Ссылку для друзей смотрите в окне «pet-board tunnel».
pause
