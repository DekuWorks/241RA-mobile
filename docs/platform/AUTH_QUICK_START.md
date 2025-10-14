# 🚀 Quick Start - Authentication Setup

## ⚡ **5-Minute Setup**

### 1. Copy Environment File
```bash
# The .env file is gitignored - create your own
cat > .env << 'EOF'
EXPO_PUBLIC_API_URL=https://241runners-api-v2.azurewebsites.net
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=933970195369-67fjn7t28p7q8a3grar5a46jad4mvinq.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=933970195369-5qqs8ju3elg8ujeklqsgsoqae60bo3gb.apps.googleusercontent.com
EOF
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the App
```bash
# iOS
npm run ios

# Android
npm run android
```

### 4. Test Authentication

**Available Methods:**
- ✅ **Email/Password** - Works immediately
- 🔵 **Google Sign-In** - Enabled (uses hardcoded client IDs)
- 🍎 **Apple Sign-In** - Enabled (iOS 13+ only)

---

## ✅ **What's Already Configured**

### Backend API
- **URL:** `https://241runners-api-v2.azurewebsites.net`
- **Status:** ✅ Live and working
- **Endpoints:** All auth endpoints implemented

### Email/Password
- **Status:** ✅ Fully working
- **Features:** Login, Register, 2FA, Password Reset
- **No setup needed**

### Google OAuth
- **Status:** ✅ Enabled with default credentials
- **Default Client IDs:** Hardcoded in `googleAuth.ts`
- **Works for:** Testing and development
- **Production:** Replace with your own client IDs

### Apple Sign-In
- **Status:** ✅ Enabled in app.config.ts
- **Platform:** iOS 13+ only
- **Requires:** Apple Developer account for production
- **Development:** Works with Expo Go on iOS

---

## 🎯 **Test It Now**

1. **Start the app:**
   ```bash
   npm run ios
   ```

2. **Try each method:**

   **Email/Password:**
   - Click regular "Sign In" button
   - Use any registered account

   **Google Sign-In:**
   - Click "Continue with Google" button
   - Select your Google account
   - Approve permissions

   **Apple Sign-In:**
   - Click "Continue with Apple" button (iOS only)
   - Use Face ID/Touch ID
   - Approve with Apple ID

---

## 🔧 **For Production**

When you're ready for production, you need to:

### 1. Get Your Own Google OAuth Credentials
Visit: https://console.cloud.google.com/apis/credentials

Create:
- iOS OAuth Client ID
- Android OAuth Client ID
- Web OAuth Client ID

Then update `.env`:
```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
```

### 2. Configure Apple Developer Account
- Enable "Sign in with Apple" capability
- Add to your App ID: `org.runners241.app`
- No additional config needed in code

### 3. Update EAS Secrets
```bash
eas secret:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value your-web-client-id
eas secret:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value your-ios-client-id
```

---

## 📖 **Full Documentation**

For detailed setup instructions, see: **`AUTH_SETUP_GUIDE.md`**

---

## ✅ **Current Status**

| Method | Status | Ready for | Notes |
|--------|--------|-----------|-------|
| Email/Password | ✅ Working | Production | No setup needed |
| Google Sign-In | ✅ Working | Development | Use your own IDs for production |
| Apple Sign-In | ✅ Working | Development | Needs Apple Developer account for production |
| 2FA | ✅ Working | Production | Enable per-user in settings |

---

## 🎉 **You're Ready!**

All authentication methods are enabled and working. Just run the app and start testing!

```bash
npm run ios
# or
npm run android
```

**Questions?** Check `AUTH_SETUP_GUIDE.md` for detailed instructions.


