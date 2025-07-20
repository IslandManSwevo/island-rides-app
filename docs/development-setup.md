# KeyLo Development Environment Setup Guide

**Document Status**: Final  
**Last Updated**: 2025-01-20  
**Version**: 1.0  
**Author**: Development Team Lead  

---

## Overview

This guide provides step-by-step instructions for setting up a complete KeyLo development environment. The setup includes all necessary tools, dependencies, and configurations for both mobile app and backend API development.

### Prerequisites

- **Operating System**: macOS 10.15+, Windows 10+, or Ubuntu 18.04+
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 20GB free space
- **Network**: Stable internet connection for package downloads

---

## Required Software Installation

### 1. Node.js and npm

Install Node.js version 18 or higher:

```bash
# Using Node Version Manager (recommended)
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or source profile
source ~/.bashrc

# Install and use Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 2. Git

Install Git for version control:

```bash
# macOS (using Homebrew)
brew install git

# Ubuntu/Debian
sudo apt update
sudo apt install git

# Windows
# Download from https://git-scm.com/download/win

# Verify installation
git --version
```

### 3. React Native Development Tools

#### Install Expo CLI

```bash
npm install -g @expo/cli
expo --version
```

#### Install React Native CLI (for bare workflow)

```bash
npm install -g @react-native-community/cli
npx react-native --version
```

### 4. Mobile Development SDKs

#### Android Development (Android Studio)

1. **Download Android Studio**: https://developer.android.com/studio
2. **Install Android Studio** with default settings
3. **Configure Android SDK**:
   - Open Android Studio
   - Go to Settings → Appearance & Behavior → System Settings → Android SDK
   - Install Android SDK Platform 33 (Android 13)
   - Install Android SDK Build-Tools 33.0.0
   - Install Android Emulator and Android SDK Platform-Tools

4. **Set Environment Variables**:

```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk # Windows

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### iOS Development (macOS only)

1. **Install Xcode**: Download from Mac App Store
2. **Install Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
3. **Install CocoaPods**:
   ```bash
   sudo gem install cocoapods
   pod --version
   ```

### 5. Database Tools

#### SQLite (for development)

```bash
# macOS
brew install sqlite

# Ubuntu/Debian
sudo apt install sqlite3

# Windows
# Download from https://sqlite.org/download.html

# Verify installation
sqlite3 --version
```

#### PostgreSQL (for production testing)

```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/

# Create development database
createdb keylo_dev
```

### 6. Redis (for caching and sessions)

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# Windows
# Download from https://github.com/microsoftarchive/redis/releases

# Verify installation
redis-cli ping  # Should return PONG
```

### 7. Development Tools

#### VS Code (recommended editor)

1. **Download VS Code**: https://code.visualstudio.com/
2. **Install recommended extensions**:
   - TypeScript and JavaScript Language Features
   - React Native Tools
   - Expo Tools
   - Prettier - Code formatter
   - ESLint
   - GitLens
   - Thunder Client (API testing)
   - SQLite Viewer

#### Docker (for containerization)

```bash
# macOS
brew install --cask docker

# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Windows
# Download Docker Desktop from https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version
```

---

## Project Setup

### 1. Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/keylo/keylo-app.git
cd keylo-app

# Or if using SSH
git clone git@github.com:keylo/keylo-app.git
cd keylo-app
```

### 2. Install Dependencies

```bash
# Install root dependencies and workspace dependencies
npm install

# This will install dependencies for:
# - Root workspace
# - apps/mobile
# - apps/api  
# - packages/shared

# Verify workspace setup
npm run workspaces
```

### 3. Environment Configuration

#### Backend Environment Setup

Create environment file for the API:

```bash
# Navigate to API directory
cd apps/api

# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env  # or your preferred editor
```

Example `.env` configuration:

