# KeyLo App - Comprehensive File Tree & Component Communication Map

**Generated**: 2025-01-22  
**Purpose**: Complete architectural overview ensuring proper component communication and navigation flows  
**Project**: KeyLo (Island Rides) - React Native Car Rental Platform  

---

## 🎯 **Project Overview**

KeyLo is a full-stack, island-aware car rental platform built with:
- **Frontend**: React Native + Expo + TypeScript
- **Backend**: Node.js + Express + Socket.io  
- **Database**: PostgreSQL (prod) / SQLite (dev)
- **Auth**: Firebase Authentication + JWT
- **Payments**: PayPal + Transfi
- **Infrastructure**: Docker + AWS/Terraform

---

## 📁 **Root Project Structure**

```
island-rides-app-main/
├── 🎨 IslandRidesApp/                 # React Native Frontend
├── 🔧 backend/                        # Node.js Backend API
├── 📚 docs/                          # Documentation & Architecture  
├── 🚀 infrastructure/                # Docker & Terraform configs
├── 📊 research/                      # Product research & analysis
├── ⚙️ monitoring-websocket-server.js # Real-time monitoring server
├── 🐳 docker-compose.yml            # Multi-service orchestration
└── 📦 package.json                  # Root workspace config
```

---

## 🎨 **Frontend Architecture (IslandRidesApp/)**

### **📱 Core App Files**
```
IslandRidesApp/
├── App.tsx                    # ⭐ Root app component with error boundaries
├── app.json                   # 📋 Expo configuration & build settings
├── package.json               # 📦 Dependencies (React Native, Firebase, Redux)
├── tsconfig.json             # 🔧 TypeScript strict configuration
├── babel.config.js           # 🔄 Babel with Reanimated plugin (LAST)
├── metro.config.js           # 🚀 Metro bundler with web + SVG support
├── Dockerfile                # 🐳 Multi-stage frontend container
└── expo.json                 # 📱 Expo specific configuration
```

