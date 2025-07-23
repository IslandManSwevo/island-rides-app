@echo off
echo ========================================
echo KeyLo Infrastructure Fix - Incremental Mode
echo ========================================

echo.
echo [1/6] Stopping conflicting services...
taskkill /f /im node.exe 2>nul
taskkill /f /im expo.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/6] Clearing port conflicts...
for %%p in (3000 3001 3002 3003 3004 8081 8082 19006 19001) do (
    echo Clearing port %%p...
    netstat -ano | findstr :%%p | findstr LISTENING >nul
    if not errorlevel 1 (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p ^| findstr LISTENING') do (
            taskkill /f /pid %%a 2>nul
        )
    )
)

echo [3/6] Cleaning cache and temporary files...
cd /d "%~dp0IslandRidesApp"
if exist node_modules\.cache rmdir /s /q node_modules\.cache 2>nul
if exist .expo rmdir /s /q .expo 2>nul
if exist .metro rmdir /s /q .metro 2>nul

cd /d "%~dp0backend"
if exist node_modules\.cache rmdir /s /q node_modules\.cache 2>nul

echo [4/6] Updating runtime configuration...
cd /d "%~dp0"
echo { > backend\runtime-config.json
echo   "serverPort": 3003, >> backend\runtime-config.json
echo   "websocketPort": "3004", >> backend\runtime-config.json
echo   "apiBaseUrl": "http://localhost:3003", >> backend\runtime-config.json
echo   "websocketUrl": "ws://localhost:3004", >> backend\runtime-config.json
echo   "updatedAt": "%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,8%.000Z", >> backend\runtime-config.json
echo   "environment": "development", >> backend\runtime-config.json
echo   "status": "infrastructure-fixed" >> backend\runtime-config.json
echo } >> backend\runtime-config.json

echo [5/6] Starting backend service...
cd /d "%~dp0backend"
start "KeyLo Backend" cmd /k "npm start"
timeout /t 5 /nobreak >nul

echo [6/6] Starting frontend service...
cd /d "%~dp0IslandRidesApp"
start "KeyLo Frontend" cmd /k "npm start"

echo.
echo ========================================
echo Infrastructure Fix Complete!
echo ========================================
echo Backend: http://localhost:3003
echo Frontend: http://localhost:8082
echo WebSocket: ws://localhost:3004
echo ========================================
pause