```bash
# Database Configuration
DATABASE_URL="file:./data/keylo_dev.db"
DATABASE_TYPE="sqlite"

# Redis Configuration  
REDIS_URL="redis://localhost:6379"

# Firebase Configuration
FIREBASE_PROJECT_ID="keylo-development"
FIREBASE_CLIENT_EMAIL="your-service-account@keylo-development.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-for-development"
JWT_EXPIRES_IN="7d"

# TransFi Payment Gateway (Sandbox)
TRANSFI_API_URL="https://sandbox-api.transfi.com"
TRANSFI_API_KEY="sandbox_key_here"
TRANSFI_MERCHANT_ID="sandbox_merchant_id"

# File Upload Configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"  # 10MB

# Email Configuration (Development)
EMAIL_PROVIDER="console"  # Logs emails to console

# Application Configuration
NODE_ENV="development"
PORT="3000"
API_BASE_URL="http://localhost:3000"

# Logging Configuration
LOG_LEVEL="debug"
LOG_FILE="./logs/keylo-api.log"
```

#### Mobile App Environment Setup

```bash
# Navigate to mobile app directory
cd apps/mobile

# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env
```

Example mobile `.env` configuration:

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL="http://localhost:3000"
EXPO_PUBLIC_WS_URL="ws://localhost:3000"

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="keylo-development.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="keylo-development"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="keylo-development.appspot.com"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
EXPO_PUBLIC_FIREBASE_APP_ID="1:123456789:ios:abcdef123456"

# Maps Configuration
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"

# Environment
EXPO_PUBLIC_ENVIRONMENT="development"
EXPO_PUBLIC_DEBUG_MODE="true"

# Feature Flags
EXPO_PUBLIC_ENABLE_REDUX_DEVTOOLS="true"
EXPO_PUBLIC_ENABLE_FLIPPER="true"
```

### 4. Database Setup

#### Initialize SQLite Database

```bash
# From the API directory
cd apps/api

# Run database migrations
npm run migrate:dev

# Seed development data
npm run seed:dev

# Verify database setup
sqlite3 ./data/keylo_dev.db ".tables"
```

#### Setup PostgreSQL (Optional)

```bash
# Create PostgreSQL database
createdb keylo_dev

# Update .env to use PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/keylo_dev"
DATABASE_TYPE="postgresql"

# Run migrations
npm run migrate:dev
```

### 5. Firebase Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project: "keylo-development"
3. Enable Authentication with Email/Password and Phone providers
4. Generate service account key:
   - Project Settings → Service Accounts
   - Generate new private key
   - Save as `firebase-admin-key.json` in `apps/api/config/`

#### Configure Firebase Authentication

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Select:
# - Authentication
# - Emulators (for local development)

# Start Firebase emulators
firebase emulators:start
```

---

## Development Workflow

### 1. Start Development Servers

#### Option A: Start All Services

```bash
# From project root
npm run dev

# This starts:
# - Backend API server (localhost:3000)
# - Mobile app with Expo (localhost:19006)
# - WebSocket server (localhost:3001)
```

#### Option B: Start Services Individually

```bash
# Terminal 1: Start Backend API
cd apps/api
npm run dev

# Terminal 2: Start Mobile App
cd apps/mobile
npm run start

# Terminal 3: Start Redis (if not running as service)
redis-server

# Terminal 4: Start Firebase Emulators
firebase emulators:start
```

### 2. Mobile App Development

#### iOS Simulator

```bash
# From mobile app directory
cd apps/mobile

# Start iOS simulator
npm run ios

# Or using Expo
expo start --ios
```

#### Android Emulator

```bash
# Start Android emulator (create AVD first in Android Studio)
emulator -avd Pixel_4_API_33

# Start app on Android
npm run android

# Or using Expo
expo start --android
```

#### Physical Device Testing

```bash
# Install Expo Go app on your device
# Start development server
npm run start

# Scan QR code with Expo Go (Android) or Camera (iOS)
```

### 3. API Development and Testing

#### Test API Endpoints

