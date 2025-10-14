# EAS Secrets Setup Guide

## Required EAS Secrets

Set these secrets in your EAS project using the EAS CLI or web interface:

### Google Services
```bash
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "your-google-maps-api-key"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "933970195369-67fjn7t28p7q8a3grar5a46jad4mvinq.apps.googleusercontent.com"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "933970195369-5qqs8ju3elg8ujeklqsgsoqae60bo3gb.apps.googleusercontent.com"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "933970195369-dreapndpfibqgqmr54a662hjaliv4j7l.apps.googleusercontent.com"
```

### Firebase Configuration
```bash
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your-firebase-api-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your-project.firebaseapp.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your-project-id"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your-project.appspot.com"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "123456789"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:123456789:web:abcdef123456"
```

### App Store Configuration
```bash
eas secret:create --scope project --name APPLE_ID --value "your-apple-id@example.com"
eas secret:create --scope project --name ASC_APP_ID --value "your-app-store-connect-app-id"
eas secret:create --scope project --name APPLE_TEAM_ID --value "your-apple-team-id"
```

### GitHub Actions
```bash
eas secret:create --scope project --name EXPO_TOKEN --value "your-expo-access-token"
```

## Setup Commands

1. **Install EAS CLI:**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to EAS:**
   ```bash
   eas login
   ```

3. **Set all secrets:**
   ```bash
   # Run the commands above to set all secrets
   ```

4. **Verify secrets:**
   ```bash
   eas secret:list
   ```

## Security Notes

- Never commit actual API keys or secrets to the repository
- Use EAS secrets for all sensitive configuration
- Rotate keys regularly
- Use different keys for development, staging, and production
