@echo off
title Jagdish Handloom Carpets - Launch
echo ========================================================
echo   Launching Jagdish Handloom Carpets Website & Backend
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting backend server in separate window...
start "Jagdish Handloom Server" cmd /c "start-backend.bat"

echo [2/2] Waiting for server to initialize...
timeout /t 2 /nobreak >nul

echo.
echo Opening Website in your default browser...
start "" "http://localhost:5000"

echo.
echo ========================================================
echo   Website running at: http://localhost:5000
echo   Admin Portal at:    http://localhost:5000/admin
echo ========================================================
echo.
pause
