# 🔐 241 Runners Mobile - Authentication Setup Guide

Complete guide to setting up all authentication methods in the mobile app.

---

## 📱 **Available Authentication Methods**

1. ✅ **Email/Password** - Built-in authentication
2. 🍎 **Apple Sign-In** - iOS 13+ (requires Apple Developer account)
3. 🔵 **Google Sign-In** - iOS & Android (requires Google Cloud Console setup)
4. 🔐 **2FA (Two-Factor Authentication)** - TOTP with backup codes

---

## 🚀 **Quick Setup Checklist**

- [ ] Step 1: Enable Apple Authentication
- [ ] Step 2: Add Google Sign-In Button
- [ ] Step 3: Configure Google OAuth
- [ ] Step 4: Create .env file
- [ ] Step 5: Test all auth methods
- [ ] Step 6: Configure EAS secrets for builds

---

## 📝 **Step 1: Enable Apple Authentication**

### Current Status
Apple Authentication is **implemented but disabled** in `app.config.ts` (line 45).

### Enable It

**File:** `app.config.ts`

Find line 45 and uncomment:
```typescript
// Change from:
// 'expo-apple-authentication', // Temporarily disabled for production build

// To:
'expo-apple-authentication',
```

### Requirements
- **Platform:** iOS 13+ only
- **Account:** Apple Developer Program membership ($99/year)
- **Bundle ID:** `org.runners241.app` (already configured)
- **Capabilities:** Sign in with Apple enabled in Xcode/Apple Developer Portal

### Apple Developer Portal Setup
1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Select your App ID (`org.runners241.app`)
4. Enable **Sign in with Apple** capability
5. Save changes

---

## 📝 **Step 2: Add Google Sign-In Button to Login Screen**

The Google authentication service is implemented but the button isn't shown on the UI.

### Add Google Button

**File:** `src/app/login.tsx`

Add this import at the top (around line 16):
```typescript
import { GoogleAuthService } from '../services/googleAuth';
```

Add the Google handler function (around line 143):
```typescript
const handleGoogleLogin = async () => {
  setIsLoading(true);
  try {
    const result = await GoogleAuthService.signIn();

    if (result.success) {
      // Login successful, check user role and redirect accordingly
      if (result.user) {
        if (
          result.user.role === 'admin' || 
          result.user.role === 'moderator' || 
          result.user.role === 'super_admin'
        ) {
          router.replace('/portal');
        } else {
          router.replace('/profile');
        }
      } else {
        router.replace('/profile');
      }
    } else {
      Alert.alert('Google Login Failed', result.error || 'Failed to sign in with Google');
    }
  } catch (error: any) {
    Alert.alert('Google Login Failed', error.message || 'Failed to sign in with Google');
  } finally {
    setIsLoading(false);
  }
};
```

Add Google button in the JSX (after the Apple button section, around line 235):
```typescript
{/* Google Login Button */}
<View style={styles.googleSection}>
  <TouchableOpacity
    style={[styles.googleButton, isLoading && styles.buttonDisabled]}
    onPress={handleGoogleLogin}
    disabled={isLoading}
  >
    <Text style={styles.googleIcon}>🔵</Text>
    <Text style={styles.googleButtonText}>Continue with Google</Text>
  </TouchableOpacity>
</View>
```

Add the styles (in the StyleSheet around line 388):
```typescript
googleSection: {
  marginTop: spacing.md,
  width: '100%',
},
googleButton: {
  backgroundColor: '#FFFFFF',
  borderRadius: radii.md,
  padding: spacing.md,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: colors.gray[300],
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
googleIcon: {
  fontSize: typography.sizes.lg,
  marginRight: spacing.sm,
},
googleButtonText: {
  fontSize: typography.sizes.base,
  fontWeight: typography.weights.medium,
  color: colors.gray[900],
},
```

---

## 📝 **Step 3: Configure Google OAuth**

### Google Cloud Console Setup

1. **Go to:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

2. **Create or Select a Project**
   - Project Name: `241 Runners Mobile`

