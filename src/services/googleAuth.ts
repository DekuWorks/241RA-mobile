import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { AuthService } from './auth';

export class GoogleAuthService {
  private static isConfigured = false;

  static async configure() {
    if (this.isConfigured) return;

    try {
      GoogleSignin.configure({
        // Get this from Google Cloud Console
        webClientId:
          process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
          '933970195369-67fjn7t28p7q8a3grar5a46jad4mvinq.apps.googleusercontent.com',
        // iOS client ID (if different from web client ID)
        iosClientId:
          process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
          '933970195369-5qqs8ju3elg8ujeklqsgsoqae60bo3gb.apps.googleusercontent.com',
        // Android client ID (if different from web client ID)
        androidClientId:
          process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
          '933970195369-dreapndpfibqgqmr54a662hjaliv4j7l.apps.googleusercontent.com',
        // Enable offline access
        offlineAccess: false,
        // Force consent screen
        forceCodeForRefreshToken: false,
        // Account selection
        accountName: '',
        // Hosted domain (optional)
        hostedDomain: '',
        // Login hint (optional)
        // loginHint: '',
        // Scopes - minimal required scopes
        scopes: ['profile', 'email'],
      });

      this.isConfigured = true;
      console.log('Google Sign-In configured successfully');
    } catch (error) {
      console.error('Error configuring Google Sign-In:', error);
      throw error;
    }
  }

  static async signIn(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Configure if not already done
      await this.configure();

      // Check if device supports Google Play Services (iOS doesn't need this)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }

      // Sign in
      const userInfo = await GoogleSignin.signIn();

      console.log('Google Sign-In successful:', userInfo);

      // Get the ID token
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Send token to your backend for verification
      const authResponse = await AuthService.loginWithGoogle(idToken);

      return {
        success: true,
        user: authResponse.user,
      };
    } catch (error: any) {
      console.error('Google Sign-In error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return {
          success: false,
          error: 'Sign-in was cancelled',
        };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return {
          success: false,
          error: 'Sign-in is already in progress',
        };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: 'Google Play Services not available',
        };
      } else {
        return {
          success: false,
          error: error.message || 'Google Sign-In failed',
        };
      }
    }
  }

  static async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      console.log('Google Sign-Out successful');
    } catch (error) {
      console.error('Google Sign-Out error:', error);
      throw error;
    }
  }

  static async isSignedIn(): Promise<boolean> {
    try {
      const user = await GoogleSignin.getCurrentUser();
      return user !== null;
    } catch (error) {
      console.error('Error checking Google Sign-In status:', error);
      return false;
    }
  }

  static async getCurrentUser(): Promise<any> {
    try {
      return await GoogleSignin.getCurrentUser();
    } catch (error) {
      console.error('Error getting current Google user:', error);
      return null;
    }
  }

  static async revokeAccess(): Promise<void> {
    try {
      await GoogleSignin.revokeAccess();
      console.log('Google access revoked successfully');
    } catch (error) {
      console.error('Error revoking Google access:', error);
      throw error;
    }
  }
}
