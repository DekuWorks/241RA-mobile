import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_DATA_KEY = 'current_user_data';

export interface UserData {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export class UserDataService {
  static async setUserData(userData: UserData): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      console.log('User data stored successfully');
    } catch (error) {
      console.error('Failed to store user data:', error);
      throw error;
    }
  }

  static async getUserData(): Promise<UserData | null> {
    try {
      const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log('User data retrieved successfully:', userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  static async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_DATA_KEY);
      console.log('User data cleared successfully');
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }
}
