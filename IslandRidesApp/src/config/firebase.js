// Firebase configuration for Island Rides App
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB0Z5l5L5L5L5L5L5L5L5L5L5L5L5L5L5L5L5",
  authDomain: "keylo-app.firebaseapp.com",
  projectId: "keylo-app",
  storageBucket: "keylo-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:123456789abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firebase auth functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const token = await user.getIdToken();
    
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

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export default app;
