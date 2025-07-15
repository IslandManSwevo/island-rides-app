import { auth, signInWithGoogle, signOutUser } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import apiService from './apiService';

class FirebaseAuthService {
  constructor() {
    this.currentUser = null;
    this.authToken = null;
  }

  // Initialize auth state listener
  initAuthListener(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
        
        // Get Firebase ID token
        this.authToken = await user.getIdToken();
        
        // Sync with backend
        await this.syncUserWithBackend();
        
        callback(this.currentUser);
      } else {
        this.currentUser = null;
        this.authToken = null;
        callback(null);
      }
    });
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const { user, token } = await signInWithGoogle();
      this.authToken = token;
      
      // Verify with backend
      const response = await apiService.post('/api/auth/firebase', {
        token,
        provider: 'google'
      });
      
      return {
        success: true,
        user: response.user,
        token: response.token
      };
    } catch (error) {
      console.error('Google sign-in failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOutUser();
      this.currentUser = null;
      this.authToken = null;
      return { success: true };
    } catch (error) {
      console.error('Sign out failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get current auth token
  getAuthToken() {
    return this.authToken;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser && !!this.authToken;
  }

  // Sync user with backend
  async syncUserWithBackend() {
    if (!this.authToken) return;

    try {
      const response = await apiService.post('/api/auth/firebase', {
        token: this.authToken,
        provider: 'firebase'
      });
      
      return response.user;
    } catch (error) {
      console.error('Failed to sync with backend:', error);
      throw error;
    }
  }
}

export default new FirebaseAuthService();