3. **Enable Google Sign-In API**
   - Go to **APIs & Services > Library**
   - Search for "Google Sign-In API"
   - Click **Enable**

4. **Create OAuth 2.0 Credentials**

   **For Android:**
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth 2.0 Client ID**
   - Application type: **Android**
   - Package name: `org.runners241.app`
   - SHA-1 certificate fingerprint: Get from your keystore
   ```bash
   # Development:
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # Production:
   keytool -list -v -keystore path/to/your/release.keystore -alias your-key-alias
   ```

   **For iOS:**
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth 2.0 Client ID**
   - Application type: **iOS**
   - Bundle ID: `org.runners241.app`
   - App Store ID: (enter if published)

   **For Web (Required for both platforms):**
   - Application type: **Web application**
   - Name: `241 Runners Web Client`
   - No redirect URIs needed for mobile

5. **Copy Your Client IDs**
   - Web Client ID: `YOUR-WEB-CLIENT-ID.apps.googleusercontent.com`
   - iOS Client ID: `YOUR-IOS-CLIENT-ID.apps.googleusercontent.com`
   - Android Client ID: `YOUR-ANDROID-CLIENT-ID.apps.googleusercontent.com`

---

## 📝 **Step 4: Create .env File**

1. **Copy the example file:**
```bash
cp .env.example .env
```

2. **Edit `.env` with your credentials:**
```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://241runners-api-v2.azurewebsites.net

# Google OAuth - Replace with YOUR credentials
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=933970195369-67fjn7t28p7q8a3grar5a46jad4mvinq.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=933970195369-5qqs8ju3elg8ujeklqsgsoqae60bo3gb.apps.googleusercontent.com
# EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

3. **IMPORTANT:** Never commit `.env` to git
```bash
# .env is already in .gitignore
```

---

## 📝 **Step 5: Test All Authentication Methods**

### Local Testing

1. **Install dependencies:**
```bash
npm install
```

2. **Start the app:**
```bash
npm run ios
# or
npm run android
```

3. **Test each method:**

   **Email/Password:**
   - Enter email and password
   - Click "Sign In"
   - Should redirect to profile or admin portal

   **Apple Sign-In (iOS only):**
   - Click "Continue with Apple"
   - Use Face ID/Touch ID
   - Approve with Apple ID
   - Should redirect based on role

   **Google Sign-In:**
   - Click "Continue with Google"
   - Select Google account
   - Approve permissions
   - Should redirect based on role

   **2FA:**
   - Login with account that has 2FA enabled
   - Enter 6-digit code from authenticator app
   - Should complete login

### Test Accounts

Create test accounts with different roles:
```
Regular User:
- Email: testuser@example.com
- Password: TestPassword123!

Admin:
- Email: admin@example.com
- Password: AdminPassword123!

With 2FA:
- Email: 2fauser@example.com  
- Password: SecurePass123!
- 2FA: Setup in app first
```

---

## 📝 **Step 6: Configure EAS Secrets for Builds**

For production builds, set environment variables as EAS secrets:

```bash
# Set secrets
eas secret:create --name EXPO_PUBLIC_API_URL --value https://241runners-api-v2.azurewebsites.net --type string
eas secret:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value your-web-client-id --type string
eas secret:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value your-ios-client-id --type string
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value your-sentry-dsn --type string

# List secrets
eas secret:list