### **🧩 Component Architecture**
```
src/
├── components/                           # 🧩 Reusable UI Components
│   ├── ⚡ AnimatedButton.tsx           # Haptic-enabled animated buttons
│   ├── 🗺️ MapView.tsx                  # React Native Maps integration
│   ├── 🗺️ ClusteredMapView.tsx         # Vehicle clustering on maps
│   ├── 🚗 VehicleCard.tsx              # Vehicle listing display
│   ├── 🚗 ModernVehicleCard.tsx        # Enhanced vehicle cards
│   ├── 🚗 VehicleConditionTracker.tsx  # Condition monitoring
│   ├── 📸 VehiclePhotoGallery.tsx      # Image gallery component
│   ├── 📸 VehiclePhotoUpload/          # 📁 Photo upload system
│   │   ├── PhotoUploadModal.tsx        # Upload interface
│   │   ├── usePhotoUpload.ts           # Upload hook with compression
│   │   └── PhotoPreview.tsx            # Image preview component
│   ├── 🦴 skeletons/                   # 📁 Loading state components
│   │   ├── VehicleReviewsSkeleton.tsx  # Reviews loading state
│   │   ├── ProfileSkeleton.tsx         # Profile loading state
│   │   └── BookingsSkeleton.tsx        # Bookings loading state
│   ├── 📊 monitoring/                  # 📁 Performance monitoring
│   │   ├── ComponentRenderMonitor.ts   # Render performance tracking
│   │   ├── LoadingIssuesMonitor.ts     # Loading issue detection
│   │   └── ServiceInitMonitor.ts       # Service initialization tracking
│   ├── 🔍 search/                      # 📁 Search components
│   │   └── SearchRecommendationCard.tsx # Search suggestions
│   └── 🚗 vehicle/                     # 📁 Vehicle-specific components
│       └── VehicleReviews.tsx          # Reviews with proper error handling
│
├── screens/                             # 📱 Application Screens
│   ├── 🔐 Auth Screens
│   │   ├── LoginScreen.tsx             # Firebase auth login
│   │   └── RegistrationScreen.tsx      # User registration flow  
│   ├── 🔍 Discovery Screens
│   │   ├── SearchScreen.tsx            # Island-aware search interface
│   │   ├── SearchResultsScreen.tsx     # Search results with filters
│   │   └── IslandSelectionScreen.tsx   # Geographic island picker
│   ├── 🚗 Vehicle Screens  
│   │   ├── VehicleDetailScreen.tsx     # Vehicle details with booking
│   │   └── VehiclePerformanceScreen.tsx # Owner analytics dashboard
│   ├── 💳 Booking & Payment Screens
│   │   ├── CheckoutScreen.tsx          # Payment processing interface
│   │   ├── BookingConfirmedScreen.tsx  # Confirmation with details
│   │   ├── PaymentScreen.tsx           # Payment method selection
│   │   └── PayPalConfirmationScreen.tsx # PayPal payment flow
│   ├── 👤 Profile & Management Screens
│   │   ├── ProfileScreen.tsx           # User profile management
│   │   ├── MyBookingsScreen.tsx        # User booking history
│   │   ├── FavoritesScreen.tsx         # Saved vehicles
│   │   └── SavedSearchesScreen.tsx     # Saved search queries
│   ├── 🏢 Host & Owner Screens
│   │   ├── HostDashboardScreen.tsx     # Host management interface
│   │   ├── HostStorefrontScreen.tsx    # Public host profile
│   │   ├── OwnerDashboardScreen.tsx    # Owner analytics & management
│   │   ├── FleetManagementScreen.tsx   # Vehicle fleet management
│   │   └── FinancialReportsScreen.tsx  # Financial analytics
│   ├── 💬 Communication Screens
│   │   ├── ChatScreen.tsx              # Real-time messaging
│   │   └── ChatConversationScreen.tsx  # Individual conversations
│   ├── 🛡️ Verification Screens
│   │   ├── VerificationScreen.tsx      # Identity verification flow
│   │   └── VehicleDocumentManagementScreen.tsx # Document management
│   └── ⚙️ Settings Screens
│       ├── NotificationPreferencesScreen.tsx # Push notification settings
│       ├── PaymentHistoryScreen.tsx    # Payment transaction history
│       └── WriteReviewScreen.tsx       # Review creation interface
│
├── navigation/                          # 🧭 Navigation System
│   ├── AppNavigator.tsx               # ⭐ Main navigation stack (FIXED)
│   ├── routes.ts                      # Route definitions & types
│   └── navigationRef.ts               # Navigation utilities
│
├── services/                            # 🔧 Business Logic & API Layer
│   ├── 🌐 Core API Services
│   │   ├── apiService.ts              # HTTP client with interceptors
│   │   ├── networkService.ts          # Network detection & retry logic
│   │   └── api/                       # 📁 API middleware
│   │       ├── middleware/            # Request/response middleware
│   │       │   └── retryMiddleware.ts # Automatic retry logic
│   │       └── endpoints/             # API endpoint definitions
│   ├── 🔐 Authentication Services
│   │   ├── firebaseAuthService.ts     # Firebase integration
│   │   └── authService.ts             # Authentication logic
│   ├── 🚗 Domain Services
│   │   ├── vehicleService.ts          # Vehicle CRUD operations
│   │   ├── bookingService.ts          # Booking management
│   │   ├── reviewService.ts           # Review system
│   │   └── favoriteService.ts         # Favorites management
│   ├── 💳 Payment Services
│   │   ├── paymentService.ts          # Payment processing
│   │   └── transfiService.ts          # Transfi integration
│   ├── 📱 Device Services
│   │   ├── notificationService.ts     # Push notifications
│   │   ├── hapticService.ts           # Device haptic feedback
│   │   └── PerformanceMonitoringService.ts # Performance tracking
│   ├── ⚠️ Error Handling
│   │   ├── errors/                    # 📁 Error management system
│   │   │   ├── AppError.ts           # Custom error classes
│   │   │   └── ErrorHandlingService.ts # Global error handling
│   │   └── AlertingService.ts         # User alerting system
│   └── 📊 Analytics & Logging
│       └── LoggingService.ts          # Structured logging
│
├── store/                               # 🗄️ Redux State Management
│   ├── index.ts                       # Store configuration with persistence
│   ├── slices/                        # 📁 Redux Toolkit slices
│   │   ├── authSlice.ts              # Authentication state
│   │   ├── userSlice.ts              # User profile state  
│   │   ├── vehicleSlice.ts           # Vehicle management state
│   │   ├── bookingSlice.ts           # Booking state management
│   │   ├── searchSlice.ts            # Search state & filters
│   │   └── uiSlice.ts                # UI state (modals, loading)
│   └── hooks.ts                       # Typed Redux hooks
│
├── config/                              # ⚙️ Configuration Management
│   ├── environment.ts                 # ⭐ Smart environment detection
│   ├── firebase.ts                   # Firebase configuration
│   ├── constants.ts                  # Application constants
│   └── apiRoutes.ts                  # API endpoint mapping
│
├── context/                             # 🔄 React Context Providers
│   ├── AuthContext.tsx               # Authentication context
│   └── ThemeContext.tsx              # Theme management context
│
├── features/                            # 🎯 Feature-based Architecture
│   ├── auth/                         # 📁 Authentication feature
│   │   └── hooks/                    # Authentication hooks
│   │       ├── useAuth.ts           # Main auth hook
│   │       └── useAuthPersistence.ts # Auth persistence
│   └── vehicles/                     # 📁 Vehicle management feature
│       └── hooks/                    # Vehicle-related hooks
│           └── useVehicles.ts       # Vehicle data management
│
├── monitoring/                          # 📊 Performance Monitoring System
│   ├── ComponentRenderMonitor.ts     # React component render tracking
│   ├── LoadingIssuesMonitor.ts       # Loading state monitoring  
│   └── ServiceInitMonitor.ts         # Service initialization tracking
│
├── hooks/                               # 🪝 Custom React Hooks
│   ├── usePerformanceMonitoring.ts   # Performance tracking hook
│   └── useMonitoring.ts              # General monitoring utilities
│
├── styles/                              # 🎨 Design System
│   ├── theme.ts                      # Theme configuration & colors
│   ├── colors.ts                     # Color palette definitions
│   └── typography.ts                 # Typography system
│
├── types/                               # 📝 TypeScript Definitions
│   ├── navigation.ts                 # Navigation type definitions
│   ├── api.ts                        # API response types
│   ├── globals.d.ts                  # Global type declarations
│   └── index.ts                      # Exported types
│
├── utils/                               # 🛠️ Utility Functions
│   ├── validation.ts                 # Form validation utilities
│   ├── formatting.ts                 # Data formatting helpers
│   └── constants.ts                  # Utility constants
│
└── testing/                             # 🧪 Testing Infrastructure
    ├── index.ts                      # Testing utilities export
    ├── test-utils.tsx                # Custom testing utilities
    ├── component-test-template.tsx   # Component testing template
    ├── screen-test-template.tsx      # Screen testing template
    └── service-test-template.tsx     # Service testing template
```

