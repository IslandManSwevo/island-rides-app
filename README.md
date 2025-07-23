# KeyLo - Vehicle Rental Platform for the Bahamas

KeyLo is a peer-to-peer vehicle rental marketplace designed specifically for the Bahamas' multi-island geography. The platform connects vehicle owners with renters, featuring real-time communication, secure payments, and island-aware search capabilities.

## 🏗️ **Architecture Overview**

KeyLo follows a **modular, scalable architecture** with systematic improvements implemented for maintainability and developer experience:

- **Frontend**: React Native with TypeScript (strict mode enabled)
- **Backend**: Modularized Node.js with Express.js
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT with comprehensive audit logging
- **Error Handling**: Centralized error management across frontend and backend
- **Type Safety**: Strict TypeScript configuration with comprehensive type definitions

## 🚀 Features

### Current Implementation
- **User Authentication** - Secure login/registration with role-based access control
- **Vehicle Management** - Add, edit, and manage vehicle listings
- **Real-time Chat** - WebSocket-powered messaging between hosts and renters
- **Payment Integration** - TransFi payment processing
- **Island-Aware Search** - Location-based vehicle discovery
- **Host Dashboard** - Comprehensive management interface for vehicle hosts
- **Role-Based Access** - Different interfaces for customers, hosts, and owners

### User Roles
- **Customer** - Browse and rent vehicles
- **Host** - List and manage vehicles for rental
- **Owner** - Fleet management and analytics dashboard

## 🛠 Tech Stack

### Frontend
- **React Native** ^0.72.0 with Expo ^49.0.0
- **TypeScript** ^5.8.3 with strict mode enabled
- **Redux Toolkit** for state management
- **React Navigation** for routing
- **Gluestack UI** for component library

### Backend (Modularized Architecture)
- **Node.js** with Express.js
- **PostgreSQL** (production) / **SQLite** (development)
- **WebSocket** for real-time features
- **JWT** authentication with audit logging
- **TransFi** payment integration
- **Winston** structured logging
- **Comprehensive error handling** middleware

## 📱 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd keylo-app
   ```

2. **Install all dependencies** (using workspace configuration)
   ```bash
   # Install all workspace dependencies at once
   npm run install:all

   # Or install individually:
   npm install                    # Root workspace dependencies
   cd IslandRidesApp && npm install  # Frontend dependencies
   cd ../backend && npm install      # Backend dependencies
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp IslandRidesApp/.env.example IslandRidesApp/.env
   cp backend/.env.example backend/.env
   ```

4. **Configure Environment Variables**
   
   **Frontend (.env in IslandRidesApp/)**
   ```
   EXPO_PUBLIC_API_URL=http://localhost:8081
   EXPO_PUBLIC_WEBSOCKET_URL=ws://localhost:8081
   ```
   
   **Backend (.env in backend/)**
   ```
   PORT=8081
   JWT_SECRET=your-jwt-secret
   DATABASE_URL=./database.sqlite
   TRANSFI_API_KEY=your-transfi-key
   ```

### Running the Application

#### **Option 1: Workspace Commands (Recommended)**
```bash
# Start both frontend and backend concurrently
npm run dev

