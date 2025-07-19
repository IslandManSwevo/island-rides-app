# KeyLo Brownfield Enhancement Architecture

## Introduction

This document outlines the architectural approach for enhancing KeyLo with comprehensive host management features and enhanced discovery capabilities. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development of new features while ensuring seamless integration with the existing React Native and Node.js system.

**Relationship to Existing Architecture:**
This document supplements existing project architecture by defining how new components will integrate with current systems. Where conflicts arise between new and existing patterns, this document provides guidance on maintaining consistency while implementing enhancements.

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial Creation | 2025-01-27 | 2.0 | Updated brownfield architecture for current project state | Scrum Master Bob |
| Legacy Version | 2025-07-15 | 1.0 | Initial architecture for enhancement epic | Winston, the Architect |

## Existing Project Analysis

### Current Project State

- **Primary Purpose:** Peer-to-peer vehicle rental platform for the Bahamas
- **Current Tech Stack:** React Native (Expo) + TypeScript frontend, Node.js/Express backend, SQLite/PostgreSQL database, Firebase Authentication
- **Architecture Style:** Mobile-first, component-based architecture with RESTful API backend
- **Deployment Method:** Expo-based React Native app with Node.js backend deployment

### Available Documentation

- Comprehensive PRD defining host management and enhanced discovery features
- Frontend, fullstack, and UI architecture documentation
- TypeScript fixer toolkit with automated issue detection
- Backend-frontend consistency fixes documentation
- Payment integration documentation (TransFi)

### Identified Constraints

- Must maintain compatibility with existing Firebase Authentication
- SQLite for development, PostgreSQL for production database strategy
- Expo React Native framework limitations and requirements
- Existing component patterns and styling approach (React Native StyleSheet + Styled Components)
- Current API structure and authentication middleware

## Enhancement Scope and Integration Strategy

### Enhancement Overview

**Enhancement Type:** Significant Feature Addition & Architecture Modernization
**Scope:** Host management dashboard, public storefronts, island-aware search, document verification system
**Integration Impact:** High - requires database schema changes, new API endpoints, and multiple new screens

### Integration Approach

**Code Integration Strategy:** Incremental feature addition following existing patterns, maintaining backward compatibility
**Database Integration:** Schema migrations for new tables and columns, maintaining existing data integrity
**API Integration:** New RESTful endpoints following existing authentication and error handling patterns
**UI Integration:** New screens and components following established React Native patterns and theme system

### Compatibility Requirements

- **Existing API Compatibility:** All new endpoints must not break existing frontend API calls
- **Database Schema Compatibility:** Migrations must be backward-compatible with existing data
- **UI/UX Consistency:** New components must follow existing theme system and design patterns
- **Performance Impact:** New features must not degrade existing app performance

## Tech Stack Alignment

### Existing Technology Stack

| Category | Current Technology | Version | Usage in Enhancement | Notes |
|----------|-------------------|---------|---------------------|-------|
| Frontend Framework | React Native (Expo) | ~49.0.0 | Core platform for new screens | Maintained |
| Language | TypeScript | ^4.9.4 | All new frontend code | Maintained |
| Backend Framework | Node.js/Express | ^4.18.2 | New API endpoints | Maintained |
| Database (Dev) | SQLite | better-sqlite3 | Local development | Maintained |
| Database (Prod) | PostgreSQL | pg package | Production deployment | Maintained |
| Authentication | Firebase Auth | firebase-admin | User verification system | Enhanced |
| Real-time | Socket.io | ^4.7.2 | Chat and notifications | Maintained |
| Payment | TransFi | Custom integration | Payment processing | Maintained |
| State Management | React Context | Built-in | New feature state | Maintained |
| Navigation | React Navigation | @react-navigation/native | New screen routing | Enhanced |
| Styling | React Native StyleSheet + Styled Components | Native + ^5.3.11 | New component styling | Maintained |

### New Technology Additions

No new core technologies required. All enhancements will be built using the existing technology stack to maintain consistency and reduce complexity.

## Data Models and Schema Changes

### New Data Models

#### Host Profile Model
**Purpose:** Store host-specific information for verified users
**Integration:** Extends existing user model with host capabilities

**Key Attributes:**
- `storefrontName`: string - Public business name for the host
- `bio`: string - Host description and background
- `profileImageURL`: string - Host profile photo URL
- `memberSince`: timestamp - Date when user became a host
- `isVerified`: boolean - Host verification status
- `verificationLevel`: string - "Standard" or "Pro" host level

