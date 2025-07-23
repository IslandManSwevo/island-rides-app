import { useState, useEffect } from 'react';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  User,
  UserCredential
} from 'firebase/auth';

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth();

/**
 * Custom hook demonstrating Firebase Authentication JS SDK modular API
 * 
 * This hook implements the exact patterns from Firebase documentation:
 * 1. Initialize Firebase Authentication
 * 2. Sign up new users
 * 3. Sign in existing users  
 * 4. Set an authentication state observer
 */
export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set an authentication state observer and get user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        console.log('useFirebaseAuth: User is signed in', { uid, email: user.email });
        setUser(user);
      } else {
        // User is signed out
        console.log('useFirebaseAuth: User is signed out');
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Sign up new users
  const signUp = async (email: string, password: string): Promise<UserCredential> => {
    try {
      setError(null);
      setLoading(true);
      
      // Create a form that allows new users to register with your app using their email address and a password.
      // When a user completes the form, validate the email address and password provided by the user,
      // then pass them to the createUserWithEmailAndPassword method:
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Signed up 
      const user = userCredential.user;
      console.log('useFirebaseAuth: Sign up successful', { uid: user.uid, email: user.email });
      
      return userCredential;
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('useFirebaseAuth: Sign up error', { errorCode, errorMessage });
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in existing users
  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    try {
      setError(null);
      setLoading(true);
      
      // Create a form that allows existing users to sign in using their email address and password.
      // When a user completes the form, call the signInWithEmailAndPassword method:
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Signed in 
      const user = userCredential.user;
      console.log('useFirebaseAuth: Sign in successful', { uid: user.uid, email: user.email });
      
      return userCredential;
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('useFirebaseAuth: Sign in error', { errorCode, errorMessage });
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out current user
  const logout = async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      
      await signOut(auth);
      console.log('useFirebaseAuth: Sign out successful');
    } catch (error: any) {
      console.error('useFirebaseAuth: Sign out error', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  return {
    // Current authentication state
    user,
    loading,
    error,
    
    // Authentication methods
    signUp,
    signIn,
    logout,
    clearError,
    
    // Computed properties
    isAuthenticated: !!user,
    uid: user?.uid || null,
    email: user?.email || null,
    emailVerified: user?.emailVerified || false,
    
    // Auth instance for advanced usage
    auth,
  };
};

// Re-export Firebase auth functions for direct usage
export {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  type User,
  type UserCredential
};

export default useFirebaseAuth;