```bash
# Using curl
curl http://localhost:3000/health

# Using Thunder Client in VS Code
# Or any API client like Postman
```

#### API Documentation

```bash
# Start API server
npm run dev

# Open Swagger documentation
open http://localhost:3000/api-docs
```

### 4. Database Management

#### View Development Data

```bash
# SQLite command line
sqlite3 ./apps/api/data/keylo_dev.db

# Common queries
.tables                    # List all tables
.schema users             # Show table schema
SELECT * FROM users;      # View user data
```

#### Database Migrations

```bash
# Create new migration
npm run migrate:create add_new_table

# Run pending migrations
npm run migrate:dev

# Rollback last migration
npm run migrate:rollback
```

#### Reset Database

```bash
# Reset database and reseed
npm run db:reset

# This will:
# - Drop all tables
# - Run all migrations
# - Seed with development data
```

---

## Testing Setup

### 1. Unit Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testNamePattern="Auth"
```

### 2. API Testing

```bash
# Run API integration tests
cd apps/api
npm run test:integration

# Run specific API tests
npm run test:api -- auth.test.js
```

### 3. Mobile App Testing

```bash
# Run mobile app tests
cd apps/mobile
npm test

# Run E2E tests (requires Detox setup)
npm run test:e2e:ios
npm run test:e2e:android
```

### 4. Linting and Code Quality

```bash
# Run ESLint
npm run lint

# Fix lint issues automatically
npm run lint:fix

# Run TypeScript type checking
npm run type-check

# Run Prettier formatting
npm run format
```

---

## Debugging Setup

### 1. VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/api/src/server.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "cwd": "${workspaceFolder}/apps/api",
      "outputCapture": "std",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Mobile Tests",
      "type": "node", 
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "cwd": "${workspaceFolder}/apps/mobile",
      "console": "integratedTerminal"
    }
  ]
}
```

### 2. React Native Debugging

#### Flipper Setup

```bash
# Install Flipper
# Download from https://fbflipper.com/

# Enable Flipper in development
# Already configured in the project
```

#### React DevTools

```bash
# Install React DevTools
npm install -g react-devtools

# Start React DevTools
react-devtools

# Connect from app (shake device and select Debug JS Remotely)
```

### 3. Network Debugging

#### Proxy Setup for API Testing

```bash
# Install Charles Proxy or mitmproxy
brew install --cask charles

# Configure device to use proxy
# iOS: Settings → WiFi → Configure Proxy
# Android: WiFi settings → Proxy
```

---

## Common Development Tasks

### 1. Adding New API Endpoint

```bash
# 1. Create route file
touch apps/api/src/routes/newFeature.ts

# 2. Create controller
touch apps/api/src/controllers/newFeatureController.ts

# 3. Create service  
touch apps/api/src/services/newFeatureService.ts

# 4. Add to main router
# Edit apps/api/src/routes/index.ts

# 5. Add tests
touch apps/api/src/tests/newFeature.test.ts
```

### 2. Adding New Mobile Screen

```bash
# 1. Create screen component
touch apps/mobile/src/screens/NewFeatureScreen.tsx

# 2. Add to navigation
# Edit apps/mobile/src/navigation/AppNavigator.tsx

# 3. Create screen-specific components
mkdir apps/mobile/src/components/newFeature
touch apps/mobile/src/components/newFeature/NewFeatureComponent.tsx

# 4. Add Redux slice if needed
touch apps/mobile/src/store/slices/newFeatureSlice.ts

# 5. Add tests
touch apps/mobile/src/__tests__/NewFeatureScreen.test.tsx
```

### 3. Database Schema Changes

```bash
# 1. Create migration
npm run migrate:create add_new_table

# 2. Edit migration file in apps/api/migrations/

# 3. Run migration
npm run migrate:dev

# 4. Update Prisma schema if using Prisma
# Edit apps/api/prisma/schema.prisma

# 5. Generate Prisma client
npx prisma generate
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev
```

