@echo off
title VeriCapVdo AI Studio
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system!
    echo Please download and install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

node launcher.js
if %errorlevel% neq 0 (
    echo.
    echo [Notice] Server stopped. Press any key to close this window.
    pause
)