**Relationships:**
- **With Existing:** One-to-one relationship with users table
- **With New:** One-to-many relationship with vehicles

#### Vehicle Documents Model
**Purpose:** Store legal document information for vehicle verification
**Integration:** Extends existing vehicles table with document tracking

**Key Attributes:**
- `titleURL`: string - Vehicle title document URL
- `insuranceURL`: string - Insurance certificate URL
- `titleVerified`: boolean - Admin verification status for title
- `insuranceVerified`: boolean - Admin verification status for insurance
- `lastDocumentUpdate`: timestamp - Last document modification date

**Relationships:**
- **With Existing:** One-to-one relationship with vehicles table
- **With New:** Links to host profile through vehicle ownership

#### User Identity Verification Model
**Purpose:** Store user identity verification documents and status
**Integration:** Extends existing user model with verification capabilities

**Key Attributes:**
- `verificationStatus`: string - "Not Submitted", "Pending", "Verified", "Rejected"
- `driverLicenseURL`: string - Driver's license document URL
- `nibCardURL`: string - NIB card document URL
- `lastVerifiedAt`: timestamp - Date of last successful verification
- `verificationNotes`: string - Admin notes on verification status

**Relationships:**
- **With Existing:** One-to-one relationship with users table
- **With New:** Required for host profile creation

### Schema Integration Strategy

**Database Changes Required:**
- **New Tables:** `host_profiles`, `user_verifications`, `vehicle_documents`
- **Modified Tables:** `users` (add verification fields), `vehicles` (add listing status)
- **New Indexes:** Island-based search indexes, host performance indexes
- **Migration Strategy:** Incremental migrations with rollback capability

**Backward Compatibility:**
- All new fields have default values to prevent breaking existing queries
- Existing API endpoints continue to function without modification
- New verification fields are optional until user chooses to become a host

## Component Architecture

### New Components

#### Host Dashboard Components
**Responsibility:** Provide host management interface and analytics
**Integration Points:** Connects to existing authentication and vehicle management systems

**Key Interfaces:**
- `DashboardMetrics`: Displays earnings and performance data
- `BookingsList`: Shows upcoming and past bookings
- `EarningsChart`: Visualizes earnings over time (Pro hosts)
- `VehicleManagement`: Manages host's vehicle listings

**Dependencies:**
- **Existing Components:** AuthContext, theme system, navigation
- **New Components:** HostProfileHeader, DocumentUpload
- **Technology Stack:** React Native, TypeScript, Chart libraries

#### Host Storefront Components
**Responsibility:** Public-facing host profile and vehicle showcase
**Integration Points:** Public API endpoints, existing vehicle detail screens

**Key Interfaces:**
- `HostProfileHeader`: Displays host information and verification badge
- `HostVehicleList`: Shows host's available vehicles
- `HostReviews`: Displays host ratings and reviews
- `ContactHost`: Messaging interface for potential renters

**Dependencies:**
- **Existing Components:** VehicleCard, ReviewSystem, theme system
- **New Components:** VerificationBadge, HostMetrics
- **Technology Stack:** React Native, TypeScript, existing styling system

#### Enhanced Search Components
**Responsibility:** Island-aware search and filtering capabilities
**Integration Points:** Existing search API, map integration, vehicle listings

**Key Interfaces:**
- `IslandSelector`: Island-based filtering interface
- `SmartFilters`: Advanced search filters and preferences
- `SearchResults`: Enhanced results display with island context
- `MapView`: Custom-styled map with vehicle clustering

**Dependencies:**
- **Existing Components:** SearchBar, VehicleList, MapComponent
- **New Components:** FilterPanel, LocationDetector
- **Technology Stack:** React Native Maps, existing search infrastructure

### Component Interaction Diagram

```mermaid
graph TD
    A[App Navigator] --> B[Host Dashboard Screen]
    A --> C[Host Storefront Screen]
    A --> D[Enhanced Search Screen]
    
    B --> E[Dashboard Metrics]
    B --> F[Bookings List]
    B --> G[Earnings Chart]
    
    C --> H[Host Profile Header]
    C --> I[Host Vehicle List]
    C --> J[Host Reviews]
    
    D --> K[Island Selector]
    D --> L[Smart Filters]
    D --> M[Search Results]
    
    E --> N[Auth Context]
    F --> N
    G --> N
    H --> O[Public API]
    I --> O
    K --> P[Search API]
    L --> P
    M --> P
```

