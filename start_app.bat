@echo off
title MediGuard Launcher
echo ========================================================
echo         MEDIGUARD FULL-STACK APPLICATION LAUNCHER
echo ========================================================
echo.

echo 1. Stopping any existing instances on port 5000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo 2. Starting Backend Server (Port 5000)...
start "MediGuard Backend (Port 5000)" cmd /k "cd backend && node server.js"

timeout /t 2 >nul

echo 3. Starting Frontend Vite Server (Port 5173)...
start "MediGuard Frontend (Port 5173)" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo ========================================================
echo   MediGuard is running!
echo   Open your browser at: http://localhost:5173/
echo ========================================================
echo.
pause
