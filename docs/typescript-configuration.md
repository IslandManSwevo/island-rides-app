# TypeScript Configuration and Type Safety Standards

## Overview

KeyLo implements strict TypeScript configuration following BMAD standards to ensure maximum type safety, developer productivity, and code quality. This document outlines the TypeScript setup, configuration standards, and best practices for maintaining type safety across the application.

## Configuration Overview

### Strict Mode Configuration

The project uses TypeScript strict mode with comprehensive type checking enabled:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    // Strict type checking
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noImplicitOverride": true,
    "useUnknownInCatchVariables": true,
    "noFallthroughCasesInSwitch": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    
    // Path mapping for clean imports
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/screens/*": ["src/screens/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/config/*": ["src/config/*"]
    }
  }
}
```

### Key Configuration Features

#### **Strict Type Checking**
- **`strict: true`**: Enables all strict type checking options
- **`noImplicitAny: true`**: Requires explicit type annotations
- **`noImplicitReturns: true`**: Ensures all code paths return values
- **`noImplicitThis: true`**: Requires explicit `this` parameter types

#### **Enhanced Error Detection**
- **`noFallthroughCasesInSwitch: true`**: Prevents switch statement fallthrough
- **`useUnknownInCatchVariables: true`**: Uses `unknown` type for catch variables
- **`allowUnreachableCode: false`**: Flags unreachable code as errors
- **`noImplicitOverride: true`**: Requires explicit `override` modifiers

#### **Path Mapping**
- **Clean Imports**: Use `@/components/Button` instead of `../../../components/Button`
- **Consistent Structure**: Standardized import paths across the application
- **IDE Support**: Enhanced IntelliSense and auto-completion

## Type Definitions

### Core Type System

The application uses a comprehensive type system defined in `src/types/index.ts`:

#### **User and Authentication Types**
```typescript
export type UserRole = 'user' | 'host' | 'owner' | 'admin';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  isVerified?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

#### **Navigation Types**
```typescript
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  VehicleDetail: { vehicleId: string };
  Booking: { vehicleId: string };
  Profile: { userId?: string };
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};
```

#### **Utility Types**
```typescript
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
```

## Error Handling Types

### Error Type System

Comprehensive error typing for consistent error handling:

```typescript
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
  timestamp: string;
  context?: string;
}
```

## Development Guidelines

### Type Safety Best Practices

#### **1. Explicit Type Annotations**
```typescript
// ✅ Good: Explicit types
const userId: string = user.id;
const isAuthenticated: boolean = !!token;

// ❌ Avoid: Implicit any
const userData = response.data; // Type is 'any'
```

#### **2. Proper Error Handling**
```typescript
// ✅ Good: Typed error handling
try {
  const result = await apiCall();
  return result;
} catch (error: unknown) {
  if (error instanceof Error) {
    logError('API Call', error.message);
  }
  throw createError(ErrorType.NETWORK, 'API call failed');
}
```

#### **3. Component Props Typing**
```typescript
// ✅ Good: Comprehensive prop types
interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

const Button: React.FC<ButtonProps> = ({ title, onPress, ...props }) => {
  // Implementation
};
```

#### **4. API Response Typing**
```typescript
// ✅ Good: Typed API responses
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const fetchUser = async (id: string): Promise<ApiResponse<User>> => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};
```

### Common Patterns

#### **Generic Components**
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <FlatList
      data={items}
      renderItem={({ item }) => renderItem(item)}
      keyExtractor={keyExtractor}
    />
  );
}
```

#### **Conditional Types**
```typescript
type ApiEndpoint<T extends 'user' | 'vehicle'> = T extends 'user'
  ? '/api/users'
  : '/api/vehicles';

type UserEndpoint = ApiEndpoint<'user'>; // '/api/users'
type VehicleEndpoint = ApiEndpoint<'vehicle'>; // '/api/vehicles'
```

## IDE Integration

### VS Code Configuration

Recommended VS Code settings for optimal TypeScript experience:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  }
}
```

### ESLint Integration

TypeScript-aware ESLint configuration:

```json
{
  "extends": [
    "@expo/eslint-config",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

## Migration Guidelines

### Upgrading Existing Code

When updating existing JavaScript code to TypeScript:

1. **Start with Basic Types**: Add basic type annotations first
2. **Enable Strict Mode Gradually**: Use `// @ts-nocheck` temporarily if needed
3. **Fix One Module at a Time**: Systematic approach to avoid overwhelming changes
4. **Use Type Assertions Sparingly**: Prefer proper typing over type assertions

### Common Migration Patterns

```typescript
// Before (JavaScript)
const handleSubmit = (data) => {
  if (data.email) {
    submitForm(data);
  }
};

// After (TypeScript)
interface FormData {
  email: string;
  password: string;
}

const handleSubmit = (data: FormData): void => {
  if (data.email) {
    submitForm(data);
  }
};
```

## Performance Considerations

### Type-Only Imports

Use type-only imports for better build performance:

```typescript
import type { User } from '@/types';
import type { NavigationProp } from '@react-navigation/native';

// Regular import for runtime usage
import { createUser } from '@/services/userService';
```

### Conditional Compilation

Use TypeScript's conditional compilation for environment-specific code:

```typescript
declare const __DEV__: boolean;

if (__DEV__) {
  // Development-only code
  console.log('Debug information');
}
```

## Troubleshooting

### Common Issues and Solutions

#### **Path Mapping Not Working**
- Ensure `baseUrl` is set correctly in `tsconfig.json`
- Restart TypeScript server in IDE
- Check that paths don't conflict with node_modules

#### **Strict Mode Errors**
- Use `unknown` instead of `any` for catch variables
- Add explicit return types for functions
- Use optional chaining (`?.`) for potentially undefined values

#### **Import Errors**
- Use type-only imports for types: `import type { User } from '@/types'`
- Check file extensions in imports
- Ensure proper export/import syntax

## Best Practices Summary

1. **Enable Strict Mode**: Always use strict TypeScript configuration
2. **Explicit Types**: Prefer explicit type annotations over inference
3. **Path Mapping**: Use clean import paths with path mapping
4. **Error Handling**: Implement comprehensive error typing
5. **Component Props**: Always type component props and state
6. **API Responses**: Type all API responses and requests
7. **Generic Components**: Use generics for reusable components
8. **Type Guards**: Implement type guards for runtime type checking
9. **Utility Types**: Leverage TypeScript utility types for complex scenarios
10. **Regular Updates**: Keep TypeScript and related tools updated

This configuration ensures maximum type safety while maintaining developer productivity and code quality across the KeyLo application.
