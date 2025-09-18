import * as SecureStore from 'expo-secure-store';

export class SecureStoreService {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_ID_KEY = 'user_id';

  static async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(this.ACCESS_TOKEN_KEY, token);
  }

  static async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.ACCESS_TOKEN_KEY);
  }

  static async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, token);
  }

  static async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
  }

  static async setUserId(userId: string): Promise<void> {
    await SecureStore.setItemAsync(this.USER_ID_KEY, userId);
  }

  static async getUserId(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.USER_ID_KEY);
  }

  static async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(this.ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(this.USER_ID_KEY),
    ]);
  }

  static async hasValidTokens(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    const refreshToken = await this.getRefreshToken();
    return !!(accessToken && refreshToken);
  }
}
