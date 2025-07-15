const admin = require('./firebase-config');

class FirebaseAuth {
  static async verifyToken(token) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || '',
        picture: decodedToken.picture || ''
      };
    } catch (error) {
      throw new Error('Invalid Firebase token');
    }
  }

  static async getUser(uid) {
    try {
      const userRecord = await admin.auth().getUser(uid);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || '',
        photoURL: userRecord.photoURL || '',
        emailVerified: userRecord.emailVerified
      };
    } catch (error) {
      throw new Error('User not found');
    }
  }

  static async createUser(email, password, displayName) {
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName
      });
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  static async updateUser(uid, updates) {
    try {
      const userRecord = await admin.auth().updateUser(uid, updates);
      return userRecord;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  static async deleteUser(uid) {
    try {
      await admin.auth().deleteUser(uid);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}

module.exports = FirebaseAuth;
