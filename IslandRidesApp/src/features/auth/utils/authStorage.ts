import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@auth/access_token',
  REFRESH_TOKEN: '@auth/refresh_token',
  USER_DATA: '@auth/user_data',
  LAST_LOGIN: '@auth/last_login',
  REMEMBER_EMAIL: '@auth/remember_email',
} as const;

export const authStorage = {
  /**
   * Store access token
   */
  setAccessToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  /**
   * Get access token
   */
  getAccessToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Store refresh token
   */
  setRefreshToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  /**
   * Get refresh token
   */
  getRefreshToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Store user data
   */
  setUserData: async (userData: object): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  },

  /**
   * Get user data
   */
  getUserData: async (): Promise<object | null> => {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Store last login timestamp
   */
  setLastLogin: async (timestamp: number): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_LOGIN, timestamp.toString());
  },

  /**
   * Get last login timestamp
   */
  getLastLogin: async (): Promise<number | null> => {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_LOGIN);
    return timestamp ? parseInt(timestamp, 10) : null;
  },

  /**
   * Store remembered email for login
   */
  setRememberedEmail: async (email: string): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, email);
  },

  /**
   * Get remembered email
   */
  getRememberedEmail: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
  },

  /**
   * Clear remembered email
   */
  clearRememberedEmail: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
  },

  /**
   * Clear all auth data
   */
  clearAll: async (): Promise<void> => {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  },

  /**
   * Clear tokens only (keep user preferences)
   */
  clearTokens: async (): Promise<void> => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  },

  /**
   * Check if tokens exist
   */
  hasTokens: async (): Promise<boolean> => {
    const accessToken = await authStorage.getAccessToken();
    const refreshToken = await authStorage.getRefreshToken();
    return !!(accessToken && refreshToken);
  },

  /**
   * Get all stored auth data
   */
  getAllAuthData: async (): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    userData: object | null;
    lastLogin: number | null;
    rememberedEmail: string | null;
  }> => {
    const [accessToken, refreshToken, userData, lastLogin, rememberedEmail] = await Promise.all([
      authStorage.getAccessToken(),
      authStorage.getRefreshToken(),
      authStorage.getUserData(),
      authStorage.getLastLogin(),
      authStorage.getRememberedEmail(),
    ]);

    return {
      accessToken,
      refreshToken,
      userData,
      lastLogin,
      rememberedEmail,
    };
  },

  /**
   * Set complete auth session
   */
  setAuthSession: async (data: {
    accessToken: string;
    refreshToken: string;
    userData: object;
    rememberEmail?: boolean;
    email?: string;
  }): Promise<void> => {
    const { accessToken, refreshToken, userData, rememberEmail, email } = data;

    await Promise.all([
      authStorage.setAccessToken(accessToken),
      authStorage.setRefreshToken(refreshToken),
      authStorage.setUserData(userData),
      authStorage.setLastLogin(Date.now()),
    ]);

    if (rememberEmail && email) {
      await authStorage.setRememberedEmail(email);
    } else {
      await authStorage.clearRememberedEmail();
    }
  },
};