#### 2. Module Not Found Errors

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For React Native specific issues
cd apps/mobile
npx react-native start --reset-cache
```

#### 3. Database Connection Issues

```bash
# Check if database file exists
ls -la apps/api/data/

# Reset database
npm run db:reset

# Check database permissions
chmod 644 apps/api/data/keylo_dev.db
```

#### 4. Expo/React Native Issues

```bash
# Clear Expo cache
expo start -c

# Reset Metro bundler cache  
npx react-native start --reset-cache

# For iOS specific issues
cd apps/mobile/ios
pod install
cd ..
npx react-native run-ios
```

#### 5. Firebase Authentication Issues

```bash
# Check Firebase emulator is running
firebase emulators:start

# Verify Firebase configuration
cat apps/api/config/firebase-admin-key.json

# Check environment variables
echo $FIREBASE_PROJECT_ID
```

#### 6. Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Start Redis server
redis-server

# Check Redis configuration
redis-cli config get "*"
```

### Getting Help

#### 1. Project Documentation

- Check the `docs/` directory for detailed documentation
- Review API documentation at `http://localhost:3000/api-docs`
- Read component documentation in Storybook (if configured)

#### 2. Logs and Debugging

```bash
# View API logs
tail -f apps/api/logs/keylo-api.log

# View detailed error logs
npm run dev -- --verbose

# Enable debug mode
DEBUG=* npm run dev
```

#### 3. Community Resources

- React Native Documentation: https://reactnative.dev/docs/getting-started
- Expo Documentation: https://docs.expo.dev/
- Node.js/Express Documentation: https://expressjs.com/
- Firebase Documentation: https://firebase.google.com/docs

---

## Performance Optimization

### Development Performance Tips

#### 1. Faster Builds

```bash
# Use Watchman for file watching (macOS/Linux)
brew install watchman

# Enable Metro cache
export RN_CACHE_DIR=/tmp/metro-cache

# Use development build of React Native
npm run start -- --dev
```

#### 2. Database Performance

```bash
# Add indexes for frequently queried fields
# Edit migration files to add indexes

# Use database query logging
DEBUG=knex:query npm run dev

# Optimize database connections
# Adjust connection pool settings in database config
```

#### 3. Bundle Size Optimization

```bash
# Analyze bundle size
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android-bundle.js --assets-dest android-assets --analyze

# Remove unused dependencies
npm run analyze-deps

# Use metro bundle splitting
# Configure in metro.config.js
```

---

## Security Considerations

### Development Security

#### 1. Environment Variables

```bash
# Never commit .env files
echo ".env" >> .gitignore
echo "apps/api/.env" >> .gitignore
echo "apps/mobile/.env" >> .gitignore

# Use different secrets for development
# Rotate secrets regularly
```

#### 2. API Security

```bash
# Always use HTTPS in production
# Configure CORS properly
# Implement rate limiting
# Validate all inputs
# Use prepared statements for database queries
```

#### 3. Mobile Security

```bash
# Obfuscate sensitive code
# Use certificate pinning for API calls
# Implement biometric authentication
# Secure local storage
```

---

## Conclusion

This development environment setup provides a comprehensive foundation for KeyLo development. The configuration supports:

- **Rapid Development**: Hot reloading and fast refresh
- **Quality Assurance**: Integrated testing and linting
- **Debugging**: Comprehensive debugging tools
- **Scalability**: Production-like development environment
- **Security**: Secure development practices

### Next Steps

1. Complete the initial setup following this guide
2. Familiarize yourself with the project structure
3. Run the test suite to ensure everything works
4. Start with small changes to understand the workflow
5. Refer to the technical specifications for detailed implementation guidance

### Support

For additional help:
- Review project documentation in the `docs/` directory
- Check the troubleshooting section above
- Consult team members or technical leads
- Reference official documentation for each technology