# Firebase Integration Guide for Island Rides App

This guide explains how to set up Firebase authentication for the Island Rides application.

## Overview

The Island Rides app now supports Firebase authentication as an alternative to the traditional email/password system. This provides:
- Social login (Google, Apple, Facebook)
- Phone authentication
- Enhanced security
- Better user experience
- Cross-platform consistency

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "island-rides-app")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Generate Service Account Key

1. In Firebase Console, go to Project Settings (gear icon)
2. Navigate to "Service accounts" tab
3. Click "Generate new private key"
4. Save the downloaded JSON file as `backend/firebase-config.json`

### 3. Enable Authentication Methods

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable desired sign-in methods:
   - Email/Password
   - Google
   - Apple
   - Phone
   - Facebook (optional)

### 4. Configure Frontend

#### Install Firebase SDK in IslandRidesApp:
```bash
cd IslandRidesApp
npm install firebase @react-native-firebase/app @react-native-firebase/auth
```

#### Create frontend configuration:
Create `IslandRidesApp/src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 5. Environment Variables

Add these to your `.env` files:

```bash
# Backend (.env)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_AUTH_ENABLED=true

# Frontend (IslandRidesApp/.env)
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

## API Endpoints

### Authentication Endpoints

#### Firebase Login
```http
POST /api/auth/firebase/login
Content-Type: application/json

{
  "firebaseToken": "firebase-id-token"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  },
  "token": "jwt-token-for-backend"
}
```

#### Link Firebase Account
```http
POST /api/auth/firebase/link
Authorization: Bearer <existing-jwt-token>
Content-Type: application/json

{
  "firebaseToken": "firebase-id-token"
}
```

#### Unlink Firebase Account
```http
POST /api/auth/firebase/unlink
Authorization: Bearer <jwt-token>
```

## Frontend Implementation

### React Native Firebase Setup

1. Install dependencies:
```bash
npm install @react-native-firebase/app @react-native-firebase/auth
```

2. Configure iOS (if needed):
```bash
cd ios && pod install
```

3. Add Firebase configuration files:
- `GoogleService-Info.plist` for iOS
- `google-services.json` for Android

### Usage Examples

#### Sign In with Google
```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'your-web-client-id',
});

// Sign in
async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    
    // Send token to backend
    const response = await fetch('/api/auth/firebase/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseToken: await userCredential.user.getIdToken() })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Google sign-in failed:', error);
  }
}
```

#### Sign In with Apple
```javascript
import { appleAuth } from '@invertase/react-native-apple-authentication';

async function signInWithApple() {
  try {
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });
    
    const { identityToken, nonce } = appleAuthRequestResponse;
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
    const userCredential = await auth().signInWithCredential(appleCredential);
    
    // Send token to backend
    const response = await fetch('/api/auth/firebase/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseToken: await userCredential.user.getIdToken() })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Apple sign-in failed:', error);
  }
}
```

## Backend Integration

### User Creation Flow

1. **New User**: When a Firebase user logs in for the first time, the backend automatically creates a new user record
2. **Existing User**: If the email already exists, the Firebase account is linked to the existing user
3. **Account Linking**: Users can link multiple authentication providers to the same account

### Database Schema Updates

The following tables support Firebase integration:

- `users.firebase_uid` - Firebase user ID
- `users.firebase_provider` - Authentication provider (google, apple, etc.)
- `users.firebase_data` - JSON field for additional Firebase data

## Testing

### Test Firebase Authentication

1. **Backend Testing**:
```bash
cd backend
npm test
```

2. **Frontend Testing**:
```bash
cd IslandRidesApp
npm test
```

### Manual Testing Checklist

- [ ] Google sign-in works
- [ ] Apple sign-in works (iOS)
- [ ] Email/password sign-in works
- [ ] Account linking works
- [ ] Token refresh works
- [ ] Logout works
- [ ] Error handling works

## Troubleshooting

### Common Issues

1. **"Firebase configuration not found"**
   - Ensure `backend/firebase-config.json` exists
   - Check file permissions

2. **"Invalid Firebase token"**
   - Verify token is not expired
   - Check Firebase project configuration

3. **"User not found"**
   - Ensure user exists in Firebase
   - Check email verification status

### Debug Mode

Enable debug logging:
```bash
# Backend
DEBUG=firebase* npm run dev

# Frontend
EXPO_DEBUG=true npm start
```

## Security Considerations

1. **Token Validation**: All Firebase tokens are validated server-side
2. **Rate Limiting**: Authentication endpoints have rate limiting
3. **HTTPS Only**: Production requires HTTPS
4. **Token Expiration**: Tokens expire after 1 hour
5. **Refresh Tokens**: Automatic token refresh handled by Firebase SDK

## Migration Guide

### From Email/Password to Firebase

1. **Phase 1**: Enable Firebase alongside existing auth
2. **Phase 2**: Migrate existing users to Firebase
3. **Phase 3**: Deprecate old auth system

### User Migration Script

```javascript
// Run this once to migrate existing users
const migrateUsers = async () => {
  const users = await db.query('SELECT * FROM users WHERE firebase_uid IS NULL');
  for (const user of users.rows) {
    try {
      const firebaseUser = await firebaseAuth.createUser({
        email: user.email,
        password: user.password_hash, // Temporary password
        displayName: `${user.first_name} ${user.last_name}`
      });
      
      await db.query(
        'UPDATE users SET firebase_uid = $1 WHERE id = $2',
        [firebaseUser.uid, user.id]
      );
    } catch (error) {
      console.error(`Failed to migrate user ${user.email}:`, error);
    }
  }
};
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase documentation: https://firebase.google.com/docs
3. Check application logs for detailed error messages
4. Contact development team for assistance
