import * as SecureStore from 'expo-secure-store';

/**
 * Secure token storage service wrapping Expo SecureStore
 * Provides type-safe methods for storing sensitive authentication tokens
 */
export class SecureTokenService {
  private static readonly ACCESS_TOKEN_KEY = '241runners_access_token';
  private static readonly REFRESH_TOKEN_KEY = '241runners_refresh_token';
  private static readonly USER_ID_KEY = '241runners_user_id';

  /**
   * Store access token securely
   */
  static async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store access token:', error);
      throw new Error('Failed to store access token securely');
    }
  }

  /**
   * Retrieve access token
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  }

  /**
   * Store refresh token securely
   */
  static async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store refresh token:', error);
      throw new Error('Failed to store refresh token securely');
    }
  }

  /**
   * Retrieve refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Store user ID securely
   */
  static async setUserId(userId: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.USER_ID_KEY, userId);
    } catch (error) {
      console.error('Failed to store user ID:', error);
      throw new Error('Failed to store user ID securely');
    }
  }

  /**
   * Retrieve user ID
   */
  static async getUserId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.USER_ID_KEY);
    } catch (error) {
      console.error('Failed to retrieve user ID:', error);
      return null;
    }
  }

  /**
   * Remove access token
   */
  static async removeAccessToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove access token:', error);
    }
  }

  /**
   * Remove refresh token
   */
  static async removeRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove refresh token:', error);
    }
  }

  /**
   * Remove user ID
   */
  static async removeUserId(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.USER_ID_KEY);
    } catch (error) {
      console.error('Failed to remove user ID:', error);
    }
  }

  /**
   * Clear all stored tokens and user data
   */
  static async clearAll(): Promise<void> {
    try {
      await Promise.all([this.removeAccessToken(), this.removeRefreshToken(), this.removeUserId()]);
    } catch (error) {
      console.error('Failed to clear all tokens:', error);
    }
  }

  /**
   * Check if user is authenticated (has access token)
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      return token !== null && token.length > 0;
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      return false;
    }
  }
}