## API Design and Integration

### API Integration Strategy
**API Integration Strategy:** RESTful endpoints following existing patterns with JWT authentication
**Authentication:** Firebase Auth integration with existing middleware
**Versioning:** Backward-compatible additions to existing API structure

### New API Endpoints

#### Host Management Endpoints
- **Method:** GET
- **Endpoint:** `/api/host/dashboard`
- **Purpose:** Retrieve host dashboard data including earnings and bookings
- **Integration:** Uses existing authentication middleware and database connections

**Request:**
```json
{
  "headers": {
    "Authorization": "Bearer <firebase_token>"
  }
}
```

**Response:**
```json
{
  "earnings": {
    "total": 2500.00,
    "thisMonth": 450.00,
    "lastMonth": 380.00
  },
  "bookings": {
    "upcoming": [...],
    "recent": [...]
  },
  "vehicles": {
    "active": 3,
    "pending": 1
  }
}
```

#### Document Upload Endpoints
- **Method:** POST
- **Endpoint:** `/api/verification/upload`
- **Purpose:** Handle document uploads for user and vehicle verification
- **Integration:** Integrates with existing file upload infrastructure

**Request:**
```json
{
  "documentType": "driverLicense",
  "file": "<base64_encoded_file>",
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "documentUrl": "https://storage.url/document.pdf",
  "verificationStatus": "pending"
}
```

#### Enhanced Search Endpoints
- **Method:** GET
- **Endpoint:** `/api/vehicles/search`
- **Purpose:** Island-aware vehicle search with enhanced filtering
- **Integration:** Extends existing search functionality with new parameters

**Request:**
```json
{
  "island": "Grand Bahama",
  "filters": {
    "priceRange": [50, 200],
    "vehicleType": "SUV",
    "instantBook": true
  }
}
```

**Response:**
```json
{
  "vehicles": [...],
  "totalCount": 25,
  "island": "Grand Bahama",
  "appliedFilters": {...}
}
```

## Source Tree Integration

### Existing Project Structure
```
IslandRidesApp/
├── src/
│   ├── components/          # Existing UI components
│   ├── screens/            # Existing screen components
│   ├── services/           # API and utility services
│   ├── store/              # State management
│   ├── styles/             # Theme and styling
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
├── backend/
│   ├── services/           # Business logic services
│   ├── routes/             # API route definitions
│   ├── middleware/         # Authentication and validation
│   ├── migrations/         # Database migrations
│   └── utils/              # Backend utilities
```

### New File Organization
```
IslandRidesApp/
├── src/
│   ├── components/
│   │   ├── dashboard/           # Host dashboard components
│   │   │   ├── DashboardMetrics.tsx
│   │   │   ├── BookingsList.tsx
│   │   │   └── EarningsChart.tsx
│   │   ├── storefront/          # Host storefront components
│   │   │   ├── HostProfileHeader.tsx
│   │   │   ├── HostVehicleList.tsx
│   │   │   └── VerificationBadge.tsx
│   │   └── search/              # Enhanced search components
│   │       ├── IslandSelector.tsx
│   │       ├── SmartFilters.tsx
│   │       └── SearchResults.tsx
│   ├── screens/
│   │   ├── HostDashboardScreen.tsx    # New host dashboard
│   │   ├── HostStorefrontScreen.tsx   # New public storefront
│   │   ├── VerificationScreen.tsx     # New document upload
│   │   └── EnhancedSearchScreen.tsx   # Updated search interface
│   └── services/
│       ├── hostService.ts             # Host-related API calls
│       ├── verificationService.ts     # Document verification
│       └── enhancedSearchService.ts   # Advanced search logic
├── backend/
│   ├── services/
│   │   ├── hostService.js             # Host business logic
│   │   ├── verificationService.js     # Document processing
│   │   └── searchService.js           # Enhanced search logic
│   ├── routes/
│   │   ├── hostRoutes.js              # Host API endpoints
│   │   ├── verificationRoutes.js      # Verification endpoints
│   │   └── searchRoutes.js            # Enhanced search endpoints
│   └── migrations/
│       ├── 004_add_host_profiles.sql  # Host profile table
│       ├── 005_add_verifications.sql  # Verification tables
│       └── 006_add_vehicle_docs.sql   # Vehicle document tables
```

### Integration Guidelines

- **File Naming:** Follow existing PascalCase for React components, camelCase for services
- **Folder Organization:** Group related components in feature-specific folders
- **Import/Export Patterns:** Use existing barrel exports and relative import patterns

