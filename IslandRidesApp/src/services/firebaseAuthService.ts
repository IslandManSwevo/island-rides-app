import { auth, signInWithGoogle, signOutUser } from '../config/firebase';
import { onAuthStateChanged, User, Unsubscribe } from 'firebase/auth';
import { apiService } from './apiService';

// User interface for Firebase user data
interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Auth response interface
interface AuthResponse {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
}

// Backend sync response interface
interface BackendAuthResponse {
  user: any;
  token: string;
}

class FirebaseAuthService {
  private currentUser: FirebaseUser | null;
  private authToken: string | null;

  constructor() {
    this.currentUser = null;
    this.authToken = null;
  }

  // Initialize auth state listener
  initAuthListener(callback: (user: FirebaseUser | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
        
        // Get Firebase ID token
        try {
          this.authToken = await user.getIdToken();
        } catch (error) {
          console.error('Failed to get ID token:', error);
          this.authToken = null;
        }
        
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
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const { user, token } = await signInWithGoogle();
      this.authToken = token;
      
      // Verify with backend
      const response: BackendAuthResponse = await apiService.post('/api/auth/firebase', {
        token,
        provider: 'google'
      });
      
      return {
        success: true,
        user: response.user,
        token: response.token
      };
    } catch (error: Error | unknown) {
      console.error('Google sign-in failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sign out
  async signOut(): Promise<AuthResponse> {
    try {
      await signOutUser();
      this.currentUser = null;
      this.authToken = null;
      return { success: true };
    } catch (error: Error | unknown) {
      console.error('Sign out failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get current auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Get current user
  getCurrentUser(): FirebaseUser | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.currentUser && !!this.authToken;
  }

  // Sync user with backend
  async syncUserWithBackend(): Promise<any> {
    if (!this.authToken) return;

    try {
      const response: BackendAuthResponse = await apiService.post('/api/auth/firebase', {
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
