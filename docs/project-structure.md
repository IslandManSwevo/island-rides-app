# Project Structure and Development Workflow

## Overview

This document outlines the systematically improved project structure for KeyLo and provides comprehensive development workflow guidelines following BMAD (Business Model Analysis and Design) standards.

## Project Structure (Post-Improvements)

### Root Level Organization

```
keylo-app/                          # Clean, organized workspace
├── 📱 IslandRidesApp/              # React Native frontend application
├── 🖥️  backend/                    # Modularized Node.js backend
├── 📚 docs/                        # Comprehensive documentation
├── 🧪 experimental/                # AI integration experiments
├── 📋 package.json                 # Workspace configuration
├── 🚀 SYSTEMATIC_IMPROVEMENTS_SUMMARY.md
└── 📖 README.md                    # Main project documentation
```

### Frontend Structure (IslandRidesApp/)

```
IslandRidesApp/
├── 📁 src/                         # Source code
│   ├── 🧩 components/              # Reusable UI components
│   │   ├── common/                 # Generic components (Button, Input, etc.)
│   │   ├── forms/                  # Form-specific components
│   │   ├── navigation/             # Navigation components
│   │   └── ErrorBoundary.tsx       # Enhanced error boundary
│   ├── 📱 screens/                 # Application screens
│   │   ├── auth/                   # Authentication screens
│   │   ├── home/                   # Home and dashboard screens
│   │   ├── vehicles/               # Vehicle-related screens
│   │   └── profile/                # User profile screens
│   ├── 🧭 navigation/              # Navigation configuration
│   │   ├── AppNavigator.tsx        # Main navigation setup
│   │   ├── AuthNavigator.tsx       # Authentication flow
│   │   └── TabNavigator.tsx        # Bottom tab navigation
│   ├── 🔧 services/                # API and external services
│   │   ├── api/                    # API service classes
│   │   ├── auth/                   # Authentication services
│   │   ├── LoggingService.ts       # Frontend logging
│   │   └── notificationService.ts  # Push notifications
│   ├── 🗃️  store/                  # Redux store and slices
│   │   ├── slices/                 # Redux Toolkit slices
│   │   ├── middleware/             # Custom middleware
│   │   └── index.ts                # Store configuration
│   ├── 🎨 styles/                  # Theme and styling
│   │   ├── theme.ts                # Design system
│   │   ├── colors.ts               # Color palette
│   │   └── typography.ts           # Typography system
│   ├── 📝 types/                   # TypeScript type definitions
│   │   └── index.ts                # Comprehensive type system
│   └── 🛠️  utils/                  # Utility functions
│       ├── errorHandler.ts         # Frontend error handling
│       ├── validators.ts           # Input validation
│       └── helpers.ts              # General utilities
├── ⚙️  tsconfig.json               # Strict TypeScript configuration
├── 📦 package.json                 # Frontend dependencies
├── 🎯 App.tsx                      # Application entry point
└── 📱 index.ts                     # Expo entry point
```

### Backend Structure (Modularized)

```
backend/
├── ⚙️  config/                     # 🆕 Centralized configuration
│   ├── database.js                 # Database connection management
│   ├── cors.js                     # CORS configuration
│   ├── logger.js                   # Winston structured logging
│   └── environment.js              # Environment variables
├── 🛡️  middleware/                 # 🆕 Enhanced middleware layer
│   ├── auth.js                     # JWT authentication + audit
│   ├── errorHandler.js             # Comprehensive error handling
│   ├── validation.js               # Input validation middleware
│   ├── rateLimiting.js             # Rate limiting configuration
│   └── responseFormatter.js        # Response formatting
├── 🛣️  routes/                     # 🆕 Modular API routes
│   ├── index.js                    # Route aggregator
│   ├── auth.js                     # Authentication endpoints
│   ├── users.js                    # User management routes
│   ├── vehicles.js                 # Vehicle CRUD routes
│   ├── bookings.js                 # Booking management routes
│   ├── payments.js                 # Payment processing routes
│   └── health.js                   # Health check routes
├── 🎯 controllers/                 # Business logic controllers
│   ├── authController.js           # Authentication logic
│   ├── userController.js           # User management logic
│   ├── vehicleController.js        # Vehicle management logic
│   └── bookingController.js        # Booking management logic
├── 🔧 services/                    # External service integrations
│   ├── transfiService.js           # TransFi payment service
│   ├── paypalService.js            # PayPal integration
│   ├── pushNotificationService.js  # Push notifications
│   └── emailService.js             # Email notifications
├── 🛠️  utils/                      # 🆕 Utility functions
│   ├── portManager.js              # Smart port management
│   ├── validators.js               # Input validation utilities
│   ├── helpers.js                  # General helper functions
│   └── constants.js                # Application constants
├── 🌐 websocket/                   # WebSocket server components
│   ├── socketServer.js             # WebSocket server setup
│   ├── socketHandlers.js           # Socket event handlers
│   └── socketAuth.js               # WebSocket authentication
├── 📊 logs/                        # Log files (auto-generated)
│   ├── error.log                   # Error logs
│   ├── combined.log                # All logs
│   ├── audit.log                   # Security audit logs
│   └── performance.log             # Performance metrics
├── 🗄️  migrations/                 # Database migrations
├── 📦 package.json                 # Backend dependencies
├── 🚀 server.js                    # Server startup (simplified)
└── 📱 app.js                       # Express app configuration
```

### Documentation Structure