---

## 🔧 **Backend Architecture (backend/)**

### **🏗️ Core Backend Structure**
```
backend/
├── 🚀 Core Server Files
│   ├── server.js                     # ⭐ Main server with smart port detection
│   ├── db.js                        # Database connection management
│   ├── package.json                 # Backend dependencies
│   ├── Dockerfile                   # Multi-stage backend container
│   └── runtime-config.json          # Runtime configuration
│
├── 🗄️ Database Schema & Migrations
│   ├── schema.sql                   # ⭐ Complete database schema
│   └── migrations/                  # 📁 Database migration files
│       ├── 005_payments.sql                    # Payment system setup
│       ├── 006_phase2_features.sql            # Core features phase 2
│       ├── 007_review_moderation.sql          # Review system with moderation
│       ├── 008_advanced_vehicle_features.sql  # Enhanced vehicle features
│       ├── 009_owner_dashboard.sql            # Owner analytics dashboard
│       ├── 010_public_profiles_verification.sql # Identity verification
│       ├── 011_vehicle_document_urls.sql      # Document management URLs
│       ├── 012_paypal_integration.sql         # PayPal payment integration
│       ├── 013_host_profile_enhancements.sql  # Host profile features
│       ├── 014_vehicle_documents_management.sql # Document system
│       ├── 015_enhanced_identity_verification.sql # Advanced verification
│       ├── 016_enhanced_search_discovery.sql   # Search improvements
│       └── 017_host_storefront_marketplace.sql # Marketplace features
│
├── 🔧 Business Logic Services
│   ├── transfiService.js            # Transfi payment processing
│   ├── paypalService.js             # PayPal integration service
│   ├── pushNotificationService.js   # Push notification delivery
│   ├── favoritesService.js          # User favorites management
│   ├── priceMonitoringService.js    # Price tracking & alerts
│   ├── reviewModerationService.js   # Review content moderation
│   ├── ownerDashboardService.js     # Owner analytics service
│   ├── hostProfileService.js        # Host profile management
│   ├── documentService.js           # Document verification service
│   └── enhancedSearchService.js     # Advanced search algorithms
│
├── 📊 Performance & Monitoring
│   └── middleware/                  # 📁 Express middleware
│       ├── databaseMonitoring.js   # Database performance monitoring
│       └── performanceMiddleware.js # Request performance tracking
│
└── 🔧 Configuration & Utilities
    └── monitoring-integration.js    # Monitoring system integration
```

