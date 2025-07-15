# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Island Rides is a peer-to-peer car rental marketplace for the Bahamas built with React Native/Expo frontend and Node.js/Express backend. The app features a sophisticated frosted glass design system with Bahamian theming and includes real-time chat, payment processing via TransFi, and comprehensive vehicle management.

## Development Commands

### Frontend (IslandRidesApp/)
```bash
# Start development server
npm start
npm run start:web --host lan --port 8081

# Platform-specific development
npm run android
npm run ios
npm run web

# Build and maintenance
npm run typecheck
npm run clean
npm run reinstall
```

### Backend (backend/)
```bash
# Start development server
npm start            # Production mode
npm run dev          # Development with nodemon

# Testing
npm test            # Run Jest tests with NODE_ENV=test
```

### Root Project
```bash
# No specific build commands - see subdirectories
```

## Architecture Overview

### Frontend Architecture
- **Framework**: React Native with Expo 53.x
- **Language**: TypeScript with strict typing
- **Navigation**: React Navigation v6 with stack navigation
- **State Management**: React Context + Hooks pattern
- **Styling**: Tamagui with custom Bahamian theme (frosted glass components)
- **Real-time**: WebSocket client integration
- **Services**: Service-oriented architecture with BaseService pattern

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with SQLite for development
- **Authentication**: JWT with refresh token rotation
- **Real-time**: WebSocket server on separate port (3004)
- **Payment**: TransFi API integration
- **Services**: Modular service architecture in `/services/`

### Key Architectural Patterns

1. **Service Layer Pattern**: Both frontend and backend use service classes that extend BaseService
2. **Repository Pattern**: Database operations abstracted through service layer
3. **Context API**: Authentication and theme management via React Context
4. **Error Boundaries**: Comprehensive error handling with recovery strategies
5. **Port Management**: Smart port detection system to avoid conflicts

## Key Directories and Components

### Frontend Structure (`IslandRidesApp/src/`)
- `components/` - Reusable UI components including vehicle cards, filters, and photo galleries
- `screens/` - Main application screens (authentication, search, bookings, etc.)
- `services/` - API clients, storage, notifications, and business logic
- `context/` - React contexts for auth and theme management
- `navigation/` - Navigation configuration and routing
- `config/` - Environment configuration and constants

### Backend Structure (`backend/`)
- `services/` - Business logic modules (auth, payments, notifications, etc.)
- `migrations/` - Database schema migration files
- `__tests__/` - Jest test suites for API endpoints
- Key files: `server.js`, `db.js`, `schema.sql`

### Important Service Classes
- **Frontend**: `ApiService`, `AuthService`, `VehicleService`, `BookingService`
- **Backend**: `transfiService`, `ownerDashboardService`, `reviewModerationService`

## Development Environment Setup

### Port Configuration
- Backend API: Auto-detects port starting from 3003
- WebSocket Server: Port 3004 (reserved)
- Frontend Web: Port 8081
- Reserved ports: 3001 (MCP), 3002 (Gemini Bridge), 19006/19001 (Expo)

### Database Setup
```bash
# Initialize database schema
node create-sqlite-schema.js

# Run migrations
node migrate.js

# Create test user
node create-test-user.js
```

### Environment Variables Required
- `JWT_SECRET` - JWT signing secret
- `DATABASE_URL` - PostgreSQL connection string
- `TRANSFI_API_KEY` - Payment processing
- Firebase configuration for authentication
- Push notification tokens

## Testing Strategy

### Backend Testing
- Jest with Supertest for API endpoint testing
- Separate test database with `NODE_ENV=test`
- Test files in `backend/__tests__/`
- Coverage includes auth, bookings, and advanced features

### Frontend Testing
- Component testing setup with React Native Testing Library
- Service layer unit tests
- Error boundary testing

## Key Design Patterns

### Error Handling
- Comprehensive error boundaries on frontend
- Service-level error handling with recovery strategies
- API error interception with automatic token refresh
- Graceful degradation for offline scenarios

### Real-time Features
- WebSocket integration for chat and notifications
- Push notification service with user preferences
- Real-time booking updates and price monitoring

### Security Implementation
- JWT with automatic refresh token rotation
- Rate limiting on API endpoints
- Input validation and sanitization
- Helmet.js security headers
- bcrypt password hashing

## Integration Points

### External Services
- **TransFi**: Multi-payment method processing (crypto, cards, bank transfers)
- **Firebase**: Authentication and push notifications
- **Expo**: Mobile development platform and services

### Internal Communication
- REST API between frontend and backend
- WebSocket for real-time features
- Service registry pattern for dependency injection

## Development Workflow

1. Backend changes: Test with Jest, check port availability
2. Frontend changes: Use TypeScript checking, test component integration
3. Database changes: Create migration files in `migrations/`
4. New features: Implement service layer first, then UI components
5. Testing: Run comprehensive test suites before deployment

## Common Development Tasks

### Adding New API Endpoints
1. Add route to `server.js`
2. Implement service logic in appropriate service file
3. Add tests in `__tests__/`
4. Update frontend `apiService.ts` with new method

### Adding New Screens
1. Create screen component in `src/screens/`
2. Add route to `navigation/routes.ts`
3. Update `AppNavigator.tsx` with new screen
4. Implement required services and API calls

### Database Changes
1. Create migration file in `backend/migrations/`
2. Run migration with `node migrate.js`
3. Update service layer to use new schema
4. Add tests for new functionality