```
docs/
├── 📖 README.md                    # Documentation overview
├── 🏗️  architecture.md             # System architecture (updated)
├── 🔧 development-setup.md         # Setup and installation guide
├── 📡 api-documentation.md         # Modular API reference
├── 📝 typescript-configuration.md  # TypeScript standards
├── ⚠️  error-handling-guidelines.md # Error handling patterns
├── 🧪 testing-strategy.md          # Testing approach
└── 📋 project-structure.md         # This document
```

### Experimental Code Organization

```
experimental/
├── 🤖 gemini-bridge/               # Gemini AI integration
├── 🧠 kimi-script/                 # OpenAI integration demo
├── 🔌 mcp-server/                  # MCP server implementation
├── 📰 now-digest-service/          # Digest service
└── 🌐 web-bundles/                 # Web bundle experiments
```

## Development Workflow

### Getting Started

#### 1. Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd keylo-app

# Install all dependencies (workspace command)
npm run install:all

# Or install individually
npm install                          # Root workspace
cd IslandRidesApp && npm install     # Frontend
cd ../backend && npm install         # Backend
```

#### 2. Environment Configuration
```bash
# Backend environment (.env)
NODE_ENV=development
DATABASE_TYPE=sqlite
JWT_SECRET=your-secure-jwt-secret
LOG_LEVEL=debug

# Frontend environment
EXPO_PUBLIC_API_URL=http://localhost:3003/api
```

#### 3. Development Server
```bash
# Start both frontend and backend (recommended)
npm run dev

# Or start individually
npm run frontend    # React Native with Expo
npm run backend     # Node.js server with auto-restart
```

### Development Standards

#### Code Organization Principles

1. **Modular Architecture**: Each module has a single responsibility
2. **Clear Separation**: Frontend, backend, and shared concerns are separated
3. **Type Safety**: Strict TypeScript configuration across all code
4. **Error Handling**: Comprehensive error management patterns
5. **Consistent Patterns**: Standardized approaches across the codebase

#### File Naming Conventions

```
# Components (PascalCase)
UserProfile.tsx
VehicleCard.tsx
ErrorBoundary.tsx

# Services and utilities (camelCase)
userService.ts
errorHandler.ts
portManager.js

# Configuration files (lowercase)
database.js
cors.js
logger.js

# Route files (lowercase)
auth.js
vehicles.js
bookings.js
```

#### Import Organization

```typescript
// 1. External libraries
import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// 2. Internal modules (using path mapping)
import { Button } from '@/components/common';
import { userService } from '@/services/api';
import { User } from '@/types';

// 3. Relative imports (only for closely related files)
import './UserProfile.styles';
```

### TypeScript Development

#### Strict Configuration Benefits

- **Compile-time Error Detection**: Catch errors before runtime
- **Enhanced IntelliSense**: Better IDE support and autocomplete
- **Refactoring Safety**: Confident code changes with type checking
- **Documentation**: Types serve as inline documentation

#### Development Workflow

```bash
# Type checking (frontend)
cd IslandRidesApp
npx tsc --noEmit

# Type checking with watch mode
npx tsc --noEmit --watch

# Linting with TypeScript rules
npm run lint
```

### Error Handling Workflow

#### Frontend Error Handling

```typescript
// Component-level error handling
const MyComponent: React.FC = () => {
  const [error, setError] = useState<AppError | null>(null);

  const handleAction = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      const appError = handleError(error, 'MyComponent.handleAction', {
        showAlert: true,
        showRetry: true,
        onRetry: handleAction
      });
      setError(appError);
    }
  };

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleAction} />;
  }

  // Normal component render
};
```

#### Backend Error Handling

```javascript
// Route with error handling
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  res.json({ user });
}));
```

### Testing Strategy

#### Frontend Testing

```bash
# Unit tests
npm test

# Component testing with React Native Testing Library
npm run test:components

# Integration tests
npm run test:integration
```

#### Backend Testing

```bash
# API endpoint tests
npm run test:api

# Service layer tests
npm run test:services

# Integration tests with database
npm run test:integration
```

### Code Quality Tools

#### Linting and Formatting

```bash
# ESLint (TypeScript-aware)
npm run lint

# Prettier formatting
npm run format

# Pre-commit hooks (Husky)
# Automatically runs linting and formatting
```

#### Type Checking

```bash
# Frontend type checking
cd IslandRidesApp && npx tsc --noEmit

# Backend type checking (if using TypeScript)
cd backend && npx tsc --noEmit
```

### Deployment Workflow

#### Development Deployment

```bash
# Build frontend
npm run build:frontend

# Start production backend
npm run backend:prod

# Docker deployment
npm run docker:build
npm run docker:up
```

#### Production Considerations

- **Environment Variables**: Secure configuration management
- **Database Migrations**: Automated schema updates
- **Logging**: Structured logging for production monitoring
- **Error Tracking**: Integration with error monitoring services
- **Performance Monitoring**: API performance and user experience tracking

### Best Practices Summary

1. **Follow Modular Architecture**: Keep modules focused and independent
2. **Use TypeScript Strictly**: Enable all strict mode options
3. **Handle Errors Comprehensively**: Implement consistent error patterns
4. **Write Tests**: Maintain good test coverage
5. **Document Changes**: Update documentation with code changes
6. **Use Workspace Commands**: Leverage npm workspace features
7. **Monitor Performance**: Track application performance metrics
8. **Security First**: Implement security best practices
9. **Code Reviews**: Maintain code quality through reviews
10. **Continuous Integration**: Automate testing and deployment

This systematically improved project structure provides a solid foundation for scalable, maintainable development while ensuring excellent developer experience and code quality.
