import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { AuthService } from './auth';

export class AppleAuthService {
  static async isAvailable(): Promise<boolean> {
    try {
      // Apple Sign-In is only natively available on iOS
      if (Platform.OS !== 'ios') {
        console.log('Apple Sign-In: Not available on Android (native)');
        return false;
      }
      return await AppleAuthentication.isAvailableAsync();
    } catch (error) {
      console.error('Error checking Apple Authentication availability:', error);
      return false;
    }
  }

  static async signIn(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Check if Apple Authentication is available (iOS 13+)
      if (!(await this.isAvailable())) {
        if (Platform.OS === 'android') {
          return {
            success: false,
            error: 'Apple Sign-In is not available on Android devices',
          };
        }
        return {
          success: false,
          error: 'Apple Sign-In is not available on this device',
        };
      }

      // Request Apple ID credential
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple Sign-In successful:', credential);

      // Create a token from the credential
      const identityToken = credential.identityToken;

      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Send token to your backend for verification
      const authResponse = await AuthService.loginWithApple(identityToken);

      return {
        success: true,
        user: authResponse.user,
      };
    } catch (error: any) {
      console.error('Apple Sign-In error:', error);

      if (error.code === 'ERR_CANCELED') {
        return {
          success: false,
          error: 'Sign-in was cancelled',
        };
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        return {
          success: false,
          error: 'Invalid response from Apple',
        };
      } else if (error.code === 'ERR_NOT_HANDLED') {
        return {
          success: false,
          error: 'Apple Sign-In not handled',
        };
      } else if (error.code === 'ERR_UNKNOWN') {
        return {
          success: false,
          error: 'Unknown error occurred',
        };
      } else {
        return {
          success: false,
          error: error.message || 'Apple Sign-In failed',
        };
      }
    }
  }

  static async signOut(): Promise<void> {
    try {
      // Apple doesn't provide a sign-out method
      // The user needs to sign out from their Apple ID settings
      console.log('Apple Sign-Out: User needs to sign out from Apple ID settings');
    } catch (error) {
      console.error('Apple Sign-Out error:', error);
      throw error;
    }
  }

  static async getCredentialState(userID: string): Promise<string> {
    try {
      const credentialState = await AppleAuthentication.getCredentialStateAsync(userID);

      switch (credentialState) {
        case AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED:
          return 'authorized';
        case AppleAuthentication.AppleAuthenticationCredentialState.REVOKED:
          return 'revoked';
        case AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND:
          return 'not_found';
        default:
          return 'unknown';
      }
    } catch (error) {
      console.error('Error getting Apple credential state:', error);
      return 'unknown';
    }
  }
}
