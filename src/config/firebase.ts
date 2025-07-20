// Firebase configuration for KeyLo App
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signOut, User, UserCredential } from 'firebase/auth';

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Auth result interface
interface AuthResult {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
  token: string;
}

// Firebase configuration from environment variables
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || ''
};

// Validate Firebase configuration
const validateFirebaseConfig = (config: FirebaseConfig): void => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof FirebaseConfig]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}. Please check your environment variables.`);
  }
};

// Check if we're in development and allow mock config
const isDevelopment = process.env.NODE_ENV === 'development';

// Validate configuration before initializing (skip in development with demo values)
if (!isDevelopment || firebaseConfig.apiKey !== 'demo-api-key') {
  validateFirebaseConfig(firebaseConfig);
}

// Initialize Firebase (use mock in development if demo values)
let app: FirebaseApp;
if (isDevelopment && firebaseConfig.apiKey === 'demo-api-key') {
  console.warn('Using demo Firebase configuration - Authentication will not work');
  // Create minimal mock config for development
  app = initializeApp({
    apiKey: 'demo-api-key',
    authDomain: 'island-rides-demo.firebaseapp.com',
    projectId: 'island-rides-demo',
    storageBucket: 'island-rides-demo.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef123456789'
  });
} else {
  app = initializeApp(firebaseConfig);
}
export const auth: Auth = getAuth(app);
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();

// Firebase auth functions
export const signInWithGoogle = async (): Promise<AuthResult> => {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const user: User = result.user;
    const token: string = await user.getIdToken();
    
    return {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      },
      token
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export const signOutUser = async (): Promise<boolean> => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export default app;
