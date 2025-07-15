const admin = require('../firebase-config');

class FirebaseAuthService {
  constructor() {
    this.admin = admin;
  }

  /**
   * Verify Firebase ID token
   * @param {string} token - Firebase ID token
   * @returns {Promise<Object>} - Decoded token payload
   */
  async verifyToken(token) {
    if (!admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || '',
        picture: decodedToken.picture || null,
        emailVerified: decodedToken.email_verified || false,
        phoneNumber: decodedToken.phone_number || null,
        provider: decodedToken.firebase.sign_in_provider
      };
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      throw new Error('Invalid Firebase token');
    }
  }

  /**
   * Get user by UID
   * @param {string} uid - Firebase user UID
   * @returns {Promise<Object>} - User record
   */
  async getUser(uid) {
    if (!admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      const userRecord = await admin.auth().getUser(uid);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || '',
        photoURL: userRecord.photoURL || null,
        emailVerified: userRecord.emailVerified,
        phoneNumber: userRecord.phoneNumber || null,
        providerData: userRecord.providerData
      };
    } catch (error) {
      console.error('Firebase get user failed:', error);
      throw new Error('User not found');
    }
  }

  /**
   * Create custom token for user
   * @param {string} uid - Firebase user UID
   * @returns {Promise<string>} - Custom token
   */
  async createCustomToken(uid) {
    if (!admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      const customToken = await admin.auth().createCustomToken(uid);
      return customToken;
    } catch (error) {
      console.error('Firebase create custom token failed:', error);
      throw new Error('Failed to create custom token');
    }
  }

  /**
   * Update user profile
   * @param {string} uid - Firebase user UID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} - Updated user record
   */
  async updateUser(uid, updates) {
    if (!admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      const userRecord = await admin.auth().updateUser(uid, {
        displayName: updates.displayName,
        email: updates.email,
        phoneNumber: updates.phoneNumber,
        photoURL: updates.photoURL,
        emailVerified: updates.emailVerified
      });
      
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        phoneNumber: userRecord.phoneNumber
      };
    } catch (error) {
      console.error('Firebase update user failed:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete user
   * @param {string} uid - Firebase user UID
   * @returns {Promise<void>}
   */
  async deleteUser(uid) {
    if (!admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      await admin.auth().deleteUser(uid);
    } catch (error) {
      console.error('Firebase delete user failed:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * List all users
   * @param {number} maxResults - Maximum number of users to return
   * @returns {Promise<Array>} - List of user records
   */
  async listUsers(maxResults = 1000) {
    if (!admin.apps.length) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      const listUsersResult = await admin.auth().listUsers(maxResults);
      return listUsersResult.users.map(userRecord => ({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || '',
        photoURL: userRecord.photoURL || null,
        emailVerified: userRecord.emailVerified,
        phoneNumber: userRecord.phoneNumber || null,
        providerData: userRecord.providerData,
        disabled: userRecord.disabled,
        metadata: userRecord.metadata
      }));
    } catch (error) {
      console.error('Firebase list users failed:', error);
      throw new Error('Failed to list users');
    }
  }

  /**
   * Check if Firebase is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!admin.apps.length;
  }
}

module.exports = new FirebaseAuthService();