# Update secret
eas secret:delete --name SECRET_NAME
eas secret:create --name SECRET_NAME --value new-value --type string
```

---

## 🔧 **OAuth Redirect URIs**

### Mobile App Redirect
```
org.runners241.app:/oauthredirect
```

This is already configured in `app.config.ts`:
```typescript
extra: {
  oauthRedirectUri: 'org.runners241.app:/oauthredirect',
}
```

### Configure in OAuth Providers

**Google Cloud Console:**
- Go to your OAuth client
- Add redirect URI: `org.runners241.app:/oauthredirect`

**Apple Developer Portal:**
- No redirect URI needed for native apps
- Sign in with Apple uses native integration

---

## 🐛 **Troubleshooting**

### Apple Sign-In Issues

**"Apple Sign-In not available"**
- Check iOS version (requires iOS 13+)
- Enable in `app.config.ts`
- Ensure Apple Developer account is set up

**"Sign-In failed"**
- Check bundle ID matches: `org.runners241.app`
- Verify capability is enabled in Apple Developer Portal
- Rebuild the app after enabling

### Google Sign-In Issues

**"Google Play Services not available"**
- Android only - install Google Play Services
- Use a real device or Google Play enabled emulator

**"Sign-In cancelled"**
- User cancelled the flow
- This is normal behavior

**"Invalid Client ID"**
- Check client IDs in `.env`
- Ensure package name matches: `org.runners241.app`
- Verify SHA-1 certificate fingerprint

**"DEVELOPER_ERROR"**
- Check `google-services.json` (Android)
- Verify OAuth consent screen is configured
- Ensure API is enabled in Google Cloud Console

### Network Errors

**"Network request failed"**
- Check API URL: `https://241runners-api-v2.azurewebsites.net`
- Verify internet connection
- Check CORS settings on backend

---

## 📊 **Authentication Flow Diagram**

```
User Opens App
      ↓
Login Screen
      ↓
   ┌──┴──┐
   ↓     ↓     ↓
Email  Apple  Google
      ↓     ↓     ↓
   Auth Service
      ↓
  Backend API
      ↓
JWT Token Saved
      ↓
Role Check
   ┌──┴──┐
   ↓     ↓
Admin  User
Portal Profile
```

---

## 🔐 **Security Best Practices**

1. ✅ **Never commit `.env` to git**
2. ✅ **Use EAS secrets for production**
3. ✅ **Rotate OAuth credentials regularly**
4. ✅ **Enable 2FA for admin accounts**
5. ✅ **Use HTTPS for all API calls**
6. ✅ **Store tokens in SecureStore (encrypted)**
7. ✅ **Implement token refresh logic**

---

## 📱 **Backend API Requirements**

Your backend must support these endpoints:

```typescript
// Email/Password
POST /api/v1/auth/login
POST /api/v1/auth/register

// OAuth
POST /api/v1/auth/oauth/register
  Body: { provider: 'google', token: 'id_token' }
  Body: { provider: 'apple', token: 'identity_token' }

// 2FA
POST /api/v1/auth/2fa/enable
POST /api/v1/auth/2fa/disable
POST /api/v1/auth/2fa/verify

// Token Refresh
POST /api/v1/auth/refresh
```

All endpoints should return:
```typescript
{
  accessToken: string,
  refreshToken: string,
  user: {
    id: string,
    email: string,
    role: string,
    twoFactorEnabled: boolean
  }
}
```

---

## ✅ **Verification Checklist**

After setup, verify:

- [ ] Email/Password login works
- [ ] Can create new account
- [ ] Forgot password flow works
- [ ] Apple Sign-In works on iOS
- [ ] Google Sign-In works on iOS
- [ ] Google Sign-In works on Android
- [ ] 2FA can be enabled
- [ ] 2FA login works
- [ ] Admin users see admin portal
- [ ] Regular users see profile
- [ ] Tokens are securely stored
- [ ] Token refresh works
- [ ] Logout clears all data

---

## 📞 **Support**

**Issues with:**
- **Apple Sign-In:** Check [Apple Developer Forums](https://developer.apple.com/forums/)
- **Google Sign-In:** Check [Google Sign-In Docs](https://developers.google.com/identity/sign-in/ios/start-integrating)
- **General Auth:** Check backend logs and mobile app console

**Files to Check:**
- `src/app/login.tsx` - Login UI
- `src/services/auth.ts` - Auth service
- `src/services/appleAuth.ts` - Apple auth
- `src/services/googleAuth.ts` - Google auth
- `app.config.ts` - App configuration
- `.env` - Environment variables

---

## 🎉 **You're All Set!**

Once configured, users can sign in with:
- ✅ Email and password
- 🍎 Apple ID (iOS)
- 🔵 Google Account
- 🔐 Two-factor authentication

All methods authenticate against the same backend and share user accounts!

**Last Updated:** October 9, 2025  
**Version:** 1.0.0


