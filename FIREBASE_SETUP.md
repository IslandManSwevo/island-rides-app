# Firebase Setup - Modular API

This document explains the Firebase setup using the modern modular API for the Island Rides App.

## ✅ Current Status

- **Firebase SDK**: ✅ Installed (v11.10.0)
- **Configuration**: ✅ Modular API setup complete
- **Services**: ✅ Auth, Firestore, Storage configured
- **Environment**: ✅ Environment variables configured

## 📁 Files Created/Updated

### Core Configuration
- `src/config/firebase.ts` - Firebase initialization with modular API
- `src/services/firebaseService.ts` - Service classes for Auth, Firestore, Storage
- `src/components/FirebaseExample.tsx` - Example usage component

### Firebase Authentication (JS SDK Modular API)
- `src/context/FirebaseAuthContext.tsx` - React Context for Firebase Auth
- `src/components/auth/FirebaseAuth.tsx` - Complete auth component
- `src/screens/FirebaseAuthScreen.tsx` - Full-screen auth demo
- `src/hooks/useFirebaseAuth.ts` - Custom hook for Firebase Auth

### Environment Variables
- `.env` - Updated with Firebase configuration
- `.env.example` - Template with placeholder values

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Firebase Configuration (using modular API)
EXPO_PUBLIC_FIREBASE_API_KEY=demo-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=island-rides-demo.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=island-rides-demo
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=island-rides-demo.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456789
```

### Firebase Configuration Object
```typescript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
```

## 🚀 Usage Examples

### Import Firebase Services
```typescript
import { auth, db, storage } from '../config/firebase';
import FirebaseService from '../services/firebaseService';
```

### Authentication

#### Using the Direct Firebase SDK (Recommended)
```typescript
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth();

// Sign up new users
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
// Signed up 
const user = userCredential.user;

// Sign in existing users
const userCredential = await signInWithEmailAndPassword(auth, email, password);
// Signed in 
const user = userCredential.user;

// Set an authentication state observer and get user data
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/auth.user
    const uid = user.uid;
    // ...
  } else {
    // User is signed out
    // ...
  }
});

// Sign out
await signOut(auth);
```

#### Using the Custom Hook
```typescript
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

const MyComponent = () => {
  const { user, signIn, signUp, logout, loading, error } = useFirebaseAuth();
  
  const handleSignUp = async () => {
    try {
      await signUp(email, password);
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  };
  
  return (
    <div>
      {user ? (
        <p>Welcome, {user.email}!</p>
      ) : (
        <button onClick={handleSignUp}>Sign Up</button>
      )}
    </div>
  );
};
```

#### Using the Context Provider
```typescript
import { FirebaseAuthProvider, useFirebaseAuth } from '../context/FirebaseAuthContext';

// Wrap your app
<FirebaseAuthProvider>
  <App />
</FirebaseAuthProvider>

// Use in components
const { user, signIn, logout } = useFirebaseAuth();
```

### Firestore Database
```typescript
// Create document
const docId = await FirebaseService.firestore.createDocument('users', userData);

// Get document
const user = await FirebaseService.firestore.getDocument('users', userId);

// Update document
await FirebaseService.firestore.updateDocument('users', userId, { name: 'New Name' });

// Query documents
const vehicles = await FirebaseService.firestore.queryDocuments('vehicles', 'ownerId', '==', userId);
```

### Storage
```typescript
// Upload file
const downloadURL = await FirebaseService.storage.uploadFile('images/avatar.jpg', fileBlob);

// Get file URL
const url = await FirebaseService.storage.getFileURL('images/avatar.jpg');

// Delete file
await FirebaseService.storage.deleteFile('images/avatar.jpg');
```

## 🛠 Advanced Usage

### Tree Shaking Benefits
The modular API automatically removes unused Firebase features from your bundle:

```typescript
// Only import what you need
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
```

### Error Handling
```typescript
try {
  const user = await FirebaseService.auth.signIn(email, password);
  console.log('Success:', user);
} catch (error: any) {
  console.error('Firebase error:', error.code, error.message);
  
  // Handle specific error codes
  switch (error.code) {
    case 'auth/user-not-found':
      Alert.alert('Error', 'User not found');
      break;
    case 'auth/wrong-password':
      Alert.alert('Error', 'Incorrect password');
      break;
    default:
      Alert.alert('Error', error.message);
  }
}
```

### Real-time Listeners
```typescript
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

// Listen to collection changes
const unsubscribe = onSnapshot(collection(db, 'vehicles'), (snapshot) => {
  const vehicles = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  console.log('Vehicles updated:', vehicles);
});

// Don't forget to unsubscribe
unsubscribe();
```

## 🔄 Migration from React Native Firebase

If you were previously using `@react-native-firebase/app`, here are the key differences:

### Old (React Native Firebase)
```typescript
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Usage
await auth().signInWithEmailAndPassword(email, password);
await firestore().collection('users').add(data);
```

### New (Firebase JS SDK Modular)
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Usage
await signInWithEmailAndPassword(auth, email, password);
await addDoc(collection(db, 'users'), data);
```

## 🧪 Testing the Setup

1. **Run the Firebase Example Component**:
   ```typescript
   import FirebaseExample from './src/components/FirebaseExample';
   
   // Add to your main App.tsx or a test screen
   <FirebaseExample />
   ```

2. **Check Console Output**:
   - Look for "Firebase initialized successfully"
   - Check for any configuration warnings

3. **Test Authentication**:
   - Try signing up with a test email
   - Verify Firestore document creation
   - Test sign in/out functionality

## 📝 Production Setup

For production, replace the demo values with real Firebase project credentials:

1. **Create a Firebase Project**: https://console.firebase.google.com/
2. **Enable Authentication**: Email/Password provider
3. **Create Firestore Database**: Start in test mode
4. **Enable Storage**: Set up security rules
5. **Get Configuration**: Project Settings > General > Your apps
6. **Update .env file**: Replace demo values with real credentials

## 🔒 Security Notes

- Environment variables starting with `EXPO_PUBLIC_` are accessible in client code
- Firebase API key is safe to expose (it's not a secret)
- Use Firebase Security Rules to protect data access
- Never store sensitive secrets in environment variables that start with `EXPO_PUBLIC_`

## 📚 Additional Resources

- [Firebase Modular API Documentation](https://firebase.google.com/docs/web/modular-upgrade)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/start)
- [Firestore Documentation](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage/web/start)

## 🐛 Troubleshooting

### Common Issues

1. **"Firebase not initialized"**
   - Check that environment variables are set correctly
   - Verify .env file is in the correct location

2. **Authentication errors**
   - Enable Email/Password auth in Firebase Console
   - Check Firebase Security Rules

3. **Firestore permission errors**
   - Update Firestore Security Rules
   - Ensure user is authenticated for protected operations

4. **Bundle size concerns**
   - The modular API automatically tree-shakes unused code
   - Only import specific functions you need