### **🗄️ Database Schema Overview**

#### **Core Tables**
```sql
-- User Management
users                    # User profiles with verification status
user_documents          # Identity verification documents
host_profiles           # Host-specific information & verification

-- Vehicle Management  
vehicles                # Vehicle listings with features & conditions
vehicle_documents       # Vehicle verification documents (title, insurance)
vehicle_features        # Dynamic vehicle feature system

-- Booking & Transactions
bookings               # Rental bookings with status tracking
payment_transactions   # Payment processing records (PayPal, Transfi)
booking_modifications  # Booking change history

-- Communication & Reviews
conversations          # In-app messaging conversations
messages              # Individual chat messages  
reviews               # Review system with moderation flags
review_moderation     # Content moderation tracking

-- User Preferences & Discovery
favorites             # User saved vehicles
saved_searches        # Saved search queries with alerts
price_monitoring      # Price tracking & alert system
search_history        # User search behavior analytics

-- Analytics & Reporting
owner_analytics       # Owner dashboard metrics
host_performance      # Host performance tracking
system_metrics        # Application performance data
```

---

## 🚀 **Infrastructure & DevOps**

### **🐳 Docker Configuration**
```
├── docker-compose.yml              # ⭐ Multi-service orchestration
├── IslandRidesApp/Dockerfile       # Frontend React Native container  
├── backend/Dockerfile              # Backend Node.js container
└── infrastructure/
    ├── terraform/                  # 📁 AWS Infrastructure as Code
    │   ├── main.tf                # Main Terraform configuration
    │   ├── variables.tf           # Infrastructure variables
    │   ├── outputs.tf             # Infrastructure outputs
    │   └── modules/               # Reusable Terraform modules
    └── docker/                     # 📁 Docker configurations
        ├── nginx.conf             # Reverse proxy configuration
        └── docker-compose.prod.yml # Production orchestration
```

### **📊 Monitoring & Observability**
```
monitoring/
├── monitoring-websocket-server.js  # Real-time monitoring WebSocket server
├── prometheus.yml                  # Metrics collection configuration
├── grafana/                        # 📁 Grafana dashboards
└── alerts/                         # 📁 Alert configurations
```

---

## 🔄 **Component Communication Flow**

### **🎯 Frontend → Backend → Database Flow**
```
[React Components] 
    ↓ (Redux Actions)
[Redux Store] 
    ↓ (API Service calls)
[HTTP Client with Interceptors] 
    ↓ (REST API calls)
[Express.js Routes] 
    ↓ (Business Logic)
[Service Layer] 
    ↓ (SQL Queries)
[PostgreSQL/SQLite Database]
```

### **🔄 Real-time Communication Flow**
```
[Frontend Components] 
    ↔ (Socket.io Client)
[WebSocket Connection] 
    ↔ (Socket.io Server)
[Backend WebSocket Handler] 
    ↔ (Database Events)
[PostgreSQL/SQLite with Triggers]
```

### **🔐 Authentication Flow**
```
[Login Screen] 
    → (Firebase Auth)
[Firebase Authentication] 
    → (ID Token)
[Backend JWT Verification] 
    → (User Session)
[Protected API Routes] 
    → (Database Operations)
[User Data & Permissions]
```

