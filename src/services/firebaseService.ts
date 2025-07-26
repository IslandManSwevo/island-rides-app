import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp
} from 'firebase/firestore';

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  UploadMetadata
} from 'firebase/storage';

import { auth, db, storage } from '../config/firebase';

/**
 * Firebase Authentication Service
 */
export class FirebaseAuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Firebase sign in error:', error);
      throw error;
    }
  }

  /**
   * Create user with email and password
   */
  static async signUp(email: string, password: string): Promise<UserCredential> {
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Firebase sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Firebase sign out error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Firebase password reset error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(displayName?: string, photoURL?: string): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName || auth.currentUser.displayName,
        photoURL: photoURL || auth.currentUser.photoURL,
      });
    } catch (error) {
      console.error('Firebase update profile error:', error);
      throw error;
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

/**
 * Firebase Firestore Service
 */
export class FirebaseFirestoreService {
  /**
   * Create a document
   */
  static async createDocument(collectionName: string, data: Record<string, unknown>, docId?: string): Promise<string> {
    try {
      if (docId) {
        await setDoc(doc(db, collectionName, docId), {
          ...data,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return docId;
      } else {
        const docRef = await addDoc(collection(db, collectionName), {
          ...data,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Firestore create document error:', error);
      throw error;
    }
  }

  /**
   * Get a document by ID
   */
  static async getDocument(collectionName: string, docId: string): Promise<any> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Firestore get document error:', error);
      throw error;
    }
  }

  /**
   * Update a document
   */
  static async updateDocument(collectionName: string, docId: string, data: Record<string, unknown>): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Firestore update document error:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
      console.error('Firestore delete document error:', error);
      throw error;
    }
  }

  /**
   * Query documents
   */
  static async queryDocuments(
    collectionName: string, 
    field: string, 
    operator: any, 
    value: any
  ): Promise<any[]> {
    try {
      const q = query(collection(db, collectionName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Firestore query documents error:', error);
      throw error;
    }
  }

  /**
   * Get all documents from a collection
   */
  static async getAllDocuments(collectionName: string): Promise<any[]> {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Firestore get all documents error:', error);
      throw error;
    }
  }
}

/**
 * Firebase Storage Service
 */
export class FirebaseStorageService {
  /**
   * Upload a file to Firebase Storage
   */
  static async uploadFile(
    path: string, 
    file: Blob | Uint8Array | ArrayBuffer, 
    metadata?: UploadMetadata
  ): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file, metadata);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Firebase storage upload error:', error);
      throw error;
    }
  }

  /**
   * Get download URL for a file
   */
  static async getFileURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Firebase storage get URL error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  static async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Firebase storage delete error:', error);
      throw error;
    }
  }
}

/**
 * Example usage functions
 */
export class FirebaseExamples {
  /**
   * Example: Create a user profile
   */
  static async createUserProfile(userId: string, profileData: any) {
    return await FirebaseFirestoreService.createDocument('users', profileData, userId);
  }

  /**
   * Example: Upload user avatar
   */
  static async uploadUserAvatar(userId: string, imageFile: Blob) {
    const path = `avatars/${userId}/${Date.now()}.jpg`;
    return await FirebaseStorageService.uploadFile(path, imageFile, {
      contentType: 'image/jpeg',
    });
  }

  /**
   * Example: Get user vehicles
   */
  static async getUserVehicles(userId: string) {
    return await FirebaseFirestoreService.queryDocuments('vehicles', 'ownerId', '==', userId);
  }
}

export default {
  auth: FirebaseAuthService,
  firestore: FirebaseFirestoreService,
  storage: FirebaseStorageService,
  examples: FirebaseExamples,
};