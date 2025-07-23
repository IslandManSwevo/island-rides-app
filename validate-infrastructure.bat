@echo off
echo ========================================
echo KeyLo Infrastructure Validation
echo ========================================

echo.
echo [1/5] Checking port availability...
set "ports=3003 3004 8082"
for %%p in (%ports%) do (
    echo Checking port %%p...
    netstat -ano | findstr :%%p | findstr LISTENING >nul
    if not errorlevel 1 (
        echo   ✅ Port %%p is in use (expected)
    ) else (
        echo   ❌ Port %%p is not in use (service may be down)
    )
)

echo.
echo [2/5] Testing backend health...
timeout /t 2 /nobreak >nul
curl -s http://localhost:3003/api/health >nul 2>&1
if not errorlevel 1 (
    echo   ✅ Backend health check passed
) else (
    echo   ❌ Backend health check failed
)

echo.
echo [3/5] Testing WebSocket connection...
echo Testing WebSocket on port 3004...
echo   ⏳ WebSocket test (manual verification required)

echo.
echo [4/5] Checking configuration consistency...
if exist "backend\runtime-config.json" (
    echo   ✅ Runtime config exists
) else (
    echo   ❌ Runtime config missing
)

if exist "IslandRidesApp\.env" (
    echo   ✅ Frontend environment config exists
) else (
    echo   ❌ Frontend environment config missing
)

echo.
echo [5/5] Infrastructure Status Summary...
echo ========================================
echo Service Status:
echo   Backend API: http://localhost:3003
echo   WebSocket: ws://localhost:3004  
echo   Frontend: http://localhost:8082
echo ========================================

echo.
echo Infrastructure validation complete!
echo If any services show as failed, run infrastructure-fix.bat
pause