## Infrastructure and Deployment Integration

### Existing Infrastructure
**Current Deployment:** Expo-based React Native app with Node.js backend
**Infrastructure Tools:** Docker containers, standard web hosting
**Environments:** Development (local), staging, production

### Enhancement Deployment Strategy
**Deployment Approach:** Incremental feature rollout with feature flags
**Infrastructure Changes:** No major infrastructure changes required
**Pipeline Integration:** Integrate with existing CI/CD pipeline

### Rollback Strategy
**Rollback Method:** Database migration rollbacks and feature flag toggles
**Risk Mitigation:** Comprehensive testing in staging environment
**Monitoring:** Enhanced logging for new features and performance monitoring

## Coding Standards and Conventions

### Existing Standards Compliance
**Code Style:** TypeScript with strict mode, ESLint and Prettier configuration
**Linting Rules:** Existing ESLint configuration with React Native specific rules
**Testing Patterns:** Jest for unit tests, React Testing Library for component tests
**Documentation Style:** JSDoc comments for complex functions and components

### Critical Integration Rules
- **Existing API Compatibility:** New endpoints must not break existing frontend calls
- **Database Integration:** All schema changes must use migration files
- **Error Handling:** Follow existing error handling patterns with proper user feedback
- **Logging Consistency:** Use existing logging infrastructure for new features

## Testing Strategy

### Integration with Existing Tests
**Existing Test Framework:** Jest with React Testing Library and React Native Testing Library
**Test Organization:** Tests co-located with components, separate test files for services
**Coverage Requirements:** Maintain existing coverage levels while adding tests for new features

### New Testing Requirements

#### Unit Tests for New Components
- **Framework:** Jest with React Testing Library
- **Location:** Adjacent to component files with `.test.tsx` extension
- **Coverage Target:** 80% coverage for new components
- **Integration with Existing:** Follow existing test patterns and utilities

#### Integration Tests
- **Scope:** API endpoint testing and database integration testing
- **Existing System Verification:** Ensure new features don't break existing functionality
- **New Feature Testing:** Comprehensive testing of host dashboard, storefront, and search features

#### Regression Testing
- **Existing Feature Verification:** Automated test suite for core functionality
- **Automated Regression Suite:** Extend existing test suite with new feature coverage
- **Manual Testing Requirements:** User acceptance testing for new workflows

## Security Integration

### Existing Security Measures
**Authentication:** Firebase Authentication with JWT tokens
**Authorization:** Role-based access control for protected routes
**Data Protection:** HTTPS encryption, secure file upload handling
**Security Tools:** Input validation, SQL injection prevention

### Enhancement Security Requirements
**New Security Measures:** Document verification security, host-specific access controls
**Integration Points:** Secure file upload for documents, host dashboard access control
**Compliance Requirements:** Data privacy compliance for document storage

### Security Testing
**Existing Security Tests:** Authentication and authorization test coverage
**New Security Test Requirements:** Document upload security, host access control testing
**Penetration Testing:** Security review of new endpoints and file handling

## Next Steps

### Story Manager Handoff

**Prompt for Story Manager:**
"Based on the updated KeyLo brownfield architecture, begin implementing the host management and enhanced discovery features. Key integration requirements validated:

1. **Existing System Constraints:** React Native/Expo frontend with Node.js backend, Firebase Auth, SQLite/PostgreSQL database
2. **Integration Requirements:** All new features must maintain backward compatibility with existing API and database schema
3. **First Story Priority:** Implement foundational verification system (Story 1.1) as it's required for all host features
4. **Integration Checkpoints:** Verify each story maintains existing functionality while adding new capabilities

Focus on maintaining existing system integrity throughout implementation while delivering the comprehensive host management and discovery enhancement features."

### Developer Handoff

**Prompt for Developers:**
"Begin implementing KeyLo host management features using this architecture document. Key technical decisions based on project analysis:

1. **Technology Stack:** Use existing React Native/TypeScript/Node.js stack - no new core technologies
2. **Integration Requirements:** Follow existing patterns for API endpoints, component structure, and database migrations
3. **Compatibility Requirements:** All changes must be backward-compatible with existing user flows and data
4. **Implementation Sequence:** Start with database migrations, then API endpoints, then frontend components
5. **Verification Steps:** Test each component against existing functionality to ensure no regressions

Reference existing code patterns in the codebase and maintain consistency with established conventions throughout implementation."
