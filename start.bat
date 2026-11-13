@echo off
chcp 65001 >nul
title VeriCapVdo AI Studio
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system!
    echo Please download and install Node.js LTS from https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [*] First-time setup: Installing dependencies...
    call npm.cmd install --no-audit --no-fund
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed.
        pause
        exit /b 1
    )
)

node launcher.js
if %errorlevel% neq 0 (
    echo.
    echo [Notice] Server stopped unexpectedly. Press any key to close this window.
    pause
)
