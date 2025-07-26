/**
 * @deprecated This Firebase authentication system is deprecated and will be removed.
 * Use UnifiedAuthContext instead.
 *
 * This file is kept temporarily for migration purposes only.
 * All new code should use UnifiedAuthContext from './UnifiedAuthContext'
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential
} from 'firebase/auth';

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth();

interface FirebaseAuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

interface FirebaseAuthProviderProps {
  children: ReactNode;
}

export const FirebaseAuthProvider: React.FC<FirebaseAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Set an authentication state observer and get user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        console.log('Firebase Auth state changed - User signed in:', uid, user.email);
        setUser(user);
      } else {
        // User is signed out
        console.log('Firebase Auth state changed - User signed out');
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Sign up new users
  const signUp = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Signed up 
      const user = userCredential.user;
      console.log('User created via Firebase context:', user.uid, user.email);
      return userCredential;
    } catch (error: Error | unknown) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Firebase sign up error:', errorCode, errorMessage);
      throw error;
    }
  };

  // Sign in existing users
  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Signed in 
      const user = userCredential.user;
      console.log('User signed in via Firebase context:', user.uid, user.email);
      return userCredential;
    } catch (error: Error | unknown) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Firebase sign in error:', errorCode, errorMessage);
      throw error;
    }
  };

  // Sign out current user
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      console.log('User signed out via Firebase context');
    } catch (error: Error | unknown) {
      console.error('Firebase sign out error:', error);
      throw error;
    }
  };

  const value: FirebaseAuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    logout,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

// Custom hook to use the Firebase auth context
export const useFirebaseAuth = (): FirebaseAuthContextType => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};

// Export the auth instance for direct access if needed
export { auth };
export default FirebaseAuthContext;