import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiUserPayload } from './apiUserMapper';

const USER_DATA_KEY = 'current_user_data';
const API_USER_KEY = 'cached_api_user';

export interface UserData {
  id: string;
  email: string;
  role: string;
  name?: string;
  allRoles?: string[];
  primaryUserRole?: string;
  isAdminUser?: boolean;
}

export class UserDataService {
  static async setUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to store user data:', error);
      throw error;
    }
  }

  static async getUserData(): Promise<UserData | null> {
    try {
      const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
      if (userDataString) {
        return JSON.parse(userDataString) as UserData;
      }
      return null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  static async setStoredApiUser(user: ApiUserPayload): Promise<void> {
    try {
      await AsyncStorage.setItem(API_USER_KEY, JSON.stringify(user));

      const fullName =
        user.fullName?.trim() || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      await this.setUserData({
        id: String(user.id),
        email: user.email,
        role: user.role || 'user',
        name: fullName || undefined,
        allRoles: user.allRoles,
        primaryUserRole: user.primaryUserRole,
        isAdminUser: user.isAdminUser,
      });
    } catch (error) {
      console.error('Failed to store API user:', error);
    }
  }

  static async getStoredApiUser(): Promise<ApiUserPayload | null> {
    try {
      const raw = await AsyncStorage.getItem(API_USER_KEY);
      if (raw) {
        return JSON.parse(raw) as ApiUserPayload;
      }

      const legacy = await this.getUserData();
      if (!legacy) {
        return null;
      }

      return {
        id: legacy.id,
        email: legacy.email,
        fullName: legacy.name,
        role: legacy.role || 'user',
        allRoles: legacy.allRoles,
        primaryUserRole: legacy.primaryUserRole,
        isAdminUser: legacy.isAdminUser,
      };
    } catch (error) {
      console.error('Failed to retrieve API user:', error);
      return null;
    }
  }

  static async clearUserData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(USER_DATA_KEY),
        AsyncStorage.removeItem(API_USER_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }
}
