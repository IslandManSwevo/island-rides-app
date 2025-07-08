@echo off
echo 🏝️ Starting Island Rides Application with Docker...

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

:: Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down

:: Remove any orphaned containers
docker-compose down --remove-orphans

:: Build and start the containers
echo 🏗️ Building and starting containers...
docker-compose up --build -d

:: Wait a moment for containers to start
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

:: Check container status
echo 📊 Container Status:
docker-compose ps

:: Show logs for a few seconds
echo 📝 Recent logs:
echo --- Backend Logs ---
docker-compose logs --tail=10 backend
echo --- Frontend Logs ---
docker-compose logs --tail=10 frontend

echo.
echo ✅ Island Rides Application is starting up!
echo.
echo 🌐 Services:
echo    • Backend API: http://localhost:3003
echo    • Frontend (Expo): http://localhost:19006
echo    • Expo DevTools: http://localhost:19001
echo.
echo 🔧 Useful commands:
echo    • View logs: docker-compose logs -f [service]
echo    • Stop: docker-compose down
echo    • Restart: docker-compose restart [service]
echo    • Shell access: docker-compose exec [service] sh
echo.
echo 📱 To connect from your mobile device:
echo    1. Make sure your device is on the same network
echo    2. Replace 'localhost' with your computer's IP address
echo    3. Open Expo Go app and scan the QR code from http://localhost:19001
echo.
pause 