---

## 📡 **API Endpoint Architecture**

### **🔑 Authentication Endpoints**
- `POST /api/auth/login` - User login with Firebase token
- `POST /api/auth/register` - New user registration
- `POST /api/auth/refresh` - Token refresh
- `DELETE /api/auth/logout` - User logout

### **🚗 Vehicle Management Endpoints** 
- `GET /api/vehicles` - List vehicles with filters
- `GET /api/vehicles/:id` - Vehicle details
- `POST /api/vehicles` - Create new vehicle listing
- `PUT /api/vehicles/:id` - Update vehicle information
- `DELETE /api/vehicles/:id` - Remove vehicle listing

### **📅 Booking Management Endpoints**
- `GET /api/bookings` - User booking history
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Modify booking
- `DELETE /api/bookings/:id` - Cancel booking

### **💳 Payment Processing Endpoints**
- `POST /api/payments/paypal/create-order` - PayPal order creation
- `POST /api/payments/paypal/capture-order` - PayPal payment capture
- `POST /api/payments/transfi/process` - Transfi payment processing
- `GET /api/payments/history` - Payment transaction history

### **📝 Review & Rating Endpoints**
- `GET /api/reviews/vehicle/:id` - Vehicle reviews
- `POST /api/reviews` - Submit review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### **🏢 Host & Owner Endpoints**
- `GET /api/hosts/:id/profile` - Host public profile
- `GET /api/hosts/:id/vehicles` - Host vehicle listings  
- `GET /api/owners/dashboard` - Owner analytics dashboard
- `GET /api/owners/financial-reports` - Financial reporting

---

## 🛡️ **Security & Verification System**

### **🔒 Authentication Security**
- Firebase Authentication with JWT tokens
- Token refresh mechanism with automatic retry
- Role-based access control (User, Host, Owner, Admin)
- API route protection with middleware

### **📄 Document Verification**
- User identity verification (Driver's License, NIB Card)
- Vehicle document verification (Title, Insurance)
- S3/Cloud storage for secure document management
- Document approval workflow

### **💳 Payment Security**
- PCI-compliant payment processing
- PayPal integration with order verification
- Transfi payment gateway integration
- Transaction logging and reconciliation

---

## 📊 **Performance Monitoring System**

### **📱 Frontend Performance**
- Component render tracking
- Loading state monitoring
- Bundle size optimization
- Metro cache management

### **🔧 Backend Performance**  
- API response time tracking
- Database query performance
- Memory and CPU monitoring
- Real-time WebSocket performance

### **📈 Analytics & Reporting**
- User behavior analytics
- Booking conversion tracking
- Host performance metrics
- Financial reporting and analytics

---

## 🧪 **Testing Infrastructure**

### **📱 Frontend Testing**
```
testing/
├── component-test-template.tsx     # React component testing
├── screen-test-template.tsx        # Screen navigation testing
├── service-test-template.tsx       # API service testing
└── test-utils.tsx                  # Custom testing utilities
```

### **🔧 Backend Testing**
- API endpoint testing with Supertest
- Database migration testing
- Service integration testing
- Payment gateway testing

---

## 🚦 **Development Workflow**

### **🔄 Environment Management**
- Smart port detection for development
- Environment-specific configurations
- Docker development containers
- Hot reload for rapid development

### **📦 Build & Deployment**
- Multi-stage Docker builds
- Environment variable management
- Health checks for all services
- Automated deployment with Terraform

---

## 🎯 **Key Integration Points**

1. **🔐 Authentication**: Firebase → Backend JWT → API Authorization
2. **💬 Real-time**: Socket.io WebSockets for live chat & updates
3. **💳 Payments**: Dual payment providers (PayPal + Transfi)
4. **📄 Documents**: S3 storage with verification workflows
5. **🔍 Search**: Intelligent island-aware search algorithms
6. **📊 Analytics**: Comprehensive monitoring across all layers

---

This comprehensive file tree ensures all components are properly mapped and communicating effectively throughout the KeyLo platform, providing a complete architectural overview for development, maintenance, and scaling decisions.