# Or start individually:
npm run frontend    # Start React Native app
npm run backend     # Start Node.js server
```

#### **Option 2: Individual Commands**
1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   Server will run on http://localhost:3003 (or next available port)

2. **Start the Frontend App**
   ```bash
   cd IslandRidesApp
   npm start
   ```
   This will start the Expo development server

3. **Run on Device/Simulator**
   - **iOS**: Press `i` in the Expo CLI or scan QR code with Camera app
   - **Android**: Press `a` in the Expo CLI or scan QR code with Expo Go app

#### **🔧 Smart Port Management**
The backend now includes intelligent port management:
- Automatically finds available ports (3003-3007)
- Configures WebSocket and monitoring services
- Provides health check endpoints
- Graceful shutdown handling

## 🏗 **Project Structure** (Systematically Improved)

```
keylo-app/                   # Clean, organized workspace
├── IslandRidesApp/          # React Native frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── screens/         # App screens
│   │   ├── navigation/      # Navigation configuration
│   │   ├── services/        # API and external services
│   │   ├── store/          # Redux store and slices
│   │   ├── styles/         # Theme and styling
│   │   ├── types/          # Comprehensive TypeScript definitions
│   │   └── utils/          # Error handling and utilities
│   ├── tsconfig.json       # Strict TypeScript configuration
│   └── package.json
├── backend/                 # Modularized Node.js backend
│   ├── config/             # 🆕 Centralized configuration
│   │   ├── database.js     # Database connection management
│   │   ├── cors.js         # CORS configuration
│   │   └── logger.js       # Winston structured logging
│   ├── middleware/         # 🆕 Enhanced middleware
│   │   ├── auth.js         # JWT authentication with audit
│   │   └── errorHandler.js # Comprehensive error handling
│   ├── routes/             # 🆕 Modular API routes
│   │   └── auth.js         # Authentication endpoints
│   ├── utils/              # 🆕 Utility functions
│   │   └── portManager.js  # Smart port management
│   ├── services/           # Business logic services
│   ├── migrations/         # Database migrations
│   └── package.json
├── docs/                   # 📚 Comprehensive documentation
│   ├── architecture.md     # System architecture
│   ├── api-documentation.md # API reference
│   └── development-setup.md # Setup instructions
├── experimental/           # 🧪 AI integration experiments
└── package.json           # Workspace configuration
```

### 🎯 **Key Improvements Made**
- **✅ Modular Backend**: Separated concerns into config, middleware, routes, and utils
- **✅ TypeScript Strict Mode**: Enhanced type safety with comprehensive definitions
- **✅ Error Handling**: Centralized error management patterns
- **✅ Clean Structure**: Removed duplicate folders and organized experimental code
- **✅ Workspace Setup**: Proper monorepo configuration with workspace scripts

## 🔧 **Systematic Improvements** (Recently Completed)

KeyLo has undergone comprehensive architectural improvements following BMAD (Business Model Analysis and Design) standards:

### ✅ **Backend Modularization**
- **Modular Architecture**: Separated monolithic server.js into focused modules
- **Configuration Management**: Centralized database, CORS, and logging configuration
- **Enhanced Middleware**: JWT authentication with audit logging and comprehensive error handling
- **Smart Port Management**: Automatic port detection and conflict resolution

### ✅ **TypeScript Enhancement**
- **Strict Mode Enabled**: Full type safety with comprehensive error detection
- **Path Mapping**: Convenient import aliases (`@/components/*`, `@/services/*`)
- **Enhanced Type Definitions**: Comprehensive interfaces for all data models
- **Better Developer Experience**: Improved IntelliSense and error detection

### ✅ **Project Structure Cleanup**
- **Removed Duplicates**: Eliminated redundant folders and dependencies
- **Organized Experimental Code**: Moved AI integrations to dedicated experimental folder
- **Workspace Configuration**: Proper monorepo setup with workspace-level scripts
- **Clean Dependencies**: Resolved version conflicts and dependency management

### ✅ **Error Handling Patterns**
- **Frontend Error Management**: Centralized error handling with user-friendly messages
- **Backend Error Middleware**: Consistent error formatting and logging
- **Retry Logic**: Built-in retry mechanisms for network operations
- **Enhanced Error Boundary**: Improved error recovery and logging

## 🔐 Authentication System

KeyLo implements a comprehensive authentication system with:

- **JWT-based authentication** with automatic token refresh and audit logging
- **Role-based access control** (Customer, Host, Owner)
- **Protected routes** based on user roles
- **Persistent authentication** across app sessions
- **Secure password handling** with bcrypt
- **Comprehensive audit trails** for security monitoring

### User Roles & Permissions

| Feature | Customer | Host | Owner |
|---------|----------|------|-------|
| Browse Vehicles | ✅ | ✅ | ✅ |
| Book Vehicles | ✅ | ✅ | ✅ |
| List Vehicles | ❌ | ✅ | ✅ |
| Host Dashboard | ❌ | ✅ | ✅ |
| Owner Dashboard | ❌ | ❌ | ✅ |
| Fleet Management | ❌ | ❌ | ✅ |
| Financial Reports | ❌ | ❌ | ✅ |

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
cd IslandRidesApp
npm test

# Backend tests
cd backend
npm test
```

### Authentication Testing
The app includes comprehensive authentication testing. See `AUTHENTICATION_VALIDATION_RESULTS.md` for detailed test results and validation.

## 📚 **Documentation** (BMAD Standards)

### **Core Documentation**
- **[Architecture Overview](docs/architecture.md)** - Modular system architecture and integration patterns
- **[Development Setup](docs/development-setup.md)** - Comprehensive setup and workflow guide
- **[API Documentation](docs/api-documentation.md)** - Modularized backend API reference
- **[TypeScript Configuration](docs/typescript-configuration.md)** - Type safety standards and guidelines

### **Developer Guides**
- **[Error Handling Guidelines](docs/error-handling-guidelines.md)** - Consistent error management patterns
- **[Backend Modularization Guide](backend/MODULARIZATION_PLAN.md)** - Detailed modularization roadmap
- **[Project Structure Guide](docs/project-structure.md)** - Clean architecture and organization

### **Implementation References**
- **[Authentication System](docs/AUTHENTICATION_VALIDATION_RESULTS.md)** - Enhanced auth with audit logging
- **[Systematic Improvements Summary](SYSTEMATIC_IMPROVEMENTS_SUMMARY.md)** - Complete improvement overview
- **[Testing Strategy](docs/testing-strategy.md)** - Comprehensive testing approach

## 🚀 Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend Deployment
```bash
cd IslandRidesApp
expo build:android  # For Android
expo build:ios      # For iOS
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [Troubleshooting Guide](IslandRidesApp/TROUBLESHOOTING.md)
- Review [Known Issues](docs/Bug_tracking.md)
- Create an issue in the repository

---

**KeyLo** - Connecting the Bahamas, one ride at a time. 🏝️🚗