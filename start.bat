@echo off
chcp 65001 >nul
title APT Attack Intelligence Analysis Platform - QuickStart
echo.
echo ========================================
echo   APT Attack Intelligence Analysis
echo   Platform - QuickStart
echo ========================================
echo.

:: Check if PowerShell is available
powershell -Command "Get-ExecutionPolicy" >nul 2>&1
if %errorlevel% neq 0 (
    echo [Error] PowerShell execution policy restriction
    echo.
    echo Please run PowerShell as administrator and execute:
    echo   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    echo.
    pause
    exit /b 1
)

:: Display menu
echo Please select an option:
echo.
echo   [1] Check dependencies and start services
echo   [2] Install dependencies and start services
echo   [3] Start services directly (skip check)
echo   [4] Show help information
echo   [5] Exit
echo.

set /p choice="Enter option (1-5): "

if "%choice%"=="1" goto check_and_start
if "%choice%"=="2" goto install_and_start
if "%choice%"=="3" goto skip_check
if "%choice%"=="4" goto show_help
if "%choice%"=="5" goto exit_script

echo.
echo [Error] Invalid option
pause
exit /b 1

:check_and_start
echo.
echo Checking dependencies and starting services...
powershell -ExecutionPolicy Bypass -File "%~dp0quickstart.ps1"
goto end

:install_and_start
echo.
echo Installing dependencies and starting services...
powershell -ExecutionPolicy Bypass -File "%~dp0quickstart.ps1" -Install
goto end

:skip_check
echo.
echo Starting services directly...
powershell -ExecutionPolicy Bypass -File "%~dp0quickstart.ps1" -SkipCheck
goto end

:show_help
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0quickstart.ps1" -Help
echo.
pause
goto exit_script

:end
echo.
echo Script execution completed
echo.
pause

:exit_script
exit /b 0
