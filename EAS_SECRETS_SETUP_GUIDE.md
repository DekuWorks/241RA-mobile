# EAS Secrets Setup Guide

## Required EAS Secrets

You need to set up the following secrets in your EAS project. Run these commands in your terminal:

### 1. Google Maps API Key
```bash
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value "your_google_maps_api_key_here"
```

### 2. Sentry DSN
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "your_sentry_dsn_here"
```

### 3. Google OAuth Client IDs
```bash
# Web Client ID
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "your_web_client_id_here"

# iOS Client ID  
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "your_ios_client_id_here"

# Android Client ID
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "your_android_client_id_here"
```

### 4. Firebase Configuration
```bash
# Firebase API Key
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your_firebase_api_key_here"

# Firebase Auth Domain
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "your_project_id.firebaseapp.com"

# Firebase Project ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your_firebase_project_id_here"

# Firebase Storage Bucket
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "your_project_id.appspot.com"

# Firebase Messaging Sender ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "your_sender_id_here"

# Firebase App ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "your_firebase_app_id_here"
```

## How to Get These Values

### Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Maps SDK for Android, Maps SDK for iOS, Places API, Geocoding API
4. Create credentials → API Key
5. Restrict the key to your bundle IDs

### Sentry DSN
1. Go to [Sentry.io](https://sentry.io/)
2. Create a project for "241Runners Mobile"
3. Go to Project Settings → Client Keys (DSN)
4. Copy the DSN value

### Google OAuth Client IDs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to APIs & Services → Credentials
3. Create OAuth 2.0 Client IDs for:
   - Web application
   - iOS application (bundle ID: org.runners241.app)
   - Android application (package: org.runners241.app)

### Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Add iOS app with bundle ID: `org.runners241.app`
4. Add Android app with package: `org.runners241.app`
5. Download configuration files and extract the values

## Verify Secrets
After setting up all secrets, verify they're configured:
```bash
eas secret:list --scope project
```

## Next Steps
1. Set up Firebase Console (Step 2)
2. Implement backend endpoints (Step 3)
3. Add Firebase Admin SDK to backend (Step 4)
4. Test with preview builds (Step 5)
