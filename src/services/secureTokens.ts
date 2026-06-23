import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_STORE_TIMEOUT_MS = 5000;
const FALLBACK_KEY_SUFFIX = '_async_fallback';

/** Thrown when tokens cannot be stored securely (missing native module, timeout, etc.) */
export class SecureStorageError extends Error {
  readonly suggestRebuild = true;

  constructor(message: string) {
    super(message);
    this.name = 'SecureStorageError';
  }
}

export function isSecureStorageError(error: unknown): boolean {
  if (error instanceof SecureStorageError) {
    return true;
  }
  if (error instanceof Error) {
    return (
      error.message.includes('Failed to store') && error.message.includes('securely')
    );
  }
  return false;
}

async function withSecureStoreTimeout<T>(
  operation: Promise<T>,
  label: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () =>
        reject(
          new SecureStorageError(
            `Secure storage timed out (${label}). The secure storage native module may be missing from this build.`
          )
        ),
      SECURE_STORE_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

async function writeSecureValue(key: string, value: string): Promise<void> {
  try {
    await withSecureStoreTimeout(SecureStore.setItemAsync(key, value), `write ${key}`);
  } catch (error) {
    if (__DEV__) {
      console.warn(`SecureStore write failed for ${key}, using AsyncStorage fallback:`, error);
      try {
        await AsyncStorage.setItem(`${key}${FALLBACK_KEY_SUFFIX}`, value);
        return;
      } catch (fallbackError) {
        console.warn('AsyncStorage fallback write failed:', fallbackError);
      }
    }

    if (error instanceof SecureStorageError) {
      throw error;
    }

    throw new SecureStorageError(
      error instanceof Error ? error.message : 'Failed to store value securely'
    );
  }
}

async function readSecureValue(key: string): Promise<string | null> {
  try {
    const value = await withSecureStoreTimeout(
      SecureStore.getItemAsync(key),
      `read ${key}`
    );
    if (value !== null) {
      return value;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn(`SecureStore read failed for ${key}, trying AsyncStorage fallback:`, error);
    } else {
      console.error(`Failed to retrieve secure value for ${key}:`, error);
      return null;
    }
  }

  if (__DEV__) {
    try {
      return await AsyncStorage.getItem(`${key}${FALLBACK_KEY_SUFFIX}`);
    } catch (fallbackError) {
      console.warn('AsyncStorage fallback read failed:', fallbackError);
    }
  }

  return null;
}

async function deleteSecureValue(key: string): Promise<void> {
  try {
    await withSecureStoreTimeout(SecureStore.deleteItemAsync(key), `delete ${key}`);
  } catch (error) {
    console.error(`Failed to remove secure value for ${key}:`, error);
  }

  if (__DEV__) {
    try {
      await AsyncStorage.removeItem(`${key}${FALLBACK_KEY_SUFFIX}`);
    } catch (fallbackError) {
      console.warn('AsyncStorage fallback delete failed:', fallbackError);
    }
  }
}

/**
 * Secure token storage service wrapping Expo SecureStore
 * Provides type-safe methods for storing sensitive authentication tokens
 */
export class SecureTokenService {
  private static readonly ACCESS_TOKEN_KEY = '241runners_access_token';
  private static readonly REFRESH_TOKEN_KEY = '241runners_refresh_token';
  private static readonly USER_ID_KEY = '241runners_user_id';

  static async setAccessToken(token: string): Promise<void> {
    await writeSecureValue(this.ACCESS_TOKEN_KEY, token);
  }

  static async getAccessToken(): Promise<string | null> {
    return readSecureValue(this.ACCESS_TOKEN_KEY);
  }

  static async setRefreshToken(token: string): Promise<void> {
    await writeSecureValue(this.REFRESH_TOKEN_KEY, token);
  }

  static async getRefreshToken(): Promise<string | null> {
    return readSecureValue(this.REFRESH_TOKEN_KEY);
  }

  static async setUserId(userId: string): Promise<void> {
    await writeSecureValue(this.USER_ID_KEY, userId);
  }

  static async getUserId(): Promise<string | null> {
    return readSecureValue(this.USER_ID_KEY);
  }

  static async removeAccessToken(): Promise<void> {
    await deleteSecureValue(this.ACCESS_TOKEN_KEY);
  }

  static async removeRefreshToken(): Promise<void> {
    await deleteSecureValue(this.REFRESH_TOKEN_KEY);
  }

  static async removeUserId(): Promise<void> {
    await deleteSecureValue(this.USER_ID_KEY);
  }

  static async clearAll(): Promise<void> {
    await Promise.all([this.removeAccessToken(), this.removeRefreshToken(), this.removeUserId()]);
  }

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
