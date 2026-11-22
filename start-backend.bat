@echo off
title Jagdish Handloom Carpets Backend Server
echo ===================================================
echo   Starting Jagdish Handloom Carpets Backend Server
echo ===================================================
echo.
cd /d "%~dp0backend"
echo Checking dependencies...
if not exist node_modules (
    echo Installing node dependencies...
    call npm install
)

echo Starting Server...
